import { NextRequest, NextResponse } from "next/server"
import { getAll, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"
import { getCurrentSession } from "@/lib/auth"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "student_timeline"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("student_id")
    const items = studentId
      ? await getAll(TABLE, "timeline_date DESC, id DESC", "student_id = $1", [parseInt(studentId, 10)])
      : await getAll(TABLE, "timeline_date DESC, id DESC")
    return NextResponse.json(mapResponse(items))
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const session = await getCurrentSession()
    const payload = {
      ...body,
      created_by: body.createdBy || session?.name || null,
    }
    const item = await create(TABLE, camelToSnake(payload))
    return NextResponse.json(item ? mapResponse(item) : item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const item = await update(TABLE, id, camelToSnake(data))
    return NextResponse.json(item ? mapResponse(item) : { error: "Not found" }, { status: item ? 200 : 404 })
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
