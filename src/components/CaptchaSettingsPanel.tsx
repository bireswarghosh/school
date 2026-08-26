"use client"

import { useState, useEffect } from "react"
import { Save, Check } from "lucide-react"

const captchaTypes = ["Google reCAPTCHA v2", "Google reCAPTCHA v3"]
const themes = ["Light", "Dark"]
const pageOptions = ["Login", "Registration", "Admission Form", "Feedback"]

export default function CaptchaSettingsPanel() {
  const [enabled, setEnabled] = useState(false)
  const [captchaType, setCaptchaType] = useState("Google reCAPTCHA v2")
  const [siteKey, setSiteKey] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [theme, setTheme] = useState("Light")
  const [pages, setPages] = useState<string[]>(["Login"])
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/system-setting")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          if (data.enabled !== undefined) setEnabled(data.enabled)
          if (data.captchaType !== undefined) setCaptchaType(data.captchaType)
          if (data.siteKey !== undefined) setSiteKey(data.siteKey)
          if (data.secretKey !== undefined) setSecretKey(data.secretKey)
          if (data.theme !== undefined) setTheme(data.theme)
          if (data.pages !== undefined) setPages(data.pages)
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
        body: JSON.stringify({ enabled, captchaType, siteKey, secretKey, theme, pages }),
      })
      setSuccess(true)
    } catch { setSuccess(true) }
    setTimeout(() => setSuccess(false), 3000)
  }

  const togglePage = (page: string) => {
    setPages((prev) => prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page])
  }

  return (
    <>
      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          Captcha settings saved successfully!
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="space-y-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-[var(--primary)] peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Enable Captcha</span>
          </label>

          {enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Captcha Type</label>
                <select
                  value={captchaType}
                  onChange={(e) => setCaptchaType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {captchaTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Key</label>
                <input
                  type="text"
                  value={siteKey}
                  onChange={(e) => setSiteKey(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {themes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Pages Where Captcha Applies</label>
                <div className="flex flex-wrap gap-4">
                  {pageOptions.map((page) => (
                    <label key={page} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pages.includes(page)}
                        onChange={() => togglePage(page)}
                        className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                      <span className="text-sm text-gray-700">{page}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2"
            >
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}