"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ShieldCheck, LayoutDashboard, School, Menu, LogOut, Users, Crown, Loader2, Receipt, CreditCard, Code2, Moon, Sun, UserCog } from "lucide-react"
import { AuthProvider, useAuth } from "@/lib/auth-context"

function SaasShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("saas-dark") === "1" : false
    setDarkMode(saved)
  }, [])

  useEffect(() => {
    const root = typeof window !== "undefined" ? document.documentElement : null
    if (root) root.classList.toggle("dark", darkMode)
    if (typeof window !== "undefined") window.localStorage.setItem("saas-dark", darkMode ? "1" : "0")
  }, [darkMode])

  useEffect(() => {
    if (!loading && (!user || user.role !== "super_admin")) {
      router.push("/saas/login")
    }
  }, [loading, user, router])

  if (loading || !user || user.role !== "super_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  const links = [
    { label: "Dashboard", path: "/saas", icon: LayoutDashboard },
    { label: "Schools", path: "/saas/schools", icon: School },
    { label: "Plans", path: "/saas/plans", icon: Crown },
    { label: "Invoices", path: "/saas/invoices", icon: Receipt },
    { label: "Payment Settings", path: "/saas/payment-settings", icon: CreditCard },
    { label: "Users", path: "/saas/users", icon: Users },
    { label: "REST API", path: "/saas/rest-api", icon: Code2 },
    { label: "My Account", path: "/saas/account", icon: UserCog },
  ]

  const isActive = (path: string) => (path === "/saas" ? pathname === "/saas" : pathname.startsWith(path))

  const sidebar = (
    <nav className="flex-1 px-3 space-y-1 mt-4">
      {links.map((l) => (
        <Link
          key={l.path}
          href={l.path}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isActive(l.path)
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--sidebar-text)] hover:bg-white/10"
          }`}
        >
          <l.icon className="h-5 w-5" />
          {l.label}
        </Link>
      ))}
    </nav>
  )

  return (
    <div className="flex h-screen bg-[var(--background)]">
      <aside className="hidden lg:flex w-64 flex-col bg-[var(--sidebar-bg)] text-[var(--sidebar-text)]">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
          <div className="h-9 w-9 rounded-xl bg-[var(--secondary)] flex items-center justify-center text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-white leading-tight">Smart School</p>
            <p className="text-xs text-[var(--sidebar-text)] opacity-80">SaaS Console</p>
          </div>
        </div>
        {sidebar}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-semibold">
              {(user.name || "S").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-[var(--sidebar-text)] opacity-80">Super Admin</p>
            </div>
            <button
              onClick={async () => {
                await logout()
                router.push("/saas/login")
              }}
              className="p-2 text-[var(--sidebar-text)] hover:text-white hover:bg-white/10 rounded-lg"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col bg-[var(--sidebar-bg)] text-[var(--sidebar-text)]">
            <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
              <div className="h-9 w-9 rounded-xl bg-[var(--secondary)] flex items-center justify-center text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="font-bold text-white">Smart School SaaS</p>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 glass-panel flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 border-b">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-gray-500">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-[var(--title-color)] capitalize">
              {pathname === "/saas" ? "SaaS Dashboard" : pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "Console"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[var(--subtitle-color)] hidden sm:block">Super Admin</span>
            <button
              onClick={() => setDarkMode((v) => !v)}
              className="p-2 text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="h-8 w-8 rounded-full bg-[var(--secondary)] flex items-center justify-center text-white text-sm font-medium">
              {(user.name || "S").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

export default function SaasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === "/saas/login") {
    return <>{children}</>
  }
  return (
    <AuthProvider>
      <SaasShell>{children}</SaasShell>
    </AuthProvider>
  )
}
