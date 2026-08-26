"use client"

import { useState } from "react"
import { Save, Check, Loader2 } from "lucide-react"
import { useSchoolSettings } from "@/lib/use-school-settings"

export default function GmeetSettingPage() {
  const { settings, loading, save, saving } = useSchoolSettings("gmeet.")
  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [useGoogleCalendar, setUseGoogleCalendar] = useState("disabled")
  const [parentLiveClass, setParentLiveClass] = useState("enabled")
  const [savedOk, setSavedOk] = useState(false)

  // Hydrate form from server once settings arrive (render-phase init, runs once)
  const [hydrated, setHydrated] = useState(false)
  if (!loading && !hydrated) {
    setHydrated(true)
    setApiKey(settings["apiKey"] || "")
    setApiSecret(settings["apiSecret"] || "")
    setUseGoogleCalendar(settings["useGoogleCalendar"] || "disabled")
    setParentLiveClass(settings["parentLiveClass"] || "enabled")
  }

  const handleSave = async () => {
    const ok = await save({
      "gmeet.apiKey": apiKey,
      "gmeet.apiSecret": apiSecret,
      "gmeet.useGoogleCalendar": useGoogleCalendar,
      "gmeet.parentLiveClass": parentLiveClass,
    })
    if (!ok) return
    setSavedOk(true)
    setTimeout(() => setSavedOk(false), 3000)
  }

  return (
    <div className="space-y-6">
      {savedOk && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          Settings saved successfully!
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-800">Gmeet Live Class Setting</h2>
        <p className="text-sm text-gray-500 mt-1">Gmeet Live Classes / Setting</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
      <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">API Configuration</h3>
            <p className="text-xs text-gray-500 mt-0.5">Configure Google API Key and Secret for Google Meet integration</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Google API Key</label>
                <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Google API key"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Google API Secret</label>
                <input type="text" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Enter your Google API secret"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">Use Google Calendar API</h3>
            <p className="text-xs text-gray-500 mt-0.5">Enable to use Google Calendar API for creating live classes and meetings automatically</p>
          </div>
          <div className="p-5 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="useGoogleCalendar" value="enabled" checked={useGoogleCalendar === "enabled"}
                onChange={(e) => setUseGoogleCalendar(e.target.value)}
                className="text-[var(--primary)] focus:ring-[var(--primary)]" />
              <span className="text-sm text-gray-700">Enable</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="useGoogleCalendar" value="disabled" checked={useGoogleCalendar === "disabled"}
                onChange={(e) => setUseGoogleCalendar(e.target.value)}
                className="text-[var(--primary)] focus:ring-[var(--primary)]" />
              <span className="text-sm text-gray-700">Disable</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">Parent Live Class</h3>
            <p className="text-xs text-gray-500 mt-0.5">Allow parents to join live classes from parent panel</p>
          </div>
          <div className="p-5 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="parentLiveClass" value="enabled" checked={parentLiveClass === "enabled"}
                onChange={(e) => setParentLiveClass(e.target.value)}
                className="text-[var(--primary)] focus:ring-[var(--primary)]" />
              <span className="text-sm text-gray-700">Enable</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="parentLiveClass" value="disabled" checked={parentLiveClass === "disabled"}
                onChange={(e) => setParentLiveClass(e.target.value)}
                className="text-[var(--primary)] focus:ring-[var(--primary)]" />
              <span className="text-sm text-gray-700">Disable</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </form>
      )}
    </div>
  )
}
