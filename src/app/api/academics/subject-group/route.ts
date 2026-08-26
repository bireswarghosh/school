import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"


function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "subject_groups"
const ORDER = "id DESC"

function parseIds(value: any): number[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0)
}

type GroupRow = { id: number; name: string; description: string }
type RelationRow = { subject_group_id: number | string; section_id?: number | string; subject_id?: number | string }

async function composeGroup(group: any, sectionsByGroup: Map<number, number[]>, subjectsByGroup: Map<number, number[]>, sectionMap: Map<number, any>, classMap: Map<number, any>, subjectMap: Map<number, any>) {
  const sectionIds = sectionsByGroup.get(Number(group.id)) || []
  const sections = sectionIds
    .map((sid) => {
      const sec = sectionMap.get(sid)
      if (!sec) return null
      const cls = classMap.get(Number(sec.class_id))
      return {
        id: sid,
        section_id: sid,
        class_id: Number(sec.class_id),
        class_name: cls?.name || `Class #${sec.class_id}`,
        section_name: sec.name,
      }
    })
    .filter(Boolean)

  const subjectIds = subjectsByGroup.get(Number(group.id)) || []
  const subjects = subjectIds
    .map((sid) => subjectMap.get(sid))
    .filter(Boolean)
    .map((s: any) => ({ id: Number(s.id), subject_id: Number(s.id), name: s.name, code: s.code, type: s.type }))

  return { ...group, sections, subjects }
}

async function listGroups(id?: number) {
  const groups = id ? [await getById(TABLE, id)] : await getAll(TABLE, ORDER)
  const list = groups.filter(Boolean)
  if (list.length === 0) return list

  const groupIds = list.map((g) => Number(g.id))

  const secRows = (await query(
    `SELECT subject_group_id, section_id FROM subject_group_sections WHERE subject_group_id = ANY($1::int[])`,
    [groupIds] as any[]
  )).rows as RelationRow[]
  const subjRows = (await query(
    `SELECT subject_group_id, subject_id FROM subject_group_subjects WHERE subject_group_id = ANY($1::int[])`,
    [groupIds] as any[]
  )).rows as RelationRow[]

  const sectionsByGroup = new Map<number, number[]>()
  for (const r of secRows) {
    const gid = Number(r.subject_group_id)
    const arr = sectionsByGroup.get(gid) || []
    arr.push(Number(r.section_id))
    sectionsByGroup.set(gid, arr)
  }
  const subjectsByGroup = new Map<number, number[]>()
  for (const r of subjRows) {
    const gid = Number(r.subject_group_id)
    const arr = subjectsByGroup.get(gid) || []
    arr.push(Number(r.subject_id))
    subjectsByGroup.set(gid, arr)
  }

  const allSections = await getAll<{ id: number; class_id: number; name: string }>("sections")
  const allClasses = await getAll<{ id: number; name: string }>("classes")
  const allSubjects = await getAll<{ id: number; name: string; code: string; type: string }>("subjects")

  const sectionMap = new Map(allSections.map((s) => [Number(s.id), s]))
  const classMap = new Map(allClasses.map((c) => [Number(c.id), c]))
  const subjectMap = new Map(allSubjects.map((s) => [Number(s.id), s]))

  return Promise.all(list.map((g) => composeGroup(g, sectionsByGroup, subjectsByGroup, sectionMap, classMap, subjectMap)))
}

async function validateAndGetIds(body: any, groupId?: number) {
  const name = String(body.name || "").trim()
  if (!name) return { error: "Group name is required" }
  const nameRes = await query(`SELECT id FROM subject_groups WHERE LOWER(name) = LOWER($1)`, [name])
  const clash = (nameRes.rows as { id: number | string }[]).find((r) => Number(r.id) !== groupId)
  if (clash) return { error: `Subject group "${name}" already exists` }

  const sectionIds = parseIds(body.sectionIds)
  const subjectIds = parseIds(body.subjectIds)
  if (sectionIds.length === 0) return { error: "Select at least one section" }
  if (subjectIds.length === 0) return { error: "Select at least one subject" }

  const usedRes = await query(
    `SELECT section_id FROM subject_group_sections WHERE section_id = ANY($1::int[]) AND subject_group_id IS DISTINCT FROM $2`,
    [sectionIds, groupId ?? 0] as any[]
  )
  if (usedRes.rows.length > 0) {
    return { error: "One or more sections are already assigned to another subject group" }
  }
  return { sectionIds, subjectIds, name }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const idRaw = searchParams.get("id")
  const id = idRaw ? parseInt(idRaw) : undefined
  const items = await listGroups(id)
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const checked = await validateAndGetIds(body)
    if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 })

    const { name, sectionIds, subjectIds } = checked
    const item = (await create<any>(TABLE, { name, description: body.description || null })) as GroupRow
    for (const sid of sectionIds) {
      await query(`INSERT INTO subject_group_sections (subject_group_id, section_id) VALUES ($1, $2)`, [item.id, sid])
    }
    for (const sid of subjectIds) {
      await query(`INSERT INTO subject_group_subjects (subject_group_id, subject_id) VALUES ($1, $2)`, [item.id, sid])
    }
    const [full] = await listGroups(Number(item.id))
    return NextResponse.json(full || item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const existing = await getById(TABLE, parseInt(id))
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const checked = await validateAndGetIds(body, parseInt(id))
    if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 })

    const { name, sectionIds, subjectIds } = checked
    const item = await update<GroupRow>(TABLE, id, { name, description: body.description || null })

    await query(`DELETE FROM subject_group_sections WHERE subject_group_id = $1`, [id])
    await query(`DELETE FROM subject_group_subjects WHERE subject_group_id = $1`, [id])
    for (const sid of sectionIds) {
      await query(`INSERT INTO subject_group_sections (subject_group_id, section_id) VALUES ($1, $2)`, [id, sid])
    }
    for (const sid of subjectIds) {
      await query(`INSERT INTO subject_group_subjects (subject_group_id, subject_id) VALUES ($1, $2)`, [id, sid])
    }

    const [full] = await listGroups(Number(id))
    return NextResponse.json(full || item)
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
