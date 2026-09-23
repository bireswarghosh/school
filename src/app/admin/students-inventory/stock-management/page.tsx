"use client"

import { Fragment, useState, useMemo, useEffect, useCallback } from "react"
import { Search, Plus, Pencil, Trash2, X, ArrowDownToLine, ArrowUpFromLine, Boxes, AlertTriangle, ChevronDown, ChevronRight, Package, SlidersHorizontal, Layers, CheckCircle2 } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Product = { id?: number; name: string; code?: string; categoryId?: number | null; unitId?: number | null; purchasePrice?: number | string; sellingPrice?: number | string; minStock?: number | null }
type Variation = { id?: number; productId: number; componentName?: string; color?: string; size?: string; price?: number | string; sku?: string; quantity?: number; minStock?: number | null; variantType?: string; variantValue?: string }
type StockEntry = { id?: number; productId?: number | null; variationId?: number | null; storeId?: number | null; quantity?: number; entryType?: string; reference?: string; entryDate?: string; notes?: string }
type BalanceRow = { productId: number; variationId: number | null; name?: string; label?: string; code?: string; sku?: string; balance: number; minStock: number; status: "ok" | "low" | "out" }
type BalanceResponse = { products: BalanceRow[]; variations: BalanceRow[] }
type Store = { id?: number; name: string }

const today = new Date().toISOString().split("T")[0]

export default function StockManagementPage() {
  const { data: stock, add: addStock, update: updateStock, remove: removeStock, refetch: refetchStock, loading: stockLoading } = useApi<StockEntry>("/api/students-inventory/stock")
  const { data: products, update: updateProduct, refetch: refetchProducts } = useApi<Product>("/api/students-inventory/product")
  const { data: variations, update: updateVariation, refetch: refetchVariations } = useApi<Variation>("/api/students-inventory/variation")
  const { data: stores } = useApi<Store>("/api/students-inventory/store")
  const [balances, setBalances] = useState<BalanceResponse>({ products: [], variations: [] })
  const [balancesLoading, setBalancesLoading] = useState(true)
  const [tab, setTab] = useState<"levels" | "transactions">("levels")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "low" | "out">("all")
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [allExpanded, setAllExpanded] = useState(false)

  const [adjustTarget, setAdjustTarget] = useState<{ product: Product | null; variation: Variation | null }>({ product: null, variation: null })
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustForm, setAdjustForm] = useState({ productId: "", variationId: "", entryType: "IN", quantity: "", entryDate: today, reference: "", notes: "" })
  const [adjustErrors, setAdjustErrors] = useState<Record<string, string>>({})
  const [adjustSaving, setAdjustSaving] = useState(false)
  const [adjustMessage, setAdjustMessage] = useState("")

  const [minTarget, setMinTarget] = useState<{ kind: "product" | "variation"; id: number; label: string } | null>(null)
  const [minValue, setMinValue] = useState("")
  const [showMinModal, setShowMinModal] = useState(false)
  const [minSaving, setMinSaving] = useState(false)

  const [transactionMode, setTransactionMode] = useState<{ type: "add" | "edit"; entry?: StockEntry } | null>(null)
  const [txForm, setTxForm] = useState<StockEntry>({ productId: null, variationId: null, storeId: null, entryType: "IN", quantity: undefined, reference: "", entryDate: today, notes: "" })
  const [txErrors, setTxErrors] = useState<Record<string, string>>({})
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const fetchBalances = useCallback(async () => {
    try {
      const res = await fetch("/api/students-inventory/stock/balance")
      if (!res.ok) return
      const data: BalanceResponse = await res.json()
      setBalances({ products: data.products || [], variations: data.variations || [] })
    } catch {
      // leave last loaded balances
    } finally {
      setBalancesLoading(false)
    }
  }, [])

  useEffect(() => { fetchBalances() }, [fetchBalances])

  const refreshAll = useCallback(() => {
    fetchBalances()
    refetchStock()
    refetchVariations()
    refetchProducts()
  }, [fetchBalances, refetchStock, refetchVariations, refetchProducts])

  const prodBalMap = useMemo(() => new Map(balances.products.map((b) => [b.productId, b])), [balances])
  const varBalMap = useMemo(() => new Map(balances.variations.map((b) => [b.variationId, b])), [balances])

  const variationsByProduct = useMemo(() => {
    const m = new Map<number, Variation[]>()
    for (const v of variations) {
      if (v.id == null) continue
      if (!m.has(v.productId)) m.set(v.productId, [])
      m.get(v.productId)!.push(v)
    }
    for (const list of m.values()) list.sort((a, b) => (a.color || "").localeCompare(b.color || "") || (a.size || "").localeCompare(b.size || ""))
    return m
  }, [variations])

  const productHasVars = (pid: number | undefined) => (pid != null ? (variationsByProduct.get(pid)?.length ?? 0) > 0 : false)

  const productEffective = (p: Product) => {
    const vars = p.id != null ? variationsByProduct.get(p.id) || [] : []
    if (vars.length > 0) {
      const sum = vars.reduce((s, v) => s + (varBalMap.get(v.id!)?.balance ?? 0), 0)
      return sum
    }
    return p.id != null ? prodBalMap.get(p.id)?.balance ?? 0 : 0
  }

  const statusOf = (balance: number, minStock: number): "ok" | "low" | "out" => {
    if (balance <= 0) return "out"
    if (minStock > 0 && balance <= minStock) return "low"
    return "ok"
  }

  const rows: { product: Product; balance: number; minStock: number; status: "ok" | "low" | "out" }[] = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products
      .map((p) => {
        const balance = productEffective(p)
        const minStock = Number(p.minStock ?? 0) || 0
        return { product: p, balance, minStock, status: statusOf(balance, minStock) }
      })
      .filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false
        if (!q) return true
        return (
          (r.product.name || "").toLowerCase().includes(q) ||
          (r.product.code || "").toLowerCase().includes(q) ||
          (variationsByProduct.get(r.product.id!) || []).some((v) =>
            [v.componentName, v.color, v.size, v.sku, v.variantValue].filter(Boolean).join(" ").toLowerCase().includes(q)
          )
        )
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, balances, variationsByProduct, search, statusFilter])

  const counts = useMemo(() => {
    const levels = products.map((p) => {
      const b = productEffective(p)
      const m = Number(p.minStock ?? 0) || 0
      return statusOf(b, m)
    })
    return {
      total: products.length,
      ok: levels.filter((s) => s === "ok").length,
      low: levels.filter((s) => s === "low").length,
      out: levels.filter((s) => s === "out").length,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, balances, variationsByProduct])

  const lowOutList = useMemo(() => {
    const list: { id: string; name: string; balance: number; min?: number; status: string; kind: "product" | "variation" }[] = []
    for (const p of products) {
      const eff = productEffective(p)
      const min = Number(p.minStock ?? 0) || 0
      const st = statusOf(eff, min)
      if (st !== "ok") list.push({ id: `p-${p.id}`, name: p.name, balance: eff, min, status: st, kind: "product" })
      if (p.id != null) {
        for (const v of variationsByProduct.get(p.id) || []) {
          const vb = varBalMap.get(v.id!)?.balance ?? 0
          const vm = Number(v.minStock ?? 0) || 0
          const vs = statusOf(vb, vm)
          if (vs !== "ok") {
            const label = [v.componentName, v.color, v.size].filter(Boolean).join(" · ")
            list.push({ id: `v-${v.id}`, name: `${p.name}${label ? ` (${label})` : ""}`, balance: vb, min: vm, status: vs, kind: "variation" })
          }
        }
      }
    }
    return list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, balances, variationsByProduct])

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllExpand = () => {
    if (allExpanded) {
      setExpanded(new Set())
      setAllExpanded(false)
    } else {
      setExpanded(new Set(products.filter((p) => p.id != null && productHasVars(p.id)).map((p) => p.id!)))
      setAllExpanded(true)
    }
  }

  const productName = (id?: number | null) => products.find((p) => p.id === id)?.name || "-"
  const variationLabel = (id?: number | null) => {
    if (!id) return null
    const v = variations.find((x) => x.id === id)
    if (!v) return null
    return [v.componentName, v.color, v.size].filter(Boolean).join(" · ") || `#${id}`
  }
  const storeName = (id?: number | null) => stores.find((s) => s.id === id)?.name || "-"

  const openAdjust = (product: Product, variation?: Variation) => {
    setAdjustTarget({ product, variation: variation || null })
    setAdjustForm({
      productId: String(product.id ?? ""),
      variationId: variation ? String(variation.id) : "",
      entryType: "IN",
      quantity: "",
      entryDate: today,
      reference: "",
      notes: "",
    })
    setAdjustErrors({})
    setAdjustMessage("")
    setShowAdjustModal(true)
  }

  const handleAdjust = async () => {
    const errs: Record<string, string> = {}
    if (!adjustForm.productId) errs.productId = "Required"
    const qty = Number(adjustForm.quantity)
    if (!qty || qty <= 0) errs.quantity = "Valid quantity required"
    setAdjustErrors(errs)
    if (Object.keys(errs).length) return
    setAdjustSaving(true)
    setAdjustMessage("")
    try {
      const payload: Record<string, any> = {
        productId: Number(adjustForm.productId),
        variationId: adjustForm.variationId ? Number(adjustForm.variationId) : null,
        entryType: adjustForm.entryType,
        quantity: qty,
        entryDate: adjustForm.entryDate || today,
        reference: adjustForm.reference,
        notes: adjustForm.notes,
      }
      const res = await fetch("/api/students-inventory/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to adjust stock")
      }
      setAdjustMessage("")
      setShowAdjustModal(false)
      refreshAll()
    } catch (e: any) {
      setAdjustMessage(e.message || "Failed to adjust stock")
    } finally {
      setAdjustSaving(false)
    }
  }

  const openMin = (kind: "product" | "variation", id: number, label: string, current?: number | null) => {
    setMinTarget({ kind, id, label })
    setMinValue(current != null ? String(current) : "0")
    setShowMinModal(true)
  }

  const handleMinSave = async () => {
    if (!minTarget) return
    const val = Math.max(0, Math.floor(Number(minValue) || 0))
    setMinSaving(true)
    try {
      if (minTarget.kind === "product") {
        await updateProduct(minTarget.id, { minStock: val })
      } else {
        await updateVariation(minTarget.id, { minStock: val })
      }
      setShowMinModal(false)
      refreshAll()
    } catch {
      // surfaces as unhandled; keep modal open
    } finally {
      setMinSaving(false)
    }
  }

  const openTxAdd = () => {
    setTransactionMode({ type: "add" })
    setTxForm({ productId: null, variationId: null, storeId: null, entryType: "IN", quantity: undefined, reference: "", entryDate: today, notes: "" })
    setTxErrors({})
  }

  const openTxEdit = (s: StockEntry) => {
    setTransactionMode({ type: "edit", entry: s })
    setTxForm({ ...s })
    setTxErrors({})
  }

  const handleTxSave = async () => {
    const errs: Record<string, string> = {}
    if (!txForm.productId) errs.productId = "Required"
    if (!txForm.quantity || Number(txForm.quantity) <= 0) errs.quantity = "Required"
    setTxErrors(errs)
    if (Object.keys(errs).length > 0) return
    const payload = {
      productId: txForm.productId || null,
      variationId: txForm.variationId || null,
      storeId: txForm.storeId || null,
      entryType: txForm.entryType || "IN",
      quantity: Number(txForm.quantity),
      reference: txForm.reference,
      entryDate: txForm.entryDate || today,
      notes: txForm.notes,
    }
    if (transactionMode?.type === "edit" && txForm.id && transactionMode.entry?.id) {
      await updateStock(transactionMode.entry.id, payload)
    } else {
      await addStock(payload)
    }
    setTransactionMode(null)
    refreshAll()
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await removeStock(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
    refreshAll()
  }

  const typeBadge = (type?: string) =>
    type === "OUT" ? (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700"><ArrowUpFromLine className="h-3 w-3" />OUT</span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700"><ArrowDownToLine className="h-3 w-3" />IN</span>
    )

  const statusBadge = (status: string) => {
    if (status === "out")
      return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold bg-red-100 text-red-700"><X className="h-3 w-3" />Out</span>
    if (status === "low")
      return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-700"><AlertTriangle className="h-3 w-3" />Low</span>
    return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3" />In Stock</span>
  }

  const balanceChip = (balance: number) => (
    <span className={`inline-flex items-center justify-center min-w-9 px-2 h-8 rounded-full text-xs font-bold ${balance <= 0 ? "bg-red-100 text-red-700" : balance <= 10 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{balance}</span>
  )

  const variationSelect = (value: string, onChange: (v: string) => void, productId: number) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
    >
      <option value="">Parent stock (no variation)</option>
      {(variationsByProduct.get(productId) || []).map((v) => (
        <option key={v.id} value={v.id}>
          {[v.componentName, v.color, v.size].filter(Boolean).join(" · ") || `Variation #${v.id}`}
        </option>
      ))}
    </select>
  )

  const productSelect = (value: string, onChange: (v: string) => void) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
    >
      <option value="">Select product</option>
      {products.map((p) => (
        <option key={p.id} value={p.id}>{p.name}{productHasVars(p.id) ? " (has variations)" : ""}</option>
      ))}
    </select>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Stock Management</h2>
          <p className="text-sm text-white/80 mt-1">Students Inventory / Stock Management — track every product and variation</p>
        </div>
      </div>

      {lowOutList.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">
              {lowOutList.length} item{lowOutList.length === 1 ? "" : "s"} need attention — {counts.out} out of stock, {counts.low} low
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {lowOutList.slice(0, 12).map((it) => (
                <span key={it.id} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border ${it.status === "out" ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                  {it.name} · {it.balance}
                </span>
              ))}
              {lowOutList.length > 12 && <span className="px-2 py-1 text-[11px] text-amber-700 font-semibold">+{lowOutList.length - 12} more</span>}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Products", value: counts.total, cls: "text-gray-700", icon: Package },
          { label: "In Stock", value: counts.ok, cls: "text-emerald-600", icon: CheckCircle2 },
          { label: "Low", value: counts.low, cls: "text-amber-600", icon: AlertTriangle },
          { label: "Out of Stock", value: counts.out, cls: "text-red-600", icon: Boxes },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center"><c.icon className={`h-5 w-5 ${c.cls}`} /></span>
            <div>
              <div className={`text-2xl font-bold ${c.cls}`}>{c.value}</div>
              <div className="text-xs text-gray-500 font-medium">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button onClick={() => setTab("levels")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "levels" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <Layers className="h-4 w-4" /> Stock Levels
            </button>
            <button onClick={() => setTab("transactions")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "transactions" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <Boxes className="h-4 w-4" /> Transactions
            </button>
          </div>
          {tab === "levels" && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] w-64" placeholder="Search product or variation" />
              </div>
              <button onClick={toggleAllExpand} className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">{allExpanded ? "Collapse All" : "Expand All"}</button>
            </div>
          )}
        </div>

        {tab === "levels" ? (
          <>
            <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-2">
              {(["all", "ok", "low", "out"] as const).map((f) => (
                <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${statusFilter === f ? "bg-[var(--primary)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {f === "all" ? "All" : f === "ok" ? "In Stock" : f === "low" ? "Low" : "Out"}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-500">{rows.length} of {products.length} products</span>
            </div>

            {balancesLoading ? (
              <div className="py-16 text-center text-gray-400 text-sm">Loading stock levels…</div>
            ) : rows.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">No products match</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="w-10 px-2 py-3"></th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Min Stock</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Current</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => {
                      const pid = r.product.id
                      const vars = pid != null ? variationsByProduct.get(pid) || [] : []
                      const isOpen = expanded.has(pid ?? -1)
                      return (
                        <Fragment key={pid}>
                        <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                          <td className="px-2 py-3">
                            {vars.length > 0 && (
                              <button onClick={() => toggleExpand(pid!)} className="p-1 text-gray-400 hover:text-[var(--primary)]">
                                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="h-8 w-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-xs font-bold">{r.product.name.charAt(0)}</span>
                              <div>
                                <div className="font-medium text-gray-800">{r.product.name}</div>
                                {vars.length > 0 && <div className="text-[11px] text-gray-400">{vars.length} variation{vars.length === 1 ? "" : "s"}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.product.code || "-"}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => pid != null && openMin("product", pid, r.product.name, r.product.minStock)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100" title="Edit min stock">
                              {r.minStock} <Pencil className="h-3 w-3" />
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">{balanceChip(r.balance)}</td>
                          <td className="px-4 py-3 text-center">{statusBadge(r.status)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openAdjust(r.product)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700" title="Adjust stock">
                                <ArrowDownToLine className="h-3.5 w-3.5" /> Adjust
                              </button>
                              <button onClick={() => r.product.id != null && openMin("product", r.product.id, r.product.name, r.product.minStock)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Min stock">
                                <SlidersHorizontal className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isOpen && vars.length > 0 && vars.map((v) => {
                          const vb = varBalMap.get(v.id!)?.balance ?? 0
                          const vm = Number(v.minStock ?? 0) || 0
                          const vs = statusOf(vb, vm)
                          return (
                            <tr key={`v-${v.id}`} className="border-b border-gray-100 bg-[var(--primary)]/5">
                              <td className="px-2 py-2.5"></td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2 pl-2">
                                  <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="text-sm text-gray-700">{[v.componentName, v.color, v.size].filter(Boolean).join(" · ") || `Variation #${v.id}`}</span>
                                  {v.sku && <span className="text-[11px] text-gray-400 font-mono">{v.sku}</span>}
                                </div>
                              </td>
                              <td className="px-4 py-2.5"></td>
                              <td className="px-4 py-2.5 text-center">
                                <button onClick={() => openMin("variation", v.id!, `${r.product.name} — ${[v.componentName, v.color, v.size].filter(Boolean).join(" · ")}`, v.minStock)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100">
                                  {vm} <Pencil className="h-3 w-3" />
                                </button>
                              </td>
                              <td className="px-4 py-2.5 text-center">{balanceChip(vb)}</td>
                              <td className="px-4 py-2.5 text-center">{statusBadge(vs)}</td>
                              <td className="px-4 py-2.5 text-right">
                                <button onClick={() => openAdjust(r.product, v)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium hover:bg-emerald-100" title="Adjust variation stock">
                                  <ArrowDownToLine className="h-3 w-3" /> Adjust
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
              <span>Showing {rows.length} of {products.length} products</span>
              {adjustMessage && <span className="text-xs text-red-600">{adjustMessage}</span>}
            </div>
          </>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">{stock.length} ledger entr{stock.length === 1 ? "y" : "ies"}</span>
              <button onClick={openTxAdd} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"><Plus className="h-4 w-4" />Add Stock</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Variation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Store</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reference</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLoading || stock.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-10 text-gray-400">{stockLoading ? "Loading…" : "No stock entries yet"}</td></tr>
                  ) : (
                    stock.map((s, idx) => (
                      <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{productName(s.productId)}</td>
                        <td className="px-4 py-3 text-gray-600">{variationLabel(s.variationId) || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{storeName(s.storeId)}</td>
                        <td className="px-4 py-3">{typeBadge(s.entryType)}</td>
                        <td className="px-4 py-3"><span className="inline-flex items-center justify-center min-w-8 px-2 h-8 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">{s.quantity ?? "-"}</span></td>
                        <td className="px-4 py-3 text-gray-600">{s.entryDate || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{s.reference || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openTxEdit(s)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => { setDeleteId(s.id ?? null); setShowDeleteModal(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showAdjustModal && adjustTarget.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdjustModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Boxes className="h-5 w-5 text-[var(--primary)]" />Adjust Stock</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm">
                <div className="text-gray-500 text-xs">Product</div>
                <div className="font-semibold text-gray-800">{adjustTarget.product.name}</div>
                {adjustTarget.variation && <div className="text-xs text-gray-500 mt-0.5">{[adjustTarget.variation.componentName, adjustTarget.variation.color, adjustTarget.variation.size].filter(Boolean).join(" · ")}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variation</label>
                {variationSelect(adjustForm.variationId, (v) => setAdjustForm((p) => ({ ...p, variationId: v })), Number(adjustForm.productId) || 0)}
                <p className="text-[11px] text-gray-400 mt-1">Leave on "Parent stock" to adjust the product itself.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={adjustForm.entryType} onChange={(e) => setAdjustForm((p) => ({ ...p, entryType: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="IN">IN (add)</option>
                    <option value="OUT">OUT (remove)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min={1} value={adjustForm.quantity} onChange={(e) => { setAdjustForm((p) => ({ ...p, quantity: e.target.value })); if (adjustErrors.quantity) setAdjustErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Qty" />
                  {adjustErrors.quantity && <p className="text-red-500 text-xs mt-1">{adjustErrors.quantity}</p>}
                </div>
              </div>
              {adjustTarget.product.id != null && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
                  {adjustTarget.variation
                    ? `Current variation stock: ${varBalMap.get(adjustTarget.variation.id!)?.balance ?? 0}`
                    : `Current stock: ${productEffective(adjustTarget.product)}`}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={adjustForm.entryDate} onChange={(e) => setAdjustForm((p) => ({ ...p, entryDate: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <input type="text" value={adjustForm.reference} onChange={(e) => setAdjustForm((p) => ({ ...p, reference: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. Purchase #123, Supplier return" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={adjustForm.notes} onChange={(e) => setAdjustForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Optional note" />
              </div>
              {adjustMessage && <p className="text-xs text-red-600">{adjustMessage}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowAdjustModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdjust} disabled={adjustSaving} className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-60">
                {adjustSaving ? "Saving…" : "Save Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMinModal && minTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMinModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {minTarget.kind === "product" ? "Min Stock" : "Variation Min Stock"}
              </h3>
              <button onClick={() => setShowMinModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">{minTarget.label}</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum stock level</label>
                <input type="number" min={0} value={minValue} onChange={(e) => setMinValue(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <p className="text-[11px] text-gray-400 mt-1">Stock at or below this level triggers a Low / Out alert.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowMinModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleMinSave} disabled={minSaving} className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] disabled:opacity-60">
                {minSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {transactionMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setTransactionMode(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">{transactionMode.type === "edit" ? "Edit Stock Entry" : "Add Stock"}</h3>
              <button onClick={() => setTransactionMode(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                {productSelect(String(txForm.productId ?? ""), (v) => { setTxForm((p) => ({ ...p, productId: v ? Number(v) : null, variationId: null })); if (txErrors.productId) setTxErrors({}) })}
                {txErrors.productId && <p className="text-red-500 text-xs mt-1">{txErrors.productId}</p>}
              </div>
              {txForm.productId != null && productHasVars(txForm.productId) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variation</label>
                  {variationSelect(String(txForm.variationId ?? ""), (v) => setTxForm((p) => ({ ...p, variationId: v ? Number(v) : null })), txForm.productId)}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                <select value={String(txForm.storeId ?? "")} onChange={(e) => setTxForm((p) => ({ ...p, storeId: e.target.value ? Number(e.target.value) : null }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Select store</option>
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={txForm.entryType ?? "IN"} onChange={(e) => setTxForm((p) => ({ ...p, entryType: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min={1} value={txForm.quantity ?? ""} onChange={(e) => { setTxForm((p) => ({ ...p, quantity: e.target.value ? Number(e.target.value) : undefined })); if (txErrors.quantity) setTxErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  {txErrors.quantity && <p className="text-red-500 text-xs mt-1">{txErrors.quantity}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={txForm.entryDate ?? today} onChange={(e) => setTxForm((p) => ({ ...p, entryDate: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <input type="text" value={txForm.reference ?? ""} onChange={(e) => setTxForm((p) => ({ ...p, reference: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={txForm.notes ?? ""} onChange={(e) => setTxForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setTransactionMode(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleTxSave} className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">Delete this stock entry? This will change the running balance.</p>
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