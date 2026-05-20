// In-App Purchases via @capacitor/google-pay / @ionic-native/in-app-purchase-2
// Uses the standard Capacitor community IAP plugin
// Falls back gracefully on web

import { supabase } from './supabase'

const PRODUCT_REMOVE_ADS = 'tetrix_remove_ads' // must match Play Console product ID

let IAPPlugin = null

async function getIAP() {
  if (IAPPlugin) return IAPPlugin
  try {
    // Try capacitor-community/in-app-purchases or cordova-plugin-purchase
    const mod = await import('@capacitor-community/in-app-purchases')
    IAPPlugin = mod.InAppPurchases
    return IAPPlugin
  } catch {
    return null // web
  }
}

// ─── Initialize & register products ──────────────────────────
export async function initIAP() {
  const iap = await getIAP()
  if (!iap) return
  try {
    await iap.initialize()
    await iap.registerProducts([
      { id: PRODUCT_REMOVE_ADS, type: 'NON_CONSUMABLE' }
    ])
  } catch (e) { console.warn('IAP init failed:', e) }
}

// ─── Get product details (price, title) ───────────────────────
export async function getProducts() {
  const iap = await getIAP()
  if (!iap) {
    // Return mock product for web/dev
    return [{ id: PRODUCT_REMOVE_ADS, title: 'Remove Ads', description: 'Remove all banner and interstitial ads forever.', price: '$2.99', priceMicros: 2990000 }]
  }
  try {
    const result = await iap.getProducts({ productIds: [PRODUCT_REMOVE_ADS] })
    return result.products || []
  } catch { return [] }
}

// ─── Purchase Remove Ads ───────────────────────────────────────
export async function purchaseRemoveAds(userId) {
  const iap = await getIAP()

  if (!iap) {
    // Web / dev simulation
    if (import.meta.env.DEV) {
      const confirmed = window.confirm('[DEV] Simulate purchase of Remove Ads ($2.99)?')
      if (confirmed && userId) {
        await recordPurchase(userId, PRODUCT_REMOVE_ADS, 'dev_token_' + Date.now())
        return { success: true }
      }
    }
    return { success: false, error: 'Not available on web' }
  }

  try {
    const result = await iap.purchaseProduct({ productId: PRODUCT_REMOVE_ADS })
    if (result.purchase?.purchaseToken) {
      // Verify server-side (Phase 3 backend) and record
      await recordPurchase(userId, PRODUCT_REMOVE_ADS, result.purchase.purchaseToken)
      await iap.finishTransaction({ purchase: result.purchase })
      return { success: true }
    }
    return { success: false, error: 'Purchase cancelled' }
  } catch (e) {
    return { success: false, error: e.message || 'Purchase failed' }
  }
}

// ─── Restore purchases ─────────────────────────────────────────
export async function restorePurchases(userId) {
  const iap = await getIAP()
  if (!iap) return { restored: false }
  try {
    const result = await iap.restorePurchases()
    const purchases = result.purchases || []
    const hasRemoveAds = purchases.some(p => p.productId === PRODUCT_REMOVE_ADS)
    if (hasRemoveAds && userId) {
      await recordPurchase(userId, PRODUCT_REMOVE_ADS, 'restored')
    }
    return { restored: hasRemoveAds }
  } catch (e) {
    return { restored: false, error: e.message }
  }
}

// ─── Record purchase in Supabase ──────────────────────────────
async function recordPurchase(userId, productId, token) {
  if (!userId) return

  // Upsert purchase record
  await supabase.from('purchases').upsert({
    user_id: userId,
    product_id: productId,
    purchase_token: token,
    verified: true,
  }, { onConflict: 'user_id,product_id' })

  // Mark ads_removed on profile
  if (productId === PRODUCT_REMOVE_ADS) {
    await supabase.from('profiles')
      .update({ ads_removed: true })
      .eq('id', userId)
  }
}

// ─── Check if ads are removed (from profile) ─────────────────
export function adsAreRemoved(profile) {
  return profile?.ads_removed === true
}
