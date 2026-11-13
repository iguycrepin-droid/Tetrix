import { isNativeApp } from './platform'

const CONSENT_KEY = 'tetrix_consent_v1'

const TEST_APP_UNITS = {
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
}

export function readConsent() {
  try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null') }
  catch { return null }
}

export function adsConsentGranted() {
  return readConsent()?.ads === true
}

function liveAdsRequested() {
  return import.meta.env.PROD && import.meta.env.VITE_ADMOB_USE_LIVE === 'true'
}

function adUnits() {
  if (!liveAdsRequested()) return TEST_APP_UNITS
  const live = {
    banner: import.meta.env.VITE_ADMOB_BANNER_ID,
    interstitial: import.meta.env.VITE_ADMOB_INTERSTITIAL_ID,
    rewarded: import.meta.env.VITE_ADMOB_REWARDED_ID,
  }
  if (!live.banner || !live.interstitial || !live.rewarded) {
    console.warn('[Tetrix] VITE_ADMOB_USE_LIVE is set but one or more ad unit ids are missing.')
    return null
  }
  return live
}

let AdMob = null
let initialized = false
let gameOverCount = 0
let interstitialReady = false

async function getAdMob() {
  if (!isNativeApp()) return null
  if (AdMob) return AdMob
  try {
    const mod = await import('@capacitor-community/admob')
    AdMob = mod.AdMob
    return AdMob
  } catch {
    return null
  }
}

export async function initAdMob(adsRemoved = false) {
  if (adsRemoved || !adsConsentGranted()) return
  if (initialized) return
  const units = adUnits()
  if (!units) return
  const am = await getAdMob()
  if (!am) return
  try {
    await am.initialize({
      requestTrackingAuthorization: true,
      testingDevices: [],
      initializeForTesting: !liveAdsRequested(),
    })
    initialized = true
    await preloadInterstitial()
  } catch (e) {
    console.warn('AdMob init failed:', e)
  }
}

export async function showBanner(adsRemoved = false) {
  if (adsRemoved || !adsConsentGranted()) return
  const units = adUnits()
  if (!units) return
  const am = await getAdMob()
  if (!am) return
  try {
    await am.showBanner({
      adId: units.banner,
      adSize: 'BANNER',
      position: 'BOTTOM_CENTER',
      margin: 0,
      isTesting: !liveAdsRequested(),
    })
  } catch (e) { console.warn('Banner failed:', e) }
}

export async function hideBanner() {
  const am = await getAdMob()
  if (!am) return
  try { await am.hideBanner() } catch { /* web or already hidden */ }
}

export async function removeBanner() {
  const am = await getAdMob()
  if (!am) return
  try { await am.removeBanner() } catch { /* web or already removed */ }
}

async function preloadInterstitial() {
  const units = adUnits()
  if (!units || !adsConsentGranted()) return
  const am = await getAdMob()
  if (!am) return
  try {
    await am.prepareInterstitial({ adId: units.interstitial, isTesting: !liveAdsRequested() })
    interstitialReady = true
  } catch (e) { console.warn('Interstitial preload failed:', e) }
}

export async function maybeShowInterstitial(adsRemoved = false) {
  if (adsRemoved || !adsConsentGranted()) return
  gameOverCount++
  if (gameOverCount % 4 !== 0 || !interstitialReady) return
  const am = await getAdMob()
  if (!am) return
  try {
    await am.showInterstitial()
    interstitialReady = false
    await preloadInterstitial()
  } catch (e) { console.warn('Interstitial show failed:', e) }
}

export async function showRewardedAd(type = 'revive', adsRemoved = false) {
  if (!adsConsentGranted()) return { type, granted: false, reason: 'consent' }
  const am = await getAdMob()
  if (!am) {
    if (import.meta.env.DEV) {
      const mult = adsRemoved ? '2.5×' : '1.25×'
      return new Promise(resolve => {
        const confirmed = window.confirm(
          type === 'revive'
            ? '[DEV] Watch ad to REVIVE? (simulated)'
            : `[DEV] Watch ad for ${mult} SCORE BOOST? (simulated)`
        )
        resolve({ type, granted: confirmed })
      })
    }
    return { type, granted: false }
  }
  const units = adUnits()
  if (!units) return { type, granted: false }
  try {
    await am.prepareRewardVideoAd({ adId: units.rewarded, isTesting: !liveAdsRequested() })
    const result = await am.showRewardVideoAd()
    return { type, granted: !!result?.value }
  } catch (e) {
    console.warn('Rewarded ad failed:', e)
    return { type, granted: false }
  }
}
