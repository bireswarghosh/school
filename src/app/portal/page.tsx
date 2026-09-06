"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Loader2, Trophy, DollarSign,
  Bell, Calendar, BookOpen, CheckCircle,
  FileText, Users, DoorOpen, UserCheck,
} from "lucide-react"

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
    kids?: number; feesBalance?: number
  }
  kids?: number
  classes?: { classId: number; sectionId: number; className: string; sectionName: string }[]
  notices?: { id: number; title: string; noticeDate: string; publishDate: string; message: string }[]
  timetable?: { subject: string; day: string; period: number; startTime: string; endTime: string; teacher: string; roomNo: string; time: string }[]
  homework?: { id: number; homeworkDate: string; submissionDate: string; description: string; subject: string; className?: string; sectionName?: string }[]
  examSubjects?: { subject: string; percentage: number }[]
  teachers?: { name: string; isClassTeacher: boolean; email?: string; phone?: string }[]
  library?: { id: number; book: string; bookNumber: string; author: string; issueDate: string; returnDate: string; status: string }[]
  visitors?: { id: number; name: string; date: string; inTime?: string; outTime?: string; meetingWith?: string; className?: string; section?: string; meetingPerson?: string; purpose?: string }[]
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
        <div className="px-5 py-2.5 border-t border-[var(--border)]">
          <a href={footerLink.href} className="text-xs font-semibold text-[var(--primary)] hover:underline">
            {footerLink.label} &rarr;
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
  const [role, setRole] = useState<Role>("")
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dismissedNotices, setDismissedNotices] = useState<Set<number>>(new Set())

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

  const visibleNotices = (student?.notices || []).filter((n) => !dismissedNotices.has(n.id))

  return (
    <div className="space-y-6">
      {student && (
        <>
          {visibleNotices.length > 0 && (
            <div className="space-y-2">
              {visibleNotices.map((n) => (
                <div key={n.id} className="flex items-start gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
                  <Bell className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{n.title}</span>
                    {n.message && <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5 line-clamp-2">{n.message}</p>}
                  </div>
                  <button onClick={() => setDismissedNotices((prev) => new Set(prev).add(n.id))} className="text-emerald-500 hover:text-emerald-700 text-xs shrink-0 cursor-pointer">&times;</button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Welcome" icon={<UserCheck className="h-4 w-4" />}>
              <div className="flex items-start gap-5">
                <div className="relative shrink-0">
                  {student.photo ? (
                    <img src={student.photo} alt="Student" className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-white" />
                  ) : (
                    <div className={`w-24 h-24 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-2xl shadow-md border-4 border-white`}>
                      {initials(student.name || "")}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-[var(--title-color)]">Welcome, {student.name}</h2>
                  <p className="text-sm text-[var(--subtitle-color)] mt-1">Class {student.className}{student.sectionName ? ` - ${student.sectionName}` : ""}</p>
                  <div className="mt-1 text-xs text-[var(--subtitle-color)]">
                    {student.profile?.admissionNo && <div>Admission No: {student.profile.admissionNo}</div>}
                    {student.profile?.rollNo && <div>Roll No: {student.profile.rollNo}</div>}
                  </div>
                  {attMsg && <p className={`text-xs mt-2 font-medium ${attColor}`}>{attMsg}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-5">
                <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 p-3 text-center">
                  <div className="text-lg font-bold text-green-600">{attPresent}</div>
                  <div className="text-[10px] text-[var(--subtitle-color)]">Present</div>
                </div>
                <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 p-3 text-center">
                  <div className="text-lg font-bold text-red-600">{attAbsent}</div>
                  <div className="text-[10px] text-[var(--subtitle-color)]">Absent</div>
                </div>
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 p-3 text-center">
                  <div className="text-lg font-bold text-blue-600">{student.summary?.homework ?? 0}</div>
                  <div className="text-[10px] text-[var(--subtitle-color)]">Homework</div>
                </div>
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 p-3 text-center">
                  <div className="text-lg font-bold text-amber-600">{student.summary?.feesDue ? `$${student.summary.feesDue.toLocaleString()}` : "$0"}</div>
                  <div className="text-[10px] text-[var(--subtitle-color)]">Fees Due</div>
                </div>
              </div>
            </Card>

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
                  <div className="text-3xl font-bold text-red-600">${student.summary.feesDue.toLocaleString()}</div>
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
        </>
      )}

      {parent && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-lg font-bold text-[var(--title-color)]">Welcome, {parent.name}</h2>
            <p className="text-sm text-[var(--subtitle-color)] mt-1">{parent.kids} {parent.kids === 1 ? "child" : "children"} enrolled</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[var(--primary)]">{parent.summary?.kids ?? 0}</div>
              <div className="text-sm text-[var(--subtitle-color)]">Children</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[var(--primary)]">{parent.summary?.homework ?? 0}</div>
              <div className="text-sm text-[var(--subtitle-color)]">Homework</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[var(--primary)]">{parent.summary?.feesBalance ? `$${parent.summary.feesBalance.toLocaleString()}` : "$0"}</div>
              <div className="text-sm text-[var(--subtitle-color)]">Fees Balance</div>
            </div>
          </div>
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