import { NextRequest, NextResponse } from "next/server"
import { query, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

const TABLE = "icse_exam_schedules"
const fieldMap: Record<string, string> = {
  examId: "icse_exam_id",
  subjectId: "subject_id",
  startTime: "start_time",
  endTime: "end_time",
  examName: "exam_name",
  subjectName: "subject_name",
}

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const examId = searchParams.get("exam_id")
    let sql: string
    let params: any[] = []
    if (examId) {
      sql = `SELECT s.*, e.name AS exam_name, sub.name AS subject_name
        FROM icse_exam_schedules s
        LEFT JOIN icse_exams e ON e.id = s.icse_exam_id
        LEFT JOIN subjects sub ON sub.id = s.subject_id
        WHERE s.icse_exam_id = $1
        ORDER BY s.date ASC, s.start_time ASC`
      params = [parseInt(examId)]
    } else {
      sql = `SELECT s.*, e.name AS exam_name, sub.name AS subject_name
        FROM icse_exam_schedules s
        LEFT JOIN icse_exams e ON e.id = s.icse_exam_id
        LEFT JOIN subjects sub ON sub.id = s.subject_id
        ORDER BY s.date DESC`
    }
    const result = await query(sql, params)
    return NextResponse.json(mapResponse(result.rows, fieldMap))
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = camelToSnake(body, fieldMap)
    const item = await create(TABLE, data)
    return NextResponse.json(mapResponse(item, fieldMap), { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const data = camelToSnake(rest, fieldMap)
    const item = await update(TABLE, id, data)
    const result = item ? mapResponse(item, fieldMap) : { error: "Not found" }
    return NextResponse.json(result, { status: item ? 200 : 404 })
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
