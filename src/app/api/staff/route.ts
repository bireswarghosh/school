import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const departmentId = searchParams.get("department_id")
    const roleFilter = searchParams.get("role")

    let sql = `
      SELECT st.id, st.staff_id, st.name, st.role, d.name AS department, des.name AS designation
      FROM staff st
      LEFT JOIN departments d ON d.id = st.department_id
      LEFT JOIN designations des ON des.id = st.designation_id
      WHERE st.status = 'Active'
    `
    const params: (string | number)[] = []
    if (departmentId) {
      sql += ` AND st.department_id = $${params.length + 1}::int`
      params.push(parseInt(departmentId))
    }
    if (roleFilter) {
      sql += ` AND LOWER(st.role) = LOWER($${params.length + 1})`
      params.push(roleFilter)
    }
    sql += " ORDER BY st.name"

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
