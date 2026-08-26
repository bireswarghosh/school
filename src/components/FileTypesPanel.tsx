"use client"

import { useState } from "react"
import { Pencil, Trash2, X, Save, Check, ToggleLeft, ToggleRight } from "lucide-react"
import { useApi } from "@/lib/use-api"

type FileType = {
  id: number
  extension: string
  type: string
  maxSize: number
  isAllowed: boolean
}

const fileTypeOptions = ["Document", "Image", "Spreadsheet", "Other"]

export default function FileTypesPanel() {
  const { data: fileTypes, add, update, remove, loading } = useApi<FileType>("/api/system-setting/file-type")
  const [form, setForm] = useState({ extension: "", type: "Document", maxSize: 10, isAllowed: true })
  const [editing, setEditing] = useState<FileType | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [success, setSuccess] = useState("")

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3000)
  }

  const handleAdd = async () => {
    if (!form.extension.trim()) return
    const ext = form.extension.trim().startsWith(".") ? form.extension.trim() : `.${form.extension.trim()}`
    await add({ extension: ext.toLowerCase(), type: form.type, maxSize: form.maxSize, isAllowed: form.isAllowed })
    setForm({ extension: "", type: "Document", maxSize: 10, isAllowed: true })
    showSuccess("File type added successfully!")
  }

  const handleEditOpen = (ft: FileType) => {
    setEditing(ft)
    setForm({ extension: ft.extension, type: ft.type, maxSize: ft.maxSize, isAllowed: ft.isAllowed })
    setShowModal(true)
  }

  const handleEditSave = async () => {
    if (!editing || !form.extension.trim()) return
    const ext = form.extension.trim().startsWith(".") ? form.extension.trim() : `.${form.extension.trim()}`
    await update(editing.id, { extension: ext.toLowerCase(), type: form.type, maxSize: form.maxSize, isAllowed: form.isAllowed })
    setShowModal(false)
    setEditing(null)
    showSuccess("File type updated successfully!")
  }

  const handleDeleteOpen = (id: number) => {
    setDeleteId(id)
    setShowDelete(true)
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDelete(false)
    setDeleteId(null)
    showSuccess("File type deleted successfully!")
  }

  const toggleAllowed = async (id: number) => {
    const ft = fileTypes.find((f) => f.id === id)
    if (!ft) return
    await update(id, { isAllowed: !ft.isAllowed })
    showSuccess(`${ft.extension} ${ft.isAllowed ? "restricted" : "allowed"} successfully!`)
  }

  const getFileType = (id: number) => fileTypes.find((f) => f.id === id)

  const clearForm = () => {
    setForm({ extension: "", type: "Document", maxSize: 10, isAllowed: true })
    setEditing(null)
  }

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
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Add File Type</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Extension</label>
                <input
                  type="text"
                  value={form.extension}
                  onChange={(e) => setForm({ ...form, extension: e.target.value })}
                  placeholder="e.g. .pdf"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {fileTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Size (MB)</label>
                <input
                  type="number"
                  value={form.maxSize}
                  onChange={(e) => setForm({ ...form, maxSize: Number(e.target.value) })}
                  min={1}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAllowed}
                  onChange={(e) => setForm({ ...form, isAllowed: e.target.checked })}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-gray-700">Is Allowed</span>
              </label>
              <button
                onClick={handleAdd}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                <Save className="h-4 w-4" /> Save
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
                    {["#", "Extension", "Type", "Max Size", "Status", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fileTypes.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No file types found</td></tr>
                  ) : (
                    fileTypes.map((ft, idx) => (
                      <tr key={ft.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono font-medium text-gray-800">{ft.extension}</td>
                        <td className="px-4 py-3 text-gray-600">{ft.type}</td>
                        <td className="px-4 py-3 text-gray-600">{ft.maxSize} MB</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ft.isAllowed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {ft.isAllowed ? "Allowed" : "Restricted"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => toggleAllowed(ft.id)} className={`p-1.5 rounded-lg transition-colors ${ft.isAllowed ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`} title="Toggle">
                              {ft.isAllowed ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                            </button>
                            <button onClick={() => handleEditOpen(ft)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteOpen(ft.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
              Showing {fileTypes.length} records
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Edit File Type</h3>
              <button onClick={() => { setShowModal(false); clearForm() }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Extension</label>
                <input
                  type="text"
                  value={form.extension}
                  onChange={(e) => setForm({ ...form, extension: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {fileTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Size (MB)</label>
                <input
                  type="number"
                  value={form.maxSize}
                  onChange={(e) => setForm({ ...form, maxSize: Number(e.target.value) })}
                  min={1}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAllowed}
                  onChange={(e) => setForm({ ...form, isAllowed: e.target.checked })}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-gray-700">Is Allowed</span>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setShowModal(false); clearForm() }}
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

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => { setShowDelete(false); setDeleteId(null) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this file type?
              {deleteId && <strong className="block mt-1 text-gray-800">{getFileType(deleteId)?.extension}</strong>}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setShowDelete(false); setDeleteId(null) }}
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