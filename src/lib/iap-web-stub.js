// Web/dev stub for the native-only "@capacitor-community/in-app-purchases" plugin.
// The plugin only exists on-device (Capacitor Android build). On web/dev the
// dynamic import in iap.js is expected to fail gracefully, but the Vite dev
// server needs the specifier to resolve. This stub provides a harmless module
// so getIAP() falls back to the web mock path.
export const InAppPurchases = null
export default { InAppPurchases }
