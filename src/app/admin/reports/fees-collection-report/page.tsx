"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, inputCls } from "@/components/reports/ui"
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

type GroupRow = {
  feesGroup: string
  feesType: string
  count: number
  total: number
}

export default function FeesCollectionReportPage() {
  const { symbol } = useCurrency()
  const fmt = (n: number) => symbol + (Number(n) || 0).toLocaleString("en-IN")
  const { data: fees, loading } = useReportData<FeeRow>("/api/fees/fees-payment")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const rows = useMemo(() => {
    return fees.filter((r) => {
      const day = r.paymentDate ? String(r.paymentDate).slice(0, 10) : ""
      if (from && (!day || day < from)) return false
      if (to && (!day || day > to)) return false
      return true
    })
  }, [fees, from, to])

  const grouped = useMemo(() => {
    const m = new Map<string, GroupRow>()
    for (const r of rows) {
      const key = `${r.feesGroup || ""}-${r.feesType || ""}`
      const g = m.get(key) || { feesGroup: r.feesGroup || "", feesType: r.feesType || "", count: 0, total: 0 }
      g.count += 1
      g.total += Number(r.paidAmount) || 0
      m.set(key, g)
    }
    return Array.from(m.values())
  }, [rows])

  const totalCount = useMemo(() => grouped.reduce((s, g) => s + g.count, 0), [grouped])
  const totalAmount = useMemo(() => grouped.reduce((s, g) => s + g.total, 0), [grouped])

  return (
    <div className="space-y-6">
      <ReportBanner title="Fees Collection Report" subtitle="Reports / Finance / Fees Collection Report" />

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

      <TableCard title={`Fees Collection Report (${grouped.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Fees Group</th>
                <th className="px-4 py-3">Fees Type</th>
                <th className="px-4 py-3">Count</th>
                <th className="px-4 py-3">Amount Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={5} message="Loading..." />
              ) : grouped.length === 0 ? (
                <EmptyRow colSpan={5} />
              ) : (
                grouped.map((g, i) => (
                  <tr key={`${g.feesGroup}-${g.feesType}`} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{g.feesGroup || "—"}</td>
                    <td className="px-4 py-2.5">{g.feesType || "—"}</td>
                    <td className="px-4 py-2.5">{g.count}</td>
                    <td className="px-4 py-2.5 font-medium">{fmt(g.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {grouped.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-gray-700">
                  <td className="px-4 py-2.5" colSpan={3}>Total</td>
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
