import type { SchoolInfo } from "@/lib/use-school-info"

// Shared building blocks for printable documents (results, marksheets) that
// must carry the configured school logo + General Settings identity.
export const escHtml = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

export const docCss = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Arial, Helvetica, "Segoe UI", sans-serif; color: #1f2937; font-size: 13px; line-height: 1.5; background: #fff; padding: 20px; }
  .sheet { max-width: 780px; margin: 0 auto; }
  .doc-head { display: flex; justify-content: space-between; align-items: center; gap: 20px; border-bottom: 3px solid #ff7732; padding-bottom: 16px; margin-bottom: 20px; }
  .doc-brand { display: flex; align-items: center; gap: 14px; }
  .doc-brand img { width: 62px; height: 62px; object-fit: contain; }
  .doc-brand h1 { font-size: 22px; color: #111827; line-height: 1.2; }
  .doc-brand .tag { color: #ff7732; font-size: 12px; margin-top: 2px; }
  .doc-brand .contact { font-size: 11px; color: #4b5563; margin-top: 4px; }
  .doc-title { text-align: center; font-size: 17px; font-weight: 700; color: #ff7732; letter-spacing: 0.5px; white-space: nowrap; }
  .doc-sub { text-align: center; font-size: 13px; font-weight: 600; color: #111827; }
  .info { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; }
  .info .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 3px; }
  .info .name { font-weight: 600; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  th { background: #ff7732; color: #fff; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 9px 12px; }
  td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  tbody tr { page-break-inside: avoid; break-inside: avoid; }
  td .sub { display: block; font-size: 10px; color: #6b7280; margin-top: 1px; }
  .c { text-align: center; }
  .r { text-align: right; }
  .strong { font-weight: 700; }
  .totals { width: 300px; margin-left: auto; }
  .totals .row { display: flex; justify-content: space-between; padding: 5px 0; }
  .totals .row.grand { border-top: 2px solid #ff7732; font-weight: 700; padding-top: 8px; color: #111827; }
  .student-block { margin-bottom: 26px; page-break-inside: avoid; break-inside: avoid; }
  .foot { margin-top: 24px; text-align: center; color: #6b7280; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  @page { size: A4; margin: 14mm; }
  @media print { body { padding: 0; } }
`

export const docHeaderHtml = (info: SchoolInfo, title: string, session?: string): string => {
  const contact = [info.address, [info.phone, info.email].filter(Boolean).join(" | ")]
    .filter((x) => x.trim())
    .join("<br />")
  return `
  <div class="doc-head">
    <div class="doc-brand">
      ${info.logoSrc ? `<img src="${escHtml(info.logoSrc)}" alt="logo" />` : ""}
      <div>
        <h1>${escHtml(info.name)}</h1>
        ${session ? `<div class="tag">Session: ${escHtml(session)}</div>` : ""}
        ${contact ? `<div class="contact">${contact}</div>` : ""}
      </div>
    </div>
    <div class="doc-title">${escHtml(title)}</div>
  </div>`
}

export const docFoot = (text: string) => `<div class="foot">${escHtml(text)}</div>`