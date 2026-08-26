"use client"

import { useState } from "react"
import { Settings, Check, X, Save } from "lucide-react"
import { useApi } from "@/lib/use-api"

type PaymentGateway = {
  id: number
  name: string
  status: boolean
  apiKey: string
  secretKey: string
  mode: string
}

export default function PaymentMethodsPanel() {
  const { data: gateways, update, loading } = useApi<PaymentGateway>("/api/system-setting/payment-gateway")
  const [configureGateway, setConfigureGateway] = useState<PaymentGateway | null>(null)
  const [form, setForm] = useState({ apiKey: "", secretKey: "", mode: "Test", enabled: false })

  const handleConfigure = (gw: PaymentGateway) => {
    setConfigureGateway(gw)
    setForm({ apiKey: gw.apiKey, secretKey: gw.secretKey, mode: gw.mode, enabled: gw.status })
  }

  const handleSave = async () => {
    if (!configureGateway) return
    await update(configureGateway.id, { apiKey: form.apiKey, secretKey: form.secretKey, mode: form.mode, status: form.enabled })
    setConfigureGateway(null)
  }

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["#", "Payment Gateway", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gateways.map((gw, idx) => (
                <tr key={gw.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{gw.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      gw.status ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {gw.status ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {gw.status ? "Active" : "Inactive"}
                    </span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {configureGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Configure - {configureGateway.name}</h3>
              <button onClick={() => setConfigureGateway(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="text"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                <input
                  type="password"
                  value={form.secretKey}
                  onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                <select
                  value={form.mode}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="Live">Live</option>
                  <option value="Test">Test</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-gray-700">Enable Gateway</span>
              </label>
            </div>
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