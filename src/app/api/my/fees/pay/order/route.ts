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

  // --- Real Razorpay flow ------------------------------------------------
  const razorpayReal = gateway?.code === "razorpay" && (await razorpayConfigured())
  if (razorpayReal) {
    // Idempotent retry: reuse a pending razorpay order covering exactly these heads.
    const pending = (
      await query(
        `SELECT id, fees_type_id AS "feesTypeId", transaction_id AS "orderId"
         FROM fees_payments
         WHERE student_id = $1 AND status = 'Pending' AND payment_method = 'razorpay' AND transaction_id IS NOT NULL`,
        [student.id]
      )
    ).rows
    const byOrder = new Map<string, any[]>()
    for (const r of pending) {
      const key = String(r.orderId)
      if (!byOrder.has(key)) byOrder.set(key, [])
      byOrder.get(key)!.push(r)
    }
    let paymentIds: number[] | null = null
    let orderId = ""
    for (const [oid, rows] of byOrder) {
      const have = rows.map((r) => Number(r.feesTypeId)).sort((a, b) => a - b).join(",")
      if (have === wantedSet) {
        paymentIds = rows.map((r) => Number(r.id))
        orderId = oid
        break
      }
    }
    if (!paymentIds) {
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
      paymentIds = ids
      orderId = order.id
    }

    if (!orderId) throw new ApiError(500, "Failed to create Razorpay order")
    const cfg = await getRazorpayConfig()
    const studentName = student.name || `${student.first_name || ""} ${student.last_name || ""}`.trim() || "Student"
    return {
      mode: "razorpay_order",
      gateway: { code: "razorpay", name: "Razorpay", mode: "Live", demo: false },
      bulk: selected.length > 1,
      paymentIds,
      studentId: Number(student.id),
      orderId,
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
  // Records Pending rows labelled with the chosen gateway so the transaction
  // details (which gateway, how much, when) are kept for the school and the payer.
  if (gateway) {
    const pendingDemo = (
      await query(
        `SELECT id, fees_type_id AS "feesTypeId", transaction_id AS "groupId"
         FROM fees_payments
         WHERE student_id = $1 AND status = 'Pending' AND payment_method = $2 AND transaction_id IS NOT NULL`,
        [student.id, gateway.code]
      )
    ).rows
    const demoGroups = new Map<string, number[]>()
    for (const r of pendingDemo) {
      const key = String(r.groupId)
      if (!demoGroups.has(key)) demoGroups.set(key, [])
      demoGroups.get(key)!.push(Number(r.feesTypeId))
    }
    let paymentIds: number[] = []
    let reused = false
    for (const [groupKey, typeIds] of demoGroups) {
      const have = typeIds.sort((a, b) => a - b).join(",")
      if (have === wantedSet) {
        paymentIds = pendingDemo
          .filter((r: any) => String(r.groupId) === groupKey)
          .map((r: any) => Number(r.id))
        reused = true
        break
      }
    }
    if (!reused) {
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
      paymentIds = ids
    }

    return {
      mode: "demo",
      gateway: { code: gateway.code, name: gateway.name, mode: gateway.mode, demo: (gateway.mode || "Test") === "Test" },
      bulk: selected.length > 1,
      paymentIds,
      studentId: Number(student.id),
      amount: total,
      heads: selected.map((h: any) => ({ feesTypeId: Number(h.feesTypeId), feesType: h.feesType, balance: Number(h.balance) })),
    }
  }

  // --- Manual flow (no gateway) -------------------------------------------
  // Record as Pending and ask the payer how/when they actually paid. Each insert
  // batch shares a local transaction_id token (MANUAL-<ts>) used for idempotent
  // re-use; the token is replaced by the payer's own reference on verify.
  const pendingManual = (
    await query(
      `SELECT id, fees_type_id AS "feesTypeId", transaction_id AS "groupId"
       FROM fees_payments
       WHERE student_id = $1 AND status = 'Pending' AND payment_method = 'manual' AND transaction_id IS NOT NULL`,
      [student.id]
    )
  ).rows
  const manualGroups = new Map<string, number[]>()
  for (const r of pendingManual) {
    const key = String(r.groupId)
    if (!manualGroups.has(key)) manualGroups.set(key, [])
    manualGroups.get(key)!.push(Number(r.feesTypeId))
  }

  let paymentIds: number[] = []
  let reused = false
  for (const [groupKey, typeIds] of manualGroups) {
    const have = typeIds.sort((a, b) => a - b).join(",")
    if (have === wantedSet) {
      paymentIds = pendingManual
        .filter((r: any) => String(r.groupId) === groupKey)
        .map((r: any) => Number(r.id))
      reused = true
      break
    }
  }
  if (!reused) {
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
    paymentIds = ids
  }

  return {
    mode: "manual",
    gateway: null,
    bulk: selected.length > 1,
    paymentIds,
    studentId: Number(student.id),
    amount: total,
    heads: selected.map((h: any) => ({ feesTypeId: Number(h.feesTypeId), feesType: h.feesType, balance: Number(h.balance) })),
  }
})