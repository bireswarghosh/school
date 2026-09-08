import { randomBytes, createHmac, createHash, timingSafeEqual } from "node:crypto"
import { AUTH_SECRET } from "@/lib/session"

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

export function randomBase32(length = 32): string {
  const bytes = randomBytes(length)
  let out = ""
  let bits = 0
  let value = 0
  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out.slice(0, length)
}

function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, "").toUpperCase()
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const ch of clean) {
    const idx = B32.indexOf(ch)
    if (idx === -1) throw new Error("Invalid base32 character")
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

function hotp(secret: Buffer, counter: number): string {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const hmac = createHmac("sha1", secret).update(msg).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3]
  return String(code % 1_000_000).padStart(6, "0")
}

export function totpNow(secret: string, at = Date.now()): string {
  return hotp(base32Decode(secret), Math.floor(at / 30_000))
}

export function verifyTotp(secret: string, code: string, at = Date.now(), window = 1): boolean {
  const clean = String(code || "").replace(/[\s-]/g, "")
  if (!/^\d{6}$/.test(clean)) return false
  let key: Buffer
  try {
    key = base32Decode(secret)
  } catch {
    return false
  }
  const step = Math.floor(at / 30_000)
  const candidate = Buffer.from(clean)
  for (let i = -window; i <= window; i++) {
    const expected = Buffer.from(hotp(key, step + i))
    if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) return true
  }
  return false
}

export function otpauthUrl(secret: string, account: string, issuer = "Smart School"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}

// ---------- Short-lived 2FA challenge tokens (10 minutes) ----------
export type ChallengePayload = {
  uid: number
  sid: number | null
  role: string
  name: string
  redirect: string
}

function b64url(data: string): string {
  return Buffer.from(data).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function unb64url(data: string): string {
  const pad = (4 - (data.length % 4)) % 4
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad), "base64").toString()
}

export function signChallenge(payload: Omit<ChallengePayload, never>, ttlMs = 10 * 60 * 1000): string {
  const body = b64url(JSON.stringify({ ...payload, exp: Date.now() + ttlMs }))
  const sig = createHmac("sha256", AUTH_SECRET).update(body).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return `${body}.${sig}`
}

export function verifyChallenge(token: string): ChallengePayload | null {
  if (!token) return null
  const [body, sig] = token.split(".")
  if (!body || !sig) return null
  const expected = createHmac("sha256", AUTH_SECRET).update(body).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(unb64url(body))
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null
    if (typeof payload.uid !== "number") return null
    return payload as ChallengePayload
  } catch {
    return null
  }
}

// ---------- One-time backup codes ----------
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const part = () => randomBytes(3).toString("hex").toUpperCase()
    codes.push(`${part()}-${part()}`)
  }
  return codes
}

export function hashBackupCode(code: string): string {
  return createHash("sha256").update(String(code).replace(/[\s-]/g, "").toUpperCase()).digest("hex")
}

export function parseBackupHashes(stored: unknown): string[] {
  if (!stored) return []
  try {
    const arr = typeof stored === "string" ? JSON.parse(stored) : stored
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []
  } catch {
    return []
  }
}
