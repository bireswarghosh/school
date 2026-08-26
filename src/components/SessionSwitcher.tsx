"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarClock, Pencil, X, Save, Loader2, Plus } from "lucide-react"
import { useSession, type SessionInfo } from "@/lib/session-context"

export function SessionPill({ collapsed = false }: { collapsed?: boolean }) {
  const { current } = useSession()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={current ? `Current Session: ${current.name}` : "Set Current Session"}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors"
        style={{
          backgroundColor: "color-mix(in srgb, var(--sidebar-bg), white 10%)",
          color: "var(--sidebar-text)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--sidebar-bg), white 16%)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--sidebar-bg), white 10%)"
        }}
      >
        <CalendarClock className="h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate text-sm font-medium">
              {current ? current.name : "Set Session"}
            </span>
            <Pencil className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </>
        )}
      </button>
      <SessionModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export function SessionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { sessions, current, switchSession } = useSession()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState("")

  if (!open) return null

  const selected = sessions.find((s) => s.id === selectedId) ?? current
  const selectValue = selected ? String(selected.id) : ""

  const handleSave = async () => {
    if (selectedId === null || selectedId === current?.id) {
      setDone("Session is already set to " + selected?.name)
      setTimeout(() => setDone(""), 3000)
      onClose()
      return
    }
    setSaving(true)
    setError("")
    try {
      await switchSession(selectedId)
      setDone("Session changed to " + sessions.find((s) => s.id === selectedId)?.name)
      setTimeout(() => setDone(""), 3000)
      onClose()
    } catch (e: any) {
      setError(e.message || "Failed to switch session")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Current Session</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Select the academic session that all data is filtered by.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
            <select
              value={selectValue}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            >
              {sessions.map((s: SessionInfo) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.id === current?.id ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          {current && (
            <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-xs text-orange-700">
              Currently active: <strong>{current.name}</strong> (
              {current.startDate} to {current.endDate})
            </div>
          )}

          <Link
            href="/admin/system-setting/general-setting?tab=session"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--primary)] bg-[var(--primary-light)] px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors"
          >
            <Plus className="h-4 w-4" /> Add New Session
          </Link>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {done && <p className="text-sm text-green-600">{done}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <X className="h-4 w-4" /> Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !sessions.length}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
