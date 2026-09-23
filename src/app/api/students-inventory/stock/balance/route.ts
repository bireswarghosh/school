import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// Computed stock balances for all products and variations.
// si_stock is the ledger: balance = SUM(IN) - SUM(OUT) grouped by
// (product_id, variation_id). This powers the POS low-stock alerts and
// the Stock Levels view on the stock-management page.

type StockStatus = "ok" | "low" | "out"

function statusOf(balance: number, minStock: number): StockStatus {
  if (balance <= 0) return "out"
  if (minStock > 0 && balance <= minStock) return "low"
  return "ok"
}

export async function GET(req: NextRequest) {
  const raw = req.headers.get("x-school-id")
  const schoolId = raw && !Number.isNaN(parseInt(raw, 10)) ? parseInt(raw, 10) : null

  const productsSql = `
    SELECT p.id AS product_id, p.name, p.code, p.selling_price AS price,
      COALESCE(p.min_stock, 0) AS min_stock,
      COALESCE(agg.balance, 0) AS balance
    FROM si_products p
    LEFT JOIN (
      SELECT product_id, SUM(CASE WHEN entry_type = 'IN' THEN quantity ELSE -quantity END) AS balance
      FROM si_stock
      WHERE product_id IS NOT NULL AND variation_id IS NULL${schoolId ? " AND school_id = $1" : ""}
      GROUP BY product_id
    ) agg ON agg.product_id = p.id
    ${schoolId ? "WHERE p.school_id = $1" : ""}
    ORDER BY p.name ASC
  `

  const variationsSql = `
    SELECT v.id AS variation_id, v.product_id, v.color, v.size, v.variant_value,
      v.variant_type, v.component_name, v.sku,
      COALESCE(v.price, v.additional_price, 0) AS price,
      COALESCE(v.min_stock, COALESCE(p.min_stock, 0), 0) AS min_stock,
      COALESCE(agg.balance, 0) AS balance
    FROM si_variations v
    LEFT JOIN si_products p ON p.id = v.product_id
    LEFT JOIN (
      SELECT variation_id, SUM(CASE WHEN entry_type = 'IN' THEN quantity ELSE -quantity END) AS balance
      FROM si_stock
      WHERE variation_id IS NOT NULL${schoolId ? " AND school_id = $1" : ""}
      GROUP BY variation_id
    ) agg ON agg.variation_id = v.id
    ${schoolId ? "WHERE v.school_id = $1" : ""}
    ORDER BY v.product_id ASC, v.color ASC, v.size ASC
  `

  const params = schoolId ? [schoolId] : []
  const [productsRes, variationsRes] = await Promise.all([
    query(productsSql, params),
    query(variationsSql, params),
  ])

  const products = productsRes.rows.map((r) => {
    const balance = Number(r.balance) || 0
    const minStock = Number(r.min_stock) || 0
    return {
      productId: Number(r.product_id),
      name: r.name || "Product",
      code: r.code || null,
      price: Number(r.price) || 0,
      minStock,
      balance,
      status: statusOf(balance, minStock),
    }
  })

  const variations = variationsRes.rows.map((r) => {
    const balance = Number(r.balance) || 0
    const minStock = Number(r.min_stock) || 0
    const parts = [r.component_name, r.color, r.size, r.variant_value].filter(Boolean)
    return {
      variationId: Number(r.variation_id),
      productId: Number(r.product_id),
      label: parts.join(" · ") || (r.sku ? `SKU ${r.sku}` : `Variation #${r.variation_id}`),
      sku: r.sku || null,
      price: Number(r.price) || 0,
      minStock,
      balance,
      status: statusOf(balance, minStock),
    }
  })

  return NextResponse.json({ products, variations })
}