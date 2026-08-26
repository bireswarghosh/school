"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, Chip, inputCls, selectCls } from "@/components/reports/ui"

type StaffAtt = {
  id: number
  staff_id: number
  date: string
  attendance_type_id: number | null
  in_time: string | null
  out_time: string | null
  created_at: string
  school_id: number
}

type StaffRow = {
  id: number
  staff_id: string
  name: string
  email: string
  phone: string
  role: string
  department: string
  designation: string
  status: string
  department_id: number
  designation_id: number
}

type AttType = {
  id: number
  type: string
}

function typeTone(type: string): "green" | "amber" | "red" | "purple" | "gray" {
  switch (String(type).toLowerCase()) {
    case "present":
      return "green"
    case "late":
      return "amber"
    case "absent":
      return "red"
    case "holiday":
      return "purple"
    default:
      return "gray"
  }
}

export default function StaffDaywiseAttendancePage() {
  const { data: staff, loading: staffLoading } = useReportData<StaffRow>("/api/reports/staff")
  const { data: rows, loading } = useReportData<StaffAtt>("/api/attendance/staff")
  const { data: attTypes } = useReportData<AttType>("/api/attendance/type")
  const [staffId, setStaffId] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const typeMap = useMemo(() => {
    const m = new Map<number, string>()
    attTypes.forEach((t) => m.set(t.id, t.type))
    return m
  }, [attTypes])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (staffId && String(r.staff_id) !== staffId) return false
      const d = String(r.date).slice(0, 10)
      if (fromDate && d < fromDate) return false
      if (toDate && d > toDate) return false
      return true
    })
  }, [rows, staffId, fromDate, toDate])

  return (
    <div className="space-y-6">
      <ReportBanner title="Staff Day Wise Attendance Report" subtitle="Reports / Attendance / Staff Day Wise Attendance Report" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Staff">
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className={selectCls}>
              <option value="">All Staff</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Date From">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Date To">
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputCls} />
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Staff Day Wise Attendance (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Attendance Type</th>
                <th className="px-4 py-3">In Time</th>
                <th className="px-4 py-3">Out Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading || staffLoading ? (
                <EmptyRow colSpan={5} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={5} />
              ) : (
                filtered.map((r, i) => {
                  const t = r.attendance_type_id ? typeMap.get(r.attendance_type_id) || "—" : "—"
                  return (
                    <tr key={r.id} className="hover:bg-orange-50/50">
                      <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-2.5">{String(r.date).slice(0, 10)}</td>
                      <td className="px-4 py-2.5">
                        <Chip tone={typeTone(t)}>{t}</Chip>
                      </td>
                      <td className="px-4 py-2.5">{r.in_time || "—"}</td>
                      <td className="px-4 py-2.5">{r.out_time || "—"}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && !staffLoading && <FooterCount shown={filtered.length} total={rows.length} />}
      </TableCard>
    </div>
  )
}
