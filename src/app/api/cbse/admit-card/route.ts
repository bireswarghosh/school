import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function GET(req: NextRequest) {
  try {
    const sql = `
      SELECT DISTINCT ON (s.id, e.id)
        e.id,
        st.name AS student_name, st.admission_no, e.class, e.section,
        e.name AS exam_name, st.roll_no, COALESCE(st.email, '') AS father_name,
        COALESCE(st.phone, '') AS mother_name, '' AS date_of_birth, NULL AS photo
      FROM cbse_exam_students es
      JOIN students st ON st.id = es.student_id
      JOIN cbse_exams e ON e.id = es.exam_id
      ORDER BY st.id, e.id, st.name
    `
    const result = await query(sql)
    return NextResponse.json(result.rows)
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await query(
      `INSERT INTO cbse_admit_cards (student_id, student_name, admission_no, class, section, exam_name, roll_no, father_name, mother_name, date_of_birth, photo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [body.student_id, body.student_name, body.admission_no, body.class, body.section, body.exam_name, body.roll_no, body.father_name, body.mother_name, body.date_of_birth, body.photo]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const sets: string[] = []
    const vals: any[] = []
    let idx = 1
    for (const [key, value] of Object.entries(data)) {
      sets.push(`${key} = $${idx++}`)
      vals.push(value)
    }
    vals.push(id)
    const result = await query(`UPDATE cbse_admit_cards SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`, vals)
    return NextResponse.json(result.rows[0] || { error: "Not found" }, { status: result.rows[0] ? 200 : 404 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await query("DELETE FROM cbse_admit_cards WHERE id = $1", [id])
  return NextResponse.json({ success: true })
}
