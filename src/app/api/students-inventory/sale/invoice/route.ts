import { NextRequest } from "next/server"
import { query } from "@/lib/db"

const esc = (v: string | number | null | undefined) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const saleNo = searchParams.get("no")
  if (!saleNo) return new Response("sale no required (use ?no=SL-...)", { status: 400 })

  const result = await query(
    `SELECT s.sale_no, s.student_id, s.student_name, s.product_id, s.book_id,
            s.quantity, s.unit_price, s.subtotal, s.discount_amount, s.total_amount,
            s.sale_date, s.payment_status, s.school_id,
            COALESCE(p.name, '') AS product_name, COALESCE(b.title, '') AS book_name
     FROM si_sales s
     LEFT JOIN si_products p ON p.id = s.product_id
     LEFT JOIN si_books b ON b.id = s.book_id
     WHERE s.sale_no = $1
     ORDER BY s.id ASC`,
    [saleNo]
  )

  const rows = result.rows
  if (rows.length === 0) return new Response("Invoice not found", { status: 404 })

  const schoolResult = await query(`SELECT name, tagline, address, phone, email FROM schools WHERE id = $1`, [rows[0].school_id])
  const school = schoolResult.rows[0] || {}

  const fmt = (n: string | number | null | undefined) =>
    "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const sub = rows.reduce((s, r) => s + (Number(r.subtotal) || 0), 0)
  const disc = rows.reduce((s, r) => s + (Number(r.discount_amount) || 0), 0)
  const total = rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0)
  const first = rows[0]
  const status = first.payment_status || "Unpaid"

  const items = rows
    .map(
      (r, i) =>
        `<tr>
          <td class="c">${i + 1}</td>
          <td>${esc(r.book_name || r.product_name || "-")}${r.book_name ? '<span class="sub">Book</span>' : '<span class="sub">Product</span>'}</td>
          <td class="c">${Number(r.quantity) || 0}</td>
          <td class="r">${fmt(r.unit_price)}</td>
          <td class="r">${Number(r.discount_amount) ? fmt(r.discount_amount) : "-"}</td>
          <td class="r">${fmt(r.total_amount)}</td>
        </tr>`
    )
    .join("")

  const statusClass = status === "Paid" ? "paid" : "unpaid"

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Invoice ${esc(first.sale_no)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Arial, Helvetica, "Segoe UI", sans-serif; color: #1f2937; font-size: 13px; line-height: 1.5; background: #f3f4f6; padding: 24px; }
  .toolbar { max-width: 780px; margin: 0 auto 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
  .toolbar .btn { padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; }
  .toolbar .btn-primary { background: #ff7732; color: #fff; }
  .toolbar .btn-primary:hover { background: #e8661f; }
  .toolbar .hint { font-size: 12px; color: #6b7280; }
  .sheet { max-width: 780px; margin: 0 auto; background: #fff; padding: 40px 44px; border: 1px solid #e5e7eb; border-radius: 10px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 3px solid #ff7732; padding-bottom: 18px; margin-bottom: 22px; }
  .head h1 { font-size: 24px; color: #111827; line-height: 1.2; }
  .head .tag { color: #ff7732; font-size: 12px; margin-top: 3px; }
  .head .contact { font-size: 12px; color: #4b5563; margin-top: 4px; }
  .head .meta { text-align: right; font-size: 12px; color: #4b5563; line-height: 1.7; white-space: nowrap; }
  .head .meta .inv-no { font-size: 16px; font-weight: 700; color: #111827; }
  .status { display: inline-block; margin-top: 6px; padding: 3px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; }
  .status.paid { color: #059669; border: 1px solid #059669; background: #ecfdf5; }
  .status.unpaid { color: #dc2626; border: 1px solid #dc2626; background: #fef2f2; }
  .info { margin-bottom: 18px; }
  .info .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 4px; }
  .info .name { font-weight: 600; font-size: 14px; }
  .info .sub { font-size: 12px; color: #4b5563; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  thead { display: table-header-group; }
  th { background: #ff7732; color: #fff; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 9px 12px; }
  td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  tbody tr { page-break-inside: avoid; break-inside: avoid; }
  td .sub { display: block; font-size: 10px; color: #6b7280; margin-top: 1px; }
  .c { text-align: center; }
  .r { text-align: right; }
  .totals { width: 300px; margin-left: auto; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
  .totals .row.grand { border-top: 2px solid #ff7732; font-weight: 700; font-size: 16px; padding-top: 10px; color: #111827; }
  .foot { margin-top: 28px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 14px; }
  @page { size: A4; margin: 16mm; }
  @media print {
    body { background: #fff; padding: 0; }
    .toolbar { display: none; }
    .sheet { border: 0; border-radius: 0; padding: 0; max-width: none; }
    .status.paid { background: #ecfdf5; }
    .status.unpaid { background: #fef2f2; }
    th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button type="button" class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button>
    <span class="hint">Invoice ${esc(first.sale_no)}</span>
  </div>
  <div class="sheet">
    <div class="head">
      <div>
        <h1>${esc(school.name || "Smart School")}</h1>
        ${school.tagline ? `<div class="tag">${esc(school.tagline)}</div>` : ""}
        ${school.address ? `<div class="contact">${esc(school.address)}</div>` : ""}
        ${school.phone || school.email ? `<div class="contact">${[school.phone, school.email].filter(Boolean).map(esc).join(" | ")}</div>` : ""}
      </div>
      <div class="meta">
        <div class="inv-no">Invoice ${esc(first.sale_no)}</div>
        <div>Date: ${String(first.sale_date || "").slice(0, 10)}</div>
        <div><span class="status ${statusClass}">${esc(status)}</span></div>
      </div>
    </div>

    <div class="info">
      <div>
        <div class="lbl">Billed To</div>
        <div class="name">${esc(first.student_name || "-")}</div>
        ${first.student_id ? `<div class="sub">Student ID: ${esc(first.student_id)}</div>` : ""}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="c">#</th>
          <th>Item</th>
          <th class="c">Qty</th>
          <th class="r">Unit Price</th>
          <th class="r">Discount</th>
          <th class="r">Amount</th>
        </tr>
      </thead>
      <tbody>${items}</tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${fmt(sub)}</span></div>
      ${disc ? `<div class="row"><span>Discount</span><span>${fmt(disc)}</span></div>` : ""}
      <div class="row grand"><span>Grand Total</span><span>${fmt(total)}</span></div>
    </div>

    <div class="foot">Thank you for your purchase. This is a computer-generated invoice.</div>
  </div>
</body>
</html>`

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } })
}