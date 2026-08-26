"use client"
import { toast as notify } from "@/lib/toast"

import { useEffect, useState, useCallback } from "react"
import { Plus, Pencil, Trash2, X, Search, School as SchoolIcon, Loader2, Eye, Crown, Copy, KeyRound, UserCog, Check, ShieldCheck, Mail, Phone, MapPin, Calendar } from "lucide-react"
import { CURRENCIES, currencySymbol } from "@/lib/currencies"

type PlanRow = {
  id: number
  code: string
  name: string
  price: number
  billing_period: string
  max_students: number
  status?: string
}

type SchoolRow = {
  id: number
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  tagline?: string
  currency?: string
  plan?: string
  plan_id?: number | null
  planDetails?: { name: string; price: number; billing_period: string } | null
  max_students?: number
  status?: string
  created_at?: string
}

type FormState = {
  name: string
  email: string
  phone: string
  address: string
  tagline: string
  currency: string
  planId: string
  max_students: number
  adminEmail: string
  adminPassword: string
}

type SchoolUser = {
  id: number
  username: string
  name: string
  email: string
  role: string
  status: string
  last_login: string | null
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  admin: "bg-[var(--primary-light)] text-[var(--primary)]",
  teacher: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  staff: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  student: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  parent: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
}

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  address: "",
  tagline: "",
  currency: "INR",
  planId: "",
  max_students: 0,
  adminEmail: "",
  adminPassword: "",
}

const formatPrice = (price: number) => (price ? price.toLocaleString("en-IN") : "0")

export default function SaasSchools() {
  const [schools, setSchools] = useState<SchoolRow[]>([])
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SchoolRow | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")

  const [profileSchool, setProfileSchool] = useState<SchoolRow | null>(null)
  const [schoolUsers, setSchoolUsers] = useState<SchoolUser[]>([])
  const [profileLoading, setProfileLoading] = useState(false)
  const [resetFor, setResetFor] = useState<SchoolUser | null>(null)
  const [resetPass, setResetPass] = useState("")
  const [resetSaving, setResetSaving] = useState(false)
  const [resetError, setResetError] = useState("")
  const [copied, setCopied] = useState(false)

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/saas/schools")
      const data = await res.json()
      if (Array.isArray(data)) setSchools(data)
    } catch {
      setError("Failed to load schools")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/saas/plans")
      const data = await res.json()
      if (Array.isArray(data)) setPlans(data.filter((p: PlanRow) => p.status !== "Inactive"))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    fetchSchools()
    fetchPlans()
  }, [fetchSchools, fetchPlans])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setError("")
    setModalOpen(true)
  }

  const openEdit = (s: SchoolRow) => {
    setEditing(s)
    setForm({
      name: s.name,
      email: s.email || "",
      phone: s.phone || "",
      address: s.address || "",
      tagline: s.tagline || "",
      currency: s.currency || "INR",
      planId: s.plan_id ? String(s.plan_id) : "",
      max_students: s.max_students || 0,
      adminEmail: "",
      adminPassword: "",
    })
    setError("")
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("School name is required")
      return
    }
    setSaving(true)
    setError("")
    try {
      const payload: Record<string, any> = editing ? { id: editing.id, ...form } : { ...form }
      const res = await fetch("/api/saas/schools", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Save failed")
        setSaving(false)
        return
      }
      setModalOpen(false)
      await fetchSchools()
      showToast(editing ? "School updated" : `School created (code: ${data.code})`)
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (s: SchoolRow) => {
    if (!confirm(`Delete school "${s.name}"? This removes its users.`)) return
    try {
      const res = await fetch(`/api/saas/schools?id=${s.id}`, { method: "DELETE" })
      if (res.ok) {
        setSchools((prev) => prev.filter((x) => x.id !== s.id))
        showToast("School deleted")
      } else {
        const data = await res.json()
        notify.error(data.error || "Delete failed")
      }
    } catch {
      notify.error("Network error")
    }
  }

  const toggleStatus = async (s: SchoolRow) => {
    const next = s.status === "Active" ? "Inactive" : "Active"
    try {
      await fetch("/api/saas/schools", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, status: next }),
      })
      setSchools((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: next } : x)))
    } catch {
      notify.error("Failed to update status")
    }
  }

  const openProfile = async (s: SchoolRow) => {
    setProfileSchool(s)
    setSchoolUsers([])
    setResetFor(null)
    setProfileLoading(true)
    try {
      const res = await fetch(`/api/saas/users?schoolId=${s.id}`)
      const data = await res.json()
      if (Array.isArray(data)) setSchoolUsers(data)
    } catch {
      setSchoolUsers([])
    } finally {
      setProfileLoading(false)
    }
  }

  const closeProfile = () => {
    setProfileSchool(null)
    setResetFor(null)
    setResetPass("")
    setResetError("")
  }

  const copyCode = () => {
    if (!profileSchool) return
    navigator.clipboard.writeText(profileSchool.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleResetPassword = async () => {
    if (!resetFor) return
    if (!resetPass || resetPass.length < 6) {
      setResetError("Password must be at least 6 characters")
      return
    }
    setResetSaving(true)
    setResetError("")
    try {
      const res = await fetch("/api/saas/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resetFor.id, password: resetPass }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResetError(data.error || "Reset failed")
        setResetSaving(false)
        return
      }
      showToast(`Password updated for ${resetFor.name || resetFor.email}`)
      setResetPass("")
      setResetFor(null)
      setResetError("")
    } catch {
      setResetError("Network error")
    } finally {
      setResetSaving(false)
    }
  }

  const filtered = schools.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  )

  const inputCls =
    "w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--title-color)]">Schools</h2>
          <p className="text-sm text-[var(--subtitle-color)] mt-1">Create and manage all tenant schools</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add School
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search schools..."
          className="pl-9 pr-4 py-2 w-full text-sm border border-[var(--border)] rounded-xl bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {!loading &&
          filtered.map((s) => (
            <div key={s.id} className="glass-panel rounded-2xl p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                    <SchoolIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)] leading-tight">{s.name}</p>
                    <p className="text-xs font-mono text-[var(--subtitle-color)]">{s.code}</p>
                  </div>
                </div>
                <span
                  onClick={() => toggleStatus(s)}
                  className={`cursor-pointer px-2.5 py-1 rounded-full text-xs font-medium ${
                    s.status === "Active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" : "bg-red-50 text-red-600 dark:bg-red-950/40"
                  }`}
                >
                  {s.status || "Active"}
                </span>
              </div>
              <p className="text-sm text-[var(--subtitle-color)] flex-1 min-h-[40px]">
                {s.tagline || s.address || "No description"}
              </p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 text-xs min-w-0">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-medium">
                    <Crown className="h-3 w-3" />
                    {s.planDetails?.name || s.plan || "Free"}
                    {s.planDetails && s.planDetails.price > 0 && (
                      <span className="opacity-80">
                        · {currencySymbol(s.currency)} {formatPrice(s.planDetails.price)}
                      </span>
                    )}
                  </span>
                  <span className="text-[var(--subtitle-color)] truncate">
                    {currencySymbol(s.currency)} · {s.currency}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openProfile(s)} className="p-2 text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg" title="View profile & users">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => openEdit(s)} className="p-2 text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(s)} className="p-2 text-[var(--subtitle-color)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-[var(--subtitle-color)]">
          <SchoolIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No schools found. Click "Add School" to create your first tenant.</p>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-[var(--card)] rounded-2xl shadow-2xl z-10 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">{editing ? "Edit School" : "Add School"}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">School name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Sunrise International School" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="admin@school.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="+91 ..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Tagline</label>
                <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={inputCls} placeholder="Nurturing bright futures" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Address</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className={inputCls} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Plan</label>
                  <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} className={inputCls}>
                    <option value="">Free</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.price > 0 ? `${currencySymbol(form.currency)} ${formatPrice(p.price)}/${p.billing_period}` : "Free"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputCls}>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.symbol} {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Max students</label>
                  <input type="number" min={0} value={form.max_students} onChange={(e) => setForm({ ...form, max_students: parseInt(e.target.value) || 0 })} className={inputCls} />
                </div>
              </div>
              <p className="text-xs text-[var(--subtitle-color)]">Selected currency symbol: <span className="font-bold text-[var(--primary)]">{currencySymbol(form.currency)}</span></p>

              {!editing && (
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-[var(--primary-light)] p-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Admin email</label>
                    <input value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} className={inputCls} placeholder="admin@school.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Admin password</label>
                    <input value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} className={inputCls} placeholder="Admin@123" />
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[var(--border)]">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)]">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create school"}
              </button>
            </div>
          </div>
        </div>
      )}

      {profileSchool && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeProfile} />
          <div className="relative bg-white dark:bg-[var(--card)] rounded-2xl shadow-2xl z-10 w-full max-w-3xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                  <UserCog className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">{profileSchool.name}</h3>
                  <p className="text-xs text-[var(--subtitle-color)]">School profile</p>
                </div>
              </div>
              <button onClick={closeProfile} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[var(--border)] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--foreground)]">School details</p>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        profileSchool.status === "Active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" : "bg-red-50 text-red-600 dark:bg-red-950/40"
                      }`}
                    >
                      {profileSchool.status || "Active"}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-[var(--subtitle-color)] mb-1">School code (required to login)</p>
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white font-mono text-sm font-bold tracking-wider">
                        {profileSchool.code}
                      </code>
                      <button
                        onClick={copyCode}
                        className="p-2 rounded-lg text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)]"
                        title="Copy code"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-[var(--subtitle-color)] mt-1.5 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      The school admin enters this code on the login page to sign in.
                    </p>
                  </div>

                  <div className="space-y-2 text-sm pt-2 border-t border-[var(--border)]">
                    <p className="flex items-center gap-2 text-[var(--subtitle-color)]">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="text-[var(--foreground)]">{profileSchool.email || "—"}</span>
                    </p>
                    <p className="flex items-center gap-2 text-[var(--subtitle-color)]">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span className="text-[var(--foreground)]">{profileSchool.phone || "—"}</span>
                    </p>
                    <p className="flex items-center gap-2 text-[var(--subtitle-color)]">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="text-[var(--foreground)]">{profileSchool.address || "—"}</span>
                    </p>
                    <p className="flex items-center gap-2 text-[var(--subtitle-color)]">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span className="text-[var(--foreground)]">
                        {profileSchool.created_at ? new Date(profileSchool.created_at).toLocaleDateString() : "—"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] p-5 space-y-3">
                  <p className="text-sm font-semibold text-[var(--foreground)]">Subscription</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{profileSchool.planDetails?.name || profileSchool.plan || "Free"}</p>
                      <p className="text-xs text-[var(--subtitle-color)]">
                        {profileSchool.planDetails && profileSchool.planDetails.price > 0
                          ? `${currencySymbol(profileSchool.currency)} ${formatPrice(profileSchool.planDetails.price)} / ${profileSchool.planDetails.billing_period}`
                          : "Free plan"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)] text-sm">
                    <div className="rounded-xl bg-[var(--muted)] px-3 py-2">
                      <p className="text-xs text-[var(--subtitle-color)]">Currency</p>
                      <p className="font-medium text-[var(--foreground)]">{currencySymbol(profileSchool.currency)} {profileSchool.currency}</p>
                    </div>
                    <div className="rounded-xl bg-[var(--muted)] px-3 py-2">
                      <p className="text-xs text-[var(--subtitle-color)]">Max students</p>
                      <p className="font-medium text-[var(--foreground)]">{profileSchool.max_students || "Unlimited"}</p>
                    </div>
                  </div>
                  {profileSchool.tagline && (
                    <p className="text-sm text-[var(--subtitle-color)] italic">"{profileSchool.tagline}"</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-[var(--foreground)]">School users</h4>
                    <p className="text-xs text-[var(--subtitle-color)]">Admin and other users for this school</p>
                  </div>
                  {profileLoading && <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />}
                </div>

                {!profileLoading && (
                  <div className="rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)]">
                    {schoolUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                            {(u.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--foreground)] truncate">
                              {u.name}
                              {u.role === "admin" && (
                                <span className="ml-2 text-xs text-[var(--primary)] font-semibold">Admin</span>
                              )}
                            </p>
                            <p className="text-xs text-[var(--subtitle-color)] truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}>
                            {u.role}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${u.status === "Active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" : "bg-red-50 text-red-600 dark:bg-red-950/40"}`}>
                            {u.status || "Active"}
                          </span>
                          <button
                            onClick={() => {
                              setResetFor(u)
                              setResetPass("")
                              setResetError("")
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary-light)]"
                            title="Reset password"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            Reset
                          </button>
                        </div>
                      </div>
                    ))}
                    {schoolUsers.length === 0 && (
                      <div className="text-center py-10 text-[var(--subtitle-color)] text-sm">
                        No users found for this school yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {resetFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setResetFor(null)} />
          <div className="relative bg-white dark:bg-[var(--card)] rounded-2xl shadow-2xl z-10 w-full max-w-sm">
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">Reset password</h3>
                  <p className="text-xs text-[var(--subtitle-color)]">For {resetFor.name || resetFor.email}</p>
                </div>
              </div>
              <label className="block text-sm font-medium mb-1.5">New password</label>
              <input
                type="password"
                value={resetPass}
                onChange={(e) => setResetPass(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"
              />
              {resetError && <p className="text-sm text-red-600 mt-2">{resetError}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[var(--border)]">
              <button onClick={() => setResetFor(null)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)]">
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetSaving}
                className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {resetSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Reset password
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm shadow-xl">
          <Eye className="h-4 w-4" />
          {toast}
        </div>
      )}
    </div>
  )
}
