"use client"

import { useState, useEffect } from "react"
import { Package, BookOpen, Layers, Truck, Building2, Boxes, ShoppingCart, BadgePercent, IndianRupee, AlertTriangle, TrendingUp } from "lucide-react"

type DashboardData = {
  totals: {
    products: number
    books: number
    categories: number
    vendors: number
    stores: number
    coupons: number
    stockValue: string | number
    stockUnits: number
    salesCount: number
    salesValue: string | number
    collected: string | number
    ledgerBalance: string | number
    ledgerCollected: string | number
    ledgerBilled: string | number
  }
  lowStock: { id: number; name: string; min_stock: number; total_stock: number }[]
  recentSales: { id: number; sale_no: string; student_name: string; sale_date: string; total_amount: string | number; payment_status: string; product_name: string }[]
  salesByCategory: { name: string; sale_count: number; total: string | number }[]
  topProducts: { name: string; units: number; revenue: string | number }[]
}

const inr = (n: string | number | null | undefined) => "&#8377;" + Number(n || 0).toLocaleString("en-IN")

export default function StudentsInventoryDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/students-inventory-dashboard")
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

  const { totals, lowStock, recentSales, salesByCategory, topProducts } = data
  const maxSales = Math.max(1, ...salesByCategory.map((c) => Number(c.total)))

  const statCards = [
    { label: "Total Products", value: totals.products, icon: Package, color: "from-orange-500 to-orange-600" },
    { label: "Total Books", value: totals.books, icon: BookOpen, color: "from-blue-500 to-blue-600" },
    { label: "Categories", value: totals.categories, icon: Layers, color: "from-violet-500 to-violet-600" },
    { label: "Vendors", value: totals.vendors, icon: Truck, color: "from-emerald-500 to-emerald-600" },
  ]

  const statCards2 = [
    { label: "Stores", value: totals.stores, icon: Building2, color: "from-cyan-500 to-cyan-600" },
    { label: "Stock Units", value: totals.stockUnits, icon: Boxes, color: "from-amber-500 to-amber-600" },
    { label: "Total Sales", value: totals.salesCount, icon: ShoppingCart, color: "from-pink-500 to-pink-600" },
    { label: "Coupons", value: totals.coupons, icon: BadgePercent, color: "from-teal-500 to-teal-600" },
  ]

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Students Inventory Dashboard</h2>
          <p className="text-sm text-white/80 mt-1">Students Inventory / Dashboard</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards2.map((s) => (
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
              <div className="text-xl font-bold text-gray-800" dangerouslySetInnerHTML={{ __html: inr(totals.salesValue) }} />
              <div className="text-xs text-gray-500 font-medium">{totals.salesCount} sales</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-[var(--primary)]" />
              Recent Sales
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">No sales recorded</td></tr>
                ) : (
                  recentSales.map((s, idx) => (
                    <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.product_name || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{s.student_name || "-"}</td>
                      <td className="px-4 py-3 text-gray-600" dangerouslySetInnerHTML={{ __html: inr(s.total_amount) }} />
                      <td className="px-4 py-3 text-gray-600 text-xs">{s.sale_date || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.payment_status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{s.payment_status || "-"}</span>
                      </td>
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
              <Layers className="h-4 w-4 text-[var(--primary)]" />
              Sales by Category
            </h3>
          </div>
          <div className="p-5 space-y-3">
            {salesByCategory.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No sales</p>
            ) : (
              salesByCategory.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{c.name}</span>
                    <span className="text-gray-500 text-xs">{c.sale_count} sales</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${(Number(c.total) / maxSales) * 100}%` }} />
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
              Low Stock Products
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">In Stock</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Min Level</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-8 text-gray-400">All products are sufficiently stocked</td></tr>
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
              <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
              Top Products
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Units</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-8 text-gray-400">No sales recorded</td></tr>
                ) : (
                  topProducts.map((p, idx) => (
                    <tr key={p.name} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center min-w-8 px-2 h-8 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">{p.units}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600" dangerouslySetInnerHTML={{ __html: inr(p.revenue) }} />
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
