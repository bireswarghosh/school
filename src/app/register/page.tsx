"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { GraduationCap, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [address, setAddress] = useState("")
  const [tagline, setTagline] = useState("")
  const [adminName, setAdminName] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState<{ schoolCode: string; email: string; password: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, mobile, address, tagline, adminName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Registration failed")
        setLoading(false)
        return
      }
      setSuccess(data)
      setLoading(false)
    } catch {
      setError("Network error")
      setLoading(false)
    }
  }

  const inputCls =
    "w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)] relative overflow-hidden">
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[var(--primary)] opacity-10 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="glass-panel rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-[var(--primary)] flex items-center justify-center text-white mb-4">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--title-color)]">Create your school</h1>
            <p className="text-sm text-[var(--subtitle-color)] mt-1">Start managing your school activities seamlessly</p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3.5 rounded-xl">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">School registered successfully!</p>
                  <p className="mt-1 text-xs">
                    School code: <span className="font-mono font-bold">{success.schoolCode}</span>
                    <br />
                    Admin login: <span className="font-mono">{success.email}</span>
                    <br />
                    Password: <span className="font-mono">{success.password}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/admin")}
                className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">School name *</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunrise International School" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Admin name</label>
                <input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Principal" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Email *</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@school.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Mobile *</label>
                  <input required value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Tagline</label>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Nurturing bright futures" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Address</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="School address" className={inputCls} />
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
                Create school
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-[var(--border)] text-center text-sm">
            <span className="text-[var(--subtitle-color)]">Already registered? </span>
            <Link href="/login" className="text-[var(--primary)] hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}