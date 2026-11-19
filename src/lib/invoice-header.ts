// Shared, client-safe definitions for the Student Sales POS invoice header.
// The DB-backed resolver lives in `si-invoice-header.ts` (server only).
export type SiInvoiceHeader = {
  name: string
  tagline: string
  address: string
  phone: string
  email: string
  footer: string
}

export const SI_INVOICE_HEADER_KEYS: Record<keyof SiInvoiceHeader, string> = {
  name: "si.invoiceHeader.name",
  tagline: "si.invoiceHeader.tagline",
  address: "si.invoiceHeader.address",
  phone: "si.invoiceHeader.phone",
  email: "si.invoiceHeader.email",
  footer: "si.invoiceHeader.footer",
}

export const DEFAULT_INVOICE_FOOTER = "Thank you for your purchase! This is a computer-generated invoice."

export const EMPTY_INVOICE_HEADER: SiInvoiceHeader = {
  name: "",
  tagline: "",
  address: "",
  phone: "",
  email: "",
  footer: "",
}

type SchoolLike = {
  name?: string | null
  tagline?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}

/** Merge saved `si.invoiceHeader.*` settings over the school profile fallbacks. */
export function siInvoiceHeaderFromSettings(
  settings: Record<string, string | null | undefined>,
  school?: SchoolLike | null,
  fallback?: SchoolLike | null
): SiInvoiceHeader {
  const get = (k: keyof SiInvoiceHeader) => (settings[SI_INVOICE_HEADER_KEYS[k]] || "").trim()
  return {
    name: get("name") || fallback?.name || school?.name || "Smart School",
    tagline: get("tagline") || fallback?.tagline || school?.tagline || "",
    address: get("address") || fallback?.address || school?.address || "",
    phone: get("phone") || fallback?.phone || school?.phone || "",
    email: get("email") || fallback?.email || school?.email || "",
    footer: get("footer") || DEFAULT_INVOICE_FOOTER,
  }
}

/** Reads the `si.invoiceHeader.*` keys out of a /api/school-settings payload. */
export function pickInvoiceHeaderSettings(source: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of Object.values(SI_INVOICE_HEADER_KEYS)) {
    if (typeof source[key] === "string") out[key] = source[key] as string
  }
  return out
}
