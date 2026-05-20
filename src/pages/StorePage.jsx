import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { purchaseRemoveAds, restorePurchases, getProducts, adsAreRemoved } from '../lib/iap'
import { Card, Btn, SectionTitle } from '../components/UI'
import { useI18n } from '../lib/i18n'

export function StorePage() {
  const { user, profile, fetchProfile } = useAuth()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success'|'error', text }

  const alreadyOwned = adsAreRemoved(profile)
  const { t } = useI18n()

  useEffect(() => {
    getProducts().then(products => {
      if (products.length) setProduct(products[0])
    })
  }, [])

  async function handlePurchase() {
    if (!user) { navigate('/login'); return }
    setLoading(true); setMessage(null)
    const result = await purchaseRemoveAds(user.id)
    if (result.success) {
      await fetchProfile(user.id)
      setMessage({ type: 'success', text: '🎉 Ads removed! Thank you for your support.' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Purchase failed. Please try again.' })
    }
    setLoading(false)
  }

  async function handleRestore() {
    if (!user) { navigate('/login'); return }
    setRestoring(true); setMessage(null)
    const result = await restorePurchases(user.id)
    if (result.restored) {
      await fetchProfile(user.id)
      setMessage({ type: 'success', text: '✓ Purchase restored successfully.' })
    } else {
      setMessage({ type: 'error', text: 'No previous purchases found.' })
    }
    setRestoring(false)
  }

  return (
    <div style={{
      minHeight: '100vh', padding: '20px 16px',
      background: `
        radial-gradient(ellipse at 50% 0%, rgba(120,80,255,0.14) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 90%, rgba(251,191,36,0.05) 0%, transparent 50%)
      `,
      maxWidth: 480, margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button onClick={() => navigate('/menu')} style={{
          background: 'none', border: 'none', color: 'rgba(180,140,255,0.6)',
          fontFamily: "'Orbitron',sans-serif", fontSize: 11, cursor: 'pointer', letterSpacing: 1,
        }}>{t('back')}</button>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700, color: '#c084fc', letterSpacing: 3 }}>{t('store').toUpperCase()}</div>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          background: message.type === 'success' ? 'rgba(5,150,105,0.12)' : 'rgba(220,38,38,0.12)',
          border: `1px solid ${message.type === 'success' ? 'rgba(5,150,105,0.4)' : 'rgba(220,38,38,0.4)'}`,
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          fontSize: 13, color: message.type === 'success' ? '#34d399' : '#f87171',
          textAlign: 'center',
        }}>{message.text}</div>
      )}

      {/* Remove Ads card */}
      <SectionTitle>Premium</SectionTitle>
      <Card style={{
        marginBottom: 16,
        borderColor: alreadyOwned ? 'rgba(5,150,105,0.4)' : 'rgba(251,191,36,0.3)',
        background: alreadyOwned ? 'rgba(5,150,105,0.05)' : 'rgba(251,191,36,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12, flexShrink: 0,
            background: alreadyOwned ? 'rgba(5,150,105,0.2)' : 'rgba(251,191,36,0.12)',
            border: `1px solid ${alreadyOwned ? 'rgba(5,150,105,0.4)' : 'rgba(251,191,36,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>{alreadyOwned ? '✓' : '🚫'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 700, color: '#e0e0ff', marginBottom: 4 }}>
              Remove Ads
            </div>
            <div style={{ fontSize: 12, color: 'rgba(180,140,255,0.6)', lineHeight: 1.6 }}>
              {t('removeAdsDesc')}
            </div>
          </div>
        </div>

        {/* What you get */}
        <div style={{ marginBottom: 16 }}>
          {[
            { icon: '✓', text: 'No banner ads on menus' },
            { icon: '✓', text: 'No interstitial ads between games' },
            { icon: '★', text: 'Optional rewarded ads give 2× bonus' },
            { icon: '★', text: 'Synced to your account — survives reinstalls' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: i < 3 ? '1px solid rgba(120,80,255,0.07)' : 'none' }}>
              <span style={{ color: alreadyOwned ? '#34d399' : '#fbbf24', fontSize: 13, minWidth: 16 }}>{item.icon}</span>
              <span style={{ fontSize: 12, color: 'rgba(180,140,255,0.7)' }}>{item.text}</span>
            </div>
          ))}
        </div>

        {alreadyOwned ? (
          <div style={{
            background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)',
            borderRadius: 8, padding: '12px', textAlign: 'center',
            fontFamily: "'Orbitron',sans-serif", fontSize: 12, color: '#34d399', letterSpacing: 1,
          }}>{t('purchased')}</div>
        ) : (
          <Btn onClick={handlePurchase} loading={loading} style={{
            background: 'linear-gradient(135deg, #92400e, #b45309)',
            fontSize: 13, letterSpacing: 2,
          }}>
            {product ? `BUY — ${product.price}` : 'BUY — $2.99'}
          </Btn>
        )}
      </Card>

      {/* Rewarded ads info */}
      <SectionTitle>{t('rewardedAds')}</SectionTitle>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <RewardCard
            icon="💚"
            title={t('reviveLabel')}
            desc="Continue from your current board state. One revive per game."
            color="#059669"
          />
          <div style={{ height: 1, background: 'rgba(120,80,255,0.1)' }} />
          <RewardCard
            icon="⚡"
            title={t('boostLabel')}
            desc={alreadyOwned ? t('boostAdDescOwned') : t('boostAdDesc')}
            color="#d97706"
          />
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: 'rgba(180,140,255,0.35)', textAlign: 'center', lineHeight: 1.6 }}>
          {t('rewardedNote')}
        </div>
      </Card>

      {/* Restore purchases */}
      {!alreadyOwned && user && (
        <Btn variant="ghost" onClick={handleRestore} loading={restoring} style={{ marginBottom: 12 }}>
          Restore Previous Purchase
        </Btn>
      )}

      {!user && (
        <div style={{
          background: 'rgba(120,80,255,0.06)', border: '1px solid rgba(120,80,255,0.2)',
          borderRadius: 10, padding: '14px 16px', textAlign: 'center',
          fontSize: 12, color: 'rgba(180,140,255,0.6)',
        }}>
          {t('signInToPurchase')} 
          <span onClick={() => navigate('/login')} style={{ color: '#c084fc', cursor: 'pointer' }}>{t('signIn')} →</span>
        </div>
      )}
    </div>
  )
}

function RewardCard({ icon, title, desc, color }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>{icon}</div>
      <div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, color: '#e0e0ff', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'rgba(180,140,255,0.55)', lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  )
}
