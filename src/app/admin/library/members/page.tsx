"use client"

import { useState, useMemo } from "react"
import { Search, Users, BookOpen, Trash2 } from "lucide-react"
import { useApi } from "@/lib/use-api"
import Link from "next/link"

type LibraryMember = {
  id: number
  member_type: string
  member_id: number
  library_card_no: string
  admission_no: string
  name: string
  phone: string
  father_name: string
  dob: string
  gender: string
  mobile: string
  class_name: string
  staff_no: string
  department: string
  designation: string
}

export default function LibraryMembersPage() {
  const { data: members, remove } = useApi<LibraryMember>("/api/library/members")
  const [filterType, setFilterType] = useState("")

  const filtered = useMemo(() => {
    if (!filterType) return members
    return members.filter((m) => m.member_type === filterType)
  }, [members, filterType])

  const isStaffView = filterType === "staff"

  const handleDelete = async (id: number) => {
    await remove(id)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Library Members</h2>
          <p className="text-sm text-white/80 mt-1">Library / Members</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Select Criteria
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Member Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">All</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members List
          </h3>
          <div className="flex gap-2">
            <Link href="/admin/library/add-student" className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors">Add Student</Link>
            <Link href="/admin/library/add-staff-member" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">Add Staff</Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {isStaffView ? (
                  <>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Library Card No.</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Staff No</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Department</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Designation</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
                  </>
                ) : (
                  <>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Member ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Library Card No.</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Admission No</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Class</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Father Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date Of Birth</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Gender</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Mobile Number</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isStaffView ? 7 : 10} className="text-center py-8 text-gray-400">No members found. Add students or staff from the buttons above.</td>
                </tr>
              ) : (
                filtered.map((m, idx) => (
                  <tr key={m.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    {isStaffView ? (
                      <>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{m.library_card_no || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{m.staff_no || "-"}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                        <td className="px-4 py-3 text-gray-600">{m.department || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{m.designation || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/library/member/issue/${m.id}`} className="p-1.5 text-[var(--primary)] hover:bg-orange-50 rounded-lg transition-colors" title="Issue Book">
                              <BookOpen className="h-4 w-4" />
                            </Link>
                            <button onClick={() => handleDelete(m.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-gray-600">{m.member_id}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{m.library_card_no || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{m.admission_no || "-"}</td>
                        <td className="px-4 py-3 text-gray-800">{m.name}</td>
                        <td className="px-4 py-3 text-gray-600">{m.class_name || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{m.father_name || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{m.dob ? new Date(m.dob).toLocaleDateString("en-GB") : "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{m.gender || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{m.mobile || m.phone || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/library/member/issue/${m.id}`} className="p-1.5 text-[var(--primary)] hover:bg-orange-50 rounded-lg transition-colors" title="Issue Book">
                              <BookOpen className="h-4 w-4" />
                            </Link>
                            <button onClick={() => handleDelete(m.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length} of {members.length} records</span>
        </div>
      </div>
    </div>
  )
}
