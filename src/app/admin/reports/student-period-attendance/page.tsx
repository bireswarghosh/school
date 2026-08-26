"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, Chip, inputCls, selectCls } from "@/components/reports/ui"

type AttRow = {
  id: number
  studentId: number
  classId: number
  sectionId: number
  admissionNo: string
  name: string
  rollNo: string
  date: string
  attendanceTypeId: number
  attendanceType: string
  inTime: string | null
  outTime: string | null
}

type StudentOption = {
  id: number
  name: string
}

function typeTone(type: string): "green" | "amber" | "red" | "purple" | "gray" {
  switch (String(type).toLowerCase()) {
    case "present":
      return "green"
    case "late":
      return "amber"
    case "absent":
      return "red"
    case "holiday":
      return "purple"
    default:
      return "gray"
  }
}

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default function StudentPeriodAttendancePage() {
  const { data: rows, loading } = useReportData<AttRow>("/api/attendance/student")
  const [studentId, setStudentId] = useState("")
  const [month, setMonth] = useState(currentMonth())

  const students = useMemo(() => {
    const map = new Map<number, StudentOption>()
    rows.forEach((r) => {
      if (r.studentId && !map.has(r.studentId)) map.set(r.studentId, { id: r.studentId, name: r.name || `Student ${r.studentId}` })
    })
    return Array.from(map.values())
  }, [rows])

  const range = useMemo(() => {
    if (!month) return { from: "", to: "" }
    const [y, m] = month.split("-").map(Number)
    const last = new Date(y, m, 0).getDate()
    return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` }
  }, [month])

  const filtered = useMemo(() => {
    return rows
      .filter((r) => {
        if (studentId && String(r.studentId) !== studentId) return false
        const d = String(r.date).slice(0, 10)
        if (range.from && d < range.from) return false
        if (range.to && d > range.to) return false
        return true
      })
      .sort((a, b) => (String(a.date).slice(0, 10) < String(b.date).slice(0, 10) ? -1 : 1))
  }, [rows, studentId, range])

  return (
    <div className="space-y-6">
      <ReportBanner title="Student Period Attendance Report" subtitle="Reports / Attendance / Student Period Attendance" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Student">
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={selectCls}>
              <option value="">All Students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Month">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={inputCls} />
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Student Period Attendance (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Attendance Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={3} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={3} />
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{String(r.date).slice(0, 10)}</td>
                    <td className="px-4 py-2.5">
                      <Chip tone={typeTone(r.attendanceType)}>{r.attendanceType || "—"}</Chip>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && <FooterCount shown={filtered.length} total={rows.length} />}
      </TableCard>
    </div>
  )
}
