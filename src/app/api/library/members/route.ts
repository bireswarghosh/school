import { NextRequest, NextResponse } from "next/server"
import { query, getById, create, remove } from "@/lib/db"

const TABLE = "library_members"
const ORDER = "lm.id DESC"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const result = await query(
      `SELECT lm.*,
              COALESCE(s.phone, st.phone) AS phone,
              s.admission_no, s.father_name, s.dob, s.gender, s.mobile,
              c.name AS class_name,
              st.staff_id AS staff_no,
              d.name AS department,
              des.name AS designation
       FROM library_members lm
       LEFT JOIN students s ON lm.member_type = 'student' AND lm.member_id = s.id
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN staff st ON lm.member_type = 'staff' AND lm.member_id = st.id
       LEFT JOIN departments d ON st.department_id = d.id
       LEFT JOIN designations des ON st.designation_id = des.id
       WHERE lm.id = $1`, [parseInt(id)]
    )
    return NextResponse.json(result.rows[0] || { error: "Not found" }, { status: result.rows[0] ? 200 : 404 })
  }
  const result = await query(
    `SELECT lm.*,
            COALESCE(s.phone, st.phone) AS phone,
            s.admission_no, s.father_name, s.dob, s.gender, s.mobile,
            c.name AS class_name,
            st.staff_id AS staff_no,
            d.name AS department,
            des.name AS designation
     FROM library_members lm
     LEFT JOIN students s ON lm.member_type = 'student' AND lm.member_id = s.id
     LEFT JOIN classes c ON s.class_id = c.id
     LEFT JOIN staff st ON lm.member_type = 'staff' AND lm.member_id = st.id
     LEFT JOIN departments d ON st.department_id = d.id
     LEFT JOIN designations des ON st.designation_id = des.id
     ORDER BY ${ORDER}`
  )
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const item = await create(TABLE, body)
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await remove(TABLE, id)
  return NextResponse.json({ success: true })
}
