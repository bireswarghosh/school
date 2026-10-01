// Shared fine computation for student fee invoices.
// Fee masters carry the fine terms (fine_type / fine_value / per_day / fine_rows)
// and a due date. The fine is charged on unpaid, overdue invoices only — invoices
// that are already paid are never penalised again.

export type FeeFineRow = {
  overdueDays?: number | string | null
  fineAmount?: number | string | null
}

export type FeeFineTerms = {
  fineType?: string | null
  fineValue?: number | string | null
  perDay?: boolean | null
  fineRows?: FeeFineRow[] | null
  dueDate?: string | null
  dueDay?: number | string | null
}

export const PAID_STATUSES = new Set(["paid", "success"])

export function isPaid(status?: string | null): boolean {
  return PAID_STATUSES.has(String(status || "").toLowerCase())
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// Effective due date for a fee master: monthly due_day resolves to the current
// month's date, otherwise the fixed due_date.
export function effectiveDueDate(terms: FeeFineTerms | null | undefined, today?: string): string | null {
  if (!terms) return null
  if (terms.dueDay && Number(terms.dueDay) >= 1 && Number(terms.dueDay) <= 28) {
    const now = today ? new Date(today + "T00:00:00") : new Date()
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), Number(terms.dueDay)))
    return d.toISOString().split("T")[0]
  }
  return terms.dueDate || null
}

// Whole days between due date and today (or the supplied reference date).
export function overdueDays(dueDate?: string | null, today?: string): number {
  if (!dueDate) return 0
  const todayStr = today || new Date().toISOString().slice(0, 10)
  const due = new Date(String(dueDate).slice(0, 10) + "T00:00:00")
  const t = new Date(todayStr + "T00:00:00")
  return Math.floor((t.getTime() - due.getTime()) / 86400000)
}

// Compute the fine owed on a fee invoice according to the fee master's terms.
// Returns 0 when the invoice is already paid, the terms are not set, or the
// invoice is not yet overdue.
export function computeFine(opts: {
  terms?: FeeFineTerms | null
  amount: number
  dueDate?: string | null
  status?: string | null
  today?: string
}): number {
  const { terms, amount, dueDate, status, today } = opts
  if (isPaid(status)) return 0
  const ft = String(terms?.fineType || "").trim()
  if (!ft || ft === "None") return 0
  const due = dueDate || effectiveDueDate(terms, today)
  const od = overdueDays(due, today)
  if (od <= 0) return 0

  if (ft === "Percentage") {
    return round2(((Number(amount) || 0) * (Number(terms?.fineValue) || 0)) / 100)
  }
  if (ft === "Fix Amount") {
    return round2(Number(terms?.fineValue) || 0)
  }
  if (ft === "Cumulative") {
    const rows = Array.isArray(terms?.fineRows) ? terms!.fineRows! : []
    const sorted = rows
      .map((r) => ({ d: Math.max(0, Number(r.overdueDays) || 0), f: round2(Number(r.fineAmount) || 0) }))
      .filter((r) => r.f > 0)
      .sort((a, b) => a.d - b.d)
    if (sorted.length === 0) return 0
    let total = 0
    if (terms?.perDay) {
      for (const r of sorted) total += r.f * Math.max(0, od - r.d + 1)
    } else {
      for (const r of sorted) if (od >= r.d) total += r.f
    }
    return round2(total)
  }
  return 0
}