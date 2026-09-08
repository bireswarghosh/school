"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, Eye, EyeOff, AlertCircle, Loader2, Smartphone } from "lucide-react"

export default function SaasLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [challengeToken, setChallengeToken] = useState("")
  const [otp, setOtp] = useState("")
  const [useBackup, setUseBackup] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Login failed")
        setLoading(false)
        return
      }
      if (data.requiresTwoFactor) {
        setChallengeToken(data.challengeToken || "")
        setOtp("")
        setUseBackup(false)
        setLoading(false)
        return
      }
      if (data.user?.role !== "super_admin") {
        setError("This portal is for super admins only")
        setLoading(false)
        return
      }
      router.push("/saas")
      router.refresh()
    } catch {
      setError("Network error")
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: useBackup
          ? JSON.stringify({ challengeToken, backupCode: otp })
          : JSON.stringify({ challengeToken, code: otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Verification failed")
        setLoading(false)
        return
      }
      if (data.user?.role !== "super_admin") {
        setError("This portal is for super admins only")
        setLoading(false)
        return
      }
      router.push("/saas")
      router.refresh()
    } catch {
      setError("Network error")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)] relative overflow-hidden">
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[var(--secondary)] opacity-10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[var(--primary)] opacity-10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="glass-panel rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-[var(--secondary)] flex items-center justify-center text-white mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--title-color)]">Super Admin Portal</h1>
            <p className="text-sm text-[var(--subtitle-color)] mt-1">Manage all schools from one dashboard</p>
          </div>

          {challengeToken ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-[var(--primary-light)] px-4 py-3">
                <Smartphone className="h-5 w-5 text-[var(--primary)] shrink-0" />
                <p className="text-sm text-[var(--foreground)]">
                  Two-factor authentication is enabled. Enter the 6-digit code from your authenticator app.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  {useBackup ? "Backup code" : "Authenticator code"}
                </label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder={useBackup ? "XXXXXX-XXXXXX" : "123456"}
                  inputMode={useBackup ? "text" : "numeric"}
                  autoComplete="one-time-code"
                  autoFocus
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] tracking-widest text-center text-lg font-mono"
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
                className="w-full py-3 rounded-xl bg-[var(--secondary)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify & sign in
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setUseBackup(!useBackup); setOtp(""); setError("") }}
                  className="text-[var(--primary)] hover:underline font-medium"
                >
                  {useBackup ? "Use authenticator code instead" : "Lost access? Use a backup code"}
                </button>
                <button
                  type="button"
                  onClick={() => { setChallengeToken(""); setOtp(""); setError("") }}
                  className="text-[var(--subtitle-color)] hover:text-[var(--primary)]"
                >
                  ← Back
                </button>
              </div>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@smart-school.in"
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

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 px-3 py-2.5 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[var(--secondary)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in to SaaS
            </button>
          </form>
          )}

          <div className="mt-6 pt-6 border-t border-[var(--border)] text-center text-sm">
            <Link href="/login" className="text-[var(--subtitle-color)] hover:text-[var(--primary)]">
              ← Back to school login
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--subtitle-color)] mt-6">
          Demo: superadmin@smart-school.in / Super@123
        </p>
      </div>
    </div>
  )
}