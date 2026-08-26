"use client"

import SystemFieldsPanel from "@/components/SystemFieldsPanel"

export default function SystemFieldsPage() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">System Fields</h1>
        <p className="mt-1 text-sm text-white/80">System Setting / System Fields</p>
      </div>
      <SystemFieldsPanel />
    </div>
  )
}