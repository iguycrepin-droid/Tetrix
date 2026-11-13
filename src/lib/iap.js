import { supabase, supabaseConfigured, SUPABASE_SETUP_MESSAGE } from './supabase'
import { isNativeApp } from './platform'

export const PRODUCT_REMOVE_ADS = 'tetrix_remove_ads'

let nativeMod = null

async function getNative() {
  if (!isNativeApp()) return null
  if (nativeMod) return nativeMod
  const mod = await import('@capgo/native-purchases')
  nativeMod = mod
  return mod
}

export async function initIAP() {
  const native = await getNative()
  if (!native) return
  try {
    await native.NativePurchases.isBillingSupported()
  } catch (e) {
    console.warn('IAP init failed:', e)
  }
}

export async function getProducts() {
  const fallback = [{
    id: PRODUCT_REMOVE_ADS,
    title: 'Remove Ads',
    description: 'Remove all banner and interstitial ads forever.',
    price: '$2.99',
  }]
  const native = await getNative()
  if (!native) return fallback
  try {
    const { products } = await native.NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_REMOVE_ADS],
      productType: native.PURCHASE_TYPE.INAPP,
    })
    if (!products?.length) return fallback
    return products.map(p => ({
      id: p.identifier,
      title: p.title,
      description: p.description,
      price: p.priceString || (p.price != null ? String(p.price) : '$2.99'),
    }))
  } catch {
    return fallback
  }
}

async function verifyWithServer(productId, purchaseToken) {
  if (!supabaseConfigured || !supabase) {
    return { success: false, error: SUPABASE_SETUP_MESSAGE }
  }
  const { data, error } = await supabase.functions.invoke('verify-purchase', {
    body: { productId, purchaseToken },
  })
  if (error) {
    let message = error.message || 'Verification failed'
    try {
      const body = await error.context?.json?.()
      if (body?.error) message = body.error
    } catch { /* response had no json body */ }
    return { success: false, error: message }
  }
  if (!data?.ok) return { success: false, error: data?.error || 'Verification failed' }
  return { success: true }
}

export async function purchaseRemoveAds() {
  const native = await getNative()
  if (!native) {
    if (import.meta.env.DEV) {
      const confirmed = window.confirm('[DEV] Send a dev purchase token to verify-purchase? It is accepted only when ALLOW_DEV_PURCHASES=true on that function.')
      if (!confirmed) return { success: false, error: 'Cancelled' }
      const token = `dev:${globalThis.crypto?.randomUUID?.() || Date.now()}`
      return verifyWithServer(PRODUCT_REMOVE_ADS, token)
    }
    return { success: false, error: 'Remove Ads is purchased in the Android app.' }
  }
  try {
    const result = await native.NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_REMOVE_ADS,
      productType: native.PURCHASE_TYPE.INAPP,
    })
    const token = result?.transactionId
    if (!token) return { success: false, error: 'Purchase cancelled' }
    return verifyWithServer(PRODUCT_REMOVE_ADS, token)
  } catch (e) {
    return { success: false, error: e?.message || 'Purchase failed' }
  }
}

export async function restorePurchases(userId) {
  if (!supabaseConfigured || !supabase || !userId) {
    return { restored: false, error: SUPABASE_SETUP_MESSAGE }
  }
  // @capgo/native-purchases 6.0.x restorePurchases() consumes acknowledged
  // one-time products. Do not call it for this non-consumable. Entitlement
  // lives on the signed-in profile after server verification.
  const { data, error } = await supabase.from('profiles').select('ads_removed').eq('id', userId).single()
  if (error) return { restored: false, error: error.message }
  if (data?.ads_removed) return { restored: true }
  return { restored: false }
}

export function adsAreRemoved(profile) {
  return profile?.ads_removed === true
}
