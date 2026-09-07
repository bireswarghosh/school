import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function getSchoolId(req: NextRequest): number | null {
  const raw = req.headers.get("x-school-id")
  if (!raw) return null
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function GET(req: NextRequest) {
  try {
    const schoolId = getSchoolId(req)
    if (!schoolId) return unauthorized()

    const result = await query(
      `SELECT
        u.id, u.username, u.name, u.email, u.role, u.status, u.last_login AS "lastLogin",
        STRING_AGG(
          s.admission_no || ' - ' || s.name || ' (' || COALESCE(c.name, '') || ' ' || COALESCE(sec.name, '') || ')',
          ', '
        ) AS "children",
        COUNT(DISTINCT sg.student_id) AS "childrenCount"
      FROM users u
      LEFT JOIN student_guardians sg ON sg.parent_user_id = u.id AND sg.school_id = u.school_id
      LEFT JOIN students s ON s.id = sg.student_id
      LEFT JOIN classes c ON c.id = s.class_id
      LEFT JOIN sections sec ON sec.id = s.section_id
      WHERE u.school_id = $1 AND u.role = 'parent'
      GROUP BY u.id, u.username, u.name, u.email, u.role, u.status, u.last_login
      ORDER BY u.id DESC`,
      [schoolId]
    )
    return NextResponse.json(result.rows)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
