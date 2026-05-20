import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useScores } from '../hooks/useScores'
import { useI18n } from '../lib/i18n'
import { RankBadge, Btn, getRank } from './UI'

export function GameOverModal({ result, onReplay, onMenu, onBoostAd, adsRemoved }) {
  const { user, profile } = useAuth()
  const { submitScore } = useScores()
  const { t } = useI18n()
  const navigate = useNavigate()
  const submittedRef = useRef(false)
  const [rank, setRank] = useState(null)

  useEffect(() => {
    if (result && !submittedRef.current) {
      submittedRef.current = true
      setRank(getRank(result.score))
      if (user) {
        submitScore({
          score: result.score,
          level: result.level,
          lines: result.lines,
          duration: result.duration,
        })
      }
    }
  }, [result])

  if (!result) return null

  const isNewBest = result.score > (profile?.best_score || 0)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(7,7,26,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'rgba(15,10,35,0.98)',
        border: '1px solid rgba(192,132,252,0.4)',
        borderRadius: 16, padding: '28px 24px',
        width: '100%', maxWidth: 340,
        boxShadow: '0 0 60px rgba(120,80,255,0.3)',
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, color: '#c084fc', letterSpacing: 3, textShadow: '0 0 20px rgba(192,132,252,0.6)' }}>
            {t('gameOver')}
          </div>
          {isNewBest && (
            <div style={{ marginTop: 8, fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: '#fbbf24', letterSpacing: 2, textShadow: '0 0 12px #fbbf2488' }}>
              {t('newBest')}
            </div>
          )}
        </div>

        {/* Score */}
        <div style={{
          background: 'rgba(120,80,255,0.08)',
          border: '1px solid rgba(120,80,255,0.2)',
          borderRadius: 12, padding: '16px', marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 36, fontWeight: 900, color: '#e0e0ff' }}>
            {result.score.toLocaleString()}
          </div>
          <div style={{ marginTop: 6 }}>
            {rank && <RankBadge score={result.score} />}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { label: t('level'), value: result.level },
            { label: t('lines'), value: result.lines },
            { label: t('combo'), value: `x${result.maxCombo || 0}` },
          ].map(s => (
            <div key={s.label} style={{
              textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(120,80,255,0.15)',
              borderRadius: 8, padding: '10px 6px',
            }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: '#c084fc' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'rgba(180,140,255,0.5)', marginTop: 3, letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {!user && (
          <div style={{
            background: 'rgba(192,132,252,0.06)',
            border: '1px solid rgba(192,132,252,0.2)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 14,
            fontSize: 11, color: 'rgba(180,140,255,0.6)', textAlign: 'center',
          }}>
            {t('signInToSave')}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn onClick={onReplay} style={{ fontSize: 14, letterSpacing: 2 }}>{t('playAgain')}</Btn>
          {onBoostAd && (
            <button onClick={onBoostAd} style={{
              fontFamily: "'Orbitron',sans-serif", fontSize: 10, letterSpacing: 1.5,
              background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.4)',
              color: '#fbbf24', borderRadius: 8, padding: '10px', cursor: 'pointer', width: '100%',
            }}>
              ⚡ {adsRemoved ? t('watchAdBoost25') : t('watchAdBoost125')}
            </button>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Btn variant="ghost" onClick={() => navigate('/leaderboard')}>{t('leaderboard')}</Btn>
            <Btn variant="ghost" onClick={onMenu}>{t('menu')}</Btn>
          </div>
          {!user && <Btn variant="ghost" onClick={() => navigate('/login')}>{t('signIn')}</Btn>}
        </div>
      </div>
    </div>
  )
}
