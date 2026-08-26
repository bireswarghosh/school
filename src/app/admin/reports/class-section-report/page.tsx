"use client"

import { useMemo, useState } from "react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, selectCls } from "@/components/reports/ui"

type StudentRow = {
  id: number
  first_name: string
  last_name: string
  gender: string
  class?: string
  section?: string
  class_id: number
  section_id: number
}

export default function ClassSectionReportPage() {
  const { data: students, loading } = useReportData<StudentRow>("/api/reports/students")
  const [classId, setClassId] = useState("")

  const classes = useMemo(() => {
    const map = new Map<string, string>()
    students.forEach((s) => {
      if (s.class) map.set(String(s.class_id), s.class)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [students])

  const grouped = useMemo(() => {
    const rows = classId ? students.filter((s) => String(s.class_id) === classId) : students
    const map = new Map<string, { className: string; section: string; total: number; boys: number; girls: number }>()
    rows.forEach((s) => {
      const key = `${s.class_id}-${s.section_id}`
      const cur = map.get(key) || { className: s.class || "—", section: s.section || "—", total: 0, boys: 0, girls: 0 }
      cur.total += 1
      if (String(s.gender).toLowerCase() === "male") cur.boys += 1
      else if (String(s.gender).toLowerCase() === "female") cur.girls += 1
      map.set(key, cur)
    })
    return Array.from(map.values())
  }, [students, classId])

  return (
    <div className="space-y-6">
      <ReportBanner title="Class Section Report" subtitle="Reports / Student Information / Class Section Report" />

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

      <TableCard title={`Class Section Summary (${grouped.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Boys</th>
                <th className="px-4 py-3">Girls</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={6} message="Loading..." />
              ) : grouped.length === 0 ? (
                <EmptyRow colSpan={6} />
              ) : (
                grouped.map((g, i) => (
                  <tr key={i} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{g.className}</td>
                    <td className="px-4 py-2.5">{g.section}</td>
                    <td className="px-4 py-2.5">{g.boys}</td>
                    <td className="px-4 py-2.5">{g.girls}</td>
                    <td className="px-4 py-2.5 font-semibold">{g.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
            {grouped.length} class sections · {grouped.reduce((a, g) => a + g.total, 0)} students
          </div>
        )}
      </TableCard>
    </div>
  )
}
