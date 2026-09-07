"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Loader2, Trophy, DollarSign,
  Bell, Calendar, BookOpen, CheckCircle,
  FileText, Users, DoorOpen, UserCheck, Megaphone, X,
} from "lucide-react"
import { useCurrency } from "@/lib/currency-context"

type Role = "student" | "parent" | "teacher" | "staff" | "admin" | ""

interface DashboardData {
  role: Role
  name?: string
  studentId?: number
  className?: string
  sectionName?: string
  photo?: string | null
  profile?: { admissionNo?: string; rollNo?: string; gender?: string; dob?: string }
  attendance?: { total: number; summary: Record<string, number>; percentage: number | null }
  summary?: {
    homework?: number; attendanceToday?: number; results?: number
    feesDue?: number; classmates?: number; classes?: number; students?: number
    kids?: number; feesBalance?: number; totalPaid?: number; totalDue?: number
  }
  kids?: number
  kidsDetails?: { id: number; name: string; class: string; section: string; admissionNo: string; attendance: { total: number; percentage: number; summary: Record<string, number> }; homeworkCount: number }[]
  classes?: { classId: number; sectionId: number; className: string; sectionName: string }[]
  notices?: { id: number; title: string; noticeDate: string; publishDate: string; message: string }[]
  timetable?: { subject: string; day: string; period: number; startTime: string; endTime: string; teacher: string; roomNo: string; time: string }[]
  homework?: { id: number; homeworkDate: string; submissionDate: string; description: string; subject: string; className?: string; sectionName?: string }[]
  examSubjects?: { subject: string; percentage: number }[]
  teachers?: { name: string; isClassTeacher: boolean; email?: string; phone?: string }[]
  library?: { id: number; book: string; bookNumber: string; author: string; issueDate: string; returnDate: string; status: string }[]
  visitors?: { id: number; name: string; date: string; inTime?: string; outTime?: string; meetingWith?: string; className?: string; section?: string; meetingPerson?: string; purpose?: string }[]
  otherPayments?: { id: number; saleNo: string; totalAmount: number; discountAmount: number; saleDate: string; paymentStatus: string; quantity: number; productName?: string; bookName?: string; studentId?: number; studentName?: string }[]
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  "bg-orange-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500",
  "bg-rose-500", "bg-amber-500", "bg-teal-500", "bg-indigo-500",
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function Card({ title, icon, children, empty, footerLink }: { title: string; icon: React.ReactNode; children: React.ReactNode; empty?: React.ReactNode; footerLink?: { href: string; label: string } }) {
  return (
    <div className="glass-panel rounded-xl flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-[var(--title-color)] flex items-center gap-2">
          <span className="text-[var(--primary)]">{icon}</span>
          {title}
        </h3>
      </div>
      <div className="p-4 flex-1">{children}</div>
      {footerLink && (
        <div className="px-5 py-2.5 border-t border-[var(--border)] flex items-center justify-end">
          <a href={footerLink.href} className="text-xs font-bold text-[var(--primary)] hover:underline sm:text-[var(--primary)]">
            {footerLink.label} <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      )}
    </div>
  )
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
      <span className="text-[var(--primary-light)]">{icon}</span>
      <p className="text-sm text-[var(--subtitle-color)]">{text}</p>
    </div>
  )
}

export default function PortalDashboard() {
  const { symbol } = useCurrency()
  const [role, setRole] = useState<Role>("")
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [floatingDismissed, setFloatingDismissed] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set<number>()
    try {
      const raw = window.localStorage.getItem("portal_dismissed_notices")
      return raw ? new Set(JSON.parse(raw)) : new Set<number>()
    } catch {
      return new Set<number>()
    }
  })

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setRole(d.user?.role || ""))
      .catch(() => setLoading(false))
  }, [])

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/my/dashboard")
      const d = await res.json()
      if (d.error) setError(d.error)
      else setData(d)
    } catch {
      setError("Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (role) load()
  }, [role, load])

  const pendingFloating = data?.role === "student" ? (data.notices || []).filter((n) => !floatingDismissed.has(n.id)) : []

  const dismissFloating = (id: number) => {
    setFloatingDismissed((prev) => {
      const next = new Set(prev).add(id)
      try {
        window.localStorage.setItem("portal_dismissed_notices", JSON.stringify([...next]))
      } catch {}
      return next
    })
  }

  const student = data?.role === "student" ? data : null
  const parent = data?.role === "parent" ? data : null
  const staff = data?.role === "teacher" || data?.role === "staff" ? data : null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  if (error) {
    return <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>
  }

  if (!data) return null

  const avatarColor = student ? AVATAR_COLORS[(student.studentId || 0) % AVATAR_COLORS.length] : AVATAR_COLORS[0]
  const attPct = student?.attendance?.percentage ?? null
  const attTotal = student?.attendance?.total ?? 0
  const attPresent = (student?.attendance?.summary?.["Present"] || 0) + (student?.attendance?.summary?.["Late"] || 0)
  const attAbsent = student?.attendance?.summary?.["Absent"] || 0

  let attMsg = ""
  let attColor = ""
  if (attPct !== null) {
    if (attPct >= 75) {
      attMsg = "Your current attendance is " + attPct + "%. Which is above minimum attendance mark. Keep going!"
      attColor = "text-green-600"
    } else if (attPct >= 50) {
      attMsg = "Your current attendance is " + attPct + "%. Needs improvement."
      attColor = "text-amber-600"
    } else {
      attMsg = "Your current attendance is " + attPct + "%. Which is lower than minimum attendance mark."
      attColor = "text-red-600"
    }
  }

  return (
    <div className="space-y-6">
      {pendingFloating.length > 0 && (
        <div className="fixed top-20 right-4 z-50 w-[calc(100%-2rem)] sm:w-96 space-y-3">
          {pendingFloating.map((n, i) => (
            <div
              key={n.id}
              className="flex items-start gap-3 rounded-2xl px-4 py-3.5 shadow-xl shadow-black/20 border-2 border-white/20 text-white animate-[toastSlideIn_.4s_ease_both]"
              style={{ animationDelay: `${i * 120}ms`, backgroundColor: "var(--primary)" }}
            >
              <div className="h-10 w-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Megaphone className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Announcement</p>
                <p className="text-sm font-bold text-white truncate">{n.title}</p>
                {n.message && <p className="text-xs text-white/90 mt-0.5 line-clamp-3">{n.message}</p>}
              </div>
              <button
                onClick={() => dismissFloating(n.id)}
                className="text-white/60 hover:text-white shrink-0 cursor-pointer"
                aria-label={`Dismiss ${n.title}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {student && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-md portal-glow-hover">
              <div className="relative p-6">
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="relative shrink-0">
                    {student.photo ? (
                      <img src={student.photo} alt="Student" className="h-20 w-20 rounded-2xl object-cover shadow-lg ring-4 ring-[var(--primary-light)]" />
                    ) : (
                      <div className={`h-20 w-20 rounded-2xl ${avatarColor} flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-[var(--primary-light)]`}>
                        {initials(student.name || "")}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--primary)]">
                      <UserCheck className="h-3.5 w-3.5" /> Welcome Back
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-900 truncate">{student.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--primary)] text-white">
                        Class {student.className}{student.sectionName ? ` - ${student.sectionName}` : ""}
                      </span>
                      {student.profile?.admissionNo && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <FileText className="h-3 w-3" /> {student.profile.admissionNo}
                        </span>
                      )}
                      {student.profile?.rollNo && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Users className="h-3 w-3" /> Roll {student.profile.rollNo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {attMsg && (
                  <div className={`mt-4 rounded-xl px-3.5 py-2.5 text-xs font-medium border ${attColor.includes("green") ? "bg-green-50 border-green-200" : attColor.includes("amber") ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"} ${attColor}`}>
                    {attMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  <div className="rounded-xl bg-white border p-3 text-center" style={{ boxShadow: "0 0 12px rgba(34,197,94,0.55), 0 0 28px rgba(34,197,94,0.25)" }}>
                    <div className="flex justify-center mb-1"><CheckCircle className="h-4 w-4 text-green-500" /></div>
                    <div className="text-xl font-extrabold text-green-600 leading-none">{attPresent}</div>
                    <div className="text-[10px] text-gray-500 mt-1.5 font-medium">Present</div>
                  </div>
                  <div className="rounded-xl bg-white border p-3 text-center" style={{ boxShadow: "0 0 12px rgba(239,68,68,0.55), 0 0 28px rgba(239,68,68,0.25)" }}>
                    <div className="flex justify-center mb-1"><X className="h-4 w-4 text-red-500" /></div>
                    <div className="text-xl font-extrabold text-red-600 leading-none">{attAbsent}</div>
                    <div className="text-[10px] text-gray-500 mt-1.5 font-medium">Absent</div>
                  </div>
                  <div className="rounded-xl bg-white border p-3 text-center" style={{ boxShadow: "0 0 12px rgba(59,130,246,0.55), 0 0 28px rgba(59,130,246,0.25)" }}>
                    <div className="flex justify-center mb-1"><BookOpen className="h-4 w-4 text-blue-500" /></div>
                    <div className="text-xl font-extrabold text-blue-600 leading-none">{student.summary?.homework ?? 0}</div>
                    <div className="text-[10px] text-gray-500 mt-1.5 font-medium">Homework</div>
                  </div>
                  <div className="rounded-xl bg-white border p-3 text-center" style={{ boxShadow: "0 0 12px rgba(245,158,11,0.55), 0 0 28px rgba(245,158,11,0.25)" }}>
                    <div className="flex justify-center mb-1"><DollarSign className="h-4 w-4 text-amber-500" /></div>
                    <div className="text-xl font-extrabold text-amber-600 leading-none">{student.summary?.feesDue ? `${symbol}${student.summary.feesDue.toLocaleString()}` : `${symbol}0`}</div>
                    <div className="text-[10px] text-gray-500 mt-1.5 font-medium">Fees Due</div>
                  </div>
                </div>
              </div>
            </div>

            <Card title="Notice Board" icon={<Bell className="h-4 w-4" />} footerLink={{ href: "/portal/notices", label: "View all notices" }}>
              {student.notices && student.notices.length > 0 ? (
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {student.notices.map((n) => (
                    <div key={n.id} className="border-l-4 border-[var(--primary)] pl-3 py-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-[var(--title-color)]">{n.title}</h4>
                        <span className="text-xs text-[var(--subtitle-color)] shrink-0">{n.publishDate || n.noticeDate}</span>
                      </div>
                      {n.message && <p className="text-xs text-[var(--foreground)] mt-1 line-clamp-2">{n.message}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <Empty icon={<Bell className="h-8 w-8" />} text="No notices available" />
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Subject Performance" icon={<Trophy className="h-4 w-4" />}>
              {student.examSubjects && student.examSubjects.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left py-2 pr-3 text-xs font-semibold text-[var(--subtitle-color)] uppercase">Subject</th>
                        <th className="text-right py-2 pl-3 text-xs font-semibold text-[var(--subtitle-color)] uppercase w-24">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.examSubjects.map((s) => (
                        <tr key={s.subject} className="border-b border-[var(--border)] last:border-0">
                          <td className="py-2.5 pr-3 font-medium text-[var(--foreground)]">{s.subject}</td>
                          <td className="py-2.5 pl-3">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden min-w-[60px]">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${s.percentage}%`, backgroundColor: s.percentage >= 50 ? "var(--primary)" : "#ef4444" }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-[var(--primary)] w-9 text-right">{s.percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty icon={<Trophy className="h-8 w-8" />} text="No exam results yet" />
              )}
            </Card>

            <Card title="Upcoming Classes" icon={<Calendar className="h-4 w-4" />} footerLink={{ href: "/portal/timetable", label: "View full timetable" }}>
              {student.timetable && student.timetable.length > 0 ? (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {student.timetable.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--secondary-light)]">
                      <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {initials(t.subject)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[var(--foreground)]">{t.subject}</div>
                        <div className="text-xs text-[var(--subtitle-color)]">{t.teacher}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold text-[var(--primary)]">{t.time}</div>
                        <div className="text-[10px] text-[var(--subtitle-color)]">{t.roomNo}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty icon={<Calendar className="h-8 w-8" />} text="No classes today" />
              )}
            </Card>

            <Card title="Homework" icon={<BookOpen className="h-4 w-4" />} footerLink={{ href: "/portal/homework", label: "View all homework" }}>
              {student.homework && student.homework.length > 0 ? (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {student.homework.map((h) => {
                    const pastDue = h.submissionDate && h.submissionDate < today()
                    return (
                      <div key={h.id} className="p-2 rounded-lg border border-[var(--border)]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[var(--primary)]">{h.subject || "General"}</span>
                          {pastDue ? (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Overdue</span>
                          ) : (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Due</span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--foreground)] mt-1 line-clamp-2">{h.description}</p>
                        <div className="text-[10px] text-[var(--subtitle-color)] mt-1">
                          HW: {h.homeworkDate}{h.submissionDate ? ` \u2192 Submit: ${h.submissionDate}` : ""}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <Empty icon={<BookOpen className="h-8 w-8" />} text="No homework" />
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Teacher List" icon={<Users className="h-4 w-4" />}>
              {student.teachers && student.teachers.length > 0 ? (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {student.teachers.map((t, i) => {
                    const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
                    return (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--secondary-light)]">
                        <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {initials(t.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[var(--foreground)] truncate">{t.name}</div>
                          <div className="text-xs text-[var(--subtitle-color)]">{t.isClassTeacher ? "Class Teacher" : "Subject Teacher"}</div>
                        </div>
                        {t.isClassTeacher && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 ml-auto shrink-0">Class Teacher</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <Empty icon={<Users className="h-8 w-8" />} text="No teachers assigned" />
              )}
            </Card>

            <Card title="Visitor List" icon={<DoorOpen className="h-4 w-4" />}>
              {student.visitors && student.visitors.length > 0 ? (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {student.visitors.map((v) => (
                    <div key={v.id} className="p-2 rounded-lg border border-[var(--border)]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[var(--foreground)]">{v.name}</span>
                        <span className="text-[10px] text-[var(--subtitle-color)] shrink-0">{v.date}</span>
                      </div>
                      <div className="text-xs text-[var(--subtitle-color)] mt-1">
                        Purpose: {v.purpose || "N/A"}
                        {v.meetingWith ? ` \u00B7 ${v.meetingWith}${v.meetingPerson ? ` (${v.meetingPerson})` : ""}` : ""}
                        {v.className ? ` \u00B7 ${v.className}${v.section ? `-${v.section}` : ""}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty icon={<DoorOpen className="h-8 w-8" />} text="No visitor records" />
              )}
            </Card>

            <Card title="Library Book Issue List" icon={<FileText className="h-4 w-4" />}>
              {student.library && student.library.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left py-2 pr-2 text-xs font-semibold text-[var(--subtitle-color)] uppercase">Book No.</th>
                        <th className="text-left py-2 pr-2 text-xs font-semibold text-[var(--subtitle-color)] uppercase">Book Title</th>
                        <th className="text-left py-2 pr-2 text-xs font-semibold text-[var(--subtitle-color)] uppercase">Issue Date</th>
                        <th className="text-left py-2 text-xs font-semibold text-[var(--subtitle-color)] uppercase">Due Return</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.library.map((b) => (
                        <tr key={b.id} className="border-b border-[var(--border)] last:border-0">
                          <td className="py-2 pr-2 text-xs text-[var(--subtitle-color)] whitespace-nowrap">{b.bookNumber || "-"}</td>
                          <td className="py-2 pr-2">
                            <div className="text-sm font-semibold text-[var(--foreground)]">{b.book}</div>
                            {b.author && <div className="text-xs text-[var(--subtitle-color)]">{b.author}</div>}
                          </td>
                          <td className="py-2 pr-2 text-xs text-[var(--foreground)] whitespace-nowrap">{b.issueDate}</td>
                          <td className="py-2 text-xs text-[var(--foreground)] whitespace-nowrap">{b.returnDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty icon={<FileText className="h-8 w-8" />} text="No books issued" />
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Fee Summary" icon={<DollarSign className="h-4 w-4" />}>
              {student.summary?.feesDue && student.summary.feesDue > 0 ? (
                <div className="flex flex-col items-center justify-center py-4 gap-3">
                  <div className="text-3xl font-bold text-red-600">{symbol}{student.summary.feesDue.toLocaleString()}</div>
                  <p className="text-sm text-[var(--subtitle-color)]">Outstanding Balance</p>
                  <div className="text-xs text-[var(--subtitle-color)]">Please pay at the admin office</div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <p className="text-sm font-semibold text-green-600">All fees paid</p>
                </div>
              )}
            </Card>

            <Card title="Classmates & Exam Summary" icon={<Trophy className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--secondary-light)] p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--primary)]">{student.summary?.classmates ?? 0}</div>
                  <div className="text-xs text-[var(--subtitle-color)] mt-1">Classmates</div>
                </div>
                <div className="rounded-xl bg-[var(--secondary-light)] p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--primary)]">{student.summary?.results ?? 0}</div>
                  <div className="text-xs text-[var(--subtitle-color)] mt-1">Exam Subjects</div>
                </div>
                <div className="rounded-xl bg-[var(--secondary-light)] p-4 text-center col-span-2">
                  <div className="text-2xl font-bold text-[var(--primary)]">{attTotal}</div>
                  <div className="text-xs text-[var(--subtitle-color)] mt-1">Attendance Records</div>
                </div>
              </div>
            </Card>

            <Card title="Today" icon={<Calendar className="h-4 w-4" />}>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--secondary-light)]">
                  <span className="text-sm text-[var(--foreground)]">Attendance today</span>
                  <span className="text-sm font-bold text-[var(--primary)]">{student.summary?.attendanceToday ?? 0} record(s)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--secondary-light)]">
                  <span className="text-sm text-[var(--foreground)]">Homework pending</span>
                  <span className="text-sm font-bold text-[var(--primary)]">{student.homework?.length ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--secondary-light)]">
                  <span className="text-sm text-[var(--foreground)]">Books issued</span>
                  <span className="text-sm font-bold text-[var(--primary)]">{student.library?.length ?? 0}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Other Payments */}
          {student.otherPayments && student.otherPayments.length > 0 && (
            <Card title="Other Payments" icon={<DollarSign className="h-4 w-4" />} footerLink={{ href: "/portal/fees", label: "View all fees" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Sale No</th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Item</th>
                      <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Qty</th>
                      <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Amount</th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Date</th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.otherPayments.slice(0, 5).map((s) => (
                      <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-3 py-2.5 font-medium" style={{ color: "var(--foreground)" }}>{s.saleNo || "—"}</td>
                        <td className="px-3 py-2.5" style={{ color: "var(--foreground)" }}>{s.bookName || s.productName || "—"}</td>
                        <td className="px-3 py-2.5 text-right" style={{ color: "var(--foreground)" }}>{s.quantity}</td>
                        <td className="px-3 py-2.5 text-right font-semibold" style={{ color: "var(--foreground)" }}>{symbol}{Number(s.totalAmount || 0).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-xs" style={{ color: "var(--subtitle-color)" }}>{s.saleDate || "—"}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${String(s.paymentStatus || "").toLowerCase() === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {s.paymentStatus || "Unpaid"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {parent && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-5 shadow-sm">
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-20 h-20 w-20 rounded-full bg-white/10 blur-xl" />
            <div className="relative z-10 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white text-lg font-bold">
                {initials(parent.name || "P")}
              </span>
              <div>
                <h1 className="text-xl font-bold text-white">Welcome, {parent.name}</h1>
                <p className="mt-0.5 text-sm text-white/80">{parent.kids} {parent.kids === 1 ? "child" : "children"} enrolled</p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
              <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4" style={{ color: "var(--primary)" }} /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Children</span></div>
              <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{parent.summary?.kids ?? 0}</p>
            </div>
            <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
              <div className="flex items-center gap-2 mb-1"><BookOpen className="h-4 w-4 text-blue-500" /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Homework</span></div>
              <p className="text-xl font-bold text-blue-600">{parent.summary?.homework ?? 0}</p>
            </div>
            <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
              <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-amber-500" /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Fee Balance</span></div>
              <p className="text-xl font-bold text-amber-600">{symbol}{(parent.summary?.feesBalance ?? 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
              <div className="flex items-center gap-2 mb-1"><CheckCircle className="h-4 w-4 text-green-500" /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Total Paid</span></div>
              <p className="text-xl font-bold text-green-600">{symbol}{(parent.summary?.totalPaid ?? 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Fee Summary Bar */}
          {parent.summary?.totalDue ? (
            <div className="glass-panel rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[var(--title-color)]">Fee Overview</h3>
                <a href="/portal/fees" className="text-xs font-bold text-[var(--primary)] hover:underline">View Details &rarr;</a>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: "var(--subtitle-color)" }}>Total Fees</span>
                    <span className="font-semibold" style={{ color: "var(--foreground)" }}>{symbol}{(parent.summary.totalDue).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: "var(--subtitle-color)" }}>Paid</span>
                    <span className="font-semibold text-green-600">{symbol}{(parent.summary.totalPaid ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--subtitle-color)" }}>Balance Due</span>
                    <span className="font-semibold text-red-600">{symbol}{(parent.summary.feesBalance ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${parent.summary.totalDue > 0 ? Math.round(((parent.summary.totalPaid ?? 0) / parent.summary.totalDue) * 100) : 100}%` }} />
              </div>
              <p className="text-[10px] mt-1.5 text-right" style={{ color: "var(--subtitle-color)" }}>
                {parent.summary.totalDue > 0 ? Math.round(((parent.summary.totalPaid ?? 0) / parent.summary.totalDue) * 100) : 100}% paid
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kids Info Cards */}
            <Card title="My Children" icon={<Users className="h-4 w-4" />}>
              {parent.kidsDetails && parent.kidsDetails.length > 0 ? (
                <div className="space-y-3">
                  {parent.kidsDetails.map((kid, i) => (
                    <div key={kid.id} className="rounded-xl border border-[var(--border)] p-4 hover:shadow-md transition-shadow" style={{ backgroundColor: "var(--background)" }}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                          {initials(kid.name)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{kid.name}</p>
                          <p className="text-xs" style={{ color: "var(--subtitle-color)" }}>{kid.class} - {kid.section}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--primary-light)] text-[var(--primary)] font-semibold">#{kid.admissionNo}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: "var(--secondary-light)" }}>
                          <div className="text-lg font-bold" style={{ color: "var(--primary)" }}>{kid.attendance.percentage}%</div>
                          <div className="text-[10px]" style={{ color: "var(--subtitle-color)" }}>Attendance</div>
                        </div>
                        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: "var(--secondary-light)" }}>
                          <div className="text-lg font-bold" style={{ color: "var(--primary)" }}>{kid.homeworkCount}</div>
                          <div className="text-[10px]" style={{ color: "var(--subtitle-color)" }}>Homework</div>
                        </div>
                        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: "var(--secondary-light)" }}>
                          <div className="text-lg font-bold text-green-600">{kid.attendance.total}</div>
                          <div className="text-[10px]" style={{ color: "var(--subtitle-color)" }}>Total Days</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <Users className="h-10 w-10 text-[var(--primary-light)]" />
                  <p className="text-sm" style={{ color: "var(--subtitle-color)" }}>No children linked yet</p>
                </div>
              )}
            </Card>

            {/* Notices */}
            <Card title="Recent Notices" icon={<Bell className="h-4 w-4" />} footerLink={{ href: "/portal/notices", label: "View all notices" }}>
              {parent.notices && parent.notices.length > 0 ? (
                <div className="space-y-2.5">
                  {parent.notices.map((n) => (
                    <div key={n.id} className="rounded-xl border border-[var(--border)] p-3.5 hover:shadow-sm transition-shadow" style={{ backgroundColor: "var(--background)" }}>
                      <p className="text-sm font-semibold line-clamp-1" style={{ color: "var(--foreground)" }}>{n.title}</p>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--subtitle-color)" }}>{n.message}</p>
                      <p className="text-[10px] mt-1.5 font-medium" style={{ color: "var(--subtitle-color)" }}>
                        {n.publishDate || n.noticeDate || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <Bell className="h-10 w-10 text-[var(--primary-light)]" />
                  <p className="text-sm" style={{ color: "var(--subtitle-color)" }}>No notices yet</p>
                </div>
              )}
            </Card>
          </div>

          {/* Quick Links */}
          <div className="glass-panel rounded-xl p-5">
            <h3 className="text-sm font-bold text-[var(--title-color)] mb-3">Quick Links</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Fees & Payments", href: "/portal/fees", icon: DollarSign, color: "text-green-500" },
                { label: "Attendance", href: "/portal/attendance", icon: CheckCircle, color: "text-blue-500" },
                { label: "Homework", href: "/portal/homework", icon: BookOpen, color: "text-amber-500" },
                { label: "Exams", href: "/portal/exams", icon: Trophy, color: "text-purple-500" },
              ].map((link) => (
                <a key={link.label} href={link.href} className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] hover:shadow-md transition-all hover:border-[var(--primary)]" style={{ backgroundColor: "var(--background)" }}>
                  <link.icon className={`h-4 w-4 ${link.color}`} />
                  <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{link.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Other Payments */}
          {parent.otherPayments && parent.otherPayments.length > 0 && (
            <div className="glass-panel rounded-xl flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
                <h3 className="text-base font-bold text-[var(--title-color)] flex items-center gap-2">
                  <span className="text-[var(--primary)]"><DollarSign className="h-4 w-4" /></span>
                  Other Payments
                </h3>
                <span className="text-xs" style={{ color: "var(--subtitle-color)" }}>{parent.otherPayments.length} record(s)</span>
              </div>
              <div className="p-4 flex-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Sale No</th>
                        <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Student</th>
                        <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Item</th>
                        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Amount</th>
                        <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Date</th>
                        <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parent.otherPayments.slice(0, 5).map((s) => (
                        <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                          <td className="px-3 py-2.5 font-medium" style={{ color: "var(--foreground)" }}>{s.saleNo || "—"}</td>
                          <td className="px-3 py-2.5" style={{ color: "var(--foreground)" }}>{s.studentName || "—"}</td>
                          <td className="px-3 py-2.5" style={{ color: "var(--foreground)" }}>{s.bookName || s.productName || "—"}</td>
                          <td className="px-3 py-2.5 text-right font-semibold" style={{ color: "var(--foreground)" }}>{symbol}{Number(s.totalAmount || 0).toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-xs" style={{ color: "var(--subtitle-color)" }}>{s.saleDate || "—"}</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${String(s.paymentStatus || "").toLowerCase() === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {s.paymentStatus || "Unpaid"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {staff && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-lg font-bold text-[var(--title-color)]">Welcome, {staff.name}</h2>
            <p className="text-sm text-[var(--subtitle-color)] mt-1">{staff.role === "teacher" ? "Teacher" : "Staff"} Dashboard</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[var(--primary)]">{staff.summary?.classes ?? 0}</div>
              <div className="text-sm text-[var(--subtitle-color)]">Assigned Classes</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[var(--primary)]">{staff.summary?.students ?? 0}</div>
              <div className="text-sm text-[var(--subtitle-color)]">Students</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}