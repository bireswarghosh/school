import { NextRequest, NextResponse } from "next/server"
import { getAll, getById, create, update, remove } from "@/lib/db"
import { mapResponse, camelToSnake } from "@/lib/field-mapping"
import { defForName, slugify } from "@/lib/gateways"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "payment_gateways"
const ORDER = "id ASC"
const FIELD_MAP = { apiKey: "api_key", secretKey: "secret_key", status: "is_active" }

// Attach client-friendly info (demo credentials, whether it's configured) without
// exposing anything that the UI needs to think is secret — demo creds are public
// test values used to run the gateways in Test mode.
function decorate(item: Record<string, any> | null): Record<string, any> | null {
  if (!item) return item
  const def = defForName(item.name)
  const apiKey = item.apiKey || ""
  const secretKey = item.secretKey || ""
  return {
    ...item,
    code: def?.code || slugify(String(item.name || "")),
    configured: Boolean(apiKey && secretKey),
    demo: Boolean(def),
    demoApiKey: def?.demoApiKey || "",
    demoSecretKey: def?.demoSecretKey || "",
    mode: item.mode || "Test",
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    return NextResponse.json(decorate(item) || { error: "Not found" }, { status: item ? 200 : 404 })
  }
  const items = await getAll(TABLE, ORDER)
  const mapped = (mapResponse(items as Record<string, any>[], FIELD_MAP) as Record<string, any>[]).map((i) => decorate(i))
  return NextResponse.json(mapped)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload = camelToSnake(body, FIELD_MAP)
    const item = await create(TABLE, payload)
    return NextResponse.json(decorate(mapResponse(item, FIELD_MAP)), { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const payload = camelToSnake(data, FIELD_MAP)
    const item = await update(TABLE, id, payload)
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(decorate(mapResponse(item, FIELD_MAP)), { status: 200 })
  } catch (e) {
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