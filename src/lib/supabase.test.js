import { expect, it } from 'vitest'
import { supabase, supabaseConfigured } from './supabase'

it('loads without throwing when Supabase env vars are absent', () => {
  expect(typeof supabaseConfigured).toBe('boolean')
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    expect(supabaseConfigured).toBe(false)
    expect(supabase).toBeNull()
  }
})
