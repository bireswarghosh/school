"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, Chip, selectCls } from "@/components/reports/ui"

type ExamAttempt = {
  id?: number
  [key: string]: any
}

const fmt = (d: string | number | null | undefined) => (d ? String(d).slice(0, 10) : "—")

const studentOf = (r: any) =>
  r?.student_name || r?.studentName || r?.student || r?.name || r?.user_name || r?.username || "—"

const scoreOf = (r: any) => {
  const sc = r?.score ?? r?.obtained_marks ?? r?.obtainedMarks ?? r?.marks ?? r?.total_marks
  return sc !== undefined && sc !== null ? String(sc) : "—"
}

const resultTone = (r: any) => {
  const v = String(r?.result ?? r?.status ?? "").toLowerCase()
  if (v.includes("pass") || v === "passed" || v === "completed") return "green" as const
  if (v.includes("fail") || v === "failed") return "red" as const
  if (v.includes("pending") || v === "in-progress") return "amber" as const
  return "gray" as const
}

export default function OnlineExamResultReportPage() {
  const { data: exams } = useReportData<{ id: number; name: string; [key: string]: any }>("/api/online-exam")
  const [examId, setExamId] = useState("")
  const { data: attempts, loading } = useReportData<ExamAttempt>(
    "/api/exam-attempts",
    examId ? { exam_id: examId } : undefined
  )

  const selectedExam = useMemo(
    () => exams.find((e) => String(e.id) === examId),
    [exams, examId]
  )

  return (
    <div className="space-y-6">
      <ReportBanner title="Result Report" subtitle="Reports / Online Examinations / Result Report" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Exam">
            <select value={examId} onChange={(e) => setExamId(e.target.value)} className={selectCls}>
              <option value="">Select Exam</option>
              {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Result Report${selectedExam ? ` · ${selectedExam.name}` : ""} (${attempts.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Percentage</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={7} message="Loading..." />
              ) : !examId ? (
                <EmptyRow colSpan={7} message="Please select an exam to view results" />
              ) : attempts.length === 0 ? (
                <EmptyRow colSpan={7} message="No attempts found" />
              ) : (
                attempts.map((r, i) => (
                  <tr key={r?.id ?? i} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{studentOf(r)}</td>
                    <td className="px-4 py-2.5">{scoreOf(r)}</td>
                    <td className="px-4 py-2.5">{r?.total ?? r?.total_marks ?? r?.max_marks ?? "—"}</td>
                    <td className="px-4 py-2.5">{r?.percentage != null || r?.percent != null ? `${r?.percentage ?? r?.percent}%` : "—"}</td>
                    <td className="px-4 py-2.5"><Chip tone={resultTone(r)}>{r?.result || r?.status || "—"}</Chip></td>
                    <td className="px-4 py-2.5">{fmt(r?.completed_at ?? r?.submitted_at ?? r?.created_at ?? r?.date ?? r?.attempt_date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && examId && <FooterCount shown={attempts.length} total={attempts.length} />}
      </TableCard>
    </div>
  )
}
