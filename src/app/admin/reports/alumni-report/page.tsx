"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, inputCls, selectCls } from "@/components/reports/ui"

type AlumniRow = {
  id: number
  [key: string]: any
}

export default function AlumniReportPage() {
  const { data: rows, loading } = useReportData<AlumniRow>("/api/alumni")
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((r) => `${r?.name || ""} ${r?.batch || ""} ${r?.email || ""}`.toLowerCase().includes(term))
  }, [rows, q])

  return (
    <div className="space-y-6">
      <ReportBanner title="Alumni Report" subtitle="Reports / Alumni / Alumni Report" />

      <FilterCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name / batch / email..." className={inputCls} />
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Alumni Report (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Passing Year</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Occupation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={7} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={7} message="No alumni registered yet" />
              ) : (
                filtered.map((r, i) => (
                  <tr key={r?.id ?? i} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{r?.name || "—"}</td>
                    <td className="px-4 py-2.5">{r?.batch || "—"}</td>
                    <td className="px-4 py-2.5">{r?.passing_year || "—"}</td>
                    <td className="px-4 py-2.5">{r?.email || "—"}</td>
                    <td className="px-4 py-2.5">{r?.phone || r?.mobile || "—"}</td>
                    <td className="px-4 py-2.5">{r?.occupation || "—"}</td>
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
