import { NextRequest, NextResponse } from "next/server"
import { create, getAll } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "system_updates"
const ORDER = "update_date DESC, id DESC"

const fieldMap: Record<string, string> = {
  updateDate: "update_date",
}

export async function GET() {
  try {
    const items = await getAll(TABLE, ORDER)
    return NextResponse.json(mapResponse(items, fieldMap))
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = camelToSnake(body, fieldMap)
    const item = await create(TABLE, data)
    return NextResponse.json(mapResponse(item, fieldMap), { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}