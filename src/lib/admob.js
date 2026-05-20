// AdMob integration via @capacitor-community/admob
// Falls back gracefully on web (dev/Vercel)
// Ad unit IDs — replace test IDs with real ones before Play Store release

const AD_UNITS = {
  banner:       'ca-app-pub-7225653287350149/4233239144',
  interstitial: 'ca-app-pub-7225653287350149/8771249959',
  rewarded:     'ca-app-pub-7225653287350149/6599170734',
}

let AdMob = null
let initialized = false
let gameOverCount = 0
let interstitialReady = false

async function getAdMob() {
  if (AdMob) return AdMob
  try {
    const mod = await import('@capacitor-community/admob')
    AdMob = mod.AdMob
    return AdMob
  } catch {
    return null // web — no plugin
  }
}

export async function initAdMob(adsRemoved = false) {
  if (initialized || adsRemoved) return
  const am = await getAdMob()
  if (!am) return
  try {
    await am.initialize({
      requestTrackingAuthorization: true,
      testingDevices: [],
      initializeForTesting: false,
    })
    initialized = true
    await preloadInterstitial()
  } catch (e) {
    console.warn('AdMob init failed:', e)
  }
}

// ─── Banner ───────────────────────────────────────────────────
export async function showBanner(adsRemoved = false) {
  if (adsRemoved) return
  const am = await getAdMob()
  if (!am) return
  try {
    await am.showBanner({
      adId: AD_UNITS.banner,
      adSize: 'BANNER',
      position: 'BOTTOM_CENTER',
      margin: 0,
      isTesting: false,
    })
  } catch (e) { console.warn('Banner failed:', e) }
}

export async function hideBanner() {
  const am = await getAdMob()
  if (!am) return
  try { await am.hideBanner() } catch {}
}

export async function removeBanner() {
  const am = await getAdMob()
  if (!am) return
  try { await am.removeBanner() } catch {}
}

// ─── Interstitial ─────────────────────────────────────────────
// Show every 4th game over
async function preloadInterstitial() {
  const am = await getAdMob()
  if (!am) return
  try {
    await am.prepareInterstitial({ adId: AD_UNITS.interstitial, isTesting: false })
    interstitialReady = true
  } catch (e) { console.warn('Interstitial preload failed:', e) }
}

export async function maybeShowInterstitial(adsRemoved = false) {
  if (adsRemoved) return
  gameOverCount++
  if (gameOverCount % 4 !== 0) return // only every 4th
  if (!interstitialReady) return
  const am = await getAdMob()
  if (!am) return
  try {
    await am.showInterstitial()
    interstitialReady = false
    await preloadInterstitial() // preload next one
  } catch (e) { console.warn('Interstitial show failed:', e) }
}

// ─── Rewarded ─────────────────────────────────────────────────
// Returns: { type: 'revive' | 'boost', granted: boolean }
export async function showRewardedAd(type = 'revive', adsRemoved = false) {
  const am = await getAdMob()
  if (!am) {
    // Web fallback: simulate reward grant for testing
    if (import.meta.env.DEV) {
      return new Promise(resolve => {
        const confirmed = window.confirm(
          type === 'revive'
            ? '[DEV] Watch ad to REVIVE? (simulated)'
            : '[DEV] Watch ad for 1.25x SCORE BOOST? (simulated)'
        )
        resolve({ type, granted: confirmed })
      })
    }
    return { type, granted: false }
  }
  try {
    await am.prepareRewardVideoAd({ adId: AD_UNITS.rewarded, isTesting: false })
    const result = await am.showRewardVideoAd()
    return { type, granted: !!result?.value }
  } catch (e) {
    console.warn('Rewarded ad failed:', e)
    return { type, granted: false }
  }
}
