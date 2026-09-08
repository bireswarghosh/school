"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import TwoFactorManager from "@/components/two-factor-manager"

export default function AccountSecurityPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--title-color)]">Account Security</h2>
          <p className="text-sm text-[var(--subtitle-color)] mt-1">
            Manage sign-in security for your own account
          </p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-sm text-[var(--subtitle-color)] hover:text-[var(--title-color)] px-3 py-1.5 border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>
      <TwoFactorManager />
    </div>
  )
}
