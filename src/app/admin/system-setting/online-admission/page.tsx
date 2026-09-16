"use client"

import { useState, useEffect } from "react"
import { Save, Check, Eye, Loader2, X } from "lucide-react"

const fallbackClasses = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`)

export default function OnlineAdmissionPage() {
  const [enabled, setEnabled] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [maxStudents, setMaxStudents] = useState(30)
  const [requireParentEmail, setRequireParentEmail] = useState(true)
  const [requireDocuments, setRequireDocuments] = useState(true)
  const [selectedClasses, setSelectedClasses] = useState<string[]>(["Class 1", "Class 6"])
  const [classOptions, setClassOptions] = useState<string[]>(fallbackClasses)
  const [showPreview, setShowPreview] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/system-setting/online-admission")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return
        if (data.enabled !== undefined) setEnabled(data.enabled)
        if (data.startDate !== undefined) setStartDate(data.startDate)
        if (data.endDate !== undefined) setEndDate(data.endDate)
        if (data.maxStudents !== undefined) setMaxStudents(data.maxStudents)
        if (data.requireParentEmail !== undefined) setRequireParentEmail(data.requireParentEmail)
        if (data.requireDocuments !== undefined) setRequireDocuments(data.requireDocuments)
        if (data.selectedClasses !== undefined) setSelectedClasses(data.selectedClasses)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    fetch("/api/academics/class")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setClassOptions(data.map((c: { name: string }) => c.name))
        }
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/system-setting/online-admission", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, startDate, endDate, maxStudents, requireParentEmail, requireDocuments, selectedClasses }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to save settings")
      setEnabled(Boolean(data.enabled))
      setStartDate(data.startDate || "")
      setEndDate(data.endDate || "")
      setMaxStudents(data.maxStudents)
      setSelectedClasses(Array.isArray(data.selectedClasses) ? data.selectedClasses : [])
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const toggleClass = (cls: string) => {
    setSelectedClasses((prev) => prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls])
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Online Admission</h1>
        <p className="mt-1 text-sm text-white/80">System Setting / Online Admission</p>
      </div>

      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          Settings saved successfully!
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--primary)]" />
          </div>
        ) : (
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
              <span className="text-sm font-medium text-gray-700">Enable Online Admission</span>
            </label>

            {enabled && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admission Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admission End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Students Per Class</label>
                    <input
                      type="number"
                      value={maxStudents}
                      onChange={(e) => setMaxStudents(Number(e.target.value))}
                      min={1}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireParentEmail}
                    onChange={(e) => setRequireParentEmail(e.target.checked)}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="text-sm text-gray-700">Require Parent Email</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireDocuments}
                    onChange={(e) => setRequireDocuments(e.target.checked)}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="text-sm text-gray-700">Require Documents Upload</span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Class Selection</label>
                  <div className="flex flex-wrap gap-3">
                    {classOptions.map((cls) => (
                      <label key={cls} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedClasses.includes(cls)}
                          onChange={() => toggleClass(cls)}
                          className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        <span className="text-sm text-gray-700">{cls}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">Leave all unchecked to allow admission for every class.</p>
                </div>
              </>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" /> {showPreview ? "Hide Preview" : "Preview"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showPreview && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Admission Form Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50/50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Student Name</label>
              <div className="h-9 rounded-lg border border-gray-200 bg-white px-3 flex items-center text-sm text-gray-400">Full Name</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date of Birth</label>
              <div className="h-9 rounded-lg border border-gray-200 bg-white px-3 flex items-center text-sm text-gray-400">DD/MM/YYYY</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
              <div className="h-9 rounded-lg border border-gray-200 bg-white px-3 flex items-center text-sm text-gray-400">
                {selectedClasses.length > 0 ? selectedClasses.join(", ") : "All classes"}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Parent Email {requireParentEmail && "*"}</label>
              <div className="h-9 rounded-lg border border-gray-200 bg-white px-3 flex items-center text-sm text-gray-400">parent@email.com</div>
            </div>
            {requireDocuments && (
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Documents</label>
                <div className="h-9 rounded-lg border border-gray-200 bg-white px-3 flex items-center text-sm text-gray-400">Upload documents...</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
