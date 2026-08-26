"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, Chip, selectCls } from "@/components/reports/ui"
import { useReportData as useClasses } from "@/components/reports/use-report-data"

type MarkRow = {
  id?: number
  [key: string]: any
}

const marksOf = (r: any) =>
  Number(r?.marks ?? r?.obtained_marks ?? r?.obtainedMarks ?? r?.score ?? r?.total_marks ?? 0)

export default function RankReportPage() {
  const { data: classes } = useClasses<{ id: number; name: string }>("/api/classes")
  const [classId, setClassId] = useState("")
  const { data: rows, loading } = useReportData<MarkRow>(
    "/api/examinations/mark",
    classId ? { class_id: classId } : undefined
  )

  const ranked = useMemo(
    () => [...rows].sort((a, b) => marksOf(b) - marksOf(a)),
    [rows]
  )

  const resultTone = (r: any) => {
    const v = String(r?.result ?? r?.grade ?? "").toLowerCase()
    if (v.includes("pass") || v === "p") return "green" as const
    if (v.includes("fail") || v === "f") return "red" as const
    return "gray" as const
  }

  return (
    <div className="space-y-6">
      <ReportBanner title="Rank Report" subtitle="Reports / Examinations / Rank Report" />

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

      <TableCard title={`Rank Report (${ranked.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Admission No</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Marks</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Percentage</th>
                <th className="px-4 py-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={10} message="Loading..." />
              ) : ranked.length === 0 ? (
                <EmptyRow colSpan={10} message="No exam marks recorded yet" />
              ) : (
                ranked.map((r, i) => (
                  <tr key={r?.id ?? i} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-white text-xs font-bold">
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium">{r?.student_name || r?.student || r?.name || "—"}</td>
                    <td className="px-4 py-2.5">{r?.admission_no || r?.admissionNo || r?.roll_no || "—"}</td>
                    <td className="px-4 py-2.5">{r?.class || r?.class_name || "—"}</td>
                    <td className="px-4 py-2.5">{r?.subject || r?.subject_name || "—"}</td>
                    <td className="px-4 py-2.5">{marksOf(r) || "—"}</td>
                    <td className="px-4 py-2.5">{r?.total || r?.total_marks || r?.max_marks || "—"}</td>
                    <td className="px-4 py-2.5">{r?.percentage || r?.percent ? `${r?.percentage ?? r?.percent}%` : "—"}</td>
                    <td className="px-4 py-2.5"><Chip tone={resultTone(r)}>{r?.result || r?.grade || "—"}</Chip></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && <FooterCount shown={ranked.length} total={rows.length} />}
      </TableCard>
    </div>
  )
}
