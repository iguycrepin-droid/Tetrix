import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { initAdMob, showBanner } from '../lib/admob'
import { adsAreRemoved } from '../lib/iap'
import { useAuth } from '../hooks/useAuth'
import { Avatar, RankBadge, Btn, Card } from '../components/UI'
import { useI18n } from '../lib/i18n'

export function MenuPage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const adsRemoved = adsAreRemoved(profile)
  const { t } = useI18n()

  useEffect(() => {
    initAdMob(adsRemoved).then(() => {
      if (!adsRemoved) showBanner(adsRemoved)
    })
  }, [adsRemoved])
  const isGuest = !user

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px',
      background: `
        radial-gradient(ellipse at 50% -10%, rgba(120,80,255,0.18) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 80%, rgba(56,189,248,0.06) 0%, transparent 50%)
      `,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{
          fontFamily: "'Orbitron',sans-serif", fontSize: 48, fontWeight: 900,
          color: '#c084fc', letterSpacing: 8,
          textShadow: '0 0 40px rgba(192,132,252,0.6), 0 0 80px rgba(192,132,252,0.2)',
          lineHeight: 1,
        }}>TETRIX</div>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: 'rgba(180,140,255,0.4)', letterSpacing: 4, marginTop: 8 }}>
          BLOCK DROP ARENA
        </div>
      </div>

      {/* Player card */}
      <Card style={{ width: '100%', maxWidth: 340, marginBottom: 24 }}>
        {isGuest ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: '#c084fc' }}>{t('guestPlayer')}</div>
              <div style={{ fontSize: 11, color: 'rgba(180,140,255,0.4)', marginTop: 2 }}>{t('scoresNotSaved')}</div>
            </div>
            <Btn variant="ghost" style={{ width: 'auto', padding: '8px 14px', fontSize: 9 }} onClick={() => navigate('/login')}>{t('signIn')}</Btn>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar avatarId={profile?.avatar_id} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, color: '#e0e0ff', fontWeight: 700 }}>
                {profile?.username || 'Player'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <RankBadge score={profile?.best_score || 0} />
                <span style={{ fontSize: 11, color: 'rgba(180,140,255,0.5)' }}>
                  {t('best')}: {(profile?.best_score || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Menu buttons */}
      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Btn onClick={() => navigate('/game')} style={{ fontSize: 14, padding: '16px', letterSpacing: 3 }}>
          {t('play')}
        </Btn>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Btn variant="ghost" onClick={() => navigate('/leaderboard')}>{t('leaderboard')}</Btn>
          {!isGuest && <Btn variant="ghost" onClick={() => navigate('/profile')}>{t('profile')}</Btn>}
          {isGuest && <Btn variant="ghost" onClick={() => navigate('/register')}>{t('register')}</Btn>}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Btn variant="ghost" onClick={() => navigate('/settings')}>{t('settings')}</Btn>
          <Btn variant="ghost" onClick={() => navigate('/store')}>{t('store')}</Btn>
        </div>
        {!isGuest && (
          <Btn variant="danger" onClick={signOut} style={{ fontSize: 9 }}>{t('signOut')}</Btn>
        )}
      </div>

      {/* Quick stats */}
      {!isGuest && profile && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10,
          width: '100%', maxWidth: 340, marginTop: 20,
        }}>
          {[
            { label: t('games'), value: profile.total_games || 0 },
            { label: t('lines'), value: (profile.total_lines || 0).toLocaleString() },
            { label: t('level'), value: profile.best_level || 1 },
          ].map(s => (
            <div key={s.label} style={{
              textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(120,80,255,0.15)',
              borderRadius: 8, padding: '10px 8px',
            }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700, color: '#c084fc' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(180,140,255,0.5)', marginTop: 2, letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 32, fontSize: 10, color: 'rgba(120,80,255,0.3)', letterSpacing: 2 }}>v1.0</div>
    </div>
  )
}
