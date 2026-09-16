// Core types + compute helpers for the Custom Result Card module.

export type FieldType =
  | "text" // static or student/value text (bind vs literal)
  | "mark" // numeric entry in data entry screen
  | "computed" // auto computed from other values
  | "photo" // student photo
  | "signature" // value text (rendered, not auto)

export type ComputedSpec =
  | { type: "sum"; fields: string[] }
  | { type: "percent"; fields: string[]; of: string; max?: number }
  | { type: "grade"; of: string }

export type FieldDef = {
  id: string
  label: string
  type: FieldType
  x: number // percent of page width
  y: number // percent of page height
  w: number // percent of page width (box width for entry; render may auto-size)
  h: number // percent of page height
  size?: number // font size in px at 1000px page width (scaled at render)
  align?: "left" | "center" | "right"
  color?: string
  bold?: boolean
  italic?: boolean
  bg?: string // background color (e.g. header band)
  border?: string // css border shorthand
  borderBottom?: string // css border-bottom shorthand (e.g. dotted underline)
  bind?: string // data key for text/value types
  value?: string // static text when type=text without bind
  computed?: ComputedSpec
}

export type TableCol = {
  id: string
  label: string
  sub?: string // small helper text under label (e.g. "(80)")
  type: "text" | "mark" | "sum" | "percent" | "grade"
  max?: number
  of?: string[] // for sum/percent/grade
  width?: number // percent column width (optional; auto-split otherwise)
}

export type TableDef = {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  fontSize?: number
  headerGroups?: { label: string; span: number }[] // optional top group row
  cols: TableCol[]
  rowsKey: string // key in record.data for the row data array
  rowHeight?: number
}

export type PageDef = {
  id: string
  label: string
  image: string // url served by /api/files/<name>
  width: number // px used as design reference width (e.g. 1000)
  height: number // px (proportional to aspect)
  fields?: FieldDef[]
  tables?: TableDef[]
}

export type TemplateSetting = {
  id: number
  school_id: number | null
  name: string
  class_id: number | null
  class_name?: string
  session: string | null
  pages: PageDef[]
  grade_scale: GradeScale[]
  template_key?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type GradeScale = { min: number; max: number; label: string; remark?: string }

export const DEFAULT_GRADE_SCALE: GradeScale[] = [
  { min: 0, max: 39, label: "Below" },
  { min: 40, max: 50, label: "C" },
  { min: 51, max: 60, label: "C+" },
  { min: 61, max: 70, label: "B" },
  { min: 71, max: 80, label: "B+" },
  { min: 81, max: 90, label: "A" },
  { min: 91, max: 100, label: "A+" },
]

export function gradeFor(percent: number, scale: GradeScale[]): string {
  const list = scale && scale.length ? scale : DEFAULT_GRADE_SCALE
  for (const g of [...list].sort((a, b) => a.min - b.min)) {
    if (percent >= g.min && percent <= g.max) return g.label
  }
  return ""
}

export function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""))
  return Number.isNaN(n) ? 0 : n
}

function colValueFor(row: Record<string, unknown>, col: TableCol, scale: GradeScale[]): string | number {
  if (col.type === "mark" || col.type === "text") {
    const v = row[col.id]
    if (col.type === "text") return String(v ?? "")
    if (v === undefined || v === null || v === "") return ""
    const n = toNum(v)
    return col.max ? Math.min(n, col.max) : n
  }
  const ofIds = col.of ?? [col.id]
  if (col.type === "sum") {
    return Math.round(ofIds.reduce((acc, id) => acc + toNum(row[id]), 0))
  }
  if (col.type === "percent") {
    const sum = ofIds.reduce((acc, id) => acc + toNum(row[id]), 0)
    const total = toNum(col.max) || sum || 1
    return Math.round((sum / total) * 1000) / 10
  }
  if (col.type === "grade") {
    const p = toNum(row[col.of?.[0] ?? ofIds[0]])
    return gradeFor(p, scale)
  }
  return ""
}

export type RecordData = Record<string, Record<string, any>>

export function computeRows(
  table: TableDef,
  rows: Record<string, unknown>[] | undefined,
  scale: GradeScale[]
): (Record<string, unknown> & { _computed?: Record<string, string | number> })[] {
  return (rows || []).map((row) => {
    const computed: Record<string, string | number> = {}
    for (const col of table.cols) {
      if (col.type === "mark" || col.type === "text") continue
      computed[col.id] = colValueFor(row, col, scale)
    }
    return { ...row, _computed: computed }
  })
}

function computeField(field: FieldDef, pageValues: Record<string, any>, scale: GradeScale[]): string | number {
  if (field.type !== "computed" || !field.computed) return ""
  const spec: any = field.computed
  const nums = (spec.fields || []).map((f: string) => toNum(pageValues[f]))
  const numsum = nums.reduce((a: number, b: number) => a + b, 0)
  if (spec.type === "sum") return Math.round(numsum)
  if (spec.type === "percent") {
    const total = toNum(spec.max) || numsum || 1
    return Math.round((numsum / total) * 1000) / 10
  }
  if (spec.type === "grade") return gradeFor(toNum(pageValues[spec.of]), scale)
  return ""
}

// Compute all auto values for a record given a template + its entered data.
export function computeRecord(template: TemplateSetting, data: RecordData): RecordData {
  const scale: GradeScale[] = template.grade_scale || []
  const out: RecordData = {}
  for (const page of template.pages || []) {
    const pageValues: Record<string, any> = { ...(data[page.id] || {}) }
    for (const field of page.fields || []) {
      if (field.type === "computed" && field.computed) {
        pageValues[field.id] = computeField(field, pageValues, scale)
      }
    }
    for (const table of page.tables || []) {
      pageValues[table.id] = computeRows(table, pageValues[table.id], scale)
    }
    out[page.id] = pageValues
  }
  return out
}

// Resolve a record's rendered value for a text/value field.
export function fieldValue(field: FieldDef, pageValues: Record<string, any>, scale: GradeScale[], student?: Record<string, any> | null, meta: Record<string, any> = {}): string {
  if (field.type === "computed") {
    if (pageValues[field.id] !== undefined && pageValues[field.id] !== null && pageValues[field.id] !== "") return String(pageValues[field.id])
    if (field.computed) return String(computeField(field, pageValues, scale))
    return ""
  }
  if (field.bind) {
    if (field.bind in pageValues && pageValues[field.bind] !== undefined && pageValues[field.bind] !== null) {
      return String(pageValues[field.bind])
    }
    if (meta && field.bind in meta && meta[field.bind] !== undefined && meta[field.bind] !== null && meta[field.bind] !== "") {
      return String(meta[field.bind])
    }
    return String(student?.[field.bind] ?? "")
  }
  return field.value ?? ""
}

export function studentDefaultBindings(student: Record<string, any> | null, sessionText: string): Record<string, any> {
  if (!student) return { session: sessionText }
  return {
    session: sessionText,
    name: [student.first_name, student.last_name].filter(Boolean).join(" "),
    firstName: student.first_name || "",
    lastName: student.last_name || "",
    rollNo: student.roll_no ?? "",
    admissionNo: student.admission_no ?? "",
    class: student.class_name ?? "",
    section: student.section_name ?? "",
    motherName: student.mother_name ?? "",
    fatherName: student.father_name ?? "",
    dob: student.date_of_birth ?? "",
    photo: student.photo || (student.student_photo ? student.student_photo : ""),
  }
}

export const pageId = (t: TemplateSetting, i: number) => t.pages[i]?.id ?? `page${i}`