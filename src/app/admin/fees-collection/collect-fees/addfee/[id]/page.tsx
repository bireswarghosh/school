"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"
import { ArrowLeft, Loader2, Printer, CreditCard, Banknote, Building2, X, Check, Trash2 } from "lucide-react"

type StudentRecord = {
  id: number
  admissionNo: string
  rollNo: string
  firstName: string
  middleName: string
  lastName: string
  class: string
  section: string
  gender: string
  dob: string
  category: string
  mobile: string
  fatherName: string
  status?: string
}

type FeeRecord = {
  id: number
  studentId: number | string
  feesGroup: number | string
  feesType: number | string
  amount: number | string
  discountAmount: number | string
  fineAmount: number | string
  paidAmount: number | string
  status: string
  paymentMode: string
  paymentDate: string
  transactionId: string
  session?: string
}

type ResolvedFee = FeeRecord & {
  feeTypeName: string
  groupName: string
  dueDate: string
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

const num = (v: unknown) => {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

const money = (symbol: string, v: number) => `${symbol}${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fullName = (first: string | undefined | null, middle: string | undefined | null, last: string | undefined | null) =>
  [first, middle, last].filter((n) => n && n.trim()).join(" ")

const fmtDate = (d: string | undefined | null) => {
  if (!d) return "-"
  const parts = d.split("T")[0].split("-")
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d
}

export default function AddFeePage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { symbol } = useCurrency()

  const [student, setStudent] = useState<StudentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [feeGroups, setFeeGroups] = useState<Record<number, string>>({})
  const [feeTypes, setFeeTypes] = useState<Record<number, { name: string; group: string }>>({})
  const [masterDueDates, setMasterDueDates] = useState<Record<string, string>>({})

  const feesApi = useMemo(() => `/api/fees/fees-payment?studentId=${id}`, [id])
  const { data: fees, update, refetch } = useApi<FeeRecord>(feesApi)

  const [selectedFeeIds, setSelectedFeeIds] = useState<number[]>([])
  const [partialAmounts, setPartialAmounts] = useState<Record<number, number>>({})
  const [payment, setPayment] = useState<PaymentFormData>({
    method: "Cash", chequeNo: "", bank: "", transactionId: "", note: "",
  })
  const [paying, setPaying] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FeeRecord | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/student-information/student?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return }
        setStudent(data)
      })
      .catch(() => setError("Failed to load student"))
      .finally(() => setLoading(false))
  }, [id])

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
      fetch("/api/fees/fees-master").then((r) => r.json()).then((d) => {
        const map: Record<string, string> = {}
        ;(Array.isArray(d) ? d : []).forEach((m: any) => { if (m.dueDate) map[`${m.feesGroup}|${m.feesType}`] = m.dueDate })
        setMasterDueDates(map)
      }),
    ]).catch(() => {})
  }, [])

  const resolved: ResolvedFee[] = useMemo(() => {
    return (fees || []).map((f) => {
      const amount = num(f.amount)
      const discount = num(f.discountAmount)
      const fine = num(f.fineAmount)
      const paid = num(f.paidAmount)
      const balance = amount - discount - paid
      const groupName = f.feesGroup ? (feeGroups[Number(f.feesGroup)] ?? `Group ${f.feesGroup}`) : "-"
      const feeTypeName = f.feesType ? (feeTypes[Number(f.feesType)]?.name ?? `Type ${f.feesType}`) : "-"
      const dueDate = masterDueDates[`${groupName}|${feeTypeName}`] || "-"
      return { ...f, groupName, feeTypeName, dueDate, amount, discount, fine, paid, balance }
    })
  }, [fees, feeGroups, feeTypes, masterDueDates])

  const totalBalance = resolved.reduce((s, f) => s + f.balance, 0)

  const toggleFeeSelection = (feeId: number) => {
    setSelectedFeeIds((prev) =>
      prev.includes(feeId) ? prev.filter((id) => id !== feeId) : [...prev, feeId]
    )
  }

  const handlePartialAmount = (feeId: number, value: string) => {
    const n = parseFloat(value) || 0
    setPartialAmounts((prev) => ({ ...prev, [feeId]: n }))
  }

  const selectedFees = resolved.filter((f) => selectedFeeIds.includes(f.id))
  const totalAmount = selectedFees.reduce((sum, f) => {
    const entered = partialAmounts[f.id]
    return sum + (entered !== undefined && entered > 0 ? Math.min(entered, f.balance) : f.balance)
  }, 0)

  const handlePayNow = async () => {
    if (selectedFeeIds.length === 0) return
    setPaying(true)
    const today = new Date().toISOString().split("T")[0]
    try {
      for (const f of resolved) {
        if (!selectedFeeIds.includes(f.id)) continue
        const entered = partialAmounts[f.id]
        const pay = entered !== undefined && entered > 0 ? Math.min(entered, f.balance) : f.balance
        if (pay <= 0) continue
        const newPaid = f.paid + pay
        const status = newPaid >= f.amount ? "Paid" : newPaid > 0 ? "Partial" : "Unpaid"
        await update(f.id, {
          paidAmount: newPaid,
          status,
          paymentMode: payment.method,
          paymentDate: today,
          transactionId: payment.transactionId || null,
          bankName: payment.method === "Cheque" ? (payment.bank || null) : null,
          chequeNo: payment.method === "Cheque" ? (payment.chequeNo || null) : null,
          note: payment.note || null,
        })
      }
      setToast(`Payment of ${money(symbol, totalAmount)} collected successfully!`)
      setSelectedFeeIds([])
      setPartialAmounts({})
    } catch (e: any) {
      notify.error(e.message || "Payment failed")
    } finally {
      setPaying(false)
    }
  }

  const handleDeleteFee = (f: FeeRecord) => setDeleteTarget(f)

  const confirmDeleteFee = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/fees/fees-payment?id=${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete fee record")
      notify.success("Fee record deleted successfully!")
      setDeleteTarget(null)
      setSelectedFeeIds((prev) => prev.filter((id) => id !== deleteTarget.id))
      await refetch()
    } catch (e: any) {
      notify.error(e.message || "Failed to delete fee record")
    }
  }

  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-sm">{error || "Student not found"}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-[var(--primary)] border border-gray-300 rounded-lg hover:bg-[var(--primary-light)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
          <Check className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Collect Fees</h2>
            <p className="text-sm text-gray-500 mt-1">
              Fees Collection / Collect Fees / {fullName(student.firstName, student.middleName, student.lastName)}
            </p>
          </div>
        </div>
      </div>

      {/* Student Info + Fees Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50/50 to-white flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Fee Details</h3>
          <span className="text-xs text-gray-500">Admission No: {student.admissionNo}</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Student Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 h-fit">
              <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Student Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium text-gray-800">{fullName(student.firstName, student.middleName, student.lastName)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Class</span>
                  <span className="font-medium text-gray-800">{student.class}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Section</span>
                  <span className="font-medium text-gray-800">{student.section}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Admission No</span>
                  <span className="font-medium text-gray-800">{student.admissionNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Roll No</span>
                  <span className="font-medium text-gray-800">{student.rollNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Father Name</span>
                  <span className="font-medium text-gray-800">{student.fatherName || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">DOB</span>
                  <span className="font-medium text-gray-800">{fmtDate(student.dob)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mobile</span>
                  <span className="font-medium text-gray-800">{student.mobile || "-"}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Total Balance</span>
                  <span className={`font-semibold ${totalBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                    {money(symbol, totalBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Panel - Fees Table */}
            <div className="lg:col-span-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase w-8">#</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Fees Group</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Fee Type</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Due Date</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Amount</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Discount</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Fine</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Paid</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Balance</th>
                    <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {resolved.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-gray-400">No fee records found for this student</td>
                    </tr>
                  ) : (
                    resolved.map((fee, idx) => {
                      const isSelected = selectedFeeIds.includes(fee.id)
                      const isPaid = fee.status === "Paid" || fee.status === "paid"
                      const enteredAmt = partialAmounts[fee.id]
                      return (
                        <tr key={fee.id} className={`border-b border-gray-100 hover:bg-[var(--primary-light)]/20 transition-colors ${idx % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isPaid}
                              onChange={() => toggleFeeSelection(fee.id)}
                              className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-gray-600">{fee.groupName}</td>
                          <td className="px-3 py-2.5 font-medium text-gray-800">{fee.feeTypeName}</td>
                          <td className="px-3 py-2.5 text-gray-600">{fee.dueDate === "-" ? "-" : fmtDate(fee.dueDate)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-800">{money(symbol, fee.amount)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{fee.discount > 0 ? money(symbol, fee.discount) : "-"}</td>
                          <td className="px-3 py-2.5 text-right text-red-600">{fee.fine > 0 ? money(symbol, fee.fine) : "-"}</td>
                          <td className="px-3 py-2.5 text-right text-green-600">{fee.paid > 0 ? money(symbol, fee.paid) : "-"}</td>
                          <td className={`px-3 py-2.5 text-right font-medium ${fee.balance > 0 ? "text-red-600" : "text-green-600"}`}>{money(symbol, fee.balance)}</td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {!isPaid && isSelected && (
                                <input
                                  type="number"
                                  min={0}
                                  max={fee.balance}
                                  value={enteredAmt ?? ""}
                                  onChange={(e) => handlePartialAmount(fee.id, e.target.value)}
                                  placeholder={`${fee.balance}`}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[var(--primary)]"
                                />
                              )}
                              {!isPaid && (
                                <button
                                  onClick={() => handleDeleteFee(fee)}
                                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700">Payment Details</h4>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Payment Method */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Payment Method</label>
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

            {/* Dynamic Fields */}
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

            {/* Note */}
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

            {/* Total Amount */}
            <div className="bg-[var(--primary-light)] rounded-xl p-4 flex flex-col justify-center">
              <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wider">Total Amount</p>
              <p className="text-2xl font-bold text-[var(--primary)] mt-1">{money(symbol, totalAmount)}</p>
              <p className="text-xs text-[var(--primary)] mt-0.5">{selectedFees.length} fee(s) selected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-500">{selectedFees.length} fee(s) selected</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => notify.success("Receipt printed successfully!")}
            className="px-4 py-2 text-sm font-medium text-[var(--primary)] border border-indigo-300 rounded-lg hover:bg-[var(--primary-light)] transition-colors flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
          <button
            onClick={handlePayNow}
            disabled={selectedFeeIds.length === 0 || paying}
            className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-green-200"
          >
            {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            {paying ? "Processing..." : "Pay Now"}
          </button>
        </div>
      </div>

      {/* Delete Fee Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setDeleteTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-red-50">
                  <Trash2 className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-sm text-gray-600">
                  Are you sure you want to remove this fee record?
                  <strong className="block mt-1 text-gray-800">
                    {(() => {
                      const f = resolved.find((r) => r.id === deleteTarget.id)
                      return f ? `${f.feeTypeName} (${money(symbol, f.amount)})` : ""
                    })()}
                  </strong>
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFee}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
