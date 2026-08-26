"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Plus, Download, Upload, Trash2, RotateCcw, Check, Loader2, AlertTriangle } from "lucide-react"

const MAX_BACKUPS = 5

type BackupFile = {
  id: number
  fileName: string
  sizeKb: number
  sizeBytes: number
  date: string
}

function formatSize(bytes: number) {
  if (!bytes) return "0 B"
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

function formatDate(value: string) {
  if (!value) return ""
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString()
}

export default function BackupRestorePanel() {
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3500)
  }

  const fetchBackups = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/system-setting/backup")
      if (!res.ok) throw new Error("Failed to load backups")
      setBackups(await res.json())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBackups()
  }, [fetchBackups])

  const handleCreateBackup = async () => {
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/system-setting/backup", { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create backup")
      }
      await fetchBackups()
      showSuccess("Backup created successfully!")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleDownload = (b: BackupFile) => {
    window.location.href = `/api/system-setting/backup?id=${b.id}&download=1`
  }

  const handleRestore = async (b: BackupFile) => {
    if (!window.confirm(`Restore data from "${b.fileName}"?\n\nThis will replace ALL current school data with the backup. This cannot be undone.`)) return
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/system-setting/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Restore failed")
      }
      showSuccess("Data restored successfully!")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (b: BackupFile) => {
    if (!window.confirm(`Delete backup "${b.fileName}"?`)) return
    setBusy(true)
    setError("")
    try {
      const res = await fetch(`/api/system-setting/backup?id=${b.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete backup")
      }
      await fetchBackups()
      showSuccess("Backup deleted!")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleUpload = async (file: File) => {
    setError("")
    let blob: any
    try {
      blob = JSON.parse(await file.text())
    } catch {
      setError("Invalid backup file. Please upload a .json backup created from this page.")
      return
    }
    if (!blob?.data || typeof blob.data !== "object") {
      setError("Invalid backup file. Please upload a .json backup created from this page.")
      return
    }
    if (!window.confirm(`Restore data from "${file.name}"?\n\nThis will replace ALL current school data with the backup. This cannot be undone.`)) return
    setBusy(true)
    try {
      const res = await fetch("/api/system-setting/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: blob }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Restore failed")
      }
      showSuccess("Data restored successfully!")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {backups.length}/{MAX_BACKUPS} backups used — backups are stored per school only.
        </p>
        <button
          onClick={handleCreateBackup}
          disabled={busy || backups.length >= MAX_BACKUPS}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Backup
        </button>
      </div>

      {backups.length >= MAX_BACKUPS && (
        <p className="text-xs text-amber-600">Maximum {MAX_BACKUPS} backups reached. Delete an old backup to create a new one.</p>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800">Backup Files</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["#", "File Name", "Size", "Date", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading backups...</td></tr>
              ) : backups.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No backup files found</td></tr>
              ) : (
                backups.map((b, idx) => (
                  <tr key={b.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{b.fileName}</td>
                    <td className="px-4 py-3 text-gray-600">{formatSize(b.sizeBytes || b.sizeKb * 1024)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(b.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDownload(b)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download">
                          <Download className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleRestore(b)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Restore">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(b)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-1">Upload Backup</h3>
        <p className="text-sm text-gray-500 mb-4">Restore from a .json backup file downloaded earlier.</p>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Backup File</label>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2"
          >
            <Upload className="h-4 w-4" /> Restore from File
          </button>
        </div>
      </div>
    </>
  )
}
