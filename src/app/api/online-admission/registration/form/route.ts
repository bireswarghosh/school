import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ref = String(body.ref || "").trim()
    const formData = body.formData

    if (!ref) return NextResponse.json({ error: "ref required" }, { status: 400 })
    if (!formData || typeof formData !== "object" || Array.isArray(formData)) {
      return NextResponse.json({ error: "formData required" }, { status: 400 })
    }

    const row = (
      await query(`SELECT * FROM online_admission_registrations WHERE token = $1`, [ref])
    ).rows[0]
    if (!row) return NextResponse.json({ error: "Invalid registration link" }, { status: 404 })
    if (row.payment_status !== "Paid") {
      return NextResponse.json({ error: "Registration payment is incomplete" }, { status: 400 })
    }

    const sanitized: Record<string, string> = {}
    for (const key of Object.keys(formData)) {
      const v = formData[key]
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        sanitized[key] = String(v ?? "")
      }
    }
    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: "formData must contain fields" }, { status: 400 })
    }

    await query(
      `UPDATE online_admission_registrations
       SET form_data = $1::jsonb, form_submitted_at = now()
       WHERE id = $2`,
      [JSON.stringify(sanitized), row.id]
    )

    const origin = new URL(req.url).origin
    return NextResponse.json({
      success: true,
      regFormNo: row.reg_form_no,
      regLink: `${origin}/online-admission/register?ref=${ref}`,
      submittedAt: new Date().toISOString(),
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}