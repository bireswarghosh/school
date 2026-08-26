"use client"

import { useState } from "react"
import { Save, Check, Loader2 } from "lucide-react"
import { useSchoolSettings } from "@/lib/use-school-settings"

export default function SettingPage() {
  const { settings, loading, save, saving } = useSchoolSettings("onlinecourse.")
  const [includeQuiz, setIncludeQuiz] = useState(true)
  const [includeExam, setIncludeExam] = useState(true)
  const [includeAssignment, setIncludeAssignment] = useState(true)
  const [guestLogin, setGuestLogin] = useState(false)
  const [guestPrefix, setGuestPrefix] = useState("Guest")
  const [guestIdStart, setGuestIdStart] = useState("100")
  const [accessKey, setAccessKey] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [bucketName, setBucketName] = useState("")
  const [region, setRegion] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [savedOk, setSavedOk] = useState(false)

  // Hydrate form from server once settings arrive (render-phase init, runs once)
  const [hydrated, setHydrated] = useState(false)
  if (!loading && !hydrated) {
    setHydrated(true)
    setIncludeQuiz(settings["includeQuiz"] !== "false")
    setIncludeExam(settings["includeExam"] !== "false")
    setIncludeAssignment(settings["includeAssignment"] !== "false")
    setGuestLogin(settings["guestLogin"] === "true")
    setGuestPrefix(settings["guestPrefix"] || "Guest")
    setGuestIdStart(settings["guestIdStart"] || "100")
    setAccessKey(settings["accessKey"] || "")
    setSecretKey(settings["secretKey"] || "")
    setBucketName(settings["bucketName"] || "")
    setRegion(settings["region"] || "")
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!accessKey.trim()) errs.accessKey = "Access Key ID is required"
    if (!secretKey.trim()) errs.secretKey = "Secret Access Key is required"
    if (!bucketName.trim()) errs.bucketName = "Bucket name is required"
    if (!region.trim()) errs.region = "Region is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    const ok = await save({
      "onlinecourse.includeQuiz": String(includeQuiz),
      "onlinecourse.includeExam": String(includeExam),
      "onlinecourse.includeAssignment": String(includeAssignment),
      "onlinecourse.guestLogin": String(guestLogin),
      "onlinecourse.guestPrefix": guestPrefix,
      "onlinecourse.guestIdStart": guestIdStart,
      "onlinecourse.accessKey": accessKey,
      "onlinecourse.secretKey": secretKey,
      "onlinecourse.bucketName": bucketName,
      "onlinecourse.region": region,
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

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Setting</h2>
          <p className="text-sm text-gray-500 mt-1">Online Course / Setting</p>
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
            <h3 className="text-base font-semibold text-gray-800">Course Curriculum Settings</h3>
            <p className="text-xs text-gray-500 mt-0.5">Select which curriculum components to include</p>
          </div>
          <div className="p-5 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeQuiz}
                onChange={(e) => setIncludeQuiz(e.target.checked)}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-gray-700">Online Course Quiz</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeExam}
                onChange={(e) => setIncludeExam(e.target.checked)}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-gray-700">Online Course Exam</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAssignment}
                onChange={(e) => setIncludeAssignment(e.target.checked)}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-gray-700">Online Course Assignment</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">Guest User Settings</h3>
            <p className="text-xs text-gray-500 mt-0.5">Configure guest user access permissions</p>
          </div>
          <div className="p-5 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={guestLogin}
                onChange={(e) => setGuestLogin(e.target.checked)}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-gray-700">Allow guest users to access courses</span>
            </label>
            {guestLogin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Prefix</label>
                  <input
                    type="text"
                    value={guestPrefix}
                    onChange={(e) => setGuestPrefix(e.target.value)}
                    placeholder="Guest"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest ID Start From</label>
                  <input
                    type="text"
                    value={guestIdStart}
                    onChange={(e) => setGuestIdStart(e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">AWS S3 Bucket Settings</h3>
            <p className="text-xs text-gray-500 mt-0.5">Configure AWS S3 for file storage</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key / Access Key ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={accessKey}
                onChange={(e) => { setAccessKey(e.target.value); if (errors.accessKey) setErrors((p) => ({ ...p, accessKey: "" })) }}
                placeholder="Enter your AWS access key ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
              {errors.accessKey && <p className="text-red-500 text-xs mt-1">{errors.accessKey}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Secret / Secret Access Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => { setSecretKey(e.target.value); if (errors.secretKey) setErrors((p) => ({ ...p, secretKey: "" })) }}
                placeholder="Enter your secret access key"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
              {errors.secretKey && <p className="text-red-500 text-xs mt-1">{errors.secretKey}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bucket Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bucketName}
                onChange={(e) => { setBucketName(e.target.value); if (errors.bucketName) setErrors((p) => ({ ...p, bucketName: "" })) }}
                placeholder="Enter your S3 bucket name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
              {errors.bucketName && <p className="text-red-500 text-xs mt-1">{errors.bucketName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => { setRegion(e.target.value); if (errors.region) setErrors((p) => ({ ...p, region: "" })) }}
                placeholder="Enter your AWS region (e.g., us-east-1)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
              {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
            </div>
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
