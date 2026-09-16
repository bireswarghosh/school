"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, X, Save, Search, Tag, FileText, Layers, TrendingUp, AlertTriangle, Check } from "lucide-react"
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
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return heads || []
    return (heads || []).filter((h) => h.name.toLowerCase().includes(q) || (h.description || "").toLowerCase().includes(q))
  }, [heads, search])

  const stats = useMemo(() => {
    const total = (heads || []).length
    const withDesc = (heads || []).filter((h) => h.description?.trim()).length
    return { total, withDesc, withoutDesc: total - withDesc }
  }, [heads])

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Expense head is required"
    else if (heads?.some((h) => h.name.toLowerCase() === name.trim().toLowerCase())) errs.name = "Expense head already exists"
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      await add({ name: name.trim(), description: description.trim() })
      setName("")
      setDescription("")
    } finally { setSaving(false) }
  }

  const handleEditOpen = (head: ExpenseHead) => {
    setEditId(head.id)
    setEditName(head.name)
    setEditDescription(head.description || "")
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="absolute left-1/3 top-1/2 -translate-y-1/2 opacity-10 hidden lg:block"><Layers className="h-28 w-28 text-white" /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Tag className="h-4 w-4 text-white" /></span>
            Expense Head
          </h2>
          <p className="text-sm text-white/80 mt-1">Expenses / Categorize your expenses • {stats.total} heads</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-amber-600"><Layers className="h-4 w-4" /></span><TrendingUp className="h-4 w-4 text-amber-500" /></div>
          <p className="text-2xl font-black text-amber-700 mt-2">{stats.total}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-amber-600/70">Total Heads</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-emerald-600"><FileText className="h-4 w-4" /></span><Check className="h-4 w-4 text-emerald-500" /></div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{stats.withDesc}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-emerald-600/70">With Description</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50 p-4 shadow-sm hidden lg:block">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-slate-600"><Tag className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-slate-400" /></div>
          <p className="text-2xl font-black text-slate-700 mt-2">{stats.withoutDesc}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Simple Heads</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-4">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Plus className="h-4 w-4 text-amber-600" /> Add Expense Head</h3>
              <p className="text-xs text-gray-500 mt-0.5">Create a new category for expenses</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Expense Head <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({}) }}
                    placeholder="e.g. Stationery, Electricity" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 bg-white shadow-sm" />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 resize-none bg-white shadow-sm" />
              </div>
              <button onClick={handleAdd} disabled={saving} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl hover:opacity-95 shadow-md shadow-orange-200 disabled:opacity-50">
                {saving ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Plus className="h-4 w-4" />} Save Head
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Layers className="h-4 w-4 text-amber-600" /> Expense Head List</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search heads..." className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-full bg-white focus:ring-2 focus:ring-amber-200 w-40" />
                </div>
                <span className="text-xs bg-white border px-2.5 py-1 rounded-full font-medium">{filtered.length} heads</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase">#</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase">Expense Head</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase">Description</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-12">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border"><Search className="h-5 w-5 text-gray-400" /></div>
                      <p className="text-sm text-gray-500 mt-2">{search ? `No results for "${search}"` : "No expense heads found"}</p>
                      <p className="text-xs text-gray-400">{search ? "Try another keyword" : "Add your first head on the left"}</p>
                    </td></tr>
                  ) : (
                    filtered.map((head, idx) => (
                      <tr key={head.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                            <Tag className="h-3 w-3" />{head.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[280px] truncate text-xs">{head.description || <span className="text-gray-400 italic">No description</span>}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEditOpen(head)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-xl border border-transparent hover:border-amber-100" title="Edit"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteOpen(head.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30 text-xs text-gray-500 flex items-center justify-between">
              <span>Showing {filtered.length} of {(heads || []).length} heads</span>
              <span className="hidden sm:inline">Heads group your expenses for reporting</span>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-amber-50 to-orange-50">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Pencil className="h-4 w-4 text-amber-600" /> Edit Expense Head</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-white rounded-xl"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Expense Head <span className="text-red-500">*</span></label>
                <input type="text" value={editName} onChange={(e) => { setEditName(e.target.value); if (editErrors.name) setEditErrors({}) }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400" />
                {editErrors.name && <p className="text-red-500 text-xs mt-1">{editErrors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 resize-none" />
              </div>
            </div>
            <div className="px-5 py-4 border-t bg-gray-50/50 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-gray-200 bg-white rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={handleEditSave} className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl shadow-md">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b bg-red-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white"><Trash2 className="h-4 w-4" /></span>
              <div>
                <h3 className="text-base font-bold text-gray-800">Confirm Delete</h3>
                <p className="text-xs text-gray-500">This cannot be undone</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">Delete expense head <strong className="text-gray-800">{(heads || []).find((h) => h.id === deleteId)?.name}</strong> ? All linked expenses will keep the head name but the category will be gone.</p>
            </div>
            <div className="px-5 py-4 border-t bg-gray-50/50 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm border border-gray-200 bg-white rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 shadow-md">Delete Head</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
