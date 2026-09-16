// Edge-safe session module (Web Crypto only — safe for proxy.ts/middleware runtime)
export const AUTH_SECRET = process.env.AUTH_SECRET || "smart-school-dev-secret-change-me"
export const SESSION_COOKIE = "smart_school_session"
export const MAX_IMPERSONATION_DEPTH = 6

// One level of the "login as" trail. Each step records the account that
// started an impersonation (the actor) and where it should be returned to
// when it stops acting as the current user.
export type ImpersonationStep = {
  uid: number
  role: string
  sid: number | null
  name?: string
  ret?: string
}

export type SessionPayload = {
  uid: number
  sid: number | null
  role: string
  name: string
  exp: number
  // Impersonation ("login as") trail — present when the current account was
  // reached via /api/auth/impersonate. Stack[0] is the outermost original
  // account; the last entry is the account that impersonated the current one.
  // Each hop back pops one level via /api/auth/impersonate/back.
  stack?: ImpersonationStep[]
  // Legacy single-level impersonation claims (older sessions). Kept for
  // compatibility — new sessions always use `stack`.
  origUid?: number
  origRole?: string
  origSid?: number | null
  origName?: string
  // Where the admin should be returned after impersonation (e.g. a student profile page).
  ret?: string
}

export function pushImpersonationStep(
  stack: ImpersonationStep[] | undefined,
  step: ImpersonationStep
): ImpersonationStep[] {
  const next = [...(stack || [])]
  if (next.length >= MAX_IMPERSONATION_DEPTH) next.shift()
  if (!next.some((s) => s.uid === step.uid)) next.push(step)
  return next
}

/** Normalises an older single-level impersonation token into a stack. */
export function stackFromSession(payload: SessionPayload): ImpersonationStep[] {
  if (payload.stack && payload.stack.length > 0) return payload.stack
  if (payload.origUid) {
    return [
      {
        uid: payload.origUid,
        role: payload.origRole || "admin",
        sid: payload.origSid ?? null,
        name: payload.origName,
        ret: payload.ret,
      },
    ]
  }
  return []
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