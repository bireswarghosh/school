import { NextRequest, NextResponse } from "next/server"
import { getAll, create, query } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"
import { getCurrentActor, actorLabel } from "@/lib/actor"
import { getSessionSchoolId } from "@/lib/auth"
import { headers } from "next/headers"

const TABLE = "fee_payment_log"
const ORDER = "paid_at DESC, id DESC"
const fieldMap: Record<string, string> = {
  studentId: "student_id",
  feePaymentId: "fee_payment_id",
  feeTypeId: "fee_type_id",
  feeGroupId: "fee_group_id",
  amountPaid: "amount_paid",
  paymentMode: "payment_mode",
  transactionId: "transaction_id",
  bankName: "bank_name",
  chequeNo: "cheque_no",
  paidAt: "paid_at",
  createdBy: "created_by",
  createdByUsername: "created_by_username",
  changeKind: "change_kind",
  oldStatus: "old_status",
  newStatus: "new_status",
  ipAddress: "ip_address",
  studentName: "student_name",
  feeTypeName: "fee_type_name",
  paidBefore: "paid_before",
  paidAfter: "paid_after",
}

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

async function resolveClientIp(): Promise<string | null> {
  try {
    const h = await headers()
    const fwd = h.get("x-forwarded-for")
    if (fwd) return String(fwd).split(",")[0].trim()
    const real = h.get("x-real-ip")
    if (real) return real
  } catch {
    /* headers only available in a request context */
  }
  return null
}

function withIp(item: Record<string, any>, ip: string | null): Record<string, any> {
  const out: Record<string, any> = { ...camelToSnake(item, fieldMap) }
  if (ip) out.ip_address = ip
  return out
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")
  try {
    const where = studentId ? "student_id = $1" : undefined
    const items = await getAll(TABLE, ORDER, where, studentId ? [parseInt(studentId)] : undefined)
    const rows = mapResponse(items, fieldMap)
    return NextResponse.json(await resolveUserNames(req, Array.isArray(rows) ? rows : []))
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

const GENERIC_ACTOR = new Set(["", "admin", "administrator", "user", "system"])

/**
 * Older log rows were stamped with a generic "Admin" because the client could
 * not resolve the signed-in user. Show the school's actual admin login (the one
 * used most recently) for those rows, and fill in usernames where we can.
 */
async function resolveUserNames(req: NextRequest, rows: Record<string, any>[]) {
  if (rows.length === 0) return rows
  const isGeneric = (v: unknown) => GENERIC_ACTOR.has(String(v ?? "").trim().toLowerCase())
  if (!rows.some((r) => isGeneric(r.createdBy))) return rows

  const schoolId = getSessionSchoolId(req)
  let fallback: { name: string; username: string } | null = null
  try {
    const res = await query(
      `SELECT name, username FROM users
       WHERE role = 'admin'${schoolId ? " AND school_id = $1" : ""}
       ORDER BY last_login DESC NULLS LAST, id ASC
       LIMIT 1`,
      schoolId ? [schoolId] : []
    )
    fallback = res.rows[0] ?? null
  } catch {
    fallback = null
  }
  if (!fallback) return rows

  const fb: { name: string; username: string } = fallback
  return rows.map((r) => {
    if (!isGeneric(r.createdBy)) return r
    return { ...r, createdBy: fb.name, createdByUsername: r.createdByUsername || fb.username }
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ip = await resolveClientIp()
    const actor = await getCurrentActor()
    const actorName = actorLabel(actor)
    const stamp = (item: Record<string, any>) => {
      const row = withIp(item, ip)
      // Always trust the signed-in session over the client-supplied name, so
      // the log records the user who actually received the payment.
      if (actorName) row.created_by = actorName
      if (actor?.username) row.created_by_username = actor.username
      return row
    }
    if (Array.isArray(body)) {
      const results = await Promise.all(body.map((item) => create(TABLE, stamp(item))))
      return NextResponse.json(results, { status: 201 })
    }
    const item = await create(TABLE, stamp(body))
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}