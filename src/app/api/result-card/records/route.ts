import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"
import { computeRecord, TemplateSetting } from "@/lib/result-card"

export async function GET(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    if (!schoolId) return NextResponse.json({ error: "No school session" }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const template_id = searchParams.get("template_id")
    const condition = template_id ? "AND r.template_id = " + Number(template_id) : ""
    const res = await query(
      `SELECT r.*, s.first_name, s.last_name, s.roll_no,
              c.name AS class_name, sec.name AS section_name
       FROM result_card_records r
       LEFT JOIN students s ON s.id = r.student_id
       LEFT JOIN classes c ON c.id = s.class_id
       LEFT JOIN sections sec ON sec.id = s.section_id
       WHERE r.school_id = $1 ${condition}
       ORDER BY r.id DESC`,
      [schoolId]
    )
    return NextResponse.json(res.rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    if (!schoolId) return NextResponse.json({ error: "No school session" }, { status: 401 })
    const body = await req.json()
    const template_id = Number(body.template_id || 0)
    if (!template_id) return NextResponse.json({ error: "template_id required" }, { status: 400 })

    const existing = body.id
      ? await query(
          `SELECT * FROM result_card_records WHERE id=$1 AND school_id=$2`,
          [Number(body.id), schoolId]
        )
      : body.student_id
        ? await query(
            `SELECT * FROM result_card_records WHERE template_id=$1 AND student_id=$2 AND school_id=$3`,
            [template_id, Number(body.student_id), schoolId]
          )
        : null

    const data = body.data || {}
    const session = body.session || null

    if (existing && existing.rows.length > 0) {
      const row = existing.rows[0]
      const res = await query(
        `UPDATE result_card_records SET data=$1, session=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
        [JSON.stringify(data), session, row.id]
      )
      return NextResponse.json(res.rows[0])
    }

    const res = await query(
      `INSERT INTO result_card_records (school_id, template_id, student_id, session, data)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [schoolId, template_id, body.student_id ? Number(body.student_id) : null, session, JSON.stringify(data)]
    )
    return NextResponse.json(res.rows[0], { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get("id") || 0)
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const body = await req.json()
    const res = await query(
      `UPDATE result_card_records SET data=$1, session=$2, updated_at=NOW() WHERE id=$3 AND school_id=$4 RETURNING *`,
      [JSON.stringify(body.data || {}), body.session || null, id, schoolId]
    )
    if (!res.rows[0]) return NextResponse.json({ error: "Record not found" }, { status: 404 })
    return NextResponse.json(res.rows[0])
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get("id") || 0)
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const res = await query(
      `DELETE FROM result_card_records WHERE id=$1 AND school_id=$2 RETURNING id`,
      [id, schoolId]
    )
    if (!res.rows[0]) return NextResponse.json({ error: "Record not found" }, { status: 404 })
    return NextResponse.json({ status: 1 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}

// Helper used by import/print endpoints: recompute + persist computed snapshot
export async function recomputeRecord(rowId: number, template: TemplateSetting, data: any, schoolId: number) {
  const computed = computeRecord(template, data)
  await query(
    `UPDATE result_card_records SET computed=$1 WHERE id=$2 AND school_id=$3`,
    [JSON.stringify(computed), rowId, schoolId]
  )
  return computed
}