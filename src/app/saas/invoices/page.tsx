"use client"
import { toast as notify } from "@/lib/toast"

import { useCallback, useEffect, useState } from "react"
import { Plus, X, Loader2, Eye, Check, Link2, Mail, CreditCard, Trash2, Download, Filter, Share2 } from "lucide-react"

type InvoiceRow = {
  id: number
  invoice_no: string
  school_id: number
  schoolName?: string
  schoolCode?: string
  plan_name: string | null
  amount: number
  currency: string
  status: string
  due_date: string | null
  paid_at: string | null
  payment_link: string | null
  created_at: string
}

type SchoolOption = { id: number; name: string; code: string }
type PlanOption = { id: number; name: string; price: number }

const emptyForm = {
  schoolId: "",
  planId: "",
  amount: 0,
  currency: "INR",
  dueDate: "",
  status: "due",
  notes: "",
}

export default function SaasInvoices() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [filterSchool, setFilterSchool] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [genLoading, setGenLoading] = useState<number | null>(null)
  const [shareLink, setShareLink] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      let url = "/api/saas/invoices"
      if (filterSchool) url += `?schoolId=${filterSchool}`
      const res = await fetch(url)
      const data = await res.json()
      if (Array.isArray(data)) setInvoices(data)
    } catch {
      setError("Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }, [filterSchool])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  useEffect(() => {
    fetch("/api/saas/schools").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setSchools(d)
    }).catch(() => {})
    fetch("/api/saas/plans").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setPlans(d)
    }).catch(() => {})
  }, [])

  const openCreate = () => {
    setForm(emptyForm)
    setError("")
    setModalOpen(true)
  }

  const handleCreate = async () => {
    if (!form.schoolId) {
      setError("School is required")
      return
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError("Amount must be > 0")
      return
    }
    setSaving(true)
    setError("")
    try {
      const plan = plans.find((p) => p.id === Number(form.planId))
      const res = await fetch("/api/saas/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: Number(form.schoolId),
          planId: form.planId ? Number(form.planId) : null,
          planName: plan?.name || null,
          amount: Number(form.amount),
          currency: form.currency,
          dueDate: form.dueDate || null,
          status: form.status,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Create failed")
        setSaving(false)
        return
      }
      setModalOpen(false)
      await fetchInvoices()
      showToast("Invoice created")
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  const generateLink = async (inv: InvoiceRow) => {
    setGenLoading(inv.id)
    try {
      const res = await fetch("/api/saas/invoices/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inv.id, mode: "checkout" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to generate link")
      await fetchInvoices()
      showToast("Payment link ready")
    } catch (e: any) {
      notify.error(e.message || "Failed to generate link")
    } finally {
      setGenLoading(null)
    }
  }

  const copyLink = async (inv: InvoiceRow) => {
    const link = inv.payment_link || `/saas/pay?invoice=${inv.id}`
    try {
      await navigator.clipboard.writeText(link)
      showToast("Link copied")
    } catch {
      showToast(link)
    }
  }

  const emailLink = (inv: InvoiceRow) => {
    const link = inv.payment_link || `/saas/pay?invoice=${inv.id}`
    const subject = encodeURIComponent(`Payment for invoice ${inv.invoice_no} — Smart School`)
    const body = encodeURIComponent(
      `Hello,\n\nPlease settle invoice ${inv.invoice_no} of ${inv.currency === "INR" ? "₹" : inv.currency} ${Number(inv.amount).toLocaleString("en-IN")}.\n\nPay here: ${link}\n\nThank you.`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self")
  }

  const markPaid = async (inv: InvoiceRow) => {
    if (!confirm(`Mark invoice ${inv.invoice_no} as paid?`)) return
    try {
      const res = await fetch("/api/saas/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inv.id, status: "paid" }),
      })
      const data = await res.json()
      if (!res.ok) {
        notify.error(data.error || "Failed")
        return
      }
      await fetchInvoices()
      showToast("Invoice marked as paid")
    } catch {
      notify.error("Network error")
    }
  }

  const handleDelete = async (inv: InvoiceRow) => {
    if (!confirm(`Delete invoice ${inv.invoice_no}?`)) return
    try {
      const res = await fetch(`/api/saas/invoices?id=${inv.id}`, { method: "DELETE" })
      if (res.ok) {
        setInvoices((prev) => prev.filter((x) => x.id !== inv.id))
        showToast("Invoice deleted")
      } else {
        notify.error("Delete failed")
      }
    } catch {
      notify.error("Network error")
    }
  }

  const publicUrl = (inv: InvoiceRow) =>
    `${window.location.origin}/saas/pay?invoice=${inv.id}`

  const shareInvoice = (inv: InvoiceRow) => setShareLink(publicUrl(inv))

  const statusColor = (s: string) =>
    s === "paid"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
      : s === "failed"
        ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
        : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"

  const visible = invoices.filter(
    (i) => !filterStatus || i.status === filterStatus
  )
  const totalDue = visible.filter((i) => i.status !== "paid").reduce((s, i) => s + Number(i.amount), 0)
  const totalPaid = visible.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0)

  const inputCls =
    "w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--title-color)]">Invoices</h2>
          <p className="text-sm text-[var(--subtitle-color)] mt-1">Generate subscription invoices and payment links</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-xs text-[var(--subtitle-color)]">Total invoices</p>
          <p className="text-2xl font-bold text-[var(--title-color)] mt-1">{visible.length}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-xs text-[var(--subtitle-color)]">Due amount</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">₹ {totalDue.toLocaleString("en-IN")}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-xs text-[var(--subtitle-color)]">Collected</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">₹ {totalPaid.toLocaleString("en-IN")}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-xs text-[var(--subtitle-color)]">Unpaid</p>
          <p className="text-2xl font-bold text-[var(--title-color)] mt-1">
            {visible.filter((i) => i.status !== "paid").length}
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-[var(--subtitle-color)]" />
        <select value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)} className={inputCls + " max-w-[200px]"}>
          <option value="">All schools</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputCls + " max-w-[160px]"}>
          <option value="">All statuses</option>
          <option value="due">Due</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      )}

      {!loading && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--subtitle-color)] border-b border-[var(--border)]">
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">School</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((inv) => (
                  <tr key={inv.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/50">
                    <td className="px-4 py-3 font-semibold text-[var(--primary)]">{inv.invoice_no}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--foreground)]">{inv.schoolName || `School #${inv.school_id}`}</span>
                      <span className="block text-xs text-[var(--subtitle-color)]">{inv.schoolCode || ""}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--foreground)]">{inv.plan_name || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                      {inv.currency === "INR" ? "₹" : inv.currency} {Number(inv.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(inv.status)}`}>
                        {inv.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--subtitle-color)]">{inv.due_date || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => generateLink(inv)}
                          disabled={genLoading === inv.id}
                          title="Generate payment link"
                          className="p-2 text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg"
                        >
                          {genLoading === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                        </button>
                        <button onClick={() => copyLink(inv)} title="Copy link" className="p-2 text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => shareInvoice(inv)} title="Share public link" className="p-2 text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg">
                          <Share2 className="h-4 w-4" />
                        </button>
                        <a
                          href={`/saas/pay?invoice=${inv.id}`}
                          target="_blank"
                          title="Open pay page"
                          className="p-2 text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg inline-flex"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <button onClick={() => emailLink(inv)} title="Email link" className="p-2 text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg">
                          <Mail className="h-4 w-4" />
                        </button>
                        {inv.status !== "paid" && (
                          <button onClick={() => markPaid(inv)} title="Mark paid" className="p-2 text-[var(--subtitle-color)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg">
                            <CreditCard className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(inv)} title="Delete" className="p-2 text-[var(--subtitle-color)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-[var(--subtitle-color)]">
                      <Download className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No invoices match. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-[var(--card)] rounded-2xl shadow-2xl z-10 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Create Invoice</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">School *</label>
                <select value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value })} className={inputCls}>
                  <option value="">Select school</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Plan</label>
                  <select value={form.planId} onChange={(e) => {
                    const p = plans.find((x) => x.id === Number(e.target.value))
                    setForm({ ...form, planId: e.target.value, amount: p ? p.price : form.amount })
                  }} className={inputCls}>
                    <option value="">Custom</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Amount (INR) *</label>
                  <input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Due date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                    <option value="due">Due</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Notes</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} placeholder="Optional" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[var(--border)]">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)]">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Create invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm shadow-xl">
          <Check className="h-4 w-4" />
          {toast}
        </div>
      )}

      {shareLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShareLink(null)} />
          <div className="relative bg-white dark:bg-[var(--card)] rounded-2xl shadow-2xl z-10 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Public payment link</h3>
              <button onClick={() => setShareLink(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--subtitle-color)] mb-3">
              Share this link with the school. Anyone with the link can view and pay the invoice without logging in.
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2.5 bg-[var(--muted)]">
              <Link2 className="h-4 w-4 text-[var(--subtitle-color)] shrink-0" />
              <span className="text-sm text-[var(--foreground)] truncate flex-1">{shareLink}</span>
              <button
                onClick={async () => { await navigator.clipboard.writeText(shareLink); showToast("Link copied") }}
                className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 shrink-0 inline-flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <a
                href={`mailto:?subject=${encodeURIComponent("Invoice payment link")}&body=${encodeURIComponent(`Please pay your pending invoice here: ${shareLink}`)}`}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] inline-flex items-center justify-center gap-2"
              >
                <Mail className="h-4 w-4" /> Email
              </a>
              <a
                href={shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 inline-flex items-center justify-center gap-2"
              >
                <Eye className="h-4 w-4" /> Open
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
