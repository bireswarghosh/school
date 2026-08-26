"use client"

import { useState, useMemo } from "react"
import { Plus, Star, Search, X } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Rating = {
  id: number
  teacherName: string
  department: string
  subject: string
  rating: number
  comments: string
  date: string
}

const departments = ["Science", "Mathematics", "English", "Admin", "Transport"]
const teacherOptions = ["Ms. Sunita Sharma", "Mr. Rajesh Verma", "Ms. Pooja Singh", "Ms. Neha Patel", "Mr. Deepak Yadav"]

const getDepartmentForTeacher = (name: string): string => {
  const map: Record<string, string> = {
    "Ms. Sunita Sharma": "Science", "Mr. Rajesh Verma": "Mathematics", "Ms. Pooja Singh": "English",
    "Ms. Neha Patel": "Science", "Mr. Deepak Yadav": "Transport"
  }
  return map[name] || ""
}

export default function TeachersRatingPage() {
  const { data: ratings, add, update, remove, loading } = useApi<Rating>("/api/human-resource/teachers-rating")
  const [filterDept, setFilterDept] = useState("")
  const [filterTeacher, setFilterTeacher] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Rating | null>(null)
  const [form, setForm] = useState({ teacherName: teacherOptions[0], rating: "5", comments: "" })

  const avgRating = useMemo(() => {
    if (ratings.length === 0) return 0
    return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
  }, [ratings])

  const filtered = ratings.filter((r) => {
    if (filterDept && r.department !== filterDept) return false
    if (filterTeacher && r.teacherName !== filterTeacher) return false
    return true
  })

  const handleOpenAdd = () => {
    setEditing(null)
    setForm({ teacherName: teacherOptions[0], rating: "5", comments: "" })
    setShowModal(true)
  }

  const handleOpenEdit = (r: Rating) => {
    setEditing(r)
    setForm({ teacherName: r.teacherName, rating: r.rating.toString(), comments: r.comments })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.teacherName || !form.rating) return
    const ratingVal = parseInt(form.rating)
    if (ratingVal < 1 || ratingVal > 5) return
    const dept = getDepartmentForTeacher(form.teacherName)
    if (editing) {
      await update(editing.id, { teacherName: form.teacherName, department: dept, rating: ratingVal, comments: form.comments })
    } else {
      await add({ teacherName: form.teacherName, department: dept, subject: "General", rating: ratingVal, comments: form.comments, date: new Date().toISOString().split("T")[0] })
    }
    setShowModal(false)
    setEditing(null)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Delete this rating?")) {
      await remove(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Teachers Rating</h2>
          <p className="text-sm text-white/70 mt-0.5">Human Resource / Teachers Rating</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 text-center">
        <p className="text-sm text-gray-500 mb-1">Average Rating</p>
        <p className="text-3xl font-bold text-gray-800">{avgRating.toFixed(1)}</p>
        <div className="flex items-center justify-center gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={`h-5 w-5 ${star <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Search className="h-4 w-4 text-[var(--primary)]" /> Filter Ratings
          </h3>
          <button onClick={handleOpenAdd} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90">
            <Plus className="h-4 w-4" /> Add Rating
          </button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All Teachers</option>
              {teacherOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Rating List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Teacher Name", "Department", "Subject", "Rating", "Comments", "Date", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr key={r.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.teacherName}</td>
                  <td className="px-4 py-3 text-gray-600">{r.department}</td>
                  <td className="px-4 py-3 text-gray-600">{r.subject}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-4 w-4 ${star <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                      ))}
                      <span className="ml-1.5 text-xs text-gray-500">({r.rating})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">{r.comments}</td>
                  <td className="px-4 py-3 text-gray-600">{r.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleOpenEdit(r)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg">Edit</button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No ratings found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">Showing {filtered.length} of {ratings.length} records</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{editing ? "Edit Rating" : "Add Rating"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teacher <span className="text-red-500">*</span></label>
                <select value={form.teacherName} onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  {teacherOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rating (1-5) <span className="text-red-500">*</span></label>
                <input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Comments</label>
                <textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} rows={3} placeholder="Enter comments"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 rounded-lg">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
