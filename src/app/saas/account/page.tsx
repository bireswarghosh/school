"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, KeyRound, Loader2, Check, AlertCircle, ShieldCheck } from "lucide-react"
import TwoFactorManager from "@/components/two-factor-manager"
import { useAuth } from "@/lib/auth-context"

export default function SaasAccountPage() {
  const router = useRouter()
  const { user, refresh } = useAuth()

  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passMsg, setPassMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [passSaving, setPassSaving] = useState(false)

  const inputCls =
    "w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"

  const saveProfile = async () => {
    setProfileMsg(null)
    setProfileSaving(true)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      await refresh()
      setProfileMsg({ type: "ok", text: "Profile updated" })
    } catch (e) {
      setProfileMsg({ type: "err", text: e instanceof Error ? e.message : "Save failed" })
    } finally {
      setProfileSaving(false)
    }
  }

  const savePassword = async () => {
    setPassMsg(null)
    if (newPassword.length < 6) {
      setPassMsg({ type: "err", text: "New password must be at least 6 characters" })
      return
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: "err", text: "New passwords do not match" })
      return
    }
    setPassSaving(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Change failed")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPassMsg({ type: "ok", text: "Password changed successfully" })
    } catch (e) {
      setPassMsg({ type: "err", text: e instanceof Error ? e.message : "Change failed" })
    } finally {
      setPassSaving(false)
    }
  }

  const msg = (m: { type: "ok" | "err"; text: string } | null) =>
    m ? (
      <div className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl ${m.type === "ok" ? "text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-300" : "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400"}`}>
        {m.type === "ok" ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
        <span>{m.text}</span>
      </div>
    ) : null

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--title-color)]">My Account</h2>
          <p className="text-sm text-[var(--subtitle-color)] mt-1">Profile, password and security for your super admin account</p>
        </div>
        <button onClick={() => router.push("/saas")} className="inline-flex items-center gap-1.5 text-sm text-[var(--subtitle-color)] hover:text-[var(--primary)] px-3 py-1.5 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white dark:bg-[var(--card)] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
            <User className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-[var(--title-color)]">Profile</h3>
            <p className="text-xs text-[var(--subtitle-color)]">Your display name and login email</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
        </div>
        {msg(profileMsg)}
        <div className="flex justify-end">
          <button
            onClick={saveProfile}
            disabled={profileSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {profileSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save profile
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white dark:bg-[var(--card)] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-[var(--title-color)]">Change Password</h3>
            <p className="text-xs text-[var(--subtitle-color)]">Update the password you use to sign in to this portal</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Current password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} placeholder="Repeat new password" />
          </div>
        </div>
        {msg(passMsg)}
        <div className="flex justify-end">
          <button
            onClick={savePassword}
            disabled={passSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {passSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Change password
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="h-10 w-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-bold text-[var(--title-color)]">Two-Factor Authentication</h3>
          <p className="text-xs text-[var(--subtitle-color)]">Add an extra code on every sign-in for extra security</p>
        </div>
      </div>
      <TwoFactorManager />
    </div>
  )
}