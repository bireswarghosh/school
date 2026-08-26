"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, Chip, inputCls, selectCls } from "@/components/reports/ui"
import { useCurrency } from "@/lib/currency-context"

type FeeRow = {
  id: number
  studentId?: number
  classId?: number
  feesGroup?: string
  feesType?: string
  amount?: number
  discountId?: number
  discountAmount?: number
  fineAmount?: number
  paidAmount?: number
  paymentMode?: string
  paymentDate?: string
  status?: string
  createdAt?: string
}

type StudentRow = {
  id: number
  name?: string
  admission_no?: string
  class?: string
  section?: string
  class_id?: number
}

const statusTone = (s?: string) => {
  const t = (s || "").toLowerCase()
  if (t.includes("paid") || t === "success") return "green" as const
  if (t.includes("partial")) return "amber" as const
  if (t.includes("unpaid") || t.includes("due")) return "red" as const
  if (t.includes("pending")) return "amber" as const
  return "gray" as const
}

export default function FeesStatementPage() {
  const { symbol } = useCurrency()
  const fmt = (n: number) => symbol + (Number(n) || 0).toLocaleString("en-IN")
  const { data: fees, loading } = useReportData<FeeRow>("/api/fees/fees-payment")
  const { data: students } = useReportData<StudentRow>("/api/reports/students")
  const { data: classes } = useReportData<{ id: number; name: string }>("/api/classes")
  const [classId, setClassId] = useState("")
  const [studentId, setStudentId] = useState("")

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students])

  const classStudents = useMemo(
    () => students.filter((s) => (classId ? String(s.class_id) === classId : true)),
    [students, classId]
  )

  const rows = useMemo(
    () => fees.filter((r) => (studentId && String(r.studentId) === studentId)),
    [fees, studentId]
  )

  const selectedStudent = studentMap.get(Number(studentId))

  const totalBilled = useMemo(() => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0), [rows])
  const totalPaid = useMemo(() => rows.reduce((s, r) => s + (Number(r.paidAmount) || 0), 0), [rows])

  return (
    <div className="space-y-6">
      <ReportBanner title="Fees Statement" subtitle="Reports / Finance / Fees Statement" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Class">
            <select
              value={classId}
              onChange={(e) => { setClassId(e.target.value); setStudentId("") }}
              className={selectCls}
            >
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Student">
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={selectCls}>
              <option value="">Select Student</option>
              {classStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.name || `#${s.id}`}</option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Fees Statement${selectedStudent ? ` - ${selectedStudent.name}` : ""} (${rows.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Fees Group</th>
                <th className="px-4 py-3">Fees Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Fine</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={10} message="Loading..." />
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={10} message={studentId ? "No fee records for this student" : "Select a student to view the statement"} />
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5">{r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-2.5">{r.feesGroup || "—"}</td>
                    <td className="px-4 py-2.5">{r.feesType || "—"}</td>
                    <td className="px-4 py-2.5">{fmt(Number(r.amount) || 0)}</td>
                    <td className="px-4 py-2.5">{fmt(Number(r.discountAmount) || 0)}</td>
                    <td className="px-4 py-2.5">{fmt(Number(r.fineAmount) || 0)}</td>
                    <td className="px-4 py-2.5 font-medium">{fmt(Number(r.paidAmount) || 0)}</td>
                    <td className="px-4 py-2.5">{r.paymentMode || "—"}</td>
                    <td className="px-4 py-2.5"><Chip tone={statusTone(r.status)}>{r.status || "—"}</Chip></td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-gray-700">
                  <td className="px-4 py-2.5" colSpan={4}>Total</td>
                  <td className="px-4 py-2.5">{fmt(totalBilled)}</td>
                  <td className="px-4 py-2.5" colSpan={2}></td>
                  <td className="px-4 py-2.5">{fmt(totalPaid)}</td>
                  <td className="px-4 py-2.5" colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {!loading && <FooterCount shown={rows.length} total={fees.length} />}
      </TableCard>
    </div>
  )
}
