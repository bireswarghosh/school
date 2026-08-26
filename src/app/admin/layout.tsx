"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Sidebar from "@/components/Sidebar"
import { Menu, Search, Moon, Sun, LogOut, ChevronDown, User, Store } from "lucide-react"
import NotificationBell from "@/components/NotificationBell"
import ThemeSettings from "@/components/ThemeSettings"
import QuickLinks from "@/components/QuickLinks"
import { CurrencyProvider } from "@/lib/currency-context"
import { SessionProvider } from "@/lib/session-context"
import { AuthProvider, useAuth } from "@/lib/auth-context"

function AdminHeader({ pageTitle, toggleDarkMode, darkMode, onMenu }: { pageTitle: string; toggleDarkMode: () => void; darkMode: boolean; onMenu: () => void }) {
  const { user, school, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const isPosPage = pathname === "/admin/students-inventory/student-sales"

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <header className="h-16 glass-panel flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 rounded-none border-b">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenu}
          className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Menu className="h-6 w-6" />
        </button>
        <button
          onClick={toggleDarkMode}
          className="hidden lg:block text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-[var(--title-color)] capitalize">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        {school && (
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--primary-light)] text-[var(--primary)]">
            {school.name}
            <span className="font-mono">({school.code})</span>
          </span>
        )}
        {isPosPage && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--primary-light)] text-[var(--primary)]">
            <Store className="h-4 w-4" />
            POS
          </span>
        )}
        <QuickLinks />
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent w-48 lg:w-64 bg-[var(--card)] text-[var(--foreground)]"
          />
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <NotificationBell />
        <ThemeSettings />
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Account"
          >
            <div className="h-8 w-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-medium">
              {(user?.name || "SA").charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
              {user?.name || "User"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-[var(--border)] bg-white dark:bg-gray-800 shadow-xl z-50 py-1.5">
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  {user?.role && (
                    <span className="mt-1 inline-block rounded-full bg-[var(--primary-light)] px-2 py-0.5 text-xs font-medium text-[var(--primary)] capitalize">
                      {user.role.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                <Link
                  href={`/admin/staff/profile/${user?.id ?? ""}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="h-4 w-4" /> My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <AuthProvider>
      <SessionProvider>
        <div className={`flex h-screen ${darkMode ? "dark" : ""}`}>
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />

          <div className="flex-1 flex flex-col min-w-0 bg-[var(--background)]">
            {!hideHeader && (
              <AdminHeader
                pageTitle={pageTitle}
                toggleDarkMode={toggleDarkMode}
                darkMode={darkMode}
                onMenu={() => setMobileOpen(true)}
              />
            )}

            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              <CurrencyProvider>{children}</CurrencyProvider>
            </main>
          </div>
        </div>
      </SessionProvider>
    </AuthProvider>
  )
}
