import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { query } from "@/lib/db"
import { verifySession, signSession, SESSION_COOKIE } from "@/lib/auth"
import { pushImpersonationStep } from "@/lib/session"

export async function POST(req: NextRequest) {
  try {
    const store = await cookies()
    const rawToken = store.get(SESSION_COOKIE)?.value
    const session = rawToken ? await verifySession(decodeURIComponent(rawToken)) : null
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Re-verify the acting user against the DB (not just the signed claim)
    const actorResult = await query(`SELECT id, name, role, school_id, status FROM users WHERE id = $1`, [session.uid])
    const actor = actorResult.rows[0]
    if (!actor || !["admin", "super_admin"].includes(actor.role)) {
      return NextResponse.json({ error: "Only administrators can impersonate" }, { status: 403 })
    }
    if (actor.status && String(actor.status).toLowerCase() !== "active") {
      return NextResponse.json({ error: "Your account is disabled" }, { status: 403 })
    }

    const { userId, returnUrl } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const returnPath = typeof returnUrl === "string" && returnUrl.startsWith("/") && !returnUrl.startsWith("//")
      ? returnUrl
      : null

    const targetResult = await query(
      `SELECT id, name, email, username, role, school_id, status FROM users WHERE id = $1`,
      [Number(userId)]
    )
    const target = targetResult.rows[0]
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    if (["super_admin"].includes(target.role)) {
      return NextResponse.json({ error: "Super admin accounts cannot be impersonated" }, { status: 400 })
    }
    if (target.status && String(target.status).toLowerCase() !== "active") {
      return NextResponse.json({ error: "Target account is disabled" }, { status: 403 })
    }
    if (actor.role !== "super_admin") {
      if (!actor.school_id || Number(target.school_id) !== Number(actor.school_id)) {
        return NextResponse.json({ error: "You can only impersonate users in your own school" }, { status: 403 })
      }
    }

    // Record the account that is acting right now so we can step back to it
    // (and further back through nested logins) one level at a time.
    const stack = pushImpersonationStep(session.stack, {
      uid: Number(actor.id),
      role: actor.role,
      sid: actor.school_id ? Number(actor.school_id) : null,
      name: actor.name || session.name || "",
      ...(returnPath ? { ret: returnPath } : {}),
    })

    const token = await signSession({
      uid: Number(target.id),
      sid: target.school_id ? Number(target.school_id) : null,
      role: target.role,
      name: target.name || target.username || target.email,
      stack,
    })

    let redirect = "/admin"
    if (target.role === "student" || target.role === "parent" || target.role === "teacher") {
      redirect = "/portal"
    }

    const response = NextResponse.json({ redirect, impersonatedAs: target.role })
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      secure: req.nextUrl.protocol === "https:",
    })
    return response
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}