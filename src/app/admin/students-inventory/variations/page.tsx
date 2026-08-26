"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Pencil, Trash2, X, Layers } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Product = {
  id?: number
  name: string
}

type Variation = {
  id?: number
  productId: number
  variantType?: string
  variantValue?: string
  additionalPrice?: number
}

const initialForm = { productId: "", variantType: "", variantValue: "", additionalPrice: "" }

export default function VariationsPage() {
  const { data: variations, add, update, remove } = useApi<Variation>("/api/students-inventory/variation")
  const { data: products } = useApi<Product>("/api/students-inventory/product")

  const [filter, setFilter] = useState("")
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Variation | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const selectClass = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"

  const productName = (productId: number) => {
    return products.find((p) => p.id === productId)?.name || "-"
  }

  const filtered = useMemo(() => {
    return variations.filter((v) => {
      if (filter && !productName(v.productId).toLowerCase().includes(filter.toLowerCase())) return false
      return true
    })
  }, [variations, products, filter])

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!form.productId) errs.productId = "Required"
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    await add({
      productId: Number(form.productId),
      variantType: form.variantType.trim(),
      variantValue: form.variantValue.trim(),
      additionalPrice: form.additionalPrice ? Number(form.additionalPrice) : undefined,
    })
    setForm(initialForm)
    setShowAddModal(false)
  }

  const openEdit = (v: Variation) => {
    setEditId(v.id!)
    setEditForm({ ...v })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editForm || editId === null) return
    const errs: Record<string, string> = {}
    if (!editForm.productId) errs.productId = "Required"
    setEditErrors(errs)
    if (Object.keys(errs).length > 0) return
    await update(editId, {
      ...editForm,
      productId: Number(editForm.productId),
      additionalPrice: editForm.additionalPrice ? Number(editForm.additionalPrice) : undefined,
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
          <h2 className="text-xl font-bold text-white">Variations</h2>
          <p className="text-sm text-white/80 mt-1">Students Inventory / Variations</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Variations List</h3>
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
              Add Variation
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Variant Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Variant Value</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Additional Price</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No variations found</td>
                </tr>
              ) : (
                filtered.map((v, idx) => (
                  <tr key={v.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{productName(v.productId)}</td>
                    <td className="px-4 py-3 text-gray-600">{v.variantType || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{v.variantValue || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{v.additionalPrice ?? "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(v)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setDeleteId(v.id!); setShowDeleteModal(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
          <span>Showing {filtered.length} of {variations.length} records</span>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Layers className="h-5 w-5 text-[var(--primary)]" />
                Add Variation
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select value={form.productId} onChange={(e) => { setForm({ ...form, productId: e.target.value }); if (formErrors.productId) setFormErrors({}) }} className={selectClass}>
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {formErrors.productId && <p className="text-red-500 text-xs mt-1">{formErrors.productId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variant Type</label>
                <input type="text" value={form.variantType} onChange={(e) => setForm({ ...form, variantType: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter variant type" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variant Value</label>
                <input type="text" value={form.variantValue} onChange={(e) => setForm({ ...form, variantValue: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter variant value" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Price</label>
                <input type="number" value={form.additionalPrice} onChange={(e) => setForm({ ...form, additionalPrice: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter additional price" />
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
              <h3 className="text-lg font-semibold text-gray-800">Edit Variation</h3>
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select value={editForm.productId} onChange={(e) => { setEditForm({ ...editForm, productId: Number(e.target.value) }); if (editErrors.productId) setEditErrors({}) }} className={selectClass}>
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {editErrors.productId && <p className="text-red-500 text-xs mt-1">{editErrors.productId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variant Type</label>
                <input type="text" value={editForm.variantType ?? ""} onChange={(e) => setEditForm({ ...editForm, variantType: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variant Value</label>
                <input type="text" value={editForm.variantValue ?? ""} onChange={(e) => setEditForm({ ...editForm, variantValue: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Price</label>
                <input type="number" value={editForm.additionalPrice ?? ""} onChange={(e) => setEditForm({ ...editForm, additionalPrice: e.target.value ? Number(e.target.value) : undefined })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
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
              <p className="text-sm text-gray-600">Are you sure you want to delete this variation?</p>
              {deleteId && <p className="text-sm font-semibold text-gray-800 mt-1">{productName(variations.find((v) => v.id === deleteId)?.productId ?? 0)}</p>}
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
