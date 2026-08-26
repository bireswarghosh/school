import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const schoolId = getSessionSchoolId(req)
  if (!schoolId) {
    return NextResponse.json({ error: "No school session" }, { status: 403 })
  }
  try {
    const schoolRes = await query(`SELECT * FROM schools WHERE id = $1`, [schoolId])
    const school = schoolRes.rows[0]
    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 })

    const plan = school.plan_id
      ? (await query(`SELECT * FROM plans WHERE id = $1`, [school.plan_id])).rows[0] || null
      : null

    const subs = await query(
      `SELECT * FROM subscriptions WHERE school_id = $1 ORDER BY created_at DESC`,
      [schoolId]
    )
    const invoices = await query(
      `SELECT * FROM invoices WHERE school_id = $1 ORDER BY created_at DESC, id DESC`,
      [schoolId]
    )

    return NextResponse.json({
      school: {
        id: school.id,
        name: school.name,
        code: school.code,
        email: school.email,
        status: school.status,
        plan: school.plan,
        plan_id: school.plan_id,
      },
      plan: plan || null,
      subscription: subs.rows[0] || null,
      invoices: invoices.rows,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
