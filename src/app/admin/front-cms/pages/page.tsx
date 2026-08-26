"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, X, Search, Eye } from "lucide-react"
import { useApi } from "@/lib/use-api"

type PageRecord = {
  id: number
  pageTitle: string
  urlSlug: string
  content: string
  metaTitle: string
  metaDescription: string
  status: "Published" | "Draft"
}



export default function PagesPage() {
  const { data: pages, add, update, remove } = useApi<PageRecord>("/api/front-cms/page")
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewId, setViewId] = useState<number | null>(null)

  const emptyForm = { pageTitle: "", urlSlug: "", content: "", metaTitle: "", metaDescription: "", status: "Published" as "Published" | "Draft" }
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === "pageTitle" && editingId === null) {
        updated.urlSlug = value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      }
      return updated
    })
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.pageTitle.trim()) errs.pageTitle = "Page title is required"
    if (!form.urlSlug.trim()) errs.urlSlug = "URL slug is required"
    if (!form.content.trim()) errs.content = "Content is required"
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
    const record = pages.find((p) => p.id === id)
    if (!record) return
    setEditingId(id)
    setForm({ pageTitle: record.pageTitle, urlSlug: record.urlSlug, content: record.content, metaTitle: record.metaTitle, metaDescription: record.metaDescription, status: record.status })
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
        <h1 className="text-xl font-semibold text-white">Pages</h1>
        <p className="mt-1 text-sm text-white/80">Front CMS / Pages</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Pages List</h3>
          <button onClick={openAddModal} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Page</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Page Title</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">URL Slug</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Content</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {pages.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400"><Search className="h-8 w-8 text-gray-300 mx-auto mb-2" /><span className="text-sm">No pages found</span></td></tr>
              ) : (
                pages.map((page, idx) => (
                  <tr key={page.id} className={`border-b border-gray-50 hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-2.5 text-gray-600">{page.id}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{page.pageTitle}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">{page.urlSlug}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[250px] truncate">{page.content}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${page.status === "Published" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{page.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => { setViewId(page.id); setShowViewModal(true) }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye className="h-3.5 w-3.5" /></button>
                        <button onClick={() => openEditModal(page.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(page.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
          <span>Showing {pages.length} of {pages.length} records</span>
        </div>
      </div>

      <Modal title={editingId !== null ? "Edit Page" : "Add Page"} show={showModal} onClose={() => { setShowModal(false); setEditingId(null) }}
        footer={<>
          <button onClick={() => { setShowModal(false); setEditingId(null) }} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">Save</button>
        </>}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Page Title <span className="text-red-400">*</span></label>
              <input type="text" value={form.pageTitle} onChange={(e) => handleInputChange("pageTitle", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter page title" />
              {errors.pageTitle && <p className="text-red-400 text-xs mt-0.5">{errors.pageTitle}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">URL Slug <span className="text-red-400">*</span></label>
              <input type="text" value={form.urlSlug} onChange={(e) => handleInputChange("urlSlug", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="auto-generated" />
              {errors.urlSlug && <p className="text-red-400 text-xs mt-0.5">{errors.urlSlug}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Content <span className="text-red-400">*</span></label>
            <textarea value={form.content} onChange={(e) => handleInputChange("content", e.target.value)} rows={5} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter page content" />
            {errors.content && <p className="text-red-400 text-xs mt-0.5">{errors.content}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Meta Title</label>
              <input type="text" value={form.metaTitle} onChange={(e) => handleInputChange("metaTitle", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter meta title" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Meta Description</label>
              <input type="text" value={form.metaDescription} onChange={(e) => handleInputChange("metaDescription", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter meta description" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-sm text-gray-600">
                <input type="radio" name="pageStatus" checked={form.status === "Published"} onChange={() => handleInputChange("status", "Published")} className="text-[var(--primary)] focus:ring-[var(--primary)]" />
                Published
              </label>
              <label className="flex items-center gap-1.5 text-sm text-gray-600">
                <input type="radio" name="pageStatus" checked={form.status === "Draft"} onChange={() => handleInputChange("status", "Draft")} className="text-[var(--primary)] focus:ring-[var(--primary)]" />
                Draft
              </label>
            </div>
          </div>
        </div>
      </Modal>

      <Modal title="Page Details" show={showViewModal} onClose={() => setShowViewModal(false)}
        footer={<button onClick={() => setShowViewModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>}>
        {viewId && (() => {
          const page = pages.find((p) => p.id === viewId)
          if (!page) return null
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { label: "Page Title", value: page.pageTitle },
                  { label: "URL Slug", value: page.urlSlug },
                  { label: "Status", value: page.status },
                  { label: "Meta Title", value: page.metaTitle || "-" },
                  { label: "Meta Description", value: page.metaDescription || "-" },
                ].map((item) => (
                  <div key={item.label} className="border-b border-gray-50 pb-2">
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{item.label}</span>
                    <p className="text-sm text-gray-800 mt-0.5 font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3">
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Content</span>
                <p className="text-sm text-gray-800 mt-1 bg-gray-50 rounded-lg p-3">{page.content}</p>
              </div>
            </div>
          )
        })()}
      </Modal>

      <Modal title="Confirm Delete" show={showDeleteModal} onClose={() => setShowDeleteModal(false)}
        footer={<>
          <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={confirmDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90">Delete</button>
        </>}>
        <div className="text-center py-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3"><Trash2 className="h-6 w-6 text-red-500" /></div>
          <p className="text-sm text-gray-600">Are you sure you want to delete this page?</p>
          {deleteId && <p className="text-sm font-semibold text-gray-800 mt-1">{pages.find((p) => p.id === deleteId)?.pageTitle}</p>}
        </div>
      </Modal>
    </div>
  )
}
