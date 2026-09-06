"use client"

import { useRef, useEffect } from "react"
import { X, Printer } from "lucide-react"

// Reusable A4-ish document preview + print/save-PDF dialog. Used by printed
// documents (results, marksheets, receipts) that must carry the school header.
export default function PrintDocModal({
  open,
  title,
  subtitle,
  html,
  onClose,
}: {
  open: boolean
  title: string
  subtitle?: string
  html: string
  onClose: () => void
}) {
  const ref = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (open && ref.current) ref.current.srcdoc = html
  }, [open, html])

  if (!open) return null

  const print = () => {
    const f = ref.current
    if (!f) return
    f.onload = () => {
      f.contentWindow?.focus()
      f.contentWindow?.print()
    }
    f.srcdoc = html
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl z-10 flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            {subtitle ? <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p> : null}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-gray-100">
          <iframe
            ref={ref}
            title={title}
            className="w-full h-full min-h-[560px] bg-white"
            srcDoc={html}
          />
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={print}
            className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  )
}