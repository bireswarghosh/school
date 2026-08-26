"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, selectCls } from "@/components/reports/ui"
import { useReportData as useClasses } from "@/components/reports/use-report-data"

type SubjectRow = {
  class: string
  section: string
  subject: string
  class_id: number
  section_id: number
}

export default function ClassSubjectReportPage() {
  const { data: rows, loading } = useReportData<SubjectRow>("/api/reports/class-subjects")
  const { data: classes } = useClasses<{ id: number; name: string }>("/api/classes")
  const [classId, setClassId] = useState("")

  const filtered = useMemo(() => {
    if (!classId) return rows
    return rows.filter((r) => String(r.class_id) === classId)
  }, [rows, classId])

  return (
    <div className="space-y-6">
      <ReportBanner title="Class Subject Report" subtitle="Reports / Student Information / Class Subject Report" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Class">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={selectCls}>
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Class Subject Report (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Subject</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={4} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={4} message="No subjects found" />
              ) : (
                filtered.map((r, i) => (
                  <tr key={i} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{r.class}</td>
                    <td className="px-4 py-2.5">{r.section || "—"}</td>                    <td className="px-4 py-2.5">{r.subject}</td>
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
