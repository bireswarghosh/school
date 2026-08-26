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

type StudentInfo = {
  id: number
  class_id: number
  section_id: number
  class?: string
  section?: string
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

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function DailyAttendanceReportPage() {
  const { data: rows, loading } = useReportData<AttRow>("/api/attendance/student")
  const { data: students } = useReportData<StudentInfo>("/api/reports/students")
  const { data: classes } = useReportData<{ id: number; name: string }>("/api/classes")
  const [classId, setClassId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [date, setDate] = useState(today())

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

  return (
    <div className="space-y-6">
      <ReportBanner title="Daily Attendance Report" subtitle="Reports / Attendance / Daily Attendance Report" />

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

      <TableCard title={`Daily Attendance Register (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Attendance Type</th>
                <th className="px-4 py-3">In Time</th>
                <th className="px-4 py-3">Out Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={8} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={8} />
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{r.name || "—"}</td>
                    <td className="px-4 py-2.5">{r.rollNo || "—"}</td>
                    <td className="px-4 py-2.5">{classNames.get(r.classId) || "—"}</td>
                    <td className="px-4 py-2.5">{sectionNames.get(r.sectionId) || "—"}</td>
                    <td className="px-4 py-2.5">
                      <Chip tone={typeTone(r.attendanceType)}>{r.attendanceType || "—"}</Chip>
                    </td>
                    <td className="px-4 py-2.5">{r.inTime || "—"}</td>
                    <td className="px-4 py-2.5">{r.outTime || "—"}</td>
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
