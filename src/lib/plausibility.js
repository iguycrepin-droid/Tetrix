export const MAX_LEVEL = 20

function asInt(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.floor(n)
}

/**
 * Reject scores a real game cannot produce.
 * Keep this in sync with public.score_is_plausible in supabase_schema.sql.
 */
export function scoreIsPlausible({ score, level, lines, durationSeconds }) {
  const s = asInt(score)
  const lv = asInt(level)
  const ln = asInt(lines)
  const d = asInt(durationSeconds)
  if (s === null || lv === null || ln === null || d === null) return false
  if (s < 0 || ln < 0 || d < 0) return false
  if (lv < 1 || lv > MAX_LEVEL) return false
  if (ln > 5000 || d > 86400) return false
  if (lv > Math.floor(ln / 10) + 1) return false
  if (ln > d * 20 + 40) return false
  const cap = ln * 200000 + d * 500 + 2000
  if (s > cap) return false
  return true
}
