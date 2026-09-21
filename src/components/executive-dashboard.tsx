"use client"

import { useState, useEffect, useMemo } from "react"
import {
  GraduationCap,
  Users,
  ClipboardCheck,
  Wallet,
  BarChart3,
  TrendingUp,
  TrendingDown,
  TriangleAlert,
  Bell,
  Bot,
  Sparkles,
  Calendar,
  Star,
  MapPin,
  PiggyBank,
  ArrowUpRight,
  ArrowRight,
  Activity,
  Award,
  BookOpen,
  Layers,
  UserCheck,
  Clock3,
} from "lucide-react"
import { useSession } from "@/lib/session-context"
import { useCurrency } from "@/lib/currency-context"
import { useAuth } from "@/lib/auth-context"
import { useSchoolInfo } from "@/lib/use-school-info"
import Link from "next/link"

const ORANGE = "#ff7732"
const CYAN = "#22d3ee"
const BLUE = "#3b82f6"
const GREEN = "#22c55e"
const AMBER = "#f59e0b"
const VIOLET = "#8b5cf6"
const ROSE = "#f43f5e"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function Ring({ pct, color, size = 52, stroke = 5, children }: { pct: number; color: string; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, pct))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * v) / 100}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

function Donut({ segments, size = 176, stroke = 26, centerTop, centerBottom }: {
  segments: { value: number; color: string; label: string }[]
  size?: number
  stroke?: number
  centerTop: string
  centerBottom: string
}) {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth={stroke} />
        {segments.map((sg, i) => {
          const frac = sg.value / total
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={sg.color}
              strokeWidth={stroke}
              strokeDasharray={`${frac * c} ${c}`}
              strokeDashoffset={-acc * c}
              strokeLinecap="butt"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.08))" }}
            />
          )
          acc += frac
          return el
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-extrabold tracking-tight text-[var(--title-color)]">{centerTop}</span>
        <span className="text-[10px] font-bold tracking-[0.14em] text-[var(--subtitle-color)]">{centerBottom}</span>
      </div>
    </div>
  )
}

function shortMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number)
  if (!y || !m) return ym
  return new Date(y, m - 1, 1).toLocaleString("en", { month: "short" }).toUpperCase()
}

export default function ExecutiveDashboard() {
  const { current } = useSession()
  const { symbol } = useCurrency()
  const { user } = useAuth()
  const { info: schoolInfo } = useSchoolInfo()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [feeRange, setFeeRange] = useState<"6M" | "12M" | "ALL">("12M")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [current?.id])

  const s = data?.stats ?? {}
  const insights = data?.insights ?? {}
  const sessionName = data?.session?.name ?? current?.name ?? "—"
  const money = (n: number) => `${symbol}${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

  const att = s.todayAttendance ?? { present: 0, absent: 0, late: 0, total: 0 }
  const attPct = att.total > 0 ? Math.round(((att.present + att.late) / att.total) * 100) : 0
  const newThis = s.newStudentsThisMonth ?? 0
  const newLast = s.newStudentsLastMonth ?? 0
  const studentPct = newLast > 0 ? Math.round(((newThis - newLast) / newLast) * 100) : newThis > 0 ? 100 : 0
  const feesThis = s.feesThisMonth ?? 0
  const feesLast = s.feesLastMonth ?? 0
  const feesPct = feesLast > 0 ? Math.round(((feesThis - feesLast) / feesLast) * 100) : feesThis > 0 ? 100 : 0
  const collected = s.feesCollected ?? 0
  const pending = s.pendingFees ?? 0
  const feeHealth = collected + pending > 0 ? Math.round((collected / (collected + pending)) * 100) : 0
  const avgScore = s.overallAvgScore ?? null

  const classPerf: any[] = s.classPerformance ?? []
  const totalClassStudents = classPerf.reduce((a, c) => a + (c.students || 0), 0) || s.totalStudents || 1
  const maxClass = Math.max(1, ...classPerf.map((c) => c.students || 0))
  const topClass = classPerf[0]
  const bestAttClass = classPerf.filter((c) => c.avgAtt != null).sort((a, b) => b.avgAtt - a.avgAtt)[0]
  const bestScoreClass = classPerf.filter((c) => c.avgScore != null).sort((a, b) => b.avgScore - a.avgScore)[0]

  const allMonths: any[] = data?.feesByMonth ?? []
  const months = useMemo(() => {
    if (feeRange === "6M") return allMonths.slice(-6)
    if (feeRange === "12M") return allMonths.slice(-12)
    return allMonths
  }, [allMonths, feeRange])
  const maxMonth = Math.max(1, ...months.map((m) => m.total || 0))
  const peakMonth = months.reduce((a: any, b: any) => ((b?.total || 0) > (a?.total || 0) ? b : a), months[0])
  const avgMonth = months.length ? months.reduce((a, m) => a + (m.total || 0), 0) / months.length : 0

  const cumulative = useMemo(() => {
    let run = 0
    return months.map((m) => { run += m.total || 0; return { ...m, cum: run } })
  }, [months])
  const maxCum = Math.max(1, ...cumulative.map((m) => m.cum))
  const peakCum = cumulative[cumulative.length - 1]

  const areaPath = useMemo(() => {
    if (cumulative.length === 0) return null
    const W = 560, H = 180, P = 8
    const step = cumulative.length > 1 ? (W - P * 2) / (cumulative.length - 1) : 0
    const pts = cumulative.map((m, i) => [P + i * step, H - P - (m.cum / maxCum) * (H - P * 2)] as const)
    return { line: pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" "), pts, W, H }
  }, [cumulative, maxCum])

  const kpis = [
    { label: "TOTAL STUDENTS", value: (s.totalStudents ?? 0).toLocaleString(), sub: `${s.activeStudents ?? 0} active · ${newThis} new`, icon: GraduationCap, color: ORANGE, bg: "from-orange-400 to-amber-500", ring: totalClassStudents > 0 ? Math.round(((s.activeStudents ?? 0) / Math.max(1, s.totalStudents ?? 1)) * 100) : 0, ringLabel: `${s.activeStudents ?? 0}`, delta: studentPct, deltaSuffix: "adm" },
    { label: "ATTENDANCE TODAY", value: att.total > 0 ? `${attPct}%` : "—", sub: `${att.present} present · ${att.late} late`, icon: ClipboardCheck, color: CYAN, bg: "from-cyan-400 to-teal-500", ring: attPct, ringLabel: `${att.present}`, delta: null as number | null, foot: `${att.absent} absent` },
    { label: "FEES COLLECTED", value: money(collected), sub: `${money(pending)} outstanding`, icon: Wallet, color: BLUE, bg: "from-blue-500 to-indigo-600", ring: feeHealth, ringLabel: `${feeHealth}%`, delta: feesPct, deltaSuffix: "MoM" },
    { label: "AVG EXAM SCORE", value: avgScore != null ? `${avgScore}%` : "—", sub: `${s.activeExams ?? 0} exams · session`, icon: Award, color: GREEN, bg: "from-emerald-400 to-green-600", ring: avgScore ?? 0, ringLabel: avgScore != null ? `${avgScore}%` : "—", delta: null as number | null, foot: "overall avg" },
    { label: "TEACHERS", value: (s.totalTeachers ?? 0).toLocaleString(), sub: `${s.activeStaff ?? 0} active staff`, icon: Users, color: VIOLET, bg: "from-violet-500 to-purple-600", ring: (s.activeStaff ?? 0) > 0 ? Math.round(((s.totalTeachers ?? 0) / Math.max(1, s.activeStaff ?? 1)) * 100) : 0, ringLabel: `${s.totalTeachers ?? 0}`, delta: null as number | null, foot: "faculty" },
    { label: "CLASSES", value: (s.totalClasses ?? 0).toLocaleString(), sub: `${s.totalSections ?? 0} sections`, icon: Layers, color: AMBER, bg: "from-amber-400 to-orange-500", ring: 100, ringLabel: `${s.totalSections ?? 0}`, delta: null as number | null, foot: "running" },
    { label: "PARENTS", value: (s.totalParents ?? 0).toLocaleString(), sub: "registered accounts", icon: UserCheck, color: ROSE, bg: "from-rose-400 to-pink-600", ring: (s.totalStudents ?? 0) > 0 ? Math.min(100, Math.round(((s.totalParents ?? 0) / Math.max(1, s.totalStudents ?? 1)) * 100)) : 0, ringLabel: `${s.totalParents ?? 0}`, delta: null as number | null, foot: "coverage" },
  ]

  const alerts: { level: string; text: string }[] = insights.alerts ?? []
  const recentStudents = data?.recentStudents ?? []
  const recentFees = data?.recentFees ?? []
  const recentNotices = data?.recentNotices ?? []
  const upcomingExams = s.upcomingExams ?? []

  const attMonthly: any[] = s.attendanceMonthly ?? []
  const maxAttMonth = Math.max(1, ...attMonthly.map((m) => m.total || 0))

  const toppersByClass = useMemo(() => {
    const map = new Map<number, { className: string; rows: any[] }>()
    for (const r of (s.studentAverages ?? [])) {
      const k = r.classId ?? -1
      if (!map.has(k)) map.set(k, { className: r.className || "—", rows: [] })
      map.get(k)!.rows.push(r)
    }
    return [...map.values()]
      .map((g) => ({ ...g, rows: g.rows.sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0)).slice(0, 5) }))
      .filter((g) => g.rows.length > 0)
      .sort((a, b) => (b.rows[0]?.pct ?? 0) - (a.rows[0]?.pct ?? 0))
  }, [s.studentAverages])

  const perfectList: any[] = s.perfectAttendance ?? []
  const rankColors = [ORANGE, "#94a3b8", "#b45309"]

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", weekday: "long" })
  const card = "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
  const cardTitle = "text-[11px] font-extrabold tracking-[0.12em] text-slate-900 dark:text-white uppercase"

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform: translateY(10px)} to {opacity:1; transform: translateY(0)}}
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)}}
      `}</style>

      {/* HERO — light premium, high contrast, no black spots */}
      <div className="relative overflow-hidden rounded-[24px] border border-orange-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-[0_8px_32px_rgba(255,119,50,0.12)] dark:shadow-none">
        {/* soft peach wash — stronger in light for contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50/60 to-white dark:from-orange-950/15 dark:via-amber-950/10 dark:to-slate-900" />
        {/* organic glow shapes — visible in light */}
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-orange-200/50 to-amber-200/40 blur-3xl opacity-70 dark:opacity-40" />
        <div className="absolute -left-16 -bottom-20 h-64 w-64 rounded-full bg-gradient-to-br from-amber-100/60 to-orange-100/40 blur-3xl opacity-70 dark:opacity-30" />
        {/* thin top accent */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

        <div className="relative px-6 lg:px-8 py-6 lg:py-7">
          <div className="flex flex-wrap gap-6 items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-2 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/20 px-3 py-1 text-[11px] font-bold text-orange-700 dark:text-orange-300">
                <Sparkles className="h-3.5 w-3.5 text-orange-500" /> Executive Dashboard <span className="opacity-30">·</span> Session {sessionName}
              </p>
              <h1 className="mt-3 text-[22px] lg:text-[27px] font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                {greeting()}, <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">{(() => {
                  const n = user?.name?.trim() || ""
                  if (!n || n.toLowerCase() === "school" || n.toLowerCase().startsWith("school ")) return "Admin"
                  return n.split(" ")[0]
                })()}</span>
                <span className="font-semibold text-slate-500 dark:text-slate-400"> — here’s today at </span>
                <span className="text-slate-900 dark:text-white">{schoolInfo.name || "St. Jonas Convent School"}</span>
              </h1>
              <p className="mt-2 text-[13px] font-medium flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <Calendar className="h-3.5 w-3.5 text-orange-500" /> {today}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium"><Activity className="h-3.5 w-3.5 text-slate-400" /> {s.totalStudents ?? 0} students · {s.totalTeachers ?? 0} teachers · {s.totalClasses ?? 0} classes</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white px-3.5 py-1.5 text-xs font-extrabold shadow-sm shadow-orange-200">
                  <Clock3 className="h-3.5 w-3.5" /> {att.total} attendance today
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-800 border border-[var(--border)] px-3.5 py-1.5 text-xs font-bold text-[var(--title-color)] shadow-sm">
                  <span className="h-6 w-6 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600"><Wallet className="h-3.5 w-3.5" /></span> {money(collected)} collected
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-800 border border-[var(--border)] px-3.5 py-1.5 text-xs font-bold text-[var(--title-color)] shadow-sm">
                  <span className="h-6 w-6 rounded-full bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center text-blue-600"><BarChart3 className="h-3.5 w-3.5" /></span> {feeHealth}% fee health
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 shrink-0 w-full lg:w-[320px]">
              <div className="hidden lg:flex items-center gap-3 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20 border border-violet-200/60 dark:border-violet-500/20 px-4 py-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow"><Bot className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-widest text-violet-600 dark:text-violet-300 uppercase">AI Summary</p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug line-clamp-2">{loading ? "Analysing…" : insights.dailySummary || "All systems running smoothly today — no critical alerts."}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/admin/communicate/notice-board"
                  className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-full bg-white dark:bg-slate-800 border border-[var(--border)] px-4 py-2.5 text-sm font-bold text-[var(--title-color)] hover:bg-[var(--accent)] transition-colors"
                >
                  <Bell className="h-4 w-4" /> Notices
                </Link>
              </div>
            </div>
          </div>

          {/* quick stats strip — high contrast light cards */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { k: "New admissions", v: `+${newThis} this month`, icon: Star, tint: "from-orange-500 to-amber-500" },
              { k: "Pending leaves", v: `${s.pendingLeaves ?? 0} awaiting`, icon: ClipboardCheck, tint: "from-blue-500 to-indigo-500" },
              { k: "Open complaints", v: `${s.openComplaints ?? 0} open`, icon: TriangleAlert, tint: "from-amber-500 to-orange-500" },
              { k: "Upcoming exams", v: `${upcomingExams.length} scheduled`, icon: BookOpen, tint: "from-violet-500 to-purple-600" },
            ].map((q) => (
              <div key={q.k} className="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm px-3.5 py-3 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <span className={`h-9 w-9 rounded-xl bg-gradient-to-br ${q.tint} flex items-center justify-center text-white shadow shrink-0`}><q.icon className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">{q.k}</p>
                  <p className="text-[13px] font-extrabold text-slate-900 dark:text-white truncate">{q.v}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI summary mobile fallback */}
      <div className="lg:hidden rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-violet-500/10 px-4 py-3 flex items-start gap-3">
        <span className="h-8 w-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shrink-0"><Bot className="h-4 w-4" /></span>
        <p className="text-xs leading-relaxed text-[var(--subtitle-color)]">
          <b className="text-[var(--title-color)]">AI Daily Summary — </b>{loading ? "Crunching today's numbers…" : insights.dailySummary || "No activity recorded yet."}
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {kpis.map((k, idx) => {
          const Icon = k.icon
          return (
            <div
              key={k.label}
              className={`${card} p-3.5 relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.3)] transition-all duration-300`}
              style={{ animation: `fadeUp 0.5s ease ${idx * 0.06}s both` }}
            >
              {/* top accent */}
              <div className="absolute top-0 inset-x-0 h-[3px] opacity-90" style={{ background: k.color }} />
              {/* hover sheen */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)` }} />
              </div>

              <div className="flex items-start justify-between">
                <span className={`h-9 w-9 rounded-xl bg-gradient-to-br ${k.bg} flex items-center justify-center text-white shadow-md shrink-0`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {k.delta != null ? (
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-black ${k.delta >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                    {k.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{k.delta >= 0 ? "+" : ""}{k.delta}% 
                  </span>
                ) : (
                  <Ring pct={loading ? 0 : k.ring} color={k.color} size={42} stroke={4}>
                    <span className="text-[9px] font-black text-slate-900 dark:text-white">{loading ? "…" : k.ringLabel}</span>
                  </Ring>
                )}
              </div>

              <p className="mt-3 text-[10px] font-bold tracking-[0.12em] text-slate-500 dark:text-slate-400">{k.label}</p>
              <p className="text-[20px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-none mt-1">{loading ? "…" : k.value}</p>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1 truncate">{k.sub}</p>

              {k.delta != null && (
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${loading ? 0 : Math.min(100, Math.max(6, Math.abs(k.delta) * 3 + 30))}%`, background: k.color }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{loading ? "" : k.deltaSuffix}</span>
                </div>
              )}
              {k.delta == null && (
                <div className="mt-2.5 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${loading ? 0 : k.ring}%`, background: k.color, opacity: 0.9 }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ROW 1: Enrollment + Attendance + Fees monthly */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${cardTitle} flex items-center gap-2`}><span className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center text-blue-600"><Layers className="h-3.5 w-3.5" /></span> Class-wise enrollment</h3>
            <span className="rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-2.5 py-1 text-[11px] font-black text-orange-600">{classPerf.length} classes</span>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 portal-scroll">
            {loading ? <p className="text-xs text-[var(--subtitle-color)] py-8 text-center animate-pulse">Loading enrollment…</p> : classPerf.length === 0 ? <p className="text-xs text-[var(--subtitle-color)] py-10 text-center">No classes found.</p> : classPerf.slice(0, 12).map((c: any, i: number) => {
              const pct = Math.round(((c.students || 0) / maxClass) * 100)
              return (
                <div key={c.classId} className="group">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="flex items-center gap-2 font-semibold text-[var(--title-color)] truncate"><span className="h-5 w-5 rounded-full bg-[var(--accent)] flex items-center justify-center text-[10px] font-black text-[var(--subtitle-color)] shrink-0">{i + 1}</span>{c.className}</span>
                    <span className="font-bold text-[var(--title-color)] ml-2 whitespace-nowrap">{c.students} <span className="font-medium text-[var(--subtitle-color)]">· {pct}%</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--accent)] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${BLUE}, ${CYAN})`, boxShadow: "0 1px 6px rgba(59,130,246,0.3)" }} />
                  </div>
                </div>
              )
            })}
          </div>
          {topClass && <div className="mt-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200/60 dark:border-amber-500/20 px-3 py-2.5 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs"><span className="font-extrabold text-[var(--title-color)]">{topClass.className}</span><span className="text-[var(--subtitle-color)]"> leads with {topClass.students} students</span></p>
          </div>}
        </div>

        <div className={`${card} p-5 flex flex-col`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`${cardTitle} flex items-center gap-2`}><span className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600"><ClipboardCheck className="h-3.5 w-3.5" /></span> Today&apos;s attendance</h3>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--accent)] border border-[var(--border)] text-[var(--subtitle-color)]">{att.total} marked</span>
          </div>
          <div className="flex items-center justify-center py-3">
            <Donut
              segments={[
                { value: att.present, color: GREEN, label: "Present" },
                { value: att.late, color: AMBER, label: "Late" },
                { value: att.absent, color: ROSE, label: "Absent" },
              ]}
              centerTop={att.total > 0 ? `${attPct}%` : "—"}
              centerBottom="PRESENT"
            />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { label: "Present", v: att.present, c: GREEN, bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" },
              { label: "Late", v: att.late, c: AMBER, bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" },
              { label: "Absent", v: att.absent, c: ROSE, bg: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20" },
            ].map((r) => (
              <div key={r.label} className={`rounded-xl border ${r.bg} px-2.5 py-2 text-center`}>
                <p className="text-[10px] font-bold tracking-wider text-[var(--subtitle-color)]">{r.label.toUpperCase()}</p>
                <p className="text-base font-black text-[var(--title-color)]">{loading ? "…" : r.v}</p>
                <p className="text-[10px] font-bold" style={{ color: r.c }}>{att.total > 0 ? Math.round((r.v / att.total) * 100) : 0}%</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${cardTitle} flex items-center gap-2`}><span className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center text-indigo-600"><Wallet className="h-3.5 w-3.5" /></span> Fee collection</h3>
            <div className="flex gap-1 p-1 rounded-full bg-[var(--accent)] border border-[var(--border)]">
              {(["6M", "12M", "ALL"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setFeeRange(r)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all ${feeRange === r ? "bg-[var(--title-color)] text-white dark:bg-white dark:text-slate-900 shadow" : "text-[var(--subtitle-color)] hover:text-[var(--title-color)]"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {months.length === 0 ? (
            <p className="text-xs text-[var(--subtitle-color)] py-16 text-center">No fee collection recorded yet.</p>
          ) : (
            <>
              <div className="flex items-end gap-1.5 h-[188px]">
                {months.map((m: any, i: number) => {
                  const h = Math.max(8, Math.round(((m.total || 0) / maxMonth) * 100))
                  const isPeak = peakMonth && m.month === peakMonth.month
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0 group/bar" title={`${m.month}: ${money(m.total)}`}>
                      <span className="text-[9px] font-black text-[var(--subtitle-color)] opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap bg-[var(--title-color)] text-white dark:bg-white dark:text-slate-900 px-1.5 py-0.5 rounded">{Number(m.total || 0) >= 1000 ? `${(Number(m.total||0)/1000).toFixed(1)}k` : Math.round(m.total || 0)}</span>
                      <div
                        className="w-full rounded-t-lg transition-all hover:brightness-110"
                        style={{
                          height: `${h}%`,
                          minHeight: 8,
                          background: isPeak ? `linear-gradient(180deg, ${ORANGE}, #ea580c)` : `linear-gradient(180deg, ${BLUE}, #1e40af)`,
                          boxShadow: isPeak ? "0 4px 12px rgba(255,119,50,0.35)" : "0 2px 8px rgba(59,130,246,0.25)",
                        }}
                      />
                      <span className={`text-[9px] font-bold ${isPeak ? "text-orange-600" : "text-[var(--subtitle-color)]"}`}>{shortMonth(m.month)}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] bg-[var(--accent)] rounded-xl px-3 py-2 border border-[var(--border)]">
                <span className="text-[var(--subtitle-color)]">Avg <b className="text-[var(--title-color)]">{money(Math.round(avgMonth))}</b>/mo</span>
                {peakMonth && <span className="font-bold" style={{ color: ORANGE }}>{shortMonth(peakMonth.month)} · {money(peakMonth.total)}</span>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${cardTitle} flex items-center gap-2`}><span className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200"><BarChart3 className="h-3.5 w-3.5" /></span> Class performance</h3>
            <span className="text-[11px] font-bold tracking-wider text-orange-600 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-2 py-1 rounded-full">ATT · SCORE</span>
          </div>
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="text-left font-semibold pb-2">Class</th>
                  <th className="text-right font-semibold pb-2">Stud.</th>
                  <th className="text-right font-semibold pb-2">Att</th>
                  <th className="text-right font-semibold pb-2">Score</th>
                  <th className="text-right font-semibold pb-2">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-[var(--subtitle-color)]">Loading…</td></tr>
                ) : classPerf.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-[var(--subtitle-color)]">No class data.</td></tr>
                ) : (
                  classPerf.slice(0, 8).map((c: any) => (
                    <tr key={c.classId} className="hover:bg-[var(--accent)]/70 transition-colors">
                      <td className="py-2.5 pr-2 font-bold text-[var(--title-color)] whitespace-nowrap">
                        <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ background: ORANGE }} />
                        {c.className}
                      </td>
                      <td className="py-2.5 text-right text-[var(--subtitle-color)] font-medium">{c.students}</td>
                      <td className={`py-2.5 text-right font-black ${c.avgAtt == null ? "text-slate-400" : c.avgAtt >= 75 ? "text-emerald-600" : "text-rose-600"}`}>
                        {c.avgAtt == null ? "—" : `${c.avgAtt}%`}
                      </td>
                      <td className={`py-2.5 text-right font-black ${c.avgScore == null ? "text-slate-400" : c.avgScore >= 40 ? "text-emerald-600" : "text-rose-600"}`}>
                        {c.avgScore == null ? "—" : `${c.avgScore}%`}
                      </td>
                      <td className="py-2.5 text-right text-[var(--subtitle-color)] font-medium">{Math.round(((c.students || 0) / totalClassStudents) * 100)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
              {!loading && classPerf.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-[var(--border)] font-black">
                    <td className="pt-3 text-[var(--title-color)]">TOTAL</td>
                    <td className="pt-3 text-right" style={{ color: ORANGE }}>{totalClassStudents}</td>
                    <td className="pt-3 text-right text-emerald-600">{att.total > 0 ? `${attPct}%` : "—"}</td>
                    <td className="pt-3 text-right text-emerald-600">{avgScore != null ? `${avgScore}%` : "—"}</td>
                    <td className="pt-3 text-right text-[var(--title-color)]">100%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${cardTitle} flex items-center gap-2`}><span className="h-7 w-7 rounded-lg bg-orange-50 dark:bg-orange-500/15 flex items-center justify-center text-orange-600"><TrendingUp className="h-3.5 w-3.5" /></span> Fee trajectory</h3>
            <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-1 rounded-full">Avg {money(Math.round(avgMonth))}/mo</span>
          </div>
          {cumulative.length === 0 ? (
            <p className="text-xs text-[var(--subtitle-color)] py-10 text-center">No data yet.</p>
          ) : areaPath && (
            <div>
              <svg viewBox={`0 0 ${areaPath.W} ${areaPath.H}`} className="w-full">
                <defs>
                  <linearGradient id="feeArea2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ORANGE} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={ORANGE} stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((f) => (
                  <line key={f} x1="8" x2={areaPath.W - 8} y1={areaPath.H * f} y2={areaPath.H * f} stroke="rgba(148,163,184,0.15)" strokeDasharray="4 6" />
                ))}
                <path d={`${areaPath.line} L${(areaPath.W - 8).toFixed(1)},${(areaPath.H - 8).toFixed(1)} L8,${(areaPath.H - 8).toFixed(1)} Z`} fill="url(#feeArea2)" />
                <path d={areaPath.line} fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {areaPath.pts.map((p, i) => (
                  <circle key={i} cx={p[0]} cy={p[1]} r={i === areaPath.pts.length - 1 ? 5 : 3.5} fill="var(--card)" stroke={ORANGE} strokeWidth="2.2" />
                ))}
              </svg>
              <div className="mt-2 flex items-center justify-between text-[11px] bg-[var(--accent)] rounded-xl px-3 py-2 border border-[var(--border)]">
                <span className="text-[var(--subtitle-color)]">Cumulative <b className="text-[var(--title-color)]">{money(peakCum?.cum ?? 0)}</b></span>
                {peakCum && (
                  <span className="rounded-full px-2.5 py-1 font-black text-white text-[10px] tracking-wide" style={{ background: GREEN }}>
                    PEAK {money(peakCum.cum)}
                  </span>
                )}
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-bold text-[var(--subtitle-color)]">
                <span>{cumulative.length > 0 ? shortMonth(cumulative[0].month) : ""}</span>
                <span>{cumulative.length > 0 ? shortMonth(cumulative[cumulative.length - 1].month) : ""}</span>
              </div>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2.5">
              <p className="text-[10px] font-bold tracking-wider text-amber-700 dark:text-amber-400">PENDING LEAVE</p>
              <p className="text-lg font-black text-[var(--title-color)]">{loading ? "…" : s.pendingLeaves ?? 0}</p>
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-3 py-2.5">
              <p className="text-[10px] font-bold tracking-wider text-blue-700 dark:text-blue-400">HOMEWORK DUE</p>
              <p className="text-lg font-black text-[var(--title-color)]">{loading ? "…" : s.homeworkPending ?? 0}</p>
            </div>
          </div>
        </div>

        <div className={`${card} p-5`}>
          <h3 className={`${cardTitle} flex items-center gap-2`}><span className="h-7 w-7 rounded-lg bg-violet-50 dark:bg-violet-500/15 flex items-center justify-center text-violet-600"><Sparkles className="h-3.5 w-3.5" /></span> School pulse</h3>
          <p className="mt-4 mb-2 text-[10px] font-black tracking-[0.14em] text-slate-500">QUICK MIX</p>
          <div className="space-y-3">
            {[
              { label: "Fee Health", v: feeHealth, c: GREEN, text: `${feeHealth}% collected`, bg: "bg-emerald-50 dark:bg-emerald-500/10" },
              { label: "Attendance", v: attPct, c: CYAN, text: `${attPct}% today`, bg: "bg-cyan-50 dark:bg-cyan-500/10" },
              { label: "Transport Use", v: (s.totalStudents ?? 0) > 0 ? Math.min(100, Math.round(((s.transportStudents ?? 0) / Math.max(1, s.totalStudents ?? 1)) * 100)) : 0, c: BLUE, text: `${s.transportStudents ?? 0} riders`, bg: "bg-blue-50 dark:bg-blue-500/10" },
            ].map((r) => (
              <div key={r.label} className={`rounded-xl border border-[var(--border)] ${r.bg} px-3 py-2.5`}>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="font-bold text-[var(--title-color)]">{r.label}</span>
                  <span className="font-black" style={{ color: r.c }}>{loading ? "…" : r.text}</span>
                </div>
                <div className="h-2 rounded-full bg-white dark:bg-white/10 overflow-hidden border border-black/5">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${loading ? 0 : r.v}%`, background: r.c }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 mb-2 text-[10px] font-black tracking-[0.14em] text-slate-500">INTELLIGENCE ALERTS</p>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 portal-scroll">
            {loading ? <p className="text-xs text-[var(--subtitle-color)] py-4 text-center">Loading…</p> : alerts.length === 0 ? <p className="text-xs text-[var(--subtitle-color)] py-4 text-center bg-[var(--accent)] rounded-xl border border-dashed border-[var(--border)]">All clear — no alerts today ✨</p> : alerts.map((a, i) => (
              <div
                key={i}
                className={`rounded-xl border px-3 py-2.5 text-[11px] leading-snug flex gap-2.5 ${
                  a.level === "danger" ? "border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300"
                  : a.level === "warning" ? "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300"
                }`}
              >
                <span className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] ${a.level === "danger" ? "bg-rose-500" : a.level === "warning" ? "bg-amber-500" : "bg-emerald-500"}`}>{a.level === "danger" ? "!" : a.level === "warning" ? "•" : "✓"}</span>
                <span className="font-medium">{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly attendance + perfect */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${card} lg:col-span-2 p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${cardTitle} flex items-center gap-2`}><span className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600"><Activity className="h-3.5 w-3.5" /></span> Monthly attendance</h3>
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-1 text-emerald-700 dark:text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Present</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-1 text-amber-700 dark:text-amber-400"><span className="h-2 w-2 rounded-full bg-amber-500" /> Late</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2 py-1 text-rose-700 dark:text-rose-400"><span className="h-2 w-2 rounded-full bg-rose-500" /> Absent</span>
            </div>
          </div>
          {attMonthly.length === 0 ? (
            <p className="text-xs text-[var(--subtitle-color)] py-16 text-center bg-[var(--accent)] rounded-xl border border-dashed border-[var(--border)]">No attendance recorded yet.</p>
          ) : (
            <div className="flex items-end gap-2 h-[220px]">
              {attMonthly.map((m: any) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <div className="flex items-end justify-center gap-1 w-full h-full">
                    {[
                      { v: m.present, c: GREEN, label: "Present" },
                      { v: m.late, c: AMBER, label: "Late" },
                      { v: m.absent, c: ROSE, label: "Absent" },
                    ].map((b) => (
                      <div key={b.label} className="flex-1 flex flex-col items-center gap-1 min-w-0 group/b" title={`${b.label}: ${b.v}`}>
                        <span className="text-[9px] font-black text-[var(--title-color)]">{b.v}</span>
                        <div
                          className="w-full rounded-t-lg transition-all group-hover/b:brightness-110"
                          style={{ height: `${Math.max(6, Math.round(((b.v || 0) / maxAttMonth) * 150))}px`, background: b.c, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-[9px] font-black tracking-wide text-[var(--subtitle-color)]">{shortMonth(m.month)}</span>
                </div>
              ))}
            </div>
          )}
          {attMonthly.length > 0 && (
            <p className="mt-3 text-[11px] text-[var(--subtitle-color)] bg-[var(--accent)] rounded-xl px-3 py-2 border border-[var(--border)] inline-block">
              Total marked: <b className="text-[var(--title-color)]">{attMonthly.reduce((a, m) => a + (m.total || 0), 0).toLocaleString()}</b> in last {attMonthly.length} months
            </p>
          )}
        </div>

        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-1">
            <h3 className={`${cardTitle} flex items-center gap-2`}><span className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center text-amber-600"><Star className="h-3.5 w-3.5" /></span> Perfect attendance</h3>
            <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500 text-white">TOP 10</span>
          </div>
          <p className="text-[11px] text-[var(--subtitle-color)] mb-3">Zero absences · last 30 days</p>
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 portal-scroll">
            {loading ? <p className="text-xs text-[var(--subtitle-color)] py-8 text-center">Loading…</p> : perfectList.length === 0 ? (
              <div className="py-10 text-center rounded-xl bg-[var(--accent)] border border-dashed border-[var(--border)]">
                <Award className="h-8 w-8 mx-auto text-[var(--subtitle-color)] opacity-50 mb-2" />
                <p className="text-xs font-medium text-[var(--subtitle-color)]">No qualifying records yet.</p>
              </div>
            ) : perfectList.map((r: any, i: number) => (
              <div key={r.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--accent)] transition-colors border border-transparent hover:border-[var(--border)]">
                <span
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 shadow-sm"
                  style={{
                    background: i < 3 ? rankColors[i] : "var(--accent)",
                    color: i < 3 ? "#fff" : "var(--subtitle-color)",
                    border: i < 3 ? "none" : "1px solid var(--border)",
                  }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--title-color)] truncate">{r.name}</p>
                  <p className="text-[10px] text-[var(--subtitle-color)]">{r.className || "—"} · {r.present}/{r.total} days</p>
                </div>
                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500 text-white whitespace-nowrap shadow-sm">0 absent</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toppers */}
      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${cardTitle} flex items-center gap-2`}><span className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center text-amber-600"><Award className="h-3.5 w-3.5" /></span> Class toppers — top 5 per class</h3>
          <span className="text-[11px] font-black text-orange-600 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-3 py-1 rounded-full">by exam average</span>
        </div>
        {loading ? (
          <p className="text-xs text-[var(--subtitle-color)] py-8 text-center">Loading toppers…</p>
        ) : toppersByClass.length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-[var(--accent)] border border-dashed border-[var(--border)]">
            <BookOpen className="h-8 w-8 mx-auto text-[var(--subtitle-color)] opacity-50 mb-2" />
            <p className="text-xs font-medium text-[var(--subtitle-color)]">No exam marks recorded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1 portal-scroll">
            {toppersByClass.map((g) => (
              <div key={g.className} className="rounded-2xl border border-[var(--border)] bg-[var(--accent)]/50 p-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black text-[var(--title-color)] flex items-center gap-1.5"><span className="h-6 w-6 rounded-lg bg-white dark:bg-white/10 border border-[var(--border)] flex items-center justify-center text-[10px]">🎓</span>{g.className}</p>
                  <span className="text-[10px] font-black px-2 py-1 rounded-full bg-white dark:bg-white/10 border border-[var(--border)] text-[var(--subtitle-color)]">
                    Top {g.rows.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {g.rows.map((r: any, i: number) => (
                    <div key={r.studentId} className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-colors">
                      <span
                        className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm"
                        style={{
                          background: i < 3 ? rankColors[i] : "var(--border)",
                          color: i < 3 ? "#fff" : "var(--subtitle-color)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[11px] font-semibold text-[var(--title-color)] truncate flex-1">{r.name}</span>
                      <div className="w-16 h-1.5 rounded-full bg-[var(--border)] overflow-hidden shrink-0">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, r.pct || 0)}%`, background: `linear-gradient(90deg, ${GREEN}, ${CYAN})` }} />
                      </div>
                      <span className="text-[11px] font-black text-[var(--title-color)] w-9 text-right shrink-0">{r.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insight strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: PiggyBank, label: "SESSION RUN RATE", value: money(collected), sub: `${money(pending)} pending`, c: ORANGE, bg: "from-orange-500 to-amber-500" },
          { icon: TrendingUp, label: "PROJECTED YEAR-END", value: money(insights.feeProjection ?? 0), sub: "fee forecast", c: CYAN, bg: "from-cyan-500 to-teal-500" },
          { icon: Star, label: "TOP CLASS (STRENGTH)", value: topClass?.className ?? "—", sub: topClass ? `${topClass.students} students` : "no data", c: AMBER, bg: "from-amber-500 to-orange-500" },
          { icon: MapPin, label: "BEST ATTENDANCE", value: bestAttClass?.className ?? "—", sub: bestAttClass ? `${bestAttClass.avgAtt}% (30d)` : "no data", c: GREEN, bg: "from-emerald-500 to-green-600" },
          { icon: BarChart3, label: "BEST SCORE CLASS", value: bestScoreClass?.className ?? "—", sub: bestScoreClass ? `${bestScoreClass.avgScore}% avg` : "no data", c: VIOLET, bg: "from-violet-500 to-purple-600" },
        ].map((t, i) => {
          const Icon = t.icon
          return (
            <div key={t.label} className={`${card} p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all`} style={{ animation: `fadeUp 0.4s ease ${0.6 + i * 0.06}s both` }}>
              <span className={`h-11 w-11 rounded-xl bg-gradient-to-br ${t.bg} flex items-center justify-center shrink-0 text-white shadow`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black tracking-[0.1em] text-[var(--subtitle-color)]">{t.label}</p>
                <p className="text-[15px] font-black text-[var(--title-color)] truncate">{loading ? "…" : t.value}</p>
                <p className={`text-[11px] font-medium ${t.label.includes("PROJECTED") || t.label.includes("BEST ATTENDANCE") ? "text-emerald-600" : "text-[var(--subtitle-color)]"}`}>{t.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${card} p-5`}>
          <h3 className={`${cardTitle} flex items-center justify-between`}>Latest admissions <ArrowUpRight className="h-3.5 w-3.5 text-[var(--subtitle-color)]" /></h3>
          <div className="mt-4 space-y-3">
            {loading ? <p className="text-xs text-[var(--subtitle-color)] py-8 text-center">Loading…</p> : recentStudents.length === 0 ? <p className="text-xs text-[var(--subtitle-color)] py-8 text-center rounded-xl bg-[var(--accent)] border border-dashed border-[var(--border)]">No admissions yet.</p> : recentStudents.map((st: any) => (
              <div key={st.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--accent)] transition-colors">
                <span className="h-9 w-9 rounded-xl flex items-center justify-center text-[12px] font-black text-white shrink-0 shadow" style={{ background: `linear-gradient(135deg, ${ORANGE}, #b34a12)` }}>
                  {(st.name || "?").charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--title-color)] truncate">{st.name}</p>
                  <p className="text-[10px] text-[var(--subtitle-color)]">{st.admission_no} · {st.class_name || "—"}{st.section_name ? `-${st.section_name}` : ""}</p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${st.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-[var(--accent)] text-[var(--subtitle-color)] border-[var(--border)]"}`}>{st.status}</span>
              </div>
            ))}
          </div>
          <Link href="/admin/student-information" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:gap-1.5 transition-all">View all students <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className={`${card} p-5`}>
          <h3 className={`${cardTitle} flex items-center justify-between`}>Recent fee payments <Wallet className="h-3.5 w-3.5 text-[var(--subtitle-color)]" /></h3>
          <div className="mt-4 space-y-2.5">
            {loading ? <p className="text-xs text-[var(--subtitle-color)] py-8 text-center">Loading…</p> : recentFees.length === 0 ? <p className="text-xs text-[var(--subtitle-color)] py-8 text-center rounded-xl bg-[var(--accent)] border border-dashed border-[var(--border)]">No payments yet.</p> : recentFees.slice(0, 5).map((f: any) => (
              <div key={f.id} className="flex items-center justify-between gap-2 rounded-xl bg-[var(--accent)] border border-[var(--border)] px-3.5 py-2.5 hover:shadow-sm transition-shadow">
                <div className="min-w-0 flex items-center gap-2.5">
                  <span className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0"><Wallet className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--title-color)] truncate">{f.student_name || "Unknown"}</p>
                    <p className="text-[10px] text-[var(--subtitle-color)]">{f.payment_mode} · {f.payment_date}</p>
                  </div>
                </div>
                <span className="text-xs font-black whitespace-nowrap px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-sm">{money(f.paid_amount)}</span>
              </div>
            ))}
          </div>
          <Link href="/admin/fees-collection" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:gap-1.5 transition-all">View fee ledger <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between">
            <h3 className={cardTitle}>Notice board</h3>
            <span className="h-7 w-7 rounded-lg bg-violet-50 dark:bg-violet-500/15 flex items-center justify-center text-violet-600"><Bell className="h-3.5 w-3.5" /></span>
          </div>
          <div className="mt-4 space-y-3">
            {loading ? <p className="text-xs text-[var(--subtitle-color)] py-8 text-center">Loading…</p> : recentNotices.length === 0 ? <p className="text-xs text-[var(--subtitle-color)] py-8 text-center rounded-xl bg-[var(--accent)] border border-dashed border-[var(--border)]">No notices yet.</p> : recentNotices.map((n: any) => (
              <div key={n.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[var(--accent)] transition-colors border border-transparent hover:border-[var(--border)]">
                <span className="mt-0.5 h-2.5 w-2.5 rounded-full shrink-0" style={{ background: VIOLET }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--title-color)] truncate">{n.title}</p>
                  <p className="text-[10px] text-[var(--subtitle-color)]">Published {n.publish_date || n.notice_date || "—"}</p>
                </div>
              </div>
            ))}
            {!loading && upcomingExams.length > 0 && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 px-3.5 py-3 flex items-center gap-3">
                <span className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-white shrink-0"><Calendar className="h-4 w-4" /></span>
                <div>
                  <p className="text-[10px] font-black tracking-wider text-amber-700 dark:text-amber-400">NEXT EXAM</p>
                  <p className="text-xs font-black text-[var(--title-color)]">{upcomingExams[0].exam_name}{upcomingExams[0].date ? ` · ${upcomingExams[0].date}` : ""}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-[var(--subtitle-color)] border-t border-[var(--border)] mt-2">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Data refreshed: {today} · Source: School ERP</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] border border-[var(--border)] px-3 py-1 font-medium"><TriangleAlert className="h-3 w-3 text-amber-600" /> {s.openComplaints ?? 0} complaints · {s.pendingEnquiries ?? 0} enquiries · {s.pendingLeaves ?? 0} leaves</span>
      </div>
    </div>
  )
}
