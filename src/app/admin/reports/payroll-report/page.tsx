"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, Chip, inputCls } from "@/components/reports/ui"
import { useCurrency } from "@/lib/currency-context"

type PayrollRow = {
  id?: number
  staffId?: number
  staffName?: string
  name?: string
  employeeName?: string
  month?: string
  salary?: number
  basic?: number
  gross?: number
  netPay?: number
  paidAmount?: number
  paid?: number
  amount?: number
  paymentMode?: string
  paymentDate?: string
  status?: string
}

const staffName = (r: PayrollRow) => r.staffName || r.name || r.employeeName || "—"

const rowMonth = (r: PayrollRow) => r.month || (r.paymentDate ? String(r.paymentDate).slice(0, 7) : "")

const rowSalary = (r: PayrollRow) => r.salary ?? r.gross ?? r.basic

const rowPaid = (r: PayrollRow) => r.paid ?? r.paidAmount ?? r.netPay ?? r.amount

const statusTone = (s?: string) => {
  const t = (s || "").toLowerCase()
  if (t.includes("paid") || t === "success") return "green" as const
  if (t.includes("pending")) return "amber" as const
  if (t.includes("unpaid") || t.includes("due")) return "red" as const
  return "gray" as const
}

export default function PayrollReportPage() {
  const { symbol } = useCurrency()
  const fmt = (n: number | undefined) => symbol + (Number(n) || 0).toLocaleString("en-IN")
  const { data: payroll, loading } = useReportData<PayrollRow>("/api/human-resource/payroll")
  const [month, setMonth] = useState("")

  const rows = useMemo(() => {
    return payroll.filter((r) => {
      if (month && rowMonth(r) !== month) return false
      return true
    })
  }, [payroll, month])

  const totalSalary = useMemo(() => rows.reduce((s, r) => s + (Number(rowSalary(r)) || 0), 0), [rows])
  const totalPaid = useMemo(() => rows.reduce((s, r) => s + (Number(rowPaid(r)) || 0), 0), [rows])

  return (
    <div className="space-y-6">
      <ReportBanner title="Payroll Report" subtitle="Reports / Finance / Payroll Report" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Month">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={inputCls} />
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Payroll Report (${rows.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Staff Name</th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Salary</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={7} message="Loading..." />
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={7} />
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id ?? i} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{staffName(r)}</td>
                    <td className="px-4 py-2.5">{rowMonth(r) || "—"}</td>
                    <td className="px-4 py-2.5">{fmt(rowSalary(r))}</td>
                    <td className="px-4 py-2.5 font-medium">{fmt(rowPaid(r))}</td>
                    <td className="px-4 py-2.5">{r.paymentMode || "—"}</td>
                    <td className="px-4 py-2.5"><Chip tone={statusTone(r.status)}>{r.status || "—"}</Chip></td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-gray-700">
                  <td className="px-4 py-2.5" colSpan={3}>Total</td>
                  <td className="px-4 py-2.5">{fmt(totalSalary)}</td>
                  <td className="px-4 py-2.5">{fmt(totalPaid)}</td>
                  <td className="px-4 py-2.5" colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {!loading && <FooterCount shown={rows.length} total={payroll.length} />}
      </TableCard>
    </div>
  )
}
