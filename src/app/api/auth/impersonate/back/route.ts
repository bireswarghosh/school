import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { query } from "@/lib/db"
import { verifySession, signSession, SESSION_COOKIE } from "@/lib/auth"
import { stackFromSession } from "@/lib/session"

function defaultRedirectForRole(role: string | undefined): string {
  if (role === "super_admin") return "/saas"
  if (role === "teacher" || role === "student" || role === "parent") return "/portal"
  return "/admin"
}

export async function POST(req: NextRequest) {
  try {
    const store = await cookies()
    const rawToken = store.get(SESSION_COOKIE)?.value
    const session = rawToken ? await verifySession(decodeURIComponent(rawToken)) : null
    const stack = session ? stackFromSession(session) : []
    if (!session || stack.length === 0) {
      return NextResponse.json({ error: "No impersonated session found" }, { status: 401 })
    }

    // Pop the top of the trail — this is the account that impersonated the
    // current user. Any remaining stack keeps the deeper history alive so the
    // user can keep stepping back (e.g. student -> admin -> super admin).
    const step = stack[stack.length - 1]
    const remaining = stack.slice(0, -1)

    const origResult = await query(`SELECT id, name, role, school_id, status FROM users WHERE id = $1`, [step.uid])
    const orig = origResult.rows[0]
    if (!orig) {
      return NextResponse.json({ error: "Original account no longer exists" }, { status: 403 })
    }
    if (String(orig.status || "active").toLowerCase() !== "active") {
      return NextResponse.json({ error: "Original account is disabled" }, { status: 403 })
    }

    const token = await signSession({
      uid: Number(orig.id),
      sid: orig.school_id ? Number(orig.school_id) : null,
      role: orig.role || step.role || "admin",
      name: orig.name || step.name || "",
      stack: remaining.length > 0 ? remaining : undefined,
    })

    const returnPath =
      typeof step.ret === "string" && step.ret.startsWith("/") && !step.ret.startsWith("//")
        ? step.ret
        : defaultRedirectForRole(orig.role || step.role)

    const response = NextResponse.json({ redirect: returnPath, backStack: remaining.length })
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
