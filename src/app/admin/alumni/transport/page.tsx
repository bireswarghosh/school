"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { useApi } from "@/lib/use-api"

type TransportRecord = {
  id: number
  studentName: string
  route: string
  pickupPoint: string
  vehicle: string
  fees: number
  passoutYear: number
}

const routes = ["Route 1 - North", "Route 2 - South", "Route 3 - East", "Route 4 - West"]
const passoutYears = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

export default function TransportPage() {
  const { data: records, loading } = useApi<TransportRecord>("/api/alumni/transport")
  const [filterYear, setFilterYear] = useState("")
  const [filterRoute, setFilterRoute] = useState("")
  const [searched, setSearched] = useState(false)

  const filteredRecords = useMemo(() => {
    if (!searched) return []
    return records.filter((r) => {
      if (filterYear && r.passoutYear !== parseInt(filterYear)) return false
      if (filterRoute && r.route !== filterRoute) return false
      return true
    })
  }, [records, filterYear, filterRoute, searched])

  const handleSearch = () => setSearched(true)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Transport</h1>
        <p className="mt-1 text-sm text-white/80">Alumni / Transport</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
            <option value="">Passout Year</option>
            {passoutYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterRoute} onChange={(e) => setFilterRoute(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
            <option value="">Select Route</option>
            {routes.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={handleSearch} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center justify-center gap-1.5"><Search className="h-4 w-4" /> Search</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Route</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Pickup Point</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Vehicle</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Fees</th>
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Select filters and click Search</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No transport records found</td></tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{r.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{r.route}</td>
                    <td className="px-4 py-3 text-gray-600">{r.pickupPoint}</td>
                    <td className="px-4 py-3 text-gray-600">{r.vehicle}</td>
                    <td className="px-4 py-3 text-gray-700">${r.fees}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {searched && <div className="mt-3 text-sm text-gray-500">Showing {filteredRecords.length} records</div>}
      </div>
    </div>
  )
}
