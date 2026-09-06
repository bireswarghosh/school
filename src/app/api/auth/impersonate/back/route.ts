import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { query } from "@/lib/db"
import { verifySession, signSession, SESSION_COOKIE } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const store = await cookies()
    const rawToken = store.get(SESSION_COOKIE)?.value
    const session = rawToken ? await verifySession(decodeURIComponent(rawToken)) : null
    if (!session || !session.origUid) {
      return NextResponse.json({ error: "No impersonated session found" }, { status: 401 })
    }

    const origResult = await query(`SELECT id, name, role, school_id, status FROM users WHERE id = $1`, [session.origUid])
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
      role: orig.role || session.origRole || "admin",
      name: orig.name || session.origName || "",
    })

    const returnPath =
      typeof session.ret === "string" && session.ret.startsWith("/") && !session.ret.startsWith("//")
        ? session.ret
        : "/admin"

    const response = NextResponse.json({ redirect: returnPath })
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