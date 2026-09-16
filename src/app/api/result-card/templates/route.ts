import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    // allow super_admin (no school) to see all templates for debugging; otherwise filter by school
    const res = schoolId
      ? await query(
          `SELECT rt.*, c.name AS class_name
           FROM result_card_templates rt
           LEFT JOIN classes c ON c.id = rt.class_id
           WHERE rt.school_id = $1
           ORDER BY rt.id DESC`,
          [schoolId]
        )
      : await query(
          `SELECT rt.*, c.name AS class_name
           FROM result_card_templates rt
           LEFT JOIN classes c ON c.id = rt.class_id
           ORDER BY rt.id DESC`
        )
    return NextResponse.json(res.rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    const body = await req.json()
    const id = Number(body.id)
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const res = await query(
      `UPDATE result_card_templates
       SET name=$1, class_id=$2, session=$3, pages=$4, grade_scale=$5, template_key=$6, is_active=$7, updated_at=NOW()
       WHERE id=$8 ${schoolId ? "AND school_id=$9" : ""} RETURNING *`,
      schoolId
        ? [String(body.name || "").trim(), body.class_id ? Number(body.class_id) : null, body.session || null, JSON.stringify(body.pages || []), JSON.stringify(body.grade_scale || []), body.template_key || null, body.is_active !== false, id, schoolId]
        : [String(body.name || "").trim(), body.class_id ? Number(body.class_id) : null, body.session || null, JSON.stringify(body.pages || []), JSON.stringify(body.grade_scale || []), body.template_key || null, body.is_active !== false, id]
    )
    if (!res.rows[0]) return NextResponse.json({ error: "Template not found" }, { status: 404 })
    return NextResponse.json(res.rows[0])
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    const id = parseInt(req.nextUrl.searchParams.get("id") || "0")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const res = schoolId
      ? await query(`DELETE FROM result_card_templates WHERE id=$1 AND school_id=$2 RETURNING id`, [id, schoolId])
      : await query(`DELETE FROM result_card_templates WHERE id=$1 RETURNING id`, [id])
    if (!res.rows[0]) return NextResponse.json({ error: "Template not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    if (!schoolId) return NextResponse.json({ error: "No school session" }, { status: 401 })
    const body = await req.json()
    const name = String(body.name || "").trim()
    if (!name) return NextResponse.json({ error: "Template name required" }, { status: 400 })
    const res = await query(
      `INSERT INTO result_card_templates (school_id, name, class_id, session, pages, grade_scale, template_key, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        schoolId,
        name,
        body.class_id ? Number(body.class_id) : null,
        body.session || null,
        JSON.stringify(body.pages || []),
        JSON.stringify(body.grade_scale || []),
        body.template_key || null,
        body.is_active !== false,
      ]
    )
    return NextResponse.json(res.rows[0], { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}