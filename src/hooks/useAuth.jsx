import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id, session.user)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id, session.user)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId, authUser) {
    let { data } = await supabase.from('profiles').select('*').eq('id', userId).single()

    // BUG FIX: Google OAuth users have no profile row — create it on first login
    if (!data) {
      const fallbackUser = authUser || { email: '', user_metadata: {} }
      const emailName = (fallbackUser.email || '').split('@')[0] || 'Player'
      const googleName = fallbackUser.user_metadata?.full_name || fallbackUser.user_metadata?.name
      const username = (googleName || emailName).slice(0, 20).replace(/[^a-zA-Z0-9_]/g, '_')

      const { data: inserted } = await supabase.from('profiles').insert({
        id: userId,
        username: username || 'Player',
        avatar_id: Math.floor(Math.random() * 8),
        best_score: 0,
        total_games: 0,
        total_lines: 0,
        playtime_seconds: 0,
      }).select().single()

      data = inserted
    }

    setProfile(data)
    setLoading(false)
  }

  async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        avatar_id: Math.floor(Math.random() * 8),
        best_score: 0,
        total_games: 0,
        total_lines: 0,
        playtime_seconds: 0,
      })
      if (data.session) {
        await fetchProfile(data.user.id, data.user)
      } else {
        setLoading(false)
        throw Object.assign(new Error('CHECK_EMAIL'), { code: 'CHECK_EMAIL' })
      }
    }
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function updateProfile(updates) {
    if (!user) return
    // Plain UPDATE — covered by RLS policy "Users can update own profile"
    const { data, error } = await supabase.from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select().single()
    if (error) {
      console.warn('updateProfile error:', error.message)
      // If row doesn't exist yet (Google OAuth edge case), create it
      if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
        const { data: inserted } = await supabase.from('profiles')
          .insert({ id: user.id, ...updates })
          .select().single()
        if (inserted) { setProfile(prev => ({ ...prev, ...inserted })); return inserted }
      }
      throw error
    }
    setProfile(data)
    return data
  }

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#07071a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000,
      }}>
        <div style={{
          fontFamily: "'Orbitron',sans-serif", fontSize: 13,
          color: 'rgba(192,132,252,0.6)', letterSpacing: 4,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>LOADING</div>
        <style>{'@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}'}</style>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signInWithGoogle, signOut, updateProfile, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
