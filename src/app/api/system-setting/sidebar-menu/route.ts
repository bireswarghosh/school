import { NextRequest, NextResponse } from "next/server"
import { query, getById, create, update, remove } from "@/lib/db"

const TABLE = "sidebar_menus"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(item)
  }
  const items = await query(`SELECT * FROM ${TABLE} ORDER BY sort_order, id`)
  return NextResponse.json(items.rows)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const item = await create(TABLE, body)
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

    // Modules turned OFF by the super admin are locked for the school —
    // they cannot be re-enabled from the school panel or via the API.
    if (data.is_visible === true) {
      const existing = (await query(`SELECT locked, is_visible FROM ${TABLE} WHERE id = $1::int`, [id])).rows[0]
      if (existing && existing.locked === true && existing.is_visible === false) {
        return NextResponse.json({ error: "This module is locked by the super admin" }, { status: 403 })
      }
    }

    const item = await update(TABLE, id, data)
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(item)
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get("id") || "0")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const children = await query(`SELECT id FROM ${TABLE} WHERE parent_id = $1::int`, [id])
    for (const child of children.rows) {
      await update(TABLE, child.id, { parent_id: null })
    }
    await remove(TABLE, id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
