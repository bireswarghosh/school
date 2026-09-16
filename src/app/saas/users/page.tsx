"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Users, Loader2, Search, LogIn, ChevronLeft, ChevronRight } from "lucide-react"

type UserRow = {
  id: number
  name: string
  email: string
  role: string
  status: string
  last_login: string | null
  school_name: string | null
  school_code: string | null
}

const PER_PAGE = 10

export default function SaasUsers() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [loginAsId, setLoginAsId] = useState<number | null>(null)
  const [loginError, setLoginError] = useState("")

  useEffect(() => {
    fetch("/api/saas/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data.filter((u: UserRow) => u.role === "admin"))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.school_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.school_code || "").toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const handleLoginAs = async (u: UserRow) => {
    setLoginError("")
    setLoginAsId(u.id)
    try {
      const res = await fetch("/api/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, returnUrl: "/saas/users" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLoginError(data.error || "Auto-login failed")
        setLoginAsId(null)
        return
      }
      router.push(data.redirect || "/admin")
      router.refresh()
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : "Network error")
      setLoginAsId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--title-color)]">School Admins</h2>
          <p className="text-sm text-[var(--subtitle-color)] mt-1">Admin users across all schools — auto-login to manage a school</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search admins..."
          className="pl-9 pr-4 py-2 w-full text-sm border border-[var(--border)] rounded-xl bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>

      {loginError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          {loginError}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--subtitle-color)] bg-[var(--muted)]">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">School</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last login</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                paged.map((u) => (
                  <tr key={u.id} className="border-t border-[var(--border)]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-semibold">
                          {(u.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{u.name}</p>
                          <p className="text-xs text-[var(--subtitle-color)]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[var(--foreground)]">
                      {u.school_name ? `${u.school_name} (${u.school_code})` : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs ${u.status === "Active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" : "bg-red-50 text-red-600 dark:bg-red-950/40"}`}>
                        {u.status || "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--subtitle-color)]">
                      {u.last_login ? new Date(u.last_login).toLocaleString() : "Never"}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleLoginAs(u)}
                        disabled={loginAsId !== null || (u.status !== "Active" && u.status !== "active")}
                        title={u.status !== "Active" && u.status !== "active" ? "Account inactive" : "Auto-login as this school admin"}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loginAsId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
                        Auto login
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-[var(--subtitle-color)]">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No school admins found.</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--subtitle-color)]">
              Showing {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <span className="text-sm text-[var(--subtitle-color)]">
                Page {safePage} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}