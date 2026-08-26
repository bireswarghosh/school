import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionRole } from "@/lib/auth"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function requireSuperAdmin(req: NextRequest): NextResponse | null {
  if (getSessionRole(req) !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

function pad(n: number, w = 2) {
  return String(n).padStart(w, "0")
}

export function makeInvoiceNo() {
  const d = new Date()
  return `INV-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Date.now().toString().slice(-5)}`
}

export async function GET(req: NextRequest) {
  const forbidden = requireSuperAdmin(req)
  if (forbidden) return forbidden

  const { searchParams } = new URL(req.url)
  const schoolId = searchParams.get("schoolId")
  const id = searchParams.get("id")
  try {
    if (id) {
      const result = await query(`SELECT * FROM invoices WHERE id = $1`, [parseInt(id)])
      return NextResponse.json(result.rows[0] || { error: "Not found" }, { status: result.rows[0] ? 200 : 404 })
    }
    if (schoolId) {
      const result = await query(
        `SELECT * FROM invoices WHERE school_id = $1 ORDER BY created_at DESC, id DESC`,
        [parseInt(schoolId)]
      )
      return NextResponse.json(result.rows)
    }
    const result = await query(
      `SELECT i.*, s.name AS "schoolName", s.code AS "schoolCode"
       FROM invoices i LEFT JOIN schools s ON s.id = i.school_id
       ORDER BY i.created_at DESC, i.id DESC`
    )
    return NextResponse.json(result.rows)
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  const forbidden = requireSuperAdmin(req)
  if (forbidden) return forbidden

  try {
    const body = await req.json()
    const { schoolId, planId, planName, amount, currency, dueDate, status, notes, invoiceNo } = body
    if (!schoolId) return NextResponse.json({ error: "schoolId required" }, { status: 400 })
    if (!amount || Number(amount) <= 0) return NextResponse.json({ error: "amount must be > 0" }, { status: 400 })

    let plan_name = planName || null
    if (planId && !plan_name) {
      const p = (await query(`SELECT name FROM plans WHERE id = $1`, [parseInt(planId)])).rows[0]
      plan_name = p?.name || null
    }

    const invoiceNoVal = invoiceNo || makeInvoiceNo()
    const result = await query(
      `INSERT INTO invoices (school_id, invoice_no, plan_id, plan_name, amount, currency, due_date, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [parseInt(schoolId), invoiceNoVal, planId ? parseInt(planId) : null, plan_name, Number(amount), currency || "INR", dueDate || null, status || "due", notes || null]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  const forbidden = requireSuperAdmin(req)
  if (forbidden) return forbidden

  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const allowed = ["status", "due_date", "amount", "currency", "payment_method", "razorpay_order_id", "payment_link", "notes", "plan_id", "plan_name", "paid_at"]
    const updates: string[] = []
    const params: any[] = []
    for (const key of allowed) {
      if (data[key] === undefined) continue
      params.push(data[key])
      updates.push(`${key} = $${params.length}`)
    }
    // paid_at auto-set when marked paid
    if (data.status === "paid" && data.paid_at === undefined) {
      params.push(new Date().toISOString())
      updates.push(`paid_at = $${params.length}`)
    }
    if (updates.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    params.push(id)
    const result = await query(
      `UPDATE invoices SET ${updates.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    )
    return NextResponse.json(result.rows[0] || { error: "Not found" }, { status: result.rows[0] ? 200 : 404 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const forbidden = requireSuperAdmin(req)
  if (forbidden) return forbidden

  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await query(`DELETE FROM invoices WHERE id = $1`, [id])
  return NextResponse.json({ success: true })
}
