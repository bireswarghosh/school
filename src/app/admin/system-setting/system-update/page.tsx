"use client"

import { useState } from "react"
import { RefreshCw, Check, X, Clock } from "lucide-react"
import { useApi } from "@/lib/use-api"

type UpdateRecord = {
  id: number
  version: string
  updateDate: string
  description: string
  status: "Success" | "Failed"
}

export default function SystemUpdatePage() {
  const { data: updates, loading } = useApi<UpdateRecord>("/api/system-setting/system-update")
  const [checking, setChecking] = useState(false)
  const [success, setSuccess] = useState("")

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3000)
  }

  const handleCheckUpdates = () => {
    setChecking(true)
    setTimeout(() => {
      setChecking(false)
      showSuccess("No new updates available. You are on the latest version (5.1.0).")
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">System Update</h1>
        <p className="mt-1 text-sm text-white/80">System Setting / System Update</p>
      </div>

      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Current Version</h3>
            <div className="mt-2 space-y-1">
              <p className="text-3xl font-bold text-[var(--primary)]">5.1.0</p>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Build Date: 2026-06-01
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" /> Last Updated: 2026-06-15
              </p>
            </div>
          </div>
          <button
            onClick={handleCheckUpdates}
            disabled={checking}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking..." : "Check for Updates"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Clock className="h-4 w-4 text-[var(--primary)]" /> Update Log
          </h3>
          <span className="text-xs font-medium text-gray-500">{updates.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["#", "Version", "Update Date", "Description", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {updates.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No update records found</td></tr>
              ) : (
                updates.map((u, idx) => (
                  <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-medium text-gray-800">v{u.version}</td>
                    <td className="px-4 py-3 text-gray-600">{u.updateDate}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-md">{u.description}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.status === "Success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {u.status === "Success" ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          Showing {updates.length} records
        </div>
      </div>
    </div>
  )
}
