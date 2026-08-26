"use client"

import FileTypesPanel from "@/components/FileTypesPanel"

export default function FileTypesPage() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">File Types</h1>
        <p className="mt-1 text-sm text-white/80">System Setting / File Types</p>
      </div>
      <FileTypesPanel />
    </div>
  )
}