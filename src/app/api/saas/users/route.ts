import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionRole, hashPassword } from "@/lib/auth"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function requireSuperAdmin(req: NextRequest): NextResponse | null {
  if (getSessionRole(req) !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

const PROFILE_COLS =
  `u.id, u.username, u.name, u.email, u.role, u.status, u.last_login,
   s.name AS school_name, s.code AS school_code`

export async function GET(req: NextRequest) {
  const forbidden = requireSuperAdmin(req)
  if (forbidden) return forbidden

  const { searchParams } = new URL(req.url)
  const schoolId = searchParams.get("schoolId")

  const params: any[] = []
  let where = ""
  if (schoolId && parseInt(schoolId, 10) > 0) {
    params.push(parseInt(schoolId, 10))
    where = `WHERE u.school_id = $${params.length}`
  }

  const result = await query(
    `SELECT ${PROFILE_COLS}
     FROM users u
     LEFT JOIN schools s ON s.id = u.school_id
     ${where}
     ORDER BY CASE WHEN u.role = 'admin' THEN 0 ELSE 1 END, u.id ASC
     LIMIT 500`,
    params
  )
  return NextResponse.json(result.rows)
}

export async function PUT(req: NextRequest) {
  const forbidden = requireSuperAdmin(req)
  if (forbidden) return forbidden

  try {
    const body = await req.json()
    const { id, password, status, name } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    if (password !== undefined) {
      if (!password || String(password).length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
      }
      const hashed = hashPassword(String(password))
      await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hashed, parseInt(id, 10)])
    }

    if (status !== undefined) {
      await query(`UPDATE users SET status = $1 WHERE id = $2`, [String(status), parseInt(id, 10)])
    }

    if (name !== undefined && name) {
      await query(`UPDATE users SET name = $1 WHERE id = $2`, [String(name), parseInt(id, 10)])
    }

    const row = (await query(`SELECT ${PROFILE_COLS} FROM users u LEFT JOIN schools s ON s.id = u.school_id WHERE u.id = $1`, [parseInt(id, 10)])).rows[0]
    return NextResponse.json(row || { error: "Not found" }, { status: row ? 200 : 404 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}