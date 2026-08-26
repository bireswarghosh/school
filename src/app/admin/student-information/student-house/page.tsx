"use client"
import { toast as notify } from "@/lib/toast"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save } from "lucide-react"
import { useApi } from "@/lib/use-api"

type House = {
  id: number
  name: string
  description: string
}

export default function StudentHousePage() {
  const { data: houses, add, update, remove, loading } = useApi<House>("/api/student-information/student-house")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [editing, setEditing] = useState<House | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<House | null>(null)
  const [nameError, setNameError] = useState("")

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError("House name is required")
      return
    }
    try {
      await add({ name: name.trim(), description })
      setName("")
      setDescription("")
      setNameError("")
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const openEdit = (house: House) => {
    setEditing(house)
    setEditName(house.name)
    setEditDescription(house.description)
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editName.trim() || !editing) return
    try {
      await update(editing.id, { name: editName.trim(), description: editDescription })
      setShowEditModal(false)
      setEditing(null)
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const openDelete = (house: House) => {
    setDeleteTarget(house)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await remove(deleteTarget.id)
      setShowDeleteModal(false)
      setDeleteTarget(null)
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const ModalOverlay = () => <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl px-6 py-4 shadow-sm">
        <h2 className="text-lg font-bold text-white">Student House</h2>
        <p className="text-xs text-[var(--primary)]/80 mt-0.5">Student Information / Student House</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Add School House Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Add School House</h3>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError("") }}
                placeholder="Enter house name"
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
              {nameError && <p className="text-red-400 text-xs mt-0.5">{nameError}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              />
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-4 py-2 rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Save
            </button>
          </div>
        </div>

        {/* House Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">School House List</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Description</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">House ID</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {houses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-400 text-sm">No houses found</td>
                  </tr>
                ) : (
                  houses.map((house, idx) => (
                    <tr
                      key={house.id}
                      className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                    >
                      <td className="px-4 py-2.5 font-medium text-gray-800">{house.name}</td>
                      <td className="px-4 py-2.5 text-gray-500">{house.description || <span className="text-gray-300">-</span>}</td>
                      <td className="px-4 py-2.5 text-gray-600">{house.id}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <button onClick={() => openEdit(house)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openDelete(house)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
            <span>Showing {houses.length} records</span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowEditModal(false)}><ModalOverlay /></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Edit School House</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter house name"
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleUpdate} className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowDeleteModal(false)}><ModalOverlay /></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-sm text-gray-600">Are you sure you want to delete this house?</p>
              {deleteTarget && <p className="text-sm font-semibold text-gray-800 mt-1">{deleteTarget.name}</p>}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-200">
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
