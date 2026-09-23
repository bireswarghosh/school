"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, X, TicketCheck, Printer, Eye } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"
import { useSchoolInfo } from "@/lib/use-school-info"
import RegFormInvoiceModal from "@/components/reg-form-invoice"

type IncomeHead = {
  id: number
  name: string
}

type IncomeRecord = {
  id: number
  studentId?: number
  feePaymentId?: number | null
  incomeHeadId: number
  incomeHead: string
  name: string
  invoiceNo: string
  date: string
  amount: number
  originalAmount?: number
  discountAmountTotal?: number
  paidAmountTotal?: number
  description: string
  paymentMode: string
  note: string
  document: string
}

type IncomeGroup = {
  name: string
  date: string
  records: IncomeRecord[]
  total: number
}

type EnquiryRecord = {
  id: number
  name: string
  phone: string
  email: string
  address: string
  classVal: string
  reference: string
  source: string
  regFormPurchased: boolean
  regFormNo: string
  regFormAmount: number | string
  regFormPaymentMode: string
  regFormPaymentDate: string
  regFormStatus: string
  regFormTransactionId: string
  regFormChequeNo: string
  regFormBank: string
  regFormNote: string
}

export default function SearchIncomePage() {
  const { symbol } = useCurrency()
  const { data: allIncomes } = useApi<IncomeRecord>("/api/income")
  const { data: incomeHeads } = useApi<IncomeHead>("/api/income/head")
  const { data: enquiries } = useApi<EnquiryRecord>("/api/front-office/admission-enquiry")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [searchHead, setSearchHead] = useState("")
  const [searchText, setSearchText] = useState("")
  const [searched, setSearched] = useState(false)
  const [invoiceRecord, setInvoiceRecord] = useState<EnquiryRecord | null>(null)
  const [viewStudent, setViewStudent] = useState<IncomeGroup | null>(null)

  const results = useMemo(() => {
    if (!searched || !allIncomes) return []
    let filtered = [...allIncomes]

    if (dateFrom) {
      filtered = filtered.filter((inc) => inc.date && new Date(inc.date) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter((inc) => inc.date && new Date(inc.date) <= new Date(dateTo + "T23:59:59"))
    }

    if (searchHead) {
      filtered = filtered.filter((inc) => inc.incomeHeadId?.toString() === searchHead)
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      filtered = filtered.filter(
        (inc) =>
          inc.name.toLowerCase().includes(q) ||
          inc.invoiceNo?.toLowerCase().includes(q) ||
          (inc.incomeHead || "").toLowerCase().includes(q)
      )
    }

    return filtered
  }, [allIncomes, dateFrom, dateTo, searchHead, searchText, searched])

  const totalAmount = useMemo(() => results.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0), [results])

  const grouped = useMemo<IncomeGroup[]>(() => {
    const map = new Map<string, IncomeRecord[]>()
    for (const inc of results) {
      const key = `${inc.name || "Unknown"}|${inc.date || ""}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(inc)
    }
    return Array.from(map.entries()).map(([key, records]) => {
      const [, date] = key.split("|")
      return {
        name: records[0].name || "Unknown",
        date,
        records,
        total: records.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0),
      }
    })
  }, [results])

  const transactions = useMemo(() => {
    let filtered = (enquiries || []).filter((e) => e.regFormPurchased)
    if (dateFrom) filtered = filtered.filter((e) => e.regFormPaymentDate && e.regFormPaymentDate >= dateFrom)
    if (dateTo) filtered = filtered.filter((e) => e.regFormPaymentDate && e.regFormPaymentDate <= dateTo)
    return filtered
  }, [enquiries, dateFrom, dateTo])

  const totalTxn = useMemo(() => transactions.reduce((sum, e) => sum + (Number(e.regFormAmount) || 0), 0), [transactions])

  const handleReset = () => {
    setDateFrom("")
    setDateTo("")
    setSearchHead("")
    setSearchText("")
    setSearched(false)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Search Income</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">Income / Search Income</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Search Criteria</h3>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setSearched(true) }} className="p-4 flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Date From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Date To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Income Head</label>
            <select value={searchHead} onChange={(e) => setSearchHead(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All</option>
              {(incomeHeads || []).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600">Search by Income</label>
            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search by name, head, or invoice..."
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div className="flex gap-2">
            <button type="submit"
              className="flex items-center gap-1.5 px-5 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
              <Search className="h-4 w-4" /> Search
            </button>
            {searched && (
              <button type="button" onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="h-4 w-4" /> Reset
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white"><TicketCheck className="h-4 w-4" /></span>
            Registration Form Purchase — Payment Transactions
          </h3>
          <div className="text-xs text-gray-600">
            <strong className="text-gray-800">{transactions.length}</strong> purchase{transactions.length === 1 ? "" : "s"}
            <span className="mx-2 text-gray-300">|</span>
            Total: <span className="font-bold text-amber-700">{symbol}{totalTxn.toLocaleString()}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Name", "Class", "Reg Form No", "Payment Date", "Payment Mode", "Reference / Txn ID", `Amount (${symbol})`, "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-400">No registration form purchases found</td></tr>
              ) : (
                transactions.map((e, idx) => {
                  const ref = e.regFormTransactionId || e.regFormChequeNo || e.regFormBank || ""
                  return (
                    <tr key={e.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? "bg-gray-50/50" : ""} hover:bg-gray-50 transition-colors`}>
                      <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{e.name}</td>
                      <td className="px-4 py-3 text-gray-600">{e.classVal || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs whitespace-nowrap">{e.regFormNo || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{e.regFormPaymentDate || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">{e.regFormPaymentMode || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{ref || "—"}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{symbol}{(Number(e.regFormAmount) || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${e.regFormStatus === "Purchased" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                          {e.regFormStatus || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setInvoiceRecord(e)}
                          className="p-1.5 text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors"
                          title="Print Reg Form Invoice"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-amber-100 flex items-center justify-between text-sm text-gray-600 flex-wrap gap-2">
          <span>Showing <strong>{transactions.length}</strong> registration form purchase transactions (filtered by Date From/To above)</span>
          <span className="font-semibold text-gray-800">
            Total: <span className="text-amber-700">{symbol}{totalTxn.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {searched && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-gray-800">Fees Paid — Grouped by Student & Date</h3>
              <span className="text-xs text-gray-600">
                <strong className="text-gray-800">{grouped.length}</strong> group{grouped.length === 1 ? "" : "s"}
                <span className="mx-2 text-gray-300">|</span>
                <strong className="text-gray-800">{results.length}</strong> record{results.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Student Name", "Date", "Records", `Total Amount Paid (${symbol})`, "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grouped.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No matching income records found</td></tr>
                  ) : (
                    grouped.map((g, idx) => (
                      <tr key={`${g.name}|${g.date}`} className={`border-b border-gray-100 ${idx % 2 === 1 ? "bg-gray-50/50" : ""} hover:bg-gray-50 transition-colors`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{g.name}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{g.date || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">{g.records.length}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-800 font-semibold">{symbol}{g.total.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setViewStudent(g)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing <strong>{results.length}</strong> records
            </span>
            <span className="text-sm font-semibold text-gray-800">
              Total Amount: <span className="text-[var(--primary)]">{symbol}{totalAmount.toLocaleString()}</span>
            </span>
          </div>
        </>
      )}

      {!searched && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Select date range and criteria, then click Search to find income records</p>
        </div>
      )}

      {/* Reg Form Invoice Modal */}
      {invoiceRecord && (
        <RegFormInvoiceModal data={invoiceRecord} onClose={() => setInvoiceRecord(null)} />
      )}

      {viewStudent && (
        <StudentIncomeModal student={viewStudent} symbol={symbol} onClose={() => setViewStudent(null)} />
      )}
    </div>
  )
}

function StudentIncomeModal({ student, symbol, onClose }: { student: IncomeGroup; symbol: string; onClose: () => void }) {
  const { info: school } = useSchoolInfo()
  const firstStudentId = student.records.find((r) => r.studentId)?.studentId
  const [studentInfo, setStudentInfo] = useState<Record<string, unknown> | null>(null)
  useEffect(() => {
    document.body.classList.add("printing-modal-open")
    if (firstStudentId) {
      fetch(`/api/students?id=${firstStudentId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setStudentInfo(d))
        .catch(() => setStudentInfo(null))
    }
    return () => document.body.classList.remove("printing-modal-open")
  }, [firstStudentId])

  const inr = (n: number) => symbol + (Number(n) || 0).toLocaleString()
  const str = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "")
  const classVal = str(studentInfo?.class || studentInfo?.className)
  const section = str(studentInfo?.section || studentInfo?.sectionName)
  const admissionNo = str(studentInfo?.admissionNo || studentInfo?.admission_no)
  const rollNo = str(studentInfo?.rollNo || studentInfo?.roll_no)

  const totals = useMemo(() => {
    let original = 0
    let discount = 0
    let paid = 0
    const seen = new Set<string>()
    for (const r of student.records) {
      const amt = Number(r.amount) || 0
      paid += amt
      const orig = Number(r.originalAmount) || 0
      const disc = Number(r.discountAmountTotal) || 0
      if (orig > 0 || disc > 0) {
        const key = r.feePaymentId ? `fp-${r.feePaymentId}` : `r-${r.id}`
        if (!seen.has(key)) {
          seen.add(key)
          original += orig
          discount += disc
        }
      } else {
        original += amt
      }
    }
    const r2 = (n: number) => Math.round(n * 100) / 100
    return { original: r2(original), discount: r2(discount), paid: r2(paid) }
  }, [student.records])
  const infoRow = (label: string, value?: string | number | null) => {
    const v = value === null || value === undefined || value === "" ? null : String(value)
    return v ? (
      <div className="flex justify-between gap-4 py-0.5">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-800 text-right">{v}</span>
      </div>
    ) : null
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 print:block print:p-0" id="income-statement-modal">
        <div className="absolute inset-0 bg-black/50 print:hidden" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible print:rounded-none print:shadow-none">
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between print:hidden sticky top-0 bg-white z-10 rounded-t-2xl">
            <h3 className="text-base font-semibold text-gray-800">Fees Paid Statement — {student.name}{student.date ? ` (${student.date})` : ""}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div id="income-statement" className="p-6 print:p-4">
            <div className="flex items-start justify-between gap-6 border-b-2 border-gray-800 pb-4">
              <div>
                {school.logoSrc && (
                  <img src={school.logoSrc} alt={`${school.name} logo`} className="h-12 w-12 object-contain mb-2" />
                )}
                <p className="text-2xl font-black text-gray-900">{school.name || "Smart School"}</p>
                {school.address && <p className="text-xs text-gray-500 mt-0.5 max-w-[260px]">{school.address}</p>}
                <p className="text-xs text-gray-500 mt-0.5">
                  {[school.phone, school.email, school.website].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black tracking-wide text-[var(--primary)]">FEES PAID STATEMENT</p>
                <p className="text-xs text-gray-600 mt-1">
                  Student: <span className="font-bold text-gray-900">{student.name}</span>
                </p>
                {classVal && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    Class: <span className="font-bold text-gray-900">{classVal}{section ? ` - ${section}` : ""}</span>
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-0.5">
                  Date: <span className="font-bold text-gray-900">{student.date || "—"}</span>
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Records: <span className="font-bold text-gray-900">{student.records.length}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 py-4 border-b border-gray-200">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Student Details</p>
                <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 space-y-1">
                  {infoRow("Student Name", student.name)}
                  {infoRow("Class", classVal)}
                  {infoRow("Section", section)}
                  {infoRow("Admission No", admissionNo)}
                  {infoRow("Roll No", rollNo)}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Statement Summary</p>
                <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 space-y-1">
                  {infoRow("Total Amount", inr(totals.original))}
                  {totals.discount > 0 && infoRow("Discount Applied", `−${inr(totals.discount)}`)}
                  {infoRow("Total Paid", inr(totals.paid))}
                </div>
              </div>
            </div>

            <table className="w-full text-sm mt-4">
              <thead>
                <tr className="border-b-2 border-gray-300 text-gray-500 text-xs uppercase">
                  <th className="text-left py-2 font-bold">#</th>
                  <th className="text-left py-2 font-bold">Date</th>
                  <th className="text-left py-2 font-bold">Income Head</th>
                  <th className="text-left py-2 font-bold">Invoice No</th>
                  <th className="text-left py-2 font-bold">Payment Mode</th>
                  <th className="text-right py-2 font-bold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {student.records.map((inc, idx) => (
                  <tr key={inc.id} className="border-b border-gray-200 align-top">
                    <td className="py-2 text-gray-600">{idx + 1}</td>
                    <td className="py-2 text-gray-700 whitespace-nowrap">{inc.date || "—"}</td>
                    <td className="py-2 text-gray-800">{inc.incomeHead || "—"}</td>
                    <td className="py-2 text-gray-700 font-mono text-xs">{inc.invoiceNo || "—"}</td>
                    <td className="py-2 text-gray-700">{inc.paymentMode || "—"}</td>
                    <td className="py-2 font-semibold text-gray-800 text-right">{inr(inc.amount)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td colSpan={5} className="py-2.5 text-sm font-bold text-gray-900">Total Amount (before discount)</td>
                  <td className="py-2.5 font-black text-gray-900 text-right">{inr(totals.original)}</td>
                </tr>
                {totals.discount > 0 && (
                  <tr className="border-b border-gray-200">
                    <td colSpan={5} className="py-2 text-xs font-semibold text-emerald-700">Discount Applied</td>
                    <td className="py-2 font-semibold text-emerald-700 text-right">−{inr(totals.discount)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={5} className="py-2 text-sm font-bold text-gray-900">Total Paid</td>
                  <td className="py-2 text-base font-black text-[var(--primary)] text-right">{inr(totals.paid)}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6 pt-4 border-t border-dashed border-gray-300">
              <p className="text-[10px] text-gray-400">
                This is a computer-generated fees paid statement for {student.name}, issued from the Income module.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #income-statement-modal {
            position: absolute !important;
            inset: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            display: block !important;
            padding: 0 !important;
            background: #fff !important;
          }
          #income-statement, #income-statement * { visibility: visible; }
          #income-statement-modal .absolute { display: none !important; }
        }
      `}</style>
    </>
  )
}
