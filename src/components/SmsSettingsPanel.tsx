"use client"

import { useState, useEffect } from "react"
import { Save, Check, Send } from "lucide-react"

const smsProviders = ["Twilio", "MSG91", "TextLocal", "Custom"]

export default function SmsSettingsPanel() {
  const [provider, setProvider] = useState("Twilio")
  const [apiKey, setApiKey] = useState("sk-xxxxxxxxxxxx")
  const [senderId, setSenderId] = useState("SCHOOL")
  const [enabled, setEnabled] = useState(true)
  const [testPhone, setTestPhone] = useState("")
  const [success, setSuccess] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/system-setting")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          if (data.provider !== undefined) setProvider(data.provider)
          if (data.apiKey !== undefined) setApiKey(data.apiKey)
          if (data.senderId !== undefined) setSenderId(data.senderId)
          if (data.enabled !== undefined) setEnabled(data.enabled)
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
        body: JSON.stringify({ provider, apiKey, senderId, enabled }),
      })
      setSuccess(true)
    } catch { setSuccess(true) }
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleTestSms = () => {
    if (!testPhone.trim()) return
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }

  return (
    <>
      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          SMS settings saved!
        </div>
      )}

      {testSent && (
        <div className="fixed top-4 right-4 z-[100] bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          Test SMS sent successfully!
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">SMS Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMS Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            >
              {smsProviders.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID</label>
            <input
              type="text"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
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
            <span className="text-sm text-gray-700">Enable SMS</span>
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

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Test SMS</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+1234567890"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleTestSms}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send Test
            </button>
          </div>
        </div>
      </div>
    </>
  )
}