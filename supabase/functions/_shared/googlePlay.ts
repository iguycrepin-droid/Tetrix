function bytesToBase64Url(bytes: Uint8Array) {
  let raw = ''
  for (const b of bytes) raw += String.fromCharCode(b)
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function pemToDer(pem: string) {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s+/g, '')
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

async function googleAccessToken(serviceAccount: { client_email: string; private_key: string }) {
  const now = Math.floor(Date.now() / 1000)
  const header = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const claim = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })))
  const unsigned = `${header}.${claim}`
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))
  const assertion = `${unsigned}.${bytesToBase64Url(new Uint8Array(sig))}`
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  const body = await res.json()
  if (!res.ok || !body.access_token) {
    throw new Error('Google auth failed')
  }
  return body.access_token as string
}

export async function verifyPlayProduct(productId: string, purchaseToken: string) {
  const raw = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON')
  if (!raw) {
    return { ok: false, status: 503, error: 'Play verification is not configured' }
  }
  const account = JSON.parse(raw)
  const packageName = Deno.env.get('ANDROID_PACKAGE_NAME') || 'com.tetrix.game'
  const access = await googleAccessToken(account)
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${access}` } })
  if (!res.ok) {
    return { ok: false, status: 402, error: 'Play could not verify this purchase' }
  }
  const purchase = await res.json()
  if (purchase.purchaseState !== 0) {
    return { ok: false, status: 402, error: 'Purchase is not in a purchased state' }
  }
  return { ok: true, status: 200 }
}
