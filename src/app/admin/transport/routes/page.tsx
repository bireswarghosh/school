"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save, Bus } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Route = {
  id: number
  title: string
  code: string
}

export default function RoutesPage() {
  const { data, add, update, remove, loading } = useApi<Route>("/api/transport/route")
  const [title, setTitle] = useState("")
  const [code, setCode] = useState("")
  const [editId, setEditId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editCode, setEditCode] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = "Route title is required"
    if (!code.trim()) errs.code = "Route code is required"
    setErrors(errs)
    if (Object.keys(errs).length) return

    await add({ title: title.trim(), code: code.trim() })
    setTitle(""); setCode("")
  }

  const handleEditOpen = (item: Route) => {
    setEditId(item.id)
    setEditTitle(item.title)
    setEditCode(item.code)
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs: Record<string, string> = {}
    if (!editTitle.trim()) errs.title = "Route title is required"
    if (!editCode.trim()) errs.code = "Route code is required"
    setEditErrors(errs)
    if (Object.keys(errs).length) return

    await update(editId!, { title: editTitle.trim(), code: editCode.trim() })
    setShowEditModal(false)
    setEditId(null)
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
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Routes</h1>
        <p className="mt-1 text-sm text-white/80">Transport / Routes</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Add Route</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route Title <span className="text-red-500">*</span></label>
                <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors({}) }} placeholder="Enter route title" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route Code <span className="text-red-500">*</span></label>
                <input type="text" value={code} onChange={(e) => { setCode(e.target.value); if (errors.code) setErrors({}) }} placeholder="RT-001" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
              </div>
              <button onClick={handleAdd} className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                <Plus className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Route List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">No routes found</td></tr>
                  ) : (
                    data.map((item, idx) => (
                      <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800"><Bus className="h-3.5 w-3.5 inline mr-1 text-[var(--primary)]" />{item.title}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{item.code}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEditOpen(item)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteOpen(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
              <span>Showing {data.length} records</span>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Edit Route</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route Title <span className="text-red-500">*</span></label>
                <input type="text" value={editTitle} onChange={(e) => { setEditTitle(e.target.value); if (editErrors.title) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.title && <p className="text-red-500 text-xs mt-1">{editErrors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route Code <span className="text-red-500">*</span></label>
                <input type="text" value={editCode} onChange={(e) => { setEditCode(e.target.value); if (editErrors.code) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.code && <p className="text-red-500 text-xs mt-1">{editErrors.code}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowEditModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><X className="h-4 w-4 inline mr-1" />Cancel</button>
              <button onClick={handleEditSave} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"><Save className="h-4 w-4 inline mr-1" />Save</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this route?
              {deleteId && <strong className="block mt-1 text-gray-800">{data.find((d) => d.id === deleteId)?.title}</strong>}
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowDeleteModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><X className="h-4 w-4 inline mr-1" />Cancel</button>
              <button onClick={confirmDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"><Trash2 className="h-4 w-4 inline mr-1" />Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
