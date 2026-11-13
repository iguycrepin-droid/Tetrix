import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, json } from '../_shared/cors.ts'
import { verifyPlayProduct } from '../_shared/googlePlay.ts'

const PRODUCT = 'tetrix_remove_ads'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'POST required' }, 405)

  const authHeader = req.headers.get('Authorization') ?? ''
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return json({ ok: false, error: 'Not signed in' }, 401)

  let body: { productId?: string; purchaseToken?: string }
  try { body = await req.json() } catch { return json({ ok: false, error: 'Invalid JSON' }, 400) }

  const productId = body.productId || ''
  const purchaseToken = body.purchaseToken || ''
  if (productId !== PRODUCT || !purchaseToken) {
    return json({ ok: false, error: 'Unknown product' }, 400)
  }

  const devAllowed = Deno.env.get('ALLOW_DEV_PURCHASES') === 'true' && purchaseToken.startsWith('dev:')
  if (!devAllowed) {
    try {
      const verified = await verifyPlayProduct(productId, purchaseToken)
      if (!verified.ok) return json({ ok: false, error: verified.error }, verified.status)
    } catch {
      return json({ ok: false, error: 'Play verification failed' }, 502)
    }
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { data, error } = await admin.rpc('record_verified_purchase', {
    p_user_id: userData.user.id,
    p_product_id: productId,
    p_token: purchaseToken,
  })
  if (error) return json({ ok: false, error: 'Could not record purchase' }, 500)
  return json(data ?? { ok: true })
})
