"use client"

import CurrencyPanel from "@/components/CurrencyPanel"

export default function CurrencyPage() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Currency</h1>
        <p className="mt-1 text-sm text-white/80">System Setting / Currency</p>
      </div>
      <CurrencyPanel />
    </div>
  )
}