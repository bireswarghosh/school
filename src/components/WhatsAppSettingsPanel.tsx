"use client"

import { useState } from "react"
import { Save, Check, Wifi, WifiOff, Loader2, AlertCircle } from "lucide-react"
import { useSchoolSettings } from "@/lib/use-school-settings"

export default function WhatsAppSettingsPanel() {
  const { settings, loading, saving, error, saveScoped } = useSchoolSettings("whatsapp.")
  const [success, setSuccess] = useState(false)

  const connected = settings.enabled === "1" || settings.enabled === "true"

  const form = {
    number: settings.number ?? "+1234567890",
    apiKey: settings.apiKey ?? "",
    endpoint: settings.endpoint ?? "https://api.whatsapp.com/v1/messages",
    enabled: connected,
  }

  const set = (key: string, value: string) => saveScoped({ [key]: value })

  const handleSave = async () => {
    const ok = await saveScoped({
      number: form.number,
      apiKey: form.apiKey,
      endpoint: form.endpoint,
      enabled: form.enabled ? "1" : "0",
    })
    if (ok) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <>
      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          WhatsApp settings saved!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading settings…
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-gray-800">WhatsApp Configuration</h3>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>
                {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {connected ? "Connected" : "Disconnected"}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  value={form.number}
                  onChange={(e) => set("number", e.target.value)}
                  placeholder="+1234567890"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => set("apiKey", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
                <input
                  type="text"
                  value={form.endpoint}
                  onChange={(e) => set("endpoint", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => set("enabled", e.target.checked ? "1" : "0")}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-gray-700">Enable WhatsApp</span>
              </label>
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}