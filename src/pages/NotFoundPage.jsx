import { useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { t } = useI18n()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
      background: 'radial-gradient(ellipse at 50% 40%, rgba(120,80,255,0.12) 0%, transparent 70%)',
    }}>
      {/* Broken grid visual */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        {[...Array(16)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 22, height: 22,
            background: i % 3 === 0 ? 'rgba(120,80,255,0.3)' : i % 5 === 0 ? 'rgba(192,132,252,0.2)' : 'rgba(120,80,255,0.08)',
            border: '1px solid rgba(120,80,255,0.2)',
            borderRadius: 4,
            left: (i % 4) * 28 + Math.sin(i) * 6,
            top: Math.floor(i / 4) * 28 + Math.cos(i) * 6,
            transform: `rotate(${Math.sin(i) * 15}deg)`,
          }} />
        ))}
        <div style={{ width: 4 * 28, height: 4 * 28 }} />
      </div>

      <div style={{
        fontFamily: "'Orbitron',sans-serif", fontSize: 48, fontWeight: 900,
        color: 'rgba(120,80,255,0.4)', letterSpacing: 4, marginBottom: 16,
      }}>404</div>

      <div style={{
        fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 700,
        color: '#c084fc', letterSpacing: 3, marginBottom: 8,
      }}>{t('notFound')}</div>

      <div style={{
        fontSize: 12, color: 'rgba(180,140,255,0.5)',
        marginBottom: 32, letterSpacing: 1,
      }}>{t('notFoundDesc')}</div>

      <button onClick={() => navigate('/menu')} style={{
        fontFamily: "'Orbitron',sans-serif", fontSize: 11, letterSpacing: 2,
        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
        border: 'none', color: '#fff', borderRadius: 8,
        padding: '13px 28px', cursor: 'pointer',
      }}>{t('goHome')}</button>
    </div>
  )
}
