import { NextRequest, NextResponse } from "next/server"
import { getAll, getById, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

const TABLE = "si_variations"
const ORDER = "id DESC"

const fieldMap: Record<string, string> = {
  productId: "product_id",
  variantType: "variant_type",
  variantValue: "variant_value",
  additionalPrice: "additional_price",
  componentName: "component_name",
  color: "color",
  size: "size",
  price: "price",
  sku: "sku",
  barcode: "barcode",
  quantity: "quantity",
  minStock: "min_stock",
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const productId = searchParams.get("product_id")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    return NextResponse.json(mapResponse(item, fieldMap) || { error: "Not found" }, { status: item ? 200 : 404 })
  }
  if (productId) {
    const items = await getAll(TABLE, ORDER, "product_id = $1", [productId])
    return NextResponse.json(mapResponse(items, fieldMap))
  }
  const items = await getAll(TABLE, ORDER)
  return NextResponse.json(mapResponse(items, fieldMap))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const item = await create(TABLE, camelToSnake(body, fieldMap))
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
