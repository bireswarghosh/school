"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save } from "lucide-react"
import { useApi } from "@/lib/use-api"

type ExpenseHead = {
  id: number
  name: string
  description: string
}

export default function ExpenseHeadPage() {
  const { data: heads, add, update, remove } = useApi<ExpenseHead>("/api/expenses/head")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Expense head is required"
    else if (heads?.some((h) => h.name.toLowerCase() === name.trim().toLowerCase())) errs.name = "Expense head already exists"
    setErrors(errs)
    if (Object.keys(errs).length) return
    await add({ name: name.trim(), description: description.trim() })
    setName("")
    setDescription("")
  }

  const handleEditOpen = (head: ExpenseHead) => {
    setEditId(head.id)
    setEditName(head.name)
    setEditDescription(head.description)
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs: Record<string, string> = {}
    if (!editName.trim()) errs.name = "Expense head is required"
    else if (heads?.some((h) => h.name.toLowerCase() === editName.trim().toLowerCase() && h.id !== editId)) errs.name = "Expense head already exists"
    setEditErrors(errs)
    if (Object.keys(errs).length) return
    await update(editId!, { name: editName.trim(), description: editDescription.trim() })
    setShowEditModal(false)
    setEditId(null)
    setEditName("")
    setEditDescription("")
  }

  const handleDeleteOpen = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Expense Head</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">Expenses / Expense Head</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Add Expense Head</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Head <span className="text-red-500">*</span></label>
                <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({}) }}
                  placeholder="Enter expense head" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter description" rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
              </div>
              <button onClick={handleAdd} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
                <Plus className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Expense Head List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Expense Head</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Description</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(heads || []).length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">No expense heads found</td></tr>
                  ) : (
                    (heads || []).map((head, idx) => (
                      <tr key={head.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{head.name}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[250px] truncate">{head.description || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEditOpen(head)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteOpen(head.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
              <span>Showing {(heads || []).length} records</span>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Edit Expense Head</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Head <span className="text-red-500">*</span></label>
                <input type="text" value={editName} onChange={(e) => { setEditName(e.target.value); if (editErrors.name) setEditErrors({}) }}
                  placeholder="Enter expense head" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                {editErrors.name && <p className="text-red-500 text-xs mt-1">{editErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Enter description" rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"><X className="h-4 w-4" /> Cancel</button>
              <button onClick={handleEditSave} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Save</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">Are you sure you want to delete this expense head?
                {deleteId && <strong className="block mt-1 text-gray-800">{(heads || []).find((h) => h.id === deleteId)?.name}</strong>}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"><X className="h-4 w-4" /> Cancel</button>
              <button onClick={confirmDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
