"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { CheckCircle, User, Smartphone, RotateCcw, Camera, X, QrCode, ScanLine, Users, Clock, AlertTriangle, Search, Sparkles, Timer, Coffee, UserCheck } from "lucide-react"
import { useSchoolSettings } from "@/lib/use-school-settings"

interface Person {
  id: string
  name: string
  type: "student" | "staff"
  class?: string
  section?: string
  role?: string
  email?: string
}

interface AttendanceLog {
  id: string
  personId: string
  name: string
  type: string
  time: string
  date: string
  status: string
}

const getInitials = (n: string) => n.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase()
const nowTime = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
const todayISO = () => new Date().toISOString().split("T")[0]

const statusStyle: Record<string, string> = {
  Present: "bg-emerald-500 text-white border-emerald-600",
  Late: "bg-amber-500 text-white border-amber-600",
  "Half Day": "bg-orange-500 text-white border-orange-600",
}

export default function QRAttendancePage() {
  const { settings } = useSchoolSettings("qrattendance.")
  const [autoMode, setAutoMode] = useState(true)
  const [scannerActive, setScannerActive] = useState(false)
  const [scannedPerson, setScannedPerson] = useState<Person | null>(null)
  const [prevScannedId, setPrevScannedId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null)
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [manualInput, setManualInput] = useState("")
  const [showManual, setShowManual] = useState(false)
  const [peopleDb, setPeopleDb] = useState<Person[]>([])
  const [loadingPeople, setLoadingPeople] = useState(true)

  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrRef = useRef<any>(null)
  const rescanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // hydrate autoMode from settings
  useEffect(() => {
    if (settings["autoAttendance"] === "disabled") setAutoMode(false)
    else if (settings["autoAttendance"] === "enabled") setAutoMode(true)
  }, [settings])

  // load real people from APIs
  useEffect(() => {
    const load = async () => {
      try {
        const [staffRes, studentRes] = await Promise.all([
          fetch("/api/human-resource/staff").then(r => r.ok ? r.json() : []).catch(() => []),
          fetch("/api/students?limit=100").then(r => r.ok ? r.json() : []).catch(() => []),
        ])
        const staff: Person[] = (Array.isArray(staffRes) ? staffRes : []).slice(0, 80).map((s: any) => ({
          id: String(s.staffId || s.staff_id || s.id),
          name: `${s.name || ""}${s.surname ? " " + s.surname : ""}`.trim() || s.email || "Staff",
          type: "staff" as const,
          role: s.role || s.designation || "Staff",
        }))
        // handle student response shape
        const stuArr = Array.isArray(studentRes) ? studentRes : (studentRes as any)?.students || (studentRes as any)?.data || []
        const students: Person[] = (stuArr as any[]).slice(0, 120).map((s: any) => ({
          id: String(s.admissionNo || s.admission_no || s.rollNo || s.id),
          name: s.name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || "Student",
          type: "student" as const,
          class: s.class || s.className || s.class_name || "",
          section: s.section || s.sectionName || "",
        }))
        const combined = [...students, ...staff]
        if (combined.length === 0) throw new Error("empty")
        setPeopleDb(combined)
      } catch {
        // fallback demo
        setPeopleDb([
          { id: "ADM001", name: "Alice Johnson", type: "student", class: "Class 1", section: "A" },
          { id: "ADM002", name: "Bob Smith", type: "student", class: "Class 2", section: "B" },
          { id: "STF001", name: "John Doe", type: "staff", role: "Teacher" },
          { id: "STF002", name: "Jane Smith", type: "staff", role: "Librarian" },
        ])
      } finally {
        setLoadingPeople(false)
      }
    }
    load()
    // load today's logs from server
    const loadLogs = async () => {
      try {
        const r = await fetch("/api/qr-attendance")
        if (r.ok) {
          const data = await r.json()
          const arr = Array.isArray(data) ? data : []
          const today = todayISO()
          const mapped: AttendanceLog[] = arr.slice(0, 30).map((x: any) => ({
            id: String(x.id),
            personId: String(x.person_id || x.personId || x.staff_id || ""),
            name: x.name || x.person_name || "Unknown",
            type: x.type || "student",
            time: x.time || (x.created_at ? new Date(x.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : nowTime()),
            date: x.date || x.created_at?.slice(0, 10) || today,
            status: x.status || "Present",
          }))
          if (mapped.length) setLogs(mapped)
        }
      } catch {}
    }
    loadLogs()
  }, [])

  const findPerson = (id: string): Person | undefined => {
    const q = id.trim().toLowerCase()
    return peopleDb.find(p => p.id.toLowerCase() === q || p.name.toLowerCase().includes(q) || p.name.toLowerCase() === q)
  }

  const persistLog = async (person: Person, status: string) => {
    try {
      await fetch("/api/qr-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_id: person.id, name: person.name, type: person.type, status, time: nowTime(), date: todayISO() }),
      })
    } catch {}
  }

  const submitAttendance = useCallback((person: Person, status: string) => {
    const entry: AttendanceLog = {
      id: `LOG-${Date.now()}`,
      personId: person.id,
      name: person.name,
      type: person.type,
      time: nowTime(),
      date: todayISO(),
      status,
    }
    setLogs(prev => [entry, ...prev])
    setScannedPerson(null)
    setPrevScannedId(person.id)
    setSelectedStatus("")
    setMessage({ text: `Attendance marked for ${person.name} as ${status}`, type: "success" })
    persistLog(person, status)

    if (rescanTimerRef.current) clearTimeout(rescanTimerRef.current)
    rescanTimerRef.current = setTimeout(() => {
      setMessage(null)
      setPrevScannedId(null)
    }, 4500)
  }, [])

  const handleScanResult = useCallback((decodedText: string) => {
    stopScanner()
    const person = findPerson(decodedText)
    if (!person) {
      setMessage({ text: `No record found for QR: ${decodedText}`, type: "error" })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    if (prevScannedId === person.id) {
      setMessage({ text: `Already marked as ${logs.find(l => l.personId === person.id)?.status || "Present"}`, type: "info" })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    if (autoMode) {
      const hour = new Date().getHours()
      const status = hour < 12 ? "Present" : hour < 15 ? "Late" : "Half Day"
      submitAttendance(person, status)
    } else {
      setScannedPerson(person)
      setSelectedStatus("")
      setMessage(null)
    }
  }, [autoMode, prevScannedId, logs, peopleDb])

  const startScanner = useCallback(() => {
    if (typeof window === "undefined") return
    if (html5QrRef.current) return
    setScannerActive(true)
    setScannedPerson(null)
    import("html5-qrcode").then(({ Html5Qrcode }) => {
      const el = scannerRef.current
      if (!el) return
      const scanner = new Html5Qrcode("qr-scanner-view")
      html5QrRef.current = scanner
      const facing = settings["cameraType"] === "front" ? "user" : "environment"
      scanner.start(
        { facingMode: facing },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => handleScanResult(decodedText),
        () => {}
      ).catch(() => setScannerActive(false))
    }).catch(() => setScannerActive(false))
  }, [handleScanResult, settings])

  const stopScanner = useCallback(() => {
    if (html5QrRef.current) {
      try { html5QrRef.current.stop().catch(() => {}) } catch {}
      try { html5QrRef.current.clear().catch(() => {}) } catch {}
      html5QrRef.current = null
    }
    setScannerActive(false)
  }, [])

  useEffect(() => {
    startScanner()
    return () => {
      stopScanner()
      if (rescanTimerRef.current) clearTimeout(rescanTimerRef.current)
    }
  }, [])

  // keep scanner in sync with autoMode changes - clear scanned person
  useEffect(() => { setScannedPerson(null); setSelectedStatus("") }, [autoMode])

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return
    const person = findPerson(manualInput)
    if (!person) {
      setMessage({ text: `No record found for "${manualInput}"`, type: "error" })
      setTimeout(() => setMessage(null), 2500)
      return
    }
    setManualInput("")
    setShowManual(false)
    if (prevScannedId === person.id) {
      setMessage({ text: `Already marked as ${logs.find(l => l.personId === person.id)?.status || "Present"}`, type: "info" })
      return
    }
    if (autoMode) {
      const hour = new Date().getHours()
      const status = hour < 12 ? "Present" : hour < 15 ? "Late" : "Half Day"
      submitAttendance(person, status)
    } else {
      setScannedPerson(person)
      setSelectedStatus("")
    }
  }

  const todayStats = {
    total: logs.length,
    present: logs.filter(l => l.status === "Present").length,
    late: logs.filter(l => l.status === "Late").length,
    halfday: logs.filter(l => l.status === "Half Day").length,
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 px-6 py-5 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 opacity-10 hidden lg:block"><QrCode className="h-28 w-28 text-white" /></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><QrCode className="h-4 w-4 text-white" /></span>
              QR Code Attendance
            </h2>
            <p className="text-sm text-white/80 mt-1">Scan QR to mark attendance • {peopleDb.length} people • {todayISO()}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/90 text-xs bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20">
            <Clock className="h-3.5 w-3.5" /> {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}
          </div>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm border shadow-sm ${
          message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
          message.type === "error" ? "bg-red-50 text-red-800 border-red-200" :
          "bg-sky-50 text-sky-800 border-sky-200"
        }`}>
          {message.type === "success" ? <CheckCircle className="h-5 w-5 flex-shrink-0" /> :
           message.type === "error" ? <X className="h-5 w-5 flex-shrink-0" /> :
           <ScanLine className="h-5 w-5 flex-shrink-0" />}
          <span className="font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto p-1 hover:bg-black/5 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mode:</span>
          <div className="flex rounded-full bg-gray-100 p-1">
            <button onClick={() => setAutoMode(true)} className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${autoMode ? "bg-[var(--primary)] text-white shadow" : "text-gray-600"}`}>Auto</button>
            <button onClick={() => setAutoMode(false)} className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${!autoMode ? "bg-[var(--primary)] text-white shadow" : "text-gray-600"}`}>Manual</button>
          </div>
        </div>
        <div className="h-6 w-px bg-gray-200 hidden sm:block" />
        <span className="text-xs text-gray-500 hidden md:inline">{autoMode ? "Auto: Present/Late by time" : "Manual: choose Present/Late/Half Day"}</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => { stopScanner(); setTimeout(startScanner, 200) }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full shadow hover:opacity-95">
            <RotateCcw className="h-3.5 w-3.5" /> Rescan
          </button>
          <button onClick={() => setShowManual(!showManual)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border ${showManual ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
            <Smartphone className="h-3.5 w-3.5" /> Manual Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><ScanLine className="h-4 w-4 text-[var(--primary)]" /> QR Scanner</h3>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${scannerActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>{scannerActive ? "Active" : "Idle"}</span>
            </div>
            <div className="p-4">
              <div ref={scannerRef} id="qr-scanner-view"
                className="w-full max-w-md mx-auto aspect-square bg-gray-900 rounded-2xl overflow-hidden relative shadow-inner border-4 border-gray-900">
                {/* frame */}
                <div className="pointer-events-none absolute inset-6 border-2 border-white/40 rounded-2xl" />
                <div className="pointer-events-none absolute inset-6 flex items-center justify-center">
                  <div className="h-16 w-16 border-white/60 rounded-xl" />
                </div>
                {!scannerActive && !scannedPerson && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-900">
                    <Camera className="h-12 w-12 mb-2 opacity-60" />
                    <p className="text-sm">Starting camera...</p>
                    <button onClick={startScanner}
                      className="mt-3 px-4 py-1.5 bg-white text-gray-900 text-xs font-bold rounded-full hover:bg-gray-100">
                      Retry
                    </button>
                  </div>
                )}
              </div>

              <div className="max-w-md mx-auto mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" /> Place QR inside frame • {loadingPeople ? "Loading people..." : `${peopleDb.length} people ready`}
              </div>

              {showManual && (
                <div className="max-w-md mx-auto mt-4 p-3 rounded-2xl bg-gray-50 border">
                  <label className="text-xs font-bold text-gray-600 flex items-center gap-1"><Search className="h-3.5 w-3.5" /> Manual Entry — search by ID or name</label>
                  <div className="flex gap-2 mt-2">
                    <input type="text" value={manualInput} onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Try: ADM001, STF001, Alice, John…"
                      className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-200 focus:border-violet-400 bg-white"
                      onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()} />
                    <button onClick={handleManualSubmit}
                      className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black">
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {scannedPerson && !autoMode && (
            <div className="bg-white rounded-2xl border border-violet-200 shadow-md overflow-hidden animate-in fade-in">
              <div className="px-5 py-3 border-b bg-gradient-to-r from-violet-50 to-indigo-50 flex items-center gap-2">
                <User className="h-4 w-4 text-violet-600" />
                <h3 className="text-sm font-bold text-violet-900">Student / Staff Details</h3>
                <span className="ml-auto text-xs bg-violet-600 text-white px-2 py-1 rounded-full font-bold">{scannedPerson.type}</span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                    {getInitials(scannedPerson.name)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-bold text-gray-800 truncate">{scannedPerson.name}</h4>
                    <p className="text-sm text-gray-500 truncate">
                      {scannedPerson.type === "student" ? `${scannedPerson.class || "—"} - ${scannedPerson.section || "—"}` : scannedPerson.role}
                    </p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mt-1 bg-gray-900 text-white">
                      <QrCode className="h-3 w-3" />{scannedPerson.id} ({scannedPerson.type})
                    </span>
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-600 mb-2">Mark Attendance:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { k: "Present", cls: "bg-emerald-500 hover:bg-emerald-600 text-white", icon: UserCheck },
                    { k: "Late", cls: "bg-amber-500 hover:bg-amber-600 text-white", icon: Timer },
                    { k: "Half Day", cls: "bg-orange-500 hover:bg-orange-600 text-white", icon: Coffee },
                  ].map(({ k, cls, icon: Icon }) => (
                    <button key={k} onClick={() => submitAttendance(scannedPerson, k)}
                      className={`flex flex-col items-center gap-1 px-3 py-3 text-sm font-bold rounded-xl border-2 transition-all ${selectedStatus === k ? "ring-2 ring-[var(--primary)] scale-105" : "border-transparent"} ${cls} shadow-sm`}>
                      <Icon className="h-5 w-5" />{k}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Users className="h-4 w-4 text-[var(--primary)]" /> Today's Stats</h3>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {[
                { label: "Total", value: todayStats.total, bg: "bg-violet-50", color: "text-violet-600" },
                { label: "Present", value: todayStats.present, bg: "bg-emerald-50", color: "text-emerald-600" },
                { label: "Late", value: todayStats.late, bg: "bg-amber-50", color: "text-amber-600" },
                { label: "Half Day", value: todayStats.halfday, bg: "bg-orange-50", color: "text-orange-600" },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border`}>
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500"><Clock className="h-3.5 w-3.5" />{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short" })} • Auto: {autoMode ? "On" : "Off"}</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><Clock className="h-4 w-4 text-[var(--primary)]" /> Today's Log</h3>
              <span className="text-xs bg-white border px-2 py-1 rounded-full font-medium">{logs.length}</span>
            </div>
            <div className="max-h-[340px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border"><AlertTriangle className="h-5 w-5 text-gray-400" /></div>
                  <p className="mt-2 text-sm font-medium text-gray-600">No attendance yet</p>
                  <p className="text-xs text-gray-400">Scan a QR to start</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm ${log.type === "student" ? "bg-blue-500" : "bg-purple-500"}`}>{getInitials(log.name)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{log.name}</p>
                        <p className="text-xs text-gray-500 truncate">{log.personId} • {log.time} • {log.date}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusStyle[log.status] || "bg-gray-100"}`}>{log.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
