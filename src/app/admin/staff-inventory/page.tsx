"use client"

import { useState, useEffect } from "react"
import { Package, Layers, Building2, Truck, IndianRupee, AlertTriangle, ArrowUpFromLine, ArrowDownToLine } from "lucide-react"

type DashboardData = {
  totals: {
    items: number
    categories: number
    stores: number
    suppliers: number
    stockValue: string | number
    stockUnits: number
    issuesValue: string | number
    issuesCount: number
  }
  lowStock: { id: number; name: string; min_stock: number; total_stock: number }[]
  recentIssues: { id: number; member_name: string; member_type: string; issue_date: string; quantity: number; total_amount: string | number; bill_no: string; payment_status: string; item_name: string }[]
  recentStocks: { id: number; quantity: number; purchase_price: string | number; date: string; item_name: string; supplier_name: string }[]
  itemsByCategory: { name: string; item_count: number }[]
}

const inr = (n: string | number) => "&#8377;" + Number(n || 0).toLocaleString("en-IN")

export default function StaffInventoryDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/staff-inventory-dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-500">Loading dashboard...</div>
  }

  if (error || !data) {
    return <div className="flex items-center justify-center py-24 text-red-500">Failed to load dashboard: {error}</div>
  }

  const { totals, lowStock, recentIssues, recentStocks, itemsByCategory } = data
  const maxCategory = Math.max(1, ...itemsByCategory.map((c) => c.item_count))

  const statCards = [
    { label: "Total Items", value: totals.items, icon: Package, color: "from-orange-500 to-orange-600" },
    { label: "Categories", value: totals.categories, icon: Layers, color: "from-blue-500 to-blue-600" },
    { label: "Stores", value: totals.stores, icon: Building2, color: "from-violet-500 to-violet-600" },
    { label: "Suppliers", value: totals.suppliers, icon: Truck, color: "from-emerald-500 to-emerald-600" },
  ]

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Staff Inventory Dashboard</h2>
          <p className="text-sm text-white/80 mt-1">Staff Inventory / Dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white`}>
              <s.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-500 font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800" dangerouslySetInnerHTML={{ __html: inr(totals.stockValue) }} />
              <div className="text-xs text-gray-500 font-medium">Stock Value ({totals.stockUnits} units)</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800" dangerouslySetInnerHTML={{ __html: inr(totals.issuesValue) }} />
              <div className="text-xs text-gray-500 font-medium">Issued Items Value ({totals.issuesCount} issues)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4 text-[var(--primary)]" />
              Recent Stock Additions
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Item</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Qty</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Price</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Supplier</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentStocks.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">No stock entries</td></tr>
                ) : (
                  recentStocks.map((s, idx) => (
                    <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.item_name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center min-w-8 px-2 h-8 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">{s.quantity}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600" dangerouslySetInnerHTML={{ __html: inr(s.purchase_price) }} />
                      <td className="px-4 py-3 text-gray-600">{s.supplier_name || "-"}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{s.date || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Items by Category</h3>
          </div>
          <div className="p-5 space-y-3">
            {itemsByCategory.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No categories</p>
            ) : (
              itemsByCategory.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{c.name}</span>
                    <span className="text-gray-500 text-xs">{c.item_count} items</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${(c.item_count / maxCategory) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low Stock Items
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Item</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">In Stock</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Min Level</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-8 text-gray-400">All items are sufficiently stocked</td></tr>
                ) : (
                  lowStock.map((i, idx) => (
                    <tr key={i.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{i.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">{i.total_stock}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{i.min_stock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ArrowUpFromLine className="h-4 w-4 text-[var(--primary)]" />
              Recent Issues
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Member</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Item</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Qty</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentIssues.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400">No issues recorded</td></tr>
                ) : (
                  recentIssues.map((r, idx) => (
                    <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{r.member_name}</div>
                        <div className="text-xs text-gray-400">{r.member_type}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.item_name || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center min-w-8 px-2 h-8 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">{r.quantity}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600" dangerouslySetInnerHTML={{ __html: inr(r.total_amount) }} />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
