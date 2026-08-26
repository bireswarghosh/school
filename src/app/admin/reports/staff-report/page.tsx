"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, Chip, selectCls } from "@/components/reports/ui"

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

export default function StaffReportPage() {
  const { data: staff, loading } = useReportData<StaffRow>("/api/reports/staff")
  const [department, setDepartment] = useState("")
  const [role, setRole] = useState("")

  const departments = useMemo(
    () => Array.from(new Set(staff.map((s) => s.department).filter(Boolean))).sort(),
    [staff]
  )
  const roles = useMemo(
    () => Array.from(new Set(staff.map((s) => s.role).filter(Boolean))).sort(),
    [staff]
  )

  const filtered = useMemo(
    () => staff.filter((s) => {
      if (department && s.department !== department) return false
      if (role && s.role !== role) return false
      return true
    }),
    [staff, department, role]
  )

  const statusTone = (st: string) => {
    const v = String(st || "").toLowerCase()
    if (v === "active" || v === "1" || v === "yes") return "green" as const
    if (v === "inactive" || v === "0" || v === "no" || v === "resigned" || v === "terminated") return "red" as const
    return "gray" as const
  }

  return (
    <div className="space-y-6">
      <ReportBanner title="Staff Report" subtitle="Reports / Human Resource / Staff Report" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Department">
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className={selectCls}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
              <option value="">All Roles</option>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Staff Report (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Staff ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Role</th>
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
                    <td className="px-4 py-2.5 font-medium">{s.staff_id || "—"}</td>
                    <td className="px-4 py-2.5">{s.name || "—"}</td>
                    <td className="px-4 py-2.5">{s.email || "—"}</td>
                    <td className="px-4 py-2.5">{s.phone || "—"}</td>
                    <td className="px-4 py-2.5">{s.department || "—"}</td>
                    <td className="px-4 py-2.5">{s.designation || "—"}</td>
                    <td className="px-4 py-2.5">{s.role || "—"}</td>
                    <td className="px-4 py-2.5"><Chip tone={statusTone(s.status)}>{s.status || "—"}</Chip></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && <FooterCount shown={filtered.length} total={staff.length} />}
      </TableCard>
    </div>
  )
}
