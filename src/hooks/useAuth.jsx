import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigured, SUPABASE_SETUP_MESSAGE } from '../lib/supabase'

const AuthContext = createContext(null)

function offlineError() {
  return Object.assign(new Error(SUPABASE_SETUP_MESSAGE), { code: 'OFFLINE' })
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(supabaseConfigured)

  useEffect(() => {
    if (!supabase) return undefined
    let cancelled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id, session.user)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id, session.user)
      else { setProfile(null); setLoading(false) }
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId, authUser) {
    if (!supabase) return null
    let { data } = await supabase.from('profiles').select('*').eq('id', userId).single()

    if (!data) {
      const fallbackUser = authUser || { email: '', user_metadata: {} }
      const emailName = (fallbackUser.email || '').split('@')[0] || 'Player'
      const googleName = fallbackUser.user_metadata?.full_name || fallbackUser.user_metadata?.name
      const username = (googleName || emailName).slice(0, 20).replace(/[^a-zA-Z0-9_]/g, '_')

      const { data: inserted } = await supabase.from('profiles').insert({
        id: userId,
        username: username || 'Player',
        avatar_id: Math.floor(Math.random() * 8),
      }).select().single()

      data = inserted
    }

    setProfile(data)
    setLoading(false)
    return data
  }

  async function signUp(email, password, username) {
    if (!supabase) throw offlineError()
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        avatar_id: Math.floor(Math.random() * 8),
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
    if (!supabase) throw offlineError()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signInWithGoogle() {
    if (!supabase) throw offlineError()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) throw error
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  async function updateProfile(updates) {
    if (!supabase || !user) throw offlineError()
    const safe = {}
    if (typeof updates.username === 'string') safe.username = updates.username
    if (updates.avatar_id !== undefined) safe.avatar_id = updates.avatar_id
    const { data, error } = await supabase.from('profiles')
      .update(safe)
      .eq('id', user.id)
      .select().single()
    if (error) {
      console.warn('updateProfile error:', error.message)
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
    <AuthContext.Provider value={{
      user, profile, loading, configured: supabaseConfigured,
      signUp, signIn, signInWithGoogle, signOut, updateProfile, fetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
