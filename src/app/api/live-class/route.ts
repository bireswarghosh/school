import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

const fieldMap: Record<string, string> = {
  liveLink: "live_link",
  roleId: "role_id",
  staffId: "staff_id",
  classId: "class_id",
  sectionIds: "section_ids",
  startTime: "start_time",
  endTime: "end_time",
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (id) {
      const result = await query(`
        SELECT lc.*,
          COALESCE(
            json_agg(
              json_build_object(
                'class_id', lcs.class_id,
                'class_name', c.name,
                'section_id', lcs.section_id,
                'section_name', sec.name
              )
              ORDER BY lcs.id
            ) FILTER (WHERE lcs.id IS NOT NULL),
            '[]'::json
          ) AS sections
        FROM live_classes lc
        LEFT JOIN live_class_sections lcs ON lcs.live_class_id = lc.id
        LEFT JOIN classes c ON c.id = lcs.class_id
        LEFT JOIN sections sec ON sec.id = lcs.section_id
        WHERE lc.id = $1
        GROUP BY lc.id
      `, [parseInt(id)])
      const item = result.rows[0] || null
      return NextResponse.json(item ? mapResponse(item, fieldMap) : { error: "Not found" }, { status: item ? 200 : 404 })
    }

    const result = await query(`
      SELECT lc.*,
        COALESCE(
          json_agg(
            json_build_object(
              'class_id', lcs.class_id,
              'class_name', c.name,
              'section_id', lcs.section_id,
              'section_name', sec.name
            )
            ORDER BY lcs.id
          ) FILTER (WHERE lcs.id IS NOT NULL),
          '[]'::json
        ) AS sections
      FROM live_classes lc
      LEFT JOIN live_class_sections lcs ON lcs.live_class_id = lc.id
      LEFT JOIN classes c ON c.id = lcs.class_id
      LEFT JOIN sections sec ON sec.id = lcs.section_id
      GROUP BY lc.id
      ORDER BY lc.id DESC
    `)
    return NextResponse.json(mapResponse(result.rows, fieldMap))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sectionIds, sections, ...rest } = body
    const data = camelToSnake(rest, fieldMap)
    delete data.section_ids
    delete data.sections

    const ins = await query(
      `INSERT INTO live_classes (${Object.keys(data).join(", ")}) VALUES (${Object.keys(data).map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *`,
      Object.values(data)
    )
    const item = ins.rows[0]

    if (sectionIds && Array.isArray(sectionIds) && sectionIds.length > 0) {
      const vals: any[] = []
      const phs: string[] = []
      sectionIds.forEach((sid: number, i: number) => {
        const parts = String(sid).split("-")
        phs.push(`($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
        vals.push(item.id, parseInt(parts[0]), parseInt(parts[1]))
      })
      await query(
        `INSERT INTO live_class_sections (live_class_id, class_id, section_id) VALUES ${phs.join(", ")}`,
        vals
      )
    }

    const full = await query(`
      SELECT lc.*,
        COALESCE(
          json_agg(
            json_build_object(
              'class_id', lcs.class_id,
              'class_name', c.name,
              'section_id', lcs.section_id,
              'section_name', sec.name
            )
            ORDER BY lcs.id
          ) FILTER (WHERE lcs.id IS NOT NULL),
          '[]'::json
        ) AS sections
      FROM live_classes lc
      LEFT JOIN live_class_sections lcs ON lcs.live_class_id = lc.id
      LEFT JOIN classes c ON c.id = lcs.class_id
      LEFT JOIN sections sec ON sec.id = lcs.section_id
      WHERE lc.id = $1
      GROUP BY lc.id
    `, [item.id])

    return NextResponse.json(mapResponse(full.rows[0], fieldMap), { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, sectionIds, sections, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const data = camelToSnake(rest, fieldMap)
    delete data.section_ids
    delete data.sections

    if (Object.keys(data).length > 0) {
      const setClause = Object.keys(data).map((k, i) => `${k} = $${i + 1}`).join(", ")
      await query(
        `UPDATE live_classes SET ${setClause} WHERE id = $${Object.keys(data).length + 1}`,
        [...Object.values(data), id]
      )
    }

    if (sectionIds && Array.isArray(sectionIds)) {
      await query(`DELETE FROM live_class_sections WHERE live_class_id = $1`, [id])
      if (sectionIds.length > 0) {
        const vals: any[] = []
        const phs: string[] = []
        sectionIds.forEach((sid: number, i: number) => {
          const parts = String(sid).split("-")
          phs.push(`($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
          vals.push(id, parseInt(parts[0]), parseInt(parts[1]))
        })
        await query(
          `INSERT INTO live_class_sections (live_class_id, class_id, section_id) VALUES ${phs.join(", ")}`,
          vals
        )
      }
    }

    const full = await query(`
      SELECT lc.*,
        COALESCE(
          json_agg(
            json_build_object(
              'class_id', lcs.class_id,
              'class_name', c.name,
              'section_id', lcs.section_id,
              'section_name', sec.name
            )
            ORDER BY lcs.id
          ) FILTER (WHERE lcs.id IS NOT NULL),
          '[]'::json
        ) AS sections
      FROM live_classes lc
      LEFT JOIN live_class_sections lcs ON lcs.live_class_id = lc.id
      LEFT JOIN classes c ON c.id = lcs.class_id
      LEFT JOIN sections sec ON sec.id = lcs.section_id
      WHERE lc.id = $1
      GROUP BY lc.id
    `, [id])

    return NextResponse.json(mapResponse(full.rows[0], fieldMap))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get("id") || "0")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    await query(`DELETE FROM live_class_sections WHERE live_class_id = $1`, [id])
    await query(`DELETE FROM live_classes WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
