"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Pencil, Trash2, X, Package } from "lucide-react"
import { useApi } from "@/lib/use-api"

type ItemRecord = {
  id: number
  name: string
  code: string
  categoryId: number | null
  description: string
  sellingPrice: string | number
  minStock: number
  barcode: string
}

type Category = { id: number; name: string }
type StockEntry = { id: number; itemId: number; quantity: number }

const initialForm = { name: "", code: "", categoryId: "", sellingPrice: "", minStock: 0, barcode: "", description: "" }

export default function AddItemPage() {
  const { data: items, add, update, remove } = useApi<ItemRecord>("/api/staff-inventory/item")
  const { data: categories } = useApi<Category>("/api/staff-inventory/item-category")
  const { data: stocks } = useApi<StockEntry>("/api/staff-inventory/stock")

  const [filter, setFilter] = useState("")
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<ItemRecord | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const categoryName = useMemo(() => {
    const map = new Map<number, string>()
    categories.forEach((c) => map.set(c.id, c.name))
    return (id: number | null) => (id && map.get(id)) || "-"
  }, [categories])

  const stockMap = useMemo(() => {
    const map = new Map<number, number>()
    stocks.forEach((s) => map.set(s.itemId, (map.get(s.itemId) || 0) + s.quantity))
    return map
  }, [stocks])

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filter && !`${i.name} ${i.code} ${i.barcode}`.toLowerCase().includes(filter.toLowerCase())) return false
      return true
    })
  }, [items, filter])

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = "Required"
    if (!form.code.trim()) errs.code = "Required"
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    await add({
      name: form.name.trim(), code: form.code.trim(), categoryId: form.categoryId ? Number(form.categoryId) : null,
      sellingPrice: form.sellingPrice || 0, minStock: Number(form.minStock) || 0,
      barcode: form.barcode, description: form.description,
    })
    setForm(initialForm)
    setShowAddModal(false)
  }

  const openEdit = (i: ItemRecord) => {
    setEditId(i.id)
    setEditForm({ ...i, sellingPrice: String(i.sellingPrice ?? 0) })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editForm || editId === null) return
    const errs: Record<string, string> = {}
    if (!editForm.name.trim()) errs.name = "Required"
    if (!editForm.code.trim()) errs.code = "Required"
    setEditErrors(errs)
    if (Object.keys(errs).length > 0) return
    await update(editId, {
      ...editForm,
      categoryId: editForm.categoryId || null,
      sellingPrice: editForm.sellingPrice || 0,
      minStock: Number(editForm.minStock) || 0,
    })
    setShowEditModal(false)
    setEditId(null)
    setEditForm(null)
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
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Add Item</h2>
          <p className="text-sm text-white/80 mt-1">Staff Inventory / Add Item</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Item List</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] w-56"
                placeholder="Search item"
              />
            </div>
            <button
              onClick={() => { setForm(initialForm); setFormErrors({}); setShowAddModal(true) }}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Item</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Selling Price</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Stock</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Min Stock</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">No items found</td>
                </tr>
              ) : (
                filtered.map((i, idx) => {
                  const stock = stockMap.get(i.id) || 0
                  const low = i.minStock > 0 && stock < i.minStock
                  return (
                    <tr key={i.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                      <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{i.name}</td>
                      <td className="px-4 py-3 text-gray-600">{i.code}</td>
                      <td className="px-4 py-3 text-gray-600">{categoryName(i.categoryId)}</td>
                      <td className="px-4 py-3 text-gray-600">&#8377;{i.sellingPrice}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center min-w-8 px-2 h-8 rounded-full text-xs font-semibold ${low ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>{stock}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{i.minStock}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(i)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setDeleteId(i.id); setShowDeleteModal(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length} of {items.length} records</span>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-[var(--primary)]" />
                Add Item
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input type="text" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); if (formErrors.name) setFormErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter item name" />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
                  <input type="text" value={form.code} onChange={(e) => { setForm({ ...form, code: e.target.value }); if (formErrors.code) setFormErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter item code" />
                  {formErrors.code && <p className="text-red-500 text-xs mt-1">{formErrors.code}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (&#8377;)</label>
                  <input type="number" step="0.01" min={0} value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter selling price" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Level</label>
                  <input type="number" min={0} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: parseInt(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input type="text" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter barcode" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter description" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowEditModal(false); setEditErrors({}) }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Edit Item</h3>
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input type="text" value={editForm.name} onChange={(e) => { setEditForm({ ...editForm, name: e.target.value }); if (editErrors.name) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {editErrors.name && <p className="text-red-500 text-xs mt-1">{editErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
                  <input type="text" value={editForm.code} onChange={(e) => { setEditForm({ ...editForm, code: e.target.value }); if (editErrors.code) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {editErrors.code && <p className="text-red-500 text-xs mt-1">{editErrors.code}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={editForm.categoryId ?? ""} onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value ? Number(e.target.value) : null })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (&#8377;)</label>
                  <input type="number" step="0.01" min={0} value={editForm.sellingPrice} onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Level</label>
                  <input type="number" min={0} value={editForm.minStock} onChange={(e) => setEditForm({ ...editForm, minStock: parseInt(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input type="text" value={editForm.barcode ?? ""} onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editForm.description ?? ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdate} className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">Are you sure you want to delete this item?</p>
              {deleteId && <p className="text-sm font-semibold text-gray-800 mt-1">{items.find((i) => i.id === deleteId)?.name}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
