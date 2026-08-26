"use client"
import { toast as notify } from "@/lib/toast"

import { useEffect, useState, useCallback } from "react"
import { Plus, Pencil, Trash2, X, Crown, Loader2, Check, Eye } from "lucide-react"
import { currencySymbol } from "@/lib/currencies"

type PlanRow = {
  id: number
  code: string
  name: string
  price: number
  billing_period: string
  max_students: number
  max_staff: number
  features: string[]
  description: string | null
  status: string
}

const emptyForm = {
  name: "",
  code: "",
  price: 0,
  billing_period: "monthly",
  max_students: 0,
  max_staff: 0,
  features: "",
  description: "",
  status: "Active",
}

export default function SaasPlans() {
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PlanRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/saas/plans")
      const data = await res.json()
      if (Array.isArray(data)) setPlans(data)
    } catch {
      setError("Failed to load plans")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError("")
    setModalOpen(true)
  }

  const openEdit = (p: PlanRow) => {
    setEditing(p)
    setForm({
      name: p.name,
      code: p.code,
      price: Number(p.price) || 0,
      billing_period: p.billing_period,
      max_students: p.max_students,
      max_staff: p.max_staff,
      features: Array.isArray(p.features) ? p.features.join("\n") : "",
      description: p.description || "",
      status: p.status,
    })
    setError("")
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Plan name is required")
      return
    }
    setSaving(true)
    setError("")
    const features = form.features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean)
    try {
      const payload = editing
        ? { id: editing.id, name: form.name, price: form.price, billingPeriod: form.billing_period, maxStudents: form.max_students, maxStaff: form.max_staff, features, description: form.description, status: form.status }
        : { ...form, features }
      const res = await fetch("/api/saas/plans", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Save failed")
        setSaving(false)
        return
      }
      setModalOpen(false)
      await fetchPlans()
      showToast(editing ? "Plan updated" : "Plan created")
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: PlanRow) => {
    if (!confirm(`Delete plan "${p.name}"?`)) return
    try {
      const res = await fetch(`/api/saas/plans?id=${p.id}`, { method: "DELETE" })
      const data = await res.json()
      if (res.ok) {
        setPlans((prev) => prev.filter((x) => x.id !== p.id))
        showToast("Plan deleted")
      } else {
        notify.error(data.error || "Delete failed")
      }
    } catch {
      notify.error("Network error")
    }
  }

  const toggleStatus = async (p: PlanRow) => {
    const next = p.status === "Active" ? "Inactive" : "Active"
    try {
      await fetch("/api/saas/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, status: next }),
      })
      setPlans((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)))
    } catch {
      notify.error("Failed to update status")
    }
  }

  const inputCls =
    "w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--title-color)]">Plans</h2>
          <p className="text-sm text-[var(--subtitle-color)] mt-1">Create billing plans and assign them to schools</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Plan
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {!loading &&
          plans.map((p) => (
            <div key={p.id} className="glass-panel rounded-2xl p-6 flex flex-col relative">
              <span
                onClick={() => toggleStatus(p)}
                className={`absolute top-4 right-4 cursor-pointer px-2.5 py-1 rounded-full text-xs font-medium ${
                  p.status === "Active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" : "bg-red-50 text-red-600 dark:bg-red-950/40"
                }`}
              >
                {p.status || "Active"}
              </span>
              <div className="h-12 w-12 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] mb-4">
                <Crown className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[var(--title-color)]">{p.name}</h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold text-[var(--foreground)]">₹ {Number(p.price).toLocaleString("en-IN")}</span>
                <span className="text-xs text-[var(--subtitle-color)]">/{p.billing_period}</span>
              </div>
              <p className="text-xs text-[var(--subtitle-color)] mt-1">{p.description}</p>
              <ul className="mt-4 space-y-2 flex-1">
                {(Array.isArray(p.features) ? p.features : []).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-[var(--border)] text-xs text-[var(--subtitle-color)]">
                <span>Max students: {p.max_students || "∞"} · Staff: {p.max_staff || "∞"}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(p)} className="p-2 text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(p)} className="p-2 text-[var(--subtitle-color)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {!loading && plans.length === 0 && (
        <div className="text-center py-16 text-[var(--subtitle-color)]">
          <Crown className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No plans yet. Create your first billing plan.</p>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-[var(--card)] rounded-2xl shadow-2xl z-10 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">{editing ? "Edit Plan" : "Add Plan"}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Plan name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Premium" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Code</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={inputCls} placeholder="PREMIUM" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Price (INR)</label>
                  <input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className={inputCls} placeholder="5999" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Billing</label>
                  <select value={form.billing_period} onChange={(e) => setForm({ ...form, billing_period: e.target.value })} className={inputCls}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Max students</label>
                  <input type="number" min={0} value={form.max_students} onChange={(e) => setForm({ ...form, max_students: parseInt(e.target.value) || 0 })} className={inputCls} placeholder="0 = unlimited" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Max staff</label>
                  <input type="number" min={0} value={form.max_staff} onChange={(e) => setForm({ ...form, max_staff: parseInt(e.target.value) || 0 })} className={inputCls} placeholder="0 = unlimited" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Features (one per line)</label>
                <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={4} className={inputCls} placeholder={"Online exams\nReports\nLive classes"} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} placeholder="Short description" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[var(--border)]">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)]">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm shadow-xl">
          <Eye className="h-4 w-4" />
          {toast}
        </div>
      )}
    </div>
  )
}
