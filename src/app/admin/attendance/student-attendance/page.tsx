"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Save, Check, ArrowUpDown } from "lucide-react"

type AttendanceStatus = string

type Student = {
  id: number
  admissionNo: string
  name: string
  rollNo: number
  class: string
  section: string
  classId: number
  sectionId: number
}

type AttendanceRecord = {
  id?: number
  studentId: number
  classId: number
  sectionId: number
  date: string
  attendanceTypeId: number
  attendanceType?: string
  inTime: string
  outTime: string
}

type AttendanceType = { id: number; type: string }

const classes = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `Class ${i + 1}` }))
const sectionNames = ["A", "B", "C"]

const statusBadge: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  late: "bg-yellow-100 text-yellow-700",
  absent: "bg-red-100 text-red-700",
  holiday: "bg-blue-100 text-blue-700",
}

type SortField = "admissionNo" | "name" | "rollNo" | "date"
type SortDir = "asc" | "desc"

async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}`)
  return res.json()
}

type DateRangeRecord = {
  date: string
  status: AttendanceStatus
  inTime: string
  outTime: string
  recordId?: number
}

export default function StudentAttendancePage() {
  const today = new Date().toISOString().split("T")[0]
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [searched, setSearched] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceMap, setAttendanceMap] = useState<Record<string, DateRangeRecord>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dateList, setDateList] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [types, setTypes] = useState<AttendanceType[]>([])

  useEffect(() => {
    fetch("/api/attendance/type")
      .then((r) => r.json())
      .then((d) => setTypes(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  const availableSections = selectedClass ? sectionNames : []

  const defaultStatus = () => {
    const present = types.find((t) => t.type.toLowerCase() === "present")
    return present?.type || types[0]?.type || "present"
  }

  const generateDateRange = (from: string, to: string): string[] => {
    const dates: string[] = []
    const start = new Date(from)
    const end = new Date(to)
    const current = new Date(start)
    while (current <= end) {
      dates.push(current.toISOString().split("T")[0])
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  const makeKey = (studentId: number, date: string) => `${studentId}_${date}`

  const handleSearch = useCallback(async () => {
    if (!selectedClass || !selectedSection) return
    setLoading(true)
    setSearched(false)
    try {
      const studentsData = await fetchJson(`/api/students?class_id=${selectedClass}&section=${selectedSection}`)
      setStudents(studentsData)

      const dates = generateDateRange(fromDate, toDate)
      setDateList(dates)

      let existingData: AttendanceRecord[] = []
      try {
        existingData = await fetchJson(`/api/attendance/student?class_id=${selectedClass}&section_id=${selectedSection}&from_date=${fromDate}&to_date=${toDate}`)
      } catch {
        existingData = []
      }

      const getStatusKey = (typeId: number): AttendanceStatus => {
        const found = types.find((t) => t.id === typeId)
        if (found) return found.type
        const fallback: Record<number, AttendanceStatus> = { 1: "present", 2: "late", 3: "absent", 4: "holiday" }
        return fallback[typeId] || "present"
      }

      const map: Record<string, DateRangeRecord> = {}
      for (const rec of existingData) {
        map[makeKey(rec.studentId, rec.date)] = {
          date: rec.date,
          status: (rec.attendanceType || getStatusKey(rec.attendanceTypeId)) as AttendanceStatus,
          inTime: rec.inTime || "",
          outTime: rec.outTime || "",
          recordId: rec.id,
        }
      }

      const dflt = defaultStatus()
      for (const s of studentsData) {
        for (const d of dates) {
          const key = makeKey(s.id, d)
          if (!map[key]) {
            map[key] = { date: d, status: dflt, inTime: "09:00", outTime: "14:30" }
          }
        }
      }

      setAttendanceMap(map)
      setSearched(true)
      setSaved(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedClass, selectedSection, fromDate, toDate])

  const updateRecord = (studentId: number, date: string, field: string, value: any) => {
    const key = makeKey(studentId, date)
    setAttendanceMap((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const records = Object.entries(attendanceMap).map(([key, rec]) => {
        const studentId = parseInt(key.split("_")[0])
        const matched = types.find((t) => t.type.toLowerCase() === rec.status.toLowerCase())
        return {
          studentId,
          classId: students.find((s) => s.id === studentId)?.classId || 0,
          sectionId: students.find((s) => s.id === studentId)?.sectionId || 0,
          date: rec.date,
          status: rec.status,
          attendanceTypeId: matched?.id,
          inTime: rec.inTime || null,
          outTime: rec.outTime || null,
        }
      })

      await fetch("/api/attendance/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records),
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const sortedEntries = Object.entries(attendanceMap).sort(([keyA, recA], [keyB, recB]) => {
    const studentA = students.find((s) => s.id === parseInt(keyA.split("_")[0]))
    const studentB = students.find((s) => s.id === parseInt(keyB.split("_")[0]))
    const mul = sortDir === "asc" ? 1 : -1
    switch (sortField) {
      case "date": return recA.date.localeCompare(recB.date) * mul
      case "name": return (studentA?.name || "").localeCompare(studentB?.name || "") * mul
      case "admissionNo": return (studentA?.admissionNo || "").localeCompare(studentB?.admissionNo || "") * mul
      case "rollNo": return ((studentA?.rollNo || 0) - (studentB?.rollNo || 0)) * mul
      default: return 0
    }
  })

  const getSummary = () => {
    const records = Object.values(attendanceMap)
    return {
      total: records.length,
      present: records.filter((r) => r.status.toLowerCase() === "present").length,
      late: records.filter((r) => r.status.toLowerCase() === "late").length,
      absent: records.filter((r) => r.status.toLowerCase() === "absent").length,
      holiday: records.filter((r) => r.status.toLowerCase() === "holiday").length,
    }
  }

  const summary = getSummary()

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase cursor-pointer select-none hover:text-gray-800"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? "text-[var(--primary)]" : "text-gray-300"}`} />
      </div>
    </th>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Student Attendance</h2>
          <p className="text-sm text-white/70 mt-0.5">Attendance / Student Attendance</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4 text-[var(--primary)]" /> Select Criteria
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
              <select value={selectedSection} onChange={(e) => { setSelectedSection(e.target.value); setSearched(false) }} disabled={!selectedClass}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent disabled:opacity-50">
                <option value="">Select</option>
                {availableSections.map((sec) => <option key={sec} value={sec}>{sec}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">From Date <span className="text-red-500">*</span></label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">To Date <span className="text-red-500">*</span></label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="flex items-end">
              <button onClick={handleSearch} disabled={!selectedClass || !selectedSection || loading}
                className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50">
                {loading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Search className="h-4 w-4" />}
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
        </div>
      )}

      {searched && !loading && (
        <>
          <div className="grid grid-cols-5 gap-4">
            {(["total", "present", "late", "absent", "holiday"] as const).map((key) => {
              const colors: Record<string, string> = {
                total: "text-gray-800",
                present: "text-green-600",
                late: "text-yellow-600",
                absent: "text-red-600",
                holiday: "text-blue-600",
              }
              return (
                <div key={key} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                  <p className={`text-2xl font-bold ${colors[key]}`}>{summary[key]}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{key}</p>
                </div>
              )
            })}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-700">Student Attendance List</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>From: {fromDate} &mdash; To: {toDate}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                    <SortHeader field="admissionNo" label="Admission No." />
                    <SortHeader field="name" label="Name" />
                    <SortHeader field="rollNo" label="Roll No." />
                    <SortHeader field="date" label="Date" />
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Attendance</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">In Time</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Out Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">No students found</td></tr>
                  ) : (
                    sortedEntries.map(([key, record], idx) => {
                      const studentId = parseInt(key.split("_")[0])
                      const student = students.find((s) => s.id === studentId)
                      if (!student) return null
                      return (
                        <tr key={key} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                          <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">{student.admissionNo}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{student.name}</td>
                          <td className="px-4 py-3 text-gray-600">{student.rollNo}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{record.date}</td>
                          <td className="px-4 py-3">
                            <select value={record.status} onChange={(e) => updateRecord(student.id, record.date, "status", e.target.value)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-full border-0 ${statusBadge[record.status.toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
                              {types.map((t) => (
                                <option key={t.id} value={t.type}>{t.type}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input type="text" value={record.inTime} onChange={(e) => updateRecord(student.id, record.date, "inTime", e.target.value)}
                              disabled={["absent", "holiday"].includes(record.status.toLowerCase())}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent disabled:opacity-50"
                              placeholder="09:00" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="text" value={record.outTime} onChange={(e) => updateRecord(student.id, record.date, "outTime", e.target.value)}
                              disabled={["absent", "holiday"].includes(record.status.toLowerCase())}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent disabled:opacity-50"
                              placeholder="14:30" />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-gray-500">Showing {Object.keys(attendanceMap).length} records ({students.length} students &times; {dateList.length} days)</span>
              {searched && Object.keys(attendanceMap).length > 0 && (
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50">
                  {saving ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : saved ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : saved ? "Saved!" : "Save Attendance"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
