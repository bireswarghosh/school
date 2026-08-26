"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, inputCls, selectCls } from "@/components/reports/ui"

type StudentRow = {
  id: number
  admission_no: string
  first_name: string
  last_name: string
  admission_date: string
  previous_school: string
  status: string
  session: string
  class?: string
  section?: string
  class_id: number
}

export default function StudentHistoryPage() {
  const { data: students, loading } = useReportData<StudentRow>("/api/reports/students")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [status, setStatus] = useState("")
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return students.filter((s) => {
      const d = String(s.admission_date || "").slice(0, 10)
      if (fromDate && d < fromDate) return false
      if (toDate && d > toDate) return false
      if (status && String(s.status).toLowerCase() !== status.toLowerCase()) return false
      if (term && !`${s.first_name} ${s.last_name} ${s.admission_no}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [students, fromDate, toDate, status, q])

  return (
    <div className="space-y-6">
      <ReportBanner title="Student History" subtitle="Reports / Student Information / Student History" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Field label="Date From">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Date To">
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
              <option value="">All</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </Field>
          <Field label="Search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name / admission no..." className={inputCls} />
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Student History (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Admission No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Admission Date</th>
                <th className="px-4 py-3">Previous School</th>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={9} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={9} />
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.id} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{s.admission_no}</td>
                    <td className="px-4 py-2.5">{s.first_name} {s.last_name}</td>
                    <td className="px-4 py-2.5">{s.class || "—"}</td>
                    <td className="px-4 py-2.5">{s.section || "—"}</td>
                    <td className="px-4 py-2.5">{s.admission_date ? String(s.admission_date).slice(0, 10) : "—"}</td>
                    <td className="px-4 py-2.5">{s.previous_school || "—"}</td>
                    <td className="px-4 py-2.5">{s.session || "—"}</td>
                    <td className="px-4 py-2.5">{s.status || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && <FooterCount shown={filtered.length} total={students.length} />}
      </TableCard>
    </div>
  )
}
