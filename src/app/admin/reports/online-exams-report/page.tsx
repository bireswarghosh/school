"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, Chip, inputCls } from "@/components/reports/ui"

type OnlineExam = {
  id: number
  name: string
  duration?: number | string
  totalQuestions?: number
  attempts?: number
  passPercentage?: number
  description?: string
  status?: string
  subject?: string
  examFrom?: string
  examTo?: string
  autoResultPublishDate?: string
  answerWordLimit?: number
  [key: string]: any
}

const statusTone = (st: string) => {
  const v = String(st || "").toLowerCase()
  if (v === "active" || v === "published" || v === "ongoing" || v === "live" || v === "1") return "green" as const
  if (v === "draft" || v === "upcoming") return "amber" as const
  if (v === "inactive" || v === "closed" || v === "completed" || v === "expired" || v === "0") return "red" as const
  return "gray" as const
}

const fmt = (d: string | number | null | undefined) => (d ? String(d).slice(0, 10) : "—")

export default function OnlineExamsReportPage() {
  const { data: exams, loading } = useReportData<OnlineExam>("/api/online-exam")
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return exams.filter((e) => {
      if (!term) return true
      return `${e.name || ""} ${e.subject || ""}`.toLowerCase().includes(term)
    })
  }, [exams, q])

  return (
    <div className="space-y-6">
      <ReportBanner title="Exams Report" subtitle="Reports / Online Examinations / Exams Report" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Exam name or subject..." className={inputCls} />
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Exams Report (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Exam Name</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Total Questions</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Pass %</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={10} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={10} />
              ) : (
                filtered.map((e, i) => (
                  <tr key={e.id} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{e.name || "—"}</td>
                    <td className="px-4 py-2.5">{e.subject || "—"}</td>
                    <td className="px-4 py-2.5">{e.duration ? `${e.duration} min` : "—"}</td>
                    <td className="px-4 py-2.5">{e.totalQuestions ?? e.total_questions ?? "—"}</td>
                    <td className="px-4 py-2.5">{e.attempts ?? "—"}</td>
                    <td className="px-4 py-2.5">{e.passPercentage != null ? `${e.passPercentage}%` : "—"}</td>
                    <td className="px-4 py-2.5"><Chip tone={statusTone(e.status || "")}>{e.status || "—"}</Chip></td>
                    <td className="px-4 py-2.5">{fmt(e.examFrom)}</td>
                    <td className="px-4 py-2.5">{fmt(e.examTo)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && <FooterCount shown={filtered.length} total={exams.length} />}
      </TableCard>
    </div>
  )
}
