"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, X, Search, Image } from "lucide-react"
import { useApi } from "@/lib/use-api"

type GalleryRecord = {
  id: number
  title: string
  description: string
  imageUrl: string
  date: string
}



export default function GalleryPage() {
  const { data: gallery, add, update, remove } = useApi<GalleryRecord>("/api/front-cms/gallery")
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const emptyForm = { title: "", description: "", imageUrl: "", date: "" }
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = "Title is required"
    if (!form.imageUrl.trim()) errs.imageUrl = "Image URL is required"
    if (!form.date.trim()) errs.date = "Date is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openAddModal = () => {
    setForm(emptyForm)
    setErrors({})
    setEditingId(null)
    setShowModal(true)
  }

  const openEditModal = (id: number) => {
    const record = gallery.find((g) => g.id === id)
    if (!record) return
    setEditingId(id)
    setForm({ title: record.title, description: record.description, imageUrl: record.imageUrl, date: record.date })
    setErrors({})
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!validate()) return
    if (editingId !== null) {
      await update(editingId, form)
    } else {
      await add(form)
    }
    setShowModal(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = (id: number) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  const Modal = ({ title, show, onClose, children, footer }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-5">{children}</div>
          {footer && <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-xl">{footer}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Gallery</h1>
        <p className="mt-1 text-sm text-white/80">Front CMS / Gallery</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Gallery List</h3>
          <button onClick={openAddModal} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Image</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Description</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Image URL</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {gallery.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400"><Search className="h-8 w-8 text-gray-300 mx-auto mb-2" /><span className="text-sm">No gallery items found</span></td></tr>
              ) : (
                gallery.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-2.5 text-gray-600">{item.id}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{item.title}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[200px] truncate">{item.description}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs max-w-[150px] truncate">{item.imageUrl}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{item.date}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => openEditModal(item.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
          <span>Showing {gallery.length} of {gallery.length} records</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gallery.map((item) => (
          <div key={item.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Image className="h-10 w-10 text-gray-400" />
            </div>
            <div className="p-3">
              <h4 className="text-sm font-semibold text-gray-800 truncate">{item.title}</h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
              <p className="text-xs text-gray-400 mt-2">{item.date}</p>
            </div>
          </div>
        ))}
      </div>

      <Modal title={editingId !== null ? "Edit Image" : "Add Image"} show={showModal} onClose={() => { setShowModal(false); setEditingId(null) }}
        footer={<>
          <button onClick={() => { setShowModal(false); setEditingId(null) }} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">Save</button>
        </>}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title <span className="text-red-400">*</span></label>
            <input type="text" value={form.title} onChange={(e) => handleInputChange("title", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter image title" />
            {errors.title && <p className="text-red-400 text-xs mt-0.5">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => handleInputChange("description", e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter description" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Image URL <span className="text-red-400">*</span></label>
            <input type="text" value={form.imageUrl} onChange={(e) => handleInputChange("imageUrl", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter image URL" />
            {errors.imageUrl && <p className="text-red-400 text-xs mt-0.5">{errors.imageUrl}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date <span className="text-red-400">*</span></label>
            <input type="text" value={form.date} onChange={(e) => handleInputChange("date", e.target.value)} placeholder="MM/DD/YYYY" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
            {errors.date && <p className="text-red-400 text-xs mt-0.5">{errors.date}</p>}
          </div>
        </div>
      </Modal>

      <Modal title="Confirm Delete" show={showDeleteModal} onClose={() => setShowDeleteModal(false)}
        footer={<>
          <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={confirmDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90">Delete</button>
        </>}>
        <div className="text-center py-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3"><Trash2 className="h-6 w-6 text-red-500" /></div>
          <p className="text-sm text-gray-600">Are you sure you want to delete this gallery item?</p>
          {deleteId && <p className="text-sm font-semibold text-gray-800 mt-1">{gallery.find((g) => g.id === deleteId)?.title}</p>}
        </div>
      </Modal>
    </div>
  )
}
