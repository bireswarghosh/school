"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useSchoolInfo } from "@/lib/use-school-info"
import {
  pickInvoiceHeaderSettings,
  siInvoiceHeaderFromSettings,
  type SiInvoiceHeader,
} from "@/lib/invoice-header"

/**
 * Invoice header configured from the Student Sales POS screen
 * (`si.invoiceHeader.*` in school settings), with the school profile as fallback.
 */
export function useInvoiceHeader() {
  const { school } = useAuth()
  const { info: schoolInfo } = useSchoolInfo()
  const [settings, setSettings] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    fetch("/api/school-settings")
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: Record<string, unknown>) => setSettings(pickInvoiceHeaderSettings(d || {})))
      .catch(() => setSettings({}))
  }, [])

  const header: SiInvoiceHeader = siInvoiceHeaderFromSettings(
    settings || {},
    school,
    {
      name: schoolInfo.name,
      address: schoolInfo.address,
      phone: schoolInfo.phone,
      email: schoolInfo.email,
    }
  )

  return header
}
