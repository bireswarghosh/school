"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Loader2, Printer, CreditCard, Banknote, Building2, X, FileText, Tag, History } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"
import { useSchoolInfo } from "@/lib/use-school-info"
import { toast } from "@/lib/toast"
import { buildReceiptHtml, type FeeReceiptData, type FeeReceiptLine } from "@/lib/fee-receipt"
import { incomeHeadForGroup } from "@/lib/income-mapping"

type FeeRecord = {
  id: number
  studentId: number | string
  feesGroup: number | string
  feesType: number | string
  amount: number | string
  discountId: number | string | null
  discountAmount: number | string
  fineAmount: number | string
  paidAmount: number | string
  status: string
  paymentMode: string
  paymentDate: string
  transactionId: string
}

type ResolvedFee = FeeRecord & {
  feeTypeName: string
  groupName: string
  amount: number
  discount: number
  fine: number
  paid: number
  balance: number
  rawBalance: number
}

type PaymentFormData = {
  method: "Cash" | "Cheque" | "Card" | "Online Transfer"
  chequeNo: string
  bank: string
  transactionId: string
  note: string
}

type StudentDiscount = {
  id: number
  name: string
  discountCode: string
  discountType: string
  percentage: number | null
  amount: number | null
  expiryDate: string
  useCount: number | null
  isActive: boolean | null
  approvedBy?: string | null
  approvedAt?: string | null
  used?: boolean | null
}

type CurrentUser = {
  id: number
  name: string
  role: string
}

type IncomeHead = { id: number; name: string }

type AppliedFee = ResolvedFee & {
  appliedDiscount: number
  appliedDiscountId: number | null
  hasAppliedNew: boolean
}

export type CollectStudent = {
  id: number
  name: string
  admissionNo: string
  rollNo?: string
  className: string
  section: string
}

type PaymentLogEntry = {
  id: number
  studentId: number
  feePaymentId: number | null
  feeTypeId: number | null
  feeGroupId: number | null
  amountPaid: number | string
  paymentMode: string | null
  transactionId: string | null
  bankName: string | null
  chequeNo: string | null
  note: string | null
  paidAt: string | null
  createdBy: string | null
}

const num = (v: unknown) => {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

const MONTH_NAMES = ["march", "february", "january", "december", "november", "october", "september", "august", "july", "june", "may", "april"]
const MONTH_PRIORITY: Record<string, number> = {}
MONTH_NAMES.forEach((m, i) => { MONTH_PRIORITY[m] = i + 1 })

const monthPriority = (name: string) => {
  const n = (name || "").toLowerCase()
  for (const m of MONTH_NAMES) if (n.includes(m)) return MONTH_PRIORITY[m]
  return 0
}

const money = (symbol: string, v: number) => `${symbol}${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const round2 = (n: number) => Math.round(n * 100) / 100

const fmtDate = (s?: string | null) => {
  if (!s) return ""
  const [y, m, d] = s.split("-").map(Number)
  return y && m && d ? `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}/${y}` : ""
}

const fmtDateTime = (dt?: string | null) => {
  if (!dt) return ""
  const d = new Date(dt)
  if (isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function CollectFeesModal({
  open,
  student,
  groupIds = [],
  onClose,
  onSuccess,
}: {
  open: boolean
  student: CollectStudent | null
  groupIds?: number[]
  onClose: () => void
  onSuccess?: () => void
}) {
  const { symbol } = useCurrency()
  const { info: schoolInfo } = useSchoolInfo()
  const feesApi = student ? `/api/fees/fees-payment?studentId=${student.id}` : "/api/fees/fees-payment"
  const { data: fees, update: updateFee, refetch: refetchFees } = useApi<FeeRecord>(feesApi)

  const [feeGroups, setFeeGroups] = useState<Record<number, string>>({})
  const [feeTypes, setFeeTypes] = useState<Record<number, { name: string; group: string }>>({})
  const [incomeHeads, setIncomeHeads] = useState<IncomeHead[]>([])
  const [selectedFeeIds, setSelectedFeeIds] = useState<number[]>([])
  const [amountToPay, setAmountToPay] = useState("")
  const [paymentLog, setPaymentLog] = useState<PaymentLogEntry[]>([])
  const [showPriorHistory, setShowPriorHistory] = useState(false)
  const [payment, setPayment] = useState<PaymentFormData>({
    method: "Cash", chequeNo: "", bank: "", transactionId: "", note: "",
  })
  const [paying, setPaying] = useState(false)
  const [receipt, setReceipt] = useState<FeeReceiptData | null>(null)
  const [studentDiscounts, setStudentDiscounts] = useState<StudentDiscount[]>([])
  const [useDiscount, setUseDiscount] = useState(true)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const docFrameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCurrentUser(d))
      .catch(() => setCurrentUser(null))
  }, [])

  useEffect(() => {
    if (!student) return
    fetch(`/api/fees/fees-discount?studentId=${student.id}`)
      .then((r) => r.json())
      .then((d) => setStudentDiscounts(Array.isArray(d) ? d : []))
      .catch(() => setStudentDiscounts([]))
  }, [student])

  const refetchPaymentLog = useCallback(() => {
    if (!student) return
    fetch(`/api/fees/fees-payment-log?studentId=${student.id}`)
      .then((r) => r.json())
      .then((d) => setPaymentLog(Array.isArray(d) ? d : []))
      .catch(() => setPaymentLog([]))
  }, [student])

  useEffect(() => {
    if (open && student) refetchPaymentLog()
  }, [open, student, refetchPaymentLog])

  useEffect(() => {
    Promise.all([
      fetch("/api/fees/fees-group").then((r) => r.json()).then((d) => {
        const map: Record<number, string> = {}
        ;(Array.isArray(d) ? d : []).forEach((g: any) => { map[Number(g.id)] = g.name })
        setFeeGroups(map)
      }),
      fetch("/api/fees/fees-type").then((r) => r.json()).then((d) => {
        const map: Record<number, { name: string; group: string }> = {}
        ;(Array.isArray(d) ? d : []).forEach((t: any) => { map[Number(t.id)] = { name: t.name, group: t.feesGroup } })
        setFeeTypes(map)
      }),
      fetch("/api/income/head").then((r) => r.json()).then((d) => {
        setIncomeHeads(Array.isArray(d) ? d : [])
      }).catch(() => {}),
    ]).catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    setSelectedFeeIds([])
    setAmountToPay("")
    setPayment({ method: "Cash", chequeNo: "", bank: "", transactionId: "", note: "" })
    setUseDiscount(true)
    setReceipt(null)
    setPaying(false)
  }, [open, student?.id])

  const groupSet = useMemo(() => new Set(groupIds.map(Number)), [groupIds])
  const pendingFees: ResolvedFee[] = useMemo(
    () =>
      (fees || [])
        .map((f) => {
          const amount = num(f.amount)
          const discount = num(f.discountAmount)
          const fine = num(f.fineAmount)
          const paid = num(f.paidAmount)
          const balance = amount - discount - paid
          const rawBalance = round2(amount - paid)
          const groupName = f.feesGroup ? (feeGroups[Number(f.feesGroup)] ?? `Group ${f.feesGroup}`) : "-"
          const feeTypeName = f.feesType ? (feeTypes[Number(f.feesType)]?.name ?? `Type ${f.feesType}`) : "-"
          return { ...f, feeTypeName, groupName, amount, discount, fine, paid, balance, rawBalance }
        })
        .filter((r) => r.balance > 0 && (groupSet.size === 0 || groupSet.has(Number(r.feesGroup))))
        .sort((a, b) => {
          const pa = monthPriority(a.feeTypeName)
          const pb = monthPriority(b.feeTypeName)
          if (pa && pb) return pa - pb
          if (pa || pb) return pa ? -1 : 1
          return 0
        }),
    [fees, feeGroups, feeTypes, groupSet]
  )
  const pendingCount = pendingFees.length

  useEffect(() => {
    if (student && pendingCount > 0) {
      setSelectedFeeIds(pendingFees.map((r) => r.id))
    }
  }, [open, student?.id, pendingCount])

  const activeDiscount = useMemo<StudentDiscount | null>(() => {
    const t = new Date().toISOString().split("T")[0]
    return (
      (studentDiscounts || []).find(
        (d) =>
          d.isActive !== false &&
          !d.used &&
          (!d.expiryDate || d.expiryDate >= t) &&
          ((d.discountType === "Percentage" && num(d.percentage) > 0) ||
            (d.discountType === "Fix" && num(d.amount) > 0))
      ) ?? null
    )
  }, [studentDiscounts])

  const resolvedFees: AppliedFee[] = useMemo(() => {
    const entries = pendingFees.map<AppliedFee>((f) => ({
      ...f,
      appliedDiscount: 0,
      appliedDiscountId: null,
      hasAppliedNew: false,
    }))
    if (!activeDiscount || !useDiscount || selectedFeeIds.length === 0) return entries
    const map = new Map(entries.map((e) => [e.id, e]))
    const eligible = pendingFees.filter(
      (f) => selectedFeeIds.includes(f.id) && num(f.discountAmount) <= 0 && f.amount - f.paid > 0
    )
    if (eligible.length === 0) return entries

    const applyTo = (f: ResolvedFee, raw: number) => {
      const row = map.get(f.id)!
      const head = round2(f.amount - f.paid - row.appliedDiscount)
      const capped = round2(Math.min(raw, head))
      if (capped <= 0) return
      row.appliedDiscount = round2(row.appliedDiscount + capped)
      row.appliedDiscountId = activeDiscount.id
      row.hasAppliedNew = true
      row.discount = round2(f.discount + row.appliedDiscount)
      row.balance = round2(f.amount - row.discount - f.paid)
    }

    if (activeDiscount.discountType === "Percentage") {
      for (const f of eligible) applyTo(f, round2((f.amount * num(activeDiscount.percentage)) / 100))
      return Array.from(map.values())
    }

    // Fix discount — distributed over the SELECTED fees only. Uses integer
    // paise so the applied total is EXACTLY the coupon value (never more,
    // never less), capped by the selected fees' total headroom.
    const paise = (n: number) => Math.round(n * 100)
    const totalAmountPaise = eligible.reduce((s, f) => s + paise(f.amount), 0)
    const totalHeadPaise = eligible.reduce((s, f) => s + paise(f.amount - f.paid), 0)
    const poolPaise = Math.min(paise(num(activeDiscount.amount)), totalHeadPaise)
    if (totalAmountPaise <= 0 || poolPaise <= 0) return entries

    const alloc: number[] = []
    let used = 0
    for (const f of eligible) {
      let p = Math.floor((poolPaise * paise(f.amount)) / totalAmountPaise)
      const head = paise(f.amount - f.paid)
      if (p > head) p = head
      alloc.push(p)
      used += p
    }
    let rem = poolPaise - used
    let guard = 0
    let cursor = 0
    while (rem > 0 && guard < eligible.length * 2000 + 2000) {
      guard++
      const idx = cursor % eligible.length
      const head = paise(eligible[idx].amount - eligible[idx].paid)
      if (alloc[idx] < head) {
        alloc[idx]++
        rem--
      }
      cursor++
    }
    eligible.forEach((f, idx) => {
      if (alloc[idx] <= 0) return
      applyTo(f, alloc[idx] / 100)
    })

    return Array.from(map.values())
  }, [pendingFees, activeDiscount, selectedFeeIds, useDiscount])

  const approvalNote = (fees: AppliedFee[]) => {
    if (!activeDiscount || !fees.some((f) => f.hasAppliedNew)) return payment.note || ""
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    const when = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    return [
      payment.note || "",
      `Discount ${activeDiscount.discountCode} approved by ${currentUser?.name || "Admin"} on ${when}.`,
    ].filter(Boolean).join(" ")
  }

  const toggleFeeSelection = (feeId: number) => {
    setSelectedFeeIds((prev) =>
      prev.includes(feeId) ? prev.filter((id) => id !== feeId) : [...prev, feeId]
    )
  }

  const selectedFees = resolvedFees.filter((f) => selectedFeeIds.includes(f.id))
  const totalDue = round2(selectedFees.reduce((sum, f) => sum + f.balance, 0))

  const amountToPayNum = amountToPay.trim() === "" ? null : Number(amountToPay)
  const payingAmount = amountToPayNum === null || isNaN(amountToPayNum)
    ? totalDue
    : round2(Math.min(Math.max(0, amountToPayNum), totalDue))
  const remaining = round2(totalDue - payingAmount)

  const selectedGross = round2(selectedFees.reduce((s, f) => s + f.amount, 0))
  const selectedPriorPaid = round2(selectedFees.reduce((s, f) => s + f.paid, 0))
  const selectedDiscount = round2(selectedFees.reduce((s, f) => s + (f.hasAppliedNew ? f.appliedDiscount : 0), 0))

  const priorEntries = useMemo(() => {
    const ids = new Set(selectedFeeIds.map((id) => Number(id)))
    return (paymentLog || []).filter((e) => e.feePaymentId != null && ids.has(Number(e.feePaymentId)))
  }, [paymentLog, selectedFeeIds])
  const priorTotal = round2(priorEntries.reduce((s, e) => s + num(e.amountPaid), 0))

  const allocation = useMemo<Record<number, number>>(() => {
    const out: Record<number, number> = {}
    let left = payingAmount
    for (const f of selectedFees) {
      if (left <= 0) {
        out[f.id] = 0
        continue
      }
      const p = round2(Math.min(f.balance, left))
      out[f.id] = p
      left = round2(left - p)
    }
    return out
  }, [selectedFees, payingAmount])
  const amountPaidTotal = Object.values(allocation).reduce((s, v) => s + v, 0)

  const buildReceipt = (countAs: AppliedFee[]): FeeReceiptData | null => {
    if (!student || countAs.length === 0) return null
    const lines: FeeReceiptLine[] = countAs.map((f, i) => {
      const paid = allocation[f.id] ?? f.balance
      return { sno: i + 1, group: f.groupName, feeType: f.feeTypeName, amount: f.amount, discount: f.discount, fine: f.fine, paid }
    })
    const methodDetail =
      payment.method === "Cheque"
        ? [payment.chequeNo ? `Cheque ${payment.chequeNo}` : "", payment.bank || ""].filter(Boolean).join(", ")
        : payment.method === "Card" || payment.method === "Online Transfer"
          ? payment.transactionId || ""
          : ""
    return {
      receiptNo: `RC-${Date.now().toString().slice(-8)}`,
      date: new Date().toISOString().split("T")[0],
      method: payment.method,
      methodDetail,
      note: approvalNote(countAs),
      studentName: student.name,
      studentClass: student.className,
      section: student.section,
      admissionNo: student.admissionNo,
      rollNo: student.rollNo || "",
      lines,
      total: lines.reduce((s, l) => s + l.paid, 0),
      school: schoolInfo,
    }
  }

  const printReceipt = () => {
    if (!receipt) return
    const frame = docFrameRef.current
    if (!frame) return
    frame.srcdoc = buildReceiptHtml(receipt)
    frame.onload = () => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    }
  }

  const handlePayNow = async () => {
    if (!student || selectedFeeIds.length === 0) return
    setPaying(true)
    const today = new Date().toISOString().split("T")[0]
    const selectedResolved = resolvedFees.filter((f) => selectedFeeIds.includes(f.id))
    const paidFees = selectedResolved.filter((f) => (allocation[f.id] ?? 0) > 0 || (f.hasAppliedNew && f.appliedDiscount > 0))
    const note = approvalNote(selectedResolved)
    const paidAt = new Date().toISOString()
    try {
      const logRows: any[] = []
      for (const f of resolvedFees) {
        if (!selectedFeeIds.includes(f.id)) continue
        const pay = allocation[f.id] ?? 0
        const hasApplied = f.hasAppliedNew && f.appliedDiscount > 0
        if (pay <= 0 && !hasApplied) continue
        const newPaid = f.paid + pay
        const settled = round2(newPaid + f.discount) >= round2(f.amount)
        const status = settled ? "Paid" : "Partial"
        await updateFee(f.id, {
          paidAmount: newPaid,
          status,
          paymentMode: payment.method,
          paymentDate: today,
          transactionId: payment.transactionId || null,
          bankName: payment.method === "Cheque" ? (payment.bank || null) : null,
          chequeNo: payment.method === "Cheque" ? (payment.chequeNo || null) : null,
          note: note || null,
          ...(hasApplied ? { discountId: f.appliedDiscountId, discountAmount: f.appliedDiscount } : {}),
        })
        if (pay <= 0) continue
        const incomeHeadId = incomeHeadForGroup(f.groupName, incomeHeads)
        if (incomeHeadId) {
          await fetch("/api/income", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              incomeHeadId,
              name: student.name,
              date: today,
              amount: pay,
              description: `${f.feeTypeName} (${f.groupName})`,
              paymentMode: payment.method,
              note: note || "",
              feePaymentId: f.id,
              studentId: student.id,
            }),
          }).catch(() => {})
        }
        logRows.push({
          studentId: student.id,
          feePaymentId: f.id,
          feeTypeId: f.feesType ?? null,
          feeGroupId: f.feesGroup ?? null,
          amountPaid: pay,
          paymentMode: payment.method,
          transactionId: payment.transactionId || null,
          bankName: payment.method === "Cheque" ? (payment.bank || null) : null,
          chequeNo: payment.method === "Cheque" ? (payment.chequeNo || null) : null,
          note: note || null,
          paidAt,
          createdBy: currentUser?.name || "Admin",
          changeKind: "payment",
          oldStatus: f.status,
          newStatus: status,
          paidBefore: f.paid,
          paidAfter: newPaid,
          studentName: student.name,
          feeTypeName: f.feeTypeName,
        })
      }
      if (logRows.length > 0) {
        await fetch("/api/fees/fees-payment-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(logRows),
        })
      }
      await refetchFees()
      refetchPaymentLog()
      toast.success(`Payment of ${money(symbol, amountPaidTotal)} collected successfully!`)
      const r = buildReceipt(paidFees)
      if (r) setReceipt(r)
      await onSuccess?.()
    } catch (e: any) {
      toast.error(e.message || "Payment failed")
    } finally {
      setPaying(false)
    }
  }

  if (!open || !student) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !paying && onClose()} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl z-10 flex flex-col max-h-[92vh]">
        {receipt ? (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[var(--primary)]" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Payment Receipt</h3>
                  <p className="text-xs text-gray-500">{receipt.school.name} · {receipt.receiptNo}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100">
              <iframe
                ref={docFrameRef}
                title="Receipt preview"
                className="w-full h-full min-h-[560px] bg-white"
                srcDoc={buildReceiptHtml(receipt)}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={printReceipt}
                className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print / Save PDF
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Collect Fees</h3>
                <p className="text-xs text-gray-500">
                  {student.name} · {student.admissionNo} · {student.className} - {student.section}
                </p>
              </div>
              <button onClick={() => !paying && onClose()} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
              {pendingFees.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-500">
                  No pending fees for this student.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100/80">
                          <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedFeeIds.length === pendingFees.length}
                              onChange={() =>
                                setSelectedFeeIds(selectedFeeIds.length === pendingFees.length ? [] : pendingFees.map((f) => f.id))
                              }
                              className="accent-[var(--primary)]"
                            />
                          </th>
                          <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Fee Type</th>
                          <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                          <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {resolvedFees.map((fee) => {
                          const isSelected = selectedFeeIds.includes(fee.id)
                          return (
                            <tr key={fee.id} className={isSelected ? "bg-[var(--primary-light)]" : "bg-white"}>
                              <td className="px-3 py-2.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleFeeSelection(fee.id)}
                                  className="accent-[var(--primary)]"
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="font-medium text-gray-800">{fee.feeTypeName}</div>
                                <div className="text-xs text-gray-500">{fee.groupName}</div>
                              </td>
                              <td className="px-3 py-2.5 text-right text-gray-800">{money(symbol, fee.amount)}</td>
                              <td className={`px-3 py-2.5 text-right font-medium ${fee.rawBalance > 0 ? "text-red-600" : "text-green-600"}`}>{money(symbol, fee.rawBalance)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {activeDiscount && selectedFeeIds.length > 0 && (
                    <div className="flex items-start gap-2 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary-light)] px-4 py-3 text-xs text-gray-700">
                      <Tag className="h-4 w-4 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useDiscount}
                            onChange={() => setUseDiscount((v) => !v)}
                            className="accent-[var(--primary)]"
                          />
                          <span className="font-semibold text-gray-800">Use student discount ({activeDiscount.discountCode})</span>
                        </label>
                        <p className="mt-1 text-gray-600">
                          {activeDiscount.discountType === "Percentage"
                            ? `${activeDiscount.percentage}%`
                            : money(symbol, num(activeDiscount.amount))}{" "}
                          off the total payable.
                          {activeDiscount.approvedBy
                            ? ` Approved by ${activeDiscount.approvedBy}${fmtDateTime(activeDiscount.approvedAt) ? " on " + fmtDateTime(activeDiscount.approvedAt) : ""}.`
                            : " Approved."}
                          {activeDiscount.expiryDate ? ` Valid till ${fmtDate(activeDiscount.expiryDate)}.` : ""}{" "}
                          {useDiscount
                            ? "The receipt records this on the payment note."
                            : "Unchecked — the discount will not be applied to this payment."}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="block text-xs font-medium text-gray-600 mb-2">Payment Method</p>
                      <div className="space-y-2">
                        {[
                          { value: "Cash", icon: Banknote },
                          { value: "Cheque", icon: Building2 },
                          { value: "Card", icon: CreditCard },
                          { value: "Online Transfer", icon: CreditCard },
                        ].map(({ value, icon: Icon }) => (
                          <label key={value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-[var(--primary)]">
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={payment.method === value}
                              onChange={() => setPayment((prev) => ({ ...prev, method: value as PaymentFormData["method"] }))}
                              className="text-[var(--primary)] focus:ring-[var(--primary)]"
                            />
                            <Icon className="h-4 w-4 text-gray-400" />
                            {value}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {payment.method === "Cheque" && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Cheque/DD No</label>
                            <input
                              type="text"
                              value={payment.chequeNo}
                              onChange={(e) => setPayment((prev) => ({ ...prev, chequeNo: e.target.value }))}
                              placeholder="Enter cheque number"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Bank</label>
                            <input
                              type="text"
                              value={payment.bank}
                              onChange={(e) => setPayment((prev) => ({ ...prev, bank: e.target.value }))}
                              placeholder="Enter bank name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                      {(payment.method === "Card" || payment.method === "Online Transfer") && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Transaction ID</label>
                          <input
                            type="text"
                            value={payment.transactionId}
                            onChange={(e) => setPayment((prev) => ({ ...prev, transactionId: e.target.value }))}
                            placeholder="Enter transaction ID"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
                      <textarea
                        value={payment.note}
                        onChange={(e) => setPayment((prev) => ({ ...prev, note: e.target.value }))}
                        rows={3}
                        placeholder="Add a note..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="bg-[var(--primary-light)] px-4 py-2.5 flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">Amount Summary</h4>
                      <span className="text-[11px] text-gray-500">{selectedFees.length} fee(s) selected</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-200">
                      <div className="bg-white px-4 py-3">
                        <p className="text-[11px] font-medium text-gray-500">Selected Total Amount</p>
                        <p className="text-lg font-bold text-gray-900 mt-0.5">{money(symbol, selectedGross)}</p>
                      </div>
                      {selectedPriorPaid > 0 && (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => priorEntries.length > 0 && setShowPriorHistory(true)}
                          onKeyDown={(e) => { if (e.key === "Enter" && priorEntries.length > 0) setShowPriorHistory(true) }}
                          className={`bg-white px-4 py-3 ${priorEntries.length > 0 ? "cursor-pointer hover:bg-gray-50" : ""}`}
                        >
                          <p className="text-[11px] font-medium text-gray-500">Prior Paid</p>
                          <p className="text-lg font-bold text-gray-900 mt-0.5">{money(symbol, selectedPriorPaid)}</p>
                          {priorEntries.length > 0 && <p className="text-[11px] text-[var(--primary)] mt-0.5 underline">View history</p>}
                        </div>
                      )}
                      {activeDiscount ? (
                        <label className="bg-white px-4 py-3 cursor-pointer">
                          <span className="text-[11px] font-medium text-[var(--primary)]">Discount Applied</span>
                          <span className="flex items-center gap-2 mt-1">
                            <input
                              type="checkbox"
                              checked={useDiscount}
                              onChange={() => setUseDiscount((v) => !v)}
                              className="accent-[var(--primary)]"
                            />
                            <span className={`text-lg font-bold ${selectedDiscount > 0 ? "text-[var(--primary)]" : "text-gray-400"} mt-0`}>
                              −{money(symbol, selectedDiscount)}
                            </span>
                          </span>
                          <span className="text-[11px] text-gray-400">{useDiscount ? `${activeDiscount.discountCode} on` : `Skip ${activeDiscount.discountCode}`}</span>
                        </label>
                      ) : null}
                      <div className="bg-white px-4 py-3">
                        <p className="text-[11px] font-medium text-gray-500">Total Payable</p>
                        <p className="text-lg font-bold text-gray-900 mt-0.5">{money(symbol, totalDue)}</p>
                      </div>
                      <div className="bg-white px-4 py-3">
                        <p className="block text-[11px] font-medium text-gray-600 mb-1">Amount to Pay</p>
                        <input
                          type="number"
                          min={0}
                          max={totalDue}
                          value={amountToPay}
                          onChange={(e) => setAmountToPay(e.target.value)}
                          placeholder={money(symbol, totalDue)}
                          className="w-full h-9 px-3 text-base font-bold text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">Leave blank to pay full amount.</p>
                      </div>
                      <div className="bg-white px-4 py-3">
                        <p className="text-[11px] font-medium text-gray-500">Left Amount (Due)</p>
                        <p className={`text-lg font-bold mt-0.5 ${remaining > 0 ? "text-red-600" : "text-green-600"}`}>{money(symbol, remaining)}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{remaining > 0 ? "Balance payable later" : "Settled after discount"}</p>
                      </div>
                    </div>
                  </div>

                  {paymentLog.length > 0 && (
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-gray-100/80 px-4 py-2.5 flex items-center gap-2">
                        <History className="h-4 w-4 text-[var(--primary)]" />
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment History</h4>
                      </div>
                      <div className="divide-y divide-gray-100 max-h-56 overflow-auto">
                        {paymentLog.map((entry) => {
                          const typeName = entry.feeTypeId
                            ? (feeTypes[Number(entry.feeTypeId)]?.name ?? `Type ${entry.feeTypeId}`)
                            : ""
                          const groupName = entry.feeGroupId
                            ? (feeGroups[Number(entry.feeGroupId)] ?? `Group ${entry.feeGroupId}`)
                            : ""
                          return (
                            <div key={entry.id} className="px-4 py-3 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {typeName || "Fees"} {groupName ? <span className="text-gray-400 font-normal">· {groupName}</span> : null}
                                </p>
                                <p className="text-[11px] text-gray-500">Paid on {fmtDateTime(entry.paidAt)}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-green-600">{money(symbol, num(entry.amountPaid))}</p>
                                <p className="text-[11px] text-gray-500 capitalize">
                                  {entry.paymentMode || "Cash"}
                                  {entry.createdBy ? ` · ${entry.createdBy}` : ""}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {pendingFees.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={onClose}
                  disabled={paying}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayNow}
                  disabled={selectedFeeIds.length === 0 || payingAmount <= 0 || paying}
                  className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-green-200"
                >
                  {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {paying ? "Processing..." : `Collect ${money(symbol, payingAmount)}`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showPriorHistory && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPriorHistory(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[var(--primary)]" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Prior Payment History</h3>
                  <p className="text-xs text-gray-500">{student.name} · {student.admissionNo}</p>
                </div>
              </div>
              <button onClick={() => setShowPriorHistory(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {priorEntries.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No prior payments recorded for the selected fees.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {priorEntries.map((entry) => {
                    const typeName = entry.feeTypeId ? (feeTypes[Number(entry.feeTypeId)]?.name ?? `Type ${entry.feeTypeId}`) : ""
                    const groupName = entry.feeGroupId ? (feeGroups[Number(entry.feeGroupId)] ?? `Group ${entry.feeGroupId}`) : ""
                    return (
                      <div key={entry.id} className="px-1 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {typeName || "Fees"} {groupName ? <span className="text-gray-400 font-normal">· {groupName}</span> : null}
                          </p>
                          <p className="text-[11px] text-gray-500">Paid on {fmtDateTime(entry.paidAt)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-green-600">{money(symbol, num(entry.amountPaid))}</p>
                          <p className="text-[11px] text-gray-500 capitalize">
                            {entry.paymentMode || "Cash"}
                            {entry.createdBy ? ` · ${entry.createdBy}` : ""}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500">Total prior paid</span>
              <span className="text-base font-bold text-gray-900">{money(symbol, priorTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}