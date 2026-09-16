"use client"

import { useState, useMemo } from "react"
import { Plus, Star, Search, X, Award, Users, Calendar, Building2, Mail, Trash2, Pencil, Sparkles, TrendingUp, BookOpen } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Rating = {
  id: number
  teacherName: string
  teacher_name?: string
  department: string
  subject: string
  rating: number
  comments: string
  date: string
}

type Staff = {
  id: number
  staffId: string
  staff_id?: string
  name: string
  surname?: string
  email: string
  phone?: string
  contactNo?: string
  department: string
  designation?: string
  role: string
}

const avatarColors = ["bg-[var(--primary)]", "bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-rose-500", "bg-amber-500"]
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "T"

export default function TeachersRatingPage() {
  const { data: ratings, add, update, remove } = useApi<Rating>("/api/human-resource/teachers-rating")
  const { data: staffData } = useApi<Staff>("/api/human-resource/staff")

  const [searchRating, setSearchRating] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Rating | null>(null)
  const [teacherSearch, setTeacherSearch] = useState("")
  const [selectedTeacher, setSelectedTeacher] = useState<Staff | null>(null)
  const [ratingVal, setRatingVal] = useState(5)
  const [comments, setComments] = useState("")
  const [hoverStar, setHoverStar] = useState(0)

  // teachers list: staff where role or designation contains teacher
  const teachers = useMemo(() => {
    const all = staffData
    const filtered = all.filter((s) => {
      const r = String(s.role || "").toLowerCase()
      const d = String((s as any).designation || "").toLowerCase()
      return r.includes("teacher") || d.includes("teacher")
    })
    // fallback to all staff if no teachers found (so page never empty)
    return filtered.length ? filtered : all
  }, [staffData])

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase()
    if (!q) return teachers.slice(0, 8)
    return teachers.filter((s) => {
      const hay = [s.name, (s as any).surname, s.staffId, (s as any).staff_id, s.email, (s as any).phone, (s as any).contactNo, s.department, (s as any).designation, s.role].filter(Boolean).join(" ").toLowerCase()
      return hay.includes(q)
    }).slice(0, 12)
  }, [teacherSearch, teachers])

  const avgRating = useMemo(() => {
    if (ratings.length === 0) return 0
    return ratings.reduce((sum, r) => sum + Number(r.rating || 0), 0) / ratings.length
  }, [ratings])

  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0]
    for (const r of ratings) {
      const n = Math.round(Number(r.rating))
      if (n >= 1 && n <= 5) counts[n]++
    }
    return counts
  }, [ratings])

  const filteredRatings = useMemo(() => {
    const q = searchRating.trim().toLowerCase()
    if (!q) return ratings
    return ratings.filter((r) => {
      const name = (r.teacherName || (r as any).teacher_name || "").toLowerCase()
      const dept = String(r.department || "").toLowerCase()
      const subj = String(r.subject || "").toLowerCase()
      const com = String(r.comments || "").toLowerCase()
      return name.includes(q) || dept.includes(q) || subj.includes(q) || com.includes(q)
    })
  }, [ratings, searchRating])

  const handleOpenAdd = () => {
    setEditing(null)
    setSelectedTeacher(null)
    setTeacherSearch("")
    setRatingVal(5)
    setComments("")
    setHoverStar(0)
    setShowModal(true)
  }

  const handleOpenEdit = (r: Rating) => {
    setEditing(r)
    const tName = r.teacherName || (r as any).teacher_name || ""
    const found = teachers.find((t) => {
      const full = `${t.name} ${(t as any).surname || ""}`.trim().toLowerCase()
      return full === tName.toLowerCase() || t.name.toLowerCase() === tName.toLowerCase()
    })
    setSelectedTeacher(found || null)
    setTeacherSearch(tName)
    setRatingVal(Number(r.rating) || 5)
    setComments(r.comments || "")
    setShowModal(true)
  }

  const getTeacherDisplayName = (t: Staff) => `${t.name} ${(t as any).surname || ""}`.trim()
  const getDepartmentForTeacher = (t: Staff | null) => t?.department || ""

  const handleSave = async () => {
    const teacherName = selectedTeacher ? getTeacherDisplayName(selectedTeacher) : teacherSearch.trim()
    if (!teacherName) return
    if (ratingVal < 1 || ratingVal > 5) return
    const dept = getDepartmentForTeacher(selectedTeacher) || "General"
    const payload: any = { teacherName, department: dept, subject: "General", rating: ratingVal, comments: comments.trim(), date: new Date().toISOString().split("T")[0] }
    if (editing) {
      await update(editing.id, payload)
    } else {
      await add(payload)
    }
    setShowModal(false)
    setEditing(null)
    setSelectedTeacher(null)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Delete this rating?")) {
      await remove(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-[var(--primary)] px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Award className="h-4 w-4 text-white" /></span>
              Teachers Rating
            </h2>
            <p className="text-sm text-white/80 mt-1">Human Resource / Rate teachers from staff directory</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/90 text-xs bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20">
            <Users className="h-3.5 w-3.5" /> {teachers.length} teachers • {ratings.length} ratings
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm text-center">
          <p className="text-xs font-bold tracking-widest uppercase text-amber-700 flex items-center justify-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Average Rating</p>
          <p className="text-4xl font-black text-gray-800 mt-1">{avgRating.toFixed(1)}<span className="text-lg font-medium text-gray-400">/5</span></p>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className={`h-5 w-5 ${star <= Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">{ratings.length} total ratings</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-widest uppercase text-gray-500 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-[var(--primary)]" /> Distribution</p>
          <div className="mt-3 space-y-2">
            {[5, 4, 3, 2, 1].map((s) => {
              const cnt = distribution[s]
              const pct = ratings.length ? (cnt / ratings.length) * 100 : 0
              return (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className="w-6 font-medium text-gray-600">{s}★</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-gray-500">{cnt}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold tracking-widest uppercase text-gray-500 flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-blue-500" /> Quick Stats</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-lg font-bold text-gray-800">{teachers.length}</p>
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Teachers</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-lg font-bold text-gray-800">{ratings.length}</p>
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Ratings</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100">
              <p className="text-lg font-bold text-emerald-700">{distribution[5] + distribution[4]}</p>
              <p className="text-[11px] uppercase tracking-wide text-emerald-600">4★ & 5★</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 border border-red-100">
              <p className="text-lg font-bold text-red-700">{distribution[1] + distribution[2]}</p>
              <p className="text-[11px] uppercase tracking-wide text-red-600">1★ & 2★</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter + Add */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Search className="h-4 w-4 text-[var(--primary)]" /> Filter Ratings</h3>
          <button onClick={handleOpenAdd} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[var(--primary)] to-[#ff8a4a] text-white text-sm font-semibold rounded-xl shadow-md shadow-orange-200 hover:opacity-95">
            <Plus className="h-4 w-4" /> Add Rating
          </button>
        </div>
        <div className="p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchRating}
              onChange={(e) => setSearchRating(e.target.value)}
              placeholder="Search ratings by teacher name, department, subject or comments…"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white"
            />
            {searchRating && (
              <button onClick={() => setSearchRating("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">{filteredRatings.length} of {ratings.length} ratings • Teachers from staff directory ({teachers.length} available)</p>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">Rating List</h3>
          <span className="text-xs text-gray-500">{filteredRatings.length} records</span>
        </div>
        {filteredRatings.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 border"><Award className="h-6 w-6 text-gray-400" /></div>
            <p className="mt-3 text-sm font-medium text-gray-700">No ratings yet</p>
            <p className="text-xs text-gray-500 mt-1">Click Add Rating and search a teacher by name, ID or department</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRatings.map((r, idx) => {
              const tName = r.teacherName || (r as any).teacher_name || ""
              const dept = r.department || ""
              return (
                <div key={r.id} className="p-4 flex items-start gap-4 hover:bg-orange-50/30 transition-colors">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white text-xs font-bold shadow-sm shrink-0 ${avatarColors[idx % avatarColors.length]}`}>{initials(tName)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-gray-800">{tName}</p>
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-50 border rounded-full px-2 py-0.5"><Building2 className="h-3 w-3 text-gray-400" />{dept || "—"}</span>
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5 text-blue-700"><BookOpen className="h-3 w-3" />{r.subject || "General"}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Calendar className="h-3 w-3" />{r.date ? new Date(r.date).toLocaleDateString("en-IN") : "—"}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-4 w-4 ${star <= Number(r.rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                      ))}
                      <span className="ml-1 text-xs font-bold text-gray-700">{r.rating} /5</span>
                    </div>
                    {r.comments && <p className="text-sm text-gray-600 mt-1.5 bg-gray-50 rounded-xl px-3 py-2 border">“{r.comments}”</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleOpenEdit(r)} className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 text-xs text-gray-500">Showing {filteredRatings.length} of {ratings.length} records • Teachers from staff directory</div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" /> {editing ? "Edit Rating" : "Add Rating"}</h3>
                <p className="text-xs text-gray-500">Search teacher by any part of name, ID, phone, email, department</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Teacher <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={teacherSearch}
                    onChange={(e) => { setTeacherSearch(e.target.value); setSelectedTeacher(null) }}
                    placeholder="Type anything… e.g. Saikat, EMP001, 736485, Accounts, Teacher"
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                  />
                  {teacherSearch && (
                    <button onClick={() => { setTeacherSearch(""); setSelectedTeacher(null) }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button>
                  )}
                </div>
                {selectedTeacher ? (
                  <div className="mt-2 flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white text-xs font-bold">{initials(getTeacherDisplayName(selectedTeacher))}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-emerald-800">{getTeacherDisplayName(selectedTeacher)}</p>
                      <p className="text-xs text-emerald-700 flex flex-wrap gap-2"><span>{selectedTeacher.staffId || (selectedTeacher as any).staff_id}</span>•<span>{selectedTeacher.email}</span>•<span>{selectedTeacher.department || "—"}</span></p>
                    </div>
                    <span className="ml-auto text-xs font-bold text-emerald-700 flex items-center gap-1"><Mail className="h-3 w-3" />Selected</span>
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl border border-gray-200 bg-white max-h-[220px] overflow-y-auto divide-y divide-gray-100">
                    {filteredTeachers.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-500">No teachers found • Try another name or part</div>
                    ) : (
                      filteredTeachers.map((t) => (
                        <button key={t.id} onClick={() => { setSelectedTeacher(t); setTeacherSearch(getTeacherDisplayName(t)) }} className="w-full text-left flex items-center gap-3 p-3 hover:bg-orange-50 transition-colors">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700 text-xs font-bold border">{initials(getTeacherDisplayName(t))}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{getTeacherDisplayName(t)}</p>
                            <p className="text-xs text-gray-500 truncate">{t.staffId || (t as any).staff_id} • {t.email} • {t.department || "—"} • {t.role}</p>
                          </div>
                          <span className="ml-auto text-xs text-[var(--primary)] font-medium">Select</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">{teachers.length} teachers available • showing {filteredTeachers.length}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Rating <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onMouseEnter={() => setHoverStar(s)}
                      onMouseLeave={() => setHoverStar(0)}
                      onClick={() => setRatingVal(s)}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-all ${s <= (hoverStar || ratingVal) ? "bg-amber-400 border-amber-400 text-white shadow-md scale-105" : "bg-white border-gray-200 text-gray-300 hover:border-amber-200"}`}
                    >
                      <Star className={`h-5 w-5 ${s <= (hoverStar || ratingVal) ? "fill-white" : ""}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-bold text-gray-700">{ratingVal} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Comments</label>
                <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} placeholder="Enter comments about teaching, punctuality, behavior..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-gray-50/50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium border border-gray-200 bg-white rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={!((selectedTeacher || teacherSearch.trim()) && ratingVal >= 1)} className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-[var(--primary)] to-[#ff8a4a] text-white rounded-xl shadow-md disabled:opacity-40">Save Rating</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
