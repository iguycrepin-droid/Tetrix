import { createContext, useContext, useState, useEffect } from 'react'
import { useI18n } from '../lib/i18n'

const CONSENT_KEY = 'tetrix_consent_v1'
const ConsentContext = createContext(null)

// FIX #13/#18: single context instance shared across entire app
export function ConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null') }
    catch { return null }
  })

  function grantAll() {
    const c = { analytics: true, ads: true, timestamp: Date.now() }
    localStorage.setItem(CONSENT_KEY, JSON.stringify(c))
    setConsent(c)
  }

  function grantEssentialOnly() {
    const c = { analytics: false, ads: false, timestamp: Date.now() }
    localStorage.setItem(CONSENT_KEY, JSON.stringify(c))
    setConsent(c)
  }

  function resetConsent() {
    localStorage.removeItem(CONSENT_KEY)
    setConsent(null)
  }

  return (
    <ConsentContext.Provider value={{ consent, needsConsent: consent === null, grantAll, grantEssentialOnly, resetConsent }}>
      {children}
    </ConsentContext.Provider>
  )
}

export const useConsent = () => useContext(ConsentContext)

export function ConsentBanner({ onAccept, onDecline }) {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 8000,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(7,7,26,0.7)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'rgba(12,8,30,0.99)',
        border: '1px solid rgba(120,80,255,0.35)',
        borderBottom: 'none',
        borderRadius: '16px 16px 0 0',
        padding: '20px 20px 32px',
        boxShadow: '0 -20px 60px rgba(120,80,255,0.2)',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)',
      }}>
        <div style={{ width: 40, height: 3, background: 'rgba(120,80,255,0.3)', borderRadius: 2, margin: '0 auto 16px' }} />
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700, color: '#c084fc', letterSpacing: 2, marginBottom: 10 }}>
          {t('yourPrivacy')}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(180,140,255,0.7)', lineHeight: 1.7, marginBottom: 12 }}>
          {t('consentDesc')}
        </p>
        {expanded && (
          <div style={{ marginBottom: 14 }}>
            {[
              { label: t('essential'), desc: t('essentialDesc'), always: true },
              { label: t('analytics'), desc: t('analyticsDesc') },
              { label: t('advertising'), desc: t('advertisingDesc') },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(120,80,255,0.1)' }}>
                <div style={{ width: 32, height: 18, borderRadius: 9, marginTop: 2, flexShrink: 0, background: 'rgba(120,80,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 3px' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: '#e0e0ff', letterSpacing: 1 }}>
                    {item.label} {item.always && <span style={{ color: 'rgba(180,140,255,0.4)' }}>(always on)</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(180,140,255,0.5)', marginTop: 3, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', color: 'rgba(180,140,255,0.5)', fontSize: 11, cursor: 'pointer', marginBottom: 14, padding: 0, letterSpacing: 1 }}>
          {expanded ? t('showLess') : t('managePrefs')}
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={onAccept} style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, letterSpacing: 2, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', color: '#fff', borderRadius: 8, padding: '13px', cursor: 'pointer', width: '100%' }}>{t('acceptAll')}</button>
          <button onClick={onDecline} style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, letterSpacing: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(120,80,255,0.25)', color: 'rgba(180,140,255,0.6)', borderRadius: 8, padding: '11px', cursor: 'pointer', width: '100%' }}>{t('essentialOnly')}</button>
        </div>
        <p style={{ fontSize: 10, color: 'rgba(120,80,255,0.35)', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
          {t('consentLegal')}
        </p>
      </div>
    </div>
  )
}
