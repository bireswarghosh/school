"use client"

import { useState, useEffect } from "react"
import { Save, Check, Bell, Smartphone, Mail, MessageSquare, Calendar, DollarSign } from "lucide-react"

type NotificationToggle = {
  key: string
  label: string
  icon: React.ReactNode
  enabled: boolean
}

const initialToggles: NotificationToggle[] = [
  { key: "studentLogin", label: "Student Login Notification", icon: <Bell className="h-5 w-5" />, enabled: true },
  { key: "parentLogin", label: "Parent Login Notification", icon: <Bell className="h-5 w-5" />, enabled: true },
  { key: "sms", label: "SMS Notification", icon: <Smartphone className="h-5 w-5" />, enabled: false },
  { key: "email", label: "Email Notification", icon: <Mail className="h-5 w-5" />, enabled: true },
  { key: "push", label: "Push Notification", icon: <MessageSquare className="h-5 w-5" />, enabled: false },
  { key: "holiday", label: "Holiday Notification", icon: <Calendar className="h-5 w-5" />, enabled: true },
  { key: "feeReminder", label: "Fee Reminder Notification", icon: <DollarSign className="h-5 w-5" />, enabled: true },
]

export default function NotificationSettingsPanel() {
  const [toggles, setToggles] = useState<NotificationToggle[]>(initialToggles)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/system-setting")
      .then((r) => r.json())
      .then((data) => { if (data?.notificationToggles) setToggles(data.notificationToggles) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggle = (key: string) => {
    setToggles((prev) => prev.map((t) => (t.key === key ? { ...t, enabled: !t.enabled } : t)))
  }

  const handleSave = async () => {
    try {
      await fetch("/api/system-setting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationToggles: toggles }),
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
          Notification settings saved!
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Notification Preferences</h3>
        {loading ? (
          <p className="py-6 text-center text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-4">
            {toggles.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-[var(--primary)]">{item.icon}</div>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <button
                  onClick={() => toggle(item.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    item.enabled ? "bg-[var(--primary)]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      item.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>
    </>
  )
}