"use client"

import { useState, useEffect } from "react"
import { toast as notify } from "@/lib/toast"
import { Link2, Copy, ExternalLink, Globe, Check, Loader2, Trash2, CheckCircle2, XCircle, Download, Eye, X, Wallet, FileText, UserCheck } from "lucide-react"

type Application = {
  id: number
  name: string
  first_name: string
  middle_name: string
  last_name: string
  email: string
  phone: string
  mobile_number: string
  class_id: number | null
  section: string
  admission_no: string
  father_name: string
  father_phone: string
  father_occupation: string
  mother_name: string
  mother_phone: string
  mother_occupation: string
  guardian_is: string
  guardian_name: string
  guardian_relation: string
  guardian_phone: string
  guardian_occupation: string
  guardian_email: string
  guardian_address: string
  date_of_birth: string | null
  gender: string
  category: string
  religion: string
  caste: string
  blood_group: string
  house: string
  previous_school: string
  sibling_name: string
  rte: string
  note: string
  address: string
  current_address: string
  permanent_address: string
  status: string
  student_id: number | null
  created_at: string
}

const statusOptions = ["Pending", "Pending for payment", "Approved", "Rejected"]

export default function OnlineAdmissionPage() {
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [applications, setApplications] = useState<Application[]>([])
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([])
  const [copied, setCopied] = useState<"" | "url" | "embed">("")
  const [deleting, setDeleting] = useState<number | null>(null)
  const [viewing, setViewing] = useState<Application | null>(null)
  const [tab, setTab] = useState<"submitted" | "public">("submitted")

  const publicUrl = typeof window !== "undefined" && code ? `${window.location.origin}/online-admission/${code}` : ""
  const embedCode = publicUrl ? `<iframe src="${publicUrl}" width="100%" height="850" style="border:0; border-radius:12px;" allowfullscreen loading="lazy"></iframe>` : ""

  const load = () => {
    fetch("/api/online-admission")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          notify.error(data.error)
          return
        }
        setCode(data.code || "")
        setSchoolName(data.name || "")
        setApplications(Array.isArray(data.applications) ? data.applications : [])
      })
      .catch(() => notify.error("Failed to load online admission settings"))
      .finally(() => setLoading(false))
    fetch("/api/classes")
      .then((r) => r.json())
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const copy = async (text: string, key: "url" | "embed") => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(""), 2000)
    } catch {
      notify.error("Failed to copy")
    }
  }

  const className = (id: number | null) => classes.find((c) => c.id === id)?.name || (id ? `Class ${id}` : "-")

  const changeStatus = async (id: number, status: string) => {
    try {
      const res = await fetch("/api/online-admission", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      if (status === "Approved") {
        load()
      } else {
        setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
        if (viewing?.id === id) setViewing((prev) => (prev ? { ...prev, status } : prev))
      }
      notify.success(status === "Approved" ? "Application approved and student created" : `Application marked ${status}`)
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const removeApplication = async (id: number) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/online-admission?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      setApplications((prev) => prev.filter((a) => a.id !== id))
      if (viewing?.id === id) setViewing(null)
      notify.success("Application deleted")
    } catch (e: any) {
      notify.error(e.message)
    } finally {
      setDeleting(null)
    }
  }

  const exportCSV = () => {
    const headers = ["Ref No", "Name", "Class", "Section", "Gender", "DOB", "Phone", "Email", "Father Name", "Father Phone", "Mother Name", "Address", "Status", "Applied On"]
    const rows = applications.map((a) => [
      a.admission_no || "", a.name || "", className(a.class_id), a.section || "", a.gender || "", a.date_of_birth || "",
      a.phone || a.mobile_number || "", a.email || "", a.father_name || "", a.father_phone || "", a.mother_name || "",
      a.current_address || a.address || "", a.status || "", a.created_at || "",
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))].join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "online_admissions.csv"; a.click()
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-800"
      case "Rejected": return "bg-red-100 text-red-800"
      case "Pending for payment": return "bg-purple-100 text-purple-800"
      default: return "bg-amber-100 text-amber-800"
    }
  }

  const fmtDate = (d: string | null | undefined) => d ? d.split("T")[0] : "-"

  const Detail = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value || "-"}</p>
    </div>
  )

  const SectionTitle = ({ title }: { title: string }) => (
    <h4 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide border-b border-gray-100 pb-2 mb-3">{title}</h4>
  )

  const viewModal = viewing && (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setViewing(null)}>
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Application Details</h3>
            <p className="text-xs text-gray-500">Ref: {viewing.admission_no || "-"} · Applied {fmtDate(viewing.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewing(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{viewing.name}</p>
                <p className="text-xs text-gray-500">{className(viewing.class_id)}{viewing.section ? ` · Section ${viewing.section}` : ""}</p>
              </div>
            </div>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusBadge(viewing.status)}`}>{viewing.status}</span>
          </div>

          <div>
            <SectionTitle title="Student Details" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Detail label="Full Name" value={viewing.name} />
              <Detail label="Class" value={className(viewing.class_id)} />
              <Detail label="Section" value={viewing.section} />
              <Detail label="Gender" value={viewing.gender} />
              <Detail label="Date of Birth" value={viewing.date_of_birth ? String(viewing.date_of_birth).slice(0, 10) : ""} />
              <Detail label="Blood Group" value={viewing.blood_group} />
              <Detail label="Category" value={viewing.category} />
              <Detail label="Religion" value={viewing.religion} />
              <Detail label="Caste" value={viewing.caste} />
              <Detail label="House" value={viewing.house} />
              <Detail label="Sibling" value={viewing.sibling_name} />
              <Detail label="RTE" value={viewing.rte} />
              <Detail label="Previous School" value={viewing.previous_school} />
              <Detail label="Email" value={viewing.email} />
              <Detail label="Phone" value={viewing.phone || viewing.mobile_number} />
            </div>
            {viewing.note && <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">Note: {viewing.note}</p>}
          </div>

          <div>
            <SectionTitle title="Parent / Guardian Details" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Detail label="Father Name" value={viewing.father_name} />
              <Detail label="Father Phone" value={viewing.father_phone} />
              <Detail label="Father Occupation" value={viewing.father_occupation} />
              <Detail label="Mother Name" value={viewing.mother_name} />
              <Detail label="Mother Phone" value={viewing.mother_phone} />
              <Detail label="Mother Occupation" value={viewing.mother_occupation} />
              <Detail label="Guardian Is" value={viewing.guardian_is} />
              <Detail label="Guardian Name" value={viewing.guardian_name} />
              <Detail label="Guardian Relation" value={viewing.guardian_relation} />
              <Detail label="Guardian Phone" value={viewing.guardian_phone} />
              <Detail label="Guardian Occupation" value={viewing.guardian_occupation} />
              <Detail label="Guardian Email" value={viewing.guardian_email} />
            </div>
            {viewing.guardian_address && (
              <div className="mt-3"><Detail label="Guardian Address" value={viewing.guardian_address} /></div>
            )}
          </div>

          <div>
            <SectionTitle title="Address Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Detail label="Current Address" value={viewing.current_address || viewing.address} />
              <Detail label="Permanent Address" value={viewing.permanent_address} />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide mb-3">Update Status</h4>
            <div className="flex items-center gap-2 flex-wrap">
              {statusOptions.filter((s) => s !== viewing.status).map((s) => (
                <button key={s} onClick={() => changeStatus(viewing.id, s)} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Mark as {s}
                </button>
              ))}
              <button onClick={() => removeApplication(viewing.id)} disabled={deleting === viewing.id} className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5">
                {deleting === viewing.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {viewModal}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Online Admission</h2>
          <p className="text-xs text-gray-500 mt-0.5">Student Information / Online Admission</p>
        </div>
        {!loading && tab === "submitted" && applications.length > 0 && (
          <button onClick={exportCSV} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" />Export CSV
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("submitted")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === "submitted" ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <FileText className="h-4 w-4" />Submitted Applications
        </button>
        <button
          onClick={() => setTab("public")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === "public" ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <Globe className="h-4 w-4" />Public Admission Link
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      )}

      {!loading && (
        <>
          {tab === "public" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-[var(--primary)]/5 to-transparent">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Globe className="h-4 w-4 text-[var(--primary)]" />Public Admission Link</h3>
              <p className="text-xs text-gray-500 mt-0.5">Share this link directly with parents, or embed it on any website using an iframe.</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Admission URL</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 h-10 px-3 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-700 truncate">
                    <Link2 className="h-4 w-4 text-[var(--primary)] shrink-0" />
                    <span className="truncate">{publicUrl || "Loading..."}</span>
                  </div>
                  <button onClick={() => copy(publicUrl, "url")} className="h-10 px-4 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-1.5">
                    {copied === "url" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === "url" ? "Copied" : "Copy"}
                  </button>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="h-10 px-4 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />Open
                  </a>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">Public link for school code <span className="font-mono font-semibold text-gray-600">{code}</span>. Anyone with this link can apply for admission — no login required.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Embed on any website (iframe)</label>
                <div className="relative">
                  <pre className="w-full overflow-x-auto rounded-lg border border-gray-300 bg-gray-900 text-gray-100 text-xs p-3 font-mono leading-relaxed">{embedCode}</pre>
                  <button onClick={() => copy(embedCode, "embed")} className="absolute top-2 right-2 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-1.5">
                    {copied === "embed" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === "embed" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">Copy and paste this snippet into the HTML of your school website. The form renders in a responsive iframe.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Live Preview</label>
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                  <iframe src={publicUrl} width="100%" height="520" style={{ border: 0 }} loading="lazy" title="Online admission form preview" />
                </div>
              </div>
            </div>
          </div>
          )}

          {tab === "submitted" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800">Submitted Applications</h3>
              <p className="text-xs text-gray-500 mt-0.5">{applications.length} application{applications.length === 1 ? "" : "s"}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Ref No</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Student</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Class</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Contact</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Applied On</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">No applications yet. Share the public link to start receiving applications.</td></tr>
                  ) : (
                    applications.map((a) => (
                      <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{a.admission_no || "-"}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-800">{a.name}</p>
                          <p className="text-xs text-gray-400">{[a.father_name, a.mother_name].filter(Boolean).join(" / ") || "No parent info"}</p>
                          {a.student_id && (
                            <a href="/admin/student-information/student-details" className="inline-flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 font-medium mt-0.5">
                              <UserCheck className="h-3 w-3" />Converted to student
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{className(a.class_id)}{a.section ? ` · ${a.section}` : ""}</td>
                        <td className="px-4 py-2.5">
                          <p className="text-gray-700">{a.phone || a.mobile_number || "-"}</p>
                          <p className="text-xs text-gray-400">{a.email || ""}</p>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{fmtDate(a.created_at)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(a.status)}`}>{a.status}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setViewing(a)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="View full application"><Eye className="h-3.5 w-3.5" /></button>
                            {a.status !== "Approved" && (
                              <button onClick={() => changeStatus(a.id, "Approved")} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve & create student"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                            )}
                            {a.status !== "Rejected" && (
                              <button onClick={() => changeStatus(a.id, "Rejected")} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Reject"><XCircle className="h-3.5 w-3.5" /></button>
                            )}
                            <button onClick={() => removeApplication(a.id)} disabled={deleting === a.id} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete">
                              {deleting === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </>
      )}
    </div>
  )
}
