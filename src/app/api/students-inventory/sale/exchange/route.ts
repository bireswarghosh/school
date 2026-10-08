import { NextRequest, NextResponse } from "next/server"
import { create, query, update } from "@/lib/db"
import { mapResponse } from "@/lib/field-mapping"

// Exchange one order line for another product/book:
//  - old product qty returns to stock (IN), new product qty is issued (OUT)
//  - line totals recalculated, order ledger retotalled
//  - an appended history line in exchange_note records what changed

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
  paymentMethod: "payment_method",
  paymentNote: "payment_note",
  exchangeNote: "exchange_note",
  vpProductId: "vp_product_id",
  componentId: "component_id",
  variantId: "variant_id",
  uniformName: "uniform_name",
}

const round2 = (n: number) => Math.round(n * 100) / 100
const fmtN = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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

async function productLabel(productId: number, variationId: number | null): Promise<string> {
  const p = await query(`SELECT name FROM si_products WHERE id = $1`, [productId])
  let label = p.rows[0]?.name || `Product #${productId}`
  if (variationId) {
    const v = await query(
      `SELECT component_name, variant_type, color, size, variant_value FROM si_variations WHERE id = $1`,
      [variationId]
    )
    const row = v.rows[0]
    if (row) {
      const comp = row.component_name || row.variant_type
      const parts = [comp && comp !== label ? comp : null, row.color, row.size || row.variant_value]
        .filter(Boolean)
        .join(" · ")
      if (parts) label += ` — ${parts}`
    }
  }
  return label
}

async function bookLabel(bookId: number): Promise<string> {
  const b = await query(`SELECT title FROM si_books WHERE id = $1`, [bookId])
  return b.rows[0]?.title || `Book #${bookId}`
}

async function saleLineLabel(row: Record<string, any>): Promise<string> {
  if (row.book_id) return bookLabel(Number(row.book_id))
  if (row.product_id) {
    const v = Number(row.variant_id ?? row.variation_id) || null
    return productLabel(Number(row.product_id), v)
  }
  return row.uniform_name ? String(row.uniform_name) : `Line #${row.id}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = Number(body.id)
    if (!id) return NextResponse.json({ error: "Sale line id required" }, { status: 400 })

    const cur = await query(`SELECT * FROM si_sales WHERE id = $1`, [id])
    const old = cur.rows?.[0]
    if (!old) return NextResponse.json({ error: "Sale line not found" }, { status: 404 })

    const newProductId = body.productId ? Number(body.productId) : null
    const newBookId = body.bookId ? Number(body.bookId) : null
    const rawVar = body.variationId ?? body.variantId ?? null
    const newVariationId = rawVar ? Number(rawVar) : null
    if ((!newProductId && !newBookId) || (newProductId && newBookId)) {
      return NextResponse.json({ error: "Select a replacement product or book" }, { status: 400 })
    }

    const newQty = Math.max(1, Math.floor(Number(body.quantity) || 1))

    // Stock check for the incoming product (old qty counts back when same stock row)
    if (newProductId) {
      const avail = await availableQty(newProductId, newVariationId)
      const oldVar = Number(old.variant_id ?? old.variation_id) || null
      const sameStock = Number(old.product_id) === newProductId && oldVar === newVariationId
      const effective = avail + (sameStock ? Number(old.quantity) || 0 : 0)
      if (effective < newQty) {
        return NextResponse.json(
          { error: `Insufficient stock — ${effective} available, ${newQty} requested` },
          { status: 400 }
        )
      }
    }

    const oldLabel = await saleLineLabel(old)
    const newLabel = newBookId
      ? await bookLabel(newBookId)
      : await productLabel(newProductId as number, newVariationId)

    const unitPrice = Math.max(0, Number(body.unitPrice) || 0)
    const subtotal = round2(newQty * unitPrice)
    let discountAmount = Math.max(0, Number(old.discount_amount) || 0)
    if (discountAmount > subtotal) discountAmount = subtotal
    const totalAmount = Math.max(0, round2(subtotal - discountAmount))
    const oldTotal = Number(old.total_amount) || 0
    const oldQty = Number(old.quantity) || 0
    const today = new Date().toISOString().slice(0, 10)

    // 1) Old product goes back to stock
    if (old.product_id) {
      const oldVar = Number(old.variant_id ?? old.variation_id) || null
      await create("si_stock", {
        product_id: Number(old.product_id),
        variation_id: oldVar,
        quantity: oldQty,
        entry_type: "IN",
        entry_date: today,
        reference: old.sale_no,
        notes: `Exchange restock (line ${id}) for ${old.sale_no}`,
      })
      if (oldVar) await syncVariationQuantity(oldVar)
    }

    // 2) New product is issued from stock
    if (newProductId) {
      await create("si_stock", {
        product_id: newProductId,
        variation_id: newVariationId,
        quantity: newQty,
        entry_type: "OUT",
        entry_date: today,
        reference: old.sale_no,
        notes: `Exchange issue (line ${id}) for ${old.sale_no}`,
      })
      if (newVariationId) await syncVariationQuantity(newVariationId)
    }

    // 3) Noted record of what changed (appended history)
    const entry =
      `${today}: ${oldLabel} (qty ${oldQty}, ${fmtN(oldTotal)}) -> ` +
      `${newLabel} (qty ${newQty}, ${fmtN(totalAmount)})`
    const history = old.exchange_note ? `${old.exchange_note}\n${entry}` : entry

    // 4) Replace the line
    let uniformName: string | null = null
    if (newVariationId && newProductId) {
      const p = await query(`SELECT name FROM si_products WHERE id = $1`, [newProductId])
      uniformName = p.rows[0]?.name || null
    }
    const updated = await update("si_sales", id, {
      product_id: newProductId,
      book_id: newBookId,
      variant_id: newVariationId,
      uniform_name: uniformName,
      quantity: newQty,
      unit_price: unitPrice,
      subtotal,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      exchange_note: history,
    })
    if (!updated) return NextResponse.json({ error: "Failed to update sale line" }, { status: 400 })

    // 5) Retotal the order ledger to the new order total
    const ord = await query(
      `SELECT COALESCE(SUM(total_amount), 0) AS t FROM si_sales WHERE sale_no = $1`,
      [old.sale_no]
    )
    const orderTotal = Number(ord.rows[0]?.t) || 0
    await query(
      `UPDATE si_ledger SET debit = $1 WHERE reference_type = 'Sale' AND notes = $2`,
      [orderTotal, `Sale ${old.sale_no}`]
    )

    return NextResponse.json({ ...mapResponse(updated, fieldMap), orderTotal })
  } catch (e: any) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
