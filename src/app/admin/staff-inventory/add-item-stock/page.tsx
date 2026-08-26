"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Plus, Pencil, Trash2, X, ArrowDownToLine } from "lucide-react"
import { useApi } from "@/lib/use-api"

type StockEntry = {
  id: number
  itemId: number
  categoryId: number | null
  supplierId: number | null
  storeId: number | null
  quantity: number
  purchasePrice: string | number
  date: string
  description: string
}

type Category = { id: number; name: string }
type ItemRecord = { id: number; name: string; categoryId: number | null }
type Supplier = { id: number; name: string }
type Store = { id: number; name: string }

const initialForm = { itemId: "", categoryId: "", supplierId: "", storeId: "", quantity: 1, purchasePrice: "", date: "", description: "" }

export default function AddItemStockPage() {
  const { data: stocks, add, update, remove } = useApi<StockEntry>("/api/staff-inventory/stock")
  const { data: categories } = useApi<Category>("/api/staff-inventory/item-category")
  const { data: suppliers } = useApi<Supplier>("/api/staff-inventory/supplier")
  const { data: stores } = useApi<Store>("/api/staff-inventory/store")

  const [items, setItems] = useState<ItemRecord[]>([])
  const [filter, setFilter] = useState("")
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<StockEntry | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    fetch("/api/staff-inventory/item").then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : []))
  }, [])

  const fetchItemsByCategory = (categoryId: string) => {
    fetch(`/api/staff-inventory/item${categoryId ? `?category_id=${categoryId}` : ""}`)
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
  }

  const itemName = useMemo(() => {
    const map = new Map<number, string>()
    items.forEach((i) => map.set(i.id, i.name))
    return (id: number | null) => (id && map.get(id)) || "-"
  }, [items])

  const supplierName = useMemo(() => {
    const map = new Map<number, string>()
    suppliers.forEach((s) => map.set(s.id, s.name))
    return (id: number | null) => (id && map.get(id)) || "-"
  }, [suppliers])

  const storeName = useMemo(() => {
    const map = new Map<number, string>()
    stores.forEach((s) => map.set(s.id, s.name))
    return (id: number | null) => (id && map.get(id)) || "-"
  }, [stores])

  const filtered = useMemo(() => {
    return stocks.filter((s) => {
      const item = itemName(s.itemId)
      if (filter && !item.toLowerCase().includes(filter.toLowerCase())) return false
      return true
    })
  }, [stocks, filter, itemName])

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!form.itemId) errs.itemId = "Required"
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = "Must be positive"
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    await add({
      itemId: Number(form.itemId),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      supplierId: form.supplierId ? Number(form.supplierId) : null,
      storeId: form.storeId ? Number(form.storeId) : null,
      quantity: Number(form.quantity),
      purchasePrice: form.purchasePrice || 0,
      date: form.date || undefined,
      description: form.description,
    })
    setForm(initialForm)
    setShowAddModal(false)
  }

  const openEdit = (s: StockEntry) => {
    setEditId(s.id)
    setEditForm({ ...s, purchasePrice: String(s.purchasePrice ?? 0) })
    setEditErrors({})
    setShowEditModal(true)
    fetchItemsByCategory(String(s.categoryId ?? ""))
  }

  const handleUpdate = async () => {
    if (!editForm || editId === null) return
    const errs: Record<string, string> = {}
    if (!editForm.itemId) errs.itemId = "Required"
    if (!editForm.quantity || Number(editForm.quantity) <= 0) errs.quantity = "Must be positive"
    setEditErrors(errs)
    if (Object.keys(errs).length > 0) return
    await update(editId, {
      ...editForm,
      categoryId: editForm.categoryId || null,
      supplierId: editForm.supplierId || null,
      storeId: editForm.storeId || null,
      quantity: Number(editForm.quantity),
      purchasePrice: editForm.purchasePrice || 0,
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
          <h2 className="text-xl font-bold text-white">Add Item Stock</h2>
          <p className="text-sm text-white/80 mt-1">Staff Inventory / Add Item Stock</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Stock Entry List</h3>
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
              Add Stock
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Item</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Quantity</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Purchase Price</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Total Value</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Supplier</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Store</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">No stock entries found</td>
                </tr>
              ) : (
                filtered.map((s, idx) => (
                  <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{itemName(s.itemId)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center min-w-8 px-2 h-8 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">{s.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">&#8377;{s.purchasePrice}</td>
                    <td className="px-4 py-3 text-gray-600">&#8377;{Number(s.purchasePrice || 0) * Number(s.quantity || 0)}</td>
                    <td className="px-4 py-3 text-gray-600">{supplierName(s.supplierId)}</td>
                    <td className="px-4 py-3 text-gray-600">{storeName(s.storeId)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{s.date || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setDeleteId(s.id); setShowDeleteModal(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length} of {stocks.length} records</span>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ArrowDownToLine className="h-5 w-5 text-[var(--primary)]" />
                Add Stock
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => {
                      const v = e.target.value
                      setForm({ ...form, categoryId: v, itemId: "" })
                      fetchItemsByCategory(v)
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                  <select value={form.itemId} onChange={(e) => { setForm({ ...form, itemId: e.target.value }); if (formErrors.itemId) setFormErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="">Select Item</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                  {formErrors.itemId && <p className="text-red-500 text-xs mt-1">{formErrors.itemId}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min={1} value={form.quantity} onChange={(e) => { setForm({ ...form, quantity: parseInt(e.target.value) || 0 }); if (formErrors.quantity) setFormErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {formErrors.quantity && <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (&#8377;)</label>
                  <input type="number" step="0.01" min={0} value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter purchase price" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                  <select value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="">Select Store</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter description" />
                </div>
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
              <h3 className="text-lg font-semibold text-gray-800">Edit Stock Entry</h3>
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editForm.categoryId ?? ""}
                    onChange={(e) => {
                      const v = e.target.value
                      setEditForm({ ...editForm, categoryId: v ? Number(v) : null, itemId: editForm.itemId })
                      fetchItemsByCategory(v)
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                  <select value={editForm.itemId ?? ""} onChange={(e) => { setEditForm({ ...editForm, itemId: Number(e.target.value) }); if (editErrors.itemId) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="">Select Item</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                  {editErrors.itemId && <p className="text-red-500 text-xs mt-1">{editErrors.itemId}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min={1} value={editForm.quantity} onChange={(e) => { setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 }); if (editErrors.quantity) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {editErrors.quantity && <p className="text-red-500 text-xs mt-1">{editErrors.quantity}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (&#8377;)</label>
                  <input type="number" step="0.01" min={0} value={editForm.purchasePrice} onChange={(e) => setEditForm({ ...editForm, purchasePrice: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <select value={editForm.supplierId ?? ""} onChange={(e) => setEditForm({ ...editForm, supplierId: e.target.value ? Number(e.target.value) : null })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                  <select value={editForm.storeId ?? ""} onChange={(e) => setEditForm({ ...editForm, storeId: e.target.value ? Number(e.target.value) : null })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="">Select Store</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={editForm.date ?? ""} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={editForm.description ?? ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
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
              <p className="text-sm text-gray-600">Are you sure you want to delete this stock entry?</p>
              {deleteId && <p className="text-sm font-semibold text-gray-800 mt-1">{itemName(stocks.find((s) => s.id === deleteId)?.itemId ?? null)}</p>}
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
