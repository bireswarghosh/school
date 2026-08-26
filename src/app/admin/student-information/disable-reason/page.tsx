"use client"
import { toast as notify } from "@/lib/toast"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save } from "lucide-react"
import { useApi } from "@/lib/use-api"

type DisableReason = {
  id: number
  name: string
}

export default function DisableReasonPage() {
  const { data: reasons, add, update, remove, loading } = useApi<DisableReason>("/api/student-information/disable-reason")
  const [newReason, setNewReason] = useState("")
  const [editReason, setEditReason] = useState<DisableReason | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [error, setError] = useState("")

  const ModalOverlay = ({ onClose }: { onClose: () => void }) => (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
  )

  const handleAdd = async () => {
    if (!newReason.trim()) { setError("Please enter a reason"); return }
    if (reasons.some((r) => r.name.toLowerCase() === newReason.trim().toLowerCase())) {
      setError("This reason already exists"); return
    }
    try {
      await add({ name: newReason.trim() })
      setNewReason(""); setError("")
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const handleEdit = async () => {
    if (!editReason || !editReason.name.trim()) { setError("Please enter a reason"); return }
    if (reasons.some((r) => r.name.toLowerCase() === editReason.name.trim().toLowerCase() && r.id !== editReason.id)) {
      setError("This reason already exists"); return
    }
    try {
      await update(editReason.id, { name: editReason.name.trim() })
      setShowEditModal(false); setEditReason(null); setError("")
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    try {
      await remove(deleteId)
      setShowDeleteModal(false); setDeleteId(null)
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Disable Reason</h2>
          <p className="text-xs text-gray-500 mt-0.5">Student Information / Disable Reason</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-t-xl px-5 py-3">
            <h3 className="text-sm font-semibold text-white">Add Disable Reason</h3>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => { setNewReason(e.target.value); setError("") }}
                placeholder="Enter disable reason"
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
              />
              {error && <p className="text-red-400 text-xs mt-0.5">{error}</p>}
            </div>
            <button onClick={handleAdd} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
              <Plus className="h-4 w-4" /> Save
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-3">
            <h3 className="text-sm font-semibold text-white">Disable Reason List</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100/80">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reasons.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-2.5 text-gray-800">{r.name}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{r.id}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => { setEditReason(r); setShowEditModal(true); setError("") }}
                        className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeleteId(r.id); setShowDeleteModal(true) }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <ModalOverlay onClose={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Edit Disable Reason</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reason <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={editReason.name}
                  onChange={(e) => setEditReason({ ...editReason, name: e.target.value })}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleEdit} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <ModalOverlay onClose={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10 p-5 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Delete Disable Reason</h3>
            <p className="text-sm text-gray-500 mb-5">Are you sure you want to delete this reason?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
