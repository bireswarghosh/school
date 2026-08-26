"use client"

import type { ReactNode } from "react"
import { Printer, Download } from "lucide-react"

export function ReportBanner({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
      <div className="relative z-10">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-white/80 mt-1">{subtitle}</p>
      </div>
    </div>
  )
}

export function FilterCard({ title = "Select Criteria", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="px-5 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

export const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"

export const selectCls = inputCls

export function TableCard({
  title,
  action,
  children,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {title && (
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function PrintButtons() {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800 text-white px-3 py-2 text-xs font-medium hover:opacity-90"
      >
        <Printer className="h-3.5 w-3.5" /> Print
      </button>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] text-white px-3 py-2 text-xs font-medium hover:opacity-90"
      >
        <Download className="h-3.5 w-3.5" /> Export
      </button>
    </div>
  )
}

export function Chip({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "green" | "amber" | "red" | "blue" | "purple" }) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
  }
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>
}

export function EmptyRow({ colSpan, message = "No records found" }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-8 text-gray-400">{message}</td>
    </tr>
  )
}

export function FooterCount({ shown, total }: { shown: number; total: number }) {
  return (
    <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
      Showing {shown} of {total} records
    </div>
  )
}
