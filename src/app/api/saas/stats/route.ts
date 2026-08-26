import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionRole } from "@/lib/auth"

export async function GET(req: NextRequest) {
  if (getSessionRole(req) !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [schoolsRes, usersRes, studentsRes, staffRes, activeSchoolsRes] = await Promise.all([
    query(`SELECT COUNT(*)::int AS count FROM schools`),
    query(`SELECT COUNT(*)::int AS count FROM users WHERE role <> 'super_admin'`),
    query(`SELECT COUNT(*)::int AS count FROM students`),
    query(`SELECT COUNT(*)::int AS count FROM staff`),
    query(`SELECT COUNT(*)::int AS count FROM schools WHERE status = 'Active'`),
  ])

  const recentResult = await query(`SELECT id, name, code, email, plan, status, created_at FROM schools ORDER BY id DESC LIMIT 8`)

  return NextResponse.json({
    schools: schoolsRes.rows[0].count,
    users: usersRes.rows[0].count,
    students: studentsRes.rows[0].count,
    staff: staffRes.rows[0].count,
    activeSchools: activeSchoolsRes.rows[0].count,
    recentSchools: recentResult.rows,
  })
}
