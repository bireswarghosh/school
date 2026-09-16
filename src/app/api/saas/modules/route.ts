import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionRole } from "@/lib/auth"

type ToggleItem = {
  label: string
  parentLabel?: string | null
  is_visible: boolean
}

async function requireSchoolAccess(req: NextRequest): Promise<NextResponse | null> {
  if (getSessionRole(req) !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

async function findOrCreateParent(schoolId: number, label: string): Promise<number> {
  const found = await query(
    `SELECT id FROM sidebar_menus WHERE school_id = $1 AND lower(label) = lower($2) AND parent_id IS NULL LIMIT 1`,
    [schoolId, label]
  )
  if (found.rows[0]) return found.rows[0].id
  const ins = await query(
    `INSERT INTO sidebar_menus (school_id, label, icon, path, sort_order, is_visible)
     VALUES ($1,$2,$3,'',1,true) RETURNING id`,
    [schoolId, label, "Menu"]
  )
  return ins.rows[0].id
}

async function setToggle(schoolId: number, item: ToggleItem): Promise<boolean> {
  if (item.parentLabel) {
    const parentId = await findOrCreateParent(schoolId, item.parentLabel)
    const existing = await query(
      `SELECT id FROM sidebar_menus WHERE school_id = $1 AND lower(label) = lower($2) AND parent_id = $3 LIMIT 1`,
      [schoolId, item.label, parentId]
    )
    if (existing.rows[0]) {
      await query(`UPDATE sidebar_menus SET is_visible = $1, locked = true WHERE id = $2`, [item.is_visible, existing.rows[0].id])
    } else {
      await query(
        `INSERT INTO sidebar_menus (school_id, label, icon, path, sort_order, is_visible, parent_id, locked)
         VALUES ($1,$2,'Menu','',1,$3,$4,true)`,
        [schoolId, item.label, item.is_visible, parentId]
      )
    }
    return true
  }

  const existing = await query(
    `SELECT id FROM sidebar_menus WHERE school_id = $1 AND lower(label) = lower($2) AND parent_id IS NULL LIMIT 1`,
    [schoolId, item.label]
  )
  if (existing.rows[0]) {
    await query(`UPDATE sidebar_menus SET is_visible = $1, locked = true WHERE id = $2`, [item.is_visible, existing.rows[0].id])
  } else {
    await query(
      `INSERT INTO sidebar_menus (school_id, label, icon, path, sort_order, is_visible, locked)
       VALUES ($1,$2,'Menu','',1,$3,true)`,
      [schoolId, item.label, item.is_visible]
    )
  }
  return true
}

export async function GET(req: NextRequest) {
  const forbidden = await requireSchoolAccess(req)
  if (forbidden) return forbidden

  const { searchParams } = new URL(req.url)
  const schoolId = parseInt(searchParams.get("schoolId") || "0", 10)
  if (!schoolId) return NextResponse.json({ error: "schoolId is required" }, { status: 400 })

  const rows = await query(
    `SELECT id, label, icon, parent_id, path, sort_order, is_visible, locked
     FROM sidebar_menus WHERE school_id = $1 ORDER BY sort_order, id`,
    [schoolId]
  )
  return NextResponse.json(rows.rows)
}

export async function POST(req: NextRequest) {
  const forbidden = await requireSchoolAccess(req)
  if (forbidden) return forbidden

  try {
    const body = await req.json()
    const schoolId = parseInt(body?.schoolId || "0", 10)
    const items: ToggleItem[] = Array.isArray(body?.items) ? body.items : []
    if (!schoolId) return NextResponse.json({ error: "schoolId is required" }, { status: 400 })
    if (items.length === 0) return NextResponse.json({ error: "items is required" }, { status: 400 })

    for (const item of items) {
      if (!item?.label) continue
      await setToggle(schoolId, { label: item.label, parentLabel: item.parentLabel || null, is_visible: !!item.is_visible })
    }

    return NextResponse.json({ success: true, updated: items.length })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
