"use client"

import { useState, type ReactNode } from "react"
import { Check, AlertCircle, Loader2, Save } from "lucide-react"
import { useSchoolSettings } from "@/lib/use-school-settings"

export function SuccessToast({ show, message }: { show: boolean; message: string }) {
  if (!show) return null
  return (
    <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
      <Check className="h-4 w-4" /> {message}
    </div>
  )
}

export function ErrorAlert({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
      <AlertCircle className="h-4 w-4 shrink-0" /> {message}
    </div>
  )
}

export function SettingsSection({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

export function SettingsSaveBar({
  onSave,
  saving,
  label = "Save",
}: {
  onSave: () => void
  saving?: boolean
  label?: string
}) {
  return (
    <div className="flex justify-end pt-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {label}
      </button>
    </div>
  )
}

export function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
      />
      <span>
        <span className="block text-sm font-medium text-gray-700">{label}</span>
        {desc && <span className="block text-xs text-gray-500 mt-0.5">{desc}</span>}
      </span>
    </label>
  )
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
      />
    </div>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export function useSettingsForm(prefix: string) {
  const { settings, loading, saving, error, saveScoped, reload } = useSchoolSettings(prefix)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const form = { ...settings, ...draft }

  const set = (key: string, value: string) => setDraft((prev) => ({ ...prev, [key]: value }))
  const setBool = (key: string, value: boolean) => set(key, value ? "1" : "0")

  const commit = async () => {
    const ok = await saveScoped({ ...draft })
    if (ok) {
      await reload()
      setDraft({})
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    return ok
  }

  return { form, set, setBool, commit, loading, saving, error, success, settings, draft, saveScoped }
}

export function PanelStatus({
  loading,
  error,
  success,
  successMessage,
}: {
  loading: boolean
  error: string | null
  success: boolean
  successMessage: string
}) {
  return (
    <>
      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading settings…
        </div>
      )}
      {!loading && <ErrorAlert message={error} />}
      <SuccessToast show={success} message={successMessage} />
    </>
  )
}