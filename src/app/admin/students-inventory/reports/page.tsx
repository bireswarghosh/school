"use client"

import { useState, useEffect, useMemo } from "react"
import { Package, ShoppingCart, IndianRupee, BadgePercent, LayoutGrid, TrendingUp, PackageSearch, Wallet } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type Product = { id: number; name: string; categoryId?: number | null; sellingPrice?: string | number; minStock?: number | null }
type Category = { id: number; name: string }
type Sale = { id: number; productId?: number | null; quantity: number; totalAmount: string | number; paymentStatus?: string }
type StockEntry = { id: number; productId?: number | null; quantity: number; entryType?: string }
type LedgerEntry = { id: number; studentName?: string; debit: string | number; credit: string | number }
type Coupon = { id: number; code: string }

type StatCard = { label: string; value: string | number; html?: boolean; icon: LucideIcon; color: string }

const inr = (n: string | number | null | undefined) => "&#8377;" + Number(n || 0).toLocaleString("en-IN")

export default function StudentsInventoryReports() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [stock, setStock] = useState<StockEntry[]>([])
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [p, c, s, st, l, cp] = await Promise.all([
          fetch("/api/students-inventory/product").then((r) => r.json()),
          fetch("/api/students-inventory/category").then((r) => r.json()),
          fetch("/api/students-inventory/sale").then((r) => r.json()),
          fetch("/api/students-inventory/stock").then((r) => r.json()),
          fetch("/api/students-inventory/ledger").then((r) => r.json()),
          fetch("/api/students-inventory/coupon").then((r) => r.json()),
        ])
        if (active) {
          setProducts(p)
          setCategories(c)
          setSales(s)
          setStock(st)
          setLedger(l)
          setCoupons(cp)
          setLoading(false)
        }
      } catch (e: any) {
        if (active) {
          setError(e.message)
          setLoading(false)
        }
      }
    }
    load()
    return () => { active = false }
  }, [])

  const stockByProduct = useMemo(() => {
    const map = new Map<number, number>()
    for (const s of stock) {
      if (!s.productId) continue
      const qty = Number(s.quantity) || 0
      map.set(s.productId, (map.get(s.productId) || 0) + (s.entryType === "IN" ? qty : -qty))
    }
    return map
  }, [stock])

  const productsByCategory = useMemo(() => {
    return categories
      .map((c) => {
        const prods = products.filter((p) => p.categoryId === c.id)
        const stockUnits = prods.reduce((sum, p) => sum + (stockByProduct.get(p.id) || 0), 0)
        const priced = prods.filter((p) => Number(p.sellingPrice || 0) > 0)
        const avgPrice = priced.length ? priced.reduce((s, p) => s + Number(p.sellingPrice || 0), 0) / priced.length : 0
        return { name: c.name, productCount: prods.length, stockUnits, value: stockUnits * avgPrice }
      })
      .sort((a, b) => b.productCount - a.productCount)
  }, [categories, products, stockByProduct])

  const topSelling = useMemo(() => {
    const map = new Map<number, { units: number; revenue: number }>()
    for (const s of sales) {
      if (!s.productId) continue
      const cur = map.get(s.productId) || { units: 0, revenue: 0 }
      cur.units += Number(s.quantity) || 0
      cur.revenue += Number(s.totalAmount) || 0
      map.set(s.productId, cur)
    }
    const nameOf = (id: number) => products.find((p) => p.id === id)?.name || `Product #${id}`
    return [...map.entries()]
      .map(([id, v]) => ({ name: nameOf(id), units: v.units, revenue: v.revenue }))
      .sort((a, b) => b.units - a.units)
  }, [sales, products])

  const stockStatus = useMemo(() => {
    return products
      .map((p) => {
        const current = stockByProduct.get(p.id) || 0
        const minStock = p.minStock != null && Number(p.minStock) > 0 ? Number(p.minStock) : 10
        const status = current <= 0 ? "Out of Stock" : current <= minStock ? "Low" : "In Stock"
        return { id: p.id, name: p.name, current, minStock, status }
      })
      .sort((a, b) => a.current - b.current)
  }, [products, stockByProduct])

  const ledgerSummary = useMemo(() => {
    const map = new Map<string, { debit: number; credit: number }>()
    for (const l of ledger) {
      const name = l.studentName || "Unknown"
      const cur = map.get(name) || { debit: 0, credit: 0 }
      cur.debit += Number(l.debit) || 0
      cur.credit += Number(l.credit) || 0
      map.set(name, cur)
    }
    return [...map.entries()]
      .map(([studentName, v]) => ({ studentName, debit: v.debit, credit: v.credit, balance: v.debit - v.credit }))
      .sort((a, b) => b.balance - a.balance)
  }, [ledger])

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-500">Loading reports...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center py-24 text-red-500">Failed to load reports: {error}</div>
  }

  const salesValue = sales.reduce((s, x) => s + (Number(x.totalAmount) || 0), 0)
  const maxCategory = Math.max(1, ...productsByCategory.map((c) => c.productCount))
  const ledgerTotals = ledgerSummary.reduce(
    (acc, l) => ({ debit: acc.debit + l.debit, credit: acc.credit + l.credit }),
    { debit: 0, credit: 0 }
  )

  const statCards: StatCard[] = [
    { label: "Total Products", value: products.length, icon: Package, color: "from-orange-500 to-orange-600" },
    { label: "Total Sales", value: sales.length, icon: ShoppingCart, color: "from-blue-500 to-blue-600" },
    { label: "Sales Value", value: inr(salesValue), html: true, icon: IndianRupee, color: "from-emerald-500 to-emerald-600" },
    { label: "Coupons", value: coupons.length, icon: BadgePercent, color: "from-teal-500 to-teal-600" },
  ]

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Reports</h2>
          <p className="text-sm text-white/80 mt-1">Students Inventory / Reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white`}>
              <s.icon className="h-6 w-6" />
            </div>
            <div>
              {s.html ? (
                <div className="text-2xl font-bold text-gray-800" dangerouslySetInnerHTML={{ __html: String(s.value) }} />
              ) : (
                <div className="text-2xl font-bold text-gray-800">{s.value}</div>
              )}
              <div className="text-xs text-gray-500 font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-[var(--primary)]" />
            Products by Category
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Products</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Stock Units</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Value</th>
              </tr>
            </thead>
            <tbody>
              {productsByCategory.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">No categories</td></tr>
              ) : (
                productsByCategory.map((c, idx) => (
                  <tr key={c.name} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{c.name}</div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mt-1.5 w-32">
                        <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${(c.productCount / maxCategory) * 100}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center min-w-8 px-2 h-8 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">{c.productCount}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.stockUnits}</td>
                    <td className="px-4 py-3 text-gray-600" dangerouslySetInnerHTML={{ __html: inr(c.value) }} />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
            Top Selling Products
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Units Sold</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topSelling.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-8 text-gray-400">No sales recorded</td></tr>
              ) : (
                topSelling.map((p, idx) => (
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

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <PackageSearch className="h-4 w-4 text-[var(--primary)]" />
            Stock Status
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Current Stock</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {stockStatus.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-8 text-gray-400">No products</td></tr>
              ) : (
                stockStatus.map((p, idx) => (
                  <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center min-w-8 px-2 h-8 rounded-full text-xs font-semibold ${p.current <= 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>{p.current}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${p.status === "Out of Stock" ? "bg-red-100 text-red-700" : p.status === "Low" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{p.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[var(--primary)]" />
            Ledger Summary
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Total Debit</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Total Credit</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerSummary.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">No ledger entries</td></tr>
              ) : (
                ledgerSummary.map((l, idx) => (
                  <tr key={l.studentName} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{l.studentName}</td>
                    <td className="px-4 py-3 text-gray-600" dangerouslySetInnerHTML={{ __html: inr(l.debit) }} />
                    <td className="px-4 py-3 text-gray-600" dangerouslySetInnerHTML={{ __html: inr(l.credit) }} />
                    <td className={`px-4 py-3 font-semibold ${l.balance > 0 ? "text-red-600" : "text-emerald-600"}`} dangerouslySetInnerHTML={{ __html: inr(l.balance) }} />
                  </tr>
                ))
              )}
            </tbody>
            {ledgerSummary.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td className="px-4 py-3 font-bold text-gray-800">Total</td>
                  <td className="px-4 py-3 font-semibold text-gray-800" dangerouslySetInnerHTML={{ __html: inr(ledgerTotals.debit) }} />
                  <td className="px-4 py-3 font-semibold text-gray-800" dangerouslySetInnerHTML={{ __html: inr(ledgerTotals.credit) }} />
                  <td className="px-4 py-3 font-bold text-gray-800" dangerouslySetInnerHTML={{ __html: inr(ledgerTotals.debit - ledgerTotals.credit) }} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
