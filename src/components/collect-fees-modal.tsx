"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Loader2, Printer, CreditCard, Banknote, Building2, X, FileText, Tag } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"
import { useSchoolInfo } from "@/lib/use-school-info"
import { toast } from "@/lib/toast"
import { buildReceiptHtml, type FeeReceiptData, type FeeReceiptLine } from "@/lib/fee-receipt"

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
}

type CurrentUser = {
  id: number
  name: string
  role: string
}

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

const num = (v: unknown) => {
  const n = Number(v)
  return isNaN(n) ? 0 : n
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
  const [selectedFeeIds, setSelectedFeeIds] = useState<number[]>([])
  const [partialAmounts, setPartialAmounts] = useState<Record<number, number>>({})
  const [payment, setPayment] = useState<PaymentFormData>({
    method: "Cash", chequeNo: "", bank: "", transactionId: "", note: "",
  })
  const [paying, setPaying] = useState(false)
  const [receipt, setReceipt] = useState<FeeReceiptData | null>(null)
  const [studentDiscounts, setStudentDiscounts] = useState<StudentDiscount[]>([])
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
    ]).catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    setSelectedFeeIds([])
    setPartialAmounts({})
    setPayment({ method: "Cash", chequeNo: "", bank: "", transactionId: "", note: "" })
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
          const groupName = f.feesGroup ? (feeGroups[Number(f.feesGroup)] ?? `Group ${f.feesGroup}`) : "-"
          const feeTypeName = f.feesType ? (feeTypes[Number(f.feesType)]?.name ?? `Type ${f.feesType}`) : "-"
          return { ...f, feeTypeName, groupName, amount, discount, fine, paid, balance }
        })
        .filter((r) => r.balance > 0 && (groupSet.size === 0 || groupSet.has(Number(r.feesGroup)))),
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
    if (!activeDiscount || pendingFees.length === 0) return entries
    const map = new Map(entries.map((e) => [e.id, e]))
    const eligible = pendingFees.filter((f) => num(f.discountAmount) <= 0 && f.amount - f.paid > 0)
    if (eligible.length === 0) return entries

    const applyTo = (f: ResolvedFee, raw: number) => {
      const capped = Math.max(0, Math.min(round2(raw), f.amount - f.paid))
      if (capped <= 0) return
      const row = map.get(f.id)!
      row.appliedDiscount = capped
      row.appliedDiscountId = activeDiscount.id
      row.hasAppliedNew = true
      row.discount = round2(f.discount + capped)
      row.balance = round2(f.amount - row.discount - f.paid)
    }

    if (activeDiscount.discountType === "Percentage") {
      for (const f of eligible) applyTo(f, (f.amount * num(activeDiscount.percentage)) / 100)
    } else {
      const totalPool = eligible.reduce((s, f) => s + f.amount, 0)
      if (totalPool > 0) {
        let remaining = num(activeDiscount.amount)
        eligible.forEach((f, i) => {
          if (i === eligible.length - 1) {
            applyTo(f, remaining)
          } else {
            const share = round2((remaining * f.amount) / totalPool)
            remaining -= share
            applyTo(f, share)
          }
        })
      }
    }
    return Array.from(map.values())
  }, [pendingFees, activeDiscount])

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

  const handlePartialAmount = (feeId: number, value: string) => {
    const n = parseFloat(value) || 0
    setPartialAmounts((prev) => ({ ...prev, [feeId]: n }))
  }

  const selectedFees = resolvedFees.filter((f) => selectedFeeIds.includes(f.id))
  const totalAmount = selectedFees.reduce((sum, f) => {
    const entered = partialAmounts[f.id]
    return sum + (entered !== undefined && entered > 0 ? Math.min(entered, f.balance) : f.balance)
  }, 0)

  const buildReceipt = (countAs: AppliedFee[]): FeeReceiptData | null => {
    if (!student || countAs.length === 0) return null
    const lines: FeeReceiptLine[] = countAs.map((f, i) => {
      const entered = partialAmounts[f.id]
      const paid = entered !== undefined && entered > 0 ? Math.min(entered, f.balance) : f.balance
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
    const paidFees = resolvedFees.filter((f) => selectedFeeIds.includes(f.id))
    const note = approvalNote(paidFees)
    try {
      for (const f of resolvedFees) {
        if (!selectedFeeIds.includes(f.id)) continue
        const entered = partialAmounts[f.id]
        const pay = entered !== undefined && entered > 0 ? Math.min(entered, f.balance) : f.balance
        if (pay <= 0) continue
        const newPaid = f.paid + pay
        const status = newPaid >= f.amount ? "Paid" : newPaid > 0 ? "Partial" : "Unpaid"
        await updateFee(f.id, {
          paidAmount: newPaid,
          status,
          paymentMode: payment.method,
          paymentDate: today,
          transactionId: payment.transactionId || null,
          bankName: payment.method === "Cheque" ? (payment.bank || null) : null,
          chequeNo: payment.method === "Cheque" ? (payment.chequeNo || null) : null,
          note: note || null,
          ...(f.hasAppliedNew && f.appliedDiscount > 0 ? { discountId: f.appliedDiscountId, discountAmount: f.appliedDiscount } : {}),
        })
      }
      await refetchFees()
      toast.success(`Payment of ${money(symbol, totalAmount)} collected successfully!`)
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
                          <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Discount</th>
                          <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                          <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {resolvedFees.map((fee) => {
                          const isSelected = selectedFeeIds.includes(fee.id)
                          const entered = partialAmounts[fee.id]
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
                              <td className="px-3 py-2.5 text-right">
                                {fee.discount > 0 ? (
                                  <span className="text-[var(--primary)] font-medium">{money(symbol, fee.discount)}</span>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                              <td className={`px-3 py-2.5 text-right font-medium ${fee.balance > 0 ? "text-red-600" : "text-green-600"}`}>{money(symbol, fee.balance)}</td>
                              <td className="px-3 py-2.5 text-right">
                                {isSelected && fee.balance > 0 ? (
                                  <input
                                    type="number"
                                    min={0}
                                    max={fee.balance}
                                    value={entered ?? ""}
                                    onChange={(e) => handlePartialAmount(fee.id, e.target.value)}
                                    placeholder={`${fee.balance}`}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-xs text-right focus:ring-1 focus:ring-[var(--primary)]"
                                  />
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {activeDiscount && resolvedFees.some((f) => f.hasAppliedNew) && (
                    <div className="flex items-start gap-2 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary-light)] px-4 py-3 text-xs text-gray-700">
                      <Tag className="h-4 w-4 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                      <span>
                        <span className="font-semibold text-gray-800">Student discount applied</span> — coupon{" "}
                        <span className="font-mono font-medium text-[var(--primary)]">{activeDiscount.discountCode}</span>{" "}
                        reduces the balance above.
                        {activeDiscount.approvedBy
                          ? ` Approved by ${activeDiscount.approvedBy}${fmtDateTime(activeDiscount.approvedAt) ? " on " + fmtDateTime(activeDiscount.approvedAt) : ""}.`
                          : " Approved."}
                        {activeDiscount.expiryDate ? ` Valid till ${fmtDate(activeDiscount.expiryDate)}.` : ""}{" "}
                        The receipt records this on the payment note.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
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

                    <div className="bg-[var(--primary-light)] rounded-xl p-4 flex flex-col justify-center">
                      <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wider">Total Amount</p>
                      <p className="text-2xl font-bold text-[var(--primary)] mt-1">{money(symbol, totalAmount)}</p>
                      <p className="text-xs text-[var(--primary)] mt-0.5">{selectedFees.length} fee(s) selected</p>
                    </div>
                  </div>
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
                  disabled={selectedFeeIds.length === 0 || totalAmount <= 0 || paying}
                  className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-green-200"
                >
                  {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {paying ? "Processing..." : `Collect ${money(symbol, totalAmount)}`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}