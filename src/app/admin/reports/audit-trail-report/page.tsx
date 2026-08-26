"use client"

import { useState, useMemo } from "react"
import { Search, Shield } from "lucide-react"
import { useApi } from "@/lib/use-api"

type AuditRecord = {
  id: number
  date: string
  time: string
  module: string
  action: "Created" | "Updated" | "Deleted"
  user: string
  ipAddress: string
}

const moduleOptions = ["", "All", "Student", "Fees", "Exam", "Attendance"]

export default function AuditTrailReportPage() {
  const { data: records, loading } = useApi<AuditRecord>("/api/system-setting/audit")
  const [filterModule, setFilterModule] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterModule && filterModule !== "All" && r.module !== filterModule) return false
      if (dateFrom && r.date < dateFrom) return false
      if (dateTo && r.date > dateTo) return false
      return true
    })
  }, [records, filterModule, dateFrom, dateTo])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const actionBadge = (action: string) => {
    switch (action) {
      case "Created":
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Created</span>
      case "Updated":
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Updated</span>
      case "Deleted":
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Deleted</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Audit Trail Report</h2>
          <p className="text-sm text-white/80 mt-1">Reports / Audit Trail Report</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Select Criteria
          </h3>
        </div>
        <form onSubmit={handleSearch} className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Module</label>
              <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                {moduleOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt || "Select"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date From</label>
              <input type="text" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="MM/DD/YYYY" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date To</label>
              <input type="text" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="MM/DD/YYYY" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Time</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Module</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">No audit trail records found</td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-800">{r.date}</td>
                    <td className="px-4 py-3 text-gray-600">{r.time}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        <Shield className="h-3 w-3" />
                        {r.module}
                      </span>
                    </td>
                    <td className="px-4 py-3">{actionBadge(r.action)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.user}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{r.ipAddress}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length} of {records.length} records</span>
        </div>
      </div>
    </div>
  )
}
