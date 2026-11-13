import { useAuth } from '../hooks/useAuth'
import { maybeShowInterstitial, showRewardedAd, hideBanner, adsConsentGranted } from '../lib/admob'
import { adsAreRemoved } from '../lib/iap'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { GameOverModal } from '../components/GameOverModal'
import { useScores } from '../hooks/useScores'
import {
  COLS, ROWS, colorIndex, createGameState, ghostY, hardDrop as engineHardDrop,
  hold as engineHold, moveHorizontal, previewShape, rotate as engineRotate,
  shapeOf, softDrop as engineSoftDrop, spawn, tick,
} from '../lib/engine'
import { boostMultiplier } from '../lib/boost'
import { loadSettings, premiumOn } from '../lib/settings'
import { startMusic, stopMusic, musicContext } from '../lib/music'
import { recordDaily } from '../lib/daily'

const BLOCK = 24
const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#db2777', '#0891b2']
const GHOST_ALPHA = 0.22
const RANK_THRESHOLDS = [0, 1000, 3000, 7000, 15000]
const RANK_NAMES = ['BRONZE', 'SILVER', 'GOLD', 'PLAT', 'DIAMOND']

export function GamePage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { submitScore } = useScores()
  const { t } = useI18n()

  const reviveUsedRef = useRef(false)
  const submittedRef = useRef(false)
  const [boostActive, setBoostActive] = useState(false)
  const [boostLabel, setBoostLabel] = useState('')
  const [showReviveOffer, setShowReviveOffer] = useState(false)
  const [hardDropArmed, setHardDropArmed] = useState(false)
  const gameStateRef = useRef('idle')
  const [gameState, setGameState] = useState('idle')
  const setGameStateBoth = (s) => { gameStateRef.current = s; setGameState(s) }

  const canvasRef = useRef(null)
  const holdRef = useRef(null)
  const nextRef = useRef(null)
  const stateRef = useRef(null)
  const animRef = useRef(null)
  const audioCtxRef = useRef(null)
  const settingsRef = useRef(loadSettings())
  const premiumRef = useRef(false)
  const submitRef = useRef(submitScore)
  const userRef = useRef(user)
  const armRef = useRef(0)
  const hudRef = useRef({ score: -1, level: -1, lines: -1, combo: -1 })
  const bestRef = useRef(parseInt(localStorage.getItem('tetrix_best') || '0', 10))

  const [bestScore, setBestScore] = useState(bestRef.current)
  const [display, setDisplay] = useState({ score: 0, level: 1, lines: 0, combo: 0 })
  const [gameResult, setGameResult] = useState(null)
  const [comboText, setComboText] = useState('')
  const [showComboFlash, setShowComboFlash] = useState(false)
  const [settings, setSettings] = useState(() => loadSettings())

  premiumRef.current = adsAreRemoved(profile)
  submitRef.current = submitScore
  userRef.current = user
  settingsRef.current = settings
  const adsRemoved = premiumRef.current
  const canReward = adsConsentGranted()

  function refreshSettings() {
    const next = loadSettings()
    settingsRef.current = next
    setSettings(next)
  }

  function initAudio() {
    if (!audioCtxRef.current) audioCtxRef.current = musicContext()
  }

  function playSound(type) {
    const ac = audioCtxRef.current
    if (!ac) return
    const live = settingsRef.current
    if (live.sfxOn === false) return
    const vol = live.sfxVol ?? 0.8
    try {
      const now = ac.currentTime
      const plays = (freqs, oscType = 'sine') => {
        freqs.forEach(([f, start, dur, v = vol]) => {
          const o = ac.createOscillator()
          const g = ac.createGain()
          o.type = oscType
          o.connect(g)
          g.connect(ac.destination)
          o.frequency.value = f
          g.gain.setValueAtTime(v * 0.15, now + start)
          g.gain.exponentialRampToValueAtTime(0.001, now + start + dur)
          o.start(now + start)
          o.stop(now + start + dur + 0.01)
        })
      }
      if (type === 'move') plays([[220, 0, 0.06, 0.04]])
      else if (type === 'rotate') plays([[440, 0, 0.08, 0.04]], 'square')
      else if (type === 'lock') plays([[180, 0, 0.15, 0.08], [120, 0.05, 0.12, 0.06]], 'sawtooth')
      else if (type === 'clear') plays([[523, 0, 0.3], [1046, 0.1, 0.3]])
      else if (type === 'tetris') plays([[523, 0, 0.15], [659, 0.07, 0.15], [784, 0.14, 0.15], [1047, 0.21, 0.2]])
      else if (type === 'tspin') plays([[494, 0, 0.12], [659, 0.08, 0.14], [880, 0.16, 0.18]], 'triangle')
      else if (type === 'levelup') plays([[392, 0, 0.12], [494, 0.08, 0.12], [587, 0.16, 0.12], [784, 0.24, 0.15]], 'square')
      else if (type === 'gameover') plays([[400, 0, 0.18], [350, 0.1, 0.18], [300, 0.2, 0.18], [220, 0.3, 0.18], [180, 0.4, 0.2]], 'sawtooth')
      else if (type === 'hold') plays([[330, 0, 0.15], [495, 0.05, 0.12]], 'triangle')
      else if (type === 'drop') plays([[300, 0, 0.1], [100, 0.05, 0.1]])
    } catch { /* audio can fail if the context is closed */ }
  }

  function publishHud(s) {
    const prev = hudRef.current
    if (prev.score !== s.score || prev.level !== s.level || prev.lines !== s.lines || prev.combo !== s.combo) {
      const next = { score: s.score, level: s.level, lines: s.lines, combo: s.combo }
      hudRef.current = next
      setDisplay(next)
    }
    if (s.score > bestRef.current) {
      bestRef.current = s.score
      setBestScore(s.score)
    }
  }

  function feature(key) {
    return premiumOn(settingsRef.current, premiumRef.current, key)
  }

  function afterLock(s, result) {
    if (!result.locked && !result.topped) return
    if (result.topped) {
      endGame(s)
      return
    }
    if (result.tspinKind && result.tspinKind !== 'none') playSound('tspin')
    else if (result.cleared === 4) playSound('tetris')
    else if (result.cleared > 0) playSound('clear')
    else playSound('lock')
    if (result.leveledUp) playSound('levelup')
    if (result.cleared > 0 && feature('animations')) s.lineFlashUntil = performance.now() + 180
    if (result.cleared > 0 && s.combo > 1 && feature('showCombo')) {
      setComboText(`${s.combo}x COMBO`)
      setShowComboFlash(true)
      setTimeout(() => setShowComboFlash(false), 800)
    }
    publishHud(s)
    drawNext()
    drawHold()
    drawBoard()
  }

  function startGame(withBoost = false) {
    refreshSettings()
    initAudio()
    hideBanner()
    stopMusic()
    const s = createGameState()
    const mult = withBoost ? boostMultiplier(premiumRef.current) : 1
    s.scoreMultiplier = mult
    s.previousBest = parseInt(localStorage.getItem('tetrix_best') || '0', 10)
    stateRef.current = s
    if (!spawn(s)) {
      endGame(s)
      return
    }
    setGameStateBoth('playing')
    setGameResult(null)
    reviveUsedRef.current = false
    submittedRef.current = false
    setBoostActive(withBoost)
    setBoostLabel(withBoost ? (premiumRef.current ? t('boostActiveOwned') : t('boostActive')) : '')
    setShowReviveOffer(false)
    setHardDropArmed(false)
    const storedBest = parseInt(localStorage.getItem('tetrix_best') || '0', 10)
    bestRef.current = storedBest
    setBestScore(storedBest)
    hudRef.current = { score: 0, level: 1, lines: 0, combo: 0 }
    setDisplay(hudRef.current)
    if (animRef.current) cancelAnimationFrame(animRef.current)
    s.lastTime = performance.now()
    drawBoard()
    drawNext()
    drawHold()
    startMusic()
    animRef.current = requestAnimationFrame(loop)
  }

  async function handleBoostAd() {
    const removed = premiumRef.current
    const result = await showRewardedAd('boost', removed)
    startGame(result.granted)
  }

  function loop(ts) {
    const s = stateRef.current
    if (!s || !canvasRef.current) return
    if (gameStateRef.current !== 'playing') return
    const dt = ts - s.lastTime
    s.lastTime = ts
    const result = tick(s, dt)
    if (result.locked || result.topped) {
      afterLock(s, result)
      if (gameStateRef.current !== 'playing') return
    }
    drawBoard()
    animRef.current = requestAnimationFrame(loop)
  }

  function endGame(s) {
    cancelAnimationFrame(animRef.current)
    stopMusic()
    playSound('gameover')
    const best = Math.max(s.score, parseInt(localStorage.getItem('tetrix_best') || '0', 10))
    localStorage.setItem('tetrix_best', String(best))
    bestRef.current = best
    setBestScore(best)
    if (!reviveUsedRef.current) {
      setGameStateBoth('revive')
      setShowReviveOffer(true)
      return
    }
    finalizeGameOver(s)
  }

  function finalizeGameOver(s) {
    if (!s) return
    const stored = s.previousBest ?? parseInt(localStorage.getItem('tetrix_best') || '0', 10)
    const isNewBest = s.score > stored
    const best = Math.max(s.score, stored)
    localStorage.setItem('tetrix_best', String(best))
    bestRef.current = best
    setBestScore(best)
    const daily = recordDaily({
      lines: s.lines,
      score: s.score,
      tetrises: s.tetrises,
      tspins: s.tspins,
    })
    setGameStateBoth('gameover')
    setGameResult({
      score: s.score,
      level: s.level,
      lines: s.lines,
      maxCombo: s.maxCombo,
      duration: Date.now() - s.startTime,
      isNewBest,
      daily,
    })
    if (userRef.current && !submittedRef.current) {
      submittedRef.current = true
      submitRef.current({
        score: s.score,
        level: s.level,
        lines: s.lines,
        duration: Date.now() - s.startTime,
        clientGameId: s.clientGameId,
      })
    }
    maybeShowInterstitial(premiumRef.current)
  }

  async function handleReviveAd() {
    setShowReviveOffer(false)
    const result = await showRewardedAd('revive', premiumRef.current)
    const s = stateRef.current
    if (result.granted && s) {
      reviveUsedRef.current = true
      s.board.splice(0, 4)
      while (s.board.length < ROWS) s.board.unshift(Array(COLS).fill(0))
      if (!spawn(s)) { finalizeGameOver(s); return }
      setGameStateBoth('playing')
      s.lastTime = performance.now()
      startMusic()
      animRef.current = requestAnimationFrame(loop)
    } else {
      finalizeGameOver(s)
    }
  }

  function handleDeclineRevive() {
    setShowReviveOffer(false)
    finalizeGameOver(stateRef.current)
  }

  function togglePause() {
    const s = stateRef.current
    if (!s) return
    if (gameStateRef.current === 'playing') {
      cancelAnimationFrame(animRef.current)
      stopMusic()
      setGameStateBoth('paused')
    } else if (gameStateRef.current === 'paused') {
      setGameStateBoth('playing')
      s.lastTime = performance.now()
      startMusic()
      animRef.current = requestAnimationFrame(loop)
    }
  }

  function moveLeft() {
    const s = stateRef.current
    if (!s?.current || gameStateRef.current !== 'playing') return
    if (moveHorizontal(s, -1)) playSound('move')
    drawBoard()
  }
  function moveRight() {
    const s = stateRef.current
    if (!s?.current || gameStateRef.current !== 'playing') return
    if (moveHorizontal(s, 1)) playSound('move')
    drawBoard()
  }
  function softDrop() {
    const s = stateRef.current
    if (!s?.current || gameStateRef.current !== 'playing') return
    const result = engineSoftDrop(s)
    if (result.locked) afterLock(s, result)
    else { publishHud(s); drawBoard() }
  }
  function hardDrop() {
    const s = stateRef.current
    if (!s?.current || gameStateRef.current !== 'playing') return
    if (feature('hardDropConfirm')) {
      const now = Date.now()
      if (now - armRef.current > 1200) {
        armRef.current = now
        setHardDropArmed(true)
        setTimeout(() => setHardDropArmed(false), 1200)
        return
      }
    }
    armRef.current = 0
    setHardDropArmed(false)
    playSound('drop')
    const result = engineHardDrop(s)
    afterLock(s, result)
  }
  function doRotate() {
    const s = stateRef.current
    if (!s?.current || gameStateRef.current !== 'playing') return
    if (engineRotate(s)) playSound('rotate')
    drawBoard()
  }
  function doHold() {
    const s = stateRef.current
    if (!s?.current || gameStateRef.current !== 'playing') return
    const result = engineHold(s)
    if (!result.held) return
    playSound('hold')
    if (result.topped) { endGame(s); return }
    drawBoard()
    drawHold()
    drawNext()
  }

  function drawBlock(ctx, x, y, colorIdx, alpha = 1) {
    const col = COLORS[colorIdx] || '#555'
    ctx.globalAlpha = alpha
    ctx.fillStyle = col
    ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2)
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.fillRect(x * BLOCK + 2, y * BLOCK + 2, BLOCK - 4, 4)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(x * BLOCK + 1, y * BLOCK + BLOCK - 4, BLOCK - 2, 3)
    ctx.globalAlpha = 1
  }

  function drawBoard() {
    const canvas = canvasRef.current
    const s = stateRef.current
    if (!canvas || !s) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'rgba(0,0,15,0.97)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const live = settingsRef.current
    if (live.gridLines !== false) {
      ctx.strokeStyle = 'rgba(120,80,255,0.06)'
      ctx.lineWidth = 0.5
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) ctx.strokeRect(c * BLOCK, r * BLOCK, BLOCK, BLOCK)
    }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (s.board[r][c]) drawBlock(ctx, c, r, s.board[r][c] - 1)
    if (s.current) {
      const shape = cellsOf(s.current)
      if (feature('ghostPiece')) {
        const gy = ghostY(s)
        if (gy !== null && gy !== s.current.y) {
          for (const [c, r] of shape) drawBlock(ctx, s.current.x + c, gy + r, s.current.color, GHOST_ALPHA)
        }
      }
      for (const [c, r] of shape) drawBlock(ctx, s.current.x + c, s.current.y + r, s.current.color)
    }
    if (feature('animations') && s.lineFlashUntil && performance.now() < s.lineFlashUntil) {
      ctx.fillStyle = 'rgba(255,255,255,0.14)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }

  function drawMini(ctx, key, cw, ch) {
    ctx.fillStyle = 'rgba(0,0,15,0.95)'
    ctx.fillRect(0, 0, cw, ch)
    if (!key) return
    const shape = previewShape(key)
    const color = colorIndex(key)
    const bs = 16
    const pw = shape[0].length * bs
    const ph = shape.length * bs
    const ox = Math.floor((cw - pw) / 2)
    const oy = Math.floor((ch - ph) / 2)
    for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue
      ctx.fillStyle = COLORS[color]
      ctx.fillRect(ox + c * bs + 1, oy + r * bs + 1, bs - 2, bs - 2)
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.fillRect(ox + c * bs + 2, oy + r * bs + 2, bs - 4, 3)
    }
  }

  function drawHold() {
    const hc = holdRef.current
    const s = stateRef.current
    if (!hc || !s) return
    drawMini(hc.getContext('2d'), s.holdKey, hc.width, hc.height)
  }

  function drawNext() {
    const nc = nextRef.current
    const s = stateRef.current
    if (!nc || !s) return
    const nCtx = nc.getContext('2d')
    nCtx.fillStyle = 'rgba(0,0,15,0.95)'
    nCtx.fillRect(0, 0, nc.width, nc.height)
    s.next.slice(0, 3).forEach((key, i) => {
      const shape = previewShape(key)
      const segH = Math.floor(nc.height / 3)
      const bs = 14
      const pw = shape[0].length * bs
      const ph = shape.length * bs
      const ox = Math.floor((nc.width - pw) / 2)
      const oy = i * segH + Math.floor((segH - ph) / 2)
      for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue
        nCtx.fillStyle = COLORS[colorIndex(key)]
        nCtx.fillRect(ox + c * bs + 1, oy + r * bs + 1, bs - 2, bs - 2)
        nCtx.fillStyle = 'rgba(255,255,255,0.15)'
        nCtx.fillRect(ox + c * bs + 2, oy + r * bs + 2, bs - 4, 3)
      }
      if (i < 2) {
        nCtx.strokeStyle = 'rgba(120,80,255,0.15)'
        nCtx.lineWidth = 0.5
        nCtx.beginPath()
        nCtx.moveTo(5, (i + 1) * segH)
        nCtx.lineTo(nc.width - 5, (i + 1) * segH)
        nCtx.stroke()
      }
    })
  }

  useEffect(() => {
    function onKey(e) {
      const gs = gameStateRef.current
      if (gs === 'idle' || gs === 'gameover') return
      if (e.code === 'KeyP' || e.code === 'Escape') { togglePause(); return }
      if (gs !== 'playing') return
      if (e.code === 'ArrowLeft') { e.preventDefault(); moveLeft() }
      else if (e.code === 'ArrowRight') { e.preventDefault(); moveRight() }
      else if (e.code === 'ArrowDown') { e.preventDefault(); softDrop() }
      else if (e.code === 'ArrowUp' || e.code === 'KeyX') { e.preventDefault(); doRotate() }
      else if (e.code === 'Space') { e.preventDefault(); hardDrop() }
      else if (e.code === 'KeyC' || e.code === 'ShiftLeft') { e.preventDefault(); doHold() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    refreshSettings()
    return () => {
      cancelAnimationFrame(animRef.current)
      stopMusic()
    }
  }, [])

  const rankIdx = RANK_THRESHOLDS.reduce((acc, threshold, i) => display.score >= threshold ? i : acc, 0)
  const showComboStat = premiumOn(settings, adsRemoved, 'showCombo')

  function tc(action) {
    return {
      onTouchStart: e => { e.preventDefault(); initAudio(); if (gameStateRef.current === 'playing') action() },
      onMouseDown: () => { initAudio(); if (gameStateRef.current === 'playing') action() },
      style: {
        background: 'rgba(120,80,255,0.1)', border: '1px solid rgba(120,80,255,0.3)',
        borderRadius: 8, padding: '11px 0', cursor: 'pointer', textAlign: 'center',
        color: '#a78bfa', fontSize: 14, userSelect: 'none', WebkitTapHighlightColor: 'transparent',
        fontFamily: "'Orbitron',sans-serif",
      },
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07071a', padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%', maxWidth: 500 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 100, flexShrink: 0 }}>
          <Panel label={t('hold')}>
            <canvas ref={holdRef} width={90} height={70} style={{ display: 'block', margin: '0 auto' }} />
          </Panel>
          <Panel label={t('score')}><Stat>{display.score.toLocaleString()}</Stat></Panel>
          <Panel label={t('level')}><Stat>{display.level}</Stat></Panel>
          <Panel label={t('lines')}><Stat>{display.lines}</Stat></Panel>
          <Panel label={t('rank')}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: '#c084fc' }}>{RANK_NAMES[rankIdx]}</div>
          </Panel>
        </div>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <canvas ref={canvasRef} width={COLS * BLOCK} height={ROWS * BLOCK}
            style={{ display: 'block', border: '1px solid rgba(120,80,255,0.4)', borderRadius: 4 }}
            onClick={() => { if (gameStateRef.current === 'idle') startGame() }}
          />
          {(gameState === 'idle' || gameState === 'paused') && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(7,7,26,0.8)', borderRadius: 4 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 900, color: '#c084fc', letterSpacing: 3, textShadow: '0 0 20px rgba(192,132,252,0.6)' }}>
                {gameState === 'paused' ? t('paused') : 'TETRIX'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(192,132,252,0.6)', marginTop: 8, letterSpacing: 2 }}>
                {gameState === 'paused' ? t('tapToResume') : t('tapToStart')}
              </div>
              {gameState === 'idle' && (
                <button onClick={() => startGame()} style={{ marginTop: 16, fontFamily: "'Orbitron',sans-serif", fontSize: 11, background: 'rgba(120,80,255,0.2)', border: '1px solid rgba(120,80,255,0.5)', color: '#c084fc', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', letterSpacing: 2 }}>▶ START</button>
              )}
              {gameState === 'paused' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 16 }}>
                  <button onClick={togglePause} style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, background: 'rgba(120,80,255,0.2)', border: '1px solid rgba(120,80,255,0.5)', color: '#c084fc', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', letterSpacing: 2 }}>{t('resume')}</button>
                  <button onClick={() => { cancelAnimationFrame(animRef.current); stopMusic(); navigate('/menu') }} style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, letterSpacing: 1, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', borderRadius: 8, padding: '9px 24px', cursor: 'pointer' }}>✕ QUIT TO MENU</button>
                </div>
              )}
            </div>
          )}
          {showComboFlash && (
            <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: '#fbbf24', textShadow: '0 0 16px #fbbf24', pointerEvents: 'none', whiteSpace: 'nowrap' }}>{comboText}</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 100, flexShrink: 0 }}>
          <Panel label={t('next')}>
            <canvas ref={nextRef} width={90} height={200} style={{ display: 'block', margin: '0 auto' }} />
          </Panel>
          <Panel label={t('combo')}><Stat>{showComboStat ? `x${display.combo}` : '—'}</Stat></Panel>
          <Panel label={t('best')}><Stat style={{ fontSize: 12 }}>{bestScore.toLocaleString()}</Stat></Panel>
          <button onClick={togglePause} style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, letterSpacing: 1, background: 'rgba(120,80,255,0.1)', border: '1px solid rgba(120,80,255,0.3)', color: '#c084fc', borderRadius: 6, padding: '8px 4px', cursor: 'pointer' }}>
            {gameState === 'paused' ? t('resume').replace('▶ ', '') : t('pause')}
          </button>
          <button onClick={() => { stopMusic(); navigate('/menu') }} style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, letterSpacing: 1, background: 'rgba(120,80,255,0.05)', border: '1px solid rgba(120,80,255,0.2)', color: 'rgba(180,140,255,0.5)', borderRadius: 6, padding: '8px 4px', cursor: 'pointer' }}>{t('menu')}</button>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 500, marginTop: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
          <div />
          <div {...tc(doRotate)}>↻</div>
          <div />
          <div {...tc(moveLeft)}>◀</div>
          <div {...tc(softDrop)}>▼</div>
          <div {...tc(moveRight)}>▶</div>
          <div {...tc(hardDrop)} style={{ ...tc(hardDrop).style, gridColumn: 'span 3', fontSize: 9, letterSpacing: 1 }}>{hardDropArmed ? t('confirmHardDrop') : t('hardDrop')}</div>
          <div {...tc(doHold)} style={{ ...tc(doHold).style, gridColumn: 'span 3', fontSize: 9, letterSpacing: 1 }}>{t('holdPiece')}</div>
        </div>
      </div>

      {showReviveOffer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(7,7,26,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'rgba(15,10,35,0.99)', border: '1px solid rgba(5,150,105,0.5)', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 320, textAlign: 'center', boxShadow: '0 0 60px rgba(5,150,105,0.25)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💚</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: '#34d399', letterSpacing: 2, marginBottom: 8 }}>{t('revive')}</div>
            <div style={{ fontSize: 13, color: 'rgba(180,140,255,0.7)', marginBottom: 20, lineHeight: 1.6 }}>{canReward ? t('reviveDesc') : t('adsNeedConsent')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {canReward && <button onClick={handleReviveAd} style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, letterSpacing: 2, background: 'linear-gradient(135deg, #065f46, #059669)', border: 'none', color: '#fff', borderRadius: 8, padding: '14px', cursor: 'pointer' }}>{t('watchAdRevive')}</button>}
              <button onClick={handleDeclineRevive} style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, letterSpacing: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(120,80,255,0.25)', color: 'rgba(180,140,255,0.5)', borderRadius: 8, padding: '11px', cursor: 'pointer' }}>{t('noThanks')}</button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'gameover' && gameResult && (
        <GameOverModal result={gameResult} onReplay={() => startGame()} onBoostAd={canReward ? handleBoostAd : null} adsRemoved={adsRemoved} onMenu={() => navigate('/menu')} />
      )}

      {boostActive && gameState === 'playing' && (
        <div style={{ position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)', fontFamily: "'Orbitron',sans-serif", fontSize: 10, letterSpacing: 2, background: 'rgba(217,119,6,0.2)', border: '1px solid rgba(217,119,6,0.5)', color: '#fbbf24', borderRadius: 20, padding: '4px 14px', zIndex: 50, pointerEvents: 'none' }}>{boostLabel}</div>
      )}
    </div>
  )
}

function cellsOf(piece) {
  const shape = shapeOf(piece)
  const cells = []
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) if (shape[r][c]) cells.push([c, r])
  }
  return cells
}

function Panel({ label, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(120,80,255,0.25)', borderRadius: 8, padding: '6px 8px' }}>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, letterSpacing: 2, color: 'rgba(180,140,255,0.6)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  )
}
function Stat({ children, style: s }) {
  return <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 700, color: '#c084fc', ...s }}>{children}</div>
}
