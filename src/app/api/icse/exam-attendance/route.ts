import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

const fieldMap: Record<string, string> = {
  examId: "exam_id",
  studentId: "student_id",
  attendanceCount: "attendance_count",
}

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "icse_student_attendance"
const ORDER = "id ASC"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const examId = searchParams.get("exam_id")

  if (id) {
    const item = await getById(TABLE, parseInt(id))
    const result = item ? mapResponse(item, fieldMap) : { error: "Not found" }
    return NextResponse.json(result, { status: item ? 200 : 404 })
  }
  if (examId) {
    const items = await getAll(TABLE, ORDER, "exam_id = $1", [parseInt(examId)])
    return NextResponse.json(mapResponse(items, fieldMap))
  }
  const items = await getAll(TABLE, ORDER)
  return NextResponse.json(mapResponse(items, fieldMap))
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
  const examId = searchParams.get("exam_id")
  if (id) {
    await remove(TABLE, id)
    return NextResponse.json({ success: true })
  }
  if (examId) {
    await query("DELETE FROM icse_student_attendance WHERE exam_id = $1", [parseInt(examId)])
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: "id or exam_id required" }, { status: 400 })
}
