"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Search, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, inputCls } from "@/components/reports/ui"
import { useCurrency } from "@/lib/currency-context"

type IncomeRow = {
  id: number
  incomeHeadId?: number
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
  incomeHead?: { id?: number; name?: string } | string | null
}

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

const headName = (h: IncomeRow["incomeHead"] | ExpenseRow["expenseHead"]) => {
  if (typeof h === "string") return h
  return h?.name || "—"
}

function StatCard({ icon, title, value, accent }: { icon: ReactNode; title: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex items-center gap-4">
      <div className="h-11 w-11 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <p className="mt-0.5 text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  )
}

export default function IncomeExpenseBalanceReportPage() {
  const { symbol } = useCurrency()
  const fmt = (n: number) => symbol + (Number(n) || 0).toLocaleString("en-IN")
  const { data: income, loading: incomeLoading } = useReportData<IncomeRow>("/api/income")
  const { data: expenses, loading: expenseLoading } = useReportData<ExpenseRow>("/api/expenses")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const filteredIncome = useMemo(() => {
    return income.filter((r) => {
      const day = r.date ? String(r.date).slice(0, 10) : ""
      return (!from || (day && day >= from)) && (!to || (day && day <= to))
    })
  }, [income, from, to])

  const filteredExpenses = useMemo(() => {
    return expenses.filter((r) => {
      const day = r.date ? String(r.date).slice(0, 10) : ""
      return (!from || (day && day >= from)) && (!to || (day && day <= to))
    })
  }, [expenses, from, to])

  const totalIncome = useMemo(() => filteredIncome.reduce((s, r) => s + (Number(r.amount) || 0), 0), [filteredIncome])
  const totalExpense = useMemo(() => filteredExpenses.reduce((s, r) => s + (Number(r.amount) || 0), 0), [filteredExpenses])
  const netBalance = totalIncome - totalExpense

  const recentIncome = useMemo(
    () => [...filteredIncome].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 5),
    [filteredIncome]
  )
  const recentExpense = useMemo(
    () => [...filteredExpenses].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 5),
    [filteredExpenses]
  )

  return (
    <div className="space-y-6">
      <ReportBanner title="Income Expense Balance Report" subtitle="Reports / Finance / Income Expense Balance Report" />

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<TrendingUp className="h-5 w-5" />} title="Total Income" value={fmt(totalIncome)} accent="#16a34a" />
        <StatCard icon={<TrendingDown className="h-5 w-5" />} title="Total Expense" value={fmt(totalExpense)} accent="#dc2626" />
        <StatCard icon={<Wallet className="h-5 w-5" />} title="Net Balance" value={fmt(netBalance)} accent="var(--primary)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TableCard title={`Recent Income (${recentIncome.length})`} action={<PrintButtons />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Head</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {incomeLoading ? (
                  <EmptyRow colSpan={5} message="Loading..." />
                ) : recentIncome.length === 0 ? (
                  <EmptyRow colSpan={5} />
                ) : (
                  recentIncome.map((r, i) => (
                    <tr key={r.id} className="hover:bg-orange-50/50">
                      <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-2.5">{r.date ? new Date(r.date).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-2.5 font-medium">{headName(r.incomeHead)}</td>
                      <td className="px-4 py-2.5">{r.name || "—"}</td>
                      <td className="px-4 py-2.5 font-medium text-green-700">{fmt(Number(r.amount) || 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TableCard>

        <TableCard title={`Recent Expense (${recentExpense.length})`} action={<PrintButtons />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Head</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenseLoading ? (
                  <EmptyRow colSpan={5} message="Loading..." />
                ) : recentExpense.length === 0 ? (
                  <EmptyRow colSpan={5} />
                ) : (
                  recentExpense.map((r, i) => (
                    <tr key={r.id} className="hover:bg-orange-50/50">
                      <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-2.5">{r.date ? new Date(r.date).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-2.5 font-medium">{headName(r.expenseHead)}</td>
                      <td className="px-4 py-2.5">{r.name || "—"}</td>
                      <td className="px-4 py-2.5 font-medium text-red-700">{fmt(Number(r.amount) || 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
      </div>
    </div>
  )
}
