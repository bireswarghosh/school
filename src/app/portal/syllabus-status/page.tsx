"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, BookOpenCheck, CheckCircle2, Loader, CircleSlash, ListChecks, RefreshCw, GraduationCap, Printer, FileSpreadsheet, FileText, Copy } from "lucide-react"
import { useRouter } from "next/navigation"

const statusTone = (status: string) => {
  const s = String(status || "").toLowerCase()
  if (/^completed/.test(s)) return { dot: "bg-green-500", text: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-950/40", label: "Completed" }
  if (/in progress|started/.test(s)) return { dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950/40", label: "In Progress" }
  return { dot: "bg-gray-400", text: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800", label: "Not Started" }
}

function ProgressRing({ value, size = 92, stroke = 8, labelCls = "text-lg font-bold text-[var(--title-color)]" }: { value: number; size?: number; stroke?: number; labelCls?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className={`absolute ${labelCls}`}>{value}%</span>
    </div>
  )
}

export default function PortalSyllabusStatus() {
  const router = useRouter()
  const [role, setRole] = useState("")
  const [classes, setClasses] = useState<any[]>([])
  const [studentId, setStudentId] = useState<number | null>(null)
  const [kidList, setKidList] = useState<any[]>([])
  const [selClassId, setSelClassId] = useState("")
  const [selSectionId, setSelSectionId] = useState("")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setRole(d.user?.role || ""))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (role !== "parent") return
    fetch("/api/my/parent/kids")
      .then((r) => r.json())
      .then((d) => setKidList(d?.kids || []))
      .catch(() => {})
  }, [role])

  const buildUrl = useCallback(() => {
    const p = new URLSearchParams()
    if (role === "parent") {
      p.set("student_id", String(studentId ?? kidList[0]?.id ?? ""))
    }
    if ((role === "teacher" || role === "staff" || role === "admin") && selClassId && selSectionId) {
      p.set("class_id", selClassId)
      p.set("section_id", selSectionId)
    }
    const qs = p.toString()
    return `/api/my/student/syllabus-status${qs ? `?${qs}` : ""}`
  }, [role, studentId, selClassId, selSectionId, kidList])

  useEffect(() => {
    if (!role) return
    let cancelled = false
    setLoading(true)
    setError("")
    fetch(buildUrl())
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.error) {
          setError(d.error)
          setData(null)
        } else {
          setData(d)
          if (d.classes && d.classes.length && !selClassId) {
            setSelClassId(String(d.classes[0].classId))
            setSelSectionId(String(d.classes[0].sectionId))
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load syllabus status")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [role, buildUrl, selClassId, selSectionId])

  const summary = data?.summary

  const statCards = [
    { label: "Total Topics", value: summary?.total ?? 0, icon: ListChecks, tone: "text-[var(--title-color)]" },
    { label: "Completed", value: summary?.completed ?? 0, icon: CheckCircle2, tone: "text-green-600 dark:text-green-400" },
    { label: "In Progress", value: summary?.inProgress ?? 0, icon: Loader, tone: "text-blue-600 dark:text-blue-400" },
    { label: "Not Started", value: summary?.notStarted ?? 0, icon: CircleSlash, tone: "text-gray-500 dark:text-gray-400" },
  ]

  const isTeacher = role === "teacher" || role === "staff" || role === "admin"

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const reportTitle = () => `Syllabus Status Report${data?.className ? ` - ${data.className}${data.sectionName ? ` ${data.sectionName}` : ""}` : ""}`

  const exportExcel = () => {
    const summaryRow = [
      { "Subject - Lesson - Topic": reportTitle(), Status: `Overall ${summary?.percentage ?? 0}%` },
      ...(data?.items || []).map((it: any) => ({
        "Subject - Lesson - Topic": `${it.subject} - ${it.lesson} - ${it.topic}`,
        Status: `${it.status} (${it.percentage}%)`,
      })),
    ]
    const headers = Object.keys(summaryRow[0])
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Syllabus Status</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><h3>${reportTitle()}</h3><table><thead><tr>${headers.map((h) => `<th style="background:#ff7732;color:#fff">${h}</th>`).join("")}</tr></thead><tbody>${summaryRow.map((r) => `<tr>${headers.map((h) => `<td>${String(r[h] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`
    downloadBlob(new Blob([html], { type: "application/vnd.ms-excel" }), "Syllabus-Status-Report.xls")
  }

  const exportCSV = () => {
    const lines = [
      reportTitle(),
      "Subject - Lesson - Topic,Status",
      ...(data?.items || []).map((it: any) => {
        const cell = `${it.subject} - ${it.lesson} - ${it.topic}`
        const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
        return `${esc(cell)},${esc(`${it.status} (${it.percentage}%)`)}`
      }),
    ]
    downloadBlob(new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" }), "Syllabus-Status-Report.csv")
  }

  const exportCopy = async () => {
    const lines = [
      reportTitle(),
      "Subject - Lesson - Topic\tStatus",
      ...(data?.items || []).map((it: any) => `${it.subject} - ${it.lesson} - ${it.topic}\t${it.status} (${it.percentage}%)`),
    ]
    try {
      await navigator.clipboard.writeText(lines.join("\n"))
      // eslint-disable-next-line no-alert
      alert("Report copied to clipboard")
    } catch {
      // eslint-disable-next-line no-alert
      alert("Clipboard not available")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--title-color)]">Syllabus Status</h2>
          <p className="text-sm text-[var(--subtitle-color)] mt-1">
            {data?.className ? `Class ${data.className}${data.sectionName ? ` - ${data.sectionName}` : ""}` : "Your syllabus completion status"}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          title="Print"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-semibold text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors cursor-pointer"
        >
          <Printer className="h-4 w-4" /> Print
        </button>
        <button
          onClick={exportExcel}
          title="Export Excel"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-semibold text-[var(--subtitle-color)] hover:text-green-600 hover:border-green-500 transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4" /> Export
        </button>
        <button
          onClick={exportCSV}
          title="Export CSV"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-semibold text-[var(--subtitle-color)] hover:text-blue-600 hover:border-blue-500 transition-colors cursor-pointer"
        >
          <FileText className="h-4 w-4" /> CSV
        </button>
        <button
          onClick={exportCopy}
          title="Copy"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-semibold text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors cursor-pointer"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-semibold text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {isTeacher && data?.classes && data.classes.length > 0 && (
        <div className="glass-panel rounded-xl p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[var(--subtitle-color)] uppercase tracking-wide block mb-1">Class</label>
              <select
                value={selClassId}
                onChange={(e) => {
                  setSelClassId(e.target.value)
                  const section = data.classes.find((c: any) => String(c.classId) === e.target.value)
                  setSelSectionId(section ? String(section.sectionId) : "")
                }}
                className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {Array.from(new Map(data.classes.map((c: any) => [String(c.classId), c])).values()).map((c: any) => (
                  <option key={c.classId} value={c.classId}>{c.className}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--subtitle-color)] uppercase tracking-wide block mb-1">Section</label>
              <select
                value={selSectionId}
                onChange={(e) => setSelSectionId(e.target.value)}
                className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {data.classes.filter((c: any) => String(c.classId) === selClassId).map((c: any) => (
                  <option key={c.sectionId} value={c.sectionId}>{c.sectionName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {role === "parent" && kidList.length > 0 && (
        <div className="glass-panel rounded-xl p-4">
          <label className="text-[11px] font-semibold text-[var(--subtitle-color)] uppercase tracking-wide block mb-1">Student</label>
          <select
            value={studentId ?? kidList[0]?.id ?? ""}
            onChange={(e) => setStudentId(Number(e.target.value))}
            className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            {kidList.map((k: any) => (
              <option key={k.id} value={k.id}>{k.name} - {k.class} {k.section}</option>
            ))}
          </select>
        </div>
      )}

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <div className="glass-panel rounded-xl p-5 flex items-center gap-4 lg:col-span-1">
              <ProgressRing value={summary?.percentage ?? 0} />
              <div>
                <p className="text-sm font-bold text-[var(--title-color)]">Overall Progress</p>
                <p className="text-xs text-[var(--subtitle-color)] mt-1">of your syllabus</p>
              </div>
            </div>
            {statCards.map((c) => (
              <div key={c.label} className="glass-panel rounded-xl p-5 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)]/10">
                  <c.icon className={`h-5 w-5 ${c.tone}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--title-color)]">{c.value}</p>
                  <p className="text-xs text-[var(--subtitle-color)]">{c.label}</p>
                </div>
              </div>
            ))}
          </div>

          {data.subjects.length === 0 ? (
            <div className="glass-panel rounded-xl p-10 text-center space-y-3">
              <GraduationCap className="h-10 w-10 mx-auto text-[var(--subtitle-color)]" />
              <p className="text-sm font-semibold text-[var(--title-color)]">No syllabus status published yet</p>
              <p className="text-xs text-[var(--subtitle-color)]">Check back once your school updates the syllabus progress for this class.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {data.subjects.map((s: any) => (
                  <div key={s.id} className="glass-panel rounded-xl p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--title-color)] flex items-center gap-2">
                          <BookOpenCheck className="h-4 w-4 text-[var(--primary)] shrink-0" />
                          <span className="truncate">{s.name}</span>
                        </p>
                        <p className="mt-1.5 text-xs text-[var(--subtitle-color)] leading-snug">
                          Complete <span className="font-bold text-[var(--primary)]">{s.percentage}%</span>
                        </p>
                      </div>
                      <ProgressRing value={s.percentage} size={64} stroke={6} labelCls="text-xs font-bold text-[var(--title-color)]" />
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${s.percentage}%` }} />
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-[11px] text-[var(--subtitle-color)]">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" />{s.completed}</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" />{s.inProgress}</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-400" />{s.notStarted}</span>
                      <span className="ml-auto">{s.total} topics</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-panel rounded-xl overflow-hidden">
                <div className="border-b border-[var(--border)] px-5 py-3">
                  <h3 className="text-sm font-bold text-[var(--title-color)]">Topic-wise Status</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-white/5 border-b border-[var(--border)]">
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--subtitle-color)] uppercase">#</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--subtitle-color)] uppercase">Subject</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--subtitle-color)] uppercase">Lesson</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--subtitle-color)] uppercase">Topic</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--subtitle-color)] uppercase">Status</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--subtitle-color)] uppercase">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((it: any, idx: number) => {
                        const tone = statusTone(it.status)
                        return (
                          <tr key={it.id} className="border-b border-[var(--border)] hover:bg-[var(--primary)]/5">
                            <td className="px-4 py-3 text-[var(--subtitle-color)]">{idx + 1}</td>
                            <td className="px-4 py-3 font-semibold text-[var(--title-color)]">{it.subject}</td>
                            <td className="px-4 py-3 text-[var(--foreground)]">{it.lesson}</td>
                            <td className="px-4 py-3 text-[var(--foreground)]">{it.topic}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.bg} ${tone.text}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                                {tone.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-24 rounded-full bg-[var(--border)] overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${it.percentage}%`, background: it.percentage >= 100 ? "#22c55e" : it.percentage >= 40 ? "var(--primary)" : "#9ca3af" }}
                                  />
                                </div>
                                <span className="text-xs text-[var(--subtitle-color)] w-9">{it.percentage}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}