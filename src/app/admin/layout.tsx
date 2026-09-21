"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Sidebar from "@/components/Sidebar"
import { Menu, Search, Moon, Sun, LogOut, ChevronDown, User, Store, ArrowLeft, ShieldCheck } from "lucide-react"
import NotificationBell from "@/components/NotificationBell"
import ThemeSettings from "@/components/ThemeSettings"
import QuickLinks from "@/components/QuickLinks"
import { CurrencyProvider } from "@/lib/currency-context"
import { SessionProvider } from "@/lib/session-context"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { useSchoolInfo } from "@/lib/use-school-info"
import AdminThemeProvider from "@/components/AdminThemeProvider"
import AdminAssistant from "@/components/admin-assistant"

function AdminHeader({ pageTitle, toggleDarkMode, darkMode, onMenu }: { pageTitle: string; toggleDarkMode: () => void; darkMode: boolean; onMenu: () => void }) {
  const { user, school, logout } = useAuth()
  const { info } = useSchoolInfo()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const title = info.name || (school?.name as string) || "Admin Panel"
    document.title = `${title} · Admin Panel`
  }, [info.name, school?.name])

  const isPosPage = pathname === "/admin/students-inventory/student-sales"
  const impersonating = Boolean(user?.origUid)
  const originIsSaas = user?.origRole === "super_admin"
  const backLevels = Math.max(0, (user?.impersonationDepth || 1) - 1)

  const handleLogout = async () => {
    await logout()
    router.push("/login")
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

  return (
    <>
    {impersonating && (
      <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">Viewing as: {user?.name}</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs capitalize">{user?.role}</span>
          {backLevels > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs" title={`${backLevels} more login level(s) before your own account`}>
              {backLevels} back {backLevels === 1 ? "step" : "steps"}
            </span>
          )}
        </div>
        <button onClick={handleBackToAdmin} className="flex items-center gap-1.5 font-medium hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to {originIsSaas ? "SaaS Console" : "Admin"}
        </button>
      </div>
    )}
    <header className="h-[64px] sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-[var(--border)] shadow-[0_2px_16px_rgba(15,23,42,0.06)] flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenu}
          className="lg:hidden h-9 w-9 rounded-xl bg-[var(--accent)] border border-[var(--border)] flex items-center justify-center text-[var(--subtitle-color)] hover:text-[var(--title-color)] transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          onClick={toggleDarkMode}
          className="hidden lg:flex h-9 w-9 rounded-xl bg-[var(--accent)] border border-[var(--border)] items-center justify-center text-[var(--subtitle-color)] hover:text-[var(--title-color)] hover:border-orange-200 transition-colors"
          title="Toggle sidebar / theme"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-[15px] lg:text-[16px] font-extrabold tracking-tight text-[var(--title-color)] capitalize leading-none truncate">{pageTitle}</h1>
          <p className="hidden sm:block text-[11px] font-medium text-[var(--subtitle-color)] truncate">{info.name || school?.name || "Admin"} · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-2.5">
        {school && info.adminLogoSrc ? (
          <div className="hidden xl:flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-[var(--accent)] border border-[var(--border)]">
            <img
              src={info.adminLogoSrc}
              alt={info.name}
              className="h-7 w-7 object-contain rounded-full bg-white p-0.5 shadow-sm"
            />
            <span
              className="text-xs font-extrabold max-w-[150px] truncate"
              style={{ color: info.schoolNameColor || "var(--title-color)" }}
            >
              {info.name}
            </span>
          </div>
        ) : (
          school && (
            <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-300">
              {school.name}
              <span className="font-mono opacity-70">({school.code})</span>
            </span>
          )
        )}
        <Link
          href="/admin/students-inventory/student-sales"
          className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-black shadow-sm transition-all hover:scale-[1.02] ${isPosPage ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-orange-200" : "bg-gradient-to-br from-orange-500 to-amber-500 text-white hover:shadow-md"}`}
          title="Go to POS"
        >
          <Store className="h-3.5 w-3.5" />
          POS
        </Link>
        <QuickLinks />
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, fees…"
            className="pl-9 pr-4 py-2 text-sm border border-[var(--border)] rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-300 w-56 xl:w-72 bg-[var(--accent)] text-[var(--title-color)] placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={toggleDarkMode}
          className="h-9 w-9 rounded-full bg-[var(--accent)] border border-[var(--border)] flex items-center justify-center text-[var(--subtitle-color)] hover:text-[var(--title-color)] hover:border-orange-200 transition-colors"
          title="Toggle dark mode"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <span className="h-6 w-px bg-[var(--border)] hidden sm:block" />
        <NotificationBell />
        <ThemeSettings />
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-[var(--accent)] border border-[var(--border)] hover:border-orange-200 hover:shadow-sm transition-all"
            title="Account"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xs font-black shadow">
              {(user?.name || "SA").charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:block text-xs font-bold text-[var(--title-color)] max-w-[110px] truncate">
              {user?.name || "User"}
            </span>
            <span className="hidden md:flex h-6 w-6 rounded-full bg-white dark:bg-white/10 border border-[var(--border)] items-center justify-center">
              <ChevronDown className={`h-3 w-3 text-[var(--subtitle-color)] transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </span>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-[var(--border)] bg-white dark:bg-slate-800 shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                  <p className="text-sm font-black truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-white/80 truncate">{user?.email}</p>
                  {user?.role && (
                    <span className="mt-1.5 inline-block rounded-full bg-white/20 backdrop-blur px-2.5 py-0.5 text-[10px] font-black tracking-wide uppercase">
                      {user.role.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                <div className="p-1.5">
                  <Link
                    href={`/admin/staff/profile/${user?.id ?? ""}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-[var(--title-color)] hover:bg-[var(--accent)] transition-colors"
                  >
                    <span className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center text-blue-600"><User className="h-3.5 w-3.5" /></span> My Profile
                  </Link>
                  <Link
                    href="/admin/account/security"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-[var(--title-color)] hover:bg-[var(--accent)] transition-colors"
                  >
                    <span className="h-7 w-7 rounded-lg bg-violet-50 dark:bg-violet-500/15 flex items-center justify-center text-violet-600"><ShieldCheck className="h-3.5 w-3.5" /></span> Account Security
                  </Link>
                  <div className="h-px bg-[var(--border)] my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-bold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                  >
                    <span className="h-7 w-7 rounded-lg bg-rose-50 dark:bg-rose-500/15 flex items-center justify-center"><LogOut className="h-3.5 w-3.5" /></span> Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
    </>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const pathname = usePathname()

  const pageTitle = pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Dashboard"

  const hideHeader = pathname.includes("/online-exam/evaluation/")

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("admin-dark") === "1" : false
    setDarkMode(saved)
  }, [])

  useEffect(() => {
    const root = typeof window !== "undefined" ? document.documentElement : null
    if (root) root.classList.toggle("dark", darkMode)
    if (typeof window !== "undefined") window.localStorage.setItem("admin-dark", darkMode ? "1" : "0")
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev)
  }

  return (
    <AuthProvider>
      <SessionProvider>
        <AdminThemeProvider />
        <div className="flex h-screen">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />

          <div className="flex-1 flex flex-col min-w-0 bg-[#fdfaf7] dark:bg-slate-950 relative">
            {/* clean premium wash — no dotted spots */}
            <div className="pointer-events-none absolute top-0 inset-x-0 h-[420px] bg-gradient-to-b from-orange-50/70 via-amber-50/30 to-transparent dark:from-orange-950/20 dark:via-transparent" />
            {!hideHeader && (
              <AdminHeader
                pageTitle={pageTitle}
                toggleDarkMode={toggleDarkMode}
                darkMode={darkMode}
                onMenu={() => setMobileOpen(true)}
              />
            )}

            <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
              <CurrencyProvider>{children}</CurrencyProvider>
            </main>
            <AdminAssistant />
          </div>
        </div>
      </SessionProvider>
    </AuthProvider>
  )
}
