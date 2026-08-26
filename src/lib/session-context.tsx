"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export type SessionInfo = {
  id: number
  name: string
  startDate: string
  endDate: string
}

type SessionContextValue = {
  sessions: SessionInfo[]
  current: SessionInfo | null
  loading: boolean
  switchSession: (id: number) => Promise<void>
  refresh: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue>({
  sessions: [],
  current: null,
  loading: true,
  switchSession: async () => {},
  refresh: async () => {},
})

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [current, setCurrent] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [listRes, currentRes] = await Promise.all([
        fetch("/api/system-setting/session"),
        fetch("/api/system-setting/session/current"),
      ])
      const list = await listRes.json()
      const currentData = await currentRes.json()
      setSessions(list)
      setCurrent(currentData.session ?? null)
    } catch {
      // ignore network errors; keep previous state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const switchSession = useCallback(
    async (id: number) => {
      const res = await fetch("/api/system-setting/session/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to switch session")
      }
      const data = await res.json()
      setCurrent(data.session)
      setSessions((prev) =>
        prev.map((s) => ({ ...s, isActive: s.id === data.session?.id }))
      )
      window.dispatchEvent(new CustomEvent("session-changed", { detail: data.session }))
    },
    []
  )

  return (
    <SessionContext.Provider value={{ sessions, current, loading, switchSession, refresh }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
