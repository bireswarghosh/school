import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"


function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "designations"
const ORDER = "id DESC"

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
    const schoolId = getSessionSchoolId(req)

    // Bulk upload: { names: string[] } or { bulk: string } — each line is Designation name
    let bulkNames: string[] | null = null
    if (Array.isArray(body.names)) bulkNames = body.names
    else if (typeof body.bulk === "string") bulkNames = body.bulk.split("\n")
    else if (Array.isArray(body.bulk)) bulkNames = body.bulk

    if (bulkNames) {
      const seen = new Set<string>()
      const cleaned: string[] = []
      for (const raw of bulkNames) {
        const n = String(raw).trim()
        if (!n) continue
        const key = n.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        cleaned.push(n)
        if (cleaned.length >= 500) break
      }
      if (cleaned.length === 0) {
        return NextResponse.json({ error: "No valid designation names provided" }, { status: 400 })
      }

      let existingSet = new Set<string>()
      try {
        const existing = schoolId
          ? await getAll(TABLE, ORDER, undefined, undefined, schoolId)
          : await query(`SELECT name FROM ${TABLE}`).then((r) => r.rows)
        existingSet = new Set(existing.map((r: any) => String(r.name).trim().toLowerCase()))
      } catch {}

      const toCreate = cleaned.filter((n) => !existingSet.has(n.toLowerCase()))
      const created: any[] = []
      const errors: { name: string; error: string }[] = []

      for (const n of toCreate) {
        try {
          const item = await create(TABLE, { name: n } as any, schoolId ?? undefined)
          created.push(item)
          existingSet.add(n.toLowerCase())
        } catch (e) {
          errors.push({ name: n, error: getErrorMessage(e) })
        }
      }

      return NextResponse.json(
        { created, skipped: cleaned.length - created.length, errors, total: bulkNames.length, cleaned: cleaned.length },
        { status: 201 }
      )
    }

    const item = await create(TABLE, body, schoolId ?? undefined)
    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const schoolId = getSessionSchoolId(req)
    const item = await update(TABLE, id, data, schoolId ?? undefined)
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const schoolId = getSessionSchoolId(req)
  await remove(TABLE, id, schoolId ?? undefined)
  return NextResponse.json({ success: true })
}