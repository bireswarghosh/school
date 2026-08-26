"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  FileSpreadsheet,
  Bell,
  User,
  GraduationCap,
  Users,
  Wallet,
  LogOut,
  ShieldCheck,
} from "lucide-react"

type Me = {
  user: { id: number; name: string; email: string; role: string } | null
  school: { name: string; code: string } | null
  authenticated: boolean
}

const NAV: Record<string, { label: string; href: string; icon: any }[]> = {
  student: [
    { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
    { label: "Homework", href: "/portal/homework", icon: BookOpen },
    { label: "Timetable", href: "/portal/timetable", icon: CalendarDays },
    { label: "Exam Results", href: "/portal/exams", icon: FileSpreadsheet },
    { label: "Notices", href: "/portal/notices", icon: Bell },
    { label: "My Profile", href: "/portal/profile", icon: User },
  ],
  parent: [
    { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
    { label: "My Kids", href: "/portal/kids", icon: Users },
    { label: "Fees & Payments", href: "/portal/fees", icon: Wallet },
    { label: "Homework", href: "/portal/homework", icon: BookOpen },
    { label: "Attendance", href: "/portal/attendance", icon: CalendarDays },
    { label: "Exam Results", href: "/portal/exams", icon: FileSpreadsheet },
    { label: "Notices", href: "/portal/notices", icon: Bell },
  ],
  teacher: [
    { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
    { label: "My Classes", href: "/portal/classes", icon: Users },
    { label: "Students", href: "/portal/students", icon: GraduationCap },
    { label: "Attendance", href: "/portal/attendance", icon: CalendarDays },
    { label: "Homework", href: "/portal/homework", icon: BookOpen },
    { label: "Timetable", href: "/portal/timetable", icon: CalendarDays },
  ],
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [me, setMe] = useState<Me>({ user: null, school: null, authenticated: false })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setMe(d)
        setLoaded(true)
      })
      .catch(() => {
        setLoaded(true)
      })
  }, [])

  const role = me.user?.role || ""
  const nav = NAV[role] || NAV.student

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  if (loaded && !me.authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[var(--background)]">
        <p className="text-sm text-[var(--subtitle-color)]">Please sign in to continue.</p>
        <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">
          Go to login
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="glass-panel sticky top-0 z-30 rounded-none border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-[var(--title-color)] leading-tight truncate">My Portal</h1>
              {me.school && (
                <p className="text-xs text-[var(--subtitle-color)] truncate">
                  {me.school.name} <span className="font-mono">({me.school.code})</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {role !== "student" && role !== "parent" && role !== "teacher" && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[var(--subtitle-color)] hover:text-[var(--primary)] px-3 py-1.5 rounded-lg hover:bg-[var(--primary-light)] transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}
            <span className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
              <span className="h-7 w-7 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center">
                {(me.user?.name || "?").charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[140px] truncate">{me.user?.name || "User"}</span>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="glass-panel rounded-none border-b">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-2">
          {nav.map((item) => {
            const active = item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  active
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--foreground)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
