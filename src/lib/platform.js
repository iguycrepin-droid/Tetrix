export function isNativeApp() {
  const cap = typeof window !== 'undefined' ? window.Capacitor : undefined
  return Boolean(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform())
}
