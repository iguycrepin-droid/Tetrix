import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const SUPABASE_SETUP_MESSAGE =
  'Guest mode: scores stay on this device. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable accounts, leaderboards, and purchases.'

export const supabase = supabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null
