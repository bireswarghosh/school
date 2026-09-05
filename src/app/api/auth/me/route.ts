import { NextResponse, type NextRequest } from "next/server"
import { cookies } from "next/headers"
import { query } from "@/lib/db"
import { verifySession, SESSION_COOKIE } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const store = await cookies()
  const rawToken = store.get(SESSION_COOKIE)?.value
  const authHeader = req.headers.get("authorization") || ""
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined
  const token = (rawToken ? decodeURIComponent(rawToken) : undefined) || bearer || undefined
  const session = token ? await verifySession(token) : null
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const userResult = await query(`SELECT * FROM users WHERE id = $1`, [session.uid])
  const user = userResult.rows[0]
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  let school: any = null
  if (user.school_id) {
    const schoolResult = await query(`SELECT * FROM schools WHERE id = $1`, [user.school_id])
    school = schoolResult.rows[0] || null
  }

  let role = user.role || "staff"
  let permissions: string[] = []
  if (user.role_id) {
    const roleResult = await query(`SELECT name, permissions FROM roles WHERE id = $1`, [user.role_id])
    if (roleResult.rows[0]) {
      role = roleResult.rows[0].name
      permissions = roleResult.rows[0].permissions || []
    }
  } else if (Array.isArray(user.permissions)) {
    permissions = user.permissions
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      permissions,
      schoolId: user.school_id ?? null,
    },
    school,
  })
}
