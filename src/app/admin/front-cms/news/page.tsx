"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, X, Search } from "lucide-react"
import { useApi } from "@/lib/use-api"

type NewsRecord = {
  id: number
  title: string
  newsDate: string
  description: string
  status: "Published" | "Draft"
}



export default function NewsPage() {
  const { data: news, add, update, remove } = useApi<NewsRecord>("/api/front-cms/news")
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState("")

  const emptyForm = { title: "", newsDate: "", description: "", status: "Published" as "Published" | "Draft" }
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    if (!filterStatus) return news
    return news.filter((n) => n.status === filterStatus)
  }, [news, filterStatus])

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = "Title is required"
    if (!form.newsDate.trim()) errs.newsDate = "News date is required"
    if (!form.description.trim()) errs.description = "Description is required"
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
    const record = news.find((n) => n.id === id)
    if (!record) return
    setEditingId(id)
    setForm({ title: record.title, newsDate: record.newsDate, description: record.description, status: record.status })
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
        <h1 className="text-xl font-semibold text-white">News</h1>
        <p className="mt-1 text-sm text-white/80">Front CMS / News</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-2.5 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5"><Search className="h-3.5 w-3.5" /> Select Criteria</h3>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">All</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5"><Search className="h-3.5 w-3.5" /> Search</button>
              <button type="button" onClick={() => setFilterStatus("")} className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Reset</button>
            </div>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">News List</h3>
          <button onClick={openAddModal} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Add News</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">News Date</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Description</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400"><Search className="h-8 w-8 text-gray-300 mx-auto mb-2" /><span className="text-sm">No news found</span></td></tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-2.5 text-gray-600">{item.id}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{item.title}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{item.newsDate}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[250px] truncate">{item.description}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.status === "Published" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{item.status}</span>
                    </td>
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
          <span>Showing {filtered.length} of {news.length} records</span>
        </div>
      </div>

      <Modal title={editingId !== null ? "Edit News" : "Add News"} show={showModal} onClose={() => { setShowModal(false); setEditingId(null) }}
        footer={<>
          <button onClick={() => { setShowModal(false); setEditingId(null) }} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">Save</button>
        </>}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title <span className="text-red-400">*</span></label>
            <input type="text" value={form.title} onChange={(e) => handleInputChange("title", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter news title" />
            {errors.title && <p className="text-red-400 text-xs mt-0.5">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">News Date <span className="text-red-400">*</span></label>
            <input type="text" value={form.newsDate} onChange={(e) => handleInputChange("newsDate", e.target.value)} placeholder="MM/DD/YYYY" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
            {errors.newsDate && <p className="text-red-400 text-xs mt-0.5">{errors.newsDate}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description <span className="text-red-400">*</span></label>
            <textarea value={form.description} onChange={(e) => handleInputChange("description", e.target.value)} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter news description" />
            {errors.description && <p className="text-red-400 text-xs mt-0.5">{errors.description}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-sm text-gray-600">
                <input type="radio" name="status" checked={form.status === "Published"} onChange={() => handleInputChange("status", "Published")} className="text-[var(--primary)] focus:ring-[var(--primary)]" />
                Published
              </label>
              <label className="flex items-center gap-1.5 text-sm text-gray-600">
                <input type="radio" name="status" checked={form.status === "Draft"} onChange={() => handleInputChange("status", "Draft")} className="text-[var(--primary)] focus:ring-[var(--primary)]" />
                Draft
              </label>
            </div>
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
          <p className="text-sm text-gray-600">Are you sure you want to delete this news item?</p>
          {deleteId && <p className="text-sm font-semibold text-gray-800 mt-1">{news.find((n) => n.id === deleteId)?.title}</p>}
        </div>
      </Modal>
    </div>
  )
}
