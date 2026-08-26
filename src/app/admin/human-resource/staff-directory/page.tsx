"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Eye, X, Search } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Staff = {
  id: number
  staffId: string
  name: string
  email: string
  mobile: string
  department: string
  designation: string
  role: string
  status: string
}

const departments = ["Science", "Mathematics", "English", "Admin", "Transport"]
const designations = ["Teacher", "HOD", "Clerk", "Driver", "Librarian"]
const roles = ["Admin", "Teacher", "Accountant", "Librarian", "Driver"]

export default function StaffDirectoryPage() {
  const { data: staffList, add, update, remove, loading } = useApi<Staff>("/api/human-resource/staff")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [viewing, setViewing] = useState<Staff | null>(null)
  const [filterDept, setFilterDept] = useState("")
  const [filterDesig, setFilterDesig] = useState("")
  const [form, setForm] = useState({ name: "", email: "", mobile: "", department: departments[0], designation: designations[0], role: roles[0], status: "Active" })

  const filtered = staffList.filter((s) => {
    if (filterDept && s.department !== filterDept) return false
    if (filterDesig && s.designation !== filterDesig) return false
    return true
  })

  const handleOpenAdd = () => {
    setEditing(null)
    setForm({ name: "", email: "", mobile: "", department: departments[0], designation: designations[0], role: roles[0], status: "Active" })
    setShowModal(true)
  }

  const handleOpenEdit = (s: Staff) => {
    setEditing(s)
    setForm({ name: s.name, email: s.email, mobile: s.mobile, department: s.department, designation: s.designation, role: s.role, status: s.status })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.email) return
    if (editing) {
      await update(editing.id, form)
    } else {
      await add(form)
    }
    setShowModal(false)
    setEditing(null)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      await remove(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Staff Directory</h2>
          <p className="text-sm text-white/70 mt-0.5">Human Resource / Staff Directory</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">All Staff</h3>
          <button onClick={handleOpenAdd} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90">
            <Plus className="h-4 w-4" /> Add Staff
          </button>
        </div>
        <div className="p-5 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterDesig} onChange={(e) => setFilterDesig(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All Designations</option>
              {designations.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Search className="h-4 w-4" /> {filtered.length} records found
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Staff ID", "Name", "Email", "Mobile", "Department", "Designation", "Role", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((staff, idx) => (
                <tr key={staff.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-600">{staff.staffId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{staff.name}</td>
                  <td className="px-4 py-3 text-gray-600">{staff.email}</td>
                  <td className="px-4 py-3 text-gray-600">{staff.mobile}</td>
                  <td className="px-4 py-3 text-gray-600">{staff.department}</td>
                  <td className="px-4 py-3 text-gray-600">{staff.designation}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${staff.role === "Admin" ? "bg-purple-100 text-purple-700 border-purple-300" : staff.role === "Teacher" ? "bg-blue-100 text-blue-700 border-blue-300" : staff.role === "Accountant" ? "bg-green-100 text-green-700 border-green-300" : staff.role === "Librarian" ? "bg-yellow-100 text-yellow-700 border-yellow-300" : "bg-gray-100 text-gray-700 border-gray-300"}`}>{staff.role}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewing(staff)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => handleOpenEdit(staff)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(staff.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No staff records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">Showing {filtered.length} of {staffList.length} records</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{editing ? "Edit Staff" : "Add Staff"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter full name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Enter email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mobile</label>
                <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Enter mobile number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Designation</label>
                  <select value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    {designations.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 rounded-lg">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Staff Details</h3>
              <button onClick={() => setViewing(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              {[["Staff ID", viewing.staffId], ["Name", viewing.name], ["Email", viewing.email], ["Mobile", viewing.mobile], ["Department", viewing.department], ["Designation", viewing.designation], ["Role", viewing.role], ["Status", viewing.status]].map(([label, value]) => (
                <div key={label as string} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">{label as string}</span>
                  <span className="font-medium text-gray-800">{value as string}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setViewing(null)} className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
