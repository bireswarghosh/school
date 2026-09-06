"use client"

import { useState } from "react"
import { Settings, Save, X, Check, Loader2, FlaskConical } from "lucide-react"
import { useApi } from "@/lib/use-api"

type PaymentGateway = {
  id: number
  name: string
  code?: string
  status: boolean
  apiKey: string
  secretKey: string
  mode: string
  configured?: boolean
  demo?: boolean
  demoApiKey?: string
  demoSecretKey?: string
}

export default function PaymentMethodsPanel() {
  const { data: gateways, update, loading, error } = useApi<PaymentGateway>("/api/system-setting/payment-gateway")
  const [configureGateway, setConfigureGateway] = useState<PaymentGateway | null>(null)
  const [form, setForm] = useState({ apiKey: "", secretKey: "", mode: "Test", enabled: false })
  const [savingId, setSavingId] = useState<number | null>(null)
  const [saveError, setSaveError] = useState("")

  const handleConfigure = (gw: PaymentGateway) => {
    setConfigureGateway(gw)
    setForm({
      apiKey: gw.apiKey || "",
      secretKey: gw.secretKey || "",
      mode: gw.mode || "Test",
      enabled: Boolean(gw.status),
    })
    setSaveError("")
  }

  const handleSave = async () => {
    if (!configureGateway) return
    setSaveError("")
    try {
      await update(configureGateway.id, {
        apiKey: form.apiKey,
        secretKey: form.secretKey,
        mode: form.mode,
        status: form.enabled,
      })
      setConfigureGateway(null)
    } catch (e: any) {
      setSaveError(e.message || "Failed to save")
    }
  }

  const handleToggle = async (gw: PaymentGateway) => {
    setSavingId(gw.id)
    setSaveError("")
    try {
      await update(gw.id, { status: !gw.status })
    } catch (e: any) {
      setSaveError(e.message || "Failed to update gateway")
    } finally {
      setSavingId(null)
    }
  }

  const fillDemo = () => {
    if (!configureGateway) return
    setForm((f) => ({
      ...f,
      apiKey: configureGateway.demoApiKey || f.apiKey,
      secretKey: configureGateway.demoSecretKey || f.secretKey,
    }))
  }

  const maskKey = (k: string) => {
    const s = k || ""
    if (!s) return "Not configured"
    if (s.length <= 8) return "••••"
    return `${s.slice(0, 6)}••••${s.slice(-4)}`
  }

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Payment Gateways</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Enable one or more gateways. Students and parents who pay fees online will see the enabled gateways and can
            choose one. All gateways are preloaded with <span className="font-medium">demo (Test) credentials</span>.
          </p>
        </div>
        {error && <div className="px-4 py-2 text-xs text-red-600">{error}</div>}
        {saveError && <div className="px-4 py-2 text-xs text-red-600">{saveError}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["#", "Payment Gateway", "Mode", "Configured", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading gateways…
                  </td>
                </tr>
              ) : gateways.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-gray-500">No gateways configured.</td>
                </tr>
              ) : (
                gateways.map((gw, idx) => (
                  <tr key={gw.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{gw.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{gw.code}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        (gw.mode || "Test") === "Live" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {(gw.mode || "Test") === "Live" ? "Live" : "Test"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <div>{gw.configured ? "Keys saved" : "No keys"}</div>
                      <div className="text-gray-400">{maskKey(gw.apiKey)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(gw)}
                        disabled={savingId === gw.id}
                        className="inline-flex items-center gap-1.5 text-xs font-medium"
                      >
                        <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          gw.status ? "bg-green-500" : "bg-gray-300"
                        }`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            gw.status ? "translate-x-[18px]" : "translate-x-0.5"
                          }`} />
                        </span>
                        <span className={gw.status ? "text-green-600" : "text-gray-500"}>
                          {gw.status ? "Active" : "Inactive"}
                        </span>
                      </button>
                      {savingId === gw.id && <Loader2 className="inline h-3 w-3 animate-spin text-gray-400 ml-1" />}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleConfigure(gw)}
                        className="flex items-center gap-1 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium"
                      >
                        <Settings className="h-4 w-4" /> Configure
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {configureGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-gray-800">Configure - {configureGateway.name}</h3>
              <button onClick={() => setConfigureGateway(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Use the demo (Test) credentials below to preview the gateway, or paste your own API / secret keys for that
              provider. Students and parents can pay through every <span className="font-medium">active</span> gateway.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="text"
                  value={form.apiKey || ""}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                <input
                  type="password"
                  value={form.secretKey || ""}
                  onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              {configureGateway.demo && (
                <button
                  onClick={fillDemo}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
                >
                  <FlaskConical className="h-3.5 w-3.5" /> Use demo (Test) credentials
                </button>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                <select
                  value={form.mode || "Test"}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="Test">Test (Demo)</option>
                  <option value="Live">Live</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.enabled)}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-gray-700">Enable this gateway for students / parents</span>
              </label>
            </div>
            {saveError && <div className="mt-3 text-xs text-red-600">{saveError}</div>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfigureGateway(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2"
              >
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}