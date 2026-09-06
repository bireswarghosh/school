"use client"

import { useRef, useState } from "react"
import { Upload, Trash2, Loader2, ImageIcon } from "lucide-react"

type Props = {
  label: string
  value: string
  onChange: (url: string) => void
  height?: string
  hint?: string
}

export default function SettingsImageUpload({ label, value, onChange, height = "h-24", hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const upload = async (file: File) => {
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      setError("File exceeds 4 MB limit")
      return
    }
    setUploading(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("files", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      onChange(data.files?.[0]?.url || "")
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-1">{hint}</p>}
      <div className="flex items-center gap-3">
        <div
          className={`${height} w-40 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-6 w-6 text-gray-300" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary-light)] px-3 py-1.5 text-xs font-medium text-[var(--primary)] hover:opacity-80 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? "Uploading…" : "Upload"}
          </button>
          {value && (
            <button
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:underline"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}