"use client"

import PaymentMethodsPanel from "@/components/PaymentMethodsPanel"

export default function PaymentMethodsPage() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Payment Methods</h1>
        <p className="mt-1 text-sm text-white/80">System Setting / Payment Methods</p>
      </div>
      <PaymentMethodsPanel />
    </div>
  )
}