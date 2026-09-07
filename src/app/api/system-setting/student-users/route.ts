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
        s.id AS "studentId", s.admission_no AS "admissionNo",
        c.name AS "class", sec.name AS "section",
        s.gender, s.dob, s.phone, s.mobile, s.student_photo AS "studentPhoto"
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id AND s.school_id = u.school_id
      LEFT JOIN classes c ON c.id = s.class_id
      LEFT JOIN sections sec ON sec.id = s.section_id
      WHERE u.school_id = $1 AND u.role = 'student'
      ORDER BY u.id DESC`,
      [schoolId]
    )
    return NextResponse.json(result.rows)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
