"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react"

// Lightweight global toast system. Call `toast.success(msg)`,
// `toast.error(msg)` or `toast.info(msg)` from any client component.
// Mount <ToastProvider/> once (in the root layout) to render the stack.

type ToastType = "success" | "error" | "info"
type ToastItem = { id: number; type: ToastType; message: string }

let toasts: ToastItem[] = []
let listeners: ((items: ToastItem[]) => void)[] = []
let idCounter = 0

function emit() {
  listeners.forEach((l) => l([...toasts]))
}

function push(type: ToastType, message: string) {
  const id = ++idCounter
  toasts.push({ id, type, message })
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 4000)
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
  info: (message: string) => push("info", message),
}

const styleByType: Record<ToastType, { wrap: string; icon: React.ReactNode; bar: string }> = {
  success: {
    wrap: "bg-white border-l-4 border-green-500 shadow-lg",
    icon: <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />,
    bar: "bg-green-500",
  },
  error: {
    wrap: "bg-white border-l-4 border-red-500 shadow-lg",
    icon: <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />,
    bar: "bg-red-500",
  },
  info: {
    wrap: "bg-white border-l-4 border-blue-500 shadow-lg",
    icon: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
    bar: "bg-blue-500",
  },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    const listener = (updated: ToastItem[]) => setItems(updated)
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  return (
    <>
      {children}
      <div className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2.5 w-80 max-w-[calc(100vw-2rem)]">
        {items.map((t) => {
          const s = styleByType[t.type]
          return (
            <div
              key={t.id}
              className={`pointer-events-auto relative flex items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-xl ring-1 ring-black/5 animate-[toast-in_.2s_ease-out] ${s.wrap}`}
              role="status"
            >
              {s.icon}
              <span className="flex-1 text-gray-800 leading-snug">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}