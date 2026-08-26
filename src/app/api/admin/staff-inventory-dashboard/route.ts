import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    const scope = schoolId ? `WHERE school_id = $1` : ""
    const params = schoolId ? [schoolId] : []

    const [items, categories, stores, suppliers, stock, issues, lowStock, recentIssues, recentStocks] = await Promise.all([
      query(`SELECT COUNT(*)::int AS count FROM items ${scope}`, params),
      query(`SELECT COUNT(*)::int AS count FROM item_categories ${scope}`, params),
      query(`SELECT COUNT(*)::int AS count FROM item_stores ${scope}`, params),
      query(`SELECT COUNT(*)::int AS count FROM item_suppliers ${scope}`, params),
      query(
        `SELECT COALESCE(SUM(quantity * purchase_price), 0)::numeric AS value, COALESCE(SUM(quantity), 0)::int AS units FROM item_stocks ${scope}`,
        params
      ),
      query(
        `SELECT COALESCE(SUM(total_amount), 0)::numeric AS value, COUNT(*)::int AS count FROM item_issues ${scope}`,
        params
      ),
      query(
        `SELECT i.id, i.name, i.min_stock, COALESCE(SUM(s.quantity), 0)::int AS total_stock
         FROM items i LEFT JOIN item_stocks s ON s.item_id = i.id
         ${schoolId ? "WHERE i.school_id = $1" : ""}
         GROUP BY i.id, i.name, i.min_stock
         HAVING COALESCE(SUM(s.quantity), 0) < i.min_stock
         ORDER BY (COALESCE(SUM(s.quantity), 0) - i.min_stock) ASC
         LIMIT 8`,
        params
      ),
      query(
        `SELECT isu.id, isu.member_name, isu.member_type, isu.issue_date, isu.quantity, isu.total_amount, isu.bill_no, isu.payment_status, i.name AS item_name
         FROM item_issues isu LEFT JOIN items i ON i.id = isu.item_id
         ${schoolId ? "WHERE isu.school_id = $1" : ""}
         ORDER BY isu.issue_date DESC, isu.id DESC
         LIMIT 8`,
        params
      ),
      query(
        `SELECT st.id, st.quantity, st.purchase_price, st.date, st.store_id, i.name AS item_name, s.name AS supplier_name
         FROM item_stocks st LEFT JOIN items i ON i.id = st.item_id LEFT JOIN item_suppliers s ON s.id = st.supplier_id
         ${schoolId ? "WHERE st.school_id = $1" : ""}
         ORDER BY st.date DESC, st.id DESC
         LIMIT 8`,
        params
      ),
    ])

    const itemsByCategory = await query(
      `SELECT c.name, COUNT(i.id)::int AS item_count
       FROM item_categories c LEFT JOIN items i ON i.category_id = c.id
       ${schoolId ? "WHERE c.school_id = $1" : ""}
       GROUP BY c.id, c.name
       ORDER BY c.name ASC`,
      params
    )

    return NextResponse.json({
      totals: {
        items: items.rows[0]?.count ?? 0,
        categories: categories.rows[0]?.count ?? 0,
        stores: stores.rows[0]?.count ?? 0,
        suppliers: suppliers.rows[0]?.count ?? 0,
        stockValue: stock.rows[0]?.value ?? 0,
        stockUnits: stock.rows[0]?.units ?? 0,
        issuesValue: issues.rows[0]?.value ?? 0,
        issuesCount: issues.rows[0]?.count ?? 0,
      },
      lowStock: lowStock.rows,
      recentIssues: recentIssues.rows,
      recentStocks: recentStocks.rows,
      itemsByCategory: itemsByCategory.rows,
      ...(schoolId ? {} : {}),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
