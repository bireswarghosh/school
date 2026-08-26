"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save, Check } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Session = {
  id: number
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export default function SessionSettingsPanel() {
  const { data: sessions, add, update, remove, loading } = useApi<Session>("/api/system-setting/session")
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", isActive: false })
  const [editing, setEditing] = useState<Session | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [success, setSuccess] = useState("")

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3000)
  }

  const handleAdd = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) return
    await add({ name: form.name.trim(), startDate: form.startDate, endDate: form.endDate, isActive: form.isActive })
    setForm({ name: "", startDate: "", endDate: "", isActive: false })
    showSuccess("Session added successfully!")
  }

  const handleEditOpen = (s: Session) => {
    setEditing(s)
    setForm({ name: s.name, startDate: s.startDate, endDate: s.endDate, isActive: s.isActive })
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    if (!editing || !form.name.trim() || !form.startDate || !form.endDate) return
    await update(editing.id, { name: form.name.trim(), startDate: form.startDate, endDate: form.endDate, isActive: form.isActive })
    setShowEditModal(false)
    setEditing(null)
    showSuccess("Session updated successfully!")
  }

  const handleDeleteOpen = (id: number) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
    showSuccess("Session deleted successfully!")
  }

  const setActive = async (id: number) => {
    await update(id, { isActive: true })
    showSuccess("Session set as active!")
  }

  const getSession = (id: number) => sessions.find((s) => s.id === id)

  const clearForm = () => setForm({ name: "", startDate: "", endDate: "", isActive: false })

  return (
    <>
      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Add Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. 2026-27"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-gray-700">Is Active</span>
              </label>
              <button
                onClick={handleAdd}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {["#", "Session", "Start Date", "End Date", "Status", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No sessions found</td></tr>
                  ) : (
                    sessions.map((s, idx) => (
                      <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                        <td className="px-4 py-3 text-gray-600">{s.startDate}</td>
                        <td className="px-4 py-3 text-gray-600">{s.endDate}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {s.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEditOpen(s)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteOpen(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                            {!s.isActive && (
                              <button onClick={() => setActive(s.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium" title="Set Active">
                                Set Active
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
              Showing {sessions.length} records
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Edit Session</h3>
              <button onClick={() => { setShowEditModal(false); setEditing(null); clearForm() }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-gray-700">Is Active</span>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setShowEditModal(false); setEditing(null); clearForm() }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
                <X className="h-4 w-4" /> Cancel
              </button>
              <button onClick={handleEditSave}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5">
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => { setShowDeleteModal(false); setDeleteId(null) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this session?
              {deleteId && <strong className="block mt-1 text-gray-800">{getSession(deleteId)?.name}</strong>}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setShowDeleteModal(false); setDeleteId(null) }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
                <X className="h-4 w-4" /> Cancel
              </button>
              <button onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 flex items-center gap-1.5">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}