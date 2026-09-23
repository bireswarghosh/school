import { NextRequest, NextResponse } from "next/server"
import { getAll, getById, create, update, remove, query } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

const TABLE = "si_stock"
const ORDER = "id DESC"

const fieldMap: Record<string, string> = {
  productId: "product_id",
  storeId: "store_id",
  variationId: "variation_id",
  entryType: "entry_type",
  entryDate: "entry_date",
}

async function syncVariationQuantity(variationId: number) {
  const res = await query(
    `SELECT COALESCE(SUM(CASE WHEN entry_type = 'IN' THEN quantity ELSE -quantity END), 0) AS balance
     FROM si_stock
     WHERE variation_id = $1`,
    [variationId]
  )
  const balance = Number(res.rows[0]?.balance) || 0
  await update("si_variations", variationId, { quantity: balance })
  return balance
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const productId = searchParams.get("product_id")
  const variationId = searchParams.get("variation_id")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    return NextResponse.json(mapResponse(item, fieldMap) || { error: "Not found" }, { status: item ? 200 : 404 })
  }
  if (productId) {
    const items = await getAll(TABLE, ORDER, "product_id = $1", [productId])
    return NextResponse.json(mapResponse(items, fieldMap))
  }
  if (variationId) {
    const items = await getAll(TABLE, ORDER, "variation_id = $1", [variationId])
    return NextResponse.json(mapResponse(items, fieldMap))
  }
  const items = await getAll(TABLE, ORDER)
  return NextResponse.json(mapResponse(items, fieldMap))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = camelToSnake(body, fieldMap)
    if (!data.entry_type) data.entry_type = "IN"
    if (data.variation_id !== undefined && data.variation_id !== null && !Number(data.variation_id)) {
      delete data.variation_id
    }
    const item = await create(TABLE, data)
    if (item?.variation_id) {
      await syncVariationQuantity(Number(item.variation_id))
    }
    return NextResponse.json(mapResponse(item, fieldMap), { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const item = await update(TABLE, id, camelToSnake(rest, fieldMap))
    return NextResponse.json(mapResponse(item, fieldMap) || { error: "Not found" }, { status: item ? 200 : 404 })
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