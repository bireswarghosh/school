"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { GraduationCap, ShieldCheck, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [schoolCode, setSchoolCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, schoolCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Login failed")
        setLoading(false)
        return
      }
      router.push(data.redirect || "/admin")
      router.refresh()
    } catch {
      setError("Network error")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)] relative overflow-hidden">
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[var(--primary)] opacity-10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[var(--secondary)] opacity-10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="glass-panel rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-[var(--primary)] flex items-center justify-center text-white mb-4">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--title-color)]">Smart School</h1>
            <p className="text-sm text-[var(--subtitle-color)] mt-1">Sign in to your academic portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.com"
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                School code{" "}
                <span className="text-xs font-normal text-[var(--subtitle-color)]">(for school staff only)</span>
              </label>
              <input
                type="text"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                placeholder="e.g. DEFAULT"
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] uppercase"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 px-3 py-2.5 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border)] flex items-center justify-between text-sm">
            <Link href="/register" className="text-[var(--primary)] hover:underline font-medium">
              Create a school
            </Link>
            <Link href="/saas/login" className="flex items-center gap-1.5 text-[var(--subtitle-color)] hover:text-[var(--primary)]">
              <ShieldCheck className="h-4 w-4" />
              Super admin
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--subtitle-color)] mt-6">
          Smart School · Multi-tenant School Management System
        </p>
      </div>
    </div>
  )
}