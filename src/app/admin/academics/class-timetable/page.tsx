"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Pencil, Trash2, X, Save, Clock } from "lucide-react"
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

const subjects = [
  "Mathematics", "Science", "English", "Hindi", "Social Studies",
  "Computer", "Physics", "Chemistry", "Biology", "History",
  "Geography", "Art", "Physical Education",
]

const teachers = [
  "Ms. Sunita Sharma", "Mr. Rajesh Verma", "Ms. Pooja Singh",
  "Mr. Vikram Joshi", "Mr. Amit Kumar",
]

const emptyEntry: Omit<TimetableEntry, "id"> = {
  day: "", period: 1, subject: "", teacher: "", startTime: "", endTime: "",
}

export default function ClassTimetablePage() {
  const { classes, sectionsOf } = useClassesAndSections();
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [searched, setSearched] = useState(false)
  const { data: entries, add, update, remove } = useApi<TimetableEntry>("/api/academics/timetable")

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
    days.forEach((d) => {
      map[d] = {}
      periods.forEach((p) => {
        const entry = entries.find((e) => e.day === d && e.period === p)
        if (entry) map[d][p] = entry
      })
    })
    return map
  }, [entries])

  const openAddModal = () => {
    setEditId(null)
    setFormData({ ...emptyEntry })
    setShowModal(true)
  }

  const openEditModal = (entry: TimetableEntry) => {
    setEditId(entry.id)
    setFormData({
      day: entry.day,
      period: entry.period,
      subject: entry.subject,
      teacher: entry.teacher,
      startTime: entry.startTime,
      endTime: entry.endTime,
    })
    setShowModal(true)
  }

  const handleSaveEntry = async () => {
    if (!formData.day || !formData.subject || !formData.teacher || !formData.startTime || !formData.endTime) return

    if (editId !== null) {
      await update(editId, formData)
    } else {
      await add(formData)
    }
    setShowModal(false)
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
    const entry = gridData[day]?.[period]
    if (!entry) return null
    return (
      <button
        onClick={() => openEditModal(entry)}
        className="w-full text-left p-1.5 rounded-md hover:bg-[var(--primary-light)] transition-colors min-h-[60px]"
      >
        <span className="text-xs font-semibold text-[var(--title-color)] block leading-tight">{entry.subject}</span>
        <span className="text-[10px] text-[var(--subtitle-color)] block leading-tight mt-0.5">{entry.teacher}</span>
        <span className="text-[9px] text-[var(--subtitle-color)]/70 block leading-tight mt-0.5">
          {entry.startTime} - {entry.endTime}
        </span>
      </button>
    )
  }

  const ModalOverlay = () => <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

  const sortedEntries = useMemo(() => {
    const dayOrder: Record<string, number> = {
      Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
    }
    return [...entries].sort((a, b) => {
      const dayDiff = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0)
      if (dayDiff !== 0) return dayDiff
      return a.period - b.period
    })
  }, [entries])

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Class Timetable</h2>
          <p className="text-sm text-white/70 mt-0.5">Academics / Class Timetable</p>
        </div>
      </div>

      <div className="glass-panel">
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--title-color)] flex items-center gap-2">
            <Search className="h-4 w-4 text-[var(--primary)]" /> Select Criteria
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--subtitle-color)]">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); setSearched(false) }}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)]"
              >
                <option value="">Select</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--subtitle-color)]">
                Section <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSection}
                onChange={(e) => { setSelectedSection(e.target.value); setSearched(false) }}
                disabled={!selectedClass}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)] disabled:opacity-50"
              >
                <option value="">Select</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1" />
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={!selectedClass || !selectedSection}
                className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
              >
                <Search className="h-4 w-4" /> Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {searched && (
        <>
          <div className="glass-panel">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--title-color)]">
                Weekly Timetable - {classes.find((c) => c.id === parseInt(selectedClass))?.name} ({selectedSection})
              </h3>
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Entry
              </button>
            </div>
            <div className="overflow-x-auto p-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-xs font-semibold text-[var(--subtitle-color)] uppercase border border-[var(--border)] bg-gray-50 dark:bg-gray-800/50 w-16">Period</th>
                    {days.map((day) => (
                      <th key={day} className="px-2 py-2 text-xs font-semibold text-[var(--subtitle-color)] uppercase border border-[var(--border)] bg-gray-50 dark:bg-gray-800/50">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={period}>
                      <td className="px-2 py-2 text-xs font-semibold text-[var(--title-color)] border border-[var(--border)] bg-gray-50 dark:bg-gray-800/50 text-center">
                        Period {period}
                      </td>
                      {days.map((day) => (
                        <td key={`${day}-${period}`} className="px-1 py-1 border border-[var(--border)] align-top min-w-[120px]">
                          {getCellContent(day, period)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--title-color)]">Timetable Entries</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[var(--border)]">
                    {["#", "Day", "Period", "Subject", "Teacher", "Time", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No timetable entries found</td>
                    </tr>
                  ) : (
                    sortedEntries.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        className={`border-b border-[var(--border)] hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${idx % 2 === 1 ? "bg-gray-50/30 dark:bg-gray-800/10" : ""}`}
                      >
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-[var(--title-color)]">{entry.day}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Period {entry.period}</td>
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{entry.subject}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{entry.teacher}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[var(--subtitle-color)]" />
                            {entry.startTime} - {entry.endTime}
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
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[var(--subtitle-color)]">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.startTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[var(--subtitle-color)]">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.endTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    placeholder="09:40 AM"
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)]"
                  />
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
    </div>
  )
}
