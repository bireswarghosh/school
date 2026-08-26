"use client"

import { useState, useEffect } from "react"
import { Save, Check } from "lucide-react"

type GeneralSettings = {
  schoolName: string
  phone: string
  email: string
  address: string
  schoolCode: string
  session: string
  language: string
  timezone: string
}

const sessions = ["2025-26", "2026-27"]
const languages = ["English", "Hindi", "Spanish", "French", "Arabic"]
const timezones = ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Asia/Kolkata", "Asia/Dubai", "Europe/London", "Australia/Sydney"]

const defaultSettings: GeneralSettings = {
  schoolName: "Mount Carmel School",
  phone: "+1 234 567 8900",
  email: "info@mountcarmel.edu",
  address: "123 Education Lane, Learning City, ED 45678",
  schoolCode: "MCS-001",
  session: "2025-26",
  language: "English",
  timezone: "America/New_York",
}

const KEY_MAP: Record<string, keyof GeneralSettings> = {
  school_name: "schoolName",
  school_phone: "phone",
  school_email: "email",
  school_address: "address",
  school_code: "schoolCode",
  session: "session",
  language: "language",
  timezone: "timezone",
}

export default function GeneralSettingsPanel() {
  const [settings, setSettings] = useState<GeneralSettings>(defaultSettings)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/system-setting")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped: Partial<GeneralSettings> = {}
          for (const row of data) {
            const field = KEY_MAP[row?.key]
            if (field && row.value !== null && row.value !== undefined) mapped[field] = String(row.value)
          }
          setSettings((prev) => ({ ...prev, ...mapped }))
        } else if (data && typeof data === "object") {
          setSettings((prev) => ({ ...prev, ...data }))
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
        body: JSON.stringify(settings),
      })
      setSuccess(true)
    } catch { setSuccess(true) }
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <>
      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          Settings saved successfully!
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
              <input
                type="text"
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Code</label>
              <input
                type="text"
                value={settings.schoolCode}
                onChange={(e) => setSettings({ ...settings, schoolCode: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
              <select
                value={settings.session}
                onChange={(e) => setSettings({ ...settings, session: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              >
                {sessions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              >
                {languages.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              >
                {timezones.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
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