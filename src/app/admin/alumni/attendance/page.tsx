"use client"

import { useState, useMemo } from "react"
import { Search, X, RefreshCw } from "lucide-react"
import { useApi } from "@/lib/use-api"

type AttendanceRecord = {
  id: number
  alumniName: string
  passoutYear: number
  event: string
  date: string
  status: "Present" | "Absent"
}

const events = ["Homecoming", "Networking Session", "Career Fair", "Annual Meet", "Workshop"]
const passoutYears = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

export default function AlumniAttendancePage() {
  const { data: attendance, update, loading } = useApi<AttendanceRecord>("/api/alumni/attendance")
  const [filterEvent, setFilterEvent] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [searched, setSearched] = useState(false)
  const [markingId, setMarkingId] = useState<number | null>(null)
  const [markStatus, setMarkStatus] = useState<"Present" | "Absent">("Present")

  const filteredAttendance = useMemo(() => {
    if (!searched) return []
    return attendance.filter((a) => {
      if (filterEvent && a.event !== filterEvent) return false
      if (filterDate && a.date !== filterDate) return false
      return true
    })
  }, [attendance, filterEvent, filterDate, searched])

  const handleSearch = () => setSearched(true)

  const handleMark = async () => {
    if (markingId) {
      await update(markingId, { status: markStatus })
      setMarkingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Alumni Attendance</h1>
        <p className="mt-1 text-sm text-white/80">Alumni / Attendance</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
            <option value="">Select Event</option>
            {events.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
          <button onClick={handleSearch} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center justify-center gap-1.5"><Search className="h-4 w-4" /> Search</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Alumni Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Passout Year</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Event</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Select filters and click Search</td></tr>
              ) : filteredAttendance.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No attendance records found</td></tr>
              ) : (
                filteredAttendance.map((a, idx) => (
                  <tr key={a.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{a.alumniName}</td>
                    <td className="px-4 py-3 text-gray-600">{a.passoutYear}</td>
                    <td className="px-4 py-3 text-gray-600">{a.event}</td>
                    <td className="px-4 py-3 text-gray-600">{a.date}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${a.status === "Present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{a.status}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setMarkingId(a.id); setMarkStatus(a.status) }} className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Mark</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {searched && <div className="mt-3 text-sm text-gray-500">Showing {filteredAttendance.length} records</div>}
      </div>

      {markingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setMarkingId(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Mark Attendance</h2>
              <button onClick={() => setMarkingId(null)}><X className="h-5 w-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Update attendance status for this alumni event record.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={markStatus} onChange={(e) => setMarkStatus(e.target.value as "Present" | "Absent")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setMarkingId(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleMark} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
