"use client"

import { useEffect, useMemo, useState } from "react"
import { X, Printer, Loader2, Search, FileText } from "lucide-react"
import { useCurrency } from "@/lib/currency-context"
import { useAuth } from "@/lib/auth-context"
import { useSchoolInfo } from "@/lib/use-school-info"
import { schoolPrintHeader } from "@/lib/school-print-branding"

type ColumnType = "text" | "money" | "number" | "percent" | "date"
type DrillColumn = { key: string; label: string; type?: ColumnType; align?: "left" | "right" | "center" }
type DrillResponse = { type: string; title: string; subtitle?: string; columns: DrillColumn[]; rows: Record<string, any>[] }

export type DrillRequest = { type: string; title?: string }

const esc = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const fmtDate = (v: any) => {
  if (!v) return "—"
  const s = String(v).slice(0, 10)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v)
}

function badgeTone(value: unknown) {
  const v = String(value ?? "").toLowerCase()
  if (["present", "paid", "active", "success", "approved", "resolved", "closed", "received"].includes(v) || v.includes("paid"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (["absent", "unpaid", "pending", "rejected", "failed", "overdue"].includes(v) || v.includes("pending"))
    return "bg-rose-50 text-rose-700 border-rose-200"
  if (["late", "partial", "half day", "suspended"].includes(v) || v.includes("partial"))
    return "bg-amber-50 text-amber-700 border-amber-200"
  return "bg-slate-100 text-slate-700 border-slate-200"
}

export function DashboardDrilldown({ request, onClose }: { request: DrillRequest | null; onClose: () => void }) {
  const { symbol } = useCurrency()
  const { user } = useAuth()
  const school = useSchoolInfo()
  const [data, setData] = useState<DrillResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [q, setQ] = useState("")
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([])
  const [sections, setSections] = useState<{ id: number; name: string; class_id?: number | null }[]>([])
  const [feeKind, setFeeKind] = useState<"collected" | "pending">("collected")
  const [feeMonth, setFeeMonth] = useState("")
  const [feeClass, setFeeClass] = useState("")
  const [feeSection, setFeeSection] = useState("")

  const isFees = !!request && ["fees-collected", "pending-fees", "fee-health"].includes(request.type)

  useEffect(() => {
    fetch("/api/academics/class")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setClasses(Array.isArray(d) ? d : []))
      .catch(() => {})
    fetch("/api/academics/section")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setSections(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  const loadRecords = (kind: "collected" | "pending", month: string, classId: string, sectionId: string) => {
    if (!request) return () => {}
    let alive = true
    setLoading(true)
    setError("")
    setData(null)
    setQ("")
    const fees = ["fees-collected", "pending-fees", "fee-health"].includes(request.type)
    const type = fees ? (kind === "pending" ? "pending-fees" : "fees-collected") : request.type
    const qs = new URLSearchParams({ type })
    if (fees) {
      if (month) qs.set("month", month)
      if (classId) qs.set("classId", classId)
      if (sectionId) qs.set("sectionId", sectionId)
    }
    fetch(`/api/admin/dashboard/drilldown?${qs.toString()}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d?.error || "Failed to load records")
        return d
      })
      .then((d: DrillResponse) => {
        if (alive) setData(request.title && !fees ? { ...d, title: request.title } : d)
      })
      .catch((e) => alive && setError(e.message || "Failed to load records"))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }

  useEffect(() => {
    if (!request) return
    const initial: "collected" | "pending" =
      request.type === "pending-fees" || request.type === "fee-health" ? "pending" : "collected"
    setFeeKind(initial)
    setFeeMonth("")
    setFeeClass("")
    setFeeSection("")
    const cancel = loadRecords(initial, "", "", "")
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request])

  const classSections = feeClass
    ? sections.filter((s) => String(s.class_id ?? "") === feeClass)
    : sections


  const columns = data?.columns ?? []
  const rows = useMemo(() => {
    const all = data?.rows ?? []
    if (!q.trim()) return all
    const needle = q.trim().toLowerCase()
    return all.filter((r) => columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(needle)))
  }, [data, q, columns])

  const money = (v: any) => `${symbol}${Number(v ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const format = (c: DrillColumn, v: any) => {
    if (v === null || v === undefined || v === "") return "—"
    switch (c.type) {
      case "money":
        return money(v)
      case "number":
        return Number(v).toLocaleString("en-IN")
      case "percent":
        return `${Number(v)}%`
      case "date":
        return fmtDate(v)
      default:
        return String(v)
    }
  }

  const totals = useMemo(() => {
    const out: Record<string, number> = {}
    for (const c of columns) {
      if (c.type !== "money" && c.type !== "number") continue
      out[c.key] = rows.reduce((sum, r) => sum + (Number(r[c.key]) || 0), 0)
    }
    return out
  }, [columns, rows])

  const moneyColumns = columns.filter((c) => c.type === "money")
  const totalMoney = moneyColumns.reduce((sum, c) => sum + (totals[c.key] || 0), 0)

  const monthName = (ym: string) => {
    if (!/^\d{4}-\d{2}$/.test(ym)) return ""
    const [y, m] = ym.split("-")
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
  }
  const feeFilterChips = isFees
    ? [
        feeKind === "pending" ? "Pending dues" : "Collected",
        feeMonth ? monthName(feeMonth) : "All months",
        feeClass ? classes.find((c) => String(c.id) === feeClass)?.name || "Class" : "All classes",
        feeSection ? sections.find((s) => String(s.id) === feeSection)?.name || "Section" : "All sections",
      ]
    : []

  const printRecords = () => {
    if (!data) return
    const info = {
      name: school.info.name || "Smart School",
      address: school.info.address,
      phone: school.info.phone,
      email: school.info.email,
      website: school.info.website,
      logoSrc: school.info.logoSrc,
    }
    const head = columns
      .map((c) => `<th class="${c.align ?? "left"}">${esc(c.label)}</th>`)
      .join("")
    const body = rows
      .map(
        (r, i) => `<tr>
          <td class="c">${i + 1}</td>
          ${columns.map((c) => `<td class="${c.align ?? "left"}">${esc(format(c, r[c.key]))}</td>`).join("")}
        </tr>`
      )
      .join("")
    const totalRow =
      Object.keys(totals).length > 0
        ? `<tfoot><tr>
            <td class="c">—</td>
            ${columns
              .map((c) =>
                totals[c.key] !== undefined
                  ? `<td class="${c.align ?? "left"} strong">${esc(c.type === "money" ? money(totals[c.key]) : Number(totals[c.key]).toLocaleString("en-IN"))}</td>`
                  : `<td></td>`
              )
              .join("")}
          </tr></tfoot>`
        : ""
    const generated = new Date().toLocaleString("en-IN")
    const preparedBy = user?.name || school.info.name || "Administrator"

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${esc(data.title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Arial, Helvetica, "Segoe UI", sans-serif; color: #1f2937; font-size: 11.5px; line-height: 1.45; padding: 26px 28px; }
  .doc-head { border-bottom: 3px solid #ff7732; padding-bottom: 14px; margin-bottom: 14px; }
  .title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-top: 12px; }
  .title-row h2 { font-size: 17px; color: #111827; letter-spacing: .2px; }
  .title-row .sub { color: #6b7280; font-size: 11px; margin-top: 2px; }
  .meta { text-align: right; font-size: 10.5px; color: #4b5563; line-height: 1.7; white-space: nowrap; }
  .meta b { color: #111827; }
  .summary { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 14px; }
  .chip { border: 1px solid #e5e7eb; background: #f9fafb; border-radius: 999px; padding: 4px 11px; font-size: 10.5px; color: #374151; }
  .chip b { color: #111827; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  th { background: #ff7732; color: #fff; font-size: 9.5px; text-transform: uppercase; letter-spacing: .5px; padding: 7px 8px; text-align: left; }
  td { padding: 6px 8px; border-bottom: 1px solid #eceff3; vertical-align: top; }
  tbody tr:nth-child(even) { background: #fafbfc; }
  tr { page-break-inside: avoid; }
  .c { text-align: center; }
  .r { text-align: right; }
  th.r { text-align: right; }
  th.c { text-align: center; }
  .strong { font-weight: 700; color: #111827; }
  tfoot td { background: #fff7ed; border-top: 2px solid #ff7732; font-weight: 700; color: #111827; }
  .foot { margin-top: 18px; border-top: 1px solid #e5e7eb; padding-top: 10px; display: flex; justify-content: space-between; color: #6b7280; font-size: 10px; }
  .foot .sig { text-align: right; }
  .foot .sig .line { display: inline-block; border-top: 1px solid #9ca3af; padding-top: 4px; margin-top: 22px; min-width: 150px; }
  @page { size: A4 landscape; margin: 12mm; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="doc-head">
    ${schoolPrintHeader(info)}
    <div class="title-row">
      <div>
        <h2>${esc(data.title)}</h2>
        ${data.subtitle ? `<div class="sub">${esc(data.subtitle)}</div>` : ""}
      </div>
      <div class="meta">
        <div><b>Records:</b> ${rows.length}</div>
        ${totalMoney ? `<div><b>Total:</b> ${esc(money(totalMoney))}</div>` : ""}
        <div><b>Generated:</b> ${esc(generated)}</div>
        <div><b>Prepared by:</b> ${esc(preparedBy)}</div>
      </div>
    </div>
  </div>
  <div class="summary">
    ${feeFilterChips.map((m) => `<span class="chip">${esc(m)}</span>`).join("")}
    ${columns
      .filter((c) => c.type === "money" || c.type === "number")
      .map((c) => `<span class="chip">${esc(c.label)}: <b>${esc(c.type === "money" ? money(totals[c.key]) : Number(totals[c.key]).toLocaleString("en-IN"))}</b></span>`)
      .join("")}
    <span class="chip">Showing: <b>${rows.length}</b> record(s)</span>
  </div>
  <table>
    <thead><tr><th class="c">#</th>${head}</tr></thead>
    <tbody>${body || `<tr><td class="c" colspan="${columns.length + 1}">No records</td></tr>`}</tbody>
    ${totalRow}
  </table>
  <div class="foot">
    <span>Computer-generated report · ${esc(data.title)}</span>
    <span class="sig"><span class="line">Authorised Signatory</span></span>
  </div>
</body>
</html>`

    const frame = document.getElementById("drill-print-frame") as HTMLIFrameElement | null
    if (!frame) return
    frame.onload = () => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    }
    frame.srcdoc = html
  }

  if (!request) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-orange-50 via-amber-50/50 to-white px-5 py-4 dark:border-slate-700 dark:from-orange-950/20 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                {data?.title || request.title || "Records"}
              </h3>
              <p className="mt-0.5 text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
                {data?.subtitle || "Detailed record view"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={printRecords}
              disabled={!data || loading}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 px-3.5 py-2 text-xs font-black text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-2.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300">
              {loading ? "Loading…" : `${rows.length} record${rows.length === 1 ? "" : "s"}`}
            </span>
            {moneyColumns.map((c) => (
              <span key={c.key} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {c.label}: <b className="text-slate-900 dark:text-white">{money(totals[c.key] || 0)}</b>
              </span>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search records…"
              className="w-56 rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {isFees && (
          <div className="border-b border-slate-100 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-end gap-2.5">
              <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                {([
                  { k: "collected", label: "Collected" },
                  { k: "pending", label: "Pending Dues" },
                ] as const).map((o) => (
                  <button
                    key={o.k}
                    type="button"
                    onClick={() => {
                      setFeeKind(o.k)
                      loadRecords(o.k, feeMonth, feeClass, feeSection)
                    }}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-black transition-all ${
                      feeKind === o.k
                        ? o.k === "pending"
                          ? "bg-rose-500 text-white shadow"
                          : "bg-emerald-600 text-white shadow"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Month</label>
                <input
                  type="month"
                  value={feeMonth}
                  onChange={(e) => setFeeMonth(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Class</label>
                <select
                  value={feeClass}
                  onChange={(e) => {
                    setFeeClass(e.target.value)
                    if (feeSection && !sections.some((s) => String(s.id) === feeSection && String(s.class_id ?? "") === e.target.value)) {
                      setFeeSection("")
                    }
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="">All classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Section</label>
                <select
                  value={feeSection}
                  onChange={(e) => setFeeSection(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="">All sections</option>
                  {classSections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => loadRecords(feeKind, feeMonth, feeClass, feeSection)}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 px-4 py-2 text-xs font-black text-white shadow-sm transition-all hover:shadow-md"
              >
                <Search className="h-3.5 w-3.5" /> Show Records
              </button>
              {(feeMonth || feeClass || feeSection || feeKind !== "collected") && (
                <button
                  type="button"
                  onClick={() => {
                    setFeeMonth("")
                    setFeeClass("")
                    setFeeSection("")
                    setFeeKind("collected")
                    loadRecords("collected", "", "", "")
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" /> Reset
                </button>
              )}
            </div>
            <p className="mt-2 text-[10.5px] font-medium text-slate-400">
              {feeKind === "pending"
                ? "Print the outstanding / due payment report for the selected month, class and section."
                : "Collected fee records for the selected month, class and section."}
            </p>
          </div>
        )}

        {/* body */}
        <div className="min-h-[180px] flex-1 overflow-auto">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading records…
            </div>
          ) : error ? (
            <div className="flex h-48 items-center justify-center px-6 text-center text-sm text-rose-500">{error}</div>
          ) : rows.length === 0 ? (
            <div className="flex h-48 items-center justify-center px-6 text-center text-sm text-slate-400">No records found</div>
          ) : (
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 dark:bg-slate-800">
                  <th className="w-10 px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">#</th>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={`whitespace-nowrap px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ${
                        c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"
                      }`}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r, i) => (
                  <tr key={i} className="transition-colors hover:bg-orange-50/50 dark:hover:bg-orange-500/5">
                    <td className="px-3 py-2 text-center text-[11px] font-bold text-slate-400">{i + 1}</td>
                    {columns.map((c) => {
                      const v = r[c.key]
                      const content = format(c, v)
                      const showBadge = c.type === "text" && typeof v === "string" && ["status", "attendance", "type"].some((k) => c.key.toLowerCase().includes(k))
                      return (
                        <td
                          key={c.key}
                          className={`px-3 py-2 ${
                            c.align === "right" ? "text-right tabular-nums" : c.align === "center" ? "text-center" : "text-left"
                          } ${c.type === "money" || c.type === "number" ? "font-semibold text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-300"}`}
                        >
                          {showBadge && v ? (
                            <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeTone(v)}`}>{content}</span>
                          ) : (
                            content
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
              {Object.keys(totals).length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-orange-300 bg-orange-50/70 dark:border-orange-500/30 dark:bg-orange-500/10">
                    <td className="px-3 py-2.5 text-center text-[11px] font-black text-slate-500">—</td>
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`px-3 py-2.5 text-[11.5px] font-black text-slate-900 dark:text-white ${
                          c.align === "right" ? "text-right tabular-nums" : c.align === "center" ? "text-center" : "text-left"
                        }`}
                      >
                        {totals[c.key] !== undefined ? (c.type === "money" ? money(totals[c.key]) : Number(totals[c.key]).toLocaleString("en-IN")) : ""}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
          <span>Click any card on the dashboard to drill into its records.</span>
          <button onClick={onClose} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Close
          </button>
        </div>
      </div>

      <iframe id="drill-print-frame" title="Drilldown print frame" style={{ position: "fixed", left: -9999, top: 0, width: 1100, height: 900, border: 0 }} />
    </div>
  )
}

export default DashboardDrilldown
