"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, Chip, inputCls, selectCls } from "@/components/reports/ui"

type IssueRow = {
  id: number
  bookId: number
  memberType: string
  memberName: string
  memberId: number
  issueDate: string
  returnDate: string
  status: string
  bookName: string
  bookNumber: string
}

const OVERDUE = "__overdue__"

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function isReturned(status?: string) {
  return status ? String(status).toLowerCase().includes("return") : false
}

function isOverdue(returnDate?: string, status?: string) {
  if (!returnDate || isReturned(status)) return false
  return String(returnDate).slice(0, 10) < todayStr()
}

export default function BookDueReportPage() {
  const { data: rows, loading } = useReportData<IssueRow>("/api/library/issue")
  const [status, setStatus] = useState("")

  const dueRows = useMemo(
    () => rows.filter((r) => isOverdue(r.returnDate, r.status) || String(r.status || "").toLowerCase().includes("due")),
    [rows]
  )

  const statuses = useMemo(() => Array.from(new Set(dueRows.map((r) => r.status).filter(Boolean))), [dueRows])
  const hasOverdue = dueRows.some((r) => isOverdue(r.returnDate, r.status))

  const filtered = useMemo(
    () =>
      dueRows.filter((r) => {
        if (status === OVERDUE) return isOverdue(r.returnDate, r.status)
        if (status) return r.status === status
        return true
      }),
    [dueRows, status]
  )

  return (
    <div className="space-y-6">
      <ReportBanner title="Book Due Report" subtitle="Reports / Library / Book Due Report" />

      <FilterCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
              <option value="">All</option>
              {hasOverdue && <option value={OVERDUE}>Overdue</option>}
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Book Due Report (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Book Name</th>
                <th className="px-4 py-3">Book Number</th>
                <th className="px-4 py-3">Member Type</th>
                <th className="px-4 py-3">Member Name</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Return Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={8} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={8} />
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{r.bookName || "—"}</td>
                    <td className="px-4 py-2.5">{r.bookNumber || "—"}</td>
                    <td className="px-4 py-2.5">{r.memberType || "—"}</td>
                    <td className="px-4 py-2.5">{r.memberName || "—"}</td>
                    <td className="px-4 py-2.5">{r.issueDate ? String(r.issueDate).slice(0, 10) : "—"}</td>
                    <td className="px-4 py-2.5">{r.returnDate ? String(r.returnDate).slice(0, 10) : "—"}</td>
                    <td className="px-4 py-2.5">
                      {isOverdue(r.returnDate, r.status) ? (
                        <Chip tone="amber">Overdue</Chip>
                      ) : (
                        <Chip tone="green">{r.status || "Due"}</Chip>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && <FooterCount shown={filtered.length} total={dueRows.length} />}
      </TableCard>
    </div>
  )
}
