import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const schoolId = getSessionSchoolId(req)
    const { id } = await params
    const res = await query(
      `SELECT rt.*, c.name AS class_name
       FROM result_card_templates rt
       LEFT JOIN classes c ON c.id = rt.class_id
       WHERE rt.id = $1 AND rt.school_id = $2`,
      [Number(id), schoolId]
    )
    if (!res.rows[0]) return NextResponse.json({ error: "Template not found" }, { status: 404 })
    return NextResponse.json(res.rows[0])
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const schoolId = getSessionSchoolId(req)
    const { id } = await params
    const body = await req.json()
    const res = await query(
      `UPDATE result_card_templates
       SET name=$1, class_id=$2, session=$3, pages=$4, grade_scale=$5, template_key=$6, is_active=$7, updated_at=NOW()
       WHERE id=$8 AND school_id=$9 RETURNING *`,
      [
        String(body.name || "").trim(),
        body.class_id ? Number(body.class_id) : null,
        body.session || null,
        JSON.stringify(body.pages || []),
        JSON.stringify(body.grade_scale || []),
        body.template_key || null,
        body.is_active !== false,
        Number(id),
        schoolId,
      ]
    )
    if (!res.rows[0]) return NextResponse.json({ error: "Template not found" }, { status: 404 })
    return NextResponse.json(res.rows[0])
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const schoolId = getSessionSchoolId(req)
    const { id } = await params
    const res = await query(
      `DELETE FROM result_card_templates WHERE id=$1 AND school_id=$2 RETURNING id`,
      [Number(id), schoolId]
    )
    if (!res.rows[0]) return NextResponse.json({ error: "Template not found" }, { status: 404 })
    return NextResponse.json({ status: 1 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}