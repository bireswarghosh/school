"use client"

import { useState, useCallback, useEffect } from "react"
import { History, RefreshCw, Loader2, Wallet } from "lucide-react"
import { useCurrency } from "@/lib/currency-context"

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

export default function PaymentChangeLogPage() {
  const { symbol } = useCurrency()
  const [entries, setEntries] = useState<PaymentLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetch("/api/fees/fees-payment-log")
      .then((r) => r.json())
      .then((d) => setEntries(Array.isArray(d) ? d : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const statusCount = entries.length
  const paymentCount = entries.filter((e) => e.changeKind !== "status").length
  const totalLogged = entries.reduce((sum, e) => sum + (e.changeKind === "status" ? 0 : num(e.amountPaid)), 0)

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payment Change Log</h2>
          <p className="text-xs text-gray-500 mt-0.5">Fees Collection / Payment Change Log</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
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

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-amber-50/60 to-white flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <History className="h-4 w-4 text-amber-600" />
            Payment Change Log
          </h3>
          <span className="text-xs text-gray-400">{entries.length} records</span>
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
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Paid Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">IP Address</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Note</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                    Loading log...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">No payment changes recorded yet</td>
                </tr>
              ) : (
                entries.map((entry, idx) => {
                  const isStatus = entry.changeKind === "status"
                  const before = entry.paidBefore !== null ? num(entry.paidBefore) : null
                  const after = entry.paidAfter !== null ? num(entry.paidAfter) : null
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
                      <td className="px-4 py-3 text-right">
                        {isStatus && before !== null ? (
                          <span className="font-medium text-gray-800">
                            {money(symbol, before)} <span className="text-gray-400">→</span> <span className="text-red-600">{money(symbol, after ?? 0)}</span>
                          </span>
                        ) : (
                          <span className="font-medium text-green-600">{money(symbol, num(entry.amountPaid))}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{entry.createdBy || "-"}</td>
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
          {loading ? "Loading..." : `${entries.length} record(s) — every payment and status change is logged with date & time, user, and IP address`}
        </div>
      </div>
    </div>
  )
}