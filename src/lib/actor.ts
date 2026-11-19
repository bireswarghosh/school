import { query } from "@/lib/db"
import { getCurrentSession } from "@/lib/auth"

export type Actor = {
  id: number
  name: string
  username: string
  role: string
}

/**
 * Resolves the currently logged-in user on the server from the signed session
 * cookie. Use this instead of trusting a client-supplied "createdBy" value —
 * it prevents every payment/receipt from being stamped with a generic "Admin".
 */
export async function getCurrentActor(): Promise<Actor | null> {
  try {
    const session = await getCurrentSession()
    if (!session) return null
    const res = await query("SELECT id, name, username, role FROM users WHERE id = $1", [session.uid])
    const user = res.rows[0]
    if (!user) return null
    return {
      id: Number(user.id),
      name: String(user.name || "").trim(),
      username: String(user.username || "").trim(),
      role: String(user.role || session.role || ""),
    }
  } catch {
    return null
  }
}

/** Human label for an actor: display name first, username as a fallback. */
export function actorLabel(actor: Actor | null): string | null {
  if (!actor) return null
  return actor.name || actor.username || null
}
