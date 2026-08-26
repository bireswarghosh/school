"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { useApi } from "@/lib/use-api"

type HostelRecord = {
  id: number
  studentName: string
  hostel: string
  roomNo: string
  roomType: string
  checkIn: string
  checkOut: string
}

const hostels = ["Boys Hostel A", "Boys Hostel B", "Girls Hostel A", "Girls Hostel B"]

export default function HostelPage() {
  const { data: records, loading } = useApi<HostelRecord>("/api/alumni/hostel")
  const [filterHostel, setFilterHostel] = useState("")

  const filteredRecords = useMemo(() => {
    if (!filterHostel) return records
    return records.filter((r) => r.hostel === filterHostel)
  }, [records, filterHostel])

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Hostel</h1>
        <p className="mt-1 text-sm text-white/80">Alumni / Hostel</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select value={filterHostel} onChange={(e) => setFilterHostel(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
            <option value="">All Hostels</option>
            {hostels.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          <button className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5"><Search className="h-4 w-4" /> Search</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Hostel</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Room No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Room Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Check In</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Check Out</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r, idx) => (
                <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{r.studentName}</td>
                  <td className="px-4 py-3 text-gray-600">{r.hostel}</td>
                  <td className="px-4 py-3 text-gray-600">{r.roomNo}</td>
                  <td className="px-4 py-3 text-gray-600">{r.roomType}</td>
                  <td className="px-4 py-3 text-gray-600">{r.checkIn}</td>
                  <td className="px-4 py-3 text-gray-600">{r.checkOut}</td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No hostel records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-sm text-gray-500">Showing {filteredRecords.length} records</div>
      </div>
    </div>
  )
}
