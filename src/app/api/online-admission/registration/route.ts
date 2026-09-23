import { NextRequest, NextResponse } from "next/server"
import { query, type DbParam } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function mapRow(r: Record<string, any>) {
  return {
    id: r.id,
    enquiryId: r.enquiry_id,
    regFormNo: r.reg_form_no,
    token: r.token,
    name: r.name,
    phone: r.phone,
    email: r.email,
    classVal: r.class_val,
    address: r.address,
    description: r.description,
    amount: Number(r.amount) || 0,
    status: r.status,
    paymentStatus: r.payment_status,
    orderId: r.order_id,
    paymentId: r.payment_id,
    paymentDate: r.payment_date,
    createdAt: r.created_at,
    formData: r.form_data || {},
    formSubmittedAt: r.form_submitted_at || null,
    admitted: !!r.admitted,
    admittedStudentId: r.admitted_student_id || null,
    admittedAt: r.admitted_at || null,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const row = (await query(`SELECT * FROM online_admission_registrations WHERE id = $1`, [parseInt(id, 10)])).rows[0]
    return NextResponse.json(row ? mapRow(row) : { error: "Not found" }, { status: row ? 200 : 404 })
  }
  const rows = (await query(`SELECT * FROM online_admission_registrations ORDER BY created_at DESC`)).rows
  return NextResponse.json(rows.map(mapRow))
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const id = parseInt(String(body.id || "0"), 10)
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const current = (await query(`SELECT * FROM online_admission_registrations WHERE id = $1`, [id])).rows[0]
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updates: string[] = []
    const params: DbParam[] = []
    if (body.status) { updates.push(`status = $${params.length + 1}`); params.push(String(body.status)) }
    if (body.paymentStatus) { updates.push(`payment_status = $${params.length + 1}`); params.push(String(body.paymentStatus)) }
    if (body.classVal !== undefined) { updates.push(`class_val = $${params.length + 1}`); params.push(String(body.classVal || "")) }
    if (body.formData !== undefined && body.formData !== null) {
      updates.push(`form_data = $${params.length + 1}::jsonb`)
      params.push(JSON.stringify(body.formData))
    }
    if (body.admitted !== undefined) {
      updates.push(`admitted = $${params.length + 1}`)
      params.push(body.admitted ? true : false)
      if (body.admitted) updates.push(`admitted_at = now()`)
      else updates.push(`admitted_at = null`)
    }
    if (body.admittedStudentId != null) {
      updates.push(`admitted_student_id = $${params.length + 1}`)
      params.push(parseInt(String(body.admittedStudentId), 10))
    }
    if (updates.length === 0) return NextResponse.json(current, { status: 200 })
    params.push(id)
    const row = (
      await query(
        `UPDATE online_admission_registrations SET ${updates.join(", ")}, updated_at = now() WHERE id = $${params.length} RETURNING *`,
        params
      )
    ).rows[0]
    return NextResponse.json(row ? mapRow(row) : { error: "Not found" }, { status: 200 })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0", 10)
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const result = await query(`DELETE FROM online_admission_registrations WHERE id = $1`, [id])
  return NextResponse.json({ success: (result.rowCount ?? 0) > 0 })
}