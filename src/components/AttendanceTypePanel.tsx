"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, Trash2, AlertCircle, Pencil, Check } from "lucide-react"
import { SettingsSection, SettingsSaveBar, PanelStatus } from "@/components/settings-bits"
import { useSchoolSettings } from "@/lib/use-school-settings"

type AT = { id: number; type: string }

type Combo = { classId: number; className: string; sectionId: number; sectionName: string }
type TimeRow = { start: string; end: string }

const comboKey = (c: { classId: number; sectionId: number }) => `${c.classId}_${c.sectionId}`

function parseSavedTimes(value: string | undefined): Record<string, TimeRow> {
  const map: Record<string, TimeRow> = {}
  if (!value) return map
  try {
    for (const it of JSON.parse(value)) {
      if (it && typeof it.classId === "number" && typeof it.sectionId === "number") {
        map[`${it.classId}_${it.sectionId}`] = { start: it.start || "09:00", end: it.end || "14:30" }
      }
    }
  } catch {
    // ignore malformed saved times
  }
  return map
}

export default function AttendanceTypePanel() {
  const { settings, loading, saving, error, saveScoped } = useSchoolSettings("attendance.")
  const [success, setSuccess] = useState(false)

  const [types, setTypes] = useState<AT[]>([])
  const [typesLoading, setTypesLoading] = useState(true)
  const [typesError, setTypesError] = useState("")
  const [newType, setNewType] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")
  const [savingType, setSavingType] = useState(false)

  const [combos, setCombos] = useState<Combo[]>([])
  const [mode, setMode] = useState("day")
  const [biometric, setBiometric] = useState(false)
  const [devices, setDevices] = useState("")
  const [limit, setLimit] = useState("87")
  const [copyToAll, setCopyToAll] = useState(false)
  const [times, setTimes] = useState<Record<string, TimeRow>>({})
  const [hydrated, setHydrated] = useState(false)

  const loadTypes = () => {
    setTypesLoading(true)
    fetch("/api/attendance/type")
      .then((r) => r.json())
      .then((data) => setTypes(Array.isArray(data) ? data : []))
      .catch((e) => setTypesError(e instanceof Error ? e.message : String(e)))
      .finally(() => setTypesLoading(false))
  }

  useEffect(loadTypes, [])

  useEffect(() => {
    let cancelled = false
    fetch("/api/classes")
      .then((r) => r.json())
      .then(async (classes) => {
        const rows: Combo[] = []
        for (const c of Array.isArray(classes) ? classes : []) {
          if (cancelled) return
          try {
            const secs = await fetch(`/api/sections?class_id=${c.id}`).then((r) => r.json())
            for (const s of Array.isArray(secs) ? secs : []) {
              rows.push({ classId: c.id, className: c.name, sectionId: s.id, sectionName: s.name })
            }
          } catch {
            // keep going if a section fetch fails
          }
        }
        if (!cancelled) setCombos(rows)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (hydrated || loading || combos.length === 0) return
    setHydrated(true)
    setMode(settings.mode === "period" ? "period" : "day")
    setBiometric(settings.biometricEnabled === "1")
    setDevices(settings.biometricDevices || "")
    setLimit(settings.lowAttendanceLimit || "87")
    const saved = parseSavedTimes(settings.attendanceTimes)
    const next: Record<string, TimeRow> = {}
    for (const c of combos) {
      const k = comboKey(c)
      next[k] = saved[k] || { start: "09:00", end: "14:30" }
    }
    setTimes(next)
  }, [hydrated, loading, combos, settings])

  const setRow = (k: string, field: "start" | "end", value: string) => {
    setTimes((prev) => {
      const next = { ...prev, [k]: { ...(prev[k] || { start: "09:00", end: "14:30" }), [field]: value } }
      if (copyToAll && combos.length > 0 && k === comboKey(combos[0])) {
        const first = next[k]
        for (const c of combos) next[comboKey(c)] = { ...first }
      }
      return next
    })
  }

  const handleCopyToAll = (checked: boolean) => {
    setCopyToAll(checked)
    if (checked && combos.length > 0) {
      const first = times[comboKey(combos[0])] || { start: "09:00", end: "14:30" }
      setTimes((prev) => {
        const next = { ...prev }
        for (const c of combos) next[comboKey(c)] = { ...first }
        return next
      })
    }
  }

  const handleSave = async () => {
    const payload: Record<string, string> = {
      mode,
      biometricEnabled: biometric ? "1" : "0",
      lowAttendanceLimit: (limit || "").trim() || "87",
      biometricDevices: devices.trim(),
      attendanceTimes: JSON.stringify(
        combos.map((c) => {
          const row = times[comboKey(c)] || { start: "09:00", end: "14:30" }
          return {
            classId: c.classId,
            className: c.className,
            sectionId: c.sectionId,
            sectionName: c.sectionName,
            start: row.start,
            end: row.end,
          }
        })
      ),
    }
    const ok = await saveScoped(payload)
    if (ok) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  const addType = async () => {
    if (!newType.trim()) return
    setSavingType(true)
    try {
      const res = await fetch("/api/attendance/type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType.trim() }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to add")
      setNewType("")
      loadTypes()
    } catch (e) {
      setTypesError(e instanceof Error ? e.message : String(e))
    } finally {
      setSavingType(false)
    }
  }

  const renameType = async (id: number) => {
    if (!editValue.trim()) return
    setSavingType(true)
    try {
      const res = await fetch("/api/attendance/type", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: editValue.trim() }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to update")
      setEditingId(null)
      setEditValue("")
      loadTypes()
    } catch (e) {
      setTypesError(e instanceof Error ? e.message : String(e))
    } finally {
      setSavingType(false)
    }
  }

  const deleteType = async (id: number) => {
    setSavingType(true)
    try {
      const res = await fetch(`/api/attendance/type?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to delete")
      loadTypes()
    } catch (e) {
      setTypesError(e instanceof Error ? e.message : String(e))
    } finally {
      setSavingType(false)
    }
  }

  const disabled = loading || combos.length === 0

  const selectable = (
    value: string,
    label: string,
    desc: string,
    active: boolean,
    onPick: () => void
  ) => (
    <label
      className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
        active ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <input type="radio" name="attendance-mode" value={value} checked={active} onChange={onPick} className="mt-0.5 text-[var(--primary)] focus:ring-[var(--primary)]" />
      <span>
        <span className="block text-sm font-semibold text-gray-800">{label}</span>
        <span className="block text-xs text-gray-500 mt-0.5">{desc}</span>
      </span>
    </label>
  )

  return (
    <>
      <PanelStatus loading={loading} error={error} success={success} successMessage="Attendance settings saved!" />
      {typesError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" /> {typesError}
        </div>
      )}

      <SettingsSection title="Attendance Type" subtitle="In Attendance Type, select any one attendance type — Day Wise or Period Wise">
        <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {selectable("day", "Day Wise", "Mark attendance once per day for a student.", mode === "day", () => setMode("day"))}
            {selectable("period", "Period Wise", "Mark attendance per subject period.", mode === "period", () => setMode("period"))}
          </div>
        </div>
        <SettingsSaveBar onSave={handleSave} saving={saving} />
      </SettingsSection>

      <SettingsSection title="Biometric Attendance" subtitle="Track attendance automatically through biometric device punches.">
        <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="biometric" checked={!biometric} onChange={() => setBiometric(false)} className="text-[var(--primary)] focus:ring-[var(--primary)]" />
              <span className="text-sm font-medium text-gray-700">Disabled</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="biometric" checked={biometric} onChange={() => setBiometric(true)} className="text-[var(--primary)] focus:ring-[var(--primary)]" />
              <span className="text-sm font-medium text-gray-700">Enabled</span>
            </label>
          </div>

          {biometric && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-700">Class Attendance Time (For Auto Attendance Submission)</h4>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyToAll}
                    onChange={(e) => handleCopyToAll(e.target.checked)}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  Copy first details for all
                </label>
              </div>

              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-1">Devices (Separate By Comma)</label>
                <input
                  type="text"
                  value={devices}
                  onChange={(e) => setDevices(e.target.value)}
                  placeholder="DEV-001, DEV-002"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
                <p className="text-xs text-gray-500 mt-1">Enter the Device ID used for biometric attendance, separated by comma.</p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">
                      <th className="px-4 py-2.5">Class</th>
                      <th className="px-4 py-2.5">Section</th>
                      <th className="px-4 py-2.5">Start Time</th>
                      <th className="px-4 py-2.5">End Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {combos.map((c) => {
                      const k = comboKey(c)
                      const row = times[k] || { start: "09:00", end: "14:30" }
                      return (
                        <tr key={k}>
                          <td className="px-4 py-2 text-gray-700">{c.className}</td>
                          <td className="px-4 py-2 text-gray-700">{c.sectionName}</td>
                          <td className="px-4 py-2">
                            <input
                              type="time"
                              value={row.start}
                              onChange={(e) => setRow(k, "start", e.target.value)}
                              className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="time"
                              value={row.end}
                              onChange={(e) => setRow(k, "end", e.target.value)}
                              className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                            />
                          </td>
                        </tr>
                      )
                    })}
                    {combos.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No classes available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <SettingsSaveBar onSave={handleSave} saving={saving} />
      </SettingsSection>

      <SettingsSection title="Low Attendance Limit" subtitle="If attendance falls below this percentage, it is treated as low attendance.">
        <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Low Attendance Limit (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={limit || ""}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="87"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
            <p className="text-xs text-gray-500 mt-1">
              In case the attendance percentage is below this limit, it will be marked as low attendance and the message is
              displayed on the student dashboard.
            </p>
          </div>
        </div>
        <SettingsSaveBar onSave={handleSave} saving={saving} />
      </SettingsSection>

      <SettingsSection title="Attendance Types List" subtitle="The statuses available when marking attendance — used across the whole system">
        {typesLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : (
          <div className="space-y-2">
            {types.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2">
                {editingId === t.id ? (
                  <>
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[var(--primary)]"
                    />
                    <button onClick={() => renameType(t.id)} disabled={savingType} className="text-[var(--primary)]">
                      <Check className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-700 capitalize">{t.type}</span>
                    <button
                      onClick={() => { setEditingId(t.id); setEditValue(t.type) }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button onClick={() => deleteType(t.id)} disabled={savingType} className="text-red-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <input
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="New attendance type (e.g. Leave, Half Day)"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)]"
              />
              <button
                onClick={addType}
                disabled={savingType}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5 disabled:opacity-60"
              >
                {savingType ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
              </button>
            </div>
          </div>
        )}
      </SettingsSection>
    </>
  )
}