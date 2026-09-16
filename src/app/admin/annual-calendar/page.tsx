"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, X, Search, Save, Calendar, Filter, ChevronLeft, ChevronRight, Sparkles, Bot, Loader2 } from "lucide-react"
import { useApi } from "@/lib/use-api"

type EventType = "Holiday" | "Exam" | "Event" | "Meeting" | "Activity"

type CalendarEvent = {
  id: number
  title: string
  eventType: EventType
  fromDate: string
  toDate: string
  description: string
  isHoliday: boolean
}

const eventTypes: EventType[] = ["Holiday", "Exam", "Event", "Meeting", "Activity"]

const typeBadgeColors: Record<EventType, string> = {
  Holiday: "bg-blue-100 text-blue-700",
  Exam: "bg-red-100 text-red-700",
  Event: "bg-emerald-100 text-emerald-700",
  Meeting: "bg-amber-100 text-amber-700",
  Activity: "bg-purple-100 text-purple-700",
}



function getDuration(from: string, to: string): number {
  const d1 = new Date(from)
  const d2 = new Date(to)
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

export default function AnnualCalendarPage() {
  const { data: events, add, update, remove } = useApi<CalendarEvent>("/api/annual-calendar/event")
  const [filterType, setFilterType] = useState<string>("All")
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")
  const [searchPerformed, setSearchPerformed] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [form, setForm] = useState({ title: "", eventType: "" as EventType | "", fromDate: "", toDate: "", description: "", isHoliday: false })
  const [editForm, setEditForm] = useState({ id: 0, title: "", eventType: "" as EventType | "", fromDate: "", toDate: "", description: "", isHoliday: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = type === "checkbox" ? (e as React.ChangeEvent<HTMLInputElement>).target.checked : undefined
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = type === "checkbox" ? (e as React.ChangeEvent<HTMLInputElement>).target.checked : undefined
    setEditForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    if (editErrors[name]) setEditErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const searchFiltered = useMemo(() => {
    const q = filterType
    return events.filter((ev) => {
      if (q !== "All" && ev.eventType !== q) return false
      const evFrom = (ev.fromDate || "").slice(0,10)
      const evTo = (ev.toDate || "").slice(0,10)
      if (filterFrom && evTo && evTo < filterFrom.slice(0,10)) return false
      if (filterTo && evFrom && evFrom > filterTo.slice(0,10)) return false
      return true
    })
  }, [events, filterType, filterFrom, filterTo])

  const displayed = searchPerformed ? searchFiltered : events
  const calendarEvents = searchPerformed ? searchFiltered : events

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [expandedMonth, setExpandedMonth] = useState(() => new Date().getMonth())
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMsg, setAiMsg] = useState("")

  const totalEvents = events.length
  const totalHolidays = events.filter((e) => e.eventType === "Holiday" || e.isHoliday).length
  const totalExams = events.filter((e) => e.eventType === "Exam").length
  const totalMeetings = events.filter((e) => e.eventType === "Meeting").length

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i), [])
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]
  const weekDays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

  const isSameDateStr = (a: string, b: string) => a.slice(0,10) === b.slice(0,10)

  const eventsForDate = (dateStr: string) => {
    const source = calendarEvents
    return source.filter((e) => {
      const d = dateStr.slice(0,10)
      const from = (e.fromDate || "").slice(0,10)
      const to = (e.toDate || "").slice(0,10)
      return from && to && d >= from && d <= to
    })
  }

  const isHolidayDate = (dateStr: string) => eventsForDate(dateStr).some((e) => e.eventType === "Holiday" || e.isHoliday)

  const validateForm = (data: typeof form) => {
    const errs: Record<string, string> = {}
    if (!data.title.trim()) errs.title = "Title is required"
    if (!data.eventType) errs.eventType = "Event type is required"
    if (!data.fromDate) errs.fromDate = "From date is required"
    if (!data.toDate) errs.toDate = "To date is required"
    if (data.fromDate && data.toDate && data.fromDate > data.toDate) errs.toDate = "To date must be after from date"
    return errs
  }

  const handleAdd = async () => {
    const errs = validateForm(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    await add({ title: form.title.trim(), eventType: form.eventType as EventType, fromDate: form.fromDate, toDate: form.toDate, description: form.description.trim(), isHoliday: form.isHoliday })
    setShowAddModal(false)
    setForm({ title: "", eventType: "", fromDate: "", toDate: "", description: "", isHoliday: false })
  }

  const handleEditOpen = (ev: CalendarEvent) => {
    setEditForm({ id: ev.id, title: ev.title, eventType: ev.eventType, fromDate: ev.fromDate, toDate: ev.toDate, description: ev.description, isHoliday: ev.isHoliday })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs = validateForm(editForm)
    setEditErrors(errs)
    if (Object.keys(errs).length) return
    await update(editForm.id, { title: editForm.title.trim(), eventType: editForm.eventType as EventType, fromDate: editForm.fromDate, toDate: editForm.toDate, description: editForm.description.trim(), isHoliday: editForm.isHoliday })
    setShowEditModal(false)
  }

  const handleDeleteOpen = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }
  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  const getEvent = (id: number) => events.find((e) => e.id === id)

  const handleAIHolidays = async () => {
    setAiLoading(true)
    setAiMsg("")
    try {
      // Use AI from AI Settings (provider + key) to find holidays for this year
      let holidays: { date: string; localName: string; name: string }[] = []
      // 1) Try AI via /api/ai/holidays (uses configured provider from AI Settings)
      try {
        const aiRes = await fetch("/api/ai/holidays", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year: selectedYear }) })
        if (aiRes.ok) {
          const j = await aiRes.json()
          if (Array.isArray(j.holidays) && j.holidays.length) holidays = j.holidays
          else if (Array.isArray(j)) holidays = j
        }
      } catch {}
      // 2) Fallback to public search-engine-like API
      if (!holidays.length) {
        try {
          const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${selectedYear}/IN`)
          if (res.ok) holidays = await res.json()
        } catch {}
      }
      if (!holidays.length) {
        holidays = [
          { date: `${selectedYear}-01-26`, localName: "Republic Day", name: "Republic Day" },
          { date: `${selectedYear}-03-03`, localName: "Holi", name: "Holi" },
          { date: `${selectedYear}-08-15`, localName: "Independence Day", name: "Independence Day" },
          { date: `${selectedYear}-10-02`, localName: "Gandhi Jayanti", name: "Gandhi Jayanti" },
          { date: `${selectedYear}-10-20`, localName: "Dussehra", name: "Dussehra" },
          { date: `${selectedYear}-11-01`, localName: "Diwali", name: "Diwali" },
          { date: `${selectedYear}-12-25`, localName: "Christmas Day", name: "Christmas Day" },
        ]
      }
      const existingKeys = new Set(events.map((e) => `${e.fromDate.slice(0,10)}|${e.title.toLowerCase()}`))
      let added = 0
      for (const h of holidays.slice(0, 30)) {
        const date = (h.date || "").slice(0,10)
        const title = (h.localName || h.name || "Holiday").trim()
        if (!date || !title) continue
        const key = `${date}|${title.toLowerCase()}`
        if (existingKeys.has(key)) continue
        if (events.some((e) => e.fromDate.slice(0,10) === date && (e.eventType === "Holiday" || e.isHoliday) && e.title.toLowerCase() === title.toLowerCase())) continue
        await add({ title, eventType: "Holiday" as EventType, fromDate: date, toDate: date, description: `AI holiday: ${title} (${date})`, isHoliday: true } as any)
        existingKeys.add(key)
        added++
      }
      setAiMsg(added ? `Added ${added} AI holidays for ${selectedYear} ✓` : `All ${holidays.length} holidays already on calendar`)
    } catch (e: any) {
      setAiMsg(e.message || "Failed to fetch holidays")
    } finally {
      setAiLoading(false)
      setTimeout(() => setAiMsg(""), 4000)
    }
  }

  const summaryCards = [
    { label: "Total Events", count: totalEvents, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Holidays", count: totalHolidays, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Exams", count: totalExams, color: "bg-red-50 text-red-700 border-red-200" },
    { label: "Meetings", count: totalMeetings, color: "bg-amber-50 text-amber-700 border-amber-200" },
  ]

  const Modal = ({ title, show, onClose, children }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full mx-4 max-w-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
          </div>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Annual Calendar / Events</h2>
          <p className="text-sm text-white/80 mt-0.5">Calendar / Annual Calendar</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Select Criteria</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Event Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="All">All</option>
                {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">From Date</label>
              <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">To Date</label>
              <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={() => setSearchPerformed(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
                <Search className="h-4 w-4" /> Search
              </button>
              <button onClick={() => { setFilterType("All"); setFilterFrom(""); setFilterTo(""); setSearchPerformed(false) }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-xl border ${card.color} px-4 py-3`}>
            <p className="text-xs font-medium opacity-80">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.count}</p>
          </div>
        ))}
      </div>

      {/* 12 Month Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow"><Calendar className="h-5 w-5" /></span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">Annual Calendar {selectedYear}</h3>
              <p className="text-xs text-slate-500">12 months · holidays highlighted · click a day to add event</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedYear((y) => y - 1)} className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button>
            <span className="min-w-[80px] text-center text-sm font-black text-slate-900 bg-white border border-slate-200 rounded-full px-4 py-1">{selectedYear}</span>
            <button onClick={() => setSelectedYear((y) => y + 1)} className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50"><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => setSelectedYear(new Date().getFullYear())} className="ml-1 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold">Today</button>
            <button onClick={handleAIHolidays} disabled={aiLoading} className="ml-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-black shadow disabled:opacity-50">
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />} AI Holidays
            </button>
          </div>
        </div>
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-500" /> Holiday</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blue-500" /> Holiday badge</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-100 border border-red-200" /> Exam</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-100 border border-emerald-200" /> Event</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-100 border border-amber-200" /> Meeting</span>
          <span className="ml-auto text-slate-400">{calendarEvents.filter((e) => { const y = new Date(e.fromDate).getFullYear(); return y === selectedYear || new Date(e.toDate).getFullYear() === selectedYear }).length} {searchPerformed ? "filtered" : ""} events in {selectedYear}</span>
          {searchPerformed && <button onClick={() => { setFilterType("All"); setFilterFrom(""); setFilterTo(""); setSearchPerformed(false) }} className="text-xs font-bold text-violet-600 hover:underline">Clear filter</button>}
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/40">
          {months.map((m) => {
            const firstDay = new Date(selectedYear, m, 1).getDay()
            const daysInMonth = new Date(selectedYear, m + 1, 0).getDate()
            const todayStr = new Date().toISOString().slice(0,10)
            const isExpanded = m === expandedMonth
            const isRecent = m === new Date().getMonth() && selectedYear === new Date().getFullYear()
            return (
              <div key={m} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${isExpanded ? "lg:col-span-2 border-orange-300 shadow-lg ring-2 ring-orange-200" : isRecent ? "border-orange-200 ring-1 ring-orange-100" : "border-slate-200"}`}>
                <button onClick={() => setExpandedMonth(m)} className={`w-full px-3 py-2 flex items-center justify-between text-left transition-colors ${isExpanded ? "bg-gradient-to-r from-orange-500 to-amber-500" : "bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700"}`}>
                  <h4 className="text-xs font-black tracking-widest uppercase text-white flex items-center gap-2">{monthNames[m]} {selectedYear} {isExpanded && <span className="bg-white text-orange-600 text-[10px] px-1.5 py-0.5 rounded-full">BIG</span>} {isRecent && <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">Recent</span>}</h4>
                  <span className="text-[11px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">{calendarEvents.filter((e) => { const d = new Date(e.fromDate); const t = new Date(e.toDate); const ms = new Date(selectedYear, m, 1); const me = new Date(selectedYear, m+1, 0); return d <= me && t >= ms }).length} events</span>
                </button>
                <div className="grid grid-cols-7 gap-px bg-slate-100">
                  {weekDays.map((w) => (
                    <div key={w} className={`bg-slate-50 text-center py-1.5 text-[10px] font-black tracking-widest ${isExpanded ? "text-slate-700" : "text-slate-500"}`}>{w}</div>
                  ))}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className={`bg-white ${isExpanded ? "h-[92px]" : "h-[64px]"}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const day = idx + 1
                    const date = new Date(selectedYear, m, day)
                    const dateStr = `${selectedYear}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                    const dayEvents = eventsForDate(dateStr)
                    const isToday = dateStr === todayStr
                    const isHoliday = dayEvents.some((e) => e.eventType === "Holiday" || e.isHoliday)
                    const isWeekend = date.getDay() === 0
                    return (
                      <button
                        key={day}
                        onClick={() => { setForm({ title: "", eventType: "Holiday", fromDate: dateStr, toDate: dateStr, description: "", isHoliday: true }); setShowAddModal(true) }}
                        className={`p-1 flex flex-col text-left hover:bg-orange-50 transition-colors relative ${isExpanded ? "h-[92px] p-1.5" : "h-[64px] p-1"} ${isToday ? "ring-2 ring-orange-400 ring-inset" : ""} ${isHoliday ? "bg-red-50/70" : "bg-white"} ${isWeekend && !isHoliday ? "bg-slate-50" : ""}`}
                        title={dayEvents.length ? dayEvents.map((e) => `${e.title} (${e.eventType})`).join(", ") : "Click to add event"}
                      >
                        <span className={`inline-flex items-center justify-center rounded-full font-bold ${isExpanded ? "h-7 w-7 text-sm" : "h-6 w-6 text-xs"} ${isToday ? "bg-orange-500 text-white" : isHoliday ? "bg-red-500 text-white" : isWeekend ? "text-red-500" : "text-slate-700"}`}>{day}</span>
                        <div className={`mt-1 space-y-0.5 overflow-hidden ${isExpanded ? "" : "hidden sm:block"}`}>
                          {dayEvents.slice(0, isExpanded ? 3 : 1).map((ev) => (
                            <span key={ev.id} className={`block truncate rounded px-1 py-0.5 font-bold leading-none border ${isExpanded ? "text-[10px]" : "text-[8px]"} ${ev.eventType === "Holiday" || ev.isHoliday ? "bg-red-500 text-white border-red-600" : typeBadgeColors[ev.eventType] + " border-current/20"}`}>
                              {ev.title}
                            </span>
                          ))}
                          {dayEvents.length > (isExpanded ? 3 : 1) && <span className={`block font-bold text-slate-500 ${isExpanded ? "text-[10px]" : "text-[8px]"}`}>+{dayEvents.length - (isExpanded ? 3 : 1)} more</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-700">
            {searchPerformed ? "Search Results" : "Events List"}
            <span className="ml-2 text-xs font-normal text-gray-400">({displayed.length} records)</span>
          </h3>
          <div className="flex items-center gap-2">
            {aiMsg && <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">{aiMsg}</span>}
            <button onClick={handleAIHolidays} disabled={aiLoading} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-full hover:shadow-md disabled:opacity-50 shadow">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {aiLoading ? "Finding..." : `AI Holidays ${selectedYear}`}
            </button>
            <button onClick={() => { setForm({ title: "", eventType: "", fromDate: "", toDate: "", description: "", isHoliday: false }); setErrors({}); setShowAddModal(true) }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
              <Plus className="h-4 w-4" /> Add Event
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Title", "Event Type", "From Date", "To Date", "Duration", "Description", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No events found</td></tr>
              ) : (
                displayed.map((ev, idx) => (
                  <tr key={ev.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{ev.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadgeColors[ev.eventType]}`}>
                        {ev.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ev.fromDate}</td>
                    <td className="px-4 py-3 text-gray-600">{ev.toDate}</td>
                    <td className="px-4 py-3 text-gray-600">{getDuration(ev.fromDate, ev.toDate)} days</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{ev.description || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditOpen(ev)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteOpen(ev.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          <span>Showing {displayed.length} of {events.length} records</span>
        </div>
      </div>

      <Modal title="Add Event" show={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Title <span className="text-red-500">*</span></label>
            <input type="text" name="title" value={form.title} onChange={handleFormChange} placeholder="Enter event title"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Event Type <span className="text-red-500">*</span></label>
              <select name="eventType" value={form.eventType} onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.eventType && <p className="text-red-500 text-xs mt-1">{errors.eventType}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Is Holiday</label>
              <div className="flex items-center h-[38px]">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" name="isHoliday" checked={form.isHoliday} onChange={handleFormChange}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                  Mark as Holiday
                </label>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">From Date <span className="text-red-500">*</span></label>
              <input type="date" name="fromDate" value={form.fromDate} onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.fromDate && <p className="text-red-500 text-xs mt-1">{errors.fromDate}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">To Date <span className="text-red-500">*</span></label>
              <input type="date" name="toDate" value={form.toDate} onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.toDate && <p className="text-red-500 text-xs mt-1">{errors.toDate}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Description</label>
            <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Enter description" rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <Modal title="Edit Event" show={showEditModal} onClose={() => setShowEditModal(false)}>
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Title <span className="text-red-500">*</span></label>
            <input type="text" name="title" value={editForm.title} onChange={handleEditFormChange} placeholder="Enter event title"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            {editErrors.title && <p className="text-red-500 text-xs mt-1">{editErrors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Event Type <span className="text-red-500">*</span></label>
              <select name="eventType" value={editForm.eventType} onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {editErrors.eventType && <p className="text-red-500 text-xs mt-1">{editErrors.eventType}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Is Holiday</label>
              <div className="flex items-center h-[38px]">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" name="isHoliday" checked={editForm.isHoliday} onChange={handleEditFormChange}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                  Mark as Holiday
                </label>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">From Date <span className="text-red-500">*</span></label>
              <input type="date" name="fromDate" value={editForm.fromDate} onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {editErrors.fromDate && <p className="text-red-500 text-xs mt-1">{editErrors.fromDate}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">To Date <span className="text-red-500">*</span></label>
              <input type="date" name="toDate" value={editForm.toDate} onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {editErrors.toDate && <p className="text-red-500 text-xs mt-1">{editErrors.toDate}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Description</label>
            <textarea name="description" value={editForm.description} onChange={handleEditFormChange} placeholder="Enter description" rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleEditSave} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">Are you sure you want to delete this event?
                {deleteId && <strong className="block mt-1 text-gray-800">{getEvent(deleteId)?.title}</strong>}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"><X className="h-4 w-4" /> Cancel</button>
              <button onClick={confirmDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
