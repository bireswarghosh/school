"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Pencil, Trash2, X, ArrowDownToLine, ArrowUpFromLine, Boxes } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Stock = {
  id?: number
  productId?: number | null
  storeId?: number | null
  quantity?: number
  entryType?: string
  reference?: string
  entryDate?: string
  notes?: string
}

type Option = {
  id: number
  name: string
}

const today = new Date().toISOString().split("T")[0]

const initialForm: Stock = {
  productId: null,
  storeId: null,
  entryType: "IN",
  quantity: undefined,
  reference: "",
  entryDate: today,
  notes: "",
}

export default function StockManagementPage() {
  const { data: stock, add, update, remove } = useApi<Stock>("/api/students-inventory/stock")
  const { data: products } = useApi<Option>("/api/students-inventory/product")
  const { data: stores } = useApi<Option>("/api/students-inventory/store")

  const [filter, setFilter] = useState("")
  const [form, setForm] = useState<Stock>(initialForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Stock | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const productName = (id?: number | null) => products.find((p) => p.id === id)?.name || "-"
  const storeName = (id?: number | null) => stores.find((s) => s.id === id)?.name || "-"

  const filtered = useMemo(() => {
    return stock.filter((s) => {
      if (!filter) return true
      const q = filter.toLowerCase()
      if (s.productId !== undefined && s.productId !== null) {
        const name = products.find((p) => p.id === s.productId)?.name || "-"
        if (name.toLowerCase().includes(q)) return true
      }
      return false
    })
  }, [stock, products, filter])

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!form.productId) errs.productId = "Required"
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = "Required"
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    await add({
      productId: form.productId || null,
      storeId: form.storeId || null,
      entryType: form.entryType || "IN",
      quantity: Number(form.quantity),
      reference: form.reference,
      entryDate: form.entryDate || today,
      notes: form.notes,
    })
    setForm(initialForm)
    setShowAddModal(false)
  }

  const openEdit = (s: Stock) => {
    setEditId(s.id ?? null)
    setEditForm({ ...s })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editForm || editId === null) return
    const errs: Record<string, string> = {}
    if (!editForm.productId) errs.productId = "Required"
    if (!editForm.quantity || Number(editForm.quantity) <= 0) errs.quantity = "Required"
    setEditErrors(errs)
    if (Object.keys(errs).length > 0) return
    await update(editId, {
      ...editForm,
      productId: editForm.productId || null,
      storeId: editForm.storeId || null,
      entryType: editForm.entryType || "IN",
      quantity: Number(editForm.quantity),
      entryDate: editForm.entryDate || today,
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

  const typeBadge = (type?: string) => {
    if (type === "OUT")
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700">
          <ArrowUpFromLine className="h-3 w-3" />
          OUT
        </span>
      )
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
        <ArrowDownToLine className="h-3 w-3" />
        IN
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Stock Management</h2>
          <p className="text-sm text-white/80 mt-1">Students Inventory / Stock Management</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Stock List</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] w-56"
                placeholder="Search product"
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Store</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Qty</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Reference</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">No stock entries found</td>
                </tr>
              ) : (
                filtered.map((s, idx) => (
                  <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{productName(s.productId)}</td>
                    <td className="px-4 py-3 text-gray-600">{storeName(s.storeId)}</td>
                    <td className="px-4 py-3">{typeBadge(s.entryType)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center min-w-8 px-2 h-8 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">{s.quantity ?? "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.entryDate || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.reference || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setDeleteId(s.id ?? null); setShowDeleteModal(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
          <span>Showing {filtered.length} of {stock.length} records</span>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Boxes className="h-5 w-5 text-[var(--primary)]" />
                Add Stock
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select value={form.productId ?? ""} onChange={(e) => { setForm({ ...form, productId: e.target.value ? Number(e.target.value) : null }); if (formErrors.productId) setFormErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {formErrors.productId && <p className="text-red-500 text-xs mt-1">{formErrors.productId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                <select value={form.storeId ?? ""} onChange={(e) => setForm({ ...form, storeId: e.target.value ? Number(e.target.value) : null })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select store</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entry Type</label>
                  <select value={form.entryType ?? "IN"} onChange={(e) => setForm({ ...form, entryType: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min={1} value={form.quantity ?? ""} onChange={(e) => { setForm({ ...form, quantity: e.target.value ? Number(e.target.value) : undefined }); if (formErrors.quantity) setFormErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Qty" />
                  {formErrors.quantity && <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entry Date</label>
                <input type="date" value={form.entryDate ?? ""} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <input type="text" value={form.reference ?? ""} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter reference" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter notes" />
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
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Edit Stock Entry</h3>
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select value={editForm.productId ?? ""} onChange={(e) => { setEditForm({ ...editForm, productId: e.target.value ? Number(e.target.value) : null }); if (editErrors.productId) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {editErrors.productId && <p className="text-red-500 text-xs mt-1">{editErrors.productId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                <select value={editForm.storeId ?? ""} onChange={(e) => setEditForm({ ...editForm, storeId: e.target.value ? Number(e.target.value) : null })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select store</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entry Type</label>
                  <select value={editForm.entryType ?? "IN"} onChange={(e) => setEditForm({ ...editForm, entryType: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min={1} value={editForm.quantity ?? ""} onChange={(e) => { setEditForm({ ...editForm, quantity: e.target.value ? Number(e.target.value) : undefined }); if (editErrors.quantity) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {editErrors.quantity && <p className="text-red-500 text-xs mt-1">{editErrors.quantity}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entry Date</label>
                <input type="date" value={editForm.entryDate ?? ""} onChange={(e) => setEditForm({ ...editForm, entryDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <input type="text" value={editForm.reference ?? ""} onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={editForm.notes ?? ""} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
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
              {deleteId && <p className="text-sm font-semibold text-gray-800 mt-1">{stock.find((s) => s.id === deleteId) ? productName(stock.find((s) => s.id === deleteId)?.productId) : ""}</p>}
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
