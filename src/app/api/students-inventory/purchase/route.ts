import { NextRequest, NextResponse } from "next/server"
import { getAll, getById, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

const TABLE = "si_purchases"
const ORDER = "id DESC"

const fieldMap: Record<string, string> = {
  purchaseNo: "purchase_no",
  vendorId: "vendor_id",
  storeId: "store_id",
  productId: "product_id",
  unitPrice: "unit_price",
  totalAmount: "total_amount",
  purchaseDate: "purchase_date",
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const vendorId = searchParams.get("vendor_id")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    return NextResponse.json(mapResponse(item, fieldMap) || { error: "Not found" }, { status: item ? 200 : 404 })
  }
  if (vendorId) {
    const items = await getAll(TABLE, ORDER, "vendor_id = $1", [vendorId])
    return NextResponse.json(mapResponse(items, fieldMap))
  }
  const items = await getAll(TABLE, ORDER)
  return NextResponse.json(mapResponse(items, fieldMap))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = camelToSnake(body, fieldMap)
    if (!data.total_amount && data.quantity && data.unit_price) {
      data.total_amount = Number(data.quantity) * Number(data.unit_price)
    }
    const item = await create(TABLE, data)
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
    const data = camelToSnake(rest, fieldMap)
    if (data.total_amount === undefined && data.quantity && data.unit_price) {
      data.total_amount = Number(data.quantity) * Number(data.unit_price)
    }
    const item = await update(TABLE, id, data)
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
