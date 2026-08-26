"use client"

import { useCallback, useEffect, useState } from "react"

// Loads and saves per-school key/value settings via /api/school-settings.
// `prefix` scopes the keys a page reads/writes (e.g. "behaviour." -> "behaviour.studentComment").
export function useSchoolSettings(prefix: string) {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/school-settings")
      if (!res.ok) throw new Error(`Failed to load settings (${res.status})`)
      const data: Record<string, string> = await res.json()
      setSettings(data)
      setError(null)
      return data
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      return {} as Record<string, string>
    } finally {
      setLoading(false)
    }
  }, [])

  // Kick off on mount via macrotask: all state updates happen asynchronously
  useEffect(() => {
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
  }, [load])

  const save = useCallback(
    async (values: Record<string, string>) => {
      setSaving(true)
      try {
        setError(null)
        const res = await fetch("/api/school-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Save failed (${res.status})`)
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        return false
      } finally {
        setSaving(false)
      }
    },
    []
  )

  // Scoped view of the settings map with the prefix stripped
  const scoped: Record<string, string> = {}
  for (const [k, v] of Object.entries(settings)) {
    if (!prefix || k.startsWith(prefix)) scoped[k.slice(prefix.length)] = v
  }

  return { settings: scoped, rawSettings: settings, loading, saving, error, save, reload: load }
}

export type SchoolSettingsState = ReturnType<typeof useSchoolSettings>
