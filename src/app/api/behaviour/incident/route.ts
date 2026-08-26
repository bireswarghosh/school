import { NextRequest, NextResponse } from "next/server"
import { getAll, getById, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"
import { getCurrentSession } from "@/lib/auth"


function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "incidents"
const ORDER = "id DESC"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    return NextResponse.json(item ? mapResponse(item) : { error: "Not found" }, { status: item ? 200 : 404 })
  }
  const studentId = searchParams.get("student_id")
  const items = studentId
    ? await getAll(TABLE, ORDER, "student_id = $1", [parseInt(studentId, 10)])
    : await getAll(TABLE, ORDER)
  return NextResponse.json(mapResponse(items))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const session = await getCurrentSession()
    const payload = {
      ...body,
      assign_by: body.assignBy || session?.name || null,
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
