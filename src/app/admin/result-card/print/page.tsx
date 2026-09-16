"use client"

import { useMemo, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Printer, PlayCircle } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { TemplateSetting } from "@/lib/result-card"
import RenderCard from "@/components/result-card/RenderCard"

type RecordRow = {
  id: number
  template_id: number
  student_id: number | null
  data: Record<string, Record<string, any>>
  first_name?: string
  last_name?: string
  roll_no?: string
  class_name?: string
  section_name?: string
}

const DESIGN_W = 794

export default function PrintResultCardsPage() {
  return (
    <Suspense fallback={<p className="p-5 text-sm text-gray-500">Loading…</p>}>
      <PrintInner />
    </Suspense>
  )
}

function PrintInner() {
  const params = useSearchParams()
  const urlTemplateId = params.get("template_id")
  const { data: templates } = useApi<TemplateSetting>("/api/result-card/templates")
  const { data: records, loading } = useApi<RecordRow>(`/api/result-card/records${urlTemplateId ? `?template_id=${urlTemplateId}` : ""}`)
  const [templateId, setTemplateId] = useState<number | null>(urlTemplateId ? Number(urlTemplateId) : null)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const template = templates.find((t) => t.id === templateId) || null
  const templateRecords = useMemo(() => (templateId ? records.filter((r) => r.template_id === templateId) : []), [records, templateId])

  const toggleAll = () => {
    setSelected((prev) => (prev.size === templateRecords.length ? new Set() : new Set(templateRecords.map((r) => r.id))))
  }
  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const setTemplate = (id: number | null) => {
    setTemplateId(id)
    setSelected((prev) => new Set())
  }

  const printable = templateRecords.filter((r) => selected.has(r.id))

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm no-print">
        <h1 className="text-xl font-semibold text-white">Print Result Cards</h1>
        <p className="mt-1 text-sm text-white/80">Custom Result / Print Result Cards</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm no-print">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <select value={templateId || ""} onChange={(e) => setTemplate(e.target.value ? Number(e.target.value) : null)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
            <option value="">Select template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.class_name ? ` (${t.class_name})` : ""}</option>
            ))}
          </select>
          <button onClick={toggleAll} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            {selected.size === templateRecords.length && templateRecords.length > 0 ? "Deselect All" : "Select All"}
          </button>
          <button
            onClick={() => window.print()}
            disabled={printable.length === 0}
            className="ml-auto rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Printer className="h-4 w-4" /> Print {printable.length > 0 ? `(${printable.length})` : ""}
          </button>
        </div>

        {template && (
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {loading && <p className="text-sm text-gray-400 p-2">Loading records…</p>}
            {!loading && templateRecords.length === 0 && (
              <p className="text-sm text-gray-400 p-2">No records for this template yet. Enter results first.</p>
            )}
            {!loading && templateRecords.length > 0 && (
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm cursor-pointer">
                <input type="checkbox" checked={selected.size === templateRecords.length} onChange={toggleAll} className="rounded" />
                <span className="font-medium">All {templateRecords.length} records</span>
              </label>
            )}
            {templateRecords.map((r) => {
              const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || r.data?.__meta?.name || `Record #${r.id}`
              return (
                <label key={r.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="rounded" />
                  <span className="font-medium text-gray-800">{name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{r.roll_no ? `Roll ${r.roll_no}` : ""}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {template && printable.length > 0 && (
        <div className="print-area">
          <div className="no-print text-xs text-gray-500 flex items-center gap-1.5 mb-2">
            <PlayCircle className="h-3.5 w-3.5" /> Preview — use the Print button above.
          </div>
          {printable.map((r) => {
            const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || r.data?.__meta?.name || `Record #${r.id}`
            return (
              <div key={r.id} className="break-block mb-6">
                <div className="no-print text-sm font-medium text-gray-700 mb-1">{name}</div>
                <div className="print-card">
                  <RenderCard template={template} data={r.data} meta={r.data?.__meta} scale={DESIGN_W} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          nav, header, .no-print { display: none !important; }
          .print-area { margin: 0; }
          .break-block { page-break-before: always; }
          .print-card { width: 794px; }
          .print-card > div { margin: 0 !important; page-break-after: always; }
          @page { size: 210mm 297mm; margin: 0; }
        }
      `}</style>
    </div>
  )
}