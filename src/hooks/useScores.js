import { supabase, supabaseConfigured, SUPABASE_SETUP_MESSAGE } from '../lib/supabase'
import { useAuth } from './useAuth'

function isFunctionMissing(error) {
  if (!error) return false
  const status = error.context?.status
  if (status === 404) return true
  const msg = String(error.message || '')
  return /not found|Failed to send a request/i.test(msg)
}

export function useScores() {
  const { user, fetchProfile } = useAuth()

  async function submitScore({ score, level, lines, duration, clientGameId }) {
    if (!user || !supabase || !clientGameId) return { ok: false, reason: 'guest' }

    const args = {
      p_score: Math.floor(score),
      p_level: Math.floor(level),
      p_lines: Math.floor(lines),
      p_duration_seconds: Math.max(0, Math.floor(duration / 1000)),
      p_client_game_id: clientGameId,
    }

    let data = null
    let error = null
    const invoked = await supabase.functions.invoke('submit-score', { body: args })
    if (!invoked.error && invoked.data?.ok) {
      data = invoked.data
    } else if (isFunctionMissing(invoked.error)) {
      const rpc = await supabase.rpc('submit_score', args)
      data = rpc.data
      error = rpc.error
    } else {
      error = invoked.error
    }

    if (error) {
      console.warn('Score submit failed:', error.message || error)
      return { ok: false }
    }
    if (!data?.duplicate) {
      try { await fetchProfile(user.id) } catch (err) {
        console.warn('Profile refresh failed:', err.message)
      }
    }
    return data || { ok: true }
  }

  async function getLeaderboard(type = 'alltime', limit = 100) {
    if (!supabaseConfigured || !supabase) throw new Error(SUPABASE_SETUP_MESSAGE)
    if (type === 'weekly') {
      const { data, error } = await supabase
        .from('weekly_leaderboard')
        .select('*')
        .order('best_score', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data || []
    }
    const { data, error } = await supabase
      .from('leaderboard_view')
      .select('*')
      .order('best_score', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  }

  async function getPersonalBests(limit = 10) {
    if (!user || !supabase) return []
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('score', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  }

  return { submitScore, getLeaderboard, getPersonalBests }
}
