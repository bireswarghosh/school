"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  GraduationCap,
  Search,
  Loader2,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  Star,
  Play,
  X,
  ExternalLink,
} from "lucide-react"
import { useCurrency } from "@/lib/currency-context"

type Course = {
  id: number; title: string; description: string; thumbnail: string;
  teacher: string; free: boolean; price: number; discount: number;
  categoryId: number; category: string; enrolled: boolean; enrolledAt: string;
}

export default function OnlineCoursesPage() {
  const { symbol } = useCurrency()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [filterCat, setFilterCat] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")
  const [savedMsg, setSavedMsg] = useState("")
  const [error, setError] = useState("")
  const [viewCourse, setViewCourse] = useState<Course | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/my/student/online-courses")
      const d = await res.json()
      setCourses(d.courses || [])
    } catch { setCourses([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const categories = useMemo(() => {
    const cats = new Set(courses.map(c => c.category).filter(Boolean))
    return ["All", ...Array.from(cats)]
  }, [courses])

  const filtered = useMemo(() => {
    return courses.filter(c => {
      const q = query.toLowerCase()
      if (q && !c.title?.toLowerCase().includes(q) && !c.teacher?.toLowerCase().includes(q) && !c.category?.toLowerCase().includes(q)) return false
      if (filterCat !== "All" && c.category !== filterCat) return false
      if (filterStatus === "Enrolled" && !c.enrolled) return false
      if (filterStatus === "Not Enrolled" && c.enrolled) return false
      return true
    })
  }, [courses, query, filterCat, filterStatus])

  const enrolledCount = courses.filter(c => c.enrolled).length

  const enroll = async (courseId: number) => {
    try {
      const res = await fetch("/api/my/student/online-courses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      })
      const d = await res.json()
      if (res.ok) {
        setSavedMsg(d.message || "Enrolled successfully")
        setTimeout(() => setSavedMsg(""), 2000)
        load()
      } else {
        setError(d.error || "Failed to enroll")
        setTimeout(() => setError(""), 3000)
      }
    } catch { setError("Network error"); setTimeout(() => setError(""), 3000) }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-5 shadow-sm">
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-20 h-20 w-20 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white">Online Courses</h1>
            <p className="mt-0.5 text-sm text-white/80">Browse and enroll in courses to learn online</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
        <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
          <div className="flex items-center gap-2 mb-1"><BookOpen className="h-4 w-4" style={{ color: "var(--primary)" }} /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Total Courses</span></div>
          <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{courses.length}</p>
        </div>
        <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
          <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Enrolled</span></div>
          <p className="text-xl font-bold text-green-600">{enrolledCount}</p>
        </div>
        <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
          <div className="flex items-center gap-2 mb-1"><Star className="h-4 w-4 text-amber-500" /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Available</span></div>
          <p className="text-xl font-bold text-amber-600">{courses.length - enrolledCount}</p>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {savedMsg && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{savedMsg}</div>}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--subtitle-color)]" />
          <input type="search" placeholder="Search courses..." value={query} onChange={e => setQuery(e.target.value)}
            className="pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--subtitle-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-64" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)]">
          {categories.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)]">
          {["All", "Enrolled", "Not Enrolled"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          <span className="text-sm text-[var(--subtitle-color)]">Loading courses...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <GraduationCap className="h-12 w-12 text-[var(--primary-light)]" />
          <p className="text-sm text-[var(--subtitle-color)]">{query ? "No matching courses." : "No courses available."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(course => (
            <div key={course.id} className="group rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:shadow-lg transition-all hover:border-[var(--primary)]">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-900">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5">
                    <GraduationCap className="h-12 w-12 text-[var(--primary)]/40" />
                  </div>
                )}
                {/* Price badge */}
                <div className="absolute top-2 left-2">
                  {course.free ? (
                    <span className="px-2.5 py-1 rounded-lg bg-green-500 text-white text-xs font-bold">FREE</span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-[var(--primary)] text-white text-xs font-bold">{symbol}{course.price}</span>
                  )}
                </div>
                {/* Enrolled badge */}
                {course.enrolled && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2.5 py-1 rounded-lg bg-green-500/90 text-white text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />Enrolled
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {course.category && (
                  <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--primary-light)] text-[var(--primary)]">
                    {course.category}
                  </span>
                )}
                <h3 className="font-semibold text-sm text-[var(--foreground)] line-clamp-2 leading-snug">{course.title || "Untitled Course"}</h3>
                {course.teacher && (
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-[8px] font-bold">
                      {course.teacher.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-xs text-[var(--subtitle-color)]">{course.teacher}</span>
                  </div>
                )}
                {course.description && (
                  <p className="text-xs text-[var(--subtitle-color)] line-clamp-2">{course.description}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                  {course.enrolled ? (
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-100 text-green-700 text-xs font-semibold cursor-default">
                      <CheckCircle2 className="h-3.5 w-3.5" />Enrolled
                    </button>
                  ) : (
                    <button onClick={() => enroll(course.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity">
                      <Play className="h-3.5 w-3.5" />Enroll Now
                    </button>
                  )}
                  <button onClick={() => setViewCourse(course)}
                    className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors text-xs font-semibold">
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {viewCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewCourse(null)} />
          <div className="relative bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10 border border-[var(--border)]">
            {/* Header */}
            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-5">
              <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white"><GraduationCap className="h-5 w-5" /></span>
                  <div><h3 className="text-lg font-bold text-white">{viewCourse.title}</h3><p className="text-xs text-white/70">{viewCourse.category || "General"}</p></div>
                </div>
                <button onClick={() => setViewCourse(null)} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Teacher", v: viewCourse.teacher },
                  { l: "Category", v: viewCourse.category },
                  { l: "Price", v: viewCourse.free ? "Free" : `${symbol}${viewCourse.price}` },
                  { l: "Status", v: viewCourse.enrolled ? "Enrolled" : "Not Enrolled" },
                ].map(item => (
                  <div key={item.l} className="rounded-xl p-3 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>{item.l}</span>
                    <p className="text-sm font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{item.v || "—"}</p>
                  </div>
                ))}
              </div>
              {viewCourse.description && (
                <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Description</span>
                  <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{viewCourse.description}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-2">
              {viewCourse.enrolled ? (
                <span className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-green-100 text-green-700 text-sm font-semibold"><CheckCircle2 className="h-4 w-4" />Already Enrolled</span>
              ) : (
                <button onClick={() => { enroll(viewCourse.id); setViewCourse(null) }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                  <Play className="h-4 w-4" />Enroll Now
                </button>
              )}
              <button onClick={() => setViewCourse(null)} className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--primary-light)] transition-colors" style={{ color: "var(--foreground)" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
