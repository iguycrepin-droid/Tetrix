import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScores } from '../hooks/useScores'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../lib/i18n'
import { Avatar, RankBadge, Tabs, Card } from '../components/UI'

const MEDAL = ['🥇','🥈','🥉']

export function LeaderboardPage() {
  const [tab, setTab] = useState('alltime')
  const [data, setData] = useState([])
  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { getLeaderboard, getPersonalBests } = useScores()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { t } = useI18n()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (tab === 'personal') {
        const d = await getPersonalBests(10)
        setPersonal(d || [])
      } else {
        const d = await getLeaderboard(tab)
        setData(d || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tab, user])

  useEffect(() => { load() }, [load])

  const tabs = [
    { id: 'alltime', label: t('allTime') },
    { id: 'weekly',  label: t('thisWeek') },
    ...(user ? [{ id: 'personal', label: t('myBests') }] : []),
  ]

  return (
    <div style={{
      minHeight: '100vh', padding: '20px 16px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(120,80,255,0.1) 0%, transparent 60%)',
      maxWidth: 480, margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => navigate('/menu')} style={{
          background: 'none', border: 'none', color: 'rgba(180,140,255,0.6)',
          fontFamily: "'Orbitron',sans-serif", fontSize: 11, cursor: 'pointer', letterSpacing: 1,
        }}>{t('back')}</button>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700, color: '#c084fc', letterSpacing: 3 }}>
          {t('leaderboard').toUpperCase()}
        </div>
      </div>

      {/* Signed-in user highlight */}
      {user && profile && tab !== 'personal' && (
        <Card style={{ marginBottom: 16, borderColor: 'rgba(192,132,252,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar avatarId={profile.avatar_id} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, color: '#e0e0ff' }}>{profile.username}</div>
              <div style={{ fontSize: 11, color: 'rgba(180,140,255,0.5)', marginTop: 2 }}>
                {t('yourBest')}: {(profile.best_score || 0).toLocaleString()}
              </div>
            </div>
            <RankBadge score={profile.best_score || 0} />
          </div>
        </Card>
      )}

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* Error state */}
      {error && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#f87171', fontSize: 12 }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {!error && loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(180,140,255,0.4)', fontFamily: "'Orbitron',sans-serif", fontSize: 11, letterSpacing: 2 }}>
          {t('loading')}
        </div>
      )}

      {/* Content */}
      {!error && !loading && (
        tab === 'personal'
          ? <PersonalBests data={personal} noScoresLabel={t('playForBests')} />
          : <GlobalBoard data={data} userId={user?.id} noScoresLabel={t('noScores')} />
      )}
    </div>
  )
}

function GlobalBoard({ data, userId, noScoresLabel }) {
  if (!data.length) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(180,140,255,0.3)', fontSize: 12 }}>
      {noScoresLabel}
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.map((entry, i) => {
        const isMe = entry.id === userId || entry.user_id === userId
        const uname = entry.username || entry.profiles?.username || 'Player'
        const avatarId = entry.avatar_id ?? entry.profiles?.avatar_id ?? 0
        const score = entry.best_score || entry.score || 0
        const level = entry.best_level || entry.level_reached || 1
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: isMe ? 'rgba(192,132,252,0.08)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${isMe ? 'rgba(192,132,252,0.35)' : 'rgba(120,80,255,0.15)'}`,
            borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{
              fontFamily: "'Orbitron',sans-serif", fontSize: i < 3 ? 18 : 13,
              color: i < 3 ? '#fbbf24' : 'rgba(180,140,255,0.4)',
              minWidth: 28, textAlign: 'center',
            }}>
              {i < 3 ? MEDAL[i] : `#${i+1}`}
            </div>
            <Avatar avatarId={avatarId} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, color: isMe ? '#c084fc' : '#e0e0ff', fontWeight: isMe ? 700 : 400 }}>
                {uname}{isMe ? ' (you)' : ''}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(180,140,255,0.4)', marginTop: 2 }}>Lv.{level}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, color: '#c084fc', fontWeight: 700 }}>
                {score.toLocaleString()}
              </div>
              <RankBadge score={score} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PersonalBests({ data, noScoresLabel }) {
  if (!data.length) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(180,140,255,0.3)', fontSize: 12 }}>
      {noScoresLabel}
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.map((entry, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(120,80,255,0.15)',
          borderRadius: 10, padding: '12px 14px',
        }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: 'rgba(180,140,255,0.4)', minWidth: 24 }}>#{i+1}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, color: '#c084fc' }}>{entry.score.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'rgba(180,140,255,0.4)', marginTop: 2 }}>
              Lv.{entry.level_reached} · {entry.lines_cleared} lines · {new Date(entry.created_at).toLocaleDateString()}
            </div>
          </div>
          <RankBadge score={entry.score} />
        </div>
      ))}
    </div>
  )
}
