"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, Chip, inputCls } from "@/components/reports/ui"
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

const isOnline = (mode?: string) => /online|card|net/i.test(mode || "")

const statusTone = (s?: string) => {
  const t = (s || "").toLowerCase()
  if (t.includes("paid") || t === "success") return "green" as const
  if (t.includes("partial") || t.includes("pending")) return "amber" as const
  if (t.includes("unpaid") || t.includes("failed")) return "red" as const
  return "gray" as const
}

export default function OnlineFeesCollectionReportPage() {
  const { symbol } = useCurrency()
  const fmt = (n: number) => symbol + (Number(n) || 0).toLocaleString("en-IN")
  const { data: fees, loading } = useReportData<FeeRow>("/api/fees/fees-payment")
  const { data: students } = useReportData<StudentRow>("/api/reports/students")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students])

  const rows = useMemo(() => {
    return fees.filter((r) => {
      if (!isOnline(r.paymentMode)) return false
      const day = r.paymentDate ? String(r.paymentDate).slice(0, 10) : ""
      if (from && (!day || day < from)) return false
      if (to && (!day || day > to)) return false
      return true
    })
  }, [fees, from, to])

  const totalPaid = useMemo(() => rows.reduce((s, r) => s + (Number(r.paidAmount) || 0), 0), [rows])

  return (
    <div className="space-y-6">
      <ReportBanner title="Online Fees Collection Report" subtitle="Reports / Finance / Online Fees Collection Report" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="From Date">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          </Field>
          <Field label="To Date">
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Online Fees Collection Report (${rows.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Fees Group</th>
                <th className="px-4 py-3">Fees Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={10} message="Loading..." />
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={10} />
              ) : (
                rows.map((r, i) => {
                  const st = studentMap.get(r.studentId ?? 0)
                  return (
                    <tr key={r.id} className="hover:bg-orange-50/50">
                      <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-2.5">{r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-2.5 font-medium">{st?.name || "—"}</td>
                      <td className="px-4 py-2.5">{st?.class || st?.section || "—"}</td>
                      <td className="px-4 py-2.5">{r.feesGroup || "—"}</td>
                      <td className="px-4 py-2.5">{r.feesType || "—"}</td>
                      <td className="px-4 py-2.5">{fmt(Number(r.amount) || 0)}</td>
                      <td className="px-4 py-2.5 font-medium">{fmt(Number(r.paidAmount) || 0)}</td>
                      <td className="px-4 py-2.5">{r.paymentMode || "—"}</td>
                      <td className="px-4 py-2.5"><Chip tone={statusTone(r.status)}>{r.status || "—"}</Chip></td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-gray-700">
                  <td className="px-4 py-2.5" colSpan={7}>Total</td>
                  <td className="px-4 py-2.5">{fmt(totalPaid)}</td>
                  <td className="px-4 py-2.5" colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {!loading && <FooterCount shown={rows.length} total={rows.length} />}
      </TableCard>
    </div>
  )
}
