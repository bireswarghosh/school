"use client"

import { useMemo, useState } from "react"
import { PieChart } from "lucide-react"
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
}

export default function StudentGenderRatioPage() {
  const { data: students, loading } = useReportData<StudentRow>("/api/reports/students")
  const [classId, setClassId] = useState("")

  const classes = useMemo(() => {
    const map = new Map<string, string>()
    students.forEach((s) => { if (s.class) map.set(String(s.class_id), s.class) })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [students])

  const rows = useMemo(() => {
    const pool = classId ? students.filter((s) => String(s.class_id) === classId) : students
    const map = new Map<string, { className: string; boys: number; girls: number; total: number }>()
    pool.forEach((s) => {
      const key = String(s.class_id)
      const cur = map.get(key) || { className: s.class || "—", boys: 0, girls: 0, total: 0 }
      cur.total += 1
      if (String(s.gender).toLowerCase() === "male") cur.boys += 1
      else if (String(s.gender).toLowerCase() === "female") cur.girls += 1
      map.set(key, cur)
    })
    return Array.from(map.values())
  }, [students, classId])

  const totals = rows.reduce((a, r) => ({ boys: a.boys + r.boys, girls: a.girls + r.girls, total: a.total + r.total }), { boys: 0, girls: 0, total: 0 })

  const ratio = (n: number) => (n === 0 ? "0" : n.toFixed(1))

  return (
    <div className="space-y-6">
      <ReportBanner title="Student Gender Ratio Report" subtitle="Reports / Student Information / Student Gender Ratio Report" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: totals.total, color: "bg-[var(--primary)]" },
          { label: "Boys", value: totals.boys, color: "bg-blue-500" },
          { label: "Girls", value: totals.girls, color: "bg-pink-500" },
          { label: "Boys : Girls", value: `${ratio(totals.boys)} : ${ratio(totals.girls)}`, color: "bg-purple-500" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex items-center gap-4">
            <div className={`h-11 w-11 rounded-full ${c.color} flex items-center justify-center`}>
              <PieChart className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className="text-xl font-bold text-gray-800">{c.value}</p>
            </div>
          </div>
        ))}
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

      <TableCard title="Gender Ratio by Class" action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Boys</th>
                <th className="px-4 py-3">Girls</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Ratio (B:G)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={6} message="Loading..." />
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={6} />
              ) : (
                rows.map((r, i) => (
                  <tr key={i} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{r.className}</td>
                    <td className="px-4 py-2.5">{r.boys}</td>
                    <td className="px-4 py-2.5">{r.girls}</td>
                    <td className="px-4 py-2.5 font-semibold">{r.total}</td>
                    <td className="px-4 py-2.5">{ratio(r.boys)} : {ratio(r.girls)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TableCard>
    </div>
  )
}
