"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, Chip, inputCls } from "@/components/reports/ui"

type PayrollRow = {
  id?: number
  [key: string]: any
}

const monthFields = ["month", "pay_month", "payroll_month", "salary_month", "pay_date", "date", "created_at"]

export default function HrPayrollReportPage() {
  const { data: rows, loading } = useReportData<PayrollRow>("/api/human-resource/payroll")
  const [month, setMonth] = useState("")

  const filtered = useMemo(
    () => rows.filter((r) => {
      if (!month) return true
      return monthFields.some((f) => r?.[f] && String(r[f]).toLowerCase().includes(month.toLowerCase()))
    }),
    [rows, month]
  )

  const statusTone = (st: any) => {
    const v = String(st || "").toLowerCase()
    if (v === "paid" || v === "active" || v === "1") return "green" as const
    if (v === "unpaid" || v === "pending" || v === "draft") return "amber" as const
    if (v === "cancelled" || v === "rejected") return "red" as const
    return "gray" as const
  }

  const num = (v: any) => (v !== undefined && v !== null && v !== "" ? v : "—")

  return (
    <div className="space-y-6">
      <ReportBanner title="Payroll Report" subtitle="Reports / Human Resource / Payroll Report" />

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

      <TableCard title={`Payroll Report (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Staff ID</th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Basic Salary</th>
                <th className="px-4 py-3">Allowances</th>
                <th className="px-4 py-3">Deductions</th>
                <th className="px-4 py-3">Net Salary</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={9} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={9} />
              ) : (
                filtered.map((r, i) => (
                  <tr key={r?.id ?? i} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{r?.name || r?.employee || r?.staff_name || "—"}</td>
                    <td className="px-4 py-2.5">{r?.staff_id || r?.employee_id || "—"}</td>
                    <td className="px-4 py-2.5">{r?.month || r?.pay_month || r?.payroll_month || "—"}</td>
                    <td className="px-4 py-2.5">{num(r?.basic_salary ?? r?.basic ?? r?.salary)}</td>
                    <td className="px-4 py-2.5">{num(r?.allowance ?? r?.allowances ?? r?.hra)}</td>
                    <td className="px-4 py-2.5">{num(r?.deduction ?? r?.deductions)}</td>
                    <td className="px-4 py-2.5">{num(r?.net_salary ?? r?.net ?? r?.total ?? r?.total_salary)}</td>
                    <td className="px-4 py-2.5"><Chip tone={statusTone(r?.status)}>{r?.status || "—"}</Chip></td>
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
