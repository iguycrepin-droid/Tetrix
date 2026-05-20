import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useI18n } from '../lib/i18n'
import { Avatar, AvatarPicker, RankBadge, Input, Btn, Card, SectionTitle, getRank, RANK_INFO } from '../components/UI'

export function ProfilePage() {
  const { user, profile, loading, updateProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile?.username || '')
  const [avatarId, setAvatarId] = useState(profile?.avatar_id ?? 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Delete account state
  const [showDelete, setShowDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  // FIX #12: navigate in effect not render
  useEffect(() => {
    if (!user && !loading) navigate('/login')
  }, [user, loading])

  if (!user) return null

  const score = profile?.best_score || 0
  const rank = getRank(score)
  const nextRank = RANK_INFO.find(r => r.min > score)
  const rankPct = nextRank
    ? Math.min(100, Math.floor(((score - rank.min) / (nextRank.min - rank.min)) * 100))
    : 100

  async function handleSave() {
    if (!username.trim() || username.length < 3) return setError('Username must be 3+ characters')
    setSaving(true); setError('')
    try {
      await updateProfile({ username: username.trim(), avatar_id: avatarId })
      setEditing(false)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (deleteInput !== 'DELETE') return
    setDeleting(true)
    try {
      // Delete all user data in order
      await supabase.from('purchases').delete().eq('user_id', user.id)
      await supabase.from('scores').delete().eq('user_id', user.id)
      await supabase.from('profiles').delete().eq('id', user.id)
      await supabase.auth.admin?.deleteUser(user.id).catch(() => {})
      // Sign out — account is deleted server-side via RLS cascade
      await signOut()
      navigate('/login')
    } catch (err) {
      setError('Delete failed: ' + err.message)
      setDeleting(false)
    }
  }

  const stats = [
    { label: t('bestScore'),  value: score.toLocaleString() },
    { label: t('bestLevel'),  value: profile?.best_level || 1 },
    { label: t('totalGames'), value: profile?.total_games || 0 },
    { label: t('totalLines'), value: (profile?.total_lines || 0).toLocaleString() },
    { label: t('playTime'),   value: formatTime(profile?.playtime_seconds || 0) },
  ]

  return (
    <div style={{
      minHeight: '100vh', padding: '20px 16px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(120,80,255,0.1) 0%, transparent 60%)',
      maxWidth: 480, margin: '0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => navigate('/menu')} style={{
          background: 'none', border: 'none', color: 'rgba(180,140,255,0.6)',
          fontFamily: "'Orbitron',sans-serif", fontSize: 11, cursor: 'pointer', letterSpacing: 1,
        }}>{t('back')}</button>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700, color: '#c084fc', letterSpacing: 3 }}>
          {t('profile').toUpperCase()}
        </div>
      </div>

      {/* Hero card */}
      <Card style={{ marginBottom: 16, textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Avatar avatarId={editing ? avatarId : profile?.avatar_id} size={72} />
          {editing ? (
            <>
              <AvatarPicker selected={avatarId} onSelect={setAvatarId} />
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder={t('username')} maxLength={20} style={{ textAlign: 'center' }} />
            </>
          ) : (
            <>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700, color: '#e0e0ff' }}>{profile?.username}</div>
              <div style={{ fontSize: 11, color: 'rgba(180,140,255,0.4)' }}>{user.email}</div>
            </>
          )}

          {/* Rank progress */}
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(120,80,255,0.2)', borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <RankBadge score={score} />
              {nextRank && <span style={{ fontSize: 10, color: 'rgba(180,140,255,0.4)' }}>{nextRank.min.toLocaleString()} for {nextRank.name}</span>}
            </div>
            <div style={{ height: 6, background: 'rgba(120,80,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${rankPct}%`, background: `linear-gradient(90deg, #7c3aed, ${rank.color})`, borderRadius: 3, transition: 'width 0.5s' }} />
            </div>
          </div>

          {error && <div style={{ fontSize: 12, color: '#f87171' }}>{error}</div>}

          {editing ? (
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <Btn onClick={handleSave} loading={saving} style={{ flex: 1 }}>{t('save')}</Btn>
              <Btn variant="ghost" onClick={() => { setEditing(false); setError('') }} style={{ flex: 1 }}>{t('cancel')}</Btn>
            </div>
          ) : (
            <Btn variant="ghost" onClick={() => setEditing(true)} style={{ width: '100%' }}>{t('editProfile')}</Btn>
          )}
        </div>
      </Card>

      {/* Stats grid */}
      <SectionTitle>{t('statistics')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(120,80,255,0.15)',
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 700, color: '#c084fc' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(180,140,255,0.5)', marginTop: 4, letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Delete account */}
      <SectionTitle>{t('deleteAccount')}</SectionTitle>
      {!showDelete ? (
        <Btn variant="danger" onClick={() => setShowDelete(true)}>{t('deleteAccount')}</Btn>
      ) : (
        <Card style={{ borderColor: 'rgba(220,38,38,0.35)' }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, color: '#f87171', marginBottom: 10 }}>{t('deleteConfirmTitle')}</div>
          <div style={{ fontSize: 12, color: 'rgba(180,140,255,0.6)', marginBottom: 14, lineHeight: 1.6 }}>{t('deleteConfirmDesc')}</div>
          <Input
            value={deleteInput}
            onChange={e => setDeleteInput(e.target.value)}
            placeholder={t('typeToConfirm')}
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="danger" onClick={handleDelete} loading={deleting}
              style={{ opacity: deleteInput === 'DELETE' ? 1 : 0.4, flex: 1 }}>
              {t('deleteBtn')}
            </Btn>
            <Btn variant="ghost" onClick={() => { setShowDelete(false); setDeleteInput('') }} style={{ flex: 1 }}>{t('cancel')}</Btn>
          </div>
        </Card>
      )}
    </div>
  )
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${seconds}s`
}
