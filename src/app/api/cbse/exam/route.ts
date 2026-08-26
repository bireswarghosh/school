import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

const fieldMap: Record<string, string> = {
  publishExam: "publish_exam",
  publishResult: "publish_result",
  categoryName: "exam_group",
  mailTemplates: "mail_templates",
  createdAt: "created_at",
}

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function ensureArray(val: unknown): number[] {
  if (Array.isArray(val)) return val
  if (typeof val === "string") try { return JSON.parse(val) } catch { return [] }
  return []
}

const TABLE = "cbse_exams"
const ORDER = "id DESC"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    const rows = await query(`SELECT COUNT(*)::int AS count FROM cbse_exam_subjects WHERE exam_id = $1`, [parseInt(id)])
    const subjectCount = rows?.rows?.[0]?.count ?? 0
    const enriched = item ? { ...item, subjectCount } : null
    const result = enriched ? mapResponse(enriched, fieldMap) : { error: "Not found" }
    if (result && !Array.isArray((result as any).mailTemplates)) (result as any).mailTemplates = ensureArray((result as any).mailTemplates)
    return NextResponse.json(result, { status: enriched ? 200 : 404 })
  }
  const items = await getAll(TABLE, ORDER)
  const enriched = await Promise.all(items.map(async (item: any) => {
    const rows = await query(`SELECT COUNT(*)::int AS count FROM cbse_exam_subjects WHERE exam_id = $1`, [item.id])
    return { ...item, subjectCount: rows?.rows?.[0]?.count ?? 0 }
  }))
  const result = mapResponse(enriched, fieldMap) as any[]
  result.forEach((r) => { if (!Array.isArray(r.mailTemplates)) r.mailTemplates = ensureArray(r.mailTemplates) })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = camelToSnake(body, fieldMap)
    const item = await create(TABLE, data)
    const result = mapResponse(item, fieldMap)
    if (!Array.isArray((result as any).mailTemplates)) (result as any).mailTemplates = ensureArray((result as any).mailTemplates)
    return NextResponse.json(result, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const data = camelToSnake(rest, fieldMap)
    const item = await update(TABLE, id, data)
    const result = item ? mapResponse(item, fieldMap) : { error: "Not found" }
    if (!Array.isArray((result as any).mailTemplates)) (result as any).mailTemplates = ensureArray((result as any).mailTemplates)
    return NextResponse.json(result, { status: item ? 200 : 404 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await remove(TABLE, id)
  return NextResponse.json({ success: true })
}
