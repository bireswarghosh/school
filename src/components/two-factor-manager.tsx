"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, Loader2, Copy, Check, AlertCircle, QrCode } from "lucide-react"

export default function TwoFactorManager() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [ok, setOk] = useState("")
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null)
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [copied, setCopied] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/2fa/status")
      const data = await res.json()
      if (res.ok) setEnabled(Boolean(data.enabled))
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const startSetup = async () => {
    setError("")
    setOk("")
    setBusy(true)
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Setup failed")
      setSetup({ secret: data.secret, qrDataUrl: data.qrDataUrl })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Setup failed")
    } finally {
      setBusy(false)
    }
  }

  const confirmEnable = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setBusy(true)
    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not enable")
      setEnabled(true)
      setSetup(null)
      setCode("")
      setBackupCodes(data.backupCodes || [])
      setOk("Two-factor authentication is now enabled. Save your backup codes below.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enable")
    } finally {
      setBusy(false)
    }
  }

  const disable = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setOk("")
    setBusy(true)
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not disable")
      setEnabled(false)
      setPassword("")
      setBackupCodes(null)
      setOk("Two-factor authentication disabled.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not disable")
    } finally {
      setBusy(false)
    }
  }

  const copyCodes = async () => {
    if (!backupCodes) return
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-1">
        <span className="h-10 w-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-bold text-[var(--title-color)]">Two-Factor Authentication</h3>
          <p className="text-xs text-[var(--subtitle-color)]">Extra security with an authenticator app (Google Authenticator, Authy, …)</p>
        </div>
        {!loading && (
          <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {enabled ? "Enabled" : "Off"}
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-xl mt-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {ok && (
        <div className="text-sm text-green-700 bg-green-50 px-3 py-2.5 rounded-xl mt-3">
          {ok}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--subtitle-color)] mt-4 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : enabled ? (
        <form onSubmit={disable} className="mt-4 space-y-3">
          <p className="text-sm text-[var(--subtitle-color)]">
            You&apos;ll be asked for a 6-digit code from your authenticator app on every sign-in. Lost your phone? Use one of your backup codes.
          </p>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Confirm with your password to turn it off</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full max-w-sm px-4 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Turn off two-factor authentication
          </button>
        </form>
      ) : setup ? (
        <div className="mt-4 space-y-4">
          <ol className="text-sm text-[var(--subtitle-color)] space-y-1.5 list-decimal pl-5">
            <li>Open your authenticator app and scan the QR code (or enter the key manually).</li>
            <li>Enter the 6-digit code shown in the app below to finish.</li>
          </ol>
          <div className="flex flex-wrap items-start gap-4">
            <div className="rounded-xl border border-[var(--border)] bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setup.qrDataUrl} alt="2FA QR code" className="h-44 w-44" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--subtitle-color)] mb-1 flex items-center gap-1">
                <QrCode className="h-3.5 w-3.5" /> Manual key
              </p>
              <code className="block text-xs font-mono bg-[var(--accent)] text-[var(--foreground)] px-3 py-2 rounded-lg break-all max-w-[260px]">
                {setup.secret}
              </code>
            </div>
          </div>
          <form onSubmit={confirmEnable} className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">6-digit code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="w-44 px-4 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] tracking-widest text-center font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify & enable
            </button>
            <button
              type="button"
              onClick={() => { setSetup(null); setCode("") }}
              className="px-4 py-2.5 text-sm text-[var(--subtitle-color)] hover:text-[var(--primary)]"
            >
              Cancel
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-[var(--subtitle-color)] mb-3">
            Turn it on if you want an extra code on every sign-in — recommended for admins and staff.
          </p>
          <button
            onClick={startSetup}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Enable two-factor authentication
          </button>
        </div>
      )}

      {backupCodes && backupCodes.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-amber-800">Backup codes — save them now (shown once)</p>
            <button onClick={copyCodes} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {backupCodes.map((c) => (
              <code key={c} className="text-xs font-mono bg-white border border-amber-200 rounded-lg px-2 py-1.5 text-center text-gray-800">
                {c}
              </code>
            ))}
          </div>
          <p className="text-xs text-amber-700 mt-2">Each code works once if you lose access to your authenticator app.</p>
        </div>
      )}
    </div>
  )
}
