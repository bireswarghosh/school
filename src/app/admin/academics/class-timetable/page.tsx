"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Plus, Pencil, Trash2, X, Save, Clock, Calendar, Check } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type TimetableEntry = {
  id: number
  day: string
  period: number
  subject: string
  teacher: string
  startTime: string
  endTime: string
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const periods = [1, 2, 3, 4, 5, 6, 7, 8]

type SubjectLite = { id: number; name: string }

type StaffLite = { id: number; staffId: string; name: string; surname?: string; email: string; role: string; designation?: string; department?: string; phone?: string; contactNo?: string }

const emptyEntry: Omit<TimetableEntry, "id"> = {
  day: "", period: 1, subject: "", teacher: "", startTime: "", endTime: "",
}

function toTimeInput(v: string): string {
  if (!v) return ""
  const s = String(v).trim()
  if (/^\d{1,2}:\d{2}$/.test(s)) return s.padStart(5, "0")
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (m) {
    let h = parseInt(m[1], 10)
    const min = m[2]
    const ap = m[3].toUpperCase()
    if (ap === "PM" && h !== 12) h += 12
    if (ap === "AM" && h === 12) h = 0
    return `${String(h).padStart(2, "0")}:${min}`
  }
  return s
}

function formatTimeDisplay(v: string): string {
  if (!v) return ""
  const s = String(v).trim()
  if (/AM|PM/i.test(s)) return s
  const m = s.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return s
  let h = parseInt(m[1], 10)
  const min = m[2]
  const ap = h >= 12 ? "PM" : "AM"
  h = h % 12 || 12
  return `${String(h).padStart(2, "0")}:${min} ${ap}`
}

export default function ClassTimetablePage() {
  const { classes, sections, sectionsOf } = useClassesAndSections();
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [searched, setSearched] = useState(false)
  const { data: entries, add, update, remove } = useApi<TimetableEntry>("/api/academics/timetable")
  const { data: staffData } = useApi<StaffLite>("/api/human-resource/staff")
  const { data: subjectsData } = useApi<SubjectLite>("/api/academics/subject")
  const teachers = useMemo(() => {
    const all = (staffData || []) as any[]
    // strict: only staff with role Teacher (from /admin/human-resource/staff-directory)
    const teacherStaff = all.filter((s: any) => String(s.role || "").toLowerCase() === "teacher")
    const base = teacherStaff
    const names = base.map((s: any) => `${s.name || ""}${s.surname ? " " + s.surname : ""}`.trim()).filter(Boolean)
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))
  }, [staffData])
  const subjects = useMemo(() => (subjectsData || []).map((s) => s.name).filter(Boolean).sort((a, b) => a.localeCompare(b)), [subjectsData])
  const [teacherSearch, setTeacherSearch] = useState("")
  const [selectedTeacherFromDir, setSelectedTeacherFromDir] = useState<string | null>(null)
  const [showTeacherList, setShowTeacherList] = useState(false)
  const [teacherListCell, setTeacherListCell] = useState<{ day: string; period: number; entry: TimetableEntry | null } | null>(null)
  useEffect(() => {
    try {
      const v = localStorage.getItem("selectedTeacher")
      if (v) setSelectedTeacherFromDir(v)
    } catch {}
  }, [])
  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase()
    if (!q) return teachers
    return teachers.filter((t) => t.toLowerCase().includes(q))
  }, [teachers, teacherSearch])

  const teachersForClass = useMemo(() => {
    if (!selectedClass) return teachers
    const cid = parseInt(selectedClass)
    const classEntries = entries.filter((e: any) => {
      const ecid = e.classId ?? e.class_id
      return String(ecid) === String(cid)
    })
    const uniq = Array.from(new Set(classEntries.map((e: any) => e.teacher).filter(Boolean))) as string[]
    return uniq.length ? uniq : teachers
  }, [entries, selectedClass, teachers])

  const openTeacherList = (day: string, period: number, entry: TimetableEntry | null) => {
    setTeacherListCell({ day, period, entry })
    setShowTeacherList(true)
  }

  const handleAssignTeacher = async (newTeacher: string) => {
    if (!teacherListCell) return
    const { day, period, entry } = teacherListCell
    if (entry) {
      await update(entry.id, { teacher: newTeacher })
      setShowTeacherList(false)
      setTeacherListCell(null)
    } else {
      // create new entry for empty cell with selected teacher
      const payload: any = {
        day,
        period,
        subject: "General",
        teacher: newTeacher,
        startTime: "09:00",
        endTime: "09:45",
      }
      if (selectedClass) {
        const cid = parseInt(selectedClass)
        if (!Number.isNaN(cid)) payload.classId = cid
      }
      if (selectedSection) {
        const sec = sections.find((s) => s.name === selectedSection && String(s.class_id) === String(selectedClass))
        if (sec) payload.sectionId = sec.id
      }
      await add(payload)
      setShowTeacherList(false)
      setTeacherListCell(null)
    }
  }

  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Omit<TimetableEntry, "id">>({ ...emptyEntry })

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const availableSections = selectedClass ? sectionsOf(parseInt(selectedClass)).map((s) => s.name) : []

  const handleSearch = () => {
    if (!selectedClass || !selectedSection) return
    setSearched(true)
  }

  const gridData = useMemo(() => {
    const map: Record<string, Record<number, TimetableEntry>> = {}
    const filtered = searched && selectedClass && selectedSection
      ? entries.filter((e: any) => {
          const cid = e.classId ?? e.class_id ?? e.classId
          const sid = e.sectionId ?? e.section_id
          if (String(cid) !== String(selectedClass)) return false
          // if sections not yet loaded, don't filter by section yet (show class entries)
          if (!sections.length) return true
          if (sid == null) {
            // fallback: if entry has no section id, treat as matching if no sections exist for class? otherwise hide
            return false
          }
          const sec = sections.find((s) => String(s.id) === String(sid))
          if (sec) return sec.name === selectedSection && String(sec.class_id) === String(selectedClass)
          // fallback to direct id match via class-specific lookup
          const classSecs = sections.filter((s) => String(s.class_id) === String(selectedClass))
          const target = classSecs.find((s) => s.name === selectedSection)
          if (!target) return false
          return String(sid) === String(target.id)
        })
      : entries
    days.forEach((d) => {
      map[d] = {}
      periods.forEach((p) => {
        const entry = filtered.find((e) => e.day === d && e.period === p)
        if (entry) map[d][p] = entry
      })
    })
    return map
  }, [entries, searched, selectedClass, selectedSection, classes, sections])

  const openAddModal = (day?: string, period?: number) => {
    setEditId(null)
    const initialTeacher = selectedTeacherFromDir && teachers.includes(selectedTeacherFromDir) ? selectedTeacherFromDir : ""
    setFormData({ ...emptyEntry, teacher: initialTeacher, day: day || emptyEntry.day, period: period || emptyEntry.period })
    setTeacherSearch(initialTeacher)
    setFormError("")
    setShowModal(true)
  }

  const openEditModal = (entry: TimetableEntry) => {
    setEditId(entry.id)
    setFormData({
      day: entry.day,
      period: entry.period,
      subject: entry.subject,
      teacher: entry.teacher,
      startTime: toTimeInput(entry.startTime),
      endTime: toTimeInput(entry.endTime),
    })
    setTeacherSearch(entry.teacher || "")
    setFormError("")
    setShowModal(true)
  }

  const [formError, setFormError] = useState("")

  const handleSaveEntry = async () => {
    if (!formData.day) { setFormError("Day is required"); return }
    if (!formData.subject) { setFormError("Subject is required"); return }
    if (!formData.teacher) { setFormError("Teacher is required"); return }
    if (!formData.startTime) { setFormError("Start Time is required"); return }
    if (!formData.endTime) { setFormError("End Time is required"); return }
    // validate start < end
    if (formData.startTime >= formData.endTime) { setFormError("End Time must be after Start Time"); return }
    setFormError("")
    // include class/section context from current selection if available (only IDs, not names - DB has no class_name column)
    const payload: any = { ...formData }
    if (selectedClass) {
      const cid = parseInt(selectedClass)
      if (!Number.isNaN(cid)) payload.classId = cid
    }
    if (selectedSection) {
      const sec = sections.find(s => s.name === selectedSection && String(s.class_id) === String(selectedClass))
      if (sec) payload.sectionId = sec.id
    }
    try {
      if (editId !== null) {
        await update(editId, payload)
      } else {
        await add(payload)
      }
      setShowModal(false)
      setFormError("")
    } catch (e: any) {
      setFormError(e.message || "Failed to save")
    }
  }

  const openDeleteModal = (id: number) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  const getCellContent = (day: string, period: number) => {
    const entry: any = gridData[day]?.[period]
    if (!entry) return (
      <button
        onClick={() => openAddModal(day, period)}
        className="w-full min-h-[78px] flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors group"
        title="Click to add Subject + Teacher for this period"
      >
        <span className="text-[11px] font-bold text-gray-400 group-hover:text-orange-600">+ Add Subject & Teacher</span>
        <span className="text-[10px] text-gray-300">Period {period} · {day}</span>
      </button>
    )
    const subj = entry.subject ?? entry.subject_name ?? entry.subjectName ?? ""
    const teach = entry.teacher ?? entry.teacher_name ?? entry.teacherName ?? ""
    const st = (entry.startTime ?? entry.start_time ?? "") as string
    const et = (entry.endTime ?? entry.end_time ?? "") as string
    return (
      <div
        onClick={() => openEditModal(entry)}
        className="w-full p-2 rounded-xl hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-all min-h-[96px] flex flex-col justify-center gap-1 cursor-pointer group/cell"
        title="Click to edit period"
      >
        <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-widest uppercase text-orange-700 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full w-fit truncate max-w-full" title={subj || "—"}>
          {subj || "—"}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); openTeacherList(day, period, entry) }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:text-violet-700 text-left leading-tight"
          title="Click to change teacher — assigned to class"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-[10px] font-bold shadow-sm shrink-0">{teach ? teach.split(" ").filter(Boolean).map((s: string)=>s[0]).join("").slice(0,2) : "—"}</span>
          <span className="truncate group-hover/cell:text-violet-700">{teach || "—"}</span>
        </button>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-full shadow-sm w-fit">
          <Clock className="h-3 w-3 text-gray-400" />{(st || et) ? `${formatTimeDisplay(st)} – ${formatTimeDisplay(et)}` : "— —"}
        </span>
      </div>
    )
  }

  const ModalOverlay = () => <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

  const sortedEntries = useMemo(() => {
    const dayOrder: Record<string, number> = {
      Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
    }
    const filtered = searched && selectedClass && selectedSection
      ? entries.filter((e: any) => {
          const cid = e.classId ?? e.class_id
          const sid = e.sectionId ?? e.section_id
          if (String(cid) !== String(selectedClass)) return false
          if (!sections.length) return true
          if (sid == null) return false
          const sec = sections.find((s) => String(s.id) === String(sid))
          if (sec) return sec.name === selectedSection && String(sec.class_id) === String(selectedClass)
          const classSecs = sections.filter((s) => String(s.class_id) === String(selectedClass))
          const target = classSecs.find((s) => s.name === selectedSection)
          if (!target) return false
          return String(sid) === String(target.id)
        })
      : entries
    return [...filtered].sort((a, b) => {
      const dayDiff = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0)
      if (dayDiff !== 0) return dayDiff
      return a.period - b.period
    })
  }, [entries, searched, selectedClass, selectedSection, sections])

  const statsTotal = entries.length
  const statsDays = new Set(entries.map(e => e.day)).size

  const uniqueTeachers = new Set(entries.map((e: any) => e.teacher).filter(Boolean)).size
  const uniqueSubjects = new Set(entries.map((e: any) => e.subject).filter(Boolean)).size

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] via-[#ff7a3a] to-[#ff9a5c] px-6 py-6 shadow-lg">
        <div className="absolute left-1/3 top-1/2 -translate-y-1/2 opacity-10 hidden lg:block"><Clock className="h-28 w-28 text-white" /></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Clock className="h-4 w-4 text-white" /></span>
              Class Timetable
            </h2>
            <p className="text-sm text-white/80 mt-1">Academics / Period × Day — teacher with time • {classes.length} classes • {uniqueTeachers} teachers</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/90 text-xs bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20">
            <Calendar className="h-3.5 w-3.5" /> {statsTotal} periods • {uniqueSubjects} subjects
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-orange-600"><Clock className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-orange-500" /></div>
          <p className="text-2xl font-black text-orange-700 mt-2">{statsTotal}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-orange-600/70">Total Periods</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-blue-600"><Calendar className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-blue-500" /></div>
          <p className="text-2xl font-black text-blue-700 mt-2">{statsDays}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-blue-600/70">Days Covered</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-emerald-600"><Search className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-emerald-500" /></div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{uniqueTeachers}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-emerald-600/70">Teachers</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-violet-600"><Search className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-violet-500" /></div>
          <p className="text-2xl font-black text-violet-700 mt-2">{uniqueSubjects}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-violet-600/70">Subjects</p>
        </div>
      </div>

      {selectedTeacherFromDir && (
        <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="text-sm text-emerald-800 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white"><Search className="h-4 w-4" /></span>
            Selected teacher from Staff Directory: <strong>{selectedTeacherFromDir}</strong> — will be pre-filled when you add a period
          </span>
          <button onClick={() => { try { localStorage.removeItem("selectedTeacher"); localStorage.removeItem("selectedTeacherId"); } catch {}; setSelectedTeacherFromDir(null); setTeacherSearch("") }} className="text-xs font-bold text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-white border border-transparent hover:border-emerald-200">Clear</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white"><Search className="h-4 w-4" /></span>
          <h3 className="text-sm font-bold text-gray-800">Select Criteria</h3>
          <span className="ml-auto text-xs text-gray-400 hidden sm:inline">{classes.length} classes • {sections.length} sections</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-600">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); setSearched(false) }}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white shadow-sm"
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-600">
                Section <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSection}
                onChange={(e) => { setSelectedSection(e.target.value); setSearched(false) }}
                disabled={!selectedClass}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white shadow-sm disabled:opacity-50"
              >
                <option value="">Select section</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 hidden md:block" />
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={!selectedClass || !selectedSection}
                className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:opacity-95 shadow-md disabled:opacity-50"
              >
                <Search className="h-4 w-4" /> Search Timetable
              </button>
            </div>
          </div>
        </div>
      </div>

      {searched && (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" /> Weekly Timetable - {classes.find((c) => c.id === parseInt(selectedClass))?.name} ({selectedSection})
              </h3>
              <button
                onClick={() => openAddModal()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full hover:opacity-95 shadow-md"
              >
                <Plus className="h-3.5 w-3.5" /> Add Period
              </button>
            </div>
            <div className="overflow-x-auto p-3 bg-white">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="px-2 py-3 text-xs font-bold text-gray-700 uppercase border border-gray-300 bg-gray-100 w-16">Period</th>
                    {days.map((day) => (
                      <th key={day} className="px-2 py-3 text-xs font-bold text-gray-700 uppercase border border-gray-300 bg-gray-100">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={period}>
                      <td className="px-2 py-3 text-xs font-bold text-gray-800 border border-gray-300 bg-gray-50 text-center">
                        Period {period}
                      </td>
                      {days.map((day) => (
                        <td key={`${day}-${period}`} className="px-1 py-1 border border-gray-200 bg-white align-top min-w-[130px]">
                          {getCellContent(day, period)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white"><Calendar className="h-4 w-4" /></span>
              <h3 className="text-sm font-bold text-gray-800">Timetable Entries</h3>
              <span className="ml-auto text-xs bg-white border px-2.5 py-1 rounded-full font-medium">{sortedEntries.length} records</span>
            </div>
            <div className="overflow-x-auto bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    {["#", "Day", "Period", "Subject — Teacher", "Time", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-500 text-sm bg-gray-50">No timetable entries found</td>
                    </tr>
                  ) : (
                    sortedEntries.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        className={`border-b border-gray-200 hover:bg-orange-50/50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : "bg-white"}`}
                      >
                        <td className="px-4 py-3 text-gray-500 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-gray-800">{entry.day}</td>
                        <td className="px-4 py-3"><span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{entry.period}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {(() => { const s = (entry as any).subject ?? (entry as any).subject_name ?? (entry as any).subjectName ?? ""; const t = (entry as any).teacher ?? (entry as any).teacher_name ?? (entry as any).teacherName ?? ""; return (<>
                            <span className="inline-flex items-center gap-1 text-xs font-black tracking-wide text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full w-fit">{s || "—"}</span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-1 rounded-full w-fit">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white text-[10px] font-bold">{t ? t.split(" ").filter(Boolean).map((x: string)=>x[0]).join("").slice(0,2) : "—"}</span>
                              {t || "—"}
                            </span>
                            </> )})()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm">
                            <Clock className="h-3 w-3 text-gray-500" />
                            {(() => { const st = (entry as any).startTime ?? (entry as any).start_time ?? ""; const et = (entry as any).endTime ?? (entry as any).end_time ?? ""; return (st || et) ? `${formatTimeDisplay(st)} – ${formatTimeDisplay(et)}` : "— —"; })()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => openEditModal(entry)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(entry.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--subtitle-color)] bg-gray-50/50">
              <span>Showing {sortedEntries.length} records</span>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowModal(false)}><ModalOverlay /></div>
          <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-lg z-10 border border-[var(--border)]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold text-[var(--title-color)]">
                {editId !== null ? "Edit Timetable Entry" : "Add Timetable Entry"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[var(--subtitle-color)]">
                    Day <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData((prev) => ({ ...prev, day: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)]"
                  >
                    <option value="">Select Day</option>
                    {days.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[var(--subtitle-color)]">
                    Period <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData((prev) => ({ ...prev, period: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)]"
                  >
                    {periods.map((p) => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[var(--subtitle-color)]">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)]"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[var(--subtitle-color)]">
                    Teacher <span className="text-red-500">*</span>
                  </label>
                  {teachers.length > 0 ? (
                    <select
                      value={formData.teacher}
                      onChange={(e) => setFormData((prev) => ({ ...prev, teacher: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)]"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.teacher}
                      onChange={(e) => setFormData((prev) => ({ ...prev, teacher: e.target.value }))}
                      placeholder="Enter teacher name"
                      className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)]"
                    />
                  )}
                  <p className="text-[11px] text-gray-400">{teachers.length ? `${teachers.length} teachers available — select one` : "No staff found for this school — type teacher name"}</p>
                </div>
              </div>
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[var(--subtitle-color)]">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)]"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">Tap to pick time</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[var(--subtitle-color)]">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)]"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">Must be after start</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-[var(--border)] flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-[var(--border)] rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSaveEntry} className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors">
                <Save className="h-3.5 w-3.5" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowDeleteModal(false)}><ModalOverlay /></div>
          <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-lg z-10 border border-[var(--border)]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold text-[var(--title-color)]">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-sm text-gray-600">Are you sure you want to delete this timetable entry?</p>
              {deleteId !== null && (
                <p className="text-sm font-semibold text-[var(--title-color)] mt-1">
                  {entries.find((e) => e.id === deleteId)?.subject} - {entries.find((e) => e.id === deleteId)?.day} (Period {entries.find((e) => e.id === deleteId)?.period})
                </p>
              )}
            </div>
            <div className="px-5 py-3 border-t border-[var(--border)] flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-[var(--border)] rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showTeacherList && teacherListCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTeacherList(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden z-10 flex flex-col">
            <div className="px-5 py-4 border-b bg-gradient-to-r from-violet-50 to-indigo-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Search className="h-4 w-4 text-violet-600" />Teachers for {classes.find(c=>String(c.id)===String(selectedClass))?.name || "Class"} {selectedSection ? `(${selectedSection})` : ""}</h3>
                <p className="text-xs text-gray-500">{teacherListCell.day} • Period {teacherListCell.period} {teacherListCell.entry ? `• ${formatTimeDisplay(teacherListCell.entry.startTime)} – ${formatTimeDisplay(teacherListCell.entry.endTime)}` : ""} • {teacherListCell.entry?.subject || "General"}</p>
              </div>
              <button onClick={() => setShowTeacherList(false)} className="p-1.5 hover:bg-white rounded-xl"><X className="h-4 w-4 text-gray-500" /></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {teacherListCell.entry && (
                <div className="mb-4 p-3 rounded-xl bg-violet-50 border border-violet-200">
                  <p className="text-xs font-bold text-violet-700">Currently Assigned</p>
                  <p className="text-sm font-bold text-gray-800 mt-1 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white text-xs font-bold">{(teacherListCell.entry.teacher || "").split(" ").filter(Boolean).map(s=>s[0]).join("").slice(0,2) || "—"}</span>
                    {teacherListCell.entry.teacher || "—"}
                    <span className="ml-auto text-xs font-medium bg-white border px-2 py-0.5 rounded-full">{teacherListCell.entry.subject || "General"}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock className="h-3 w-3" />{formatTimeDisplay(teacherListCell.entry.startTime)} – {formatTimeDisplay(teacherListCell.entry.endTime)}</p>
                </div>
              )}
              <p className="text-xs font-bold text-gray-600 mb-2">Teachers assigned for this class ({teachersForClass.length})</p>
              <div className="space-y-1.5 mb-4">
                {teachersForClass.map((t) => {
                  const isCurrent = teacherListCell.entry?.teacher === t
                  return (
                    <button key={t} onClick={() => handleAssignTeacher(t)} className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${isCurrent ? "bg-violet-600 border-violet-600 text-white shadow-md" : "bg-white border-gray-200 hover:border-violet-200 hover:bg-violet-50"}`}>
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${isCurrent ? "bg-white/20 text-white" : "bg-violet-100 text-violet-700"}`}>{t.split(" ").map(s=>s[0]).join("").slice(0,2)}</span>
                      <span className={`text-sm font-medium ${isCurrent ? "text-white" : "text-gray-800"}`}>{t}</span>
                      {isCurrent && <Check className="ml-auto h-4 w-4 text-white" />}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs font-bold text-gray-500 mb-2">All teachers ({teachers.length})</p>
              <div className="space-y-1">
                {teachers.map((t) => {
                  const isAssigned = teachersForClass.includes(t)
                  const isCurrent = teacherListCell.entry?.teacher === t
                  if (isAssigned) return null
                  return (
                    <button key={t} onClick={() => handleAssignTeacher(t)} className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 text-xs font-bold">{t.split(" ").map(s=>s[0]).join("").slice(0,2)}</span>
                      <span className="text-sm text-gray-700">{t}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="px-5 py-3 border-t bg-gray-50/50 flex justify-end">
              <button onClick={() => setShowTeacherList(false)} className="px-4 py-2 text-xs font-bold border border-gray-200 bg-white rounded-xl hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
