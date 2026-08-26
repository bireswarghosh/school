"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Save, CheckCircle2, Info, X } from "lucide-react"

type Settings = {
  razorpayEnabled: boolean
  razorpayKeyId: string
  hasSecret: boolean
  currency: string
  callbackUrl: string
}

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [form, setForm] = useState({
    razorpayEnabled: false,
    razorpayKeyId: "",
    razorpayKeySecret: "",
    currency: "INR",
    callbackUrl: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/saas/payment-settings")
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Failed to load")
      setSettings(d)
      setForm({
        razorpayEnabled: Boolean(d.razorpayEnabled),
        razorpayKeyId: d.razorpayKeyId || "",
        razorpayKeySecret: "",
        currency: d.currency || "INR",
        callbackUrl: d.callbackUrl || "",
      })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true)
    setError("")
    setSuccess("")
    const payload: Record<string, any> = {
      razorpayEnabled: form.razorpayEnabled,
      razorpayKeyId: form.razorpayKeyId,
      currency: form.currency,
      callbackUrl: form.callbackUrl,
    }
    if (form.razorpayKeySecret.trim()) payload.razorpayKeySecret = form.razorpayKeySecret
    else if (settings?.hasSecret && !form.razorpayKeySecret) {
      // keep existing secret (do not send secret field)
    }
    try {
      const res = await fetch("/api/saas/payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (!res.ok) return setError(d.error || "Save failed")
      setSettings(d)
      setForm((f) => ({ ...f, razorpayKeyId: d.razorpayKeyId, razorpayKeySecret: "", currency: d.currency, callbackUrl: d.callbackUrl, razorpayEnabled: d.razorpayEnabled }))
      setSuccess("Payment gateway settings saved")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  const inputCls =
    "w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">Payment Gateway Settings</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">Configure Razorpay for invoice payments</p>
      </div>

      <div className="glass-panel rounded-2xl p-6 space-y-5">
        <label className="flex items-center justify-between rounded-xl border border-[var(--border)] p-4 cursor-pointer">
          <div>
            <p className="font-semibold text-[var(--foreground)]">Enable Razorpay</p>
            <p className="text-xs text-[var(--subtitle-color)]">Allow invoices to be paid via Razorpay online</p>
          </div>
          <input
            type="checkbox"
            checked={form.razorpayEnabled}
            onChange={(e) => setForm({ ...form, razorpayEnabled: e.target.checked })}
            className="h-5 w-5 accent-[var(--primary)]"
          />
        </label>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">Razorpay Key ID</label>
          <input value={form.razorpayKeyId} onChange={(e) => setForm({ ...form, razorpayKeyId: e.target.value })} className={inputCls} placeholder="rzp_live_xxxxxxxxxxxx" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">
            Razorpay Key Secret {settings?.hasSecret && <span className="text-xs text-emerald-600 font-normal">(currently set — leave blank to keep)</span>}
          </label>
          <input
            type="password"
            value={form.razorpayKeySecret}
            onChange={(e) => setForm({ ...form, razorpayKeySecret: e.target.value })}
            className={inputCls}
            placeholder={settings?.hasSecret ? "••••••••  (leave blank to keep current)" : "rzp_live_xxxxxxxxxxxx"}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">Currency</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputCls}>
              <option value="INR">INR — Indian Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="AED">AED — UAE Dirham</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">Default payload note</label>
            <p className="text-xs text-[var(--subtitle-color)] pt-2">Currencies shown are for reference.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">Callback URL (after payment)</label>
          <input value={form.callbackUrl} onChange={(e) => setForm({ ...form, callbackUrl: e.target.value })} className={inputCls} placeholder="https://yourdomain.com/saas/pay/callback" />
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 p-3 text-xs text-blue-700 dark:text-blue-300">
          <Info className="h-4 w-4 shrink-0" />
          Invoices expose a public payment link (/saas/pay?invoice=ID) that anyone — without logging in — can open and pay. When Razorpay is enabled, payments are verified against the gateway before the invoice is marked paid.
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> {success}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={load} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] inline-flex items-center gap-2">
            <X className="h-4 w-4" /> Reset
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </button>
        </div>
      </div>
    </div>
  )
}