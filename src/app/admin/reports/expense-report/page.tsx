"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, inputCls, selectCls } from "@/components/reports/ui"
import { useCurrency } from "@/lib/currency-context"

type ExpenseRow = {
  id: number
  expenseHeadId?: number
  name?: string
  invoiceNo?: string
  date?: string
  amount?: number
  description?: string
  paymentMode?: string
  note?: string
  createdAt?: string
  document?: string
  schoolId?: number
  expenseHead?: { id?: number; name?: string } | string | null
}

const headName = (h: ExpenseRow["expenseHead"]) => {
  if (typeof h === "string") return h
  return h?.name || "—"
}

export default function ExpenseReportPage() {
  const { symbol } = useCurrency()
  const fmt = (n: number) => symbol + (Number(n) || 0).toLocaleString("en-IN")
  const { data: expenses, loading } = useReportData<ExpenseRow>("/api/expenses")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [head, setHead] = useState("")

  const heads = useMemo(() => {
    const all = expenses.map((r) => headName(r.expenseHead)).filter((h) => h !== "—")
    return Array.from(new Set(all))
  }, [expenses])

  const rows = useMemo(() => {
    return expenses.filter((r) => {
      const day = r.date ? String(r.date).slice(0, 10) : ""
      if (from && (!day || day < from)) return false
      if (to && (!day || day > to)) return false
      if (head && headName(r.expenseHead) !== head) return false
      return true
    })
  }, [expenses, from, to, head])

  const total = useMemo(() => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0), [rows])

  return (
    <div className="space-y-6">
      <ReportBanner title="Expense Report" subtitle="Reports / Finance / Expense Report" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="From Date">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          </Field>
          <Field label="To Date">
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Expense Head">
            <select value={head} onChange={(e) => setHead(e.target.value)} className={selectCls}>
              <option value="">All Heads</option>
              {heads.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Expense Report (${rows.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Head</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Invoice No</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={8} message="Loading..." />
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={8} />
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5">{r.date ? new Date(r.date).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-2.5 font-medium">{headName(r.expenseHead)}</td>
                    <td className="px-4 py-2.5">{r.name || "—"}</td>
                    <td className="px-4 py-2.5">{r.invoiceNo || "—"}</td>
                    <td className="px-4 py-2.5 font-medium">{fmt(Number(r.amount) || 0)}</td>
                    <td className="px-4 py-2.5">{r.paymentMode || "—"}</td>
                    <td className="px-4 py-2.5">{r.note || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-gray-700">
                  <td className="px-4 py-2.5" colSpan={5}>Total</td>
                  <td className="px-4 py-2.5">{fmt(total)}</td>
                  <td className="px-4 py-2.5" colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {!loading && <FooterCount shown={rows.length} total={expenses.length} />}
      </TableCard>
    </div>
  )
}
