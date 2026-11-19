"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import {
  History, RefreshCw, Loader2, Wallet, Printer, Search, X, Banknote, CreditCard,
  Smartphone, Landmark, Receipt, UserRound, CalendarDays, FileText,
} from "lucide-react"
import { useCurrency } from "@/lib/currency-context"
import { useAuth } from "@/lib/auth-context"
import { useSchoolInfo } from "@/lib/use-school-info"

type PaymentLogEntry = {
  id: number
  studentName: string | null
  feeTypeName: string | null
  amountPaid: number | string
  paymentMode: string | null
  changeKind: string | null
  oldStatus: string | null
  newStatus: string | null
  paidBefore: number | string | null
  paidAfter: number | string | null
  paidAt: string | null
  createdBy: string | null
  createdByUsername: string | null
  ipAddress: string | null
  note: string | null
}

const num = (v: unknown) => {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

const fmtDateTime = (dt?: string | null) => {
  if (!dt) return "-"
  const d = new Date(dt)
  if (isNaN(d.getTime())) return "-"
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const money = (symbol: string, v: number) => `${symbol}${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const monthLabel = (ym: string) => {
  if (!/^\d{4}-\d{2}$/.test(ym)) return ym
  const [y, m] = ym.split("-")
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
}

type PendingRow = {
  studentName: string | null
  admissionNo: string | null
  className: string | null
  feeType: string | null
  amount: number | string | null
  paid: number | string | null
  outstanding: number | string | null
  status: string | null
  date: string | null
}

const escapeHtml = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const methodOf = (e: PaymentLogEntry) => (e.paymentMode || "").trim() || "Not specified"

function methodMeta(name: string) {
  const key = name.toLowerCase()
  if (key.includes("cash")) return { icon: <Banknote className="h-4 w-4" />, tone: "from-emerald-500 to-green-600" }
  if (key.includes("card")) return { icon: <CreditCard className="h-4 w-4" />, tone: "from-indigo-500 to-blue-600" }
  if (key.includes("upi") || key.includes("online") || key.includes("razorpay") || key.includes("paytm") || key.includes("phone"))
    return { icon: <Smartphone className="h-4 w-4" />, tone: "from-violet-500 to-purple-600" }
  if (key.includes("cheque") || key.includes("bank") || key.includes("neft") || key.includes("rtgs") || key.includes("transfer"))
    return { icon: <Landmark className="h-4 w-4" />, tone: "from-sky-500 to-cyan-600" }
  return { icon: <Receipt className="h-4 w-4" />, tone: "from-amber-500 to-orange-600" }
}

/** Display label for the user who received the payment. */
const userLabel = (e: PaymentLogEntry) => {
  const name = (e.createdBy || "").trim()
  const username = (e.createdByUsername || "").trim()
  if (name && username && name.toLowerCase() !== username.toLowerCase()) return { name, username }
  return { name: name || username || "-", username: name && name !== username ? username : "" }
}

export default function PaymentChangeLogPage() {
  const { symbol } = useCurrency()
  const { school } = useAuth()
  const { info: schoolInfo } = useSchoolInfo()
  const [entries, setEntries] = useState<PaymentLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [methodFilter, setMethodFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [reportOpen, setReportOpen] = useState(false)
  const [reportKind, setReportKind] = useState<"log" | "pending">("log")
  const [reportMonth, setReportMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [reportClass, setReportClass] = useState("")
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([])
  const [pendingRows, setPendingRows] = useState<PendingRow[] | null>(null)
  const [pendingTotal, setPendingTotal] = useState(0)
  const [pendingLoading, setPendingLoading] = useState(false)
  const [pendingError, setPendingError] = useState("")

  useEffect(() => {
    fetch("/api/academics/class")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setClasses(Array.isArray(d) ? d : []))
      .catch(() => setClasses([]))
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    fetch("/api/fees/fees-payment-log")
      .then((r) => r.json())
      .then((d) => setEntries(Array.isArray(d) ? d : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const searched = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.trim().toLowerCase()
    return entries.filter(
      (e) =>
        (e.studentName || "").toLowerCase().includes(q) ||
        (e.feeTypeName || "").toLowerCase().includes(q) ||
        (e.createdBy || "").toLowerCase().includes(q) ||
        (e.createdByUsername || "").toLowerCase().includes(q) ||
        (e.note || "").toLowerCase().includes(q)
    )
  }, [entries, search])

  const dateFiltered = useMemo(() => {
    if (!monthFilter && !dateFrom && !dateTo) return searched
    return searched.filter((e) => {
      const d = e.paidAt ? String(e.paidAt).slice(0, 10) : ""
      if (!d) return false
      if (monthFilter && d.slice(0, 7) !== monthFilter) return false
      if (dateFrom && d < dateFrom) return false
      if (dateTo && d > dateTo) return false
      return true
    })
  }, [searched, monthFilter, dateFrom, dateTo])

  const baseFiltered = useMemo(
    () => (methodFilter ? dateFiltered.filter((e) => methodOf(e) === methodFilter) : dateFiltered),
    [dateFiltered, methodFilter]
  )

  const paymentsOf = (rows: PaymentLogEntry[]) => rows.filter((e) => e.changeKind !== "status")

  const methodGroups = useMemo(() => {
    const map = new Map<string, { count: number; total: number; users: Set<string> }>()
    for (const e of paymentsOf(dateFiltered)) {
      const key = methodOf(e)
      const g = map.get(key) || { count: 0, total: 0, users: new Set<string>() }
      g.count += 1
      g.total += num(e.amountPaid)
      const u = userLabel(e).name
      if (u && u !== "-") g.users.add(u)
      map.set(key, g)
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, count: v.count, total: v.total, users: Array.from(v.users) }))
      .sort((a, b) => b.total - a.total)
  }, [dateFiltered])

  const statusCount = baseFiltered.length
  const paymentCount = paymentsOf(baseFiltered).length
  const totalLogged = paymentsOf(baseFiltered).reduce((sum, e) => sum + num(e.amountPaid), 0)

  const printViaFrame = (html: string) => {
    const frame = document.getElementById("log-report-frame") as HTMLIFrameElement | null
    if (!frame) return
    frame.onload = () => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    }
    frame.srcdoc = html
  }

  const buildReportHtml = (rows: PaymentLogEntry[], title: string, scopeNote: string) => {
    const sName = escapeHtml(school?.name || "Smart School")
    const sTagline = school?.tagline ? escapeHtml(school.tagline) : ""
    const sAddress = school?.address ? escapeHtml(school.address) : ""
    const sPhone = school?.phone ? escapeHtml(school.phone) : ""
    const sEmail = school?.email ? escapeHtml(school.email) : ""
    const fmt = (v: number) => `${symbol}${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    const groups = new Map<string, { count: number; total: number }>()
    for (const e of rows.filter((x) => x.changeKind !== "status")) {
      const key = methodOf(e)
      const g = groups.get(key) || { count: 0, total: 0 }
      g.count += 1
      g.total += num(e.amountPaid)
      groups.set(key, g)
    }
    const groupRows = Array.from(groups.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(
        ([name, g]) => `<tr>
          <td>${escapeHtml(name)}</td>
          <td class="c">${g.count}</td>
          <td class="r">${fmt(g.total)}</td>
        </tr>`
      )
      .join("")

    const detailRows = rows
      .map((e, i) => {
        const isStatus = e.changeKind === "status"
        const who = userLabel(e)
        const statusText = isStatus
          ? `${e.oldStatus || "-"} &rarr; ${e.newStatus || "-"}`
          : escapeHtml(e.newStatus || e.paymentMode || "-")
        return `<tr>
          <td class="c">${i + 1}</td>
          <td>${escapeHtml(fmtDateTime(e.paidAt))}</td>
          <td>${escapeHtml(e.studentName || "-")}</td>
          <td>${escapeHtml(e.feeTypeName || "-")}</td>
          <td class="c"><span class="st ${isStatus ? "s" : "p"}">${isStatus ? "Status Change" : "Payment"}</span></td>
          <td>${statusText}</td>
          <td class="r">${fmt(num(e.amountPaid))}</td>
          <td>${escapeHtml((e.paymentMode || "").trim() || "-")}</td>
          <td>${escapeHtml(who.name)}${who.username ? `<div class="sub">${escapeHtml(who.username)}</div>` : ""}</td>
          <td>${escapeHtml(e.note || "-")}</td>
        </tr>`
      })
      .join("")

    const grandTotal = rows.filter((x) => x.changeKind !== "status").reduce((sum, e) => sum + num(e.amountPaid), 0)

    return `<!doctype html>
<html><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 12px; padding: 26px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ff7732; padding-bottom: 14px; margin-bottom: 14px; }
  .head h1 { font-size: 20px; color: #111827; }
  .head .tag { color: #ff7732; font-size: 11px; margin-top: 2px; }
  .head .meta { text-align: right; font-size: 11px; color: #4b5563; line-height: 1.5; }
  .head .meta .doc { font-size: 14px; font-weight: 700; color: #111827; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #374151; margin: 16px 0 8px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { border: 1px solid #e5e7eb; border-radius: 999px; padding: 2px 9px; font-size: 10px; color: #4b5563; background: #f9fafb; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th { background: #ff7732; color: #fff; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; padding: 7px 8px; }
  td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  .c { text-align: center; } .r { text-align: right; }
  .sub { font-size: 10px; color: #6b7280; }
  tfoot td { font-weight: 700; background: #f9fafb; color: #111827; border-top: 2px solid #ff7732; }
  .st { display: inline-block; padding: 1px 7px; border-radius: 999px; font-size: 10px; font-weight: 700; }
  .st.p { color: #059669; border: 1px solid #059669; }
  .st.s { color: #b45309; border: 1px solid #b45309; }
  .foot { margin-top: 20px; text-align: center; color: #6b7280; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  @media print { body { padding: 10px; } thead { display: table-header-group; } tr { page-break-inside: avoid; } }
</style></head><body>
  <div class="head">
    <div>
      ${schoolInfo.logoSrc ? `<img src="${escapeHtml(schoolInfo.logoSrc)}" alt="logo" style="max-height:58px;max-width:120px;object-fit:contain;margin-bottom:6px;display:block;" />` : ""}
      <h1>${sName}</h1>
      ${sTagline ? `<div class="tag">${sTagline}</div>` : ""}
      ${sAddress ? `<div style="font-size:11px;color:#4b5563;margin-top:3px;">${sAddress}</div>` : ""}
      ${sPhone || sEmail ? `<div style="font-size:11px;color:#4b5563;margin-top:2px;">${[sPhone, sEmail].filter(Boolean).join(" | ")}</div>` : ""}
    </div>
    <div class="meta">
      <div class="doc">${escapeHtml(title)}</div>
      <div>Printed: ${escapeHtml(new Date().toLocaleString("en-IN"))}</div>
    </div>
  </div>
  <div class="chips">
    <span class="chip">${escapeHtml(scopeNote)}</span>
    ${search.trim() ? `<span class="chip">Search: ${escapeHtml(search.trim())}</span>` : ""}
    <span class="chip">Records: ${rows.length}</span>
  </div>
  <h2>Payment Method Summary</h2>
  <table>
    <thead><tr><th>Payment Method</th><th class="c">Payments</th><th class="r">Total Received</th></tr></thead>
    <tbody>${groupRows || `<tr><td colspan="3" class="c">No payment records</td></tr>`}</tbody>
    <tfoot><tr><td>Total</td><td class="c">${rows.filter((x) => x.changeKind !== "status").length}</td><td class="r">${fmt(grandTotal)}</td></tr></tfoot>
  </table>
  <h2>Detailed Records</h2>
  <table>
    <thead><tr><th class="c">#</th><th>Date &amp; Time</th><th>Student</th><th>Fee Type</th><th class="c">Type</th><th>Status / Mode</th><th class="r">Amount</th><th>Method</th><th>User</th><th>Note</th></tr></thead>
    <tbody>${detailRows || `<tr><td colspan="10" class="c">No records</td></tr>`}</tbody>
    <tfoot><tr><td colspan="6">Total Received</td><td class="r">${fmt(grandTotal)}</td><td colspan="3"></td></tr></tfoot>
  </table>
  <div class="foot">This is a computer-generated report.</div>
</body></html>`
  }

  const printReport = (rows: PaymentLogEntry[], title = "Payment Collection Report", scopeNote = "All Payment Methods") =>
    printViaFrame(buildReportHtml(rows, title, scopeNote))

  const activeScope = () => {
    const bits: string[] = []
    if (monthFilter) bits.push(monthLabel(monthFilter))
    else if (dateFrom || dateTo) bits.push(`${dateFrom || "start"} to ${dateTo || "today"}`)
    if (methodFilter) bits.push(`Method: ${methodFilter}`)
    if (search.trim()) bits.push(`Search: ${search.trim()}`)
    return bits.length > 0 ? bits.join(" · ") : "All Payment Methods"
  }

  const loadPending = async () => {
    setPendingLoading(true)
    setPendingError("")
    setPendingRows(null)
    try {
      const qs = new URLSearchParams()
      if (reportMonth) qs.set("month", reportMonth)
      if (reportClass) qs.set("classId", reportClass)
      const res = await fetch(`/api/fees/pending-payments?${qs.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load pending payments")
      setPendingRows(Array.isArray(data.rows) ? data.rows : [])
      setPendingTotal(Number(data.total) || 0)
    } catch (e: any) {
      setPendingError(e.message || "Failed to load pending payments")
      setPendingRows([])
      setPendingTotal(0)
    } finally {
      setPendingLoading(false)
    }
  }

  const printPending = () => {
    const rows = pendingRows || []
    const sName = escapeHtml(school?.name || "Smart School")
    const sTagline = school?.tagline ? escapeHtml(school.tagline) : ""
    const sAddress = school?.address ? escapeHtml(school.address) : ""
    const sPhone = school?.phone ? escapeHtml(school.phone) : ""
    const sEmail = school?.email ? escapeHtml(school.email) : ""
    const className = reportClass ? classes.find((c) => String(c.id) === reportClass)?.name || "Selected Class" : "All Classes"
    const fmt = (v: number) => `${symbol}${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const body = rows
      .map(
        (r, i) => `<tr>
          <td class="c">${i + 1}</td>
          <td>${escapeHtml(r.studentName || "-")}</td>
          <td>${escapeHtml(r.admissionNo || "-")}</td>
          <td>${escapeHtml(r.className || "-")}</td>
          <td>${escapeHtml(r.feeType || "-")}</td>
          <td class="r">${fmt(Number(r.amount) || 0)}</td>
          <td class="r">${fmt(Number(r.paid) || 0)}</td>
          <td class="r strong">${fmt(Number(r.outstanding) || 0)}</td>
          <td>${escapeHtml(r.status || "-")}</td>
        </tr>`
      )
      .join("")

    const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>Pending Payments — ${escapeHtml(monthLabel(reportMonth))}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 12px; padding: 26px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #ff7732; padding-bottom: 14px; margin-bottom: 14px; }
  .head h1 { font-size: 20px; color: #111827; }
  .head .tag { color: #ff7732; font-size: 11px; margin-top: 2px; }
  .head .meta { text-align: right; font-size: 11px; color: #4b5563; line-height: 1.6; }
  .head .meta .doc { font-size: 14px; font-weight: 700; color: #111827; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  .chip { border: 1px solid #e5e7eb; border-radius: 999px; padding: 3px 10px; font-size: 10px; color: #4b5563; background: #f9fafb; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  th { background: #ff7732; color: #fff; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; padding: 7px 8px; }
  td { padding: 6px 8px; border-bottom: 1px solid #eceff3; vertical-align: top; }
  tbody tr:nth-child(even) { background: #fafbfc; }
  tr { page-break-inside: avoid; }
  .c { text-align: center; } .r { text-align: right; }
  .strong { font-weight: 700; color: #b91c1c; }
  tfoot td { background: #fff7ed; border-top: 2px solid #ff7732; font-weight: 700; color: #111827; }
  .foot { margin-top: 18px; border-top: 1px solid #e5e7eb; padding-top: 10px; display: flex; justify-content: space-between; color: #6b7280; font-size: 10px; }
  .foot .line { display: inline-block; border-top: 1px solid #9ca3af; padding-top: 4px; margin-top: 22px; min-width: 150px; text-align: center; }
  @media print { body { padding: 0; } }
</style></head><body>
  <div class="head">
    <div>
      ${schoolInfo.logoSrc ? `<img src="${escapeHtml(schoolInfo.logoSrc)}" alt="logo" style="max-height:58px;max-width:120px;object-fit:contain;margin-bottom:6px;display:block;" />` : ""}
      <h1>${sName}</h1>
      ${sTagline ? `<div class="tag">${sTagline}</div>` : ""}
      ${sAddress ? `<div style="font-size:11px;color:#4b5563;margin-top:3px;">${sAddress}</div>` : ""}
      ${sPhone || sEmail ? `<div style="font-size:11px;color:#4b5563;margin-top:2px;">${[sPhone, sEmail].filter(Boolean).join(" | ")}</div>` : ""}
    </div>
    <div class="meta">
      <div class="doc">Pending Payments Report</div>
      <div>Month: ${escapeHtml(monthLabel(reportMonth))}</div>
      <div>Class: ${escapeHtml(className)}</div>
      <div>Generated: ${escapeHtml(new Date().toLocaleString("en-IN"))}</div>
    </div>
  </div>
  <div class="chips">
    <span class="chip">Records: <b>${rows.length}</b></span>
    <span class="chip">Total Outstanding: <b>${escapeHtml(fmt(pendingTotal))}</b></span>
  </div>
  <table>
    <thead><tr><th class="c">#</th><th>Student</th><th>Admission No</th><th>Class</th><th>Fee Type</th><th class="r">Billed</th><th class="r">Paid</th><th class="r">Outstanding</th><th>Status</th></tr></thead>
    <tbody>${body || `<tr><td class="c" colspan="9">No pending payments</td></tr>`}</tbody>
    <tfoot><tr><td colspan="7">Total Outstanding</td><td class="r">${fmt(pendingTotal)}</td><td></td></tr></tfoot>
  </table>
  <div class="foot">
    <span>Computer-generated pending payments report · Payment Change Log</span>
    <span class="line">Authorised Signatory</span>
  </div>
</body></html>`

    printViaFrame(html)
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payment Change Log</h2>
          <p className="text-xs text-gray-500 mt-0.5">Fees Collection / Payment Change Log</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPendingRows(null); setPendingError(""); setReportOpen(true) }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Print Report
          </button>
          <button
            onClick={() =>
              printReport(
                baseFiltered,
                methodFilter ? `Payment Collection Report — ${methodFilter}` : "Payment Collection Report",
                activeScope()
              )
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Log
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <span className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500"><History className="h-5 w-5" /></span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Records</p>
            <p className="text-xl font-bold text-gray-800">{statusCount}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <span className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-500"><Wallet className="h-5 w-5" /></span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Payments Logged</p>
            <p className="text-xl font-bold text-gray-800">{paymentCount}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <span className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500"><RefreshCw className="h-5 w-5" /></span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Status Changes</p>
            <p className="text-xl font-bold text-gray-800">{statusCount - paymentCount}</p>
            <p className="text-[10px] text-gray-400">total collected logged {money(symbol, totalLogged)}</p>
          </div>
        </div>
      </div>

      {/* Date & month filters */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Month</label>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => { setMonthFilter(e.target.value); if (e.target.value) { setDateFrom(""); setDateTo("") } }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); if (e.target.value) setMonthFilter("") }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); if (e.target.value) setMonthFilter("") }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        {(monthFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { setMonthFilter(""); setDateFrom(""); setDateTo("") }}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" /> Clear dates
          </button>
        )}
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
          <CalendarDays className="h-3.5 w-3.5 text-[var(--primary)]" />
          {monthFilter ? monthLabel(monthFilter) : dateFrom || dateTo ? `${dateFrom || "start"} → ${dateTo || "today"}` : "All dates"}
        </span>
      </div>

      {/* Payment Method cards */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Payment Method</h3>
            <p className="text-[11px] text-gray-400">
              Amount received per method · click a card to filter{methodFilter ? ` · filtered: ${methodFilter}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {methodFilter && (
              <button
                onClick={() => setMethodFilter("")}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" /> Clear filter
              </button>
            )}
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student / user / note"
                className="pl-9 pr-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] w-60"
              />
            </div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {loading ? (
            <p className="col-span-full text-sm text-gray-400"><Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />Loading...</p>
          ) : methodGroups.length === 0 ? (
            <p className="col-span-full text-sm text-gray-400">No payment records for the selected filters</p>
          ) : (
            methodGroups.map((g) => {
              const { icon, tone } = methodMeta(g.name)
              const active = methodFilter === g.name
              return (
                <div
                  key={g.name}
                  className={`group relative overflow-hidden rounded-xl border bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${active ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/25" : "border-gray-100"}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone}`} aria-hidden />
                  <button
                    type="button"
                    onClick={() => setMethodFilter((prev) => (prev === g.name ? "" : g.name))}
                    className="mt-1 flex w-full items-center gap-2.5 text-left"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm bg-gradient-to-br ${tone}`}>{icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-gray-400">{g.name}</p>
                      <p className="truncate text-base font-bold leading-tight text-gray-900">{money(symbol, g.total)}</p>
                      <p className="truncate text-[11px] text-gray-400">
                        {g.count} payment{g.count === 1 ? "" : "s"}
                        {g.users.length > 0 ? ` · ${g.users.slice(0, 2).join(", ")}${g.users.length > 2 ? ` +${g.users.length - 2}` : ""}` : ""}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      printReport(
                        dateFiltered.filter((e) => e.changeKind !== "status" && methodOf(e) === g.name),
                        `Payment Collection Report — ${g.name}`,
                        `Method: ${g.name}`
                      )
                    }
                    title={`Print ${g.name} records`}
                    className="absolute right-2 top-2.5 rounded-md p-1 text-gray-300 opacity-0 transition-all hover:bg-[var(--primary-light)] hover:text-[var(--primary)] group-hover:opacity-100"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-amber-50/60 to-white flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <History className="h-4 w-4 text-amber-600" />
            Payment Change Log
          </h3>
          <span className="text-xs text-gray-400">{baseFiltered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date &amp; Time</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Fee Type</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status Change</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Method</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Paid Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Received By</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">IP Address</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Note</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                    Loading log...
                  </td>
                </tr>
              ) : baseFiltered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-gray-400">No payment changes recorded yet</td>
                </tr>
              ) : (
                baseFiltered.map((entry, idx) => {
                  const isStatus = entry.changeKind === "status"
                  const before = entry.paidBefore !== null ? num(entry.paidBefore) : null
                  const after = entry.paidAfter !== null ? num(entry.paidAfter) : null
                  const who = userLabel(entry)
                  return (
                    <tr key={entry.id} className={`border-b border-gray-100 hover:bg-[var(--primary-light)]/30 transition-colors ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtDateTime(entry.paidAt)}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{entry.studentName || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{entry.feeTypeName || "-"}</td>
                      <td className="px-4 py-3 text-center">
                        {isStatus ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">Status Change</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">Payment</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isStatus ? (
                          <span className="text-sm font-medium text-gray-800">
                            {entry.oldStatus || "-"} <span className="text-gray-400">→</span> {entry.newStatus || "-"}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-600">{entry.newStatus || entry.paymentMode || "-"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{entry.paymentMode || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        {isStatus && before !== null ? (
                          <span className="font-medium text-gray-800">
                            {money(symbol, before)} <span className="text-gray-400">→</span> <span className="text-red-600">{money(symbol, after ?? 0)}</span>
                          </span>
                        ) : (
                          <span className="font-medium text-green-600">{money(symbol, num(entry.amountPaid))}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-gray-700">
                          <UserRound className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-medium">{who.name}</span>
                        </span>
                        {who.username && <p className="text-[11px] text-gray-400 mt-0.5">@{who.username}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{entry.ipAddress || "-"}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[260px]">
                        <p className="truncate" title={entry.note || ""}>{entry.note || "-"}</p>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/50 text-sm text-gray-500">
          {loading ? "Loading..." : `${baseFiltered.length} record(s) — every payment and status change is logged with date & time, user, and IP address`}
        </div>
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setReportOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Print Report</h3>
                  <p className="text-[11px] text-gray-500">Choose what to include in the printed report</p>
                </div>
              </div>
              <button onClick={() => setReportOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setReportKind("log"); setPendingRows(null) }}
                  className={`rounded-xl border px-4 py-3 text-left transition-all ${reportKind === "log" ? "border-[var(--primary)] bg-[var(--primary-light)] ring-2 ring-[var(--primary)]/20" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><History className="h-4 w-4 text-[var(--primary)]" /> Payment Change Log</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Collected payments &amp; status changes for the selected dates</p>
                </button>
                <button
                  type="button"
                  onClick={() => setReportKind("pending")}
                  className={`rounded-xl border px-4 py-3 text-left transition-all ${reportKind === "pending" ? "border-rose-400 bg-rose-50 ring-2 ring-rose-200" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Wallet className="h-4 w-4 text-rose-500" /> Pending Payments</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Outstanding invoices for a month — choose a class to print</p>
                </button>
              </div>

              {reportKind === "log" ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-sm text-gray-700">
                    This will print <b>{baseFiltered.length}</b> record{baseFiltered.length === 1 ? "" : "s"} using the current filters.
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">{activeScope()}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-2.5 text-[12px] text-amber-800">
                    Pending payments are not listed in the Payment Change Log — they are available only through this print report.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-600">Month</label>
                      <input
                        type="month"
                        value={reportMonth}
                        onChange={(e) => { setReportMonth(e.target.value); setPendingRows(null) }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-600">Class</label>
                      <select
                        value={reportClass}
                        onChange={(e) => { setReportClass(e.target.value); setPendingRows(null) }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value="">Select class…</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={loadPending}
                    disabled={!reportMonth || !reportClass || pendingLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pendingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    Show Pending Records
                  </button>

                  {pendingError && <p className="text-xs text-rose-600">{pendingError}</p>}

                  {pendingRows && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-gray-700">
                          {pendingRows.length} pending invoice{pendingRows.length === 1 ? "" : "s"} · {monthLabel(reportMonth)} · {classes.find((c) => String(c.id) === reportClass)?.name || "All classes"}
                        </span>
                        <span className="font-black text-rose-600">Outstanding {money(symbol, pendingTotal)}</span>
                      </div>
                      <div className="max-h-[280px] overflow-auto rounded-lg border border-gray-200">
                        <table className="w-full text-[11.5px]">
                          <thead className="sticky top-0">
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left px-3 py-2 font-semibold text-gray-600 text-[10px] uppercase">Student</th>
                              <th className="text-left px-3 py-2 font-semibold text-gray-600 text-[10px] uppercase">Class</th>
                              <th className="text-left px-3 py-2 font-semibold text-gray-600 text-[10px] uppercase">Fee Type</th>
                              <th className="text-right px-3 py-2 font-semibold text-gray-600 text-[10px] uppercase">Outstanding</th>
                              <th className="text-left px-3 py-2 font-semibold text-gray-600 text-[10px] uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingRows.length === 0 ? (
                              <tr><td colSpan={5} className="text-center py-6 text-gray-400">No pending payments for this selection</td></tr>
                            ) : pendingRows.map((r, i) => (
                              <tr key={i} className="border-b border-gray-100 last:border-0">
                                <td className="px-3 py-1.5 text-gray-800">{r.studentName || "-"}</td>
                                <td className="px-3 py-1.5 text-gray-600">{r.className || "-"}</td>
                                <td className="px-3 py-1.5 text-gray-600">{r.feeType || "-"}</td>
                                <td className="px-3 py-1.5 text-right font-semibold text-rose-600">{money(symbol, Number(r.outstanding) || 0)}</td>
                                <td className="px-3 py-1.5 text-gray-600">{r.status || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setReportOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
              {reportKind === "log" ? (
                <button
                  onClick={() => printReport(baseFiltered, "Payment Collection Report", activeScope())}
                  disabled={baseFiltered.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
                >
                  <Printer className="h-4 w-4" /> Print Log
                </button>
              ) : (
                <button
                  onClick={printPending}
                  disabled={!pendingRows || pendingRows.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
                >
                  <Printer className="h-4 w-4" /> Print Pending Payments
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <iframe
        id="log-report-frame"
        title="Payment log report print frame"
        style={{ position: "fixed", left: -9999, top: 0, width: 900, height: 1200, border: 0 }}
      />
    </div>
  )
}
