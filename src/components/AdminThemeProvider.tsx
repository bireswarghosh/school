"use client"

import { useEffect } from "react"
import { resolveTheme, BACKEND_THEME_EVENT, CUSTOM_THEME_KEY } from "@/lib/backend-themes"

function applyTheme(key: string | undefined, customColor?: string) {
  const theme = resolveTheme(key, customColor)
  const root = document.documentElement
  root.style.setProperty("--primary", theme.primary)
  root.style.setProperty("--primary-light", `color-mix(in srgb, ${theme.primary} 10%, transparent)`)
  if (theme.sidebar) {
    root.style.setProperty("--sidebar-bg", theme.sidebar)
    root.style.setProperty("--sidebar-text", theme.sidebar === "#ffffff" ? "#334155" : "#cbd5e1")
  } else {
    root.style.setProperty("--sidebar-bg", "#1e293b")
    root.style.setProperty("--sidebar-text", "#cbd5e1")
  }
}

export default function AdminThemeProvider() {
  useEffect(() => {
    fetch("/api/school-settings")
      .then((r) => r.json())
      .then((s: Record<string, string>) => {
        if (s["theme.backendTheme"]) applyTheme(s["theme.backendTheme"], s["theme.backendThemeColor"])
      })
      .catch(() => {})
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (typeof detail === "string") {
        if (detail) applyTheme(detail)
      } else if (detail && typeof detail === "object") {
        const { key, customColor } = detail as { key?: string; customColor?: string }
        if (key) applyTheme(key, key === CUSTOM_THEME_KEY ? customColor : undefined)
      }
    }
    window.addEventListener(BACKEND_THEME_EVENT, onEvent)
    return () => window.removeEventListener(BACKEND_THEME_EVENT, onEvent)
  }, [])
  return null
}