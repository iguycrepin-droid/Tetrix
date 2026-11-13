/** Monday 00:00 UTC of the ISO week containing `date`. Matches Postgres date_trunc('week') in UTC. */
export function startOfIsoWeekUTC(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const sinceMonday = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - sinceMonday)
  return d
}
