import { NextRequest, NextResponse } from "next/server"
import { query, getById, create, update, remove } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "student_attendance"

const statusToTypeId: Record<string, number> = {
  present: 1,
  late: 2,
  absent: 3,
  holiday: 4,
}

// Resolve the configured attendance type for a record. Prefers the explicit
// attendanceTypeId; otherwise falls back to the well-known status names, then
// to any custom type defined in attendance_types (case-insensitive by name).
async function resolveTypeId(typeId?: number | null, status?: string | null): Promise<number> {
  if (typeId) return Number(typeId)
  if (!status) return 1
  const fixed = statusToTypeId[String(status).toLowerCase()]
  if (fixed) return fixed
  const res = await query(`SELECT id FROM attendance_types WHERE LOWER(type) = $1 LIMIT 1`, [String(status).toLowerCase()])
  return res.rows[0]?.id ?? 1
}

function snakeToCamel(row: any) {
  if (!row) return row
  return {
    id: row.id,
    studentId: row.student_id,
    classId: row.class_id,
    sectionId: row.section_id,
    admissionNo: row.admission_no,
    name: row.student_name,
    rollNo: row.roll_no,
    date: row.date,
    attendanceTypeId: row.attendance_type_id,
    attendanceType: row.attendance_type,
    inTime: row.in_time,
    outTime: row.out_time,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    return NextResponse.json(snakeToCamel(item) || { error: "Not found" }, { status: item ? 200 : 404 })
  }

  const classId = searchParams.get("class_id")
  const sectionId = searchParams.get("section_id")
  const date = searchParams.get("date")
  const fromDate = searchParams.get("from_date")
  const toDate = searchParams.get("to_date")

  if (classId && sectionId) {
    const conditions: string[] = ["sa.class_id = $1::int", "sa.section_id = $2::int"]
    const params: (string | number)[] = [parseInt(classId), parseInt(sectionId)]
    let paramIdx = 3

    if (date) {
      conditions.push(`sa.date = $${paramIdx}`)
      params.push(date)
      paramIdx++
    } else if (fromDate && toDate) {
      conditions.push(`sa.date >= $${paramIdx}`)
      params.push(fromDate)
      paramIdx++
      conditions.push(`sa.date <= $${paramIdx}`)
      params.push(toDate)
      paramIdx++
    }

    const sql = `
      SELECT sa.*, at.type AS attendance_type, s.admission_no, s.name AS student_name, s.roll_no
      FROM student_attendance sa
      LEFT JOIN students s ON s.id = sa.student_id
      LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY sa.date, sa.student_id
    `
    const result = await query(sql, params)
    return NextResponse.json(result.rows.map(snakeToCamel))
  }

  const items = await query(`SELECT sa.*, at.type AS attendance_type, s.admission_no, s.name AS student_name, s.roll_no FROM ${TABLE} sa LEFT JOIN students s ON s.id = sa.student_id LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id ORDER BY sa.id DESC`)
  return NextResponse.json(items.rows.map(snakeToCamel))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (Array.isArray(body)) {
      const results = []
      for (const record of body) {
        const { studentId, classId, sectionId, date, status, attendanceTypeId, inTime, outTime } = record
        const resolvedTypeId = await resolveTypeId(attendanceTypeId, status)

        const existing = await query(
          `SELECT id FROM ${TABLE} WHERE student_id = $1::int AND date = $2`,
          [studentId, date]
        )

        if (existing.rows.length > 0) {
          const updated = await update(TABLE, existing.rows[0].id, {
            class_id: classId,
            section_id: sectionId,
            attendance_type_id: resolvedTypeId,
            in_time: inTime || null,
            out_time: outTime || null,
          })
          results.push(updated)
        } else {
          const created = await create(TABLE, {
            student_id: studentId,
            class_id: classId,
            section_id: sectionId,
            date,
            attendance_type_id: resolvedTypeId,
            in_time: inTime || null,
            out_time: outTime || null,
          })
          results.push(created)
        }
      }
      return NextResponse.json(results, { status: 201 })
    }

    const { studentId, classId, sectionId, date, status, attendanceTypeId, inTime, outTime } = body
    const resolvedTypeId = await resolveTypeId(attendanceTypeId, status)

    const existing = await query(
      `SELECT id FROM ${TABLE} WHERE student_id = $1::int AND date = $2`,
      [studentId, date]
    )

    if (existing.rows.length > 0) {
      const item = await update(TABLE, existing.rows[0].id, {
        class_id: classId,
        section_id: sectionId,
        attendance_type_id: resolvedTypeId,
        in_time: inTime || null,
        out_time: outTime || null,
      })
      return NextResponse.json(snakeToCamel(item), { status: 200 })
    }

    const item = await create(TABLE, {
      student_id: studentId,
      class_id: classId,
      section_id: sectionId,
      date,
      attendance_type_id: resolvedTypeId,
      in_time: inTime || null,
      out_time: outTime || null,
    })
    return NextResponse.json(snakeToCamel(item), { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const mapped: Record<string, any> = {}
    if (data.studentId !== undefined) mapped.student_id = data.studentId
    if (data.classId !== undefined) mapped.class_id = data.classId
    if (data.sectionId !== undefined) mapped.section_id = data.sectionId
    if (data.date !== undefined) mapped.date = data.date
    if (data.attendanceTypeId !== undefined) mapped.attendance_type_id = Number(data.attendanceTypeId)
    else if (data.status !== undefined) mapped.attendance_type_id = await resolveTypeId(undefined, data.status)
    if (data.inTime !== undefined) mapped.in_time = data.inTime
    if (data.outTime !== undefined) mapped.out_time = data.outTime

    const item = await update(TABLE, id, mapped)
    return NextResponse.json(snakeToCamel(item) || { error: "Not found" }, { status: item ? 200 : 404 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await remove(TABLE, id)
  return NextResponse.json({ success: true })
}
