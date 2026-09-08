"use client"

import { useState, useEffect, useMemo } from "react"
import {
  GraduationCap,
  UserCog,
  School,
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
  Download,
  Calendar,
  Star,
  MapPin,
  PiggyBank,
} from "lucide-react"
import { useSession } from "@/lib/session-context"
import { useCurrency } from "@/lib/currency-context"

const ORANGE = "#ff7732"
const CYAN = "#22d3ee"
const BLUE = "#3b82f6"
const GREEN = "#22c55e"
const AMBER = "#f59e0b"
const VIOLET = "#8b5cf6"
const ROSE = "#f43f5e"

function Ring({ pct, color, size = 64, stroke = 7, children }: { pct: number; color: string; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, pct))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
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
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

function Donut({ segments, size = 190, stroke = 30, centerTop, centerBottom }: {
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
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
            />
          )
          acc += frac
          return el
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[var(--title-color)]">{centerTop}</span>
        <span className="text-[11px] font-semibold tracking-wide" style={{ color: ORANGE }}>{centerBottom}</span>
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
    if (cumulative.length === 0) return ""
    const W = 560, H = 190, P = 8
    const step = cumulative.length > 1 ? (W - P * 2) / (cumulative.length - 1) : 0
    const pts = cumulative.map((m, i) => [P + i * step, H - P - (m.cum / maxCum) * (H - P * 2)] as const)
    return { line: pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" "), pts, W, H }
  }, [cumulative, maxCum])

  const kpis = [
    { label: "TOTAL STUDENTS", value: (s.totalStudents ?? 0).toLocaleString(), ring: totalClassStudents > 0 ? Math.round(((s.activeStudents ?? 0) / Math.max(1, s.totalStudents ?? 1)) * 100) : 0, ringLabel: `${s.activeStudents ?? 0} act`, ringColor: ORANGE, delta: studentPct, deltaSuffix: "new adm.", foot: `${newThis} new this month` },
    { label: "ATTENDANCE TODAY", value: att.total > 0 ? `${attPct}%` : "—", ring: attPct, ringLabel: `${att.present} P`, ringColor: CYAN, delta: null, foot: `${att.absent} absent · ${att.late} late` },
    { label: "FEES COLLECTED", value: money(collected), ring: feeHealth, ringLabel: `${feeHealth}%`, ringColor: BLUE, delta: feesPct, deltaSuffix: "MoM", foot: `${money(pending)} outstanding` },
    { label: "AVG EXAM SCORE", value: avgScore != null ? `${avgScore}%` : "—", ring: avgScore ?? 0, ringLabel: avgScore != null ? `${avgScore}%` : "—", ringColor: GREEN, delta: null, foot: `${s.activeExams ?? 0} exams in session` },
    { label: "TEACHERS", value: (s.totalTeachers ?? 0).toLocaleString(), ring: (s.activeStaff ?? 0) > 0 ? Math.round(((s.totalTeachers ?? 0) / Math.max(1, s.activeStaff ?? 1)) * 100) : 0, ringLabel: `${s.totalTeachers ?? 0}/${s.activeStaff ?? 0}`, ringColor: VIOLET, delta: null, foot: `${s.activeStaff ?? 0} active staff` },
    { label: "CLASSES", value: (s.totalClasses ?? 0).toLocaleString(), ring: 100, ringLabel: `${s.totalSections ?? 0} sec`, ringColor: AMBER, delta: null, foot: `${s.totalSections ?? 0} sections running` },
    { label: "PARENTS", value: (s.totalParents ?? 0).toLocaleString(), ring: (s.totalStudents ?? 0) > 0 ? Math.min(100, Math.round(((s.totalParents ?? 0) / Math.max(1, s.totalStudents ?? 1)) * 100)) : 0, ringLabel: `${s.totalParents ?? 0}`, ringColor: ROSE, delta: null, foot: "registered accounts" },
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
  const rankColors = [ORANGE, "#a3a3a3", "#b45309"]

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
  const card = "rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
  const cardTitle = "text-[13px] font-bold tracking-wide text-[var(--title-color)]"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-[var(--subtitle-color)]">Executive Summary · Session {sessionName}</p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--accent)] px-3 py-1.5 text-xs text-[var(--subtitle-color)]">
            <Calendar className="h-3.5 w-3.5 text-[var(--subtitle-color)]" /> Session: <b className="text-[var(--title-color)]">{sessionName}</b>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--accent)] px-3 py-1.5 text-xs text-[var(--subtitle-color)]">
            <Bot className="h-3.5 w-3.5 text-violet-400" /> AI Insights: <b className="text-[var(--title-color)]">On</b>
          </span>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold text-white transition-colors"
            style={{ background: ORANGE }}
          >
            <Download className="h-3.5 w-3.5" /> Export PDF
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-violet-400/20 bg-gradient-to-r from-violet-500/10 via-transparent to-indigo-500/10 px-4 py-2.5 flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-violet-300 shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--subtitle-color)]">
          <b className="text-[var(--title-color)]">AI Daily Summary — </b>
          {loading ? "Crunching today's numbers…" : insights.dailySummary || "No activity recorded yet today."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className={card}>
            <p className="text-[10px] font-bold tracking-wider text-[var(--subtitle-color)]">{k.label}</p>
            <div className="mt-2 flex items-center gap-2.5">
              <Ring pct={loading ? 0 : k.ring} color={k.ringColor} size={58} stroke={7}>
                <span className="text-[10px] font-bold text-[var(--title-color)]">{loading ? "…" : k.ringLabel}</span>
              </Ring>
              <div className="min-w-0">
                <p className="text-lg font-extrabold text-[var(--title-color)] leading-tight">{loading ? "…" : k.value}</p>
                {k.delta != null && !loading ? (
                  <p className={`flex items-center gap-1 text-[11px] font-bold ${k.delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {k.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {k.delta >= 0 ? "+" : ""}{k.delta}% {k.deltaSuffix}
                  </p>
                ) : (
                  <p className="text-[11px] text-[var(--subtitle-color)] truncate">{k.foot}</p>
                )}
              </div>
            </div>
            {k.delta != null && <p className="mt-1.5 text-[11px] text-[var(--subtitle-color)]">{k.foot}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={cardTitle}>CLASS-WISE ENROLLMENT</h3>
            <span className="text-[11px] font-bold" style={{ color: ORANGE }}>{classPerf.length} classes</span>
          </div>
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {loading ? <p className="text-xs text-[var(--subtitle-color)]">Loading…</p> : classPerf.length === 0 ? <p className="text-xs text-[var(--subtitle-color)]">No classes found.</p> : classPerf.slice(0, 12).map((c: any) => {
              const pct = Math.round(((c.students || 0) / maxClass) * 100)
              return (
                <div key={c.classId}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[var(--subtitle-color)] font-medium truncate">{c.className}</span>
                    <span className="text-[var(--subtitle-color)] ml-2 whitespace-nowrap">{c.students} · {pct}%</span>
                  </div>
                  <div className="h-4 rounded bg-[var(--accent)] overflow-hidden relative">
                    <div
                      className="h-full rounded transition-all"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${BLUE}, ${CYAN})` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={cardTitle}>TODAY&apos;S ATTENDANCE</h3>
            <span className="text-[11px] text-[var(--subtitle-color)]">{att.total} marked</span>
          </div>
          <div className="flex items-center justify-center py-1">
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
          <div className="mt-3 space-y-1.5">
            {[
              { label: "Present", v: att.present, c: GREEN },
              { label: "Late", v: att.late, c: AMBER },
              { label: "Absent", v: att.absent, c: ROSE },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2 text-[11px]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.c }} />
                <span className="text-[var(--subtitle-color)]">{r.label}</span>
                <span className="ml-auto font-bold text-[var(--title-color)]">{loading ? "…" : r.v}</span>
                <span className="text-slate-500 w-10 text-right">{att.total > 0 ? Math.round((r.v / att.total) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={cardTitle}>FEE COLLECTION (MONTHLY)</h3>
            <div className="flex gap-1">
              {(["6M", "12M", "ALL"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setFeeRange(r)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${feeRange === r ? "text-white" : "text-[var(--subtitle-color)] hover:text-[var(--title-color)]"}`}
                  style={feeRange === r ? { background: ORANGE } : {}}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {months.length === 0 ? (
            <p className="text-xs text-[var(--subtitle-color)] py-10 text-center">No fee collection recorded yet.</p>
          ) : (
            <>
              <div className="flex items-end gap-1.5 h-52">
                {months.map((m: any, i: number) => {
                  const h = Math.max(3, Math.round(((m.total || 0) / maxMonth) * 100))
                  const isPeak = peakMonth && m.month === peakMonth.month
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${m.month}: ${money(m.total)}`}>
                      <span className="text-[9px] font-bold text-[var(--subtitle-color)] whitespace-nowrap">{Number(m.total || 0) >= 1000 ? `${Math.round((m.total || 0) / 1000)}k` : Math.round(m.total || 0)}</span>
                      <div
                        className="w-full rounded-t transition-all"
                        style={{
                          height: `${h}%`,
                          minHeight: 6,
                          background: isPeak ? `linear-gradient(180deg, ${ORANGE}, #b34a12)` : `linear-gradient(180deg, ${BLUE}, #1d4ed8)`,
                          opacity: isPeak ? 1 : 0.55 + (0.45 * (i + 1)) / months.length,
                        }}
                      />
                      <span className="text-[9px] text-slate-500">{shortMonth(m.month)}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--subtitle-color)]">
                <span>Avg: <b className="text-[var(--title-color)]">{money(Math.round(avgMonth))}</b>/mo</span>
                {peakMonth && <span>Peak: <b style={{ color: ORANGE }}>{shortMonth(peakMonth.month)} · {money(peakMonth.total)}</b></span>}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={cardTitle}>CLASS PERFORMANCE COMPARISON</h3>
            <span className="text-[11px] font-bold" style={{ color: ORANGE }}>ATT · SCORE</span>
          </div>
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="text-left font-semibold pb-2">Class</th>
                  <th className="text-right font-semibold pb-2">Students</th>
                  <th className="text-right font-semibold pb-2">Avg Att</th>
                  <th className="text-right font-semibold pb-2">Avg Score</th>
                  <th className="text-right font-semibold pb-2">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  <tr><td colSpan={5} className="py-6 text-center text-[var(--subtitle-color)]">Loading…</td></tr>
                ) : classPerf.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-[var(--subtitle-color)]">No class data.</td></tr>
                ) : (
                  classPerf.slice(0, 8).map((c: any) => (
                    <tr key={c.classId} className="hover:bg-[var(--accent)]">
                      <td className="py-2 pr-2 font-semibold text-[var(--title-color)] whitespace-nowrap">
                        <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ background: ORANGE }} />
                        {c.className}
                      </td>
                      <td className="py-2 text-right text-[var(--subtitle-color)]">{c.students}</td>
                      <td className={`py-2 text-right font-bold ${c.avgAtt == null ? "text-slate-500" : c.avgAtt >= 75 ? "text-green-600" : "text-red-600"}`}>
                        {c.avgAtt == null ? "—" : `${c.avgAtt}%`}
                      </td>
                      <td className={`py-2 text-right font-bold ${c.avgScore == null ? "text-slate-500" : c.avgScore >= 40 ? "text-green-600" : "text-red-600"}`}>
                        {c.avgScore == null ? "—" : `${c.avgScore}%`}
                      </td>
                      <td className="py-2 text-right text-[var(--subtitle-color)]">{Math.round(((c.students || 0) / totalClassStudents) * 100)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
              {!loading && classPerf.length > 0 && (
                <tfoot>
                  <tr className="border-t border-[var(--border)] font-bold">
                    <td className="pt-2 text-[var(--title-color)]">TOTAL</td>
                    <td className="pt-2 text-right" style={{ color: ORANGE }}>{totalClassStudents}</td>
                    <td className="pt-2 text-right text-green-600">{att.total > 0 ? `${attPct}%` : "—"}</td>
                    <td className="pt-2 text-right text-green-600">{avgScore != null ? `${avgScore}%` : "—"}</td>
                    <td className="pt-2 text-right text-[var(--title-color)]">100%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={cardTitle}>FEE COLLECTION TRAJECTORY</h3>
            <span className="text-[11px] font-bold text-green-600">Avg: {money(Math.round(avgMonth))}/mo</span>
          </div>
          {cumulative.length === 0 ? (
            <p className="text-xs text-[var(--subtitle-color)] py-10 text-center">No data yet.</p>
          ) : areaPath && (
            <div>
              <svg viewBox={`0 0 ${areaPath.W} ${areaPath.H}`} className="w-full">
                <defs>
                  <linearGradient id="feeArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ORANGE} stopOpacity="0.45" />
                    <stop offset="100%" stopColor={ORANGE} stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((f) => (
                  <line key={f} x1="8" x2={areaPath.W - 8} y1={areaPath.H * f} y2={areaPath.H * f} stroke="var(--border)" strokeDasharray="3 4" />
                ))}
                <path d={`${areaPath.line} L${(areaPath.W - 8).toFixed(1)},${(areaPath.H - 8).toFixed(1)} L8,${(areaPath.H - 8).toFixed(1)} Z`} fill="url(#feeArea)" />
                <path d={areaPath.line} fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinejoin="round" />
                {areaPath.pts.map((p, i) => (
                  <circle key={i} cx={p[0]} cy={p[1]} r={i === areaPath.pts.length - 1 ? 5 : 3} fill="var(--card)" stroke={ORANGE} strokeWidth="2" />
                ))}
              </svg>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-[var(--subtitle-color)]">Cumulative: <b className="text-[var(--title-color)]">{money(peakCum?.cum ?? 0)}</b></span>
                {peakCum && (
                  <span className="rounded px-2 py-0.5 font-bold text-[#0a0f1e]" style={{ background: GREEN }}>
                    PEAK {money(peakCum.cum)}
                  </span>
                )}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                <span>{cumulative.length > 0 ? shortMonth(cumulative[0].month) : ""}</span>
                <span>{cumulative.length > 0 ? shortMonth(cumulative[cumulative.length - 1].month) : ""}</span>
              </div>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-[var(--accent)] px-3 py-2">
              <p className="text-[10px] text-[var(--subtitle-color)]">PENDING LEAVE</p>
              <p className="text-base font-extrabold text-[var(--title-color)]">{loading ? "…" : s.pendingLeaves ?? 0}</p>
            </div>
            <div className="rounded-lg bg-[var(--accent)] px-3 py-2">
              <p className="text-[10px] text-[var(--subtitle-color)]">PENDING HOMEWORK</p>
              <p className="text-base font-extrabold text-[var(--title-color)]">{loading ? "…" : s.homeworkPending ?? 0}</p>
            </div>
          </div>
        </div>

        <div className={card}>
          <h3 className={cardTitle}>SCHOOL ALERTS &amp; MIX</h3>
          <p className="mt-3 mb-1.5 text-[10px] font-bold tracking-wider text-slate-500">QUICK MIX</p>
          <div className="space-y-2">
            {[
              { label: "Fee Health", v: feeHealth, c: GREEN, text: `${feeHealth}% collected` },
              { label: "Attendance", v: attPct, c: CYAN, text: `${attPct}% today` },
              { label: "Transport Use", v: (s.totalStudents ?? 0) > 0 ? Math.min(100, Math.round(((s.transportStudents ?? 0) / Math.max(1, s.totalStudents ?? 1)) * 100)) : 0, c: BLUE, text: `${s.transportStudents ?? 0} riders` },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[var(--subtitle-color)]">{r.label}</span>
                  <span className="font-bold" style={{ color: r.c }}>{loading ? "…" : r.text}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--accent)] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${loading ? 0 : r.v}%`, background: r.c }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 mb-1.5 text-[10px] font-bold tracking-wider text-slate-500">INTELLIGENCE ALERTS</p>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {loading ? <p className="text-xs text-[var(--subtitle-color)]">Loading…</p> : alerts.map((a, i) => (
              <div
                key={i}
                className={`rounded-lg border px-3 py-2 text-[11px] leading-snug ${
                  a.level === "danger" ? "border-red-200 bg-red-50 text-red-700"
                  : a.level === "warning" ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-green-200 bg-green-50 text-green-700"
                }`}
              >
                <span className="font-bold block mb-0.5">
                  {a.level === "danger" ? "Critical" : a.level === "warning" ? "Attention needed" : "All good"}
                </span>
                {a.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${card} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={cardTitle}>MONTHLY ATTENDANCE</h3>
            <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--subtitle-color)]">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: GREEN }} /> Present</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: AMBER }} /> Late</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: ROSE }} /> Absent</span>
            </div>
          </div>
          {attMonthly.length === 0 ? (
            <p className="text-xs text-[var(--subtitle-color)] py-10 text-center">No attendance recorded yet.</p>
          ) : (
            <div className="flex items-end gap-3 h-56">
              {attMonthly.map((m: any) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <div className="flex items-end justify-center gap-1 w-full" style={{ height: "100%" }}>
                    {[
                      { v: m.present, c: GREEN, label: "Present" },
                      { v: m.late, c: AMBER, label: "Late" },
                      { v: m.absent, c: ROSE, label: "Absent" },
                    ].map((b) => (
                      <div key={b.label} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${b.label}: ${b.v}`}>
                        <span className="text-[9px] font-bold text-[var(--title-color)]">{b.v}</span>
                        <div
                          className="w-full rounded-t transition-all"
                          style={{ height: `${Math.max(4, Math.round(((b.v || 0) / maxAttMonth) * 150))}px`, background: b.c, opacity: 0.9 }}
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-[9px] font-bold text-[var(--subtitle-color)]">{shortMonth(m.month)}</span>
                </div>
              ))}
            </div>
          )}
          {attMonthly.length > 0 && (
            <p className="mt-2 text-[11px] text-[var(--subtitle-color)]">
              Total marked: <b className="text-[var(--title-color)]">{attMonthly.reduce((a, m) => a + (m.total || 0), 0).toLocaleString()}</b> in the last {attMonthly.length} months
            </p>
          )}
        </div>

        <div className={card}>
          <div className="flex items-center justify-between mb-1">
            <h3 className={cardTitle}>TOP 10 — BEST ATTENDANCE</h3>
          </div>
          <p className="text-[10px] text-[var(--subtitle-color)] mb-3">Zero absences · last 30 days</p>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {loading ? <p className="text-xs text-[var(--subtitle-color)]">Loading…</p> : perfectList.length === 0 ? (
              <p className="text-xs text-[var(--subtitle-color)]">No qualifying records yet.</p>
            ) : perfectList.map((r: any, i: number) => (
              <div key={r.id} className="flex items-center gap-2.5 min-w-0">
                <span
                  className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0"
                  style={{
                    background: i < 3 ? rankColors[i] : "var(--accent)",
                    color: i < 3 ? "#fff" : "var(--subtitle-color)",
                  }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[var(--title-color)] truncate">{r.name}</p>
                  <p className="text-[10px] text-slate-500">{r.className || "—"} · {r.present}/{r.total} days</p>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 whitespace-nowrap">0 absent</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={card}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={cardTitle}>CLASS TOPPERS — TOP 5 STUDENTS PER CLASS</h3>
          <span className="text-[11px] font-bold" style={{ color: ORANGE }}>by exam average</span>
        </div>
        {loading ? (
          <p className="text-xs text-[var(--subtitle-color)]">Loading…</p>
        ) : toppersByClass.length === 0 ? (
          <p className="text-xs text-[var(--subtitle-color)]">No exam marks recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {toppersByClass.map((g) => (
              <div key={g.className} className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/40 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-extrabold text-[var(--title-color)]">{g.className}</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${ORANGE}22`, color: ORANGE }}>
                    Top {g.rows.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {g.rows.map((r: any, i: number) => (
                    <div key={r.studentId} className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0"
                        style={{
                          background: i < 3 ? rankColors[i] : "var(--border)",
                          color: i < 3 ? "#fff" : "var(--subtitle-color)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[11px] font-medium text-[var(--title-color)] truncate flex-1">{r.name}</span>
                      <div className="w-16 h-1.5 rounded-full bg-[var(--border)] overflow-hidden shrink-0">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, r.pct || 0)}%`, background: `linear-gradient(90deg, ${GREEN}, ${CYAN})` }} />
                      </div>
                      <span className="text-[11px] font-extrabold text-[var(--title-color)] w-9 text-right shrink-0">{r.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: PiggyBank, label: "SESSION RUN RATE", value: money(collected), sub: `Target pace · ${money(pending)} pending`, c: ORANGE },
          { icon: TrendingUp, label: "PROJECTED YEAR-END", value: money(insights.feeProjection ?? 0), sub: "fee forecast", c: CYAN, green: true },
          { icon: Star, label: "TOP CLASS (STRENGTH)", value: topClass?.className ?? "—", sub: topClass ? `${topClass.students} students` : "no data", c: AMBER },
          { icon: MapPin, label: "BEST ATTENDANCE CLASS", value: bestAttClass?.className ?? "—", sub: bestAttClass ? `${bestAttClass.avgAtt}% (30 days)` : "no data", c: GREEN, green: true },
          { icon: BarChart3, label: "BEST SCORE CLASS", value: bestScoreClass?.className ?? "—", sub: bestScoreClass ? `${bestScoreClass.avgScore}% avg marks` : "no data", c: VIOLET },
        ].map((t) => {
          const Icon = t.icon
          return (
            <div key={t.label} className={`${card} flex items-center gap-3`}>
              <span className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-[var(--accent)]" style={{ color: t.c }}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-wider text-[var(--subtitle-color)]">{t.label}</p>
                <p className="text-base font-extrabold text-[var(--title-color)] truncate">{loading ? "…" : t.value}</p>
                <p className={`text-[11px] ${t.green ? "text-green-600" : "text-[var(--subtitle-color)]"}`}>{t.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={card}>
          <h3 className={cardTitle}>LATEST ADMISSIONS</h3>
          <div className="mt-3 space-y-2.5">
            {loading ? <p className="text-xs text-[var(--subtitle-color)]">Loading…</p> : recentStudents.length === 0 ? <p className="text-xs text-[var(--subtitle-color)]">No admissions yet.</p> : recentStudents.map((st: any) => (
              <div key={st.id} className="flex items-center gap-2.5 min-w-0">
                <span className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: `linear-gradient(135deg, ${ORANGE}, #b34a12)` }}>
                  {(st.name || "?").charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[var(--title-color)] truncate">{st.name}</p>
                  <p className="text-[10px] text-slate-500">{st.admission_no} · {st.class_name || "—"}{st.section_name ? `-${st.section_name}` : ""}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.status === "Active" ? "bg-green-500/15 text-green-600" : "bg-[var(--accent)] text-[var(--subtitle-color)]"}`}>{st.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={card}>
          <h3 className={cardTitle}>RECENT FEE PAYMENTS</h3>
          <div className="mt-3 space-y-2.5">
            {loading ? <p className="text-xs text-[var(--subtitle-color)]">Loading…</p> : recentFees.length === 0 ? <p className="text-xs text-[var(--subtitle-color)]">No payments yet.</p> : recentFees.slice(0, 5).map((f: any) => (
              <div key={f.id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--accent)] px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--title-color)] truncate">{f.student_name || "Unknown"}</p>
                  <p className="text-[10px] text-slate-500">{f.payment_mode} · {f.payment_date}</p>
                </div>
                <span className="text-xs font-extrabold whitespace-nowrap" style={{ color: GREEN }}>{money(f.paid_amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={card}>
          <div className="flex items-center justify-between">
            <h3 className={cardTitle}>NOTICE BOARD</h3>
            <Bell className="h-4 w-4 text-slate-500" />
          </div>
          <div className="mt-3 space-y-2.5">
            {loading ? <p className="text-xs text-[var(--subtitle-color)]">Loading…</p> : recentNotices.length === 0 ? <p className="text-xs text-[var(--subtitle-color)]">No notices yet.</p> : recentNotices.map((n: any) => (
              <div key={n.id} className="flex items-start gap-2.5">
                <span className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ background: VIOLET }} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--title-color)] truncate">{n.title}</p>
                  <p className="text-[10px] text-slate-500">Published {n.publish_date || n.notice_date || "—"}</p>
                </div>
              </div>
            ))}
            {!loading && upcomingExams.length > 0 && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)] px-3 py-2">
                <p className="text-[10px] font-bold tracking-wider text-[var(--subtitle-color)]">NEXT EXAM</p>
                <p className="text-xs font-bold text-[var(--title-color)]">{upcomingExams[0].exam_name}{upcomingExams[0].date ? ` · ${upcomingExams[0].date}` : ""}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-slate-500">
        <span>Data refreshed: {today} · Source: School ERP · Internal Executive Use Only</span>
        <span className="inline-flex items-center gap-1"><TriangleAlert className="h-3 w-3" /> {s.openComplaints ?? 0} open complaints · {s.pendingEnquiries ?? 0} pending enquiries · {s.pendingLeaves ?? 0} pending leaves</span>
      </div>
    </div>
  )
}
