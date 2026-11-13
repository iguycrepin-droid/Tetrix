import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, json } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'POST required' }, 405)

  const authHeader = req.headers.get('Authorization') ?? ''
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ ok: false, error: 'Invalid JSON' }, 400) }

  const { data, error } = await supabase.rpc('submit_score', {
    p_score: body.p_score,
    p_level: body.p_level,
    p_lines: body.p_lines,
    p_duration_seconds: body.p_duration_seconds,
    p_client_game_id: body.p_client_game_id,
  })

  if (error) {
    const implausible = /implausible/i.test(error.message || '')
    return json({ ok: false, error: implausible ? 'Score was rejected' : 'Score submit failed' }, implausible ? 400 : 500)
  }
  return json(data)
})
