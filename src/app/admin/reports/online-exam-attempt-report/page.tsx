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

const statusTone = (r: any) => {
  const v = String(r?.status ?? "").toLowerCase()
  if (v === "completed" || v === "finished" || v === "submitted" || v === "passed") return "green" as const
  if (v === "in-progress" || v === "ongoing" || v === "pending") return "amber" as const
  if (v === "failed" || v === "expired" || v === "abandoned") return "red" as const
  return "gray" as const
}

export default function OnlineExamAttemptReportPage() {
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
      <ReportBanner title="Student Exams Attempt Report" subtitle="Reports / Online Examinations / Student Exams Attempt Report" />

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

      <TableCard title={`Student Exams Attempt Report${selectedExam ? ` · ${selectedExam.name}` : ""} (${attempts.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Attempt ID</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Attempt No</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Attempt Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={7} message="Loading..." />
              ) : !examId ? (
                <EmptyRow colSpan={7} message="Please select an exam to view attempts" />
              ) : attempts.length === 0 ? (
                <EmptyRow colSpan={7} message="No attempts found" />
              ) : (
                attempts.map((r, i) => (
                  <tr key={r?.id ?? i} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{r?.id ?? "—"}</td>
                    <td className="px-4 py-2.5">{studentOf(r)}</td>
                    <td className="px-4 py-2.5">{r?.attempt ?? r?.attempt_no ?? r?.attemptNo ?? r?.attempts ?? "—"}</td>
                    <td className="px-4 py-2.5">{r?.score ?? r?.obtained_marks ?? r?.obtainedMarks ?? r?.marks ?? "—"}</td>
                    <td className="px-4 py-2.5"><Chip tone={statusTone(r)}>{r?.status || "—"}</Chip></td>
                    <td className="px-4 py-2.5">{fmt(r?.started_at ?? r?.attempt_date ?? r?.created_at ?? r?.date)}</td>
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
