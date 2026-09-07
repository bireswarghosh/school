import { NextRequest } from "next/server"
import { handle, requireRole, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"
import { resolvePayerStudent, getFeeLedger } from "@/lib/fee-pay"
import { razorpayConfigured, createRazorpayOrder, getConfig as getRazorpayConfig } from "@/lib/razorpay"
import { getActiveGateway } from "@/lib/gateways"

// Start a fee payment for a student (student or parent login).
//
// Body:
//   feesTypeId    — pay one fee head (ideal balance)
//   feesTypeIds   — pay a specific set of fee heads together
//   payAll        — pay the entire outstanding balance across every pending head
//   amount        — optional partial amount (single head only)
//   gateway       — payment gateway code chosen by the payer ("razorpay",
//                   "phonepe", "cashfree", "ccavenue", ...) or "manual".
//
// Flows:
//   razorpay_order — Razorpay is enabled + configured (valid live/test keys): a real
//                    gateway Order is created (one per request, reused idempotently
//                    per head-set) and Pending fees_payments rows are recorded so the
//                    checkout can be run and then confirmed via pay/verify.
//   demo           — a Test-mode gateway (demo credentials) or an inactive gateway was
//                    chosen: Pending rows are recorded labelled with that gateway and
//                    the client runs a branded demo checkout that simulates the
//                    provider, then confirms via pay/verify. All rows keep
//                    payment_method = gateway code so the gateway used is on record.
//   manual         — no gateway chosen: Pending rows are recorded and the client asks
//                    the payer how they paid (Cash / UPI / Cheque / Card / Bank
//                    Transfer / Other) plus a reference, then confirms via pay/verify.
export const POST = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student", "parent"])

  const body = await req.json()
  const studentId = body.studentId ? Number(body.studentId) : undefined
  const payAll = Boolean(body.payAll)
  const singleRaw = body.feesTypeId ? Number(body.feesTypeId) : 0
  const feesTypeIds = (Array.isArray(body.feesTypeIds) ? (body.feesTypeIds as any[]) : [])
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
  if (Number.isFinite(singleRaw) && singleRaw > 0) feesTypeIds.push(singleRaw)

  if (!payAll && feesTypeIds.length === 0) {
    throw new ApiError(400, "feesTypeId is required")
  }

  const gatewayCode = String(body.gateway || "").trim().toLowerCase()
  let gateway: { code: string; name: string; mode: string } | null = null
  if (gatewayCode && gatewayCode !== "manual") {
    gateway = await getActiveGateway(gatewayCode)
    if (!gateway) throw new ApiError(400, "Selected payment gateway is not available")
  }

  const student = await resolvePayerStudent(ctx, studentId)

  const partialAmount =
    feesTypeIds.length === 1 && body.amount ? Math.max(0, Number(body.amount)) : 0

  // Resolve the outstanding heads for this student.
  const ledger = await getFeeLedger(student)
  const heads = ledger.dues
    .filter((d: any) => Number(d.balance) > 0)
    .map((h: any) => {
      if (feesTypeIds.length === 1 && partialAmount > 0) {
        return { ...h, balance: Math.min(Number(h.balance), partialAmount) }
      }
      return h
    })
  const selected = payAll
    ? heads
    : heads.filter((h: any) => feesTypeIds.includes(Number(h.feesTypeId)))
  if (selected.length === 0) throw new ApiError(400, "No pending fee balance selected")
  const total = selected.reduce((s: number, h: any) => s + Number(h.balance), 0)

  const wantedSet = selected
    .map((h: any) => Number(h.feesTypeId))
    .sort((a, b) => a - b)
    .join(",")

  // Purge ALL stale Pending rows for these fee types across ALL gateways.
  // This prevents leftover rows from previous attempts (different gateway,
  // abandoned group payment, etc.) from being reused or causing duplicates.
  const wantedIds = selected.map((h: any) => Number(h.feesTypeId))
  if (wantedIds.length > 0) {
    await query(
      `DELETE FROM fees_payments
       WHERE student_id = $1 AND status = 'Pending'
         AND fees_type_id = ANY(string_to_array($2, ',')::int[])`,
      [student.id, wantedIds.join(",")]
    )
  }

  // --- Real Razorpay flow ------------------------------------------------
  const razorpayReal = gateway?.code === "razorpay" && (await razorpayConfigured())
  if (razorpayReal) {
    const order = await createRazorpayOrder(
      Math.round(total * 100),
      `FEES-${student.id}-${payAll ? "ALL" : wantedSet}-${Date.now() % 100000}`,
      { student_id: String(student.id), fee_types: wantedSet, school_id: String(ctx.schoolId ?? "") }
    )
    const ids: number[] = []
    for (const h of selected as any[]) {
      const ins = await query(
        `INSERT INTO fees_payments (student_id, class_id, fees_group_id, fees_type_id, amount, paid_amount, payment_mode, payment_method, transaction_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Online', 'razorpay', $7, 'Pending')
         RETURNING id`,
        [student.id, student.class_id, h.feesGroupId ?? null, h.feesTypeId, Number(h.balance), Number(h.balance), order.id]
      )
      ids.push(Number(ins.rows[0].id))
    }

    const cfg = await getRazorpayConfig()
    const studentName = student.name || `${student.first_name || ""} ${student.last_name || ""}`.trim() || "Student"
    return {
      mode: "razorpay_order",
      gateway: { code: "razorpay", name: "Razorpay", mode: "Live", demo: false },
      bulk: selected.length > 1,
      paymentIds: ids,
      studentId: Number(student.id),
      orderId: order.id,
      amount: total,
      amountPaise: Math.round(total * 100),
      currency: cfg.currency || "INR",
      keyId: cfg.keyId,
      name: studentName,
      prefillEmail: student.email || undefined,
      description: selected.length === 1 ? `${selected[0].feesType} payment` : `Fee payment (${selected.length} heads)`,
    }
  }

  // --- Demo gateway flow (Test-mode gateway or unconfigured gateway) ------
  if (gateway) {
    const token = `${gateway.code.toUpperCase()}-${student.id}-${Date.now() % 100000}`
    const ids: number[] = []
    for (const h of selected as any[]) {
      const ins = await query(
        `INSERT INTO fees_payments (student_id, class_id, fees_group_id, fees_type_id, amount, paid_amount, payment_mode, payment_method, transaction_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Online', $7, $8, 'Pending')
         RETURNING id`,
        [student.id, student.class_id, h.feesGroupId ?? null, h.feesTypeId, Number(h.balance), Number(h.balance), gateway.code, token]
      )
      ids.push(Number(ins.rows[0].id))
    }

    return {
      mode: "demo",
      gateway: { code: gateway.code, name: gateway.name, mode: gateway.mode, demo: (gateway.mode || "Test") === "Test" },
      bulk: selected.length > 1,
      paymentIds: ids,
      studentId: Number(student.id),
      amount: total,
      heads: selected.map((h: any) => ({ feesTypeId: Number(h.feesTypeId), feesType: h.feesType, balance: Number(h.balance) })),
    }
  }

  // --- Manual flow (no gateway) -------------------------------------------
  const token = `MANUAL-${student.id}-${Date.now() % 100000}`
  const ids: number[] = []
  for (const h of selected as any[]) {
    const ins = await query(
      `INSERT INTO fees_payments (student_id, class_id, fees_group_id, fees_type_id, amount, paid_amount, payment_mode, payment_method, transaction_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, NULL, 'manual', $7, 'Pending')
       RETURNING id`,
      [student.id, student.class_id, h.feesGroupId ?? null, h.feesTypeId, Number(h.balance), Number(h.balance), token]
    )
    ids.push(Number(ins.rows[0].id))
  }

  return {
    mode: "manual",
    gateway: null,
    bulk: selected.length > 1,
    paymentIds: ids,
    studentId: Number(student.id),
    amount: total,
    heads: selected.map((h: any) => ({ feesTypeId: Number(h.feesTypeId), feesType: h.feesType, balance: Number(h.balance) })),
  }
})
