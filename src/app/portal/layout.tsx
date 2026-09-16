"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Clock,
  FileSpreadsheet,
  Bell,
  User,
  GraduationCap,
  Users,
  Wallet,
  LogOut,
  ShieldCheck,
  ArrowLeftCircle,
  Menu,
  X,
  Library as LibraryIcon,
  ClipboardList,
  Bus,
  Building2,
  School,
  ListChecks,
  MonitorPlay,
  Download,
  Star,
} from "lucide-react"
import { useSchoolInfo } from "@/lib/use-school-info"

type MeUser = {
  id: number
  name: string
  email: string
  role: string
  origUid?: number
  origRole?: string
  origName?: string
  impersonationDepth?: number
}

type Me = {
  user: MeUser | null
  school: { name: string; code: string } | null
  authenticated: boolean
}

type NavItem = { label: string; href: string; icon: any }
type NavSection = { label: string; items: NavItem[] }
type NavMap = Record<string, NavSection[]>

const NAV: NavMap = {
  student: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
        { label: "My Profile", href: "/portal/profile", icon: User },
      ],
    },
    {
      label: "Academic",
      items: [
        { label: "Attendance", href: "/portal/attendance", icon: CalendarDays },
        { label: "Class Timetable", href: "/portal/timetable", icon: Clock },
        { label: "Homework", href: "/portal/homework", icon: BookOpen },
        { label: "Exam Results", href: "/portal/exams", icon: FileSpreadsheet },
        { label: "Online Exam", href: "/portal/exams/online-exam", icon: MonitorPlay },
        { label: "Lesson Plan", href: "/portal/lesson-plan", icon: BookOpen },
        { label: "Syllabus Status", href: "/portal/syllabus-status", icon: ListChecks },
        { label: "Library", href: "/portal/library", icon: LibraryIcon },
        { label: "Leave", href: "/portal/leave", icon: ClipboardList },
        { label: "Download Center", href: "/portal/download-center", icon: Download },
        { label: "Teacher Reviews", href: "/portal/teacher-reviews", icon: Star },
        { label: "Online Courses", href: "/portal/online-courses", icon: GraduationCap },
      ],
    },
    {
      label: "Transport",
      items: [
        { label: "Transport Routes", href: "/portal/transport", icon: Bus },
      ],
    },
    {
      label: "Hostel",
      items: [
        { label: "Hostel Rooms", href: "/portal/hostel", icon: Building2 },
      ],
    },
    {
      label: "Finance & Notices",
      items: [
        { label: "Fees & Payments", href: "/portal/fees", icon: Wallet },
        { label: "Notices", href: "/portal/notices", icon: Bell },
      ],
    },
  ],
  parent: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
        { label: "My Kids", href: "/portal/kids", icon: Users },
        { label: "My Profile", href: "/portal/profile", icon: User },
      ],
    },
    {
      label: "Academic",
      items: [
        { label: "Attendance", href: "/portal/attendance", icon: CalendarDays },
        { label: "Homework", href: "/portal/homework", icon: BookOpen },
        { label: "Exam Results", href: "/portal/exams", icon: FileSpreadsheet },
        { label: "Online Exam", href: "/portal/exams/online-exam", icon: MonitorPlay },
        { label: "Lesson Plan", href: "/portal/lesson-plan", icon: BookOpen },
        { label: "Syllabus Status", href: "/portal/syllabus-status", icon: ListChecks },
        { label: "Library", href: "/portal/library", icon: LibraryIcon },
        { label: "Leave", href: "/portal/leave", icon: ClipboardList },
        { label: "Download Center", href: "/portal/download-center", icon: Download },
      ],
    },
    {
      label: "Finance & Notices",
      items: [
        { label: "Fees & Payments", href: "/portal/fees", icon: Wallet },
        { label: "Notices", href: "/portal/notices", icon: Bell },
      ],
    },
  ],
  teacher: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
        { label: "My Classes", href: "/portal/classes", icon: Users },
        { label: "Students", href: "/portal/students", icon: GraduationCap },
      ],
    },
    {
      label: "Academic",
      items: [
        { label: "Attendance", href: "/portal/attendance", icon: CalendarDays },
        { label: "Homework", href: "/portal/homework", icon: BookOpen },
        { label: "Class Timetable", href: "/portal/timetable", icon: Clock },
        { label: "Lesson Plan", href: "/portal/lesson-plan", icon: BookOpen },
        { label: "Syllabus Status", href: "/portal/syllabus-status", icon: ListChecks },
        { label: "Download Center", href: "/portal/download-center", icon: Download },
      ],
    },
  ],
}

const roleLabel = (role: string) => role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [me, setMe] = useState<Me>({ user: null, school: null, authenticated: false })
  const [loaded, setLoaded] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { info: schoolInfo } = useSchoolInfo()

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
  const impersonating = Boolean(me.user?.origUid)
  const originIsSaas = me.user?.origRole === "super_admin"
  const backLevels = Math.max(0, (me.user?.impersonationDepth || 1) - 1)

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const handleBackToAdmin = async () => {
    try {
      const res = await fetch("/api/auth/impersonate/back", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to return to admin")
      router.push(data.redirect || "/admin")
      router.refresh()
    } catch {
      router.push("/login")
    }
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

  const pageTitle =
    pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "Dashboard"

  const isActive = (href: string) => (href === "/portal" ? pathname === "/portal" : pathname.startsWith(href))

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--sidebar-bg)" }}>
      <div
        className="flex items-center justify-between px-4 h-16 shrink-0"
        style={{ borderBottom: "1px solid color-mix(in srgb, var(--sidebar-bg), white 15%)" }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {schoolInfo.adminLogoSrc ? (
            <img
              src={collapsed ? (schoolInfo.adminSmallLogoSrc || schoolInfo.adminLogoSrc) : schoolInfo.adminLogoSrc}
              alt={`${schoolInfo.name} logo`}
              className="h-9 w-9 rounded-xl object-contain shrink-0"
              style={{ background: "var(--primary)", padding: 4 }}
            />
          ) : (
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: "var(--primary)" }}>
              <GraduationCap className="h-5 w-5" />
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: "var(--sidebar-text)" }}>
                {schoolInfo.name || me.school?.name || "Smart School"}
              </p>
              <p className="text-[11px] truncate" style={{ color: "color-mix(in srgb, var(--sidebar-text), transparent 40%)" }}>
                {me.school ? `Portal (${me.school.code})` : "Student Portal"}
              </p>
            </div>
          )}
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden" style={{ color: "var(--sidebar-text)" }}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-3 pt-4 shrink-0">
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: "color-mix(in srgb, var(--primary), transparent 88%)", border: "1px solid color-mix(in srgb, var(--primary), transparent 75%)" }}
        >
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: "var(--primary)" }}>
                {(me.user?.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--sidebar-text)" }}>{me.user?.name || "User"}</p>
                <p className="text-[11px] capitalize truncate" style={{ color: "color-mix(in srgb, var(--sidebar-text), transparent 40%)" }}>
                  {roleLabel(role)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "var(--primary)" }}>
                {(me.user?.name || "?").charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 portal-scroll">
        {nav.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "color-mix(in srgb, var(--sidebar-text), transparent 50%)" }}>
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={item.label}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${collapsed ? "justify-center" : ""}`}
                    style={{
                      backgroundColor: active ? "color-mix(in srgb, var(--sidebar-active-bg), transparent 85%)" : undefined,
                      color: active ? "var(--sidebar-active-bg)" : "var(--sidebar-text)",
                    }}
                  >
                    <item.icon className="h-4 w-4 shrink-0" style={{ color: active ? "var(--sidebar-active-bg)" : "inherit" }} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {active && !collapsed && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--sidebar-active-bg)" }} />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className="p-3 space-y-2 shrink-0"
        style={{ borderTop: "1px solid color-mix(in srgb, var(--sidebar-bg), white 15%)" }}
      >
        {impersonating && (
          <button
            onClick={handleBackToAdmin}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <ArrowLeftCircle className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">Back to {originIsSaas ? "SaaS Console" : "Admin"}</span>}
          </button>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors"
          style={{ color: "var(--sidebar-text)" }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {impersonating && (
        <div className="relative z-40 bg-amber-100 dark:bg-amber-900/60 border-b border-amber-200 dark:border-amber-700">
          <div className="px-4 py-2 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
            <span className="flex items-center gap-1.5 font-medium truncate">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              Viewing portal as {me.user?.name || "this user"} ({role})
              {me.user?.origName ? ` · logged in by ${me.user.origName}` : ""}
              {backLevels > 0 ? ` · ${backLevels} more ${backLevels === 1 ? "step" : "steps"} back` : ""}
            </span>
            <button
              onClick={handleBackToAdmin}
              className="inline-flex items-center gap-1.5 shrink-0 font-semibold px-3 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors lg:hidden"
            >
              <ArrowLeftCircle className="h-4 w-4" />
              Back to {originIsSaas ? "SaaS Console" : "Admin"}
            </button>
          </div>
        </div>
      )}

      <div className="flex lg:h-screen">
        <aside className={`hidden lg:flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
          {sidebarContent}
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-64 h-full">{sidebarContent}</aside>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <header className="glass-panel sticky top-0 z-30 rounded-none border-b">
            <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={() => setMobileOpen(true)} className="lg:hidden text-[var(--subtitle-color)]">
                  <Menu className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="hidden lg:inline-flex text-[var(--subtitle-color)] hover:text-[var(--primary)]"
                  title="Toggle sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-semibold text-[var(--title-color)] capitalize truncate">{pageTitle}</h1>
              </div>

              <div className="flex items-center gap-3 min-w-0">
                {schoolInfo.name && (
                  <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--primary-light)] text-[var(--primary)] max-w-[220px]">
                    <span className="truncate">{schoolInfo.name}</span>
                    {me.school && <span className="font-mono">({me.school.code})</span>}
                  </span>
                )}
                {impersonating && me.user?.origName && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Impersonated by {me.user.origName}
                  </span>
                )}
                <span className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)] min-w-0">
                  <span className="h-8 w-8 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center shrink-0">
                    {(me.user?.name || "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[140px] truncate">{me.user?.name || "User"}</span>
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6 portal-scroll">
            <div>{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}