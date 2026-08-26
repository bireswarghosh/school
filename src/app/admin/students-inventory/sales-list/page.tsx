"use client"

import { useState, useMemo } from "react"
import { Search, Trash2, X } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Sale = { id?: number; saleNo?: string; studentId?: number | null; studentName?: string; productId?: number | null; productName?: string; quantity?: number; unitPrice?: number | string; subtotal?: number | string; discountId?: number | null; discountAmount?: number | string; totalAmount?: number | string; saleDate?: string; paymentStatus?: string }
type Product = { id?: number; name: string; sellingPrice?: number | string }

const inr = (n: string | number | null | undefined) => "&#8377;" + Number(n || 0).toLocaleString("en-IN")

export default function SalesListPage() {
  const { data: sales, update, remove } = useApi<Sale>("/api/students-inventory/sale")
  const { data: products } = useApi<Product>("/api/students-inventory/product")

  const [filter, setFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (filter && !(s.studentName || "").toLowerCase().includes(filter.toLowerCase())) return false
      if (statusFilter !== "All" && s.paymentStatus !== statusFilter) return false
      return true
    })
  }, [sales, filter, statusFilter])

  const productName = (sale: Sale) => products.find((p) => p.id === sale.productId)?.name ?? sale.productName ?? "-"

  const toggleStatus = async (s: Sale) => {
    if (s.id === undefined) return
    try {
      await update(s.id, { paymentStatus: s.paymentStatus === "Paid" ? "Unpaid" : "Paid" })
    } catch {
      return
    }
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
          <h2 className="text-xl font-bold text-white">Sales List</h2>
          <p className="text-sm text-white/80 mt-1">Students Inventory / Sales List</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-700">Sales</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] w-56"
                placeholder="Search student"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 rounded-lg border border-gray-300 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option>All</option>
              <option>Paid</option>
              <option>Unpaid</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Sale No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Product</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Qty</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">No sales found</td>
                </tr>
              ) : (
                filtered.map((s, idx) => (
                  <tr key={s.id ?? idx} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.saleNo || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.studentName || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{productName(s)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{s.quantity}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800" dangerouslySetInnerHTML={{ __html: inr(s.totalAmount) }} />
                    <td className="px-4 py-3 text-gray-600">{s.saleDate ? String(s.saleDate).slice(0, 10) : "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(s)}
                        title="Toggle status"
                        className={`px-2 py-1 rounded-full text-xs font-medium ${s.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                      >
                        {s.paymentStatus || "Unpaid"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setDeleteId(s.id ?? null); setShowDeleteModal(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length} of {sales.length} records</span>
        </div>
      </div>

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
              <p className="text-sm text-gray-600">Are you sure you want to delete this sale?</p>
              {deleteId !== null && <p className="text-sm font-semibold text-gray-800 mt-1">{sales.find((s) => s.id === deleteId)?.saleNo || ""}</p>}
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
