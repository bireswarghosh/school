"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  TemplateSetting,
  PageDef,
  FieldDef,
  TableDef,
  fieldValue,
  computeRecord,
  toNum,
  gradeFor,
  GradeScale,
} from "@/lib/result-card"

const DESIGN_W = 794 // px design width (≈ A4 @96dpi)

const SIZE_SCALE = (scale: number) => scale / DESIGN_W

type Props = {
  template: TemplateSetting
  data?: Record<string, Record<string, any>>
  student?: Record<string, any> | null
  meta?: Record<string, any>
  scale?: number
  selectedPage?: string | null
  onSelectField?: (pageId: string, fieldId: string) => void
  movable?: boolean
  onMoveField?: (pageId: string, fieldId: string, x: number, y: number, isTable: boolean) => void
}

export default function RenderCard({
  template,
  data,
  student,
  meta,
  scale = DESIGN_W,
  selectedPage,
  onSelectField,
  movable,
  onMoveField,
}: Props) {
  const computed = useMemo(() => computeRecord(template, data || {}), [template, data])
  const metaAll = useMemo(() => ({ ...(meta || {}), ...(data?.["__meta"] || {}) }), [meta, data])
  const wrapRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<null | { pageId: string; fieldId: string; isTable: boolean; startX: number; startY: number; ox: number; oy: number }>(null)

  useEffect(() => {
    if (!movable || !drag) return
    const onMove = (e: MouseEvent) => {
      const rect = wrapRef.current?.getBoundingClientRect()
      if (!rect || !onMoveField) return
      const dx = ((e.clientX - drag.startX) / rect.width) * 100
      const dy = ((e.clientY - drag.startY) / rect.height) * 100
      onMoveField(drag.pageId, drag.fieldId, Math.max(0, Math.min(100, drag.ox + dx)), Math.max(0, Math.min(100, drag.oy + dy)), drag.isTable)
    }
    const onUp = () => setDrag(null)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [movable, drag, onMoveField])

  const startDrag = (pageId: string, fieldId: string, isTable: boolean, ox: number, oy: number) => (e: React.MouseEvent) => {
    if (!movable) return
    e.stopPropagation()
    setDrag({ pageId, fieldId, isTable, startX: e.clientX, startY: e.clientY, ox, oy })
  }

  return (
    <div ref={wrapRef} style={{ width: scale }}>
      {(template.pages || []).map((page, pi) => (
        <div
          key={page.id}
          className="relative mb-3 bg-white shadow-sm"
          style={{
            width: scale,
            height: scale * (page.height / page.width || 1.414),
            backgroundImage: page.image ? `url(${page.image})` : undefined,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
          data-page={page.id}
        >
          {(page.fields || []).map((f) => (
            <FieldBox
              key={f.id}
              field={f}
              page={page}
              scale={scale}
              pageValues={computed[page.id] || {}}
              student={student}
              meta={metaAll}
              selected={selectedPage === page.id && onSelectField ? true : undefined}
              onSelect={onSelectField ? () => onSelectField(page.id, f.id) : undefined}
              onMouseDown={movable ? startDrag(page.id, f.id, false, f.x, f.y) : undefined}
            />
          ))}
          {(page.tables || []).map((t) => (
            <TableBox
              key={t.id}
              table={t}
              page={page}
              scale={scale}
              pageValues={computed[page.id] || {}}
              gradeScale={template.grade_scale}
              onSelect={onSelectField ? () => onSelectField(page.id, t.id) : undefined}
              onMouseDown={movable ? startDrag(page.id, t.id, true, t.x, t.y) : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function px(pct: number, total: number) {
  return (pct / 100) * total
}

function FieldBox({
  field,
  page,
  scale,
  pageValues,
  student,
  meta,
  selected,
  onSelect,
  onMouseDown,
}: {
  field: FieldDef
  page: PageDef
  scale: number
  pageValues: Record<string, any>
  student: Record<string, any> | null | undefined
  meta: Record<string, any>
  selected?: boolean
  onSelect?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
}) {
  const boxW = px(field.w, scale)
  const boxH = px(field.h, scale * (page.height / page.width || 1.414))
  const fontSize = (field.size || 14) * SIZE_SCALE(scale)
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${field.x}%`,
    top: `${field.y}%`,
    minWidth: boxW,
    minHeight: boxH,
    fontSize,
    lineHeight: Math.max(1.1, boxH / (fontSize || 1)),
    textAlign: field.align || "left",
    fontWeight: field.bold ? 700 : 400,
    fontStyle: field.italic ? "italic" : "normal",
    color: field.color || "#000",
    backgroundColor: field.bg,
    border: field.border,
    borderBottom: field.borderBottom,
    whiteSpace: "pre-wrap",
    overflow: "hidden",
    boxSizing: "border-box",
  }
  if (selected) style.outline = "1px dashed #ff7732"
  style.cursor = onMouseDown ? "move" : "default"

  if (field.type === "photo") {
    const src =
      (pageValues[field.id] as string) ||
      (student?.photo as string) ||
      (meta?.photo as string) ||
      (student?.student_photo as string) ||
      ""
    return (
      <div style={{ position: "absolute", left: `${field.x}%`, top: `${field.y}%`, width: boxW, height: boxH, cursor: "move" }} onClick={onSelect} onMouseDown={onMouseDown}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : null}
      </div>
    )
  }

  const value = fieldValue(field, pageValues, [], student, meta)
  return (
    <div style={style} onClick={onSelect} onMouseDown={onMouseDown}>
      {value}
    </div>
  )
}

function TableBox({
  table,
  page,
  scale,
  pageValues,
  gradeScale,
  onSelect,
  onMouseDown,
}: {
  table: TableDef
  page: PageDef
  scale: number
  pageValues: Record<string, any>
  gradeScale?: GradeScale[]
  onSelect?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
}) {
  const pageH = scale * (page.height / page.width || 1.414)
  const w = px(table.w, scale)
  const fontSize = (table.fontSize || 11) * SIZE_SCALE(scale)
  const rows: Record<string, any>[] = Array.isArray(pageValues[table.id]) ? pageValues[table.id] : []
  const totalW = table.cols.reduce((acc, c) => acc + (c.width || 0), 0)
  const widths = table.cols.map((c) => (c.width ? `${(c.width / (totalW || 1)) * 100}%` : `${100 / table.cols.length}%`))

  const headerGroup = table.headerGroups?.[0] ? (
    <tr>
      {table.headerGroups.map((g, i) => (
        <th
          key={i}
          colSpan={g.span}
          style={{
            fontSize,
            fontWeight: 700,
            padding: `${fontSize * 0.2}px ${fontSize * 0.4}px`,
            border: "1px solid #555",
            textAlign: "center",
          }}
        >
          {g.label}
        </th>
      ))}
    </tr>
  ) : null

  return (
    <div
      style={{
        position: "absolute",
        left: `${table.x}%`,
        top: `${table.y}%`,
        width: w,
        height: px(table.h, pageH),
        overflow: "hidden",
        cursor: onMouseDown ? "move" : "pointer",
      }}
      onClick={onSelect}
      onMouseDown={onMouseDown}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          {headerGroup}
          <tr>
            {table.cols.map((c, i) => (
              <th
                key={c.id}
                style={{
                  width: widths[i],
                  fontSize,
                  fontWeight: 700,
                  padding: `${fontSize * 0.2}px ${fontSize * 0.4}px`,
                  border: "1px solid #555",
                  textAlign: "center",
                }}
              >
                {c.label}
                {c.sub ? <div style={{ fontSize: fontSize * 0.75, fontWeight: 400 }}>({c.sub})</div> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((row, ri) => (
            <tr key={ri}>
              {table.cols.map((c, i) => (
                <td
                  key={c.id}
                  style={{
                    width: widths[i],
                    fontSize,
                    padding: `${fontSize * 0.18}px ${fontSize * 0.3}px`,
                    border: "1px solid #555",
                    textAlign: c.type === "text" ? "left" : "center",
                  }}
                >
                  {cellText(c, row, gradeScale)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function cellText(col: TableDef["cols"][number], row: Record<string, any>, gradeScale?: GradeScale[]) {
  if (col.type === "mark" || col.type === "text") {
    const v = row[col.id]
    return v === undefined || v === null || v === "" ? "" : String(v)
  }
  if (col.type === "sum") {
    return String(Math.round((col.of || []).reduce((a, id) => a + toNum(row[id]), 0)))
  }
  if (col.type === "percent") {
    const sum = (col.of || []).reduce((a, id) => a + toNum(row[id]), 0)
    const total = toNum(col.max) || sum || 1
    return String(Math.round((sum / total) * 1000) / 10) + "%"
  }
  if (col.type === "grade") {
    return gradeFor(toNum(row[col.of?.[0] || ""]), gradeScale || [])
  }
  return ""
}