const GOALS = [
  { type: 'lines', target: 10 },
  { type: 'lines', target: 20 },
  { type: 'score', target: 2000 },
  { type: 'score', target: 5000 },
  { type: 'tetris', target: 1 },
  { type: 'tspin', target: 1 },
]

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function dailyGoal(date = new Date()) {
  const day = todayKey(date)
  let hash = 0
  for (const ch of day) hash = (hash * 33 + ch.charCodeAt(0)) >>> 0
  return { ...GOALS[hash % GOALS.length], day }
}

export function isDailyComplete(day = todayKey()) {
  try { return localStorage.getItem('tetrix_daily_done') === day } catch { return false }
}

export function goalMet(goal, stats) {
  if (goal.type === 'lines') return (stats.lines || 0) >= goal.target
  if (goal.type === 'score') return (stats.score || 0) >= goal.target
  if (goal.type === 'tetris') return (stats.tetrises || 0) >= goal.target
  if (goal.type === 'tspin') return (stats.tspins || 0) >= goal.target
  return false
}

export function recordDaily(stats, date = new Date()) {
  const goal = dailyGoal(date)
  const met = goalMet(goal, stats)
  if (met) {
    try { localStorage.setItem('tetrix_daily_done', goal.day) } catch { /* private mode */ }
  }
  return { goal, met }
}
