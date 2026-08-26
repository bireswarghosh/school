"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Mail, Phone, Briefcase, User, Hash, BadgeCheck, ArrowLeft, KeyRound, UserPlus, Loader2, X, Clock, ShieldCheck, Building2 } from "lucide-react"
import Link from "next/link"
import { toast as notify } from "@/lib/toast"

type StaffProfile = {
  id: number
  staff_id: string
  name: string
  email: string
  phone: string
  department_id?: number | null
  designation_id?: number | null
  department_name?: string | null
  designation_name?: string | null
  role: string
  status: string
}

type UserProfile = {
  id: number
  username: string
  name: string
  email: string
  role: string
  status: string
  last_login: string | null
  school_id: number | null
  school_name?: string | null
}

export default function StaffProfilePage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [mode, setMode] = useState<"user" | "staff">("user")

  const [showPassword, setShowPassword] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirm: "" })
  const [create, setCreate] = useState({ email: "", username: "", password: "", confirm: "" })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    fetch(`/api/human-resource/staff-profile?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error || (!data.user && !data.staff)) {
          setNotFound(true)
          return
        }
        setUser(data.user || null)
        setProfile(data.staff || null)
        setMode(data.mode || "user")
        const email = data.staff?.email || data.user?.email || ""
        setCreate((c) => ({ ...c, email, username: email ? email.split("@")[0] : "" }))
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (id) load()
  }, [id])

  const submitPassword = async () => {
    if (pwd.newPassword.length < 6) return notify.error("Password must be at least 6 characters")
    if (pwd.newPassword !== pwd.confirm) return notify.error("Passwords do not match")
    if (!pwd.currentPassword && mode === "user") return notify.error("Current password is required")
    setSaving(true)
    try {
      const res = await fetch("/api/human-resource/staff-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user?.id, currentPassword: pwd.currentPassword, newPassword: pwd.newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to change password")
      notify.success("Password changed successfully")
      setShowPassword(false)
      setPwd({ currentPassword: "", newPassword: "", confirm: "" })
    } catch (e: any) {
      notify.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const submitCreate = async () => {
    if (create.password.length < 6) return notify.error("Password must be at least 6 characters")
    if (create.password !== create.confirm) return notify.error("Passwords do not match")
    setSaving(true)
    try {
      const res = await fetch("/api/human-resource/staff-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: profile?.id, email: create.email, username: create.username, password: create.password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to create login account")
      setUser(data.user)
      setMode("user")
      notify.success("Login account created successfully")
      setShowCreate(false)
      setCreate((c) => ({ ...c, password: "", confirm: "" }))
    } catch (e: any) {
      notify.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const fmtLastLogin = (v: string | null | undefined) => {
    if (!v) return "Never logged in"
    try {
      return new Date(v).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    } catch {
      return String(v)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-10 text-center text-gray-500">
        Loading profile...
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-10 text-center">
          <h1 className="text-lg font-semibold text-gray-800">Profile not found</h1>
          <p className="mt-1 text-sm text-gray-500">No user or staff record matches the given id.</p>
          <Link
            href="/admin"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const statusActive = (status?: string) => String(status || "Active").toLowerCase() === "active"
  const modalInput = "w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
  const modalLabel = "block text-xs font-medium text-gray-600 mb-1"

  const primaryName = (user?.name || profile?.name || "Member")
  const primarySub = profile?.designation_name || user?.role || "Staff"

  const InfoRow = ({ icon: Icon, label, value, badge }: { icon: React.ElementType; label: string; value: string; badge?: "good" | "bad" }) => (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        {badge ? (
          <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge === "good" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {value}
          </span>
        ) : (
          <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:opacity-80">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      {/* Identity header */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold text-white">
              {primaryName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{primaryName}</h1>
              <p className="text-sm text-white/80 capitalize">{primarySub}</p>
            </div>
          </div>
        </div>
      </div>

      {/* User account card */}
      {user && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--primary)]" /> User Account
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Login account for {primaryName}</p>
            </div>
            <button
              onClick={() => { setPwd({ currentPassword: "", newPassword: "", confirm: "" }); setShowPassword(true) }}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-3 py-2 rounded-lg hover:bg-[var(--secondary)] transition-colors"
            >
              <KeyRound className="h-3.5 w-3.5" /> Change Password
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
            <InfoRow icon={User} label="Username" value={user.username || "—"} />
            <InfoRow icon={Mail} label="Email" value={user.email || "—"} />
            <InfoRow icon={BadgeCheck} label="Role" value={String(user.role || "—").replace(/_/g, " ")} />
            <InfoRow icon={ShieldCheck} label="Status" value={user.status || "Active"} badge={statusActive(user.status) ? "good" : "bad"} />
            <InfoRow icon={Clock} label="Last Login" value={fmtLastLogin(user.last_login)} />
            <InfoRow icon={Building2} label="School" value={user.school_name || (user.school_id ? `School #${user.school_id}` : "Super Admin")} />
          </div>
        </div>
      )}

      {/* Staff profile card */}
      {profile && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[var(--primary)]" /> Staff Profile
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{profile.staff_id ? `Staff ID ${profile.staff_id}` : "Linked staff record"}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
            <InfoRow icon={Hash} label="Staff ID" value={profile.staff_id || "—"} />
            <InfoRow icon={User} label="Name" value={profile.name || "—"} />
            <InfoRow icon={Mail} label="Email" value={profile.email || "—"} />
            <InfoRow icon={Phone} label="Phone" value={profile.phone || "—"} />
            <InfoRow icon={Briefcase} label="Department" value={profile.department_name || "—"} />
            <InfoRow icon={BadgeCheck} label="Designation" value={profile.designation_name || profile.role || "—"} />
            <InfoRow icon={ShieldCheck} label="Status" value={profile.status || "Active"} badge={statusActive(profile.status) ? "good" : "bad"} />
          </div>
        </div>
      )}

      {/* No login account (staff-only mode) */}
      {!user && profile && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--primary)]" /> Login Account
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">No login account linked to this staff member yet</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-3 py-2 rounded-lg hover:bg-[var(--secondary)] transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" /> Create Login Account
            </button>
          </div>
          <div className="p-6">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
              This staff member does not have a login account. Create one so they can sign in to the school portal
              using their email and password.
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPassword && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPassword(false)}>
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[var(--primary)]" /> Change Password
              </h3>
              <button type="button" onClick={() => setShowPassword(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-900">
                Setting a new password for <span className="font-semibold">{user.name || user.username}</span> ({user.email}).
              </div>
              <div>
                <label className={modalLabel}>Current Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={pwd.currentPassword}
                  onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
                  className={modalInput}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className={modalLabel}>New Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={pwd.newPassword}
                  onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                  className={modalInput}
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className={modalLabel}>Confirm Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={pwd.confirm}
                  onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                  className={modalInput}
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowPassword(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitPassword}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                {saving ? "Saving..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Login Account Modal */}
      {showCreate && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[var(--primary)]" /> Create Login Account
              </h3>
              <button type="button" onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-900">
                For <span className="font-semibold">{profile.name}</span>. The staff member can then sign in to the
                school portal using their email and this password.
              </div>
              <div>
                <label className={modalLabel}>Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={create.email}
                  onChange={(e) => setCreate((c) => ({ ...c, email: e.target.value }))}
                  className={modalInput}
                />
              </div>
              <div>
                <label className={modalLabel}>Username <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={create.username}
                  onChange={(e) => setCreate((c) => ({ ...c, username: e.target.value }))}
                  className={modalInput}
                />
              </div>
              <div>
                <label className={modalLabel}>Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={create.password}
                  onChange={(e) => setCreate((c) => ({ ...c, password: e.target.value }))}
                  className={modalInput}
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className={modalLabel}>Confirm Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={create.confirm}
                  onChange={(e) => setCreate((c) => ({ ...c, confirm: e.target.value }))}
                  className={modalInput}
                  placeholder="Re-enter password"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitCreate}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                {saving ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
