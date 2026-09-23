import { NextRequest, NextResponse } from "next/server"
import { getAll, getById, create, update, remove, query } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

const TABLE = "si_sales"
const ORDER = "id DESC"

const fieldMap: Record<string, string> = {
  saleNo: "sale_no",
  studentId: "student_id",
  studentName: "student_name",
  productId: "product_id",
  bookId: "book_id",
  unitPrice: "unit_price",
  discountId: "discount_id",
  discountAmount: "discount_amount",
  totalAmount: "total_amount",
  saleDate: "sale_date",
  paymentStatus: "payment_status",
  vpProductId: "vp_product_id",
  componentId: "component_id",
  variantId: "variant_id",
  uniformName: "uniform_name",
}

async function availableQty(productId: number, variationId: number | null): Promise<number> {
  const sql = variationId
    ? `SELECT COALESCE(SUM(CASE WHEN entry_type = 'IN' THEN quantity ELSE -quantity END), 0) AS balance
       FROM si_stock WHERE product_id = $1 AND variation_id = $2`
    : `SELECT COALESCE(SUM(CASE WHEN entry_type = 'IN' THEN quantity ELSE -quantity END), 0) AS balance
       FROM si_stock WHERE product_id = $1 AND variation_id IS NULL`
  const res = await query(sql, variationId ? [productId, variationId] : [productId])
  return Number(res.rows[0]?.balance) || 0
}

async function syncVariationQuantity(variationId: number) {
  const res = await query(
    `SELECT COALESCE(SUM(CASE WHEN entry_type = 'IN' THEN quantity ELSE -quantity END), 0) AS balance
     FROM si_stock WHERE variation_id = $1`,
    [variationId]
  )
  const balance = Number(res.rows[0]?.balance) || 0
  await update("si_variations", variationId, { quantity: balance })
  return balance
}

function stockableOf(input: Record<string, any>): { productId: number; variationId: number | null } | null {
  const isVp = input.type === "vp"
  const pid = isVp ? null : Number(input.productId || input.product_id) || null
  if (!pid) return null
  const varId = Number(input.variantId ?? input.variationId ?? input.variation_id) || null
  return { productId: pid, variationId: varId }
}

async function writeStockOut(data: Record<string, any>, saleNo: string, saleDate: string, notes: string) {
  if (!data.product_id || !Number(data.quantity)) return
  await create("si_stock", {
    product_id: data.product_id,
    variation_id: data.variant_id || data.variation_id || null,
    quantity: Number(data.quantity),
    entry_type: "OUT",
    entry_date: saleDate,
    reference: saleNo,
    notes,
  })
  if (data.variation_id || data.variant_id) {
    await syncVariationQuantity(Number(data.variation_id || data.variant_id))
  }
}

function buildSaleRow(input: Record<string, any>, ctx: { saleNo: string; saleDate: string; paymentStatus: string }): Record<string, any> {
  const quantity = Number(input.quantity) || 0
  const unitPrice = Number(input.unitPrice) || 0
  const subtotal = input.subtotal !== undefined && input.subtotal !== null && input.subtotal !== ""
    ? Number(input.subtotal)
    : quantity * unitPrice
  const discountAmount = Number(input.discountAmount) || 0
  const totalAmount = input.totalAmount !== undefined && input.totalAmount !== null && input.totalAmount !== ""
    ? Number(input.totalAmount)
    : Math.max(0, subtotal - discountAmount)
  const isVp = input.type === "vp"
  // support si_variations as well: variationId/variantId + uniformName for any product sale
  const varId = input.variantId ?? input.variationId ?? null
  const uniName = input.uniformName ?? input.uniform_name ?? null
  return {
    sale_no: ctx.saleNo,
    student_id: input.studentId ?? null,
    student_name: input.studentName ?? null,
    product_id: isVp ? null : (input.productId ? Number(input.productId) : null),
    book_id: isVp ? null : (input.bookId ? Number(input.bookId) : null),
    vp_product_id: isVp && input.vpProductId ? Number(input.vpProductId) : null,
    component_id: isVp && input.componentId ? Number(input.componentId) : null,
    variant_id: varId ? Number(varId) : isVp && input.variantId ? Number(input.variantId) : null,
    uniform_name: uniName ? String(uniName) : isVp && input.uniformName ? String(input.uniformName) : null,
    quantity,
    unit_price: unitPrice,
    subtotal,
    discount_id: input.discountId ? Number(input.discountId) : null,
    discount_amount: discountAmount,
    total_amount: totalAmount,
    sale_date: ctx.saleDate,
    payment_status: ctx.paymentStatus,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const studentId = searchParams.get("student_id")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    return NextResponse.json(mapResponse(item, fieldMap) || { error: "Not found" }, { status: item ? 200 : 404 })
  }
  if (studentId) {
    const items = await getAll(TABLE, ORDER, "student_id = $1", [studentId])
    return NextResponse.json(mapResponse(items, fieldMap))
  }
  const items = await getAll(TABLE, ORDER)
  return NextResponse.json(mapResponse(items, fieldMap))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const saleNo = `SL-${Date.now()}`
    const saleDate = body.saleDate || new Date().toISOString().slice(0, 10)
    const paymentStatus = body.paymentStatus || "Unpaid"

    if (Array.isArray(body.items) && body.items.length > 0) {
      const lines = body.items.map((item: Record<string, any>) => ({
        ...item,
        studentId: item.studentId ?? body.studentId,
        studentName: item.studentName ?? body.studentName,
      }))

      // Pre-validate stock before inserting anything.
      for (const item of lines) {
        const stockable = stockableOf(item)
        if (!stockable) continue
        const available = await availableQty(stockable.productId, stockable.variationId)
        const wanted = Number(item.quantity) || 0
        if (available < wanted) {
          return NextResponse.json(
            { error: `Insufficient stock for ${stockable.variationId ? "variation" : "product"} — ${available} available, ${wanted} requested` },
            { status: 400 }
          )
        }
      }

      const created: Record<string, any>[] = []
      let total = 0
      for (const item of lines) {
        const data = buildSaleRow(item, { saleNo, saleDate, paymentStatus })
        const row = await create(TABLE, data)
        total += Number(row.total_amount) || 0
        if (row.product_id) {
          await writeStockOut(row, saleNo, saleDate, `Sale ${saleNo}`)
        }
        created.push(row)
      }
      const ledgerEntry = await create("si_ledger", {
        student_id: body.studentId ?? null,
        student_name: body.studentName ?? null,
        entry_date: saleDate,
        debit: total,
        credit: 0,
        reference_type: "Sale",
        reference_id: created[0]?.id ?? null,
        notes: `Sale ${saleNo}`,
      })
      return NextResponse.json(mapResponse(created, fieldMap), { status: 201 })
    }

    const data = buildSaleRow(body, { saleNo, saleDate, paymentStatus })
    const stockable = stockableOf(body)
    if (stockable) {
      const available = await availableQty(stockable.productId, stockable.variationId)
      const wanted = Number(body.quantity) || 0
      if (available < wanted) {
        return NextResponse.json(
          { error: `Insufficient stock for ${stockable.variationId ? "variation" : "product"} — ${available} available, ${wanted} requested` },
          { status: 400 }
        )
      }
    }
    const item = await create(TABLE, data)
    const ledgerEntry = await create("si_ledger", {
      student_id: data.student_id || null,
      student_name: data.student_name || null,
      entry_date: data.sale_date || saleDate,
      debit: data.total_amount || 0,
      credit: 0,
      reference_type: "Sale",
      reference_id: item.id,
      notes: `Sale ${data.sale_no || item.sale_no || ""}`,
    })
    if (data.product_id && data.quantity) {
      await writeStockOut(data, data.sale_no || item.sale_no || "", data.sale_date || saleDate, `Sale ${data.sale_no || item.sale_no || ""}`)
    }
    return NextResponse.json({ ...mapResponse(item, fieldMap), ledger: ledgerEntry }, { status: 201 })
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
  const idsRaw = searchParams.get("ids") || searchParams.get("id") || ""
  const ids = idsRaw.split(",").map((v) => parseInt(v.trim(), 10)).filter((v) => !Number.isNaN(v) && v > 0)
  if (ids.length === 0) return NextResponse.json({ error: "ids required" }, { status: 400 })
  for (const id of ids) {
    await remove(TABLE, id)
  }
  return NextResponse.json({ success: true, deleted: ids.length })
}
