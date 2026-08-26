"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save, Check } from "lucide-react"
import { useApi } from "@/lib/use-api"

type HolidayType = {
  id: number
  name: string
  active: boolean
}

export default function HolidayTypePage() {
  const { data: holidayTypes, add, update, remove } = useApi<HolidayType>("/api/annual-calendar/holiday-type")
  const [typeName, setTypeName] = useState("")
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!typeName.trim()) {
      errs.name = "Type name is required"
    } else if (holidayTypes.some((h) => h.name.toLowerCase() === typeName.trim().toLowerCase())) {
      errs.name = "Holiday type already exists"
    }
    setErrors(errs)
    if (Object.keys(errs).length) return

    await add({ name: typeName.trim(), active: true })
    setTypeName("")
  }

  const handleEditOpen = (ht: HolidayType) => {
    setEditId(ht.id)
    setEditName(ht.name)
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs: Record<string, string> = {}
    if (!editName.trim()) {
      errs.name = "Type name is required"
    } else if (holidayTypes.some((h) => h.name.toLowerCase() === editName.trim().toLowerCase() && h.id !== editId)) {
      errs.name = "Holiday type already exists"
    }
    setEditErrors(errs)
    if (Object.keys(errs).length) return

    await update(editId!, { name: editName.trim() })
    setShowEditModal(false)
    setEditId(null)
    setEditName("")
  }

  const handleDeleteOpen = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }
  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  const toggleActive = async (id: number) => {
    const h = holidayTypes.find((x) => x.id === id)
    if (h) await update(id, { active: !h.active })
  }

  const getHolidayType = (id: number) => holidayTypes.find((h) => h.id === id)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Holiday Type</h2>
          <p className="text-sm text-white/80 mt-0.5">Calendar / Annual Calendar / Holiday Type</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Add Holiday Type</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Type Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={typeName}
                  onChange={(e) => { setTypeName(e.target.value); if (errors.name) setErrors({}) }}
                  placeholder="e.g. National Holiday, Festival Holiday"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <button onClick={handleAdd}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
                <Plus className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Holiday Type List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Type Name", "Status", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holidayTypes.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">No holiday types found</td></tr>
                  ) : (
                    holidayTypes.map((ht, idx) => (
                      <tr key={ht.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{ht.name}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(ht.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              ht.active
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {ht.active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {ht.active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEditOpen(ht)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteOpen(ht.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
              <span>Showing {holidayTypes.length} records</span>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Edit Holiday Type</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-1">
              <label className="block text-xs font-medium text-gray-600">Type Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={editName}
                onChange={(e) => { setEditName(e.target.value); if (editErrors.name) setEditErrors({}) }}
                placeholder="Enter holiday type name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
              {editErrors.name && <p className="text-red-500 text-xs mt-1">{editErrors.name}</p>}
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <X className="h-4 w-4" /> Cancel
              </button>
              <button onClick={handleEditSave}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
                <Save className="h-4 w-4" /> Save
              </button>
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
              <p className="text-sm text-gray-600">Are you sure you want to delete this holiday type?
                {deleteId && <strong className="block mt-1 text-gray-800">{getHolidayType(deleteId)?.name}</strong>}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <X className="h-4 w-4" /> Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
