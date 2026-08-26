"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, selectCls, inputCls } from "@/components/reports/ui"

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

type DateSummary = {
  date: string
  present: number
  absent: number
  total: number
}

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default function PeriodAttendanceReportPage() {
  const { data: rows, loading } = useReportData<AttRow>("/api/attendance/student")
  const { data: classes } = useReportData<{ id: number; name: string }>("/api/classes")
  const [month, setMonth] = useState(currentMonth())
  const [classId, setClassId] = useState("")

  const range = useMemo(() => {
    if (!month) return { from: "", to: "" }
    const [y, m] = month.split("-").map(Number)
    const last = new Date(y, m, 0).getDate()
    return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` }
  }, [month])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (classId && String(r.classId) !== classId) return false
      const d = String(r.date).slice(0, 10)
      if (range.from && d < range.from) return false
      if (range.to && d > range.to) return false
      return true
    })
  }, [rows, classId, range])

  const summary = useMemo(() => {
    const map = new Map<string, DateSummary>()
    filtered.forEach((r) => {
      const d = String(r.date).slice(0, 10)
      const cur = map.get(d) || { date: d, present: 0, absent: 0, total: 0 }
      const t = String(r.attendanceType || "").toLowerCase()
      if (t === "present" || t === "late") cur.present += 1
      else if (t === "absent") cur.absent += 1
      cur.total += 1
      map.set(d, cur)
    })
    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1))
  }, [filtered])

  return (
    <div className="space-y-6">
      <ReportBanner title="Period Attendance Report" subtitle="Reports / Attendance / Period Attendance Report" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Month">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Class">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={selectCls}>
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Period Attendance Summary (${summary.length} days)`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Present</th>
                <th className="px-4 py-3">Absent</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={5} message="Loading..." />
              ) : summary.length === 0 ? (
                <EmptyRow colSpan={5} />
              ) : (
                summary.map((g, i) => (
                  <tr key={g.date} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{g.date}</td>
                    <td className="px-4 py-2.5 text-green-600 font-medium">{g.present}</td>
                    <td className="px-4 py-2.5 text-red-600 font-medium">{g.absent}</td>
                    <td className="px-4 py-2.5 font-semibold">{g.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && <FooterCount shown={summary.length} total={summary.length} />}
      </TableCard>
    </div>
  )
}
