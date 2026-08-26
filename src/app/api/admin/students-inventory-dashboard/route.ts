import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    const scope = schoolId ? `WHERE school_id = $1` : ""
    const params = schoolId ? [schoolId] : []

    const [products, books, categories, vendors, stores, coupons, stock, sales, ledger, lowStock, recentSales, salesByCategory, topProducts] = await Promise.all([
      query(`SELECT COUNT(*)::int AS count FROM si_products ${scope}`, params),
      query(`SELECT COUNT(*)::int AS count FROM si_books ${scope}`, params),
      query(`SELECT COUNT(*)::int AS count FROM si_categories ${scope}`, params),
      query(`SELECT COUNT(*)::int AS count FROM si_vendors ${scope}`, params),
      query(`SELECT COUNT(*)::int AS count FROM si_stores ${scope}`, params),
      query(`SELECT COUNT(*)::int AS count FROM si_coupons ${scope}`, params),
      query(
        `SELECT COALESCE(SUM(CASE WHEN entry_type = 'IN' THEN quantity ELSE -quantity END * p.selling_price), 0)::numeric AS value,
                COALESCE(SUM(CASE WHEN entry_type = 'IN' THEN quantity ELSE -quantity END), 0)::int AS units
         FROM si_stock st LEFT JOIN si_products p ON p.id = st.product_id ${scope}`,
        params
      ),
      query(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(total_amount), 0)::numeric AS value,
                COALESCE(SUM(CASE WHEN payment_status = 'Paid' THEN total_amount ELSE 0 END), 0)::numeric AS collected
         FROM si_sales ${scope}`,
        params
      ),
      query(
        `SELECT COALESCE(SUM(debit) - SUM(credit), 0)::numeric AS balance,
                COALESCE(SUM(credit), 0)::numeric AS collected,
                COALESCE(SUM(debit), 0)::numeric AS billed
         FROM si_ledger ${scope}`,
        params
      ),
      query(
        `SELECT p.id, p.name, p.min_stock, COALESCE(SUM(CASE WHEN st.entry_type = 'IN' THEN st.quantity ELSE -st.quantity END), 0)::int AS total_stock
         FROM si_products p LEFT JOIN si_stock st ON st.product_id = p.id
         ${schoolId ? "WHERE p.school_id = $1" : ""}
         GROUP BY p.id, p.name, p.min_stock
         HAVING COALESCE(SUM(CASE WHEN st.entry_type = 'IN' THEN st.quantity ELSE -st.quantity END), 0) < p.min_stock
         ORDER BY (COALESCE(SUM(CASE WHEN st.entry_type = 'IN' THEN st.quantity ELSE -st.quantity END), 0) - p.min_stock) ASC
         LIMIT 8`,
        params
      ),
      query(
        `SELECT s.id, s.sale_no, s.student_name, s.sale_date, s.total_amount, s.payment_status, p.name AS product_name
         FROM si_sales s LEFT JOIN si_products p ON p.id = s.product_id
         ${schoolId ? "WHERE s.school_id = $1" : ""}
         ORDER BY s.sale_date DESC, s.id DESC
         LIMIT 8`,
        params
      ),
      query(
        `SELECT c.name, COUNT(s.id)::int AS sale_count, COALESCE(SUM(s.total_amount), 0)::numeric AS total
         FROM si_categories c LEFT JOIN si_products p ON p.category_id = c.id
         LEFT JOIN si_sales s ON s.product_id = p.id
         ${schoolId ? "WHERE c.school_id = $1" : ""}
         GROUP BY c.id, c.name
         ORDER BY total DESC`,
        params
      ),
      query(
        `SELECT p.name, COALESCE(SUM(s.quantity), 0)::int AS units, COALESCE(SUM(s.total_amount), 0)::numeric AS revenue
         FROM si_products p LEFT JOIN si_sales s ON s.product_id = p.id
         ${schoolId ? "WHERE p.school_id = $1" : ""}
         GROUP BY p.id, p.name
         ORDER BY units DESC
         LIMIT 8`,
        params
      ),
    ])

    return NextResponse.json({
      totals: {
        products: products.rows[0]?.count ?? 0,
        books: books.rows[0]?.count ?? 0,
        categories: categories.rows[0]?.count ?? 0,
        vendors: vendors.rows[0]?.count ?? 0,
        stores: stores.rows[0]?.count ?? 0,
        coupons: coupons.rows[0]?.count ?? 0,
        stockValue: stock.rows[0]?.value ?? 0,
        stockUnits: stock.rows[0]?.units ?? 0,
        salesCount: sales.rows[0]?.count ?? 0,
        salesValue: sales.rows[0]?.value ?? 0,
        collected: sales.rows[0]?.collected ?? 0,
        ledgerBalance: ledger.rows[0]?.balance ?? 0,
        ledgerCollected: ledger.rows[0]?.collected ?? 0,
        ledgerBilled: ledger.rows[0]?.billed ?? 0,
      },
      lowStock: lowStock.rows,
      recentSales: recentSales.rows,
      salesByCategory: salesByCategory.rows,
      topProducts: topProducts.rows,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
