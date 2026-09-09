export type FeeReceiptSchool = {
  name: string
  address: string
  phone: string
  email: string
  session: string
  logoSrc: string
}

export type FeeReceiptLine = {
  sno: number
  group: string
  feeType: string
  amount: number
  discount: number
  fine: number
  paid: number
}

export type FeeReceiptData = {
  receiptNo: string
  date: string
  method: string
  methodDetail: string
  note: string
  studentName: string
  studentClass: string
  section: string
  admissionNo: string
  rollNo: string
  lines: FeeReceiptLine[]
  total: number
  school: FeeReceiptSchool
}

export const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

export const buildReceiptHtml = (r: FeeReceiptData): string => {
  const m = (v: number) => `\u20B9${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const rows = r.lines
    .map(
      (l) => `<tr>
        <td class="c">${l.sno}</td>
        <td>${esc(l.feeType)}<span class="sub">${esc(l.group)}</span></td>
        <td class="r">${m(l.amount)}</td>
        <td class="r">${l.discount > 0 ? m(l.discount) : "-"}</td>
        <td class="r">${l.fine > 0 ? m(l.fine) : "-"}</td>
        <td class="r strong">${m(l.paid)}</td>
      </tr>`
    )
    .join("")
  const contact = [r.school.address, [r.school.phone, r.school.email].filter(Boolean).join(" | ")]
    .filter((x) => x.trim())
    .join("<br />")
  const klass = `${r.studentClass || ""}${r.section ? " - " + r.section : ""}`

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Payment Receipt ${esc(r.receiptNo)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Arial, Helvetica, "Segoe UI", sans-serif; color: #1f2937; font-size: 13px; line-height: 1.5; background: #fff; padding: 20px; }
  .sheet { max-width: 720px; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: center; gap: 20px; border-bottom: 3px solid #ff7732; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand img { width: 64px; height: 64px; object-fit: contain; }
  .brand h1 { font-size: 22px; color: #111827; line-height: 1.2; }
  .brand .tag { color: #ff7732; font-size: 12px; margin-top: 2px; }
  .brand .contact { font-size: 11px; color: #4b5563; margin-top: 4px; }
  .meta { text-align: right; font-size: 12px; color: #4b5563; line-height: 1.9; white-space: nowrap; }
  .meta .doc { font-size: 17px; font-weight: 700; color: #ff7732; letter-spacing: 0.5px; }
  .meta .no { font-weight: 700; color: #111827; }
  .info { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 18px; font-size: 12px; }
  .info .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 3px; }
  .info .name { font-weight: 600; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  th { background: #ff7732; color: #fff; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 9px 12px; }
  td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  td .sub { display: block; font-size: 10px; color: #6b7280; margin-top: 1px; }
  .c { text-align: center; }
  .r { text-align: right; }
  .strong { font-weight: 700; }
  .totals { width: 320px; margin-left: auto; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
  .totals .row.grand { border-top: 2px solid #ff7732; font-weight: 700; font-size: 15px; padding-top: 10px; color: #111827; }
  .foot { margin-top: 26px; text-align: center; color: #6b7280; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  @page { size: A4; margin: 14mm; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="brand">
        ${r.school.logoSrc ? `<img src="${esc(r.school.logoSrc)}" alt="logo" />` : ""}
        <div>
          <h1>${esc(r.school.name)}</h1>
          ${r.school.session ? `<div class="tag">Session: ${esc(r.school.session)}</div>` : ""}
          ${contact ? `<div class="contact">${contact}</div>` : ""}
        </div>
      </div>
      <div class="meta">
        <div class="doc">PAYMENT RECEIPT</div>
        <div>Receipt No: <span class="no">${esc(r.receiptNo)}</span></div>
        <div>Date: ${esc(r.date)}</div>
        <div>Method: ${esc(r.method)}${r.methodDetail ? ` (${esc(r.methodDetail)})` : ""}</div>
      </div>
    </div>

    <div class="info">
      <div>
        <div class="lbl">Received From</div>
        <div class="name">${esc(r.studentName)}</div>
        <div class="lbl" style="margin-top:6px">Class</div>
        <div>${esc(klass)}</div>
      </div>
      <div>
        <div class="lbl">Admission No</div>
        <div class="name">${esc(r.admissionNo)}</div>
        <div class="lbl" style="margin-top:6px">Roll No</div>
        <div>${esc(r.rollNo)}</div>
      </div>
      <div>
        <div class="lbl">Payment Details</div>
        <div>${esc(r.method)}</div>
        ${r.note ? `<div style="margin-top:3px;color:#4b5563">Note: ${esc(r.note)}</div>` : ""}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="c">#</th>
          <th>Fee Type</th>
          <th class="r">Amount</th>
          <th class="r">Discount</th>
          <th class="r">Fine</th>
          <th class="r">Paid</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div class="row grand"><span>Total Collected</span><span>${m(r.total)}</span></div>
    </div>

    <div class="foot">Thank you — This is a computer-generated receipt and does not require a signature.</div>
  </div>
</body>
</html>`
}