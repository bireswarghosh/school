"use client"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Copy, Check, School as SchoolIcon, Crown, Mail, Phone, MapPin, Calendar, Pencil,
  Loader2, ShieldCheck, LogIn, Users, UserCog, GraduationCap, Briefcase, UserRound,
  LayoutGrid, RefreshCw,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { CURRENCIES, currencySymbol } from "@/lib/currencies"

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
  admin: "bg-[var(--primary-light)] text-[var(--primary)]",
  teacher: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  staff: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  student: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  parent: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
}

const ROLE_META: { role: string; label: string; icon: LucideIcon; color: string }[] = [
  { role: "admin", label: "Admins", icon: UserCog, color: "bg-[var(--primary-light)] text-[var(--primary)]" },
  { role: "teacher", label: "Teachers", icon: GraduationCap, color: "bg-blue-100 text-blue-600 dark:bg-blue-950/40" },
  { role: "staff", label: "Staff", icon: Briefcase, color: "bg-amber-100 text-amber-600 dark:bg-amber-950/40" },
  { role: "student", label: "Students", icon: UserRound, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40" },
  { role: "parent", label: "Parents", icon: Users, color: "bg-violet-100 text-violet-600 dark:bg-violet-950/40" },
]

export default function SchoolProfilePage() {
  const rawParams = useParams() as { id?: string | string[] }
  const router = useRouter()
  const idRaw = Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id
  const id = Number(idRaw)
  const [school, setSchool] = useState<SchoolRow | null>(null)
  const [users, setUsers] = useState<SchoolUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", tagline: "", currency: "INR", max_students: 0 })
  const [saving, setSaving] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [formPlanId, setFormPlanId] = useState("")
  const [loginAsId, setLoginAsId] = useState<number | null>(null)
  const [loginError, setLoginError] = useState("")
  const [creatingDemo, setCreatingDemo] = useState(false)
  const [demoMsg, setDemoMsg] = useState("")

  const fetchSchool = useCallback(async () => {
    if (!idRaw || Number.isNaN(id)) {
      setError("Invalid school id")
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/saas/schools?id=${id}`, { credentials: "include" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `Failed to load school (${res.status})`)
        setLoading(false)
        return
      }
      const s: SchoolRow = Array.isArray(data) ? data[0] : data
      if (s && s.id) {
        setSchool(s)
        setForm({ name: s.name || "", email: s.email || "", phone: s.phone || "", address: s.address || "", tagline: s.tagline || "", currency: s.currency || "INR", max_students: s.max_students || 0 })
        setFormPlanId(s.plan_id ? String(s.plan_id) : "")
      } else {
        setError((data as any)?.error || "School not found")
      }
      await fetchUsers()
    } catch (e: any) {
      setError(e.message || "Network error")
    }
    finally { setLoading(false) }
  }, [id, idRaw])

  const fetchUsers = useCallback(async () => {
    if (!id) return
    try {
      const ures = await fetch(`/api/saas/users?schoolId=${id}`, { credentials: "include" })
      const udata = await ures.json()
      if (Array.isArray(udata)) setUsers(udata)
    } catch {
      /* ignore */
    }
  }, [id])

  const fetchPlans = useCallback(async () => {
    try { const r = await fetch("/api/saas/plans"); const d = await r.json(); if (Array.isArray(d)) setPlans(d.filter((p: any) => p.status !== "Inactive")) } catch {}
  }, [])

  useEffect(() => { fetchSchool(); fetchPlans() }, [fetchSchool, fetchPlans])

  const copyCode = () => {
    if (!school) return
    navigator.clipboard.writeText(school.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleSave = async () => {
    if (!school || !form.name.trim()) return
    setSaving(true)
    try {
      const payload: any = { id: school.id, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), address: form.address.trim(), tagline: form.tagline.trim(), currency: form.currency, max_students: Number(form.max_students) || 0 }
      if (formPlanId) payload.plan_id = Number(formPlanId)
      const res = await fetch("/api/saas/schools", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Save failed") }
      const updated = await res.json()
      setSchool((prev) => prev ? { ...prev, ...updated, ...payload, plan_id: payload.plan_id || prev.plan_id } : prev)
      setEditing(false)
    } catch (e: any) { alert(e.message || "Save failed") } finally { setSaving(false) }
  }

  const handleLoginAs = async (u: SchoolUser) => {
    setLoginError("")
    setLoginAsId(u.id)
    try {
      const res = await fetch("/api/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, returnUrl: `/saas/schools/${id}` }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLoginError(data.error || "Auto-login failed")
        setLoginAsId(null)
        return
      }
      router.push(data.redirect || "/admin")
      router.refresh()
    } catch (e: any) {
      setLoginError(e.message || "Network error")
      setLoginAsId(null)
    }
  }

  const handleCreateDemoUsers = async () => {
    setCreatingDemo(true)
    setDemoMsg("")
    try {
      const res = await fetch(`/api/saas/demo-users?schoolId=${id}`, { method: "POST", credentials: "include" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create demo users")
      const created = Array.isArray(data.created) ? data.created.length : 0
      setDemoMsg(created > 0 ? `Created ${created} demo account${created === 1 ? "" : "s"}.` : "All demo roles already have an account.")
      await fetchUsers()
    } catch (e: any) {
      setDemoMsg(e.message || "Network error")
    } finally {
      setCreatingDemo(false)
    }
  }

  const countByRole = useCallback((role: string) => users.filter((u) => u.role === role).length, [users])
  const missingRoles = ROLE_META.filter((r) => countByRole(r.role) === 0)
  const firstActive = (role: string) => users.find((u) => u.role === role && u.status !== "Inactive" && u.status !== "inactive") || users.find((u) => u.role === role)
  const adminStaff = users.filter((u) => ["admin", "staff", "teacher"].includes(u.role))

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" /></div>
  if (error) return <div className="p-6 text-center"><p className="text-sm text-red-600">{error}</p><button onClick={() => router.push("/saas/schools")} className="mt-3 text-sm text-[var(--primary)] hover:underline">Back to Schools</button></div>
  if (!school) return <div className="p-6 text-center text-[var(--subtitle-color)]">School not found — <button onClick={() => router.push("/saas/schools")} className="text-[var(--primary)] hover:underline">Go back</button></div>

  const inputCls = "w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button onClick={() => router.push("/saas/schools")} className="inline-flex items-center gap-1.5 text-sm text-[var(--subtitle-color)] hover:text-[var(--primary)]">
        <ArrowLeft className="h-4 w-4" /> Back to Schools
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--title-color)] flex items-center gap-2">
            <SchoolIcon className="h-6 w-6 text-[var(--primary)]" /> {school.name}
          </h2>
          <p className="text-sm text-[var(--subtitle-color)] mt-1">School profile • {school.code} • {school.status || "Active"}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => router.push(`/saas/schools/${id}/modules`)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--primary)]/30 text-[var(--primary)] text-sm font-medium hover:bg-[var(--primary-light)]">
            <LayoutGrid className="h-4 w-4" /> Modules
          </button>
          <button onClick={() => setEditing(v => !v)} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${editing ? "bg-gray-100 text-gray-700 dark:bg-gray-800" : "bg-[var(--primary)] text-white hover:opacity-90"}`}>
            <Pencil className="h-4 w-4" /> {editing ? "Cancel Edit" : "Edit School Profile"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {ROLE_META.map((r) => (
          <div key={r.role} className="glass-panel rounded-2xl p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${r.color} flex items-center justify-center shrink-0`}>
              <r.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-[var(--title-color)] leading-tight">{countByRole(r.role)}</p>
              <p className="text-xs text-[var(--subtitle-color)] truncate">{r.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--border)] p-5 space-y-3 bg-white dark:bg-[var(--card)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--foreground)]">School details</p>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${school.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{school.status || "Active"}</span>
          </div>
          {!editing ? (
            <>
              <div>
                <p className="text-xs text-[var(--subtitle-color)] mb-1">School code (required to login)</p>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white font-mono text-sm font-bold tracking-wider">{school.code}</code>
                  <button onClick={copyCode} className="p-2 rounded-lg text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)]">{copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}</button>
                </div>
                <p className="text-xs text-[var(--subtitle-color)] mt-1.5 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />The school admin enters this code on the login page</p>
              </div>
              <div className="space-y-2 text-sm pt-2 border-t border-[var(--border)]">
                <p className="flex items-center gap-2 text-[var(--subtitle-color)]"><Mail className="h-4 w-4 shrink-0" /><span className="text-[var(--foreground)]">{school.email || "—"}</span></p>
                <p className="flex items-center gap-2 text-[var(--subtitle-color)]"><Phone className="h-4 w-4 shrink-0" /><span className="text-[var(--foreground)]">{school.phone || "—"}</span></p>
                <p className="flex items-center gap-2 text-[var(--subtitle-color)]"><MapPin className="h-4 w-4 shrink-0" /><span className="text-[var(--foreground)]">{school.address || "—"}</span></p>
                <p className="flex items-center gap-2 text-[var(--subtitle-color)]"><Calendar className="h-4 w-4 shrink-0" /><span className="text-[var(--foreground)]">{school.created_at ? new Date(school.created_at).toLocaleDateString() : "—"}</span></p>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div><label className="block text-xs font-medium mb-1">School name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1">Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} /></div>
                <div><label className="block text-xs font-medium mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} /></div>
              </div>
              <div><label className="block text-xs font-medium mb-1">Tagline</label><input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">Address</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1">Currency</label><select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className={inputCls}>{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}</select></div>
                <div><label className="block text-xs font-medium mb-1">Max students</label><input type="number" value={form.max_students} onChange={e => setForm({ ...form, max_students: parseInt(e.target.value) || 0 })} className={inputCls} /></div>
              </div>
              <div><label className="block text-xs font-medium mb-1">Plan</label><select value={formPlanId} onChange={e => setFormPlanId(e.target.value)} className={inputCls}><option value="">Free</option>{plans.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.price > 0 ? `${currencySymbol(form.currency)} ${p.price}/${p.billing_period}` : "Free"})</option>)}</select></div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl border text-sm">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes</button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] p-5 space-y-3 bg-white dark:bg-[var(--card)]">
          <p className="text-sm font-semibold text-[var(--foreground)]">Subscription</p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]"><Crown className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[var(--foreground)]">{school.planDetails?.name || school.plan || "Free"}</p><p className="text-xs text-[var(--subtitle-color)]">{school.planDetails && school.planDetails.price > 0 ? `${currencySymbol(school.currency)} ${school.planDetails.price} / ${school.planDetails.billing_period}` : "Free plan"}</p></div>
          </div>
          {school.tagline && <p className="text-sm text-[var(--subtitle-color)] italic">"{school.tagline}"</p>}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)] text-sm">
            <div className="rounded-xl bg-[var(--muted)] px-3 py-2">
              <p className="text-xs text-[var(--subtitle-color)]">Max students</p>
              <p className="font-medium text-[var(--foreground)]">{school.max_students || "Unlimited"}</p>
            </div>
            <div className="rounded-xl bg-[var(--muted)] px-3 py-2">
              <p className="text-xs text-[var(--subtitle-color)]">Total users</p>
              <p className="font-medium text-[var(--foreground)]">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white dark:bg-[var(--card)] overflow-hidden">
        <div className="px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-semibold text-[var(--foreground)]">Demo logins — one per role</h4>
            <p className="text-xs text-[var(--subtitle-color)]">Auto-login as any role. Roles without an account yet can be created with a demo password.</p>
          </div>
          {missingRoles.length > 0 && (
            <button onClick={handleCreateDemoUsers} disabled={creatingDemo} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60">
              {creatingDemo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Create missing demo logins ({missingRoles.length})
            </button>
          )}
        </div>
        {demoMsg && <div className="px-5 py-2.5 border-b border-[var(--border)] bg-emerald-50 dark:bg-emerald-950/30 text-xs text-emerald-700 dark:text-emerald-300">{demoMsg}</div>}
        {loginError && <div className="px-5 py-2.5 border-b border-[var(--border)] bg-red-50 dark:bg-red-950/30 text-xs text-red-600 dark:text-red-400">{loginError}</div>}
        <div className="divide-y divide-[var(--border)]">
          {ROLE_META.map((r) => {
            const count = countByRole(r.role)
            const account = firstActive(r.role)
            return (
              <div key={r.role} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-9 w-9 rounded-xl ${r.color} flex items-center justify-center shrink-0`}><r.icon className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                      {r.label}
                      <span className="ml-2 text-xs text-[var(--subtitle-color)] font-normal">{count} account{count === 1 ? "" : "s"}</span>
                    </p>
                    <p className="text-xs text-[var(--subtitle-color)] truncate">{account ? `${account.name} · ${account.email}` : "No account yet — click create"}</p>
                  </div>
                </div>
                {account ? (
                  <button
                    onClick={() => handleLoginAs(account)}
                    disabled={loginAsId !== null}
                    title={`Open ${r.label.toLowerCase()} view`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 shrink-0"
                  >
                    {loginAsId === account.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
                    Login as
                  </button>
                ) : (
                  <button
                    onClick={handleCreateDemoUsers}
                    disabled={creatingDemo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--primary)]/40 text-[var(--primary)] text-xs font-semibold hover:bg-[var(--primary-light)] disabled:opacity-60 shrink-0"
                  >
                    Create
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white dark:bg-[var(--card)] overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-[var(--foreground)]">School users — Admin & Staff only</h4>
            <p className="text-xs text-[var(--subtitle-color)]">Students & parents are shown above as demo logins</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-medium">{adminStaff.length} users</span>
        </div>
        {loginError && <div className="px-5 py-2.5 border-b border-[var(--border)] bg-red-50 dark:bg-red-950/30 text-xs text-red-600 dark:text-red-400">{loginError}</div>}
        <div className="divide-y divide-[var(--border)]">
          {adminStaff.length === 0 ? (
            <div className="text-center py-10 text-sm text-[var(--subtitle-color)]">No admin/staff users found for this school.</div>
          ) : adminStaff.map(u => (
            <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-semibold shrink-0">{(u.name || "U").charAt(0).toUpperCase()}</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">{u.name} {u.role === "admin" && <span className="ml-2 text-xs text-[var(--primary)] font-semibold">Admin</span>}</p>
                  <p className="text-xs text-[var(--subtitle-color)] truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleLoginAs(u)}
                  disabled={loginAsId !== null || (u.status !== "Active" && u.status !== "active")}
                  title="Auto-login as this user"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loginAsId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
                  Login as
                </button>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}>{u.role}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${u.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{u.status || "Active"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
