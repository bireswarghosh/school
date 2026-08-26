"use client"

import { useMemo, useState } from "react"
import { BookOpen, Search, Undo2 } from "lucide-react"
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

function isReturned(status?: string) {
  return status ? String(status).toLowerCase().includes("return") : false
}

export default function BookIssueReturnReportPage() {
  const { data: rows, loading } = useReportData<IssueRow>("/api/library/issue")
  const [memberType, setMemberType] = useState("")

  const memberTypes = useMemo(() => Array.from(new Set(rows.map((r) => r.memberType).filter(Boolean))), [rows])

  const filtered = useMemo(() => rows.filter((r) => (memberType ? r.memberType === memberType : true)), [rows, memberType])

  const issuedCount = filtered.filter((r) => !isReturned(r.status)).length
  const returnedCount = filtered.filter((r) => isReturned(r.status)).length

  return (
    <div className="space-y-6">
      <ReportBanner title="Issue Return Report" subtitle="Reports / Library / Issue Return Report" />

      <FilterCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Member Type">
            <select value={memberType} onChange={(e) => setMemberType(e.target.value)} className={selectCls}>
              <option value="">All Member Types</option>
              {memberTypes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Total Issued</p>
            <p className="text-2xl font-bold text-gray-800">{issuedCount}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Total Returned</p>
            <p className="text-2xl font-bold text-gray-800">{returnedCount}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <Undo2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      <TableCard title={`Issue Return Report (${filtered.length})`} action={<PrintButtons />}>
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
                      {isReturned(r.status) ? (
                        <Chip tone="green">Returned</Chip>
                      ) : (
                        <Chip tone="blue">Issued</Chip>
                      )}
                    </td>
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
