"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Check, X, Filter, Upload, FileText, Pencil } from "lucide-react"
import { useApi } from "@/lib/use-api"

const leaveTypes = ["Sick Leave", "Casual Leave", "Earned Leave", "Maternity Leave", "Paternity Leave"]

const people = [
  { id: 1, name: "Aarav Sharma", role: "Student" },
  { id: 2, name: "Priya Patel", role: "Student" },
  { id: 3, name: "Rohit Singh", role: "Student" },
  { id: 4, name: "Ms. Sunita Sharma", role: "Teacher" },
  { id: 5, name: "Amit Kumar", role: "Driver" },
  { id: 6, name: "Sneha Gupta", role: "Student" },
  { id: 7, name: "Arjun Kumar", role: "Student" },
  { id: 8, name: "Mr. Rajesh Verma", role: "Teacher" },
]

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Disapproved: "bg-red-100 text-red-700",
}

const roleBadge: Record<string, string> = {
  Teacher: "bg-purple-100 text-purple-700",
  Driver: "bg-blue-100 text-blue-700",
  Student: "bg-emerald-100 text-emerald-700",
}

export default function ApproveLeavePage() {
  const { data: leaves, add, update, loading } = useApi<any>("/api/attendance/leave")
  const [filterType, setFilterType] = useState("")
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editStatus, setEditStatus] = useState("")
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("")
  const [form, setForm] = useState({ personId: "", leaveType: "", fromDate: "", toDate: "", reason: "", document: "", remarks: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    return (leaves || []).filter((l: any) => {
      if (filterType && l.leaveType !== filterType) return false
      if (filterFrom && l.fromDate < filterFrom) return false
      if (filterTo && l.toDate > filterTo) return false
      return true
    })
  }, [leaves, filterType, filterFrom, filterTo])

  const summary = useMemo(() => ({
    total: leaves?.length || 0,
    approved: leaves?.filter((l: any) => l.status === "Approved").length || 0,
    disapproved: leaves?.filter((l: any) => l.status === "Disapproved").length || 0,
    pending: leaves?.filter((l: any) => l.status === "Pending").length || 0,
  }), [leaves])

  const handleAction = async (id: number, newStatus: string, remarks?: string) => {
    const payload: any = { status: newStatus }
    if (remarks !== undefined) payload.remarks = remarks
    await update(id, payload)
  }

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validateForm = () => {
    const errs: Record<string, string> = {}
    if (!form.personId) errs.personId = "Please select a person"
    if (!form.leaveType) errs.leaveType = "Please select leave type"
    if (!form.fromDate) errs.fromDate = "From date is required"
    if (!form.toDate) errs.toDate = "To date is required"
    if (!form.reason.trim()) errs.reason = "Reason is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleEdit = (leave: any) => {
    setEditId(leave.id)
    setEditStatus(leave.status || "")
    setEditName(leave.name || "")
    setEditRole(leave.role || "")
    setForm({
      personId: "",
      leaveType: leave.leaveType || "",
      fromDate: leave.fromDate || "",
      toDate: leave.toDate || "",
      reason: leave.reason || "",
      document: leave.document || "",
      remarks: leave.remarks || "",
    })
    setErrors({})
    setShowEditModal(true)
  }

  const handleUpdateLeave = async () => {
    if (!editId) return
    const errs: Record<string, string> = {}
    if (!form.leaveType) errs.leaveType = "Please select leave type"
    if (!form.fromDate) errs.fromDate = "From date is required"
    if (!form.toDate) errs.toDate = "To date is required"
    if (!form.reason.trim()) errs.reason = "Reason is required"
    setErrors(errs)
    if (Object.keys(errs).length !== 0) return
    const from = new Date(form.fromDate)
    const to = new Date(form.toDate)
    const days = Math.max(1, Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    await update(editId, {
      name: editName, role: editRole, leaveType: form.leaveType,
      fromDate: form.fromDate, toDate: form.toDate, days,
      reason: form.reason, document: form.document, remarks: form.remarks,
    })
    setShowEditModal(false)
    setEditId(null)
    setEditName("")
    setEditRole("")
    setForm({ personId: "", leaveType: "", fromDate: "", toDate: "", reason: "", document: "", remarks: "" })
    setErrors({})
  }

  const handleAddLeave = async () => {
    if (!validateForm()) return
    const person = people.find((p) => p.id === parseInt(form.personId))
    if (!person) return
    const from = new Date(form.fromDate)
    const to = new Date(form.toDate)
    const days = Math.max(1, Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    await add({
      name: person.name, role: person.role, leaveType: form.leaveType,
      fromDate: form.fromDate, toDate: form.toDate, days,
      reason: form.reason, status: "Pending",
      document: form.document, remarks: form.remarks,
    })
    setShowModal(false)
    setForm({ personId: "", leaveType: "", fromDate: "", toDate: "", reason: "", document: "", remarks: "" })
    setErrors({})
  }

  const Modal = ({ title, show, onClose, children }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-lg mx-4">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
          </div>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Approve Leave</h2>
          <p className="text-sm text-white/70 mt-0.5">Attendance / Approve Leave</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: summary.total, color: "text-gray-800" },
          { label: "Approved", value: summary.approved, color: "text-green-600" },
          { label: "Disapproved", value: summary.disapproved, color: "text-red-600" },
          { label: "Pending", value: summary.pending, color: "text-yellow-600" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--primary)]" /> Filter Leave Requests
          </h3>
          <button onClick={() => { setForm({ personId: "", leaveType: "", fromDate: "", toDate: "", reason: "", document: "", remarks: "" }); setErrors({}); setShowModal(true) }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
            <Plus className="h-4 w-4" /> Add Leave
          </button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Leave Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">All Types</option>
                {leaveTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Date From</label>
              <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Date To</label>
              <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={() => { setFilterType(""); setFilterFrom(""); setFilterTo("") }}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-700">Leave Requests</h3>
          <span className="text-xs text-gray-500">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Name", "Role", "Leave Type", "Leave From", "Leave To", "Days", "Reason", "Document", "Remarks", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-gray-300" />
                      <span className="text-sm">No leave requests found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((leave: any, idx: number) => (
                  <tr key={leave.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{leave.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${roleBadge[leave.role] || "bg-gray-100 text-gray-600"}`}>
                        {leave.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{leave.leaveType || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{leave.fromDate || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{leave.toDate || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">{leave.days}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="truncate text-gray-600" title={leave.reason}>{leave.reason || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      {leave.document ? (
                        <a href={leave.document} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline">
                          <FileText className="h-3.5 w-3.5" />
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      {leave.status === "Pending" ? (
                        <input type="text" value={leave.remarks || ""}
                          onChange={(e) => handleAction(leave.id, leave.status, e.target.value)}
                          placeholder="Add remarks..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--primary)] focus:border-transparent"
                        />
                      ) : (
                        <p className="text-xs text-gray-600 truncate" title={leave.remarks}>{leave.remarks || "—"}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColors[leave.status] || "bg-gray-100 text-gray-600"}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(leave)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        {leave.status === "Pending" && (
                          <>
                            <button onClick={() => handleAction(leave.id, "Approved")}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleAction(leave.id, "Disapproved")}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Disapprove">
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">Showing {filtered.length} of {leaves?.length || 0} records</span>
        </div>
      </div>

      <Modal title="Add Leave Request" show={showModal} onClose={() => { setShowModal(false); setErrors({}) }}>
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Name <span className="text-red-500">*</span></label>
            <select value={form.personId} onChange={(e) => handleInputChange("personId", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
              <option value="">Select Person</option>
              {people.map((p) => <option key={p.id} value={String(p.id)}>{p.name} ({p.role})</option>)}
            </select>
            {errors.personId && <p className="text-red-500 text-xs mt-0.5">{errors.personId}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Leave Type <span className="text-red-500">*</span></label>
            <select value={form.leaveType} onChange={(e) => handleInputChange("leaveType", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
              <option value="">Select Leave Type</option>
              {leaveTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.leaveType && <p className="text-red-500 text-xs mt-0.5">{errors.leaveType}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">From Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.fromDate} onChange={(e) => handleInputChange("fromDate", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.fromDate && <p className="text-red-500 text-xs mt-0.5">{errors.fromDate}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">To Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.toDate} onChange={(e) => handleInputChange("toDate", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.toDate && <p className="text-red-500 text-xs mt-0.5">{errors.toDate}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Reason <span className="text-red-500">*</span></label>
            <textarea value={form.reason} onChange={(e) => handleInputChange("reason", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              placeholder="Enter reason for leave" />
            {errors.reason && <p className="text-red-500 text-xs mt-0.5">{errors.reason}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Attach Document</label>
            <input type="file" onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleInputChange("document", file.name)
            }}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--primary)]/10 file:text-[var(--primary)] hover:file:bg-[var(--primary)]/20" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Remarks (optional)</label>
            <textarea value={form.remarks} onChange={(e) => handleInputChange("remarks", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              placeholder="Optional remarks" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => { setShowModal(false); setErrors({}) }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleAddLeave} className="px-5 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors">Submit</button>
        </div>
      </Modal>

      <Modal title="Edit Leave Request" show={showEditModal} onClose={() => { setShowEditModal(false); setEditId(null); setEditName(""); setEditRole(""); setErrors({}) }}>
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Name</label>
              <p className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700">{editName}</p>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Role</label>
              <p className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700">{editRole}</p>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Leave Type <span className="text-red-500">*</span></label>
            <select value={form.leaveType} onChange={(e) => handleInputChange("leaveType", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
              <option value="">Select Leave Type</option>
              {leaveTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.leaveType && <p className="text-red-500 text-xs mt-0.5">{errors.leaveType}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">From Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.fromDate} onChange={(e) => handleInputChange("fromDate", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.fromDate && <p className="text-red-500 text-xs mt-0.5">{errors.fromDate}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">To Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.toDate} onChange={(e) => handleInputChange("toDate", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.toDate && <p className="text-red-500 text-xs mt-0.5">{errors.toDate}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Reason <span className="text-red-500">*</span></label>
            <textarea value={form.reason} onChange={(e) => handleInputChange("reason", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              placeholder="Enter reason for leave" />
            {errors.reason && <p className="text-red-500 text-xs mt-0.5">{errors.reason}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Attach Document</label>
            <input type="file" onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleInputChange("document", file.name)
            }}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--primary)]/10 file:text-[var(--primary)] hover:file:bg-[var(--primary)]/20" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Remarks (optional)</label>
            <textarea value={form.remarks} onChange={(e) => handleInputChange("remarks", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              placeholder="Optional remarks" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {editStatus === "Pending" && (
              <>
                <button onClick={async () => { if (editId) { await handleAction(editId, "Approved"); setShowEditModal(false); setEditId(null); setEditName(""); setEditRole(""); setErrors({}) } }}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button onClick={async () => { if (editId) { await handleAction(editId, "Disapproved"); setShowEditModal(false); setEditId(null); setEditName(""); setEditRole(""); setErrors({}) } }}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                  <X className="h-4 w-4" /> Disapprove
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowEditModal(false); setEditId(null); setEditName(""); setEditRole(""); setErrors({}) }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleUpdateLeave} className="px-5 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors">Update</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
