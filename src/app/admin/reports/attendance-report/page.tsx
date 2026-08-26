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

type StudentInfo = {
  id: number
  class_id: number
  section_id: number
  class?: string
  section?: string
}

type SummaryRow = {
  key: string
  className: string
  sectionName: string
  present: number
  absent: number
  total: number
}

export default function AttendanceReportPage() {
  const { data: rows, loading } = useReportData<AttRow>("/api/attendance/student")
  const { data: students } = useReportData<StudentInfo>("/api/reports/students")
  const { data: classes } = useReportData<{ id: number; name: string }>("/api/classes")
  const [classId, setClassId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [date, setDate] = useState("")

  const sections = useMemo(() => {
    const all = students
      .filter((s) => (classId ? String(s.class_id) === classId : true))
      .map((s) => ({ id: s.section_id, name: s.section || "" }))
    return Array.from(new Map(all.map((s) => [s.id, s])).values())
  }, [students, classId])

  const classNames = useMemo(() => {
    const m = new Map<number, string>()
    classes.forEach((c) => m.set(c.id, c.name))
    return m
  }, [classes])

  const sectionNames = useMemo(() => {
    const m = new Map<number, string>()
    students.forEach((s) => {
      if (s.section) m.set(s.section_id, s.section)
    })
    return m
  }, [students])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (classId && String(r.classId) !== classId) return false
      if (sectionId && String(r.sectionId) !== sectionId) return false
      if (date && String(r.date).slice(0, 10) !== date) return false
      return true
    })
  }, [rows, classId, sectionId, date])

  const summary = useMemo(() => {
    const map = new Map<string, SummaryRow>()
    filtered.forEach((r) => {
      const key = `${r.classId}-${r.sectionId}`
      const cur = map.get(key) || {
        key,
        className: classNames.get(r.classId) || `Class ${r.classId}`,
        sectionName: sectionNames.get(r.sectionId) || `Section ${r.sectionId}`,
        present: 0,
        absent: 0,
        total: 0,
      }
      const t = String(r.attendanceType || "").toLowerCase()
      if (t === "present" || t === "late") cur.present += 1
      else if (t === "absent") cur.absent += 1
      cur.total += 1
      map.set(key, cur)
    })
    return Array.from(map.values())
  }, [filtered, classNames, sectionNames])

  return (
    <div className="space-y-6">
      <ReportBanner title="Attendance Report" subtitle="Reports / Attendance / Attendance Report" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Class">
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value)
                setSectionId("")
              }}
              className={selectCls}
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Section">
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={selectCls}>
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Attendance Summary (${summary.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Present</th>
                <th className="px-4 py-3">Absent</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={7} message="Loading..." />
              ) : summary.length === 0 ? (
                <EmptyRow colSpan={7} />
              ) : (
                summary.map((g, i) => (
                  <tr key={g.key} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{g.className}</td>
                    <td className="px-4 py-2.5">{g.sectionName}</td>
                    <td className="px-4 py-2.5">{date || "All"}</td>
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
