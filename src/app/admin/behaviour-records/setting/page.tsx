"use client"

import { useState } from "react"
import { Save, Check, Loader2 } from "lucide-react"
import { useSchoolSettings } from "@/lib/use-school-settings"

export default function BehaviourSettingPage() {
  const { settings, loading, save, saving } = useSchoolSettings("behaviour.")
  const [studentComment, setStudentComment] = useState(false)
  const [parentComment, setParentComment] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  // Hydrate form from server once settings arrive (render-phase init, runs once)
  const [hydrated, setHydrated] = useState(false)
  if (!loading && !hydrated) {
    setHydrated(true)
    setStudentComment(settings["studentComment"] === "true")
    setParentComment(settings["parentComment"] === "true")
  }

  const handleSave = async () => {
    await save({
      "behaviour.studentComment": String(studentComment),
      "behaviour.parentComment": String(parentComment),
    })
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

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Setting</h2>
          <p className="text-sm text-gray-500 mt-1">Behaviour Records / Setting</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Comment Settings</h3>
              <p className="text-xs text-gray-500 mt-0.5">Enable or disable comments on incidents</p>
            </div>
            <div className="p-5 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={studentComment}
                  onChange={(e) => setStudentComment(e.target.checked)}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-gray-700">Allow Student to Comment on Incident</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={parentComment}
                  onChange={(e) => setParentComment(e.target.checked)}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-gray-700">Allow Parent to Comment on Incident</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
