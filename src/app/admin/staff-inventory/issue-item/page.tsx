"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Plus, Pencil, Trash2, X, ArrowUpFromLine } from "lucide-react"
import { useApi } from "@/lib/use-api"

type IssueRecord = {
  id: number
  itemId: number | null
  categoryId: number | null
  memberType: string
  memberName: string
  issueDate: string
  returnDate: string
  quantity: number
  unitPrice: string | number
  totalAmount: string | number
  paymentStatus: string
  billNo: string
  status: string
}

type Category = { id: number; name: string }
type ItemRecord = { id: number; name: string; categoryId: number | null }

const initialForm = {
  categoryId: "", itemId: "", memberType: "Student", memberName: "", issueDate: "",
  returnDate: "", quantity: 1, unitPrice: "", paymentStatus: "Unpaid", billNo: "", status: "Issued",
}

export default function IssueItemPage() {
  const { data: records, add, update } = useApi<IssueRecord>("/api/staff-inventory/issue")
  const { data: categories } = useApi<Category>("/api/staff-inventory/item-category")

  const [items, setItems] = useState<ItemRecord[]>([])
  const [filter, setFilter] = useState("")
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<IssueRecord | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [showEditModal, setShowEditModal] = useState(false)

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

  const categoryName = useMemo(() => {
    const map = new Map<number, string>()
    categories.forEach((c) => map.set(c.id, c.name))
    return (id: number | null) => (id && map.get(id)) || "-"
  }, [categories])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filter && !`${r.memberName} ${itemName(r.itemId)} ${r.billNo}`.toLowerCase().includes(filter.toLowerCase())) return false
      return true
    })
  }, [records, filter, itemName])

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!form.itemId) errs.itemId = "Required"
    if (!form.memberName.trim()) errs.memberName = "Required"
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = "Must be positive"
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    const quantity = Number(form.quantity)
    const unitPrice = Number(form.unitPrice || 0)
    await add({
      itemId: Number(form.itemId),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      memberType: form.memberType,
      memberName: form.memberName.trim(),
      issueDate: form.issueDate || undefined,
      returnDate: form.returnDate || undefined,
      quantity,
      unitPrice,
      totalAmount: quantity * unitPrice,
      paymentStatus: form.paymentStatus,
      billNo: form.billNo,
      status: form.status,
    })
    setForm(initialForm)
    setShowAddModal(false)
  }

  const openEdit = (r: IssueRecord) => {
    setEditId(r.id)
    setEditForm({ ...r, unitPrice: String(r.unitPrice ?? 0) })
    setEditErrors({})
    setShowEditModal(true)
    fetchItemsByCategory(String(r.categoryId ?? ""))
  }

  const handleUpdate = async () => {
    if (!editForm || editId === null) return
    const errs: Record<string, string> = {}
    if (!editForm.itemId) errs.itemId = "Required"
    if (!editForm.memberName.trim()) errs.memberName = "Required"
    if (!editForm.quantity || Number(editForm.quantity) <= 0) errs.quantity = "Must be positive"
    setEditErrors(errs)
    if (Object.keys(errs).length > 0) return
    const quantity = Number(editForm.quantity)
    const unitPrice = Number(editForm.unitPrice || 0)
    await update(editId, {
      ...editForm,
      categoryId: editForm.categoryId || null,
      quantity,
      unitPrice,
      totalAmount: quantity * unitPrice,
    })
    setShowEditModal(false)
    setEditId(null)
    setEditForm(null)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Issue Item</h2>
          <p className="text-sm text-white/80 mt-1">Staff Inventory / Issue Item</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Issued Item List</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] w-56"
                placeholder="Search issued item"
              />
            </div>
            <button
              onClick={() => { setForm(initialForm); setFormErrors({}); setShowAddModal(true) }}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Issue Item
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Member</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Item</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Issue Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Qty</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Unit Price</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-400">No issued items found</td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{r.memberName}</div>
                      <div className="text-xs text-gray-400">{r.memberType}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{itemName(r.itemId)}</td>
                    <td className="px-4 py-3 text-gray-600">{categoryName(r.categoryId)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.issueDate || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center min-w-8 px-2 h-8 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">{r.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">&#8377;{r.unitPrice}</td>
                    <td className="px-4 py-3 text-gray-600 font-medium">&#8377;{r.totalAmount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${r.status === "Returned" ? "bg-emerald-100 text-emerald-700" : r.status === "Issued" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
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
          <span>Showing {filtered.length} of {records.length} records</span>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ArrowUpFromLine className="h-5 w-5 text-[var(--primary)]" />
                Issue Item
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member Type</label>
                  <div className="flex gap-4">
                    {["Student", "Staff"].map((t) => (
                      <label key={t} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="memberType"
                          checked={form.memberType === t}
                          onChange={() => setForm({ ...form, memberType: t })}
                          className="accent-[var(--primary)]"
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member Name</label>
                  <input type="text" value={form.memberName} onChange={(e) => { setForm({ ...form, memberName: e.target.value }); if (formErrors.memberName) setFormErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter member name" />
                  {formErrors.memberName && <p className="text-red-500 text-xs mt-1">{formErrors.memberName}</p>}
                </div>
              </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                  <input type="date" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min={1} value={form.quantity} onChange={(e) => { setForm({ ...form, quantity: parseInt(e.target.value) || 0 }); if (formErrors.quantity) setFormErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {formErrors.quantity && <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (&#8377;)</label>
                  <input type="number" step="0.01" min={0} value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter unit price" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (&#8377;)</label>
                  <input type="text" value={Number(form.quantity || 0) * Number(form.unitPrice || 0)} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill No.</label>
                  <input type="text" value={form.billNo} onChange={(e) => setForm({ ...form, billNo: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter bill no" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                  <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="Issued">Issued</option>
                    <option value="Returned">Returned</option>
                  </select>
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
              <h3 className="text-lg font-semibold text-gray-800">Edit Issued Item</h3>
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member Type</label>
                  <div className="flex gap-4">
                    {["Student", "Staff"].map((t) => (
                      <label key={t} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="editMemberType"
                          checked={editForm.memberType === t}
                          onChange={() => setEditForm({ ...editForm, memberType: t })}
                          className="accent-[var(--primary)]"
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member Name</label>
                  <input type="text" value={editForm.memberName} onChange={(e) => { setEditForm({ ...editForm, memberName: e.target.value }); if (editErrors.memberName) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {editErrors.memberName && <p className="text-red-500 text-xs mt-1">{editErrors.memberName}</p>}
                </div>
              </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input type="date" value={editForm.issueDate ?? ""} onChange={(e) => setEditForm({ ...editForm, issueDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                  <input type="date" value={editForm.returnDate ?? ""} onChange={(e) => setEditForm({ ...editForm, returnDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min={1} value={editForm.quantity} onChange={(e) => { setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 }); if (editErrors.quantity) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {editErrors.quantity && <p className="text-red-500 text-xs mt-1">{editErrors.quantity}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (&#8377;)</label>
                  <input type="number" step="0.01" min={0} value={editForm.unitPrice} onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (&#8377;)</label>
                  <input type="text" value={Number(editForm.quantity || 0) * Number(editForm.unitPrice || 0)} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill No.</label>
                  <input type="text" value={editForm.billNo ?? ""} onChange={(e) => setEditForm({ ...editForm, billNo: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                  <select value={editForm.paymentStatus ?? "Unpaid"} onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={editForm.status ?? "Issued"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="Issued">Issued</option>
                    <option value="Returned">Returned</option>
                  </select>
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
    </div>
  )
}
