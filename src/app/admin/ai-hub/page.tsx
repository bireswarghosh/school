"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  Sparkles,
  MessageSquare,
  FileText,
  GraduationCap,
  BookOpen,
  FileBarChart,
  PenTool,
  Settings,
  Check,
  X,
  Loader2,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react"
import { AI_PROVIDERS } from "@/lib/ai-providers"

type ClassItem = { id: number; name: string }
type SectionItem = { id: number; class_id: number; name: string }

type StudentData = {
  name: string
  rollNo: string
  gender: string
  attendance: { present: number; absent: number; late: number; total: number; percentage: number } | null
  exam: { totalMarks: number; maxMarks: number; percentage: number; subjects: { subject: string; marks: number; max: number }[] } | null
  fees: { totalPaid: number; totalDue: number; pendingItems: string[] } | null
}

type InsightPayload = {
  class: string
  section: string
  totalStudents: number
  classSummary: {
    attendanceRate: number | null
    avgExamPercentage: number | null
    totalPendingFees: number
    totalCollectedFees: number
  }
  students: StudentData[]
}

const features = [
  { icon: MessageSquare, title: "AI Assistant", description: "Ask questions about students, fees, attendance and get instant answers from your school data.", color: "bg-blue-500" },
  { icon: BookOpen, title: "Lesson Planner", description: "Generate detailed, curriculum-aligned lesson plans for any class and subject in seconds.", color: "bg-green-500" },
  { icon: PenTool, title: "Question Generator", description: "Create chapter-wise question papers, worksheets and MCQ quizzes with answer keys.", color: "bg-purple-500" },
  { icon: GraduationCap, title: "Student Insights", description: "Get behaviour and performance summaries that help teachers personalize learning.", color: "bg-orange-500", id: "student-insights" },
  { icon: FileText, title: "Homework Assistant", description: "Draft homework assignments and revision notes tailored to the syllabus.", color: "bg-pink-500" },
  { icon: FileBarChart, title: "Report Card Comments", description: "Write professional, personalized progress report comments for every student.", color: "bg-indigo-500" },
]

type TestStatus = "idle" | "testing" | "ok" | "fail"
type InsightTab = "overview" | "attendance" | "exams" | "fees" | "report"

export default function AiHubPage() {
  const [provider, setProvider] = useState("openai")
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null)
  const [testStatus, setTestStatus] = useState<Record<string, TestStatus>>({})
  const [testMsg, setTestMsg] = useState<Record<string, string>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

  // Insights modal state
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [selClass, setSelClass] = useState("")
  const [selSection, setSelSection] = useState("")
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsResult, setInsightsResult] = useState<{ insights: string; data: InsightPayload } | null>(null)
  const [insightsError, setInsightsError] = useState("")
  const [insightTab, setInsightTab] = useState<InsightTab>("overview")

  const notify = (ok: boolean, msg: string) => { setToast({ ok, msg }); setTimeout(() => setToast(null), 3500) }

  useEffect(() => {
    fetch("/api/ai/settings").then(r => r.ok ? r.json() : null).then(data => {
      if (data) {
        setProvider(data.provider || "openai")
        const next: Record<string, string> = {}
        for (const p of AI_PROVIDERS) next[p.id] = data[p.id] || ""
        setKeys(next)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { if (insightsOpen) { fetch("/api/classes").then(r => r.ok ? r.json() : []).then(setClasses).catch(() => setClasses([])) } }, [insightsOpen])

  useEffect(() => {
    if (selClass) { fetch(`/api/sections?class_id=${selClass}`).then(r => r.ok ? r.json() : []).then(setSections).catch(() => setSections([])) } else { setSections([]) }
  }, [selClass])

  const configuredCount = AI_PROVIDERS.filter(p => keys[p.id] || p.needsKey === false).length

  const saveAll = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/ai/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keys, provider }) })
      const data = await res.json()
      if (res.ok && data.success) notify(true, "AI settings saved successfully!")
      else notify(false, data.error || "Failed to save settings")
    } catch (e) { notify(false, e instanceof Error ? e.message : "Failed to save settings") }
    finally { setSaving(false) }
  }

  const testProvider = async (id: string) => {
    setTestStatus(p => ({ ...p, [id]: "testing" }))
    setTestMsg(p => ({ ...p, [id]: "" }))
    try {
      const res = await fetch("/api/ai/settings/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: id, apiKey: keys[id] || "" }) })
      const data = await res.json()
      if (res.ok && data.success) { setTestStatus(p => ({ ...p, [id]: "ok" })); setTestMsg(p => ({ ...p, [id]: "Connected successfully" })) }
      else { setTestStatus(p => ({ ...p, [id]: "fail" })); setTestMsg(p => ({ ...p, [id]: data.error || "Connection failed" })) }
    } catch (e) { setTestStatus(p => ({ ...p, [id]: "fail" })); setTestMsg(p => ({ ...p, [id]: e instanceof Error ? e.message : "Connection failed" })) }
  }

  const openInsights = () => {
    setInsightsOpen(true)
    setInsightsResult(null)
    setInsightsError("")
    setSelClass("")
    setSelSection("")
    setInsightTab("overview")
  }

  const generateInsights = async () => {
    if (!selClass) return notify(false, "Please select a class first")
    setInsightsLoading(true)
    setInsightsError("")
    setInsightsResult(null)
    try {
      const res = await fetch("/api/ai/student-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: parseInt(selClass), sectionId: selSection ? parseInt(selSection) : null, provider }),
      })
      const data = await res.json()
      if (!res.ok) { setInsightsError(data.error || "Failed to generate insights"); return }
      setInsightsResult(data)
    } catch (e) { setInsightsError(e instanceof Error ? e.message : "Failed to generate insights") }
    finally { setInsightsLoading(false) }
  }

  const openFeature = (id?: string) => {
    if (id === "student-insights") openInsights()
  }

  const numFmt = (n: number) => n.toLocaleString("en-IN")

  const renderMarkdown = (text: string) => {
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean)
    const out: ReactNode[] = []
    let key = 0
    for (const raw of lines) {
      const m = raw.match(/^#{1,6}\s+(.*)$/)
      if (m) {
        out.push(<h4 key={key++} className="mt-4 mb-2 text-sm font-bold text-[var(--primary)]">{m[1]}</h4>)
        continue
      }
      if (/^[-*•]\s+/.test(raw)) {
        out.push(
          <div key={key++} className="flex items-start gap-2 mb-1">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--primary)]" />
            <span className="text-sm text-gray-800">{raw.replace(/^[-*•]\s+/, "")}</span>
          </div>
        )
        continue
      }
      out.push(<p key={key++} className="text-sm text-gray-800 leading-relaxed">{raw}</p>)
    }
    return out
  }

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20"><Sparkles className="h-6 w-6 text-white" /></div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-white">AI Hub</h1>
              <button
                onClick={() => setSettingsOpen(true)}
                title="AI Provider Settings"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
              >
                <Settings className="h-3.5 w-3.5" /> Settings
              </button>
            </div>
            <p className="mt-0.5 text-sm text-white/80">AI-powered tools to simplify everyday school management tasks</p>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm text-white ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>
          {toast.ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}{toast.msg}
        </div>
      )}

      {/* Feature cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => {
          const isActive = !!f.id
          return (
            <div
              key={f.title}
              onClick={() => isActive && openFeature(f.id)}
              className={`group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all ${isActive ? "hover:border-[var(--primary)]/40 hover:shadow-md cursor-pointer" : "opacity-80"}`}
            >
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg ${f.color}`}><f.icon className="h-5 w-5 text-white" /></div>
              <h3 className="mb-1 text-base font-semibold text-[var(--title-color)]">{f.title}</h3>
              <p className="text-sm text-[var(--subtitle-color)]">{f.description}</p>
              <div className="mt-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-[var(--primary-light)] text-[var(--primary)]"}`}>
                  {isActive ? <><CheckCircle className="h-3 w-3" /> Available</> : <><Sparkles className="h-3 w-3" /> Coming Soon</>}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Student Insights Modal */}
      {insightsOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-8 pb-8" onClick={() => setInsightsOpen(false)}>
          <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 z-10 rounded-t-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-6 w-6 text-white" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">Student Insights</h2>
                    <p className="text-sm text-white/80">AI-powered class analysis — attendance, exams & fees</p>
                  </div>
                </div>
                <button onClick={() => setInsightsOpen(false)} className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              {/* Selectors */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <select value={selClass} onChange={(e) => { setSelClass(e.target.value); setSelSection(""); setInsightsResult(null) }}
                  className="rounded-lg border-2 border-white/30 bg-white/15 px-3 py-2 text-sm text-white placeholder-white/60 focus:border-white focus:ring-0 [&>option]:text-gray-900">
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={selSection} onChange={(e) => { setSelSection(e.target.value); setInsightsResult(null) }}
                  className="rounded-lg border-2 border-white/30 bg-white/15 px-3 py-2 text-sm text-white placeholder-white/60 focus:border-white focus:ring-0 disabled:opacity-50 [&>option]:text-gray-900"
                  disabled={!selClass}>
                  <option value="">All Sections</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button onClick={generateInsights} disabled={!selClass || insightsLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-orange-600 shadow-sm hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed">
                  {insightsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {insightsLoading ? "Analyzing..." : "Generate Insights"}
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto p-6">
              {insightsLoading && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Loader2 className="mb-3 h-10 w-10 animate-spin text-[var(--primary)]" />
                  <p className="text-sm font-medium">Gathering student data & generating AI analysis...</p>
                  <p className="mt-1 text-xs text-gray-400">This may take up to 30 seconds</p>
                </div>
              )}

              {insightsError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                  <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" /><span>{insightsError}</span></div>
                </div>
              )}

              {insightsResult && !insightsLoading && (
                <>
                  {/* Tab bar */}
                  <div className="mb-5 flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
                    {([
                      { key: "overview" as InsightTab, label: "Overview", icon: TrendingUp },
                      { key: "attendance" as InsightTab, label: "Attendance", icon: Clock },
                      { key: "exams" as InsightTab, label: "Exams", icon: FileText },
                      { key: "fees" as InsightTab, label: "Fees", icon: KeyRound },
                      { key: "report" as InsightTab, label: "AI Report", icon: Sparkles },
                    ]).map(({ key, label, icon: Icon }) => (
                      <button key={key} onClick={() => setInsightTab(key)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${insightTab === key ? "text-[var(--primary)] border-[var(--primary)]" : "text-gray-500 hover:text-gray-700 border-transparent"}`}>
                        <Icon className="h-4 w-4" />{label}
                      </button>
                    ))}
                  </div>

                  {/* Overview */}
                  {insightTab === "overview" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { label: "Students", value: insightsResult.data.totalStudents, icon: Users, color: "text-blue-600 bg-blue-50" },
                          { label: "Attendance Rate", value: insightsResult.data.classSummary.attendanceRate != null ? `${insightsResult.data.classSummary.attendanceRate}%` : "—", icon: CheckCircle, color: (insightsResult.data.classSummary.attendanceRate || 0) >= 75 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50" },
                          { label: "Avg Exam %", value: insightsResult.data.classSummary.avgExamPercentage != null ? `${insightsResult.data.classSummary.avgExamPercentage}%` : "—", icon: TrendingUp, color: (insightsResult.data.classSummary.avgExamPercentage || 0) >= 50 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50" },
                          { label: "Pending Fees", value: `₹${numFmt(insightsResult.data.classSummary.totalPendingFees)}`, icon: AlertTriangle, color: insightsResult.data.classSummary.totalPendingFees > 0 ? "text-amber-600 bg-amber-50" : "text-green-600 bg-green-50" },
                        ].map(({ label, value, icon: Icon, color }) => (
                          <div key={label} className={`rounded-xl border border-gray-200 p-4 ${color.split(" ")[1]}`}>
                            <div className="flex items-center gap-2 mb-2"><Icon className={`h-4 w-4 ${color.split(" ")[0]}`} /><span className="text-xs font-medium text-gray-600">{label}</span></div>
                            <p className="text-2xl font-bold text-gray-800">{value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200"><h4 className="text-sm font-semibold text-gray-700">Student Summary</h4></div>
                        <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                          {insightsResult.data.students.map((s, i) => (
                            <div key={i} className="flex items-center gap-4 px-4 py-2.5 text-sm hover:bg-gray-50/50">
                              <span className="w-8 text-xs text-gray-400">{i + 1}</span>
                              <span className="w-32 font-medium text-gray-800 truncate">{s.name}</span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.attendance && s.attendance.percentage >= 75 ? "bg-green-100 text-green-700" : s.attendance ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-400"}`}>
                                {s.attendance ? `${s.attendance.percentage}%` : "—"}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.exam && s.exam.percentage >= 50 ? "bg-blue-100 text-blue-700" : s.exam ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-400"}`}>
                                {s.exam ? `${s.exam.percentage}%` : "—"}
                              </span>
                              <span className={`text-xs font-medium ${s.fees && s.fees.totalDue > 0 ? "text-red-600" : "text-gray-500"}`}>
                                {s.fees ? (s.fees.totalDue > 0 ? `₹${numFmt(s.fees.totalDue)} due` : "Clear") : "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Attendance tab */}
                  {insightTab === "attendance" && (
                    <div className="space-y-3">
                      {(() => {
                        const sorted = [...insightsResult.data.students].filter(s => s.attendance).sort((a, b) => (a.attendance!.percentage) - (b.attendance!.percentage))
                        const poor = sorted.filter(s => s.attendance!.percentage < 75)
                        const good = sorted.filter(s => s.attendance!.percentage >= 75)
                        return (
                          <>
                            {poor.length > 0 && (
                              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-red-700 mb-2"><AlertTriangle className="h-4 w-4" /> Below 75% Attendance ({poor.length} students)</h4>
                                <div className="space-y-1.5">
                                  {poor.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                      <span className="text-red-800">{s.name}</span>
                                      <span className="font-mono text-red-600">{s.attendance!.present}P / {s.attendance!.absent}A / {s.attendance!.late}L — <b>{s.attendance!.percentage}%</b></span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {good.length > 0 && (
                              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-2"><CheckCircle className="h-4 w-4" /> Good Attendance ({good.length} students)</h4>
                                <div className="space-y-1.5">
                                  {good.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                      <span className="text-green-800">{s.name}</span>
                                      <span className="font-mono text-green-600">{s.attendance!.present}P / {s.attendance!.absent}A / {s.attendance!.late}L — <b>{s.attendance!.percentage}%</b></span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}

                  {/* Exams tab */}
                  {insightTab === "exams" && (
                    <div className="space-y-3">
                      {(() => {
                        const withExams = insightsResult.data.students.filter(s => s.exam)
                        const sorted = [...withExams].sort((a, b) => (b.exam!.percentage) - (a.exam!.percentage))
                        const top3 = sorted.slice(0, 3)
                        const bottom3 = sorted.slice(-3).reverse()
                        return (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-2"><TrendingUp className="h-4 w-4" /> Top Performers</h4>
                                {top3.map((s, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm py-1">
                                    <span className="text-green-800">{i + 1}. {s.name}</span>
                                    <span className="font-bold text-green-700">{s.exam!.percentage}% ({s.exam!.totalMarks}/{s.exam!.maxMarks})</span>
                                  </div>
                                ))}
                              </div>
                              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-red-700 mb-2"><TrendingDown className="h-4 w-4" /> Needs Improvement</h4>
                                {bottom3.map((s, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm py-1">
                                    <span className="text-red-800">{s.name}</span>
                                    <span className="font-bold text-red-700">{s.exam!.percentage}% ({s.exam!.totalMarks}/{s.exam!.maxMarks})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-xl border border-gray-200 overflow-hidden">
                              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200"><h4 className="text-sm font-semibold text-gray-700">All Students</h4></div>
                              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                                {sorted.map((s, i) => (
                                  <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50/50">
                                    <span className="font-medium text-gray-800">{s.name}</span>
                                    <div className="flex items-center gap-3">
                                      {s.exam!.subjects.slice(0, 4).map((sub, j) => (
                                        <span key={j} className="text-xs text-gray-500">{sub.subject}: {sub.marks}/{sub.max}</span>
                                      ))}
                                      <span className={`font-bold ${s.exam!.percentage >= 50 ? "text-green-700" : "text-red-700"}`}>{s.exam!.percentage}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}

                  {/* Fees tab */}
                  {insightTab === "fees" && (
                    <div className="space-y-3">
                      {(() => {
                        const withFees = insightsResult.data.students.filter(s => s.fees)
                        const pending = withFees.filter(s => s.fees!.totalDue > 0).sort((a, b) => b.fees!.totalDue - a.fees!.totalDue)
                        const cleared = withFees.filter(s => s.fees!.totalDue === 0)
                        return (
                          <>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="rounded-xl border border-gray-200 bg-blue-50 p-3 text-center"><p className="text-xs text-gray-500">Total Collected</p><p className="text-lg font-bold text-blue-700">₹{numFmt(insightsResult.data.classSummary.totalCollectedFees)}</p></div>
                              <div className="rounded-xl border border-gray-200 bg-red-50 p-3 text-center"><p className="text-xs text-gray-500">Total Pending</p><p className="text-lg font-bold text-red-700">₹{numFmt(insightsResult.data.classSummary.totalPendingFees)}</p></div>
                              <div className="rounded-xl border border-gray-200 bg-green-50 p-3 text-center"><p className="text-xs text-gray-500">Cleared</p><p className="text-lg font-bold text-green-700">{cleared.length}/{withFees.length}</p></div>
                            </div>
                            {pending.length > 0 && (
                              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-red-700 mb-2"><AlertTriangle className="h-4 w-4" /> Pending Payments ({pending.length})</h4>
                                <div className="space-y-2">
                                  {pending.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                      <span className="text-red-800 font-medium">{s.name}</span>
                                      <div className="text-right">
                                        <span className="font-bold text-red-700">₹{numFmt(s.fees!.totalDue)}</span>
                                        {s.fees!.pendingItems.length > 0 && (
                                          <p className="text-xs text-red-500">{s.fees!.pendingItems.join(", ")}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}

                  {/* AI Report tab */}
                  {insightTab === "report" && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
                      {insightsResult.insights ? (
                        <div className="space-y-1">{renderMarkdown(insightsResult.insights)}</div>
                      ) : (
                        <p className="text-sm text-gray-500">No AI report generated.</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {!insightsResult && !insightsLoading && !insightsError && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <GraduationCap className="mb-3 h-12 w-12 text-gray-300" />
                  <p className="text-sm">Select a class and click <b>Generate Insights</b> to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Provider Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-8 pb-8" onClick={() => setSettingsOpen(false)}>
          <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--title-color)]"><Settings className="h-4 w-4 text-[var(--primary)]" /> AI Provider Settings</h3>
                <p className="mt-0.5 text-sm text-[var(--subtitle-color)]">Save API keys for free AI providers. These keys power the Question Generator and all AI Hub tools.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-light)] px-3 py-1 text-xs font-medium text-[var(--primary)]"><KeyRound className="h-3 w-3" /> {loading ? "..." : `${configuredCount}/${AI_PROVIDERS.length} configured`}</span>
                <button onClick={() => setSettingsOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto p-6">
              <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-[var(--title-color)]">Default provider</span>
                <select value={provider} onChange={(e) => setProvider(e.target.value)}
                  className="flex-1 min-w-[220px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  {AI_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}{p.free ? " (Free)" : " (Paid)"}</option>)}
                </select>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-10 text-sm text-gray-400"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading settings…</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {AI_PROVIDERS.map(p => {
                    const status = testStatus[p.id] || "idle"
                    const configured = !!keys[p.id] || p.needsKey === false
                    const connected = status === "ok" || (status === "idle" && configured)
                    return (
                      <div key={p.id} className={`rounded-xl border p-4 transition-all ${provider === p.id && configured ? "border-[var(--primary)]/50 ring-1 ring-[var(--primary)]/20" : "border-gray-200"}`}>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[var(--title-color)]">{p.name}</span>
                              {p.free ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">FREE</span> : <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">PAID</span>}
                            </div>
                            <p className="mt-0.5 font-mono text-xs text-gray-500">{p.model}</p>
                          </div>
                          <a href={p.signup} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline">Get key <ExternalLink className="h-3 w-3" /></a>
                        </div>
                        {p.needsKey === false ? (
                          <div className="mb-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-3 py-2.5 text-xs text-gray-500">Runs locally — no API key needed. Install <b>Ollama</b>, pull <b>{p.model}</b> and it just works.</div>
                        ) : (
                          <div className="relative mb-3">
                            <input type={showKeys[p.id] ? "text" : "password"} value={keys[p.id] || ""} onChange={(e) => setKeys(prev => ({ ...prev, [p.id]: e.target.value }))} placeholder={p.keyHint}
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                            <button type="button" onClick={() => setShowKeys(prev => ({ ...prev, [p.id]: !prev[p.id] }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showKeys[p.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => testProvider(p.id)} disabled={status === "testing"}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60">
                              {status === "testing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Settings className="h-3.5 w-3.5" />}Test connection
                            </button>
                            {status === "ok" && <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><Check className="h-3.5 w-3.5" /> {testMsg[p.id] || "Connected"}</span>}
                            {status === "fail" && (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600"><X className="h-3.5 w-3.5" /> {testMsg[p.id] || "Failed"}</span>
                                {testMsg[p.id]?.includes("402") && !p.free && <span className="text-[11px] text-gray-500">Top up your account or choose a FREE provider.</span>}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {connected ? <><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" /></span><span className="text-[11px] font-medium text-green-600">Connected</span></>
                              : <><span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-400" /><span className="text-[11px] font-medium text-red-500">Not connected</span></>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-b-2xl border-t border-gray-200 bg-white px-6 py-4">
              <p className="mr-auto text-xs text-gray-500">Best free options: <b>Google Gemini</b>, <b>Groq</b>, <b>OpenRouter</b>, <b>SambaNova</b>, <b>Hugging Face</b> &amp; <b>Ollama</b> (local).</p>
              <button onClick={saveAll} disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}