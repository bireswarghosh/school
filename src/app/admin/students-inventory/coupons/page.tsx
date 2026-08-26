"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Pencil, Trash2, X, TicketPercent } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Coupon = {
  id?: number
  code: string
  discountType?: string
  discountValue?: number
  minOrderAmount?: number
  startDate?: string
  endDate?: string
  status?: string
}

const initialForm = { code: "", discountType: "Percent", discountValue: "", minOrderAmount: "", startDate: "", endDate: "", status: "Active" }

export default function CouponsPage() {
  const { data: coupons, add, update, remove } = useApi<Coupon>("/api/students-inventory/coupon")

  const [filter, setFilter] = useState("")
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Coupon | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const selectClass = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"

  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      if (filter && !c.code.toLowerCase().includes(filter.toLowerCase())) return false
      return true
    })
  }, [coupons, filter])

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!form.code.trim()) errs.code = "Required"
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    await add({
      code: form.code.trim(),
      discountType: form.discountType,
      discountValue: form.discountValue ? Number(form.discountValue) : undefined,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      status: form.status,
    })
    setForm(initialForm)
    setShowAddModal(false)
  }

  const openEdit = (c: Coupon) => {
    setEditId(c.id!)
    setEditForm({ ...c })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editForm || editId === null) return
    const errs: Record<string, string> = {}
    if (!editForm.code.trim()) errs.code = "Required"
    setEditErrors(errs)
    if (Object.keys(errs).length > 0) return
    await update(editId, { ...editForm, code: editForm.code.trim() })
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
          <h2 className="text-xl font-bold text-white">Coupons</h2>
          <p className="text-sm text-white/80 mt-1">Students Inventory / Coupons</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Coupons List</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] w-56"
                placeholder="Search coupon"
              />
            </div>
            <button
              onClick={() => { setForm(initialForm); setFormErrors({}); setShowAddModal(true) }}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Coupon
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Value</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Min Order</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Start</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">End</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">No coupons found</td>
                </tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr key={c.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{c.code}</td>
                    <td className="px-4 py-3 text-gray-600">{c.discountType || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{c.discountValue ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{c.minOrderAmount ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{c.startDate || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{c.endDate || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                        {c.status || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setDeleteId(c.id!); setShowDeleteModal(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
          <span>Showing {filtered.length} of {coupons.length} records</span>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TicketPercent className="h-5 w-5 text-[var(--primary)]" />
                Add Coupon
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input type="text" value={form.code} onChange={(e) => { setForm({ ...form, code: e.target.value }); if (formErrors.code) setFormErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter coupon code" />
                {formErrors.code && <p className="text-red-500 text-xs mt-1">{formErrors.code}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className={selectClass}>
                  <option value="Percent">Percent</option>
                  <option value="Amount">Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter discount value" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount</label>
                <input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter min order amount" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={selectClass}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
              <h3 className="text-lg font-semibold text-gray-800">Edit Coupon</h3>
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input type="text" value={editForm.code} onChange={(e) => { setEditForm({ ...editForm, code: e.target.value }); if (editErrors.code) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.code && <p className="text-red-500 text-xs mt-1">{editErrors.code}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select value={editForm.discountType ?? "Percent"} onChange={(e) => setEditForm({ ...editForm, discountType: e.target.value })} className={selectClass}>
                  <option value="Percent">Percent</option>
                  <option value="Amount">Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                <input type="number" value={editForm.discountValue ?? ""} onChange={(e) => setEditForm({ ...editForm, discountValue: e.target.value ? Number(e.target.value) : undefined })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount</label>
                <input type="number" value={editForm.minOrderAmount ?? ""} onChange={(e) => setEditForm({ ...editForm, minOrderAmount: e.target.value ? Number(e.target.value) : undefined })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={editForm.startDate ?? ""} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={editForm.endDate ?? ""} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={editForm.status ?? "Active"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className={selectClass}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
              <p className="text-sm text-gray-600">Are you sure you want to delete this coupon?</p>
              {deleteId && <p className="text-sm font-semibold text-gray-800 mt-1">{coupons.find((c) => c.id === deleteId)?.code}</p>}
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
