"use client"

import { useEffect, useState } from "react"
import { Users, Loader2, Search } from "lucide-react"

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

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  admin: "bg-[var(--primary-light)] text-[var(--primary)]",
  teacher: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  staff: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  student: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  parent: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
}

export default function SaasUsers() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/saas/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(
    (u) => (u.name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase()) || (u.school_name || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--title-color)]">Users</h2>
          <p className="text-sm text-[var(--subtitle-color)] mt-1">Every user across all schools</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="pl-9 pr-4 py-2 w-full text-sm border border-[var(--border)] rounded-xl bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>

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
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">School</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last login</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                filtered.map((u) => (
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
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}>
                        {u.role}
                      </span>
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
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-[var(--subtitle-color)]">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No users found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
