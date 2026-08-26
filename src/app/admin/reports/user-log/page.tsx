"use client"

import { useState, useMemo } from "react"
import { Search, Monitor, Globe } from "lucide-react"
import { useApi } from "@/lib/use-api"

type LoginRecord = {
  id: number
  user: string
  userType: string
  ipAddress: string
  loginTime: string
  loginDate: string
  browser: string
  os: string
}

const userTypeOptions = ["", "All", "Admin", "Teacher", "Student"]

export default function UserLogPage() {
  const { data: records, loading } = useApi<LoginRecord>("/api/system-setting/user")
  const [filterUserType, setFilterUserType] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterUserType && filterUserType !== "All" && r.userType !== filterUserType) return false
      if (dateFrom && r.loginDate < dateFrom) return false
      if (dateTo && r.loginDate > dateTo) return false
      return true
    })
  }, [records, filterUserType, dateFrom, dateTo])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">User Log</h2>
          <p className="text-sm text-white/80 mt-1">Reports / User Log</p>
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
              <label className="block text-xs font-medium text-gray-600 mb-1">User Type</label>
              <select value={filterUserType} onChange={(e) => setFilterUserType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                {userTypeOptions.map((opt) => (
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">User Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">IP Address</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Login Time</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Login Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Browser / OS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">No login records found</td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.user}</td>
                    <td className="px-4 py-3">
                      {r.userType === "Admin" && <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Admin</span>}
                      {r.userType === "Teacher" && <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Teacher</span>}
                      {r.userType === "Student" && <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Student</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        <Globe className="h-3 w-3 text-gray-400" />
                        {r.ipAddress}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.loginTime}</td>
                    <td className="px-4 py-3 text-gray-600">{r.loginDate}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        <Monitor className="h-3 w-3 text-gray-400" />
                        {r.browser} / {r.os}
                      </span>
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
