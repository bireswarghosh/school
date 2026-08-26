"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useMemo } from "react"
import { Search, Download, Printer, ArrowUpDown, Filter } from "lucide-react"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type SortKey = "admissionNo" | "name" | "rollNo" | "date" | "attendanceType" | "inTime" | "outTime"
type SortDir = "asc" | "desc"

const statusColors: Record<string, string> = {
  Present: "bg-green-100 text-green-700 border-green-300",
  Late: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Absent: "bg-red-100 text-red-700 border-red-300",
  Holiday: "bg-blue-100 text-blue-700 border-blue-300",
}

const columnLabels: Record<SortKey, string> = {
  admissionNo: "Admission No.",
  name: "Name",
  rollNo: "Roll No.",
  date: "Date",
  attendanceType: "Attendance Status",
  inTime: "In Time",
  outTime: "Out Time",
}

type AttendanceRecord = {
  id: number; studentId: number; classId: number; sectionId: number
  admissionNo: string; name: string; rollNo: number
  date: string; attendanceTypeId: number; attendanceType: string
  inTime: string; outTime: string
}

export default function AttendanceByDatePage() {
  const { classes, sectionsOf } = useClassesAndSections();
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AttendanceRecord[]>([])
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const availableSections = selectedClass ? sectionsOf(parseInt(selectedClass)).map((s) => s.name) : []

  const handleSearch = async () => {
    if (!selectedClass || !selectedSection) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ class_id: selectedClass, section_id: selectedSection })
      if (fromDate && toDate) {
        params.set("from_date", fromDate)
        params.set("to_date", toDate)
      }
      const res = await fetch(`/api/attendance/student?${params}`)
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal
      }
      const cmp = String(aVal).localeCompare(String(bVal))
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const summary = useMemo(() => ({
    total: data.length,
    present: data.filter((r) => r.attendanceType === "Present").length,
    late: data.filter((r) => r.attendanceType === "Late").length,
    absent: data.filter((r) => r.attendanceType === "Absent").length,
    holiday: data.filter((r) => r.attendanceType === "Holiday").length,
  }), [data])

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Attendance By Date</h2>
          <p className="text-sm text-white/70 mt-0.5">Attendance / Attendance By Date</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--primary)]" /> Select Criteria
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Class <span className="text-red-500">*</span></label>
              <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); setSearched(false) }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Section <span className="text-red-500">*</span></label>
              <select value={selectedSection} onChange={(e) => { setSelectedSection(e.target.value); setSearched(false) }}
                disabled={!selectedClass}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent disabled:opacity-50">
                <option value="">Select</option>
                {availableSections.map((sec) => <option key={sec} value={sec}>{sec}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="flex items-end">
              <button onClick={handleSearch} disabled={!selectedClass || !selectedSection || loading}
                className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50">
                <Search className="h-4 w-4" /> {loading ? "Loading..." : "Search"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {searched && (
        <>
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Total Records", value: summary.total, color: "text-[var(--primary)]" },
              { label: "Present", value: summary.present, color: "text-green-600" },
              { label: "Late", value: summary.late, color: "text-yellow-600" },
              { label: "Absent", value: summary.absent, color: "text-red-600" },
              { label: "Holiday", value: summary.holiday, color: "text-blue-600" },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Attendance Report</h3>
              <span className="text-xs text-gray-500">{sortedData.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                    {(Object.entries(columnLabels) as [SortKey, string][]).map(([key, label]) => (
                      <th key={key} onClick={() => handleSort(key)}
                        className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase cursor-pointer select-none hover:text-[var(--primary)] transition-colors">
                        <div className="flex items-center gap-1">
                          {label}
                          <ArrowUpDown className={`h-3 w-3 ${sortKey === key ? "text-[var(--primary)]" : "text-gray-300"}`} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">No records found</td>
                    </tr>
                  ) : (
                    sortedData.map((row, idx) => (
                      <tr key={row.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{row.admissionNo}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                        <td className="px-4 py-3 text-gray-600">{row.rollNo}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{row.date}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${statusColors[row.attendanceType] || "bg-gray-100 text-gray-600"}`}>
                            {row.attendanceType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{row.inTime || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{row.outTime || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">Showing {sortedData.length} records</span>
              <div className="flex items-center gap-2">
                <button onClick={() => notify.info("Export feature coming soon")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
                  <Download className="h-4 w-4" /> Export
                </button>
                <button onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  <Printer className="h-4 w-4" /> Print
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
