"use client"

import { useState, useMemo, type ReactNode } from "react"
import { Trash2, X, FileText, Printer, FileDown, ShoppingBag, Wallet, BadgeCheck, Clock, Package, Users } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useAuth } from "@/lib/auth-context"
import { useCurrency } from "@/lib/currency-context"

type Sale = { id?: number; saleNo?: string; studentId?: number | null; studentName?: string; productId?: number | null; productName?: string; quantity?: number; unitPrice?: number | string; subtotal?: number | string; discountId?: number | null; discountAmount?: number | string; totalAmount?: number | string; saleDate?: string; paymentStatus?: string; classId?: number | null; sectionId?: number | null }
type Product = { id?: number; name: string; sellingPrice?: number | string }
type ClassItem = { id: number; name: string }
type SectionItem = { id: number; name: string; class_id?: number | null }

const inr = (n: string | number | null | undefined) => "&#8377;" + Number(n || 0).toLocaleString("en-IN")
const escapeHtml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

function StatCard({ label, value, sub, icon, tone }: { label: string; value: string; sub?: string; icon: ReactNode; tone: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone}`} aria-hidden />
      <div className="mt-1 flex items-center gap-2.5">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm bg-gradient-to-br ${tone}`}>{icon}</div>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
          <p className="truncate text-base font-bold leading-tight text-gray-900">{value}</p>
        </div>
      </div>
      {sub && <p className="mt-1.5 truncate text-[11px] text-gray-400">{sub}</p>}
    </div>
  )
}

export default function StudentSalesListPanel() {
  const { data: sales, update, remove } = useApi<Sale>("/api/students-inventory/sale")
  const { data: products } = useApi<Product>("/api/students-inventory/product")
  const { data: classes } = useApi<ClassItem>("/api/academics/class")
  const { data: sections } = useApi<SectionItem>("/api/academics/section")
  const { school } = useAuth()
  const { symbol } = useCurrency()

  const todayStr = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  })()

  const [filter, setFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [dateFrom, setDateFrom] = useState(todayStr)
  const [dateTo, setDateTo] = useState(todayStr)
  const [classFilter, setClassFilter] = useState("")
  const [sectionFilter, setSectionFilter] = useState("")
  const [productFilter, setProductFilter] = useState("")
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [invoiceSaleId, setInvoiceSaleId] = useState<number | null>(null)

  const classSections = useMemo(() => {
    if (!classFilter) return sections || []
    return (sections || []).filter((s) => s.class_id?.toString() === classFilter)
  }, [sections, classFilter])

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (filter && !(s.studentName || "").toLowerCase().includes(filter.toLowerCase())) return false
      if (statusFilter !== "All" && s.paymentStatus !== statusFilter) return false
      const d = s.saleDate ? String(s.saleDate).slice(0, 10) : ""
      if (dateFrom && d && d < dateFrom) return false
      if (dateTo && d && d > dateTo) return false
      if (classFilter && s.classId?.toString() !== classFilter) return false
      if (sectionFilter && s.sectionId?.toString() !== sectionFilter) return false
      if (productFilter && s.productId?.toString() !== productFilter) return false
      return true
    })
  }, [sales, filter, statusFilter, dateFrom, dateTo, classFilter, sectionFilter, productFilter])

  const handleReset = () => {
    setDateFrom(todayStr)
    setDateTo(todayStr)
    setClassFilter("")
    setSectionFilter("")
    setProductFilter("")
    setFilter("")
    setStatusFilter("All")
  }

  const totalSales = filtered.length
  const totalAmount = filtered.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)
  const paidAmount = filtered.filter((s) => s.paymentStatus === "Paid").reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)
  const unpaidAmount = filtered.filter((s) => s.paymentStatus !== "Paid").reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)
  const qtySold = filtered.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0)
  const studentCount = new Set(filtered.map((s) => s.studentName).filter(Boolean)).size

  const productName = (sale: Sale) => products.find((p) => p.id === sale.productId)?.name ?? sale.productName ?? "-"

  const invoiceSale = invoiceSaleId !== null ? sales.find((s) => s.id === invoiceSaleId) ?? null : null
  const invoiceRows = useMemo(() => {
    if (!invoiceSale) return []
    return sales.filter((s) => s.saleNo === invoiceSale.saleNo)
  }, [sales, invoiceSale])

  const money = (n: string | number | null | undefined) => `${symbol}${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const buildInvoiceHtml = (sale: Sale, rows: Sale[]): string => {
    const sName = escapeHtml(school?.name || "Smart School")
    const sTagline = school?.tagline ? escapeHtml(school.tagline) : ""
    const sAddress = school?.address ? escapeHtml(school.address) : ""
    const sPhone = school?.phone ? escapeHtml(school.phone) : ""
    const sEmail = school?.email ? escapeHtml(school.email) : ""
    const fmt = (n: string | number | null | undefined) => `${symbol}${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const sub = rows.reduce((sum, r) => sum + (Number(r.subtotal) || 0), 0)
    const disc = rows.reduce((sum, r) => sum + (Number(r.discountAmount) || 0), 0)
    const total = rows.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0)
    const items = rows
      .map((r, i) => {
        const name = escapeHtml(productName(r))
        const qty = Number(r.quantity) || 0
        const unit = Number(r.unitPrice) || 0
        const d = Number(r.discountAmount) || 0
        const amt = Number(r.totalAmount) || 0
        return `<tr>
          <td class="c">${i + 1}</td>
          <td>${name}</td>
          <td class="c">${qty}</td>
          <td class="r">${fmt(unit)}</td>
          <td class="r">${d ? fmt(d) : "-"}</td>
          <td class="r">${fmt(amt)}</td>
        </tr>`
      })
      .join("")
    const status = sale.paymentStatus || "Unpaid"
    const statusColor = status === "Paid" ? "#059669" : "#dc2626"
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice ${escapeHtml(sale.saleNo || "")}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 13px; padding: 32px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ff7732; padding-bottom: 16px; margin-bottom: 20px; }
  .head h1 { font-size: 22px; color: #111827; }
  .head .tag { color: #ff7732; font-size: 12px; margin-top: 2px; }
  .head .meta { text-align: right; font-size: 12px; color: #4b5563; line-height: 1.5; }
  .head .meta .inv-no { font-size: 15px; font-weight: 700; color: #111827; }
  .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
  .info .box p { line-height: 1.6; }
  .info .box .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #ff7732; color: #fff; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px; }
  td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
  .c { text-align: center; }
  .r { text-align: right; }
  .totals { width: 260px; margin-left: auto; }
  .totals .row { display: flex; justify-content: space-between; padding: 5px 0; }
  .totals .row.grand { border-top: 2px solid #ff7732; font-weight: 700; font-size: 15px; padding-top: 8px; }
  .status { display: inline-block; margin-top: 8px; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; color: ${statusColor}; border: 1px solid ${statusColor}; }
  .foot { margin-top: 28px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 14px; }
</style>
</head>
<body>
  <div class="head">
    <div>
      <h1>${sName}</h1>
      ${sTagline ? `<div class="tag">${sTagline}</div>` : ""}
      ${sAddress ? `<div style="font-size:12px;color:#4b5563;margin-top:4px;">${sAddress}</div>` : ""}
      ${sPhone || sEmail ? `<div style="font-size:12px;color:#4b5563;margin-top:2px;">${[sPhone, sEmail].filter(Boolean).join(" | ")}</div>` : ""}
    </div>
    <div class="meta">
      <div class="inv-no">${escapeHtml(sale.saleNo || "INVOICE")}</div>
      <div>Date: ${String(sale.saleDate || "").slice(0, 10)}</div>
      <div><span class="status">${status}</span></div>
    </div>
  </div>

  <div class="info">
    <div class="box">
      <p class="lbl">Billed To</p>
      <p style="font-weight:600;">${escapeHtml(sale.studentName || "-")}</p>
      ${sale.studentId ? `<p>Student ID: ${escapeHtml(String(sale.studentId))}</p>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="c">#</th>
        <th>Item</th>
        <th class="c">Qty</th>
        <th class="r">Unit Price</th>
        <th class="r">Discount</th>
        <th class="r">Amount</th>
      </tr>
    </thead>
    <tbody>${items}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${fmt(sub)}</span></div>
    ${disc ? `<div class="row"><span>Discount</span><span>${fmt(disc)}</span></div>` : ""}
    <div class="row grand"><span>Grand Total</span><span>${fmt(total)}</span></div>
  </div>

  <div class="foot">Thank you for your purchase. This is a computer-generated invoice.</div>
</body>
</html>`
  }

  const printInvoice = (sale: Sale) => {
    const frame = document.getElementById("invoice-frame") as HTMLIFrameElement | null
    if (!frame) return
    frame.onload = () => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    }
    frame.srcdoc = buildInvoiceHtml(sale, sales.filter((s) => s.saleNo === sale.saleNo))
  }

  const invoiceSubtotal = invoiceRows.reduce((sum, r) => sum + (Number(r.subtotal) || 0), 0)
  const invoiceDiscount = invoiceRows.reduce((sum, r) => sum + (Number(r.discountAmount) || 0), 0)
  const invoiceTotal = invoiceRows.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0)

  const toggleStatus = async (s: Sale) => {
    if (s.id === undefined) return
    try {
      await update(s.id, { paymentStatus: s.paymentStatus === "Paid" ? "Unpaid" : "Paid" })
    } catch {
      return
    }
  }

  const allSelected = filtered.length > 0 && filtered.every((s) => s.id !== undefined && selectedIds.includes(s.id!))
  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? [] : filtered.filter((s) => s.id !== undefined).map((s) => s.id!))
  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))

  const openDelete = (id: number) => { setPendingDeleteIds([id]); setShowDeleteModal(true) }
  const openBulkDelete = () => { setPendingDeleteIds(selectedIds); setShowDeleteModal(true) }

  const confirmDelete = async () => {
    if (pendingDeleteIds.length === 0) return
    try {
      if (pendingDeleteIds.length === 1) {
        await remove(pendingDeleteIds[0])
      } else {
        const res = await fetch(`/api/students-inventory/sale?ids=${pendingDeleteIds.join(",")}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Failed to delete sales")
      }
      setShowDeleteModal(false)
      setPendingDeleteIds([])
      setSelectedIds((prev) => prev.filter((i) => !pendingDeleteIds.includes(i)))
    } catch {
      setShowDeleteModal(false)
      setPendingDeleteIds([])
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          label="Total Sales"
          value={totalSales.toLocaleString()}
          sub="Matching sales"
          icon={<ShoppingBag className="h-4 w-4" />}
          tone="from-orange-500 to-amber-500"
        />
        <StatCard
          label="Total Amount"
          value={`${symbol}${totalAmount.toLocaleString()}`}
          sub="Sales value"
          icon={<Wallet className="h-4 w-4" />}
          tone="from-emerald-500 to-teal-500"
        />
        <StatCard
          label="Paid Amount"
          value={`${symbol}${paidAmount.toLocaleString()}`}
          sub="Collected"
          icon={<BadgeCheck className="h-4 w-4" />}
          tone="from-green-500 to-emerald-600"
        />
        <StatCard
          label="Unpaid Amount"
          value={`${symbol}${unpaidAmount.toLocaleString()}`}
          sub="Outstanding"
          icon={<Clock className="h-4 w-4" />}
          tone="from-rose-500 to-red-500"
        />
        <StatCard
          label="Items Sold"
          value={qtySold.toLocaleString()}
          sub="Total quantity"
          icon={<Package className="h-4 w-4" />}
          tone="from-indigo-500 to-blue-500"
        />
        <StatCard
          label="Students"
          value={studentCount.toLocaleString()}
          sub="Unique buyers"
          icon={<Users className="h-4 w-4" />}
          tone="from-sky-500 to-cyan-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Search Criteria</h3>
        </div>
        <div className="p-4 flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Date From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Date To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Class</label>
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setSectionFilter("") }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All</option>
              {(classes || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Section</label>
            <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All</option>
              {classSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Product</label>
            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All</option>
              {(products || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600">Search by Student</label>
            <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search by student name..."
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option>All</option>
              <option>Paid</option>
              <option>Unpaid</option>
            </select>
          </div>
          <button type="button" onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <X className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm text-gray-600">Showing <strong>{filtered.length}</strong> of <strong>{sales.length}</strong> records</span>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button onClick={openBulkDelete} className="px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-[var(--primary)]" />
                </th>
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
                  <td colSpan={10} className="text-center py-8 text-gray-400">No sales found</td>
                </tr>
              ) : (
                filtered.map((s, idx) => (
                  <tr key={s.id ?? idx} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={s.id !== undefined && selectedIds.includes(s.id)} onChange={() => s.id !== undefined && toggleSelect(s.id)} className="accent-[var(--primary)]" />
                    </td>
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
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setInvoiceSaleId(s.id ?? null)} className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors" title="Invoice / Print">
                          <FileText className="h-4 w-4" />
                        </button>
                        <button onClick={() => s.id !== undefined && openDelete(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
          <span>Showing {filtered.length} of {sales.length} records</span>
        </div>
      </div>

      {invoiceSale && invoiceRows.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setInvoiceSaleId(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-800">Invoice</h3>
              <button onClick={() => setInvoiceSaleId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between border-b-2 border-[var(--primary)] pb-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{school?.name || "Smart School"}</h4>
                  {school?.tagline && <p className="text-xs text-[var(--primary)] mt-0.5">{school.tagline}</p>}
                  {school?.address && <p className="text-xs text-gray-500 mt-1">{school.address}</p>}
                  {(school?.phone || school?.email) && (
                    <p className="text-xs text-gray-500 mt-0.5">{[school.phone, school.email].filter(Boolean).join(" | ")}</p>
                  )}
                </div>
                <div className="text-right text-xs text-gray-500 space-y-1">
                  <p className="text-base font-bold text-gray-900">{invoiceSale.saleNo}</p>
                  <p>Date: {String(invoiceSale.saleDate || "").slice(0, 10)}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${invoiceSale.paymentStatus === "Paid" ? "text-emerald-700 border-emerald-600" : "text-red-600 border-red-600"}`}>
                    {invoiceSale.paymentStatus || "Unpaid"}
                  </span>
                </div>
              </div>

              <div className="py-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Billed To</p>
                <p className="font-semibold text-gray-800">{invoiceSale.studentName || "-"}</p>
                {invoiceSale.studentId && <p className="text-xs text-gray-500">Student ID: {invoiceSale.studentId}</p>}
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--primary)] text-white text-left text-xs uppercase">
                      <th className="px-3 py-2 font-medium text-center w-8">#</th>
                      <th className="px-3 py-2 font-medium">Item</th>
                      <th className="px-3 py-2 font-medium text-center w-12">Qty</th>
                      <th className="px-3 py-2 font-medium text-right">Unit Price</th>
                      <th className="px-3 py-2 font-medium text-right">Discount</th>
                      <th className="px-3 py-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceRows.map((r, i) => (
                      <tr key={r.id ?? i} className="border-b border-gray-100 last:border-0">
                        <td className="px-3 py-2 text-center text-gray-500">{i + 1}</td>
                        <td className="px-3 py-2 text-gray-800">{productName(r)}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{r.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{money(r.unitPrice)}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{Number(r.discountAmount) ? money(r.discountAmount) : "-"}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-800">{money(r.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 ml-auto w-64 space-y-1.5 text-sm text-gray-600">
                <div className="flex justify-between"><span>Subtotal</span><span>{money(invoiceSubtotal)}</span></div>
                {invoiceDiscount > 0 && (
                  <div className="flex justify-between text-red-600"><span>Discount</span><span>- {money(invoiceDiscount)}</span></div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-lg border-t-2 border-[var(--primary)] pt-2">
                  <span>Grand Total</span><span>{money(invoiceTotal)}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white">
              <button onClick={() => setInvoiceSaleId(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
              <button
                onClick={() => printInvoice(invoiceSale)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FileDown className="h-4 w-4" /> Download PDF
              </button>
              <button
                onClick={() => printInvoice(invoiceSale)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
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
              <p className="text-sm text-gray-600">Are you sure you want to delete {pendingDeleteIds.length} sale{pendingDeleteIds.length === 1 ? "" : "s"}?</p>
              {pendingDeleteIds.length > 0 && (
                <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {sales.filter((s) => s.id !== undefined && pendingDeleteIds.includes(s.id!)).map((s) => (
                    <li key={s.id} className="text-sm font-semibold text-gray-800">{s.saleNo || "-"}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete{pendingDeleteIds.length > 1 ? ` (${pendingDeleteIds.length})` : ""}</button>
            </div>
          </div>
        </div>
      )}

      <iframe
        id="invoice-frame"
        title="Invoice print frame"
        style={{ position: "fixed", left: -9999, top: 0, width: 820, height: 1100, border: 0 }}
      />
    </>
  )
}