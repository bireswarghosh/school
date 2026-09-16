"use client"

import { useState } from "react"
import { Save, Check, AlertCircle, Loader2 } from "lucide-react"
import { useSchoolSettings } from "@/lib/use-school-settings"

const sessions = ["2024-25", "2025-26", "2026-27", "2027-28"]
const sessionStartMonths = ["January", "April", "June", "July", "August", "November"]
const dateFormats = ["d-m-Y", "d/m/Y", "m/d/Y", "Y-m-d", "Y/m/d", "d M, Y"]
const weekStarts = ["Monday", "Sunday", "Saturday"]
const currencyFormats = ["₹ (INR)", "$ (USD)", "€ (EUR)", "£ (GBP)", "AED", "¥ (JPY)"]
const timezones = [
  "UTC", "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "America/New_York",
  "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London",
  "Europe/Paris", "Australia/Sydney",
]
const languages = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Spanish", "Arabic", "French"]

const defaults = {
  schoolName: "Smart School",
  schoolCode: "DEFAULT",
  phone: "",
  email: "",
  address: "",
  website: "",
  session: "2025-26",
  sessionStartMonth: "April",
  dateFormat: "d-m-Y",
  timezone: "Asia/Kolkata",
  startDayOfWeek: "Monday",
  currencyFormat: "₹ (INR)",
  language: "English",
  baseUrl: "",
  fileUploadPath: "",
}

export default function GeneralSettingsPanel() {
  const { settings, loading, saving, error, saveScoped } = useSchoolSettings("general.")
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const form = { ...defaults, ...settings, ...draft }

  const set = (key: string, value: string) => setDraft((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    const next: Record<string, string> = { ...form }
    const dflt = defaults as Record<string, string>
    // Profile-linked fields are always sent so clears/edits stay in sync with
    // the super admin panel's school profile.
    const PROFILE_LINKED = ["schoolName", "schoolCode", "email", "phone", "address", "currencyFormat", "timezone"]
    for (const k of Object.keys(next)) {
      if (PROFILE_LINKED.includes(k)) continue
      if (next[k] === dflt[k]) delete next[k]
    }
    const ok = await saveScoped(next)
    if (ok) {
      setDraft({})
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  const field = (label: string, key: keyof typeof form, type: "text" | "email" | "url" = "text") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key] || ""}
        onChange={(e) => set(key, e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
      />
    </div>
  )

  const selectField = (label: string, key: keyof typeof form, options: string[]) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={form[key] || ""}
        onChange={(e) => set(key, e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )

  return (
    <>
      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" /> Settings saved successfully!
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {field("School Name", "schoolName")}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Code</label>
                <input
                  type="text"
                  value={form.schoolCode || ""}
                  disabled
                  readOnly
                  title="School code is set on the super admin panel"
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Login code — managed on the super admin panel</p>
              </div>
              {field("Phone", "phone")}
              {field("Email", "email", "email")}
              {field("Website", "website", "url")}
              {selectField("Session", "session", sessions)}
              {selectField("Session Start Month", "sessionStartMonth", sessionStartMonths)}
              {selectField("Date Format", "dateFormat", dateFormats)}
              {selectField("Start Day of Week", "startDayOfWeek", weekStarts)}
              {selectField("Timezone", "timezone", timezones)}
              {selectField("Currency Format", "currencyFormat", currencyFormats)}
              {selectField("Language", "language", languages)}
              {field("Base URL", "baseUrl", "url")}
              {field("File Upload Path", "fileUploadPath")}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={form.address || ""}
                onChange={(e) => set("address", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
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
        )}
      </div>
    </>
  )
}