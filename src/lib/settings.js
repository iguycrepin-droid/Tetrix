export const SETTINGS_KEY = 'tetrix_settings'

export const DEFAULT_SETTINGS = {
  musicOn: true,
  sfxOn: true,
  musicVol: 0.6,
  sfxVol: 0.8,
  ghostPiece: true,
  hardDropConfirm: false,
  showCombo: true,
  animations: true,
  gridLines: true,
}

export function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

/** Premium cosmetic/gameplay toggles. Free players always get the locked-off behaviour. */
export function premiumOn(settings, isPremium, key) {
  return Boolean(isPremium && settings?.[key])
}
