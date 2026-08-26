import { NextRequest, NextResponse } from "next/server"
import { query, create, update } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const recordId = searchParams.get("record_id")
  const module = searchParams.get("module") || "Student"

  if (!recordId) {
    return NextResponse.json({ error: "record_id required" }, { status: 400 })
  }

  const result = await query(
    `SELECT cfv.id, cfv.field_id, cfv.value, cfv.module, cfv.record_id,
            cf.name AS field_name, cf.type AS field_type, cf.belongs_to, cf.is_required, cf.options
     FROM custom_field_values cfv
     JOIN custom_fields cf ON cf.id = cfv.field_id
     WHERE cfv.record_id = $1 AND cfv.module = $2
     ORDER BY cf.id`,
    [parseInt(recordId), module]
  )

  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { record_id, module, values } = body

    if (!record_id || !values || !Array.isArray(values)) {
      return NextResponse.json({ error: "record_id and values array required" }, { status: 400 })
    }

    const mod = module || "Student"
    const results = []

    for (const v of values) {
      const existing = await query(
        `SELECT id FROM custom_field_values WHERE record_id = $1 AND field_id = $2 AND module = $3`,
        [record_id, v.field_id, mod]
      )

      if (existing.rows.length > 0) {
        const updated = await update("custom_field_values", existing.rows[0].id, {
          value: v.value ?? null,
          updated_at: new Date().toISOString(),
        })
        results.push(updated)
      } else {
        const created = await create("custom_field_values", {
          record_id,
          field_id: v.field_id,
          module: mod,
          value: v.value ?? null,
        })
        results.push(created)
      }
    }

    return NextResponse.json(results, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
