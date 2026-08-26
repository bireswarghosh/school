"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { CheckCircle, User, Smartphone, RotateCcw, Camera, X, QrCode } from "lucide-react"

interface Person {
  id: string
  name: string
  type: "student" | "staff"
  class?: string
  section?: string
  role?: string
}

interface AttendanceLog {
  id: string
  personId: string
  name: string
  type: string
  time: string
  status: string
}

const peopleDb: Person[] = [
  { id: "ADM001", name: "Alice Johnson", type: "student", class: "Class 1", section: "A" },
  { id: "ADM002", name: "Bob Smith", type: "student", class: "Class 2", section: "B" },
  { id: "ADM003", name: "Charlie Brown", type: "student", class: "Class 3", section: "A" },
  { id: "ADM004", name: "Diana Prince", type: "student", class: "Class 4", section: "C" },
  { id: "ADM005", name: "Eve Miller", type: "student", class: "Class 5", section: "B" },
  { id: "STF001", name: "John Doe", type: "staff", role: "Teacher" },
  { id: "STF002", name: "Jane Smith", type: "staff", role: "Librarian" },
  { id: "STF003", name: "Robert Wilson", type: "staff", role: "Admin" },
]

const getInitials = (n: string) => n.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase()
const now = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })

export default function QRAttendancePage() {
  const [autoMode, setAutoMode] = useState(true)
  const [scannerActive, setScannerActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scannedPerson, setScannedPerson] = useState<Person | null>(null)
  const [prevScannedId, setPrevScannedId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null)
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [manualInput, setManualInput] = useState("")
  const [showManual, setShowManual] = useState(false)

  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrRef = useRef<any>(null)
  const rescanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const findPerson = (id: string): Person | undefined =>
    peopleDb.find(p => p.id.toLowerCase() === id.trim().toLowerCase())

  const submitAttendance = useCallback((person: Person, status: string) => {
    const entry: AttendanceLog = {
      id: `LOG-${Date.now()}`,
      personId: person.id,
      name: person.name,
      type: person.type,
      time: now(),
      status,
    }
    setLogs(prev => [entry, ...prev])
    setScannedPerson(null)
    setPrevScannedId(person.id)
    setSelectedStatus("")
    setMessage({ text: `Attendance Submitted Successfully as ${status}`, type: "success" })

    if (rescanTimerRef.current) clearTimeout(rescanTimerRef.current)
    rescanTimerRef.current = setTimeout(() => {
      setMessage(null)
      setPrevScannedId(null)
      startScanner()
    }, 5000)
  }, [])

  const handleScanResult = useCallback((decodedText: string) => {
    stopScanner()
    setScanning(false)

    const person = findPerson(decodedText)
    if (!person) {
      setMessage({ text: `No record found for QR code: ${decodedText}`, type: "error" })
      setTimeout(() => { setMessage(null); startScanner() }, 3000)
      return
    }

    if (prevScannedId === person.id) {
      setMessage({ text: `Attendance has already been submitted as ${logs.find(l => l.personId === person.id)?.status || "Present"}`, type: "info" })
      setTimeout(() => { setMessage(null); startScanner() }, 3000)
      return
    }

    if (autoMode) {
      const hour = new Date().getHours()
      const status = hour < 12 ? "Present" : hour < 15 ? "Late" : "Half Day"
      submitAttendance(person, status)
      startScanner()
    } else {
      setScannedPerson(person)
      setSelectedStatus("")
      setMessage(null)
    }
  }, [autoMode, prevScannedId, logs, submitAttendance])

  const startScanner = useCallback(() => {
    if (typeof window === "undefined") return
    if (html5QrRef.current) return

    setScannerActive(true)
    setScannedPerson(null)
    setShowManual(false)

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      const el = scannerRef.current
      if (!el) return

      const scanner = new Html5Qrcode("qr-scanner-view")
      html5QrRef.current = scanner

      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScanResult(decodedText)
        },
        () => {}
      ).catch(() => {
        setScannerActive(false)
      })
    }).catch(() => {
      setScannerActive(false)
    })
  }, [handleScanResult])

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

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return
    const person = findPerson(manualInput)
    if (!person) {
      setMessage({ text: `No record found for "${manualInput}"`, type: "error" })
      return
    }
    setManualInput("")
    setShowManual(false)
    if (prevScannedId === person.id) {
      setMessage({ text: `Attendance has already been submitted as ${logs.find(l => l.personId === person.id)?.status || "Present"}`, type: "info" })
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
    total: logs.filter(l => l.time.startsWith(new Date().toLocaleDateString().slice(0, 10))).length || logs.length,
    present: logs.filter(l => l.status === "Present").length,
    late: logs.filter(l => l.status === "Late").length,
    halfday: logs.filter(l => l.status === "Half Day").length,
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">QR Code Attendance</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">QR Code Attendance / Attendance</p>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm border ${
          message.type === "success" ? "bg-green-50 text-green-800 border-green-200" :
          message.type === "error" ? "bg-red-50 text-red-800 border-red-200" :
          "bg-blue-50 text-blue-800 border-blue-200"
        }`}>
          {message.type === "success" ? <CheckCircle className="h-5 w-5 flex-shrink-0" /> :
           message.type === "error" ? <X className="h-5 w-5 flex-shrink-0" /> :
           <QrCode className="h-5 w-5 flex-shrink-0" />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="attMode" checked={autoMode} onChange={() => setAutoMode(true)}
            className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]" />
          <span className="text-sm text-gray-700">Auto Attendance</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="attMode" checked={!autoMode} onChange={() => { setAutoMode(false); setScannedPerson(null) }}
            className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]" />
          <span className="text-sm text-gray-700">Manual Attendance</span>
        </label>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => { stopScanner(); startScanner() }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--primary)] bg-[var(--primary-light)] hover:bg-[var(--primary-light)] rounded-lg transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Rescan QR Code / Barcode
          </button>
          <button onClick={() => setShowManual(!showManual)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
            <Smartphone className="h-3.5 w-3.5" /> Manual Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">QR Scanner</h3>
            </div>
            <div className="p-4">
              <div ref={scannerRef} id="qr-scanner-view"
                className="w-full max-w-md mx-auto aspect-square bg-gray-900 rounded-xl overflow-hidden relative">
                {!scannerActive && !scannedPerson && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <Camera className="h-12 w-12 mb-2" />
                    <p className="text-sm">Camera unavailable</p>
                    <button onClick={startScanner}
                      className="mt-3 px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--secondary)]">
                      Retry
                    </button>
                  </div>
                )}
              </div>

              {showManual && (
                <div className="max-w-md mx-auto mt-4">
                  <div className="flex gap-2">
                    <input type="text" value={manualInput} onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Enter Admission No. or Name..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                      onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()} />
                    <button onClick={handleManualSubmit}
                      className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
                      Submit
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Try: ADM001, Bob Smith, STF001</p>
                </div>
              )}
            </div>
          </div>

          {scannedPerson && !autoMode && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Student / Staff Details</h3>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-[var(--primary-light)] flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-[var(--primary)]">{getInitials(scannedPerson.name)}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-800">{scannedPerson.name}</h4>
                    <p className="text-sm text-gray-500">
                      {scannedPerson.type === "student"
                        ? `${scannedPerson.class} - ${scannedPerson.section}`
                        : scannedPerson.role}
                    </p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 bg-blue-100 text-blue-700">
                      <User className="h-3 w-3" />
                      {scannedPerson.id} ({scannedPerson.type === "student" ? "Student" : "Staff"})
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 font-medium">Mark Attendance:</p>
                <div className="flex items-center gap-3">
                  {["Present", "Late", "Half Day"].map((s) => (
                    <button key={s} onClick={() => { setSelectedStatus(s); submitAttendance(scannedPerson, s) }}
                      className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                        selectedStatus === s ? "ring-2 ring-[var(--primary)]" : ""
                      } ${
                        s === "Present" ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" :
                        s === "Late" ? "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100" :
                        "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Today's Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total", value: todayStats.total, color: "text-[var(--primary)]", bg: "bg-[var(--primary-light)]" },
                { label: "Present", value: todayStats.present, color: "text-green-600", bg: "bg-green-50" },
                { label: "Late", value: todayStats.late, color: "text-yellow-600", bg: "bg-yellow-50" },
                { label: "Half Day", value: todayStats.halfday, color: "text-orange-600", bg: "bg-orange-50" },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-lg p-3 text-center`}>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Today's Log</h3>
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No attendance marked yet</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        log.type === "student" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                      }`}>{getInitials(log.name)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{log.name}</p>
                        <p className="text-xs text-gray-400">{log.personId} • {log.time}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                        log.status === "Present" ? "bg-green-100 text-green-700" :
                        log.status === "Late" ? "bg-yellow-100 text-yellow-700" : "bg-orange-100 text-orange-700"
                      }`}>{log.status}</span>
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
