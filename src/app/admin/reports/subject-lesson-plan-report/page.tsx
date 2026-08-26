"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, Chip, inputCls, selectCls } from "@/components/reports/ui"

type PlanRow = {
  id: number
  class_id: number
  section_id: number
  subject_id: number
  lesson_id: number
  topic_id: number
  start_date: string
  end_date: string
  status: string
  description: string
}

function statusTone(status?: string) {
  const s = String(status || "").toLowerCase()
  if (s.includes("complet") || s.includes("done")) return "green" as const
  if (s.includes("progress") || s.includes("pend")) return "amber" as const
  return "gray" as const
}

export default function SubjectLessonPlanReportPage() {
  const { data: rows, loading } = useReportData<PlanRow>("/api/lesson-plan/plan")
  const { data: classes } = useReportData<{ id: number; name: string }>("/api/classes")
  const { data: subjects } = useReportData<{ id: number; name: string }>("/api/academics/subject")
  const [classId, setClassId] = useState("")
  const [sectionMap, setSectionMap] = useState<Record<string, string>>({})

  useEffect(() => {
    const ids = Array.from(new Set(rows.map((r) => r.class_id).filter(Boolean)))
    let alive = true
    Promise.all(
      ids.map((cid) =>
        fetch(`/api/sections?class_id=${cid}`)
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => [])
      )
    ).then((groups) => {
      if (!alive) return
      const map: Record<string, string> = {}
      groups.flat().forEach((s: { id: number; name: string }) => {
        map[String(s.id)] = s.name
      })
      setSectionMap(map)
    })
    return () => {
      alive = false
    }
  }, [rows])

  const classMap = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c.name])), [classes])
  const subjectMap = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s.name])), [subjects])

  const filtered = useMemo(() => rows.filter((r) => (classId ? String(r.class_id) === classId : true)), [rows, classId])

  return (
    <div className="space-y-6">
      <ReportBanner title="Subject Lesson Plan Report" subtitle="Reports / Lesson Plan / Subject Lesson Plan Report" />

      <FilterCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <TableCard title={`Subject Lesson Plan Report (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Description</th>
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
                    <td className="px-4 py-2.5 font-medium">{classMap[r.class_id] || "—"}</td>
                    <td className="px-4 py-2.5">{sectionMap[String(r.section_id)] || "—"}</td>
                    <td className="px-4 py-2.5">{subjectMap[r.subject_id] || "—"}</td>
                    <td className="px-4 py-2.5">{r.start_date ? String(r.start_date).slice(0, 10) : "—"}</td>
                    <td className="px-4 py-2.5">{r.end_date ? String(r.end_date).slice(0, 10) : "—"}</td>
                    <td className="px-4 py-2.5"><Chip tone={statusTone(r.status)}>{r.status || "—"}</Chip></td>
                    <td className="px-4 py-2.5">{r.description || "—"}</td>
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
