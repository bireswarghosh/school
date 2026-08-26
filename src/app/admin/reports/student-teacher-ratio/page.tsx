"use client"

import { useMemo, useState } from "react"
import { Users, UserCheck } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, selectCls } from "@/components/reports/ui"

type StudentRow = { id: number; class?: string; class_id: number }
type StaffRow = { id: number; name: string; department?: string; designation?: string; role?: string }

export default function StudentTeacherRatioPage() {
  const { data: students, loading: sLoading } = useReportData<StudentRow>("/api/reports/students")
  const { data: staff, loading: tLoading } = useReportData<StaffRow>("/api/staff")
  const [classId, setClassId] = useState("")

  const classes = useMemo(() => {
    const map = new Map<string, string>()
    students.forEach((s) => { if (s.class) map.set(String(s.class_id), s.class) })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [students])

  const pool = useMemo(() => (classId ? students.filter((s) => String(s.class_id) === classId) : students), [students, classId])

  const totalStudents = pool.length
  const totalStaff = staff.length
  const ratio = totalStaff === 0 ? "—" : (totalStudents / totalStaff).toFixed(1)

  const classBreakdown = useMemo(() => {
    const map = new Map<string, { className: string; count: number }>()
    pool.forEach((s) => {
      const key = String(s.class_id)
      const cur = map.get(key) || { className: s.class || "—", count: 0 }
      cur.count += 1
      map.set(key, cur)
    })
    return Array.from(map.values())
  }, [pool])

  return (
    <div className="space-y-6">
      <ReportBanner title="Student Teacher Ratio Report" subtitle="Reports / Student Information / Student Teacher Ratio Report" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-[var(--primary)] flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Students</p>
            <p className="text-xl font-bold text-gray-800">{totalStudents}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-blue-500 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Staff</p>
            <p className="text-xl font-bold text-gray-800">{totalStaff}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex items-center gap-4 col-span-2">
          <div className="h-11 w-11 rounded-full bg-purple-500 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Student : Teacher Ratio</p>
            <p className="text-xl font-bold text-gray-800">{ratio}{ratio !== "—" ? " : 1" : ""}</p>
          </div>
        </div>
      </div>

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Class">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={selectCls}>
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
      </FilterCard>

      <div className="grid md:grid-cols-2 gap-6">
        <TableCard title="Students per Class" action={<PrintButtons />}>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sLoading ? (
                <EmptyRow colSpan={3} message="Loading..." />
              ) : classBreakdown.length === 0 ? (
                <EmptyRow colSpan={3} />
              ) : (
                classBreakdown.map((r, i) => (
                  <tr key={i} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{r.className}</td>
                    <td className="px-4 py-2.5">{r.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableCard>

        <TableCard title="Staff List" action={<PrintButtons />}>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Staff Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Designation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tLoading ? (
                <EmptyRow colSpan={4} message="Loading..." />
              ) : staff.length === 0 ? (
                <EmptyRow colSpan={4} />
              ) : (
                staff.map((s, i) => (
                  <tr key={s.id} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{s.name}</td>
                    <td className="px-4 py-2.5">{s.department || "—"}</td>
                    <td className="px-4 py-2.5">{s.designation || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableCard>
      </div>
    </div>
  )
}
