// Edge-safe session module (Web Crypto only — safe for proxy.ts/middleware runtime)
export const AUTH_SECRET = process.env.AUTH_SECRET || "smart-school-dev-secret-change-me"
export const SESSION_COOKIE = "smart_school_session"

export type SessionPayload = {
  uid: number
  sid: number | null
  role: string
  name: string
  exp: number
}

function b64encode(value: string): string {
  return btoa(unescape(encodeURIComponent(value)))
}
function b64decode(value: string): string {
  return decodeURIComponent(escape(atob(value)))
}

async function hmacSecret(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

async function hmacSign(data: string): Promise<string> {
  const key = await hmacSecret()
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data))
  return b64encode(String.fromCharCode(...new Uint8Array(sig)))
}

export async function signSession(payload: Omit<SessionPayload, "exp">): Promise<string> {
  const data = b64encode(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }))
  const sig = await hmacSign(data)
  return `${data}.${sig}`
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null
  const [data, sig] = token.split(".")
  if (!data || !sig) return null
  const expected = await hmacSign(data)
  if (expected !== sig) return null
  try {
    const payload = JSON.parse(b64decode(data)) as SessionPayload
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}