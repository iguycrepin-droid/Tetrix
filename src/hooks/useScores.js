import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useScores() {
  const { user, profile, updateProfile } = useAuth()

  async function submitScore({ score, level, lines, duration }) {
    if (!user) return

    const { error: scoreError } = await supabase.from('scores').insert({
      user_id: user.id,
      score,
      level_reached: level,
      lines_cleared: lines,
      duration_seconds: Math.floor(duration / 1000),
    })
    if (scoreError) console.warn('Score insert failed:', scoreError.message)

    const current = profile || {}
    const updates = {
      total_games: (current.total_games || 0) + 1,
      total_lines: (current.total_lines || 0) + lines,
      playtime_seconds: (current.playtime_seconds || 0) + Math.floor(duration / 1000),
    }
    if (score > (current.best_score || 0)) {
      updates.best_score = score
      updates.best_level = level
    }

    try {
      await updateProfile(updates)
    } catch (err) {
      console.warn('Profile update failed:', err.message)
    }
  }

  async function getLeaderboard(type = 'alltime', limit = 100) {
    if (type === 'weekly') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      // Fix: use two separate queries to avoid join RLS issues
      const { data: scores } = await supabase
        .from('scores')
        .select('score, level_reached, lines_cleared, created_at, user_id')
        .gte('created_at', weekAgo)
        .order('score', { ascending: false })
        .limit(limit)

      if (!scores || scores.length === 0) return []

      // Fetch profiles for the user_ids we got
      const userIds = [...new Set(scores.map(s => s.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_id')
        .in('id', userIds)

      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))

      return scores.map(row => ({
        ...row,
        username: profileMap[row.user_id]?.username,
        avatar_id: profileMap[row.user_id]?.avatar_id,
        best_score: row.score,
        best_level: row.level_reached,
      }))
    }
    const { data } = await supabase
      .from('leaderboard_view')
      .select('*')
      .order('best_score', { ascending: false })
      .limit(limit)
    return data || []
  }

  async function getPersonalBests(limit = 10) {
    if (!user) return []
    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('score', { ascending: false })
      .limit(limit)
    return data || []
  }

  return { submitScore, getLeaderboard, getPersonalBests }
}
