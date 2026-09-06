"use client"

import { useEffect, useState } from "react"

// Client-side school identity for printed documents. Reads the merged
// school_settings object (/api/school-settings) which follows the same
// prefixed convention used by General Settings + Appearance.
export type SchoolInfo = {
  name: string
  address: string
  phone: string
  email: string
  website: string
  session: string
  logoSrc: string // "" when not configured — print/logo (slides, documents)
  adminLogoSrc: string // "" when not configured — admin header/sidebar brand
  adminSmallLogoSrc: string // "" when not configured — collapsed sidebar
  schoolNameColor: string // "" when not configured → var(--primary)
}

const defaults: SchoolInfo = {
  name: "Smart School",
  address: "",
  phone: "",
  email: "",
  website: "",
  session: "",
  logoSrc: "",
  adminLogoSrc: "",
  adminSmallLogoSrc: "",
  schoolNameColor: "",
}

export function useSchoolInfo() {
  const [info, setInfo] = useState<SchoolInfo>(defaults)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch("/api/school-settings")
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: Record<string, unknown>) => {
        const str = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "")
        setInfo({
          name: str("general.schoolName") || "Smart School",
          address: str("general.address"),
          phone: str("general.phone"),
          email: str("general.email"),
          website: str("general.website"),
          session: str("general.session"),
          logoSrc: str("logo.printLogo") || str("logo.adminLogo"),
          adminLogoSrc: str("logo.adminLogo") || str("logo.printLogo"),
          adminSmallLogoSrc: str("logo.adminSmallLogo") || str("logo.adminLogo") || str("logo.printLogo"),
          schoolNameColor: str("logo.schoolNameColor") || str("theme.primaryColor"),
        })
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  return { info, loaded }
}