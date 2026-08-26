import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"

const TABLE = "classes"
const ORDER = "id DESC"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function parseSectionIds(value: any): number[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0)
}

function parseSectionNames(value: any): string[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => String(v).trim()).filter((s) => s.length > 0)
}

/**
 * Reconciles this class's sections by name.
 * Sections are per-class rows, so "A" for Class- I and "A" for Class- II are
 * separate rows. Reusing/checking a global section row would move a section
 * away from another class, so sections are created/destroyed per class instead.
 */
async function syncClassSections(classId: number, names: string[]) {
  const desired = [...new Set(names)]
  const current = (await query(`SELECT id, name FROM sections WHERE class_id = $1`, [classId]))
    .rows as { id: number | string; name: string }[]

  const currentByName = new Map<string, number>()
  for (const r of current) currentByName.set(String(r.name).toLowerCase(), Number(r.id))

  const matched = new Set<string>()
  const toDelete: number[] = []
  for (const r of current) {
    const key = String(r.name).toLowerCase()
    if (desired.some((d) => d.toLowerCase() === key)) {
      matched.add(key)
    } else {
      toDelete.push(Number(r.id))
    }
  }

  for (const id of toDelete) {
    await query(`DELETE FROM sections WHERE id = $1 AND class_id = $2`, [id, classId])
  }
  for (const name of desired) {
    const key = name.toLowerCase()
    if (matched.has(key)) continue
    await query(`INSERT INTO sections (name, class_id) VALUES ($1, $2)`, [name, classId])
  }
}

async function assignSections(classId: number, sectionIds: number[], prevSectionIds: number[]) {
  const prev = new Set(prevSectionIds)
  const next = new Set(sectionIds)
  for (const sid of prev) {
    if (!next.has(sid)) {
      await query(`UPDATE sections SET class_id = NULL WHERE id = $1 AND class_id = $2`, [sid, classId])
    }
  }
  for (const sid of next) {
    if (!prev.has(sid)) {
      await query(`UPDATE sections SET class_id = $1 WHERE id = $2`, [classId, sid])
    }
  }
}

async function getClassSectionIds(classId: number): Promise<number[]> {
  const result = await query(`SELECT id FROM sections WHERE class_id = $1`, [classId])
  return result.rows.map((r) => Number(r.id))
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 })
  }
  const items = await getAll(TABLE, ORDER)
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String(body.name || "").trim()
    if (!name) return NextResponse.json({ error: "Class name required" }, { status: 400 })
    const item = (await create(TABLE, { name })) as { id: number; name: string }
    const sections = parseSectionNames(body.sections ?? body.sectionNames)
    if (sections.length > 0) {
      await syncClassSections(item.id, sections)
    } else {
      await assignSections(item.id, parseSectionIds(body.sectionIds), [])
    }
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const name = String(body.name ?? "").trim()
    if (!name) return NextResponse.json({ error: "Class name required" }, { status: 400 })
    const prevSectionIds = await getClassSectionIds(id)
    const item = await update(TABLE, id, { name })
    if (item) {
      if (body.sections !== undefined || body.sectionNames !== undefined) {
        await syncClassSections(id, parseSectionNames(body.sections ?? body.sectionNames))
      } else {
        await assignSections(id, parseSectionIds(body.sectionIds), prevSectionIds)
      }
    }
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 })
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
