"use client"

import { useState, useEffect } from "react"
import { Save, Check, Loader2, Settings2, BookOpen, Users, Cloud, ShieldCheck, Sparkles, GraduationCap, FileText, ClipboardList } from "lucide-react"
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
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!loading && !hydrated) {
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
      setHydrated(true)
    }
  }, [loading, hydrated, settings])

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

  if (loading && !hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 animate-pulse" />
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" /></div>
      </div>
    )
  }

  const ToggleCard = ({ checked, onChange, title, desc, icon: Icon, color }: any) => (
    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${checked ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-md" : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"}`}>
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${checked ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}><Icon className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold leading-none ${checked ? "text-white" : "text-gray-800"}`}>{title}</p>
        <p className={`text-xs mt-0.5 ${checked ? "text-white/80" : "text-gray-500"}`}>{desc}</p>
      </div>
      <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-white" : "bg-gray-200"}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6 bg-[var(--primary)]" : "translate-x-1"}`} style={checked ? { background: "#ff7732" } : {}} />
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
    </label>
  )

  return (
    <div className="space-y-6 pb-8">
      {savedOk && (
        <div className="fixed top-4 right-4 z-[100] bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20"><Check className="h-4 w-4" /></span>
          Settings saved successfully!
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/5 blur-xl" />
        <div className="absolute left-1/3 top-1/2 -translate-y-1/2 opacity-10 hidden lg:block"><Settings2 className="h-28 w-28 text-white" /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Settings2 className="h-4 w-4 text-white" /></span>
            Online Course Setting
          </h2>
          <p className="text-sm text-white/70 mt-1">Configure curriculum, guest access and cloud storage • Auto-saved per school</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-indigo-50 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm"><GraduationCap className="h-4 w-4" /></span>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Course Curriculum Settings</h3>
              <p className="text-xs text-gray-500">Select which curriculum components to include</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <ToggleCard checked={includeQuiz} onChange={setIncludeQuiz} title="Quiz" desc="Online Course Quiz" icon={FileText} color="violet" />
            <ToggleCard checked={includeExam} onChange={setIncludeExam} title="Exam" desc="Online Course Exam" icon={ClipboardList} color="emerald" />
            <ToggleCard checked={includeAssignment} onChange={setIncludeAssignment} title="Assignment" desc="Course Assignment" icon={BookOpen} color="amber" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-sky-50 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm"><Users className="h-4 w-4" /></span>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Guest User Settings</h3>
              <p className="text-xs text-gray-500">Configure guest user access permissions</p>
            </div>
            <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full border ${guestLogin ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>{guestLogin ? "Enabled" : "Disabled"}</span>
          </div>
          <div className="p-5 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all" style={guestLogin ? { borderColor: "#ff7732", background: "#fff7f3" } : {}}>
              <input type="checkbox" checked={guestLogin} onChange={(e) => setGuestLogin(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              <span className="text-sm font-medium text-gray-700">Allow guest users to access courses</span>
              <ShieldCheck className="ml-auto h-4 w-4 text-gray-400" />
            </label>
            {guestLogin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Guest Prefix</label>
                  <input type="text" value={guestPrefix} onChange={(e) => setGuestPrefix(e.target.value)} placeholder="Guest"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Guest ID Start From</label>
                  <input type="text" value={guestIdStart} onChange={(e) => setGuestIdStart(e.target.value)} placeholder="100"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 bg-white shadow-sm" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm"><Cloud className="h-4 w-4" /></span>
            <div>
              <h3 className="text-sm font-bold text-gray-800">AWS S3 Bucket Settings</h3>
              <p className="text-xs text-gray-500">Configure AWS S3 for file storage</p>
            </div>
            <Sparkles className="ml-auto h-4 w-4 text-amber-500 hidden sm:block" />
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">API Key / Access Key ID <span className="text-red-500">*</span></label>
              <input type="text" value={accessKey} onChange={(e) => { setAccessKey(e.target.value); if (errors.accessKey) setErrors((p) => ({ ...p, accessKey: "" })) }} placeholder="AKIAIOSFODNN7EXAMPLE"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 bg-white shadow-sm" />
              {errors.accessKey && <p className="text-red-500 text-xs mt-1">{errors.accessKey}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">API Secret / Secret Access Key <span className="text-red-500">*</span></label>
              <input type="password" value={secretKey} onChange={(e) => { setSecretKey(e.target.value); if (errors.secretKey) setErrors((p) => ({ ...p, secretKey: "" })) }} placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 bg-white shadow-sm" />
              {errors.secretKey && <p className="text-red-500 text-xs mt-1">{errors.secretKey}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Bucket Name <span className="text-red-500">*</span></label>
                <input type="text" value={bucketName} onChange={(e) => { setBucketName(e.target.value); if (errors.bucketName) setErrors((p) => ({ ...p, bucketName: "" })) }} placeholder="my-school-bucket"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 bg-white shadow-sm" />
                {errors.bucketName && <p className="text-red-500 text-xs mt-1">{errors.bucketName}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Region <span className="text-red-500">*</span></label>
                <input type="text" value={region} onChange={(e) => { setRegion(e.target.value); if (errors.region) setErrors((p) => ({ ...p, region: "" })) }} placeholder="us-east-1"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 bg-white shadow-sm" />
                {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end sticky bottom-4 z-10">
          <div className="bg-white border border-gray-200 shadow-xl rounded-2xl p-2 flex items-center gap-2">
            <span className="text-xs text-gray-500 px-2 hidden sm:inline">Changes are per-school and take effect immediately</span>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 text-white text-sm font-bold rounded-xl hover:opacity-95 flex items-center gap-2 disabled:opacity-60 shadow-md">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
