import { NextRequest, NextResponse } from "next/server"
import { query, create, update, remove } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "admission_enquiries"
const ORDER = "id DESC"

async function resolveFk(refTable: string, name: string): Promise<number | null> {
  if (!name || typeof name !== "string") return null
  const trimmed = name.trim()
  if (!trimmed) return null

  const existing = await query(`SELECT id FROM ${refTable} WHERE name = $1`, [trimmed])
  if (existing.rows.length > 0) return existing.rows[0].id

  // Name not found — create the lookup row so the FK stays a valid integer.
  // query() auto-scopes INSERTs on tenant tables to the request's school_id.
  if (refTable === "source_types") {
    const inserted = await query(
      `INSERT INTO source_types (name, status) VALUES ($1, 'Active') RETURNING id`,
      [trimmed]
    )
    return inserted.rows[0]?.id ?? null
  }
  if (refTable === "classes") {
    const maxRow = await query(`SELECT COALESCE(MAX(order_number), 0) AS m FROM classes`)
    const orderNumber = (maxRow.rows[0]?.m ?? 0) + 1
    const inserted = await query(
      `INSERT INTO classes (name, order_number) VALUES ($1, $2) RETURNING id`,
      [trimmed, orderNumber]
    )
    return inserted.rows[0]?.id ?? null
  }
  return null
}

async function getWithJoins(id?: number) {
  const where = id ? `WHERE e.id = ${id}` : ""
  const sql = `
    SELECT e.id, e.name, e.phone, e.email, e.address,
      st.name AS "source",
      cl.name AS "classVal",
      e.reference, e.description, e.note, e.status,
      e.enquiry_date AS "enquiryDate",
      e.last_followup_date AS "lastFollowUp",
      e.followup_date AS "nextFollowUp",
      e.assigned_to AS "assigned",
      e.no_of_child AS "noOfChild",
      e.reg_form_purchased AS "regFormPurchased",
      e.reg_form_no AS "regFormNo",
      e.reg_form_amount AS "regFormAmount",
      e.reg_form_payment_mode AS "regFormPaymentMode",
      e.reg_form_payment_date AS "regFormPaymentDate",
      e.reg_form_status AS "regFormStatus",
      e.reg_form_transaction_id AS "regFormTransactionId",
      e.reg_form_cheque_no AS "regFormChequeNo",
      e.reg_form_bank AS "regFormBank",
      e.reg_form_note AS "regFormNote",
      e.created_at AS "createdAt"
    FROM ${TABLE} e
    LEFT JOIN source_types st ON st.id = e.source_type_id
    LEFT JOIN classes cl ON cl.id = e.class_id
    ${where}
    ORDER BY e.id DESC
  `
  const result = await query(sql)
  return result.rows
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  try {
    const items = await getWithJoins(id ? parseInt(id) : undefined)
    const result = id ? (items[0] || { error: "Not found" }) : items
    return NextResponse.json(result, { status: id && !items[0] ? 404 : 200 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

async function mapRegForm(data: Record<string, any>, value: any, key: string) {
  if (key === "regFormPurchased") data.reg_form_purchased = !!value
  else if (key === "regFormNo") data.reg_form_no = value || null
  else if (key === "regFormAmount") data.reg_form_amount = value || 0
  else if (key === "regFormPaymentMode") data.reg_form_payment_mode = value || null
  else if (key === "regFormPaymentDate") data.reg_form_payment_date = value || null
  else if (key === "regFormStatus") data.reg_form_status = value || null
  else if (key === "regFormTransactionId") data.reg_form_transaction_id = value || null
  else if (key === "regFormChequeNo") data.reg_form_cheque_no = value || null
  else if (key === "regFormBank") data.reg_form_bank = value || null
  else if (key === "regFormNote") data.reg_form_note = value || null
  else return false
  return true
}

async function mapBody(body: Record<string, any>) {
  const data: Record<string, any> = {}
  for (const [key, value] of Object.entries(body)) {
    if (key === "source") data.source_type_id = await resolveFk("source_types", value as string) || value
    else if (key === "classVal") data.class_id = await resolveFk("classes", value as string) || value
    else if (key === "assigned") data.assigned_to = value
    else if (key === "enquiryDate") data.enquiry_date = value
    else if (key === "lastFollowUp") { if (value) data.last_followup_date = value }
    else if (key === "nextFollowUp") data.followup_date = value
    else if (key === "noOfChild") data.no_of_child = value
    else if (!await mapRegForm(data, value, key)) data[key] = value
  }
  return data
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Bulk import if array
    if (Array.isArray(body)) {
      const results = []
      for (const item of body) {
        const mapped = await mapBody(item)
        const created = await create(TABLE, mapped)
        const rows = await getWithJoins(created.id)
        results.push(rows[0] || created)
      }
      return NextResponse.json(results, { status: 201 })
    }
    const data = await mapBody(body)
    const item = await create(TABLE, data)
    const rows = await getWithJoins(item.id)
    return NextResponse.json(rows[0] || item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const data: Record<string, any> = {}
    for (const [key, value] of Object.entries(rest)) {
      if (key === "source") data.source_type_id = await resolveFk("source_types", value as string) || value
      else if (key === "classVal") data.class_id = await resolveFk("classes", value as string) || value
      else if (key === "assigned") data.assigned_to = value
      else if (key === "enquiryDate") data.enquiry_date = value
      else if (key === "lastFollowUp") { if (value) data.last_followup_date = value }
      else if (key === "nextFollowUp") data.followup_date = value
      else if (key === "noOfChild") data.no_of_child = value
      else if (!await mapRegForm(data, value, key)) data[key] = value
    }
    const item = await update(TABLE, id, data)
    const rows = item ? await getWithJoins(item.id) : []
    return NextResponse.json(rows[0] || item || { error: "Not found" }, { status: item ? 200 : 404 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await remove(TABLE, id)
  return NextResponse.json({ success: true })
}
