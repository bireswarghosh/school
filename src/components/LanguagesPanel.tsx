"use client"

import { useState } from "react"
import { Pencil, Trash2, X, Save, Check, Star } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Language = {
  id: number
  name: string
  code: string
  isRtl: boolean
  status: boolean
  isDefault: boolean
}

export default function LanguagesPanel() {
  const { data: languages, add, update, remove, loading } = useApi<Language>("/api/system-setting/language")
  const [form, setForm] = useState({ name: "", code: "", isRtl: false, status: true })
  const [editing, setEditing] = useState<Language | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [success, setSuccess] = useState("")

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3000)
  }

  const handleAdd = async () => {
    if (!form.name.trim() || !form.code.trim()) return
    await add({ name: form.name.trim(), code: form.code.trim().toLowerCase(), isRtl: form.isRtl, status: form.status, isDefault: false })
    setForm({ name: "", code: "", isRtl: false, status: true })
    showSuccess("Language added successfully!")
  }

  const handleEditOpen = (lang: Language) => {
    setEditing(lang)
    setForm({ name: lang.name, code: lang.code, isRtl: lang.isRtl, status: lang.status })
    setShowModal(true)
  }

  const handleEditSave = async () => {
    if (!editing || !form.name.trim() || !form.code.trim()) return
    await update(editing.id, { name: form.name.trim(), code: form.code.trim().toLowerCase(), isRtl: form.isRtl, status: form.status })
    setShowModal(false)
    setEditing(null)
    showSuccess("Language updated successfully!")
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
    showSuccess("Language deleted successfully!")
  }

  const setDefault = async (id: number) => {
    await update(id, { isDefault: true })
    showSuccess("Default language updated!")
  }

  const getLanguage = (id: number) => languages.find((l) => l.id === id)

  const clearForm = () => {
    setForm({ name: "", code: "", isRtl: false, status: true })
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
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Add Language</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. English"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. en"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRtl}
                  onChange={(e) => setForm({ ...form, isRtl: e.target.checked })}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-gray-700">Is RTL</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.checked })}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-gray-700">Active</span>
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
                    {["#", "Language", "Code", "RTL", "Status", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {languages.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No languages found</td></tr>
                  ) : (
                    languages.map((lang, idx) => (
                      <tr key={lang.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                          {lang.name}
                          {lang.isDefault && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
                        </td>
                        <td className="px-4 py-3 text-gray-600 uppercase">{lang.code}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${lang.isRtl ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                            {lang.isRtl ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lang.status ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {lang.status ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEditOpen(lang)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteOpen(lang.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                            {!lang.isDefault && (
                              <button onClick={() => setDefault(lang.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium" title="Set Default">
                                Set Default
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
              Showing {languages.length} records
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Edit Language</h3>
              <button onClick={() => { setShowModal(false); clearForm() }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRtl}
                  onChange={(e) => setForm({ ...form, isRtl: e.target.checked })}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-gray-700">Is RTL</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.checked })}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-gray-700">Active</span>
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
              Are you sure you want to delete this language?
              {deleteId && <strong className="block mt-1 text-gray-800">{getLanguage(deleteId)?.name}</strong>}
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