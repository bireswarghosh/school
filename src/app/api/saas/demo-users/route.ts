import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionRole } from "@/lib/auth"
import { ensureDemoUsersForSchool, DEMO_ROLES } from "@/lib/school-setup"

export async function POST(req: NextRequest) {
  if (getSessionRole(req) !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const schoolId = parseInt(searchParams.get("schoolId") || "0", 10)
  if (!schoolId) return NextResponse.json({ error: "schoolId is required" }, { status: 400 })

  const schoolRes = await query(`SELECT id, name, code FROM schools WHERE id = $1`, [schoolId])
  const school = schoolRes.rows[0]
  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 })

  const created = await ensureDemoUsersForSchool(school)
  const countsRes = await query(
    `SELECT role, COUNT(*)::int AS count FROM users WHERE school_id = $1 GROUP BY role`,
    [schoolId]
  )
  const counts: Record<string, number> = {}
  for (const r of countsRes.rows) counts[r.role] = r.count
  for (const spec of DEMO_ROLES) if (!counts[spec.role]) counts[spec.role] = 0

  return NextResponse.json({ created, counts })
}
