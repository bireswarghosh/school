"use client"

import { useMemo } from "react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, TableCard, PrintButtons, EmptyRow, FooterCount } from "@/components/reports/ui"
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

type GroupRow = {
  head: string
  count: number
  total: number
}

const headName = (h: IncomeRow["incomeHead"]) => {
  if (typeof h === "string") return h
  return h?.name || "—"
}

export default function IncomeGroupReportPage() {
  const { symbol } = useCurrency()
  const fmt = (n: number) => symbol + (Number(n) || 0).toLocaleString("en-IN")
  const { data: income, loading } = useReportData<IncomeRow>("/api/income")

  const grouped = useMemo(() => {
    const m = new Map<string, GroupRow>()
    for (const r of income) {
      const key = headName(r.incomeHead)
      const g = m.get(key) || { head: key, count: 0, total: 0 }
      g.count += 1
      g.total += Number(r.amount) || 0
      m.set(key, g)
    }
    return Array.from(m.values())
  }, [income])

  const totalCount = useMemo(() => grouped.reduce((s, g) => s + g.count, 0), [grouped])
  const totalAmount = useMemo(() => grouped.reduce((s, g) => s + g.total, 0), [grouped])

  return (
    <div className="space-y-6">
      <ReportBanner title="Income Group Report" subtitle="Reports / Finance / Income Group Report" />

      <TableCard title={`Income Group Report (${grouped.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Income Head</th>
                <th className="px-4 py-3">Count</th>
                <th className="px-4 py-3">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={4} message="Loading..." />
              ) : grouped.length === 0 ? (
                <EmptyRow colSpan={4} />
              ) : (
                grouped.map((g, i) => (
                  <tr key={g.head} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{g.head}</td>
                    <td className="px-4 py-2.5">{g.count}</td>
                    <td className="px-4 py-2.5 font-medium">{fmt(g.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {grouped.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-gray-700">
                  <td className="px-4 py-2.5" colSpan={2}>Overall Total</td>
                  <td className="px-4 py-2.5">{totalCount}</td>
                  <td className="px-4 py-2.5">{fmt(totalAmount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {!loading && <FooterCount shown={grouped.length} total={grouped.length} />}
      </TableCard>
    </div>
  )
}
