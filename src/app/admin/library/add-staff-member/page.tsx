"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Plus, X, Library, UserPlus } from "lucide-react"
import { useApi } from "@/lib/use-api"

type DepartmentRecord = {
  id: number
  name: string
}

type StaffRecord = {
  id: number
  staff_id: string
  name: string
  department: string
  designation: string
}

type LibraryMember = {
  id?: number
  member_type: string
  member_id: number
  library_card_no: string
  name: string
}

export default function AddStaffMemberPage() {
  const { data: members, add, remove } = useApi<LibraryMember>("/api/library/members")
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("")
  const [staffList, setStaffList] = useState<StaffRecord[]>([])
  const [searchDone, setSearchDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cardNo, setCardNo] = useState("")
  const [showCardModal, setShowCardModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffRecord | null>(null)

  useEffect(() => {
    fetch("/api/human-resource/department")
      .then((r) => r.json())
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
  }, [])

  const memberIds = useMemo(() => new Set(members.filter((m) => m.member_type === "staff").map((m) => m.member_id)), [members])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = selectedDepartmentId
        ? `/api/staff?department_id=${selectedDepartmentId}`
        : "/api/staff"
      const res = await fetch(url)
      const data = await res.json()
      setStaffList(Array.isArray(data) ? data : [])
      setSearchDone(true)
    } finally {
      setLoading(false)
    }
  }

  const handleAddClick = (staff: StaffRecord) => {
    setSelectedStaff(staff)
    setCardNo("")
    setShowCardModal(true)
  }

  const confirmAdd = async () => {
    if (!selectedStaff) return
    await add({
      member_type: "staff",
      member_id: selectedStaff.id,
      library_card_no: cardNo,
      name: selectedStaff.name,
    })
    setShowCardModal(false)
    setSelectedStaff(null)
  }

  const handleRemove = async (member: LibraryMember) => {
    if (member.id) await remove(member.id)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Add Staff Member</h2>
          <p className="text-sm text-white/80 mt-1">Library / Add Staff Member</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Select Criteria
          </h3>
        </div>
        <form onSubmit={handleSearch} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <select value={selectedDepartmentId} onChange={(e) => setSelectedDepartmentId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">All</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={loading} className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2 disabled:opacity-50">
                <Search className="h-4 w-4" />
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Library Card No.</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Staff No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Department</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Designation</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {!searchDone ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">Select department and click search</td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">No staff found</td>
                </tr>
              ) : (
                staffList.map((s, idx) => {
                  const member = members.find((m) => m.member_type === "staff" && m.member_id === s.id)
                  return (
                    <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""} ${member ? "bg-green-50" : ""}`}>
                      <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{member ? member.library_card_no : "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{s.staff_id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.department}</td>
                      <td className="px-4 py-3 text-gray-600">{s.designation}</td>
                      <td className="px-4 py-3 text-right">
                        {member ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs text-green-600 font-medium mr-2">Member</span>
                            <button onClick={() => handleRemove(member)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Surrender">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => handleAddClick(s)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Add as Library Member">
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCardModal && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCardModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Library className="h-5 w-5 text-[var(--primary)]" />
                Add Library Member
              </h3>
              <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
                <p className="text-sm font-semibold text-gray-800">{selectedStaff.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Library Card Number</label>
                <input type="text" value={cardNo} onChange={(e) => setCardNo(e.target.value)} placeholder="Enter library card number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowCardModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={confirmAdd} className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
