import { useAuth } from '../hooks/useAuth'
import { maybeShowInterstitial, showRewardedAd, hideBanner } from '../lib/admob'
import { adsAreRemoved } from '../lib/iap'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { GameOverModal } from '../components/GameOverModal'
import { useScores } from '../hooks/useScores'

const COLS = 10, ROWS = 20, BLOCK = 24
const COLORS = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#db2777','#0891b2']
const GHOST_ALPHA = 0.22
const TETROMINOES = {
  I: { shape: [[1,1,1,1]], color: 0 },
  O: { shape: [[1,1],[1,1]], color: 1 },
  T: { shape: [[0,1,0],[1,1,1]], color: 2 },
  S: { shape: [[0,1,1],[1,1,0]], color: 3 },
  Z: { shape: [[1,1,0],[0,1,1]], color: 4 },
  J: { shape: [[1,0,0],[1,1,1]], color: 5 },
  L: { shape: [[0,0,1],[1,1,1]], color: 6 },
}
const SCORES = [0, 100, 300, 500, 800]
const SPEED_TABLE = [800,700,600,500,420,350,280,220,170,130,100,80,65,55,45,38,32,27,22,18,15]
const RANK_THRESHOLDS = [0,1000,3000,7000,15000]
const RANK_NAMES = ['BRONZE','SILVER','GOLD','PLAT','DIAMOND']

export function GamePage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { submitScore } = useScores()
  const adsRemoved = adsAreRemoved(profile)
  const { t } = useI18n()

  const reviveUsedRef = useRef(false)
  const [boostActive, setBoostActive] = useState(false)
  const [showReviveOffer, setShowReviveOffer] = useState(false)
  const gameStateRef = useRef('idle')
  const [gameState, setGameState] = useState('idle')
  const setGameStateBoth = (s) => { gameStateRef.current = s; setGameState(s) }

  const canvasRef = useRef(null)
  const holdRef = useRef(null)
  const nextRef = useRef(null)
  const stateRef = useRef(null)
  const animRef = useRef(null)
  const audioCtxRef = useRef(null)

  // Fix: use state for best score so it updates reactively
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('tetrix_best') || '0'))
  const [display, setDisplay] = useState({ score: 0, level: 1, lines: 0, combo: 0 })
  const [gameResult, setGameResult] = useState(null)
  const [comboText, setComboText] = useState('')
  const [showComboFlash, setShowComboFlash] = useState(false)

  function initAudio() {
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)() } catch(e) {}
    }
  }

  function playSound(type) {
    const ac = audioCtxRef.current
    if (!ac) return
    const settings = JSON.parse(localStorage.getItem('tetrix_settings') || '{}')
    if (settings.sfxOn === false) return
    const vol = settings.sfxVol ?? 0.8
    try {
      const t = ac.currentTime
      const plays = (freqs, oscType='sine') => {
        freqs.forEach(([f, start, dur, v=vol]) => {
          const o = ac.createOscillator(), g = ac.createGain()
          o.type = oscType; o.connect(g); g.connect(ac.destination)
          o.frequency.value = f
          g.gain.setValueAtTime(v * 0.15, t + start)
          g.gain.exponentialRampToValueAtTime(0.001, t + start + dur)
          o.start(t + start); o.stop(t + start + dur + 0.01)
        })
      }
      if (type==='move')     plays([[220,0,0.06,0.04]])
      else if (type==='rotate')   plays([[440,0,0.08,0.04]],'square')
      else if (type==='lock')     plays([[180,0,0.15,0.08],[120,0.05,0.12,0.06]],'sawtooth')
      else if (type==='clear')    plays([[523,0,0.3],[1046,0.1,0.3]])
      else if (type==='tetris')   plays([[523,0,0.15],[659,0.07,0.15],[784,0.14,0.15],[1047,0.21,0.2]])
      else if (type==='levelup')  plays([[392,0,0.12],[494,0.08,0.12],[587,0.16,0.12],[784,0.24,0.15]],'square')
      else if (type==='gameover') plays([[400,0,0.18],[350,0.1,0.18],[300,0.2,0.18],[220,0.3,0.18],[180,0.4,0.2]],'sawtooth')
      else if (type==='hold')     plays([[330,0,0.15],[495,0.05,0.12]],'triangle')
      else if (type==='drop')     plays([[300,0,0.1],[100,0.05,0.1]])
    } catch(e) {}
  }

  function newState() {
    return {
      board: Array.from({length: ROWS}, () => Array(COLS).fill(0)),
      current: null, ghost: null, holdPiece: null,
      nextPieces: [rp(), rp(), rp()],
      score: 0, level: 1, lines: 0, combo: 0, maxCombo: 0,
      btb: false, canHold: true, scoreMultiplier: 1,
      lastTime: 0, dropAcc: 0, startTime: Date.now(),
    }
  }

  function rp() {
    const keys = Object.keys(TETROMINOES)
    const key = keys[Math.floor(Math.random() * keys.length)]
    const t = TETROMINOES[key]
    return { shape: t.shape.map(r=>[...r]), color: t.color, key }
  }

  function collides(s, x, y, shape) {
    for (let r=0;r<shape.length;r++) for (let c=0;c<shape[r].length;c++) {
      if (!shape[r][c]) continue
      const nx=x+c, ny=y+r
      if (nx<0||nx>=COLS||ny>=ROWS) return true
      if (ny>=0 && s.board[ny][nx]) return true
    }
    return false
  }

  function rotate(shape) {
    const rows=shape.length, cols=shape[0].length
    const rot = Array.from({length:cols},()=>Array(rows).fill(0))
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) rot[c][rows-1-r]=shape[r][c]
    return rot
  }

  function updateGhost(s) {
    if (!s.current) return
    s.ghost = {...s.current, shape: s.current.shape.map(r=>[...r])}
    while (!collides(s, s.ghost.x, s.ghost.y+1, s.ghost.shape)) s.ghost.y++
  }

  function spawnPiece(s) {
    s.current = s.nextPieces.shift()
    s.nextPieces.push(rp())
    s.current.x = Math.floor(COLS/2) - Math.floor(s.current.shape[0].length/2)
    s.current.y = 0
    updateGhost(s)
    if (collides(s, s.current.x, s.current.y, s.current.shape)) return false
    return true
  }

  function lockPiece(s) {
    const c = s.current
    for (let r=0;r<c.shape.length;r++) for (let cc=0;cc<c.shape[r].length;cc++) {
      if (!c.shape[r][cc]) continue
      if (c.y+r < 0) return false
      s.board[c.y+r][c.x+cc] = c.color+1
    }
    playSound('lock')
    clearLines(s)
    s.canHold = true
    return true
  }

  function clearLines(s) {
    let cleared = 0
    for (let r=ROWS-1;r>=0;r--) {
      if (s.board[r].every(c=>c!==0)) { s.board.splice(r,1); s.board.unshift(Array(COLS).fill(0)); cleared++; r++ }
    }
    if (!cleared) { s.combo=0; return }
    s.combo++
    if (s.combo > s.maxCombo) s.maxCombo = s.combo
    const isTetris = cleared===4
    const comboBonus = s.combo > 1 ? (s.combo-1)*50 : 0
    const btbBonus = isTetris && s.btb ? Math.floor(SCORES[4]*s.level*0.5) : 0
    s.score += Math.floor((SCORES[cleared]*s.level + comboBonus + btbBonus) * (s.scoreMultiplier||1))
    s.lines += cleared
    if (isTetris) { playSound('tetris'); s.btb=true } else { playSound('clear'); s.btb=false }
    if (s.combo>1) { setComboText(`${s.combo}x COMBO`); setShowComboFlash(true); setTimeout(()=>setShowComboFlash(false),800) }
    const newLevel = Math.min(20, Math.floor(s.lines/10)+1)
    if (newLevel > s.level) { s.level=newLevel; playSound('levelup') }
  }

  function startGame(withBoost = false) {
    initAudio()
    hideBanner()
    const s = newState()
    if (withBoost) s.scoreMultiplier = 1.25
    stateRef.current = s
    spawnPiece(s)
    setGameStateBoth('playing')
    setGameResult(null)
    reviveUsedRef.current = false
    setBoostActive(withBoost)
    setShowReviveOffer(false)
    const storedBest = parseInt(localStorage.getItem('tetrix_best') || '0')
    setBestScore(storedBest)
    setDisplay({ score: 0, level: 1, lines: 0, combo: 0 })
    if (animRef.current) cancelAnimationFrame(animRef.current)
    s.lastTime = performance.now()
    animRef.current = requestAnimationFrame(loop)
  }

  async function handleBoostAd() {
    const result = await showRewardedAd('boost', adsRemoved)
    startGame(result.granted)
  }

  function loop(ts) {
    const s = stateRef.current
    if (!s || !canvasRef.current) return
    if (gameStateRef.current !== 'playing') return
    const dt = ts - s.lastTime; s.lastTime = ts
    s.dropAcc += dt
    const speed = SPEED_TABLE[Math.min(s.level-1, SPEED_TABLE.length-1)]
    if (s.dropAcc >= speed) {
      s.dropAcc -= speed
      if (!collides(s, s.current.x, s.current.y+1, s.current.shape)) {
        s.current.y++
      } else {
        if (!lockPiece(s)) { endGame(s); return }
        if (!spawnPiece(s)) { endGame(s); return }
        drawNext(); drawHold()
      }
    }
    drawBoard()
    // Fix: update bestScore state reactively
    const currentBest = Math.max(s.score, parseInt(localStorage.getItem('tetrix_best') || '0'))
    setDisplay({ score: s.score, level: s.level, lines: s.lines, combo: s.combo })
    setBestScore(currentBest)
    animRef.current = requestAnimationFrame(loop)
  }

  function endGame(s) {
    cancelAnimationFrame(animRef.current)
    playSound('gameover')
    const best = Math.max(s.score, parseInt(localStorage.getItem('tetrix_best') || '0'))
    localStorage.setItem('tetrix_best', best)
    setBestScore(best)
    if (!reviveUsedRef.current) {
      setShowReviveOffer(true)
      return
    }
    finalizeGameOver(s)
  }

  function finalizeGameOver(s) {
    const best = Math.max(s.score, parseInt(localStorage.getItem('tetrix_best') || '0'))
    localStorage.setItem('tetrix_best', best)
    setBestScore(best)
    setGameStateBoth('gameover')
    setGameResult({ score: s.score, level: s.level, lines: s.lines, maxCombo: s.maxCombo, duration: Date.now()-s.startTime })
    // Submit score to Supabase
    if (user) {
      submitScore({ score: s.score, level: s.level, lines: s.lines, duration: Date.now()-s.startTime })
    }
    maybeShowInterstitial(adsRemoved)
  }

  async function handleReviveAd() {
    setShowReviveOffer(false)
    const result = await showRewardedAd('revive', adsRemoved)
    const s = stateRef.current
    if (result.granted && s) {
      reviveUsedRef.current = true
      s.board.splice(0, 4)
      while (s.board.length < ROWS) s.board.unshift(Array(COLS).fill(0))
      if (!spawnPiece(s)) { finalizeGameOver(s); return }
      setGameStateBoth('playing')
      s.lastTime = performance.now()
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
    const s = stateRef.current; if (!s) return
    if (gameStateRef.current === 'playing') {
      cancelAnimationFrame(animRef.current)
      setGameStateBoth('paused')
    } else if (gameStateRef.current === 'paused') {
      setGameStateBoth('playing')
      s.lastTime = performance.now()
      animRef.current = requestAnimationFrame(loop)
    }
  }

  function moveLeft() {
    const s = stateRef.current; if (!s?.current) return
    if (!collides(s, s.current.x-1, s.current.y, s.current.shape)) { s.current.x--; updateGhost(s); playSound('move') }
    drawBoard()
  }
  function moveRight() {
    const s = stateRef.current; if (!s?.current) return
    if (!collides(s, s.current.x+1, s.current.y, s.current.shape)) { s.current.x++; updateGhost(s); playSound('move') }
    drawBoard()
  }
  function softDrop() {
    const s = stateRef.current; if (!s?.current) return
    if (!collides(s, s.current.x, s.current.y+1, s.current.shape)) { s.current.y++; s.score++ }
    else { if (!lockPiece(s)) { endGame(s); return }; if (!spawnPiece(s)) { endGame(s); return }; drawNext(); drawHold() }
    drawBoard(); setDisplay(d => ({...d, score: s.score}))
  }
  function hardDrop() {
    const s = stateRef.current; if (!s?.current) return
    let dropped=0
    while (!collides(s, s.current.x, s.current.y+1, s.current.shape)) { s.current.y++; dropped++ }
    s.score += dropped*2; playSound('drop')
    if (!lockPiece(s)) { endGame(s); return }
    if (!spawnPiece(s)) { endGame(s); return }
    drawNext(); drawHold(); drawBoard(); setDisplay(d => ({...d, score: s.score}))
  }
  function doRotate() {
    const s = stateRef.current; if (!s?.current) return
    const newShape = rotate(s.current.shape)
    for (const k of [0,1,-1,2,-2]) {
      if (!collides(s, s.current.x+k, s.current.y, newShape)) {
        s.current.shape = newShape; s.current.x += k; updateGhost(s); playSound('rotate'); break
      }
    }
    drawBoard()
  }
  function doHold() {
    const s = stateRef.current; if (!s?.current || !s.canHold) return
    playSound('hold'); s.canHold = false
    const prev = s.holdPiece
    s.holdPiece = { shape: TETROMINOES[s.current.key].shape.map(r=>[...r]), color: s.current.color, key: s.current.key }
    if (prev) { s.current = prev; s.current.x = Math.floor(COLS/2)-Math.floor(s.current.shape[0].length/2); s.current.y=0; updateGhost(s) }
    else spawnPiece(s)
    drawBoard(); drawHold()
  }

  function drawBlock(ctx, x, y, colorIdx, alpha=1) {
    const col = COLORS[colorIdx] || '#555'
    ctx.globalAlpha = alpha
    ctx.fillStyle = col; ctx.fillRect(x*BLOCK+1, y*BLOCK+1, BLOCK-2, BLOCK-2)
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x*BLOCK+2, y*BLOCK+2, BLOCK-4, 4)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x*BLOCK+1, y*BLOCK+BLOCK-4, BLOCK-2, 3)
    ctx.globalAlpha = 1
  }

  function drawBoard() {
    const canvas = canvasRef.current; const s = stateRef.current
    if (!canvas || !s) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'rgba(0,0,15,0.97)'; ctx.fillRect(0,0,canvas.width,canvas.height)
    const settings = JSON.parse(localStorage.getItem('tetrix_settings')||'{}')
    if (settings.gridLines !== false) {
      ctx.strokeStyle = 'rgba(120,80,255,0.06)'; ctx.lineWidth=0.5
      for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) ctx.strokeRect(c*BLOCK,r*BLOCK,BLOCK,BLOCK)
    }
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (s.board[r][c]) drawBlock(ctx,c,r,s.board[r][c]-1)
    if (s.current) {
      if (settings.ghostPiece !== false && s.ghost)
        for (let r=0;r<s.ghost.shape.length;r++) for (let c=0;c<s.ghost.shape[r].length;c++)
          if (s.ghost.shape[r][c]) drawBlock(ctx,s.ghost.x+c,s.ghost.y+r,s.current.color,GHOST_ALPHA)
      for (let r=0;r<s.current.shape.length;r++) for (let c=0;c<s.current.shape[r].length;c++)
        if (s.current.shape[r][c]) drawBlock(ctx,s.current.x+c,s.current.y+r,s.current.color)
    }
  }

  function drawMini(ctx, piece, cw, ch) {
    ctx.fillStyle = 'rgba(0,0,15,0.95)'; ctx.fillRect(0,0,cw,ch)
    if (!piece) return
    const bs=16, pw=piece.shape[0].length*bs, ph=piece.shape.length*bs
    const ox=Math.floor((cw-pw)/2), oy=Math.floor((ch-ph)/2)
    for (let r=0;r<piece.shape.length;r++) for (let c=0;c<piece.shape[r].length;c++) {
      if (!piece.shape[r][c]) continue
      ctx.fillStyle=COLORS[piece.color]; ctx.fillRect(ox+c*bs+1,oy+r*bs+1,bs-2,bs-2)
      ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(ox+c*bs+2,oy+r*bs+2,bs-4,3)
    }
  }

  function drawHold() {
    const hc = holdRef.current; const s = stateRef.current
    if (!hc || !s) return
    drawMini(hc.getContext('2d'), s.holdPiece, hc.width, hc.height)
  }

  function drawNext() {
    const nc = nextRef.current; const s = stateRef.current
    if (!nc || !s) return
    const nCtx = nc.getContext('2d')
    nCtx.fillStyle = 'rgba(0,0,15,0.95)'; nCtx.fillRect(0,0,nc.width,nc.height)
    s.nextPieces.slice(0,3).forEach((p,i) => {
      const segH=Math.floor(nc.height/3), bs=14
      const pw=p.shape[0].length*bs, ph=p.shape.length*bs
      const ox=Math.floor((nc.width-pw)/2), oy=i*segH+Math.floor((segH-ph)/2)
      for (let r=0;r<p.shape.length;r++) for (let c=0;c<p.shape[r].length;c++) {
        if (!p.shape[r][c]) continue
        nCtx.fillStyle=COLORS[p.color]; nCtx.fillRect(ox+c*bs+1,oy+r*bs+1,bs-2,bs-2)
        nCtx.fillStyle='rgba(255,255,255,0.15)'; nCtx.fillRect(ox+c*bs+2,oy+r*bs+2,bs-4,3)
      }
      if (i<2) {
        nCtx.strokeStyle='rgba(120,80,255,0.15)'; nCtx.lineWidth=0.5
        nCtx.beginPath(); nCtx.moveTo(5,(i+1)*segH); nCtx.lineTo(nc.width-5,(i+1)*segH); nCtx.stroke()
      }
    })
  }

  useEffect(() => {
    function onKey(e) {
      const gs = gameStateRef.current
      if (gs === 'idle' || gs === 'gameover') return
      if (e.code === 'KeyP' || e.code === 'Escape') { togglePause(); return }
      if (gs !== 'playing') return
      if (e.code==='ArrowLeft')  { e.preventDefault(); moveLeft() }
      else if (e.code==='ArrowRight') { e.preventDefault(); moveRight() }
      else if (e.code==='ArrowDown')  { e.preventDefault(); softDrop() }
      else if (e.code==='ArrowUp' || e.code==='KeyX') { e.preventDefault(); doRotate() }
      else if (e.code==='Space')  { e.preventDefault(); hardDrop() }
      else if (e.code==='KeyC' || e.code==='ShiftLeft') { e.preventDefault(); doHold() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => { drawBoard(); drawHold(); drawNext() }, [])

  const rankIdx = RANK_THRESHOLDS.reduce((acc,t,i)=>display.score>=t?i:acc,0)

  function tc(action) {
    return {
      onTouchStart: e => { e.preventDefault(); initAudio(); if (gameStateRef.current==='playing') action() },
      onMouseDown: () => { initAudio(); if (gameStateRef.current==='playing') action() },
      style: {
        background:'rgba(120,80,255,0.1)', border:'1px solid rgba(120,80,255,0.3)',
        borderRadius:8, padding:'11px 0', cursor:'pointer', textAlign:'center',
        color:'#a78bfa', fontSize:14, userSelect:'none', WebkitTapHighlightColor:'transparent',
        fontFamily:"'Orbitron',sans-serif",
      }
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#07071a', padding:'10px 8px', display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ display:'flex', gap:10, alignItems:'flex-start', width:'100%', maxWidth:500 }}>

        {/* Left panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, width:100, flexShrink:0 }}>
          <Panel label={t('hold')}>
            <canvas ref={holdRef} width={90} height={70} style={{ display:'block', margin:'0 auto' }} />
          </Panel>
          <Panel label={t('score')}><Stat>{display.score.toLocaleString()}</Stat></Panel>
          <Panel label={t('level')}><Stat>{display.level}</Stat></Panel>
          <Panel label={t('lines')}><Stat>{display.lines}</Stat></Panel>
          <Panel label={t('rank')}>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, color:'#c084fc' }}>{RANK_NAMES[rankIdx]}</div>
          </Panel>
        </div>

        {/* Board */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <canvas ref={canvasRef} width={COLS*BLOCK} height={ROWS*BLOCK}
            style={{ display:'block', border:'1px solid rgba(120,80,255,0.4)', borderRadius:4 }}
            onClick={() => { if (gameStateRef.current==='idle') startGame() }}
          />
          {(gameState==='idle'||gameState==='paused') && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(7,7,26,0.8)', borderRadius:4 }}>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:'#c084fc', letterSpacing:3, textShadow:'0 0 20px rgba(192,132,252,0.6)' }}>
                {gameState==='paused' ? t('paused') : 'TETRIX'}
              </div>
              <div style={{ fontSize:11, color:'rgba(192,132,252,0.6)', marginTop:8, letterSpacing:2 }}>
                {gameState==='paused' ? t('tapToResume') : t('tapToStart')}
              </div>
              {gameState==='idle' && (
                <button onClick={startGame} style={{ marginTop:16, fontFamily:"'Orbitron',sans-serif", fontSize:11, background:'rgba(120,80,255,0.2)', border:'1px solid rgba(120,80,255,0.5)', color:'#c084fc', borderRadius:8, padding:'10px 20px', cursor:'pointer', letterSpacing:2 }}>▶ START</button>
              )}
              {gameState==='paused' && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, marginTop:16 }}>
                  <button onClick={togglePause} style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, background:'rgba(120,80,255,0.2)', border:'1px solid rgba(120,80,255,0.5)', color:'#c084fc', borderRadius:8, padding:'10px 24px', cursor:'pointer', letterSpacing:2 }}>{t('resume')}</button>
                  <button onClick={() => { cancelAnimationFrame(animRef.current); navigate('/menu') }} style={{ fontFamily:"'Orbitron',sans-serif", fontSize:10, letterSpacing:1, background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.3)', color:'#f87171', borderRadius:8, padding:'9px 24px', cursor:'pointer' }}>✕ QUIT TO MENU</button>
                </div>
              )}
            </div>
          )}
          {showComboFlash && (
            <div style={{ position:'absolute', top:'45%', left:'50%', transform:'translate(-50%,-50%)', fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:'#fbbf24', textShadow:'0 0 16px #fbbf24', pointerEvents:'none', whiteSpace:'nowrap' }}>{comboText}</div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, width:100, flexShrink:0 }}>
          <Panel label="Next">
            <canvas ref={nextRef} width={90} height={200} style={{ display:'block', margin:'0 auto' }} />
          </Panel>
          <Panel label={t('combo')}><Stat>x{display.combo}</Stat></Panel>
          <Panel label={t('best')}><Stat style={{ fontSize:12 }}>{bestScore.toLocaleString()}</Stat></Panel>
          <button onClick={togglePause} style={{ fontFamily:"'Orbitron',sans-serif", fontSize:9, letterSpacing:1, background:'rgba(120,80,255,0.1)', border:'1px solid rgba(120,80,255,0.3)', color:'#c084fc', borderRadius:6, padding:'8px 4px', cursor:'pointer' }}>
            {gameState==='paused'?t('resume').replace('▶ ',''):t('pause')}
          </button>
          <button onClick={() => navigate('/menu')} style={{ fontFamily:"'Orbitron',sans-serif", fontSize:9, letterSpacing:1, background:'rgba(120,80,255,0.05)', border:'1px solid rgba(120,80,255,0.2)', color:'rgba(180,140,255,0.5)', borderRadius:6, padding:'8px 4px', cursor:'pointer' }}>{t('menu')}</button>
        </div>
      </div>

      {/* Touch controls */}
      <div style={{ width:'100%', maxWidth:500, marginTop:10 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5 }}>
          <div />
          <div {...tc(doRotate)}>↻</div>
          <div />
          <div {...tc(moveLeft)}>◀</div>
          <div {...tc(softDrop)}>▼</div>
          <div {...tc(moveRight)}>▶</div>
          <div {...tc(hardDrop)} style={{...tc(hardDrop).style, gridColumn:'span 3', fontSize:9, letterSpacing:1}}>HARD DROP ↓↓</div>
          <div {...tc(doHold)} style={{...tc(doHold).style, gridColumn:'span 3', fontSize:9, letterSpacing:1}}>HOLD PIECE</div>
        </div>
      </div>

      {/* Revive Offer */}
      {showReviveOffer && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(7,7,26,0.93)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'rgba(15,10,35,0.99)', border:'1px solid rgba(5,150,105,0.5)', borderRadius:16, padding:'28px 24px', width:'100%', maxWidth:320, textAlign:'center', boxShadow:'0 0 60px rgba(5,150,105,0.25)' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>💚</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:'#34d399', letterSpacing:2, marginBottom:8 }}>{t('revive')}</div>
            <div style={{ fontSize:13, color:'rgba(180,140,255,0.7)', marginBottom:20, lineHeight:1.6 }}>{t('reviveDesc')}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button onClick={handleReviveAd} style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, letterSpacing:2, background:'linear-gradient(135deg, #065f46, #059669)', border:'none', color:'#fff', borderRadius:8, padding:'14px', cursor:'pointer' }}>{t('watchAdRevive')}</button>
              <button onClick={handleDeclineRevive} style={{ fontFamily:"'Orbitron',sans-serif", fontSize:10, letterSpacing:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(120,80,255,0.25)', color:'rgba(180,140,255,0.5)', borderRadius:8, padding:'11px', cursor:'pointer' }}>{t('noThanks')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState==='gameover' && gameResult && (
        <GameOverModal result={gameResult} onReplay={startGame} onBoostAd={handleBoostAd} adsRemoved={adsRemoved} onMenu={() => navigate('/menu')} />
      )}

      {/* Boost indicator */}
      {boostActive && gameState==='playing' && (
        <div style={{ position:'fixed', top:8, left:'50%', transform:'translateX(-50%)', fontFamily:"'Orbitron',sans-serif", fontSize:10, letterSpacing:2, background:'rgba(217,119,6,0.2)', border:'1px solid rgba(217,119,6,0.5)', color:'#fbbf24', borderRadius:20, padding:'4px 14px', zIndex:50, pointerEvents:'none' }}>{t('boostActive')}</div>
      )}
    </div>
  )
}

function Panel({ label, children }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(120,80,255,0.25)', borderRadius:8, padding:'6px 8px' }}>
      <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:8, letterSpacing:2, color:'rgba(180,140,255,0.6)', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
      {children}
    </div>
  )
}
function Stat({ children, style: s }) {
  return <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:700, color:'#c084fc', ...s }}>{children}</div>
}
