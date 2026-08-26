"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Pencil, Trash2, X, Layers } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Category = { id?: number; name: string }
type Brand = { id?: number; name: string }
type Unit = { id?: number; name: string }

type Product = {
  id?: number
  name: string
  code?: string
  categoryId?: number | null
  brandId?: number | null
  unitId?: number | null
  purchasePrice?: number | string
  sellingPrice?: number | string
  minStock?: number
  barcode?: string
  description?: string
}

type Form = {
  name: string
  code: string
  categoryId: string
  brandId: string
  unitId: string
  purchasePrice: string
  sellingPrice: string
  minStock: string
  barcode: string
  description: string
}

const initialForm: Form = {
  name: "",
  code: "",
  categoryId: "",
  brandId: "",
  unitId: "",
  purchasePrice: "",
  sellingPrice: "",
  minStock: "",
  barcode: "",
  description: "",
}

const inr = (n: string | number | null | undefined) => "&#8377;" + Number(n || 0).toLocaleString("en-IN")

const selectCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"

export default function ProductMasterPage() {
  const { data: products, add, update, remove } = useApi<Product>("/api/students-inventory/product")
  const { data: categories } = useApi<Category>("/api/students-inventory/category")
  const { data: brands } = useApi<Brand>("/api/students-inventory/brand")
  const { data: units } = useApi<Unit>("/api/students-inventory/unit")

  const [filter, setFilter] = useState("")
  const [form, setForm] = useState<Form>(initialForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Form>(initialForm)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filter) {
        const q = filter.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !(p.code || "").toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [products, filter])

  const catName = (id?: number | null) => categories.find((c) => c.id === id)?.name || "-"
  const brandName = (id?: number | null) => brands.find((b) => b.id === id)?.name || "-"
  const unitName = (id?: number | null) => units.find((u) => u.id === id)?.name || "-"

  const formToPayload = (f: Form) => ({
    name: f.name.trim(),
    code: f.code.trim() || undefined,
    categoryId: f.categoryId ? Number(f.categoryId) : null,
    brandId: f.brandId ? Number(f.brandId) : null,
    unitId: f.unitId ? Number(f.unitId) : null,
    purchasePrice: f.purchasePrice !== "" ? Number(f.purchasePrice) : undefined,
    sellingPrice: f.sellingPrice !== "" ? Number(f.sellingPrice) : undefined,
    minStock: f.minStock !== "" ? Number(f.minStock) : undefined,
    barcode: f.barcode.trim() || undefined,
    description: f.description.trim() || undefined,
  })

  const validate = (f: Form) => {
    const errs: Record<string, string> = {}
    if (!f.name.trim()) errs.name = "Required"
    return errs
  }

  const handleAdd = async () => {
    const errs = validate(form)
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    await add(formToPayload(form))
    setForm(initialForm)
    setShowAddModal(false)
  }

  const openEdit = (p: Product) => {
    setEditId(p.id ?? null)
    setEditForm({
      name: p.name || "",
      code: p.code || "",
      categoryId: p.categoryId ? String(p.categoryId) : "",
      brandId: p.brandId ? String(p.brandId) : "",
      unitId: p.unitId ? String(p.unitId) : "",
      purchasePrice: p.purchasePrice !== undefined && p.purchasePrice !== null ? String(p.purchasePrice) : "",
      sellingPrice: p.sellingPrice !== undefined && p.sellingPrice !== null ? String(p.sellingPrice) : "",
      minStock: p.minStock !== undefined && p.minStock !== null ? String(p.minStock) : "",
      barcode: p.barcode || "",
      description: p.description || "",
    })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (editId === null) return
    const errs = validate(editForm)
    setEditErrors(errs)
    if (Object.keys(errs).length > 0) return
    await update(editId, formToPayload(editForm))
    setShowEditModal(false)
    setEditId(null)
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  const modalField = (form: Form, setForm: (f: Form) => void, errors: Record<string, string>, setErrors: (e: Record<string, string>) => void) => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({}) }}
          className={inputCls}
          placeholder="Enter product name"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
        <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputCls} placeholder="Enter product code" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={selectCls}>
          <option value="">Select category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
        <select value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })} className={selectCls}>
          <option value="">Select brand</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
        <select value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} className={selectCls}>
          <option value="">Select unit</option>
          {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
          <input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} className={inputCls} placeholder="0.00" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
          <input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} className={inputCls} placeholder="0.00" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
        <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className={inputCls} placeholder="0" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
        <input type="text" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className={inputCls} placeholder="Enter barcode" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputCls} placeholder="Enter description" />
      </div>
    </>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Product Master</h2>
          <p className="text-sm text-white/80 mt-1">Students Inventory / Product Master</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Product Master List</h3>
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
              Add Product
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Brand</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Unit</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Purchase Price</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Selling Price</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Min Stock</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-400">No products found</td>
                </tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.code || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{catName(p.categoryId)}</td>
                    <td className="px-4 py-3 text-gray-600">{brandName(p.brandId)}</td>
                    <td className="px-4 py-3 text-gray-600">{unitName(p.unitId)}</td>
                    <td className="px-4 py-3 text-gray-600" dangerouslySetInnerHTML={{ __html: inr(p.purchasePrice) }} />
                    <td className="px-4 py-3 text-gray-600" dangerouslySetInnerHTML={{ __html: inr(p.sellingPrice) }} />
                    <td className="px-4 py-3 text-gray-600">{p.minStock ?? "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setDeleteId(p.id ?? null); setShowDeleteModal(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
          <span>Showing {filtered.length} of {products.length} records</span>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Layers className="h-5 w-5 text-[var(--primary)]" />
                Add Product
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {modalField(form, setForm, formErrors, setFormErrors)}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowEditModal(false); setEditErrors({}) }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Edit Product</h3>
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {modalField(editForm, setEditForm, editErrors, setEditErrors)}
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
              <p className="text-sm text-gray-600">Are you sure you want to delete this product?</p>
              {deleteId !== null && <p className="text-sm font-semibold text-gray-800 mt-1">{products.find((p) => p.id === deleteId)?.name}</p>}
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
