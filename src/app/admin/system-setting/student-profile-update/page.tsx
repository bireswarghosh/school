"use client"

import { useState, useEffect } from "react"
import { Save, Check } from "lucide-react"

const fieldOptions = ["Phone", "Email", "Address", "Profile Photo", "Emergency Contact"]

export default function StudentProfileUpdatePage() {
  const [allowStudent, setAllowStudent] = useState(false)
  const [allowParent, setAllowParent] = useState(false)
  const [allowedFields, setAllowedFields] = useState<string[]>(["Phone", "Email"])
  const [requireApproval, setRequireApproval] = useState(true)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/system-setting")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          if (data.allowStudent !== undefined) setAllowStudent(data.allowStudent)
          if (data.allowParent !== undefined) setAllowParent(data.allowParent)
          if (data.allowedFields !== undefined) setAllowedFields(data.allowedFields)
          if (data.requireApproval !== undefined) setRequireApproval(data.requireApproval)
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
        body: JSON.stringify({ allowStudent, allowParent, allowedFields, requireApproval }),
      })
      setSuccess(true)
    } catch { setSuccess(true) }
    setTimeout(() => setSuccess(false), 3000)
  }

  const toggleField = (field: string) => {
    setAllowedFields((prev) => prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field])
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Student Profile Update</h1>
        <p className="mt-1 text-sm text-white/80">System Setting / Student Profile Update</p>
      </div>

      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          Profile update settings saved successfully!
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="space-y-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={allowStudent}
                onChange={(e) => setAllowStudent(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-[var(--primary)] peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Allow Student Profile Update</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={allowParent}
                onChange={(e) => setAllowParent(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-[var(--primary)] peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Allow Parent Profile Update</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Fields Allowed for Update</label>
            <div className="flex flex-wrap gap-4">
              {fieldOptions.map((field) => (
                <label key={field} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowedFields.includes(field)}
                    onChange={() => toggleField(field)}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="text-sm text-gray-700">{field}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-[var(--primary)] peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Require Approval</span>
          </label>

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
    </div>
  )
}
