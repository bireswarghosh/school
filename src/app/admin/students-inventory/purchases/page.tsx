"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Pencil, Trash2, X, PackagePlus } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Purchase = {
  id?: number
  purchaseNo?: string
  vendorId?: number | null
  storeId?: number | null
  productId?: number | null
  quantity?: number
  unitPrice?: number | string
  totalAmount?: number | string
  purchaseDate?: string
  status?: string
  notes?: string
}

type Option = {
  id: number
  name: string
}

const inr = (n: string | number | null | undefined) => "&#8377;" + Number(n || 0).toLocaleString("en-IN")

const initialForm: Purchase = {
  purchaseNo: "",
  vendorId: null,
  storeId: null,
  productId: null,
  quantity: undefined,
  unitPrice: undefined,
  totalAmount: undefined,
  purchaseDate: "",
  status: "Received",
  notes: "",
}

export default function PurchasesPage() {
  const { data: purchases, add, update, remove } = useApi<Purchase>("/api/students-inventory/purchase")
  const { data: vendors } = useApi<Option>("/api/students-inventory/vendor")
  const { data: stores } = useApi<Option>("/api/students-inventory/store")
  const { data: products } = useApi<Option>("/api/students-inventory/product")

  const [filter, setFilter] = useState("")
  const [form, setForm] = useState<Purchase>(initialForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Purchase | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const productName = (id?: number | null) => products.find((p) => p.id === id)?.name || "-"
  const vendorName = (id?: number | null) => vendors.find((v) => v.id === id)?.name || "-"
  const storeName = (id?: number | null) => stores.find((s) => s.id === id)?.name || "-"

  const filtered = useMemo(() => {
    return purchases.filter((p) => {
      if (!filter) return true
      const q = filter.toLowerCase()
      if (p.purchaseNo && p.purchaseNo.toLowerCase().includes(q)) return true
      if (p.productId !== undefined && p.productId !== null) {
        const name = products.find((pr) => pr.id === p.productId)?.name || "-"
        if (name.toLowerCase().includes(q)) return true
      }
      return false
    })
  }, [purchases, products, filter])

  const formTotal = Number(form.quantity || 0) * Number(form.unitPrice || 0)
  const editTotal = Number(editForm?.quantity || 0) * Number(editForm?.unitPrice || 0)

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!form.purchaseNo?.trim()) errs.purchaseNo = "Required"
    if (!form.productId) errs.productId = "Required"
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = "Required"
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    await add({
      purchaseNo: form.purchaseNo?.trim(),
      vendorId: form.vendorId || null,
      storeId: form.storeId || null,
      productId: form.productId || null,
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice || 0),
      totalAmount: formTotal,
      purchaseDate: form.purchaseDate || null,
      status: form.status || "Received",
      notes: form.notes,
    })
    setForm(initialForm)
    setShowAddModal(false)
  }

  const openEdit = (p: Purchase) => {
    setEditId(p.id ?? null)
    setEditForm({ ...p })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editForm || editId === null) return
    const errs: Record<string, string> = {}
    if (!editForm.purchaseNo?.trim()) errs.purchaseNo = "Required"
    if (!editForm.productId) errs.productId = "Required"
    if (!editForm.quantity || Number(editForm.quantity) <= 0) errs.quantity = "Required"
    setEditErrors(errs)
    if (Object.keys(errs).length > 0) return
    await update(editId, {
      ...editForm,
      purchaseNo: editForm.purchaseNo?.trim(),
      vendorId: editForm.vendorId || null,
      storeId: editForm.storeId || null,
      productId: editForm.productId || null,
      quantity: Number(editForm.quantity),
      unitPrice: Number(editForm.unitPrice || 0),
      totalAmount: editTotal,
      status: editForm.status || "Received",
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

  const statusBadge = (status?: string) => {
    if (status === "Pending")
      return <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700">Pending</span>
    if (status === "Cancelled")
      return <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700">Cancelled</span>
    return <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">Received</span>
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Purchases</h2>
          <p className="text-sm text-white/80 mt-1">Students Inventory / Purchases</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Purchases List</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] w-56"
                placeholder="Search purchase"
              />
            </div>
            <button
              onClick={() => { setForm(initialForm); setFormErrors({}); setShowAddModal(true) }}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Purchase
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Purchase No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Vendor</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Store</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Qty</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Unit Price</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-400">No purchases found</td>
                </tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.purchaseNo || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{productName(p.productId)}</td>
                    <td className="px-4 py-3 text-gray-600">{vendorName(p.vendorId)}</td>
                    <td className="px-4 py-3 text-gray-600">{storeName(p.storeId)}</td>
                    <td className="px-4 py-3 text-gray-600">{p.quantity ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-600"><span dangerouslySetInnerHTML={{ __html: inr(p.unitPrice) }} /></td>
                    <td className="px-4 py-3 font-medium text-gray-800"><span dangerouslySetInnerHTML={{ __html: inr(p.totalAmount) }} /></td>
                    <td className="px-4 py-3 text-gray-600">{p.purchaseDate || "-"}</td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
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
          <span>Showing {filtered.length} of {purchases.length} records</span>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-[var(--primary)]" />
                Add Purchase
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase No</label>
                <input type="text" value={form.purchaseNo ?? ""} onChange={(e) => { setForm({ ...form, purchaseNo: e.target.value }); if (formErrors.purchaseNo) setFormErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter purchase no" />
                {formErrors.purchaseNo && <p className="text-red-500 text-xs mt-1">{formErrors.purchaseNo}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <select value={form.vendorId ?? ""} onChange={(e) => setForm({ ...form, vendorId: e.target.value ? Number(e.target.value) : null })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min={1} value={form.quantity ?? ""} onChange={(e) => { setForm({ ...form, quantity: e.target.value ? Number(e.target.value) : undefined }); if (formErrors.quantity) setFormErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Qty" />
                  {formErrors.quantity && <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                  <input type="number" min={0} value={form.unitPrice ?? ""} onChange={(e) => setForm({ ...form, unitPrice: e.target.value ? Number(e.target.value) : undefined })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Price" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                <div className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800"><span dangerouslySetInnerHTML={{ __html: inr(formTotal) }} /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <input type="date" value={form.purchaseDate ?? ""} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status ?? "Received"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="Received">Received</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
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
              <h3 className="text-lg font-semibold text-gray-800">Edit Purchase</h3>
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase No</label>
                <input type="text" value={editForm.purchaseNo ?? ""} onChange={(e) => { setEditForm({ ...editForm, purchaseNo: e.target.value }); if (editErrors.purchaseNo) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.purchaseNo && <p className="text-red-500 text-xs mt-1">{editErrors.purchaseNo}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <select value={editForm.vendorId ?? ""} onChange={(e) => setEditForm({ ...editForm, vendorId: e.target.value ? Number(e.target.value) : null })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min={1} value={editForm.quantity ?? ""} onChange={(e) => { setEditForm({ ...editForm, quantity: e.target.value ? Number(e.target.value) : undefined }); if (editErrors.quantity) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {editErrors.quantity && <p className="text-red-500 text-xs mt-1">{editErrors.quantity}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                  <input type="number" min={0} value={editForm.unitPrice ?? ""} onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value ? Number(e.target.value) : undefined })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                <div className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800"><span dangerouslySetInnerHTML={{ __html: inr(editTotal) }} /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <input type="date" value={editForm.purchaseDate ?? ""} onChange={(e) => setEditForm({ ...editForm, purchaseDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={editForm.status ?? "Received"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="Received">Received</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
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
              <p className="text-sm text-gray-600">Are you sure you want to delete this purchase?</p>
              {deleteId && <p className="text-sm font-semibold text-gray-800 mt-1">{purchases.find((p) => p.id === deleteId)?.purchaseNo}</p>}
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
