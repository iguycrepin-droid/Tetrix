import { useState } from 'react'
import { useConsent } from '../components/ConsentBanner'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { adsAreRemoved } from '../lib/iap'
import { Card, SectionTitle, Btn } from '../components/UI'
import { useI18n, LANGUAGES } from '../lib/i18n'

export function SettingsPage() {
  const navigate = useNavigate()
  const { resetConsent } = useConsent()
  const { t, lang, setLanguage } = useI18n()
  const { profile } = useAuth()
  const isPremium = adsAreRemoved(profile)

  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tetrix_settings') || '{}') } catch { return {} }
  })

  function update(key, val) {
    const next = { ...settings, [key]: val }
    setSettings(next)
    localStorage.setItem('tetrix_settings', JSON.stringify(next))
  }

  // Free toggle — always interactive
  const Toggle = ({ label, sub, settingKey }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(120,80,255,0.08)' }}>
      <div>
        <div style={{ fontSize: 13, color: '#e0e0ff' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'rgba(180,140,255,0.4)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div onClick={() => update(settingKey, !settings[settingKey])} style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        background: settings[settingKey] ? '#7c3aed' : 'rgba(120,80,255,0.2)',
        border: '1px solid rgba(120,80,255,0.3)',
        position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: settings[settingKey] ? 22 : 3,
          width: 16, height: 16, borderRadius: '50%',
          background: settings[settingKey] ? '#fff' : 'rgba(180,140,255,0.5)',
          transition: 'left 0.2s',
        }} />
      </div>
    </div>
  )

  // Premium toggle — locked behind Remove Ads purchase
  const PremiumToggle = ({ label, sub, settingKey }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(120,80,255,0.08)', opacity: isPremium ? 1 : 0.45 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 13, color: isPremium ? '#e0e0ff' : 'rgba(180,140,255,0.5)' }}>{label}</div>
          {!isPremium && (
            <span style={{
              fontFamily: "'Orbitron',sans-serif", fontSize: 8, letterSpacing: 1,
              background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)',
              color: '#fbbf24', borderRadius: 4, padding: '2px 6px',
            }}>PRO</span>
          )}
        </div>
        {sub && <div style={{ fontSize: 11, color: 'rgba(180,140,255,0.3)', marginTop: 2 }}>{sub}</div>}
      </div>
      {isPremium ? (
        <div onClick={() => update(settingKey, !settings[settingKey])} style={{
          width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
          background: settings[settingKey] ? '#7c3aed' : 'rgba(120,80,255,0.2)',
          border: '1px solid rgba(120,80,255,0.3)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}>
          <div style={{
            position: 'absolute', top: 3, left: settings[settingKey] ? 22 : 3,
            width: 16, height: 16, borderRadius: '50%',
            background: settings[settingKey] ? '#fff' : 'rgba(180,140,255,0.5)',
            transition: 'left 0.2s',
          }} />
        </div>
      ) : (
        <div style={{ fontSize: 18, flexShrink: 0 }}>🔒</div>
      )}
    </div>
  )

  const Slider = ({ label, settingKey, min, max, defaultVal }) => (
    <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(120,80,255,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: '#e0e0ff' }}>{label}</div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, color: '#c084fc' }}>
          {Math.round((settings[settingKey] ?? defaultVal) * 100)}%
        </div>
      </div>
      <input type="range" min={min} max={max} step="0.05"
        value={settings[settingKey] ?? defaultVal}
        onChange={e => update(settingKey, parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#7c3aed' }}
      />
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', padding: '20px 16px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(120,80,255,0.08) 0%, transparent 60%)',
      maxWidth: 480, margin: '0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => navigate('/menu')} style={{
          background: 'none', border: 'none', color: 'rgba(180,140,255,0.6)',
          fontFamily: "'Orbitron',sans-serif", fontSize: 11, cursor: 'pointer', letterSpacing: 1,
        }}>{t('back')}</button>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700, color: '#c084fc', letterSpacing: 3 }}>
          {t('settings').toUpperCase()}
        </div>
      </div>

      {/* Audio — free for everyone */}
      <SectionTitle>{t('audio')}</SectionTitle>
      <Card style={{ marginBottom: 16 }}>
        <Toggle label={t('music')} sub={t('musicSub')} settingKey="musicOn" />
        <Toggle label={t('sfx')} sub={t('sfxSub')} settingKey="sfxOn" />
        <Slider label={t('musicVolume')} settingKey="musicVol" min={0} max={1} defaultVal={0.6} />
        <Slider label={t('sfxVolume')} settingKey="sfxVol" min={0} max={1} defaultVal={0.8} />
      </Card>

      {/* Gameplay — premium locked */}
      <SectionTitle>{t('gameplay')}</SectionTitle>
      <Card style={{ marginBottom: 16 }}>
        <PremiumToggle label={t('ghostPiece')} sub={t('ghostSub')} settingKey="ghostPiece" />
        <PremiumToggle label={t('hardDropConfirm')} sub={t('hardDropSub')} settingKey="hardDropConfirm" />
        <PremiumToggle label={t('showCombo')} settingKey="showCombo" />
      </Card>

      {/* Display — premium locked */}
      <SectionTitle>{t('display')}</SectionTitle>
      <Card style={{ marginBottom: 16 }}>
        <PremiumToggle label={t('animations')} sub={t('animSub')} settingKey="animations" />
        <Toggle label={t('gridLines')} sub={t('gridSub')} settingKey="gridLines" />
      </Card>

      {/* Unlock prompt for non-premium users */}
      {!isPremium && (
        <div onClick={() => navigate('/store')} style={{
          background: 'rgba(251,191,36,0.07)',
          border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: 10, padding: '14px 16px',
          marginBottom: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: '#fbbf24', letterSpacing: 1, marginBottom: 4 }}>
              🔓 UNLOCK PRO SETTINGS
            </div>
            <div style={{ fontSize: 11, color: 'rgba(180,140,255,0.5)' }}>
              Ghost piece, combos, animations & more — $2.99
            </div>
          </div>
          <div style={{ fontSize: 18 }}>→</div>
        </div>
      )}

      {/* Language — free for everyone */}
      <SectionTitle>{t('language')}</SectionTitle>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => setLanguage(l.code)} style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 12,
              background: lang === l.code ? 'rgba(120,80,255,0.25)' : 'rgba(255,255,255,0.03)',
              border: lang === l.code ? '1px solid rgba(192,132,252,0.6)' : '1px solid rgba(120,80,255,0.2)',
              borderRadius: 8, padding: '9px 10px', cursor: 'pointer',
              color: lang === l.code ? '#c084fc' : 'rgba(180,140,255,0.6)',
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>{l.flag}</span>
              <span>{l.nativeLabel}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Legal */}
      <SectionTitle>{t('legal')}</SectionTitle>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link to="/privacy" style={{ fontSize: 13, color: 'rgba(180,140,255,0.6)', textDecoration: 'none' }}>{t('privacyPolicy')} →</Link>
          <Link to="/terms" style={{ fontSize: 13, color: 'rgba(180,140,255,0.6)', textDecoration: 'none' }}>{t('termsOfUse')} →</Link>
          <div onClick={resetConsent} style={{ fontSize: 13, color: 'rgba(180,140,255,0.6)', cursor: 'pointer' }}>{t('manageConsent')}</div>
        </div>
      </Card>
    </div>
  )
}
