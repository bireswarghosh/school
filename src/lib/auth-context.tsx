"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export type AuthUser = {
  id: number
  name: string
  email: string
  role: string
  permissions: string[]
  schoolId: number | null
}

export type School = {
  id: number
  code: string
  name: string
  email?: string
  phone?: string
  status?: string
  plan?: string
}

type AuthContextValue = {
  user: AuthUser | null
  school: School | null
  loading: boolean
  authenticated: boolean
  hasPermission: (perm: string) => boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  school: null,
  loading: true,
  authenticated: false,
  hasPermission: () => true,
  logout: async () => {},
  refresh: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setSchool(data.school)
      } else {
        setUser(null)
        setSchool(null)
      }
    } catch {
      setUser(null)
      setSchool(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const hasPermission = useCallback(
    (perm: string) => {
      if (!user) return false
      if (user.role === "super_admin" || user.role === "admin") return true
      return user.permissions.includes("*") || user.permissions.includes(perm)
    },
    [user]
  )

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    setSchool(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, school, loading, authenticated: !!user, hasPermission, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
