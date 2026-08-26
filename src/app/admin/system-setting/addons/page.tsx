"use client"

import { useState } from "react"
import { Upload, Check, X, Download, Trash2, Play, Square } from "lucide-react"
import { useApi } from "@/lib/use-api"

type AddonStatus = "installed" | "not_installed" | "active"

type Addon = {
  id: number
  name: string
  version: string
  author: string
  status: AddonStatus
}

export default function AddonsPage() {
  const { data: addons, add, update, loading } = useApi<Addon>("/api/system-setting/addon")
  const [fileName, setFileName] = useState("")
  const [success, setSuccess] = useState("")

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3000)
  }

  const handleUpload = async () => {
    if (!fileName.trim()) return
    await add({ name: fileName.trim().replace(".zip", ""), version: "1.0.0", author: "Uploaded", status: "installed" })
    setFileName("")
    showSuccess("Addon uploaded successfully!")
  }

  const handleInstall = async (id: number) => {
    await update(id, { status: "installed" })
    showSuccess("Addon installed successfully!")
  }

  const handleActivate = async (id: number) => {
    await update(id, { status: "active" })
    showSuccess("Addon activated successfully!")
  }

  const handleDeactivate = async (id: number) => {
    await update(id, { status: "installed" })
    showSuccess("Addon deactivated successfully!")
  }

  const handleUninstall = async (id: number) => {
    await update(id, { status: "not_installed" })
    showSuccess("Addon uninstalled successfully!")
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Addons</h1>
        <p className="mt-1 text-sm text-white/80">System Setting / Addons</p>
      </div>

      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Upload Addon</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="File name (e.g. addon.zip)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <button
            onClick={handleUpload}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2"
          >
            <Upload className="h-4 w-4" /> Upload
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["#", "Addon Name", "Version", "Author", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {addons.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No addons found</td></tr>
              ) : (
                addons.map((addon, idx) => (
                  <tr key={addon.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{addon.name}</td>
                    <td className="px-4 py-3 text-gray-600">v{addon.version}</td>
                    <td className="px-4 py-3 text-gray-600">{addon.author}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        addon.status === "active" ? "bg-green-100 text-green-700" :
                        addon.status === "installed" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {addon.status === "active" ? <Play className="h-3 w-3" /> :
                         addon.status === "installed" ? <Check className="h-3 w-3" /> :
                         <X className="h-3 w-3" />}
                        {addon.status === "active" ? "Active" :
                         addon.status === "installed" ? "Installed" :
                         "Not Installed"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {addon.status === "not_installed" && (
                          <button onClick={() => handleInstall(addon.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1" title="Install">
                            <Download className="h-4 w-4" /> Install
                          </button>
                        )}
                        {addon.status === "installed" && (
                          <button onClick={() => handleActivate(addon.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1" title="Activate">
                            <Play className="h-4 w-4" /> Activate
                          </button>
                        )}
                        {addon.status === "active" && (
                          <button onClick={() => handleDeactivate(addon.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1" title="Deactivate">
                            <Square className="h-4 w-4" /> Deactivate
                          </button>
                        )}
                        {addon.status !== "not_installed" && (
                          <button onClick={() => handleUninstall(addon.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1" title="Uninstall">
                            <Trash2 className="h-4 w-4" /> Uninstall
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          Showing {addons.length} records
        </div>
      </div>
    </div>
  )
}
