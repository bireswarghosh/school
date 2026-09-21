// Shared helpers for injecting school identity (from General Settings /
// Appearance -> school_settings) into printable documents.
import type { SchoolInfo } from "@/lib/use-school-info"

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

type PrintInfo = Pick<SchoolInfo, "name" | "address" | "phone" | "email" | "website" | "logoSrc">

// Centered school letterhead (logo + name + address + contact) for standalone
// print windows / downloaded HTML documents.
export function schoolPrintHeader(info: PrintInfo, subtitle = ""): string {
  const name = escapeHtml(info.name || "Smart School")
  const logo = info.logoSrc ? escapeHtml(info.logoSrc) : ""
  const addr = info.address ? escapeHtml(info.address) : ""
  const contact = [info.phone, info.email, info.website].filter(Boolean).map(escapeHtml).join(" &nbsp;•&nbsp; ")
  return `<div style="text-align:center;margin-bottom:10px;">
  ${logo ? `<img src="${logo}" alt="logo" style="max-height:64px;max-width:96px;object-fit:contain;margin:0 auto 6px;display:block;" />` : ""}
  <h1 style="margin:0;font-size:22px;">${name || "Smart School"}</h1>
  ${addr ? `<div style="font-size:12px;color:#444;margin-top:2px;">${addr}</div>` : ""}
  ${contact ? `<div style="font-size:11px;color:#666;margin-top:2px;">${contact}</div>` : ""}
  ${subtitle ? `<div style="font-size:12px;color:#666;margin-top:2px;font-weight:bold;">${escapeHtml(subtitle)}</div>` : ""}
</div>`
}