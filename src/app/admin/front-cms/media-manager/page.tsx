"use client"

import { useState, useMemo } from "react"
import { Plus, Trash2, X, Search } from "lucide-react"
import { useApi } from "@/lib/use-api"

type MediaRecord = {
  id: number
  fileName: string
  type: "Image" | "Video" | "Document"
  url: string
  uploadDate: string
  size: number
}



const typeOptions = ["Image", "Video", "Document"]

export default function MediaManagerPage() {
  const { data: media, add, remove } = useApi<MediaRecord>("/api/front-cms/media")
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const emptyForm = { fileName: "", type: "Image" as "Image" | "Video" | "Document", url: "", size: 0 }
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.fileName.trim()) errs.fileName = "File name is required"
    if (!form.url.trim()) errs.url = "URL is required"
    if (!form.size || form.size <= 0) errs.size = "Size must be greater than 0"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openAddModal = () => {
    setForm(emptyForm)
    setErrors({})
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!validate()) return
    await add({ ...form, uploadDate: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) })
    setShowModal(false)
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

  const todayStr = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })

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
        <h1 className="text-xl font-semibold text-white">Media Manager</h1>
        <p className="mt-1 text-sm text-white/80">Front CMS / Media Manager</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Media List</h3>
          <button onClick={openAddModal} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Upload Media</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">File Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">URL / Path</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Upload Date</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Size (KB)</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {media.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400"><Search className="h-8 w-8 text-gray-300 mx-auto mb-2" /><span className="text-sm">No media found</span></td></tr>
              ) : (
                media.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-2.5 text-gray-600">{item.id}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{item.fileName}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.type === "Image" ? "bg-blue-50 text-blue-700" : item.type === "Video" ? "bg-purple-50 text-purple-700" : "bg-orange-50 text-orange-700"}`}>{item.type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[200px] truncate">{item.url}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{item.uploadDate}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600 font-mono text-xs">{item.size.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-0.5">
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
          <span>Showing {media.length} of {media.length} records</span>
        </div>
      </div>

      <Modal title="Upload Media" show={showModal} onClose={() => { setShowModal(false) }}
        footer={<>
          <button onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">Upload</button>
        </>}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">File Name <span className="text-red-400">*</span></label>
            <input type="text" value={form.fileName} onChange={(e) => handleInputChange("fileName", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter file name with extension" />
            {errors.fileName && <p className="text-red-400 text-xs mt-0.5">{errors.fileName}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type <span className="text-red-400">*</span></label>
            <select value={form.type} onChange={(e) => handleInputChange("type", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              {typeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">URL <span className="text-red-400">*</span></label>
            <input type="text" value={form.url} onChange={(e) => handleInputChange("url", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter file URL or path" />
            {errors.url && <p className="text-red-400 text-xs mt-0.5">{errors.url}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Size (KB) <span className="text-red-400">*</span></label>
            <input type="number" min={1} value={form.size || ""} onChange={(e) => handleInputChange("size", parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter file size in KB" />
            {errors.size && <p className="text-red-400 text-xs mt-0.5">{errors.size}</p>}
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
          <p className="text-sm text-gray-600">Are you sure you want to delete this media file?</p>
          {deleteId && <p className="text-sm font-semibold text-gray-800 mt-1">{media.find((m) => m.id === deleteId)?.fileName}</p>}
        </div>
      </Modal>
    </div>
  )
}
