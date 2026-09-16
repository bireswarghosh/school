import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "icse_exam_students"
const ORDER = "id ASC"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const examId = searchParams.get("exam_id")
  const studentId = searchParams.get("student_id")

  if (id) {
    const item = await getById(TABLE, parseInt(id))
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 })
  }

  let whereClause = ""
  const params: (string | number)[] = []

  if (examId) {
    whereClause = "exam_id = $1"
    params.push(parseInt(examId))
  }
  if (studentId) {
    whereClause = whereClause ? `${whereClause} AND student_id = $${params.length + 1}` : "student_id = $1"
    params.push(parseInt(studentId))
  }

  if (whereClause) {
    const items = await getAll(TABLE, ORDER, whereClause, params)
    return NextResponse.json(items)
  }
  const items = await getAll(TABLE, ORDER)
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const item = await create(TABLE, body)
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const item = await update(TABLE, id, data)
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  const examId = searchParams.get("exam_id")
  const studentId = searchParams.get("student_id")

  if (id) {
    await remove(TABLE, id)
    return NextResponse.json({ success: true })
  }

  if (examId && studentId) {
    await query("DELETE FROM icse_exam_students WHERE exam_id = $1 AND student_id = $2", [parseInt(examId), parseInt(studentId)])
    return NextResponse.json({ success: true })
  }

  if (examId) {
    await query("DELETE FROM icse_exam_students WHERE exam_id = $1", [parseInt(examId)])
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "id, exam_id, or student_id required" }, { status: 400 })
}
