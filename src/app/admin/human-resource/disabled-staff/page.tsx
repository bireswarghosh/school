"use client"

import { useState } from "react"
import { useApi } from "@/lib/use-api"

type DisabledStaff = {
  id: number
  staffId: string
  name: string
  email: string
  department: string
  disabledDate: string
  reason: string
}

const departments = ["Science", "Mathematics", "English", "Admin", "Transport"]

export default function DisabledStaffPage() {
  const { data: disabledList, remove, loading } = useApi<DisabledStaff>("/api/human-resource/disabled-staff")
  const [filterDept, setFilterDept] = useState("")

  const filtered = filterDept ? disabledList.filter((s) => s.department === filterDept) : disabledList

  const handleEnable = async (id: number) => {
    if (confirm("Enable/restore this staff member? They will be removed from the disabled list.")) {
      await remove(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Disabled Staff</h2>
          <p className="text-sm text-white/70 mt-0.5">Human Resource / Disabled Staff</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Filter</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="flex items-center text-sm text-gray-500">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Disabled Staff List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Staff ID", "Name", "Email", "Department", "Disabled Date", "Reason", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => (
                <tr key={s.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-600">{s.staffId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.email}</td>
                  <td className="px-4 py-3 text-gray-600">{s.department}</td>
                  <td className="px-4 py-3 text-gray-600">{s.disabledDate}</td>
                  <td className="px-4 py-3 text-gray-600">{s.reason}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEnable(s.id)}
                      className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:opacity-90">
                      Enable
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No disabled staff records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">Showing {filtered.length} of {disabledList.length} records</span>
        </div>
      </div>
    </div>
  )
}
