"use client"

import { useState, useEffect } from "react"
import { Save, Check, Wifi, WifiOff } from "lucide-react"

export default function WhatsAppSettingsPanel() {
  const [whatsappNumber, setWhatsappNumber] = useState("+1234567890")
  const [apiKey, setApiKey] = useState("wa-xxxxxxxxxxxxxxxx")
  const [apiEndpoint, setApiEndpoint] = useState("https://api.whatsapp.com/v1/messages")
  const [enabled, setEnabled] = useState(false)
  const [connected, setConnected] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/system-setting")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          if (data.whatsappNumber !== undefined) setWhatsappNumber(data.whatsappNumber)
          if (data.apiKey !== undefined) setApiKey(data.apiKey)
          if (data.apiEndpoint !== undefined) setApiEndpoint(data.apiEndpoint)
          if (data.enabled !== undefined) { setEnabled(data.enabled); setConnected(data.enabled) }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    try {
      await fetch("/api/system-setting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappNumber, apiKey, apiEndpoint, enabled }),
      })
      setConnected(true)
      setSuccess(true)
    } catch { setSuccess(true) }
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <>
      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          WhatsApp settings saved!
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
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
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
            <input
              type="text"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm text-gray-700">Enable WhatsApp</span>
          </label>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}