"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, inputCls, selectCls } from "@/components/reports/ui"
import { useCurrency } from "@/lib/currency-context"

type BookRow = {
  id: number
  bookName: string
  bookNumber: string
  isbn: string
  author: string
  subject: string
  rackNumber: string
  price: number
  qty: number
  description: string
  publisher: string
  postDate: string
}

export default function BookInventoryReportPage() {
  const { symbol } = useCurrency()
  const { data: rows, loading } = useReportData<BookRow>("/api/library/book")
  const [subject, setSubject] = useState("")

  const subjects = useMemo(() => Array.from(new Set(rows.map((r) => r.subject).filter(Boolean))), [rows])

  const filtered = useMemo(() => rows.filter((r) => (subject ? r.subject === subject : true)), [rows, subject])

  return (
    <div className="space-y-6">
      <ReportBanner title="Book Inventory Report" subtitle="Reports / Library / Book Inventory Report" />

      <FilterCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Subject">
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className={selectCls}>
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Book Inventory Report (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Book Name</th>
                <th className="px-4 py-3">Book Number</th>
                <th className="px-4 py-3">ISBN</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Rack</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Publisher</th>
                <th className="px-4 py-3">Posted On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={11} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={11} />
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{r.bookName || "—"}</td>
                    <td className="px-4 py-2.5">{r.bookNumber || "—"}</td>
                    <td className="px-4 py-2.5">{r.isbn || "—"}</td>
                    <td className="px-4 py-2.5">{r.author || "—"}</td>
                    <td className="px-4 py-2.5">{r.subject || "—"}</td>
                    <td className="px-4 py-2.5">{r.rackNumber || "—"}</td>
                    <td className="px-4 py-2.5">{r.qty ?? "—"}</td>
                    <td className="px-4 py-2.5">{r.price ? `${symbol}${r.price}` : "—"}</td>
                    <td className="px-4 py-2.5">{r.publisher || "—"}</td>
                    <td className="px-4 py-2.5">{r.postDate ? String(r.postDate).slice(0, 10) : "—"}</td>
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
