import { query } from "@/lib/db"
import {
  siInvoiceHeaderFromSettings,
  type SiInvoiceHeader,
} from "@/lib/invoice-header"

export type { SiInvoiceHeader }
export { SI_INVOICE_HEADER_KEYS, DEFAULT_INVOICE_FOOTER, siInvoiceHeaderFromSettings } from "@/lib/invoice-header"

/**
 * Invoice header shown on Student Sales POS receipts / invoices.
 * Stored per school in `school_settings` under the `si.invoiceHeader.*` keys so
 * an admin can change it any time from the POS screen without touching the
 * school profile used by the rest of the app.
 */
export async function getSiInvoiceHeader(schoolId: number | null | undefined): Promise<SiInvoiceHeader> {
  if (!schoolId) return siInvoiceHeaderFromSettings({})
  try {
    const [settingsRes, schoolRes] = await Promise.all([
      query(
        `SELECT key, value FROM school_settings
         WHERE school_id = $1 AND key LIKE 'si.invoiceHeader.%'`,
        [schoolId]
      ),
      query(`SELECT name, tagline, address, phone, email FROM schools WHERE id = $1`, [schoolId]),
    ])
    const settings: Record<string, string> = {}
    for (const row of settingsRes.rows) settings[row.key] = row.value
    return siInvoiceHeaderFromSettings(settings, schoolRes.rows[0] || null)
  } catch {
    return siInvoiceHeaderFromSettings({})
  }
}
