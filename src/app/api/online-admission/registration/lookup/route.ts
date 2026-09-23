import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ref = String(searchParams.get("ref") || "").trim()
    if (!ref) return NextResponse.json({ error: "ref required" }, { status: 400 })

    const row = (
      await query(`SELECT * FROM online_admission_registrations WHERE token = $1`, [ref])
    ).rows[0]
    if (!row) return NextResponse.json({ error: "Invalid registration link" }, { status: 404 })
    if (row.payment_status !== "Paid") {
      return NextResponse.json({ error: "Registration payment is incomplete" }, { status: 400 })
    }

    const school = (
      await query(`SELECT name, code FROM schools WHERE id = $1`, [row.school_id])
    ).rows[0]

    const origin = new URL(req.url).origin
    return NextResponse.json({
      regFormNo: row.reg_form_no,
      name: row.name,
      phone: row.phone,
      email: row.email,
      classVal: row.class_val,
      status: row.status,
      admitted: !!row.admitted,
      admittedAt: row.admitted_at || null,
      formData: row.form_data || null,
      formSubmittedAt: row.form_submitted_at || null,
      schoolName: school?.name || "School",
      schoolCode: school?.code || "DEFAULT",
      regLink: `${origin}/online-admission/register?ref=${ref}`,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}