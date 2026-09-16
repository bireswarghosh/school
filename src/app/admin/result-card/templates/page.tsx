"use client"

import { useCallback, useEffect, useState } from "react"
import { Save, Plus, Trash2, Edit3, X, Upload, Copy, Move } from "lucide-react"
import { useApi } from "@/lib/use-api"
import {
  TemplateSetting,
  FieldDef,
  TableDef,
  PageDef,
  DEFAULT_GRADE_SCALE,
} from "@/lib/result-card"
import RenderCard from "@/components/result-card/RenderCard"

const SESSIONS = ["2024-25", "2025-26", "2026-27", "2027-28"]

const uid = () => Math.random().toString(36).slice(2, 9)

const emptyTemplate = (): TemplateSetting => ({
  id: 0,
  school_id: null,
  name: "",
  class_id: null,
  class_name: "",
  session: SESSIONS[1],
  pages: [],
  grade_scale: DEFAULT_GRADE_SCALE,
  is_active: true,
})

const sampleStudent = {
  name: "Sample Student",
  rollNo: "7",
  class: "Class - VI",
  section: "A",
  motherName: "Mrs. Sample Mother",
  fatherName: "Mr. Sample Father",
  session: "2025-26",
  photo: "",
}

export default function TemplatesPage() {
  const { data: templates, loading, add, update, remove, refetch } = useApi<TemplateSetting>("/api/result-card/templates")
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([])
  const [editing, setEditing] = useState<TemplateSetting | null>(null)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then(setClasses)
      .catch(() => {})
  }, [])

  const startNew = () => {
    setEditing(emptyTemplate())
    setIsNew(true)
  }
  const startEdit = (t: TemplateSetting) => {
    setEditing(JSON.parse(JSON.stringify(t)))
    setIsNew(false)
  }

  const save = async () => {
    if (!editing) return
    if (!editing.name.trim()) return alert("Template name required")
    const payload: any = { ...editing }
    delete payload.id
    delete payload.school_id
    delete payload.class_name
    if (isNew) await add(payload)
    else await update(editing.id, payload)
    setEditing(null)
    refetch()
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this template and all its records?")) return
    await remove(id)
  }

  const duplicate = async (t: TemplateSetting) => {
    await add({ ...t, id: undefined as any, name: t.name + " (copy)" })
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Result Templates</h1>
        <p className="mt-1 text-sm text-white/80">Custom Result / Result Templates</p>
      </div>

      {!editing && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Templates</h2>
            <button onClick={startNew} className="rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> New Template
            </button>
          </div>
          {loading ? (
            <p className="p-5 text-sm text-gray-500">Loading…</p>
          ) : templates.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">No templates yet. Click "New Template" to build one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Pages</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                      <td className="px-4 py-3">{t.class_name || "—"}</td>
                      <td className="px-4 py-3">{t.session || "—"}</td>
                      <td className="px-4 py-3">{t.pages?.length || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${t.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {t.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => startEdit(t)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--primary)] hover:bg-orange-50">
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button onClick={() => duplicate(t)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editing && (
        <TemplateEditor
          template={editing}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={save}
          classes={classes}
          isNew={isNew}
        />
      )}
    </div>
  )
}

function TemplateEditor({
  template,
  onChange,
  onClose,
  onSave,
  classes,
  isNew,
}: {
  template: TemplateSetting
  onChange: (t: TemplateSetting) => void
  onClose: () => void
  onSave: () => void
  classes: { id: number; name: string }[]
  isNew: boolean
}) {
  const [activePage, setActivePage] = useState(0)
  const [uploading, setUploading] = useState(false)

  const page = template.pages[activePage]
  const set = (patch: Partial<TemplateSetting>) => onChange({ ...template, ...patch })
  const setPage = (p: PageDef) => {
    const pages = template.pages.map((x, i) => (i === activePage ? p : x))
    set({ pages })
  }

  const addPage = () => {
    const p: PageDef = {
      id: `page${uid()}`,
      label: `Page ${template.pages.length + 1}`,
      image: "",
      width: 794,
      height: 1123,
      fields: [],
      tables: [],
    }
    set({ pages: [...template.pages, p] })
    setActivePage(template.pages.length)
  }

  const addField = (type: FieldDef["type"]) => {
    if (!page) return
    const f: FieldDef = { id: `f${uid()}`, label: "New Field", type, x: 50, y: 10, w: 30, h: 3, size: 14, align: "center", bind: type === "text" ? "name" : undefined }
    setPage({ ...page, fields: [...(page.fields || []), f] })
  }

  const addTable = () => {
    if (!page) return
    const t: TableDef = {
      id: `t${uid()}`,
      label: "New Table",
      x: 5,
      y: 20,
      w: 90,
      h: 30,
      fontSize: 11,
      rowsKey: "rows",
      cols: [
        { id: "subject", label: "Subject", type: "text" },
        { id: "marks", label: "Marks", type: "mark", max: 100 },
      ],
    }
    setPage({ ...page, tables: [...(page.tables || []), t] })
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("files", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json()
      const url = json.uploaded?.[0]?.url
      if (url && page) setPage({ ...page, image: url })
    } catch (e: any) {
      alert(e.message)
    } finally {
      setUploading(false)
    }
  }

  const onMove = useCallback(
    (pageId: string, fieldId: string, x: number, y: number, isTable: boolean) => {
      const p = template.pages.find((pg) => pg.id === pageId)
      if (!p) return
      const updatedPage = { ...p }
      if (isTable) updatedPage.tables = (p.tables || []).map((t) => (t.id === fieldId ? { ...t, x, y } : t))
      else updatedPage.fields = (p.fields || []).map((f) => (f.id === fieldId ? { ...f, x, y } : f))
      onChange({ ...template, pages: template.pages.map((pg) => (pg.id === pageId ? updatedPage : pg)) })
    },
    [template, onChange]
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="space-y-5">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">{isNew ? "New Template" : "Edit Template"}</h2>
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-1">
              <X className="h-3.5 w-3.5" /> Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Template Name *</label>
              <input value={template.name} onChange={(e) => set({ name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select value={template.class_id || ""} onChange={(e) => set({ class_id: e.target.value ? Number(e.target.value) : null })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">Any / All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
              <select value={template.session || ""} onChange={(e) => set({ session: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                {SESSIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                <input type="checkbox" checked={template.is_active} onChange={(e) => set({ is_active: e.target.checked })} className="rounded border-gray-300" />
                Active
              </label>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-800 mt-6 mb-2">Grade Scale</h3>
          <div className="space-y-2">
            {template.grade_scale.map((g, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={g.min} onChange={(e) => { const scale = [...template.grade_scale]; scale[i] = { ...g, min: Number(e.target.value) || 0 }; set({ grade_scale: scale }) }} className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none" placeholder="Min" />
                <span className="text-xs text-gray-400">to</span>
                <input value={g.max} onChange={(e) => { const scale = [...template.grade_scale]; scale[i] = { ...g, max: Number(e.target.value) || 0 }; set({ grade_scale: scale }) }} className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none" placeholder="Max" />
                <input value={g.label} onChange={(e) => { const scale = [...template.grade_scale]; scale[i] = { ...g, label: e.target.value }; set({ grade_scale: scale }) }} className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none" placeholder="Grade (A+, A, B+)..." />
                <button onClick={() => set({ grade_scale: template.grade_scale.filter((_, x) => x !== i) })} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const scale = [...template.grade_scale]
              const last = scale[scale.length - 1]
              scale.push(last ? { min: last.max + 1, max: last.max + 10, label: "New" } : { min: 0, max: 39, label: "Below" })
              set({ grade_scale: scale })
            }}
            className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add grade row
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Pages ({template.pages.length})</h2>
            <button onClick={addPage} className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 inline-flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Add Page
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {template.pages.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActivePage(i)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${i === activePage ? "bg-[var(--primary)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {p.label || `Page ${i + 1}`}
              </button>
            ))}
          </div>
          {page && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Page Label</label>
                  <input value={page.label} onChange={(e) => setPage({ ...page, label: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Background Image</label>
                  <div className="flex gap-2">
                    <input value={page.image} onChange={(e) => setPage({ ...page, image: e.target.value })} placeholder="/api/files/…" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
                    <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 inline-flex items-center gap-1">
                      <Upload className="h-4 w-4" />
                      {uploading ? "…" : "Upload"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) uploadImage(f)
                          e.target.value = ""
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Design Width (px)</label>
                  <input type="number" value={page.width} onChange={(e) => setPage({ ...page, width: Number(e.target.value) || 794 })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Design Height (px)</label>
                  <input type="number" value={page.height} onChange={(e) => setPage({ ...page, height: Number(e.target.value) || 1123 })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>

              <PageFieldTable
                page={page}
                onPageChange={setPage}
                onAddField={addField}
                onAddTable={addTable}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onSave} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5">
            <Save className="h-4 w-4" /> Save Template
          </button>
        </div>
      </div>

      <div className="lg:sticky lg:top-4 space-y-3">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-3">
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Move className="h-3.5 w-3.5" /> Drag fields/tables on the preview to position them. Percentages update live.
          </p>
          <div className="overflow-auto max-h-[80vh]">
            <RenderCard
              template={{ ...template, pages: template.pages.map((p, i) => ({ ...p, id: p.id || `page${i}` })) }}
              data={sampleData(template)}
              student={sampleStudent}
              scale={560}
              selectedPage={template.pages[activePage]?.id ?? null}
              onSelectField={(pageId) => {
                const pi = template.pages.findIndex((p) => p.id === pageId)
                if (pi >= 0) setActivePage(pi)
              }}
              movable
              onMoveField={onMove}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function sampleData(template: TemplateSetting): Record<string, Record<string, any>> {
  const out: Record<string, Record<string, any>> = {}
  for (const page of template.pages || []) {
    out[page.id] = {}
    for (const t of page.tables || []) {
      out[page.id][t.id] = [
        { subject: "English", t1_unit: 18, t1_mid: 72, t2_unit: 17, t2_mid: 75 },
        { subject: "Mathematics", t1_unit: 20, t1_mid: 68, t2_unit: 19, t2_mid: 71 },
        { subject: "Science", t1_unit: 15, t1_mid: 60, t2_unit: 16, t2_mid: 66 },
      ]
    }
  }
  return out
}

function PageFieldTable({
  page,
  onPageChange,
  onAddField,
  onAddTable,
}: {
  page: PageDef
  onPageChange: (p: PageDef) => void
  onAddField: (type: FieldDef["type"]) => void
  onAddTable: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const field = (page.fields || []).find((f) => f.id === selected)
  const table = (page.tables || []).find((t) => t.id === selectedTable)

  const setField = (f: FieldDef) => onPageChange({ ...page, fields: (page.fields || []).map((x) => (x.id === f.id ? f : x)) })
  const setTable = (t: TableDef) => onPageChange({ ...page, tables: (page.tables || []).map((x) => (x.id === t.id ? t : x)) })

  const input = "w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["text", "mark", "computed", "photo", "signature"] as const).map((ty) => (
          <button key={ty} onClick={() => onAddField(ty)} className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 capitalize">
            + {ty}
          </button>
        ))}
        <button onClick={onAddTable} className="rounded-lg border border-[var(--primary)] px-2.5 py-1.5 text-xs text-[var(--primary)] hover:bg-orange-50">
          + Table
        </button>
        {page.tables && page.tables.length > 0 && (
          <button onClick={() => { setSelectedTable(page.tables![page.tables!.length - 1].id) }} className="text-xs text-gray-400 underline ml-auto">edit last table</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Fields</h4>
          <div className="space-y-1 max-h-48 overflow-auto">
            {(page.fields || []).map((f) => (
              <button
                key={f.id}
                onClick={() => { setSelected(f.id); setSelectedTable(null) }}
                className={`w-full text-left rounded-md px-2 py-1.5 text-xs ${selected === f.id ? "bg-orange-50 text-[var(--primary)] border border-orange-200" : "bg-gray-50 hover:bg-gray-100 border border-transparent"}`}
              >
                <span className="font-medium">{f.label || f.id}</span> <span className="text-gray-400">({f.type})</span>
              </button>
            ))}
          </div>
          {field && (
            <div className="mt-2 space-y-2 rounded-lg bg-orange-50/50 p-2 border border-orange-100">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] text-gray-500">Label<input className={input} value={field.label} onChange={(e) => setField({ ...field, label: e.target.value })} /></label>
                <label className="text-[10px] text-gray-500">Bind<input className={input} value={field.bind || ""} onChange={(e) => setField({ ...field, bind: e.target.value })} placeholder="name/rollNo/…" /></label>
              </div>
              {field.type === "text" && (
                <label className="text-[10px] text-gray-500 block">Static value<input className={input} value={field.value || ""} onChange={(e) => setField({ ...field, value: e.target.value })} /></label>
              )}
              <div className="grid grid-cols-4 gap-2">
                <label className="text-[10px] text-gray-500">X%<input type="number" className={input} value={field.x} onChange={(e) => setField({ ...field, x: Number(e.target.value) || 0 })} /></label>
                <label className="text-[10px] text-gray-500">Y%<input type="number" className={input} value={field.y} onChange={(e) => setField({ ...field, y: Number(e.target.value) || 0 })} /></label>
                <label className="text-[10px] text-gray-500">W%<input type="number" className={input} value={field.w} onChange={(e) => setField({ ...field, w: Number(e.target.value) || 1 })} /></label>
                <label className="text-[10px] text-gray-500">H%<input type="number" className={input} value={field.h} onChange={(e) => setField({ ...field, h: Number(e.target.value) || 1 })} /></label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-[10px] text-gray-500">Size<input type="number" className={input} value={field.size || 14} onChange={(e) => setField({ ...field, size: Number(e.target.value) || 14 })} /></label>
                <label className="text-[10px] text-gray-500">Align<select className={input} value={field.align || "left"} onChange={(e) => setField({ ...field, align: e.target.value as any })}><option>left</option><option>center</option><option>right</option></select></label>
                <label className="text-[10px] text-gray-500 flex items-center gap-1 mt-4">Bold<input type="checkbox" checked={!!field.bold} onChange={(e) => setField({ ...field, bold: e.target.checked })} /></label>
              </div>
              {field.type === "computed" && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[10px] text-gray-500">Expr<select className={input} value={field.computed?.type || "sum"} onChange={(e) => setField({ ...field, computed: { type: e.target.value as any, fields: (field.computed as any)?.fields || [], of: (field.computed as any)?.of || "" } })}><option value="sum">Sum</option><option value="percent">Percent</option><option value="grade">Grade</option></select></label>
                  <label className="text-[10px] text-gray-500">Source field ids<input className={input} value={((field.computed as any)?.fields || []).join(",")} onChange={(e) => setField({ ...field, computed: { type: field.computed?.type || "sum", fields: e.target.value.split(",").map((s) => s.trim()).filter(Boolean), of: (field.computed as any)?.of || "" } })} placeholder="f1,f2" /></label>
                  {field.computed?.type === "percent" && (
                    <label className="text-[10px] text-gray-500 col-span-2">Total (max)<input type="number" className={input} value={field.computed?.max || ""} onChange={(e) => setField({ ...field, computed: { ...(field.computed as any), max: Number(e.target.value) || undefined } })} /></label>
                  )}
                  {field.computed?.type === "grade" && (
                    <label className="text-[10px] text-gray-500 col-span-2">Percent field id<input className={input} value={field.computed?.of || ""} onChange={(e) => setField({ ...field, computed: { ...(field.computed as any), of: e.target.value } })} /></label>
                  )}
                </div>
              )}
              <button onClick={() => onPageChange({ ...page, fields: (page.fields || []).filter((x) => x.id !== field.id) })} className="text-[10px] text-red-500 hover:underline">
                Remove field
              </button>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Tables</h4>
          <div className="space-y-1 max-h-48 overflow-auto">
            {page.tables && page.tables.length === 0 && <p className="text-[11px] text-gray-400">No tables yet.</p>}
            {(page.tables || []).map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedTable(t.id); setSelected(null) }}
                className={`w-full text-left rounded-md px-2 py-1.5 text-xs ${selectedTable === t.id ? "bg-orange-50 text-[var(--primary)] border border-orange-200" : "bg-gray-50 hover:bg-gray-100 border border-transparent"}`}
              >
                <span className="font-medium">{t.label || t.id}</span> <span className="text-gray-400">({t.cols.length} cols)</span>
              </button>
            ))}
          </div>
          {table && <TableView table={table} onTableChange={setTable} onRemove={() => onPageChange({ ...page, tables: (page.tables || []).filter((x) => x.id !== table.id) })} />}
        </div>
      </div>
    </div>
  )
}

function TableView({ table, onTableChange, onRemove }: { table: TableDef; onTableChange: (t: TableDef) => void; onRemove: () => void }) {
  const input = "w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
  const setCol = (i: number, c: TableDef["cols"][number]) =>
    onTableChange({ ...table, cols: table.cols.map((x, j) => (j === i ? c : x)) })
  const addCol = () =>
    onTableChange({ ...table, cols: [...table.cols, { id: `c${uid()}`, label: "Col", type: "mark", max: 100 }] })

  return (
    <div className="mt-2 space-y-2 rounded-lg bg-orange-50/50 p-2 border border-orange-100 max-h-72 overflow-auto">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] text-gray-500">Label<input className={input} value={table.label} onChange={(e) => onTableChange({ ...table, label: e.target.value })} /></label>
        <label className="text-[10px] text-gray-500">Rows key<input className={input} value={table.rowsKey} onChange={(e) => onTableChange({ ...table, rowsKey: e.target.value })} placeholder="academic / personality" /></label>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <label className="text-[10px] text-gray-500">X%<input type="number" className={input} value={table.x} onChange={(e) => onTableChange({ ...table, x: Number(e.target.value) || 0 })} /></label>
        <label className="text-[10px] text-gray-500">Y%<input type="number" className={input} value={table.y} onChange={(e) => onTableChange({ ...table, y: Number(e.target.value) || 0 })} /></label>
        <label className="text-[10px] text-gray-500">W%<input type="number" className={input} value={table.w} onChange={(e) => onTableChange({ ...table, w: Number(e.target.value) || 10 })} /></label>
        <label className="text-[10px] text-gray-500">H%<input type="number" className={input} value={table.h} onChange={(e) => onTableChange({ ...table, h: Number(e.target.value) || 10 })} /></label>
      </div>
      <div className="space-y-1.5">
        {table.cols.map((c, i) => (
          <div key={c.id} className="grid grid-cols-12 gap-1 items-center">
            <input className={`${input} col-span-3`} value={c.label} onChange={(e) => setCol(i, { ...c, label: e.target.value })} placeholder="Label" />
            <input className={`${input} col-span-2`} value={c.sub || ""} onChange={(e) => setCol(i, { ...c, sub: e.target.value })} placeholder="(max)" />
            <select className={`${input} col-span-3`} value={c.type} onChange={(e) => setCol(i, { ...c, type: e.target.value as any })}>
              <option value="text">text</option>
              <option value="mark">mark</option>
              <option value="sum">sum</option>
              <option value="percent">percent</option>
              <option value="grade">grade</option>
            </select>
            <input className={`${input} col-span-2`} type="number" value={c.max || ""} onChange={(e) => setCol(i, { ...c, max: Number(e.target.value) || undefined })} placeholder="max" />
            <input className={`${input} col-span-1`} value={(c.of || []).join(",")} onChange={(e) => setCol(i, { ...c, of: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="of" />
            <button onClick={() => onTableChange({ ...table, cols: table.cols.filter((_, j) => j !== i) })} className="text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button onClick={addCol} className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline">
          <Plus className="h-3 w-3" /> Add column
        </button>
        <button onClick={onRemove} className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline">
          <Trash2 className="h-3 w-3" /> Remove table
        </button>
      </div>
    </div>
  )
}