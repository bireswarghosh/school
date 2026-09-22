import { NextRequest, NextResponse } from "next/server"
import { getAll, create } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"
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
    return NextResponse.json(mapResponse(items, fieldMap))
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ip = await resolveClientIp()
    if (Array.isArray(body)) {
      const results = await Promise.all(body.map((item) => create(TABLE, withIp(item, ip))))
      return NextResponse.json(results, { status: 201 })
    }
    const item = await create(TABLE, withIp(body, ip))
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}