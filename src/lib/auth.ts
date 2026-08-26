import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import { headers } from "next/headers"
import { verifySession, signSession, SESSION_COOKIE, type SessionPayload } from "@/lib/session"

export { verifySession, signSession, SESSION_COOKIE, type SessionPayload } from "@/lib/session"

// ---------- Password hashing (scrypt, node-only) ----------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `scrypt$${salt}$${hash}`
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false
  const [scheme, salt, hash] = stored.split("$")
  if (scheme !== "scrypt" || !salt || !hash) return false
  try {
    const candidate = scryptSync(password, salt, 64)
    const expected = Buffer.from(hash, "hex")
    return candidate.length === expected.length && timingSafeEqual(candidate, expected)
  } catch {
    return false
  }
}

// ---------- Request helpers ----------
export function getSessionSchoolId(req: Request): number | null {
  const raw = req.headers.get("x-school-id")
  if (!raw) return null
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}

export function getSessionUserId(req: Request): number | null {
  const raw = req.headers.get("x-user-id")
  if (!raw) return null
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}

export function getSessionRole(req: Request): string | null {
  return req.headers.get("x-role")
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const h = await headers()
  const cookie = h.get("cookie") || ""
  const match = cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${SESSION_COOKIE}=`))
  if (!match) return null
  const value = decodeURIComponent(match.split("=").slice(1).join("="))
  return verifySession(value)
}