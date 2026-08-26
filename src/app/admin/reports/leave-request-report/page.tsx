"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, Chip, selectCls } from "@/components/reports/ui"

type LeaveRow = {
  id: number
  userId?: number
  name?: string
  role?: string
  leaveType?: string
  leaveTypeId?: number
  fromDate?: string
  toDate?: string
  days?: number | string
  reason?: string
  status?: string
  document?: string
  remarks?: string
  createdAt?: string
}

const statuses = ["", "Approved", "Pending", "Rejected"]

export default function LeaveRequestReportPage() {
  const { data: leaves, loading } = useReportData<LeaveRow>("/api/attendance/leave")
  const [status, setStatus] = useState("")

  const filtered = useMemo(
    () => leaves.filter((l) => {
      if (status && String(l.status || "").toLowerCase() !== status.toLowerCase()) return false
      return true
    }),
    [leaves, status]
  )

  const statusTone = (st: string) => {
    const v = String(st || "").toLowerCase()
    if (v === "approved") return "green" as const
    if (v === "pending") return "amber" as const
    if (v === "rejected") return "red" as const
    return "gray" as const
  }

  return (
    <div className="space-y-6">
      <ReportBanner title="Leave Request Report" subtitle="Reports / Human Resource / Leave Request Report" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
              {statuses.map((s) => <option key={s || "all"} value={s}>{s || "All Status"}</option>)}
            </select>
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Leave Request Report (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Staff Name</th>
                <th className="px-4 py-3">Leave Type</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={8} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={8} />
              ) : (
                filtered.map((l, i) => (
                  <tr key={l.id} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{l.name || "—"}</td>
                    <td className="px-4 py-2.5">{l.leaveType || "—"}</td>
                    <td className="px-4 py-2.5">{l.fromDate ? String(l.fromDate).slice(0, 10) : "—"}</td>
                    <td className="px-4 py-2.5">{l.toDate ? String(l.toDate).slice(0, 10) : "—"}</td>
                    <td className="px-4 py-2.5">{l.days ?? "—"}</td>
                    <td className="px-4 py-2.5">{l.reason || "—"}</td>
                    <td className="px-4 py-2.5"><Chip tone={statusTone(l.status || "")}>{l.status || "—"}</Chip></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && <FooterCount shown={filtered.length} total={leaves.length} />}
      </TableCard>
    </div>
  )
}
