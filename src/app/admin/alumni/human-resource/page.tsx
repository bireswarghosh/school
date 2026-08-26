"use client"

import { useState, useMemo } from "react"
import { Eye, X, Search } from "lucide-react"
import { useApi } from "@/lib/use-api"

type StaffAlumni = {
  id: number
  name: string
  email: string
  phone: string
  passoutYear: number
  department: string
  designation: string
}

const departments = ["Science", "Mathematics", "English", "Arts", "Physical Education"]

export default function HumanResourcePage() {
  const { data: staff, loading } = useApi<StaffAlumni>("/api/alumni/hr")
  const [filterDept, setFilterDept] = useState("")
  const [viewStaff, setViewStaff] = useState<StaffAlumni | null>(null)

  const filteredStaff = useMemo(() => {
    if (!filterDept) return staff
    return staff.filter((s) => s.department === filterDept)
  }, [staff, filterDept])

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Human Resource</h1>
        <p className="mt-1 text-sm text-white/80">Alumni / Human Resource</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <button className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5"><Search className="h-4 w-4" /> Search</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Passout Year</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Department</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Designation</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s, idx) => (
                <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.email}</td>
                  <td className="px-4 py-3 text-gray-600">{s.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{s.passoutYear}</td>
                  <td className="px-4 py-3 text-gray-600">{s.department}</td>
                  <td className="px-4 py-3 text-gray-600">{s.designation}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setViewStaff(s)} className="text-blue-600 hover:text-blue-800"><Eye className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-sm text-gray-500">Showing {filteredStaff.length} records</div>
      </div>

      {viewStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewStaff(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Staff Details</h2>
              <button onClick={() => setViewStaff(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Name:</span><span className="text-gray-800">{viewStaff.name}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Email:</span><span className="text-gray-800">{viewStaff.email}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Phone:</span><span className="text-gray-800">{viewStaff.phone}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Passout Year:</span><span className="text-gray-800">{viewStaff.passoutYear}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Department:</span><span className="text-gray-800">{viewStaff.department}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Designation:</span><span className="text-gray-800">{viewStaff.designation}</span></div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setViewStaff(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
