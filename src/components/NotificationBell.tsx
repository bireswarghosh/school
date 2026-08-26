"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, X, Plus, Trash2, Play, Clock, Volume2, Upload, Music } from "lucide-react"

type AlarmTone = "classic" | "chime" | "beep" | "gentle" | string

type CustomTone = {
  id: string
  name: string
  dataUrl: string
}

type Alarm = {
  id: string
  time: string
  label: string
  tone: AlarmTone
  enabled: boolean
  days: number[]
}

const defaultClassPeriods = [
  { time: "08:45", label: "Period 1 End" },
  { time: "09:30", label: "Period 2 End" },
  { time: "10:15", label: "Period 3 End" },
  { time: "11:00", label: "Short Break End" },
  { time: "11:45", label: "Period 5 End" },
  { time: "12:30", label: "Period 6 End" },
  { time: "13:15", label: "Lunch Break End" },
  { time: "14:00", label: "Period 8 End" },
  { time: "14:45", label: "Period 9 End" },
]

const builtInTones: Record<string, string> = {
  classic: "Classic Bell",
  chime: "School Chime",
  beep: "Beep Alert",
  gentle: "Gentle Wake",
}

let sharedCtx: AudioContext | null = null

function getAudioContext() {
  if (!sharedCtx) {
    sharedCtx = new AudioContext()
  }
  if (sharedCtx.state === "suspended") {
    sharedCtx.resume()
  }
  return sharedCtx
}

function ensureAudioContext() {
  if (!sharedCtx) {
    sharedCtx = new AudioContext()
  }
  if (sharedCtx.state === "suspended") {
    sharedCtx.resume()
  }
}

function playTone(tone: AlarmTone, customTones: CustomTone[]) {
  const custom = customTones.find((ct) => ct.id === tone)
  if (custom) {
    try {
      const audio = new Audio(custom.dataUrl)
      audio.play().then(() => {
        setTimeout(() => { audio.pause(); audio.currentTime = 0 }, 5000)
      }).catch(() => {})
    } catch { /* ignore */ }
    return
  }
  try {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.value = 0.3

    switch (tone) {
      case "classic":
        osc.frequency.value = 880
        osc.type = "sine"
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5)
        osc.start()
        osc.stop(ctx.currentTime + 1.5)
        break
      case "chime": {
        osc.frequency.value = 523
        osc.type = "sine"
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2)
        osc.start()
        osc.stop(ctx.currentTime + 2)
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        gain2.gain.value = 0.2
        osc2.frequency.value = 659
        osc2.type = "sine"
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.5)
        osc2.start(ctx.currentTime + 0.5)
        osc2.stop(ctx.currentTime + 2.5)
        break
      }
      case "beep":
        osc.frequency.value = 1000
        osc.type = "square"
        gain.gain.value = 0.2
        osc.start()
        osc.stop(ctx.currentTime + 0.15)
        setTimeout(() => {
          const osc2 = ctx.createOscillator()
          const gain2 = ctx.createGain()
          osc2.connect(gain2)
          gain2.connect(ctx.destination)
          gain2.gain.value = 0.2
          osc2.frequency.value = 1000
          osc2.type = "square"
          osc2.start()
          osc2.stop(ctx.currentTime + 0.15)
        }, 300)
        setTimeout(() => {
          const osc3 = ctx.createOscillator()
          const gain3 = ctx.createGain()
          osc3.connect(gain3)
          gain3.connect(ctx.destination)
          gain3.gain.value = 0.2
          osc3.frequency.value = 1000
          osc3.type = "square"
          osc3.start()
          osc3.stop(ctx.currentTime + 0.15)
        }, 600)
        break
      case "gentle":
        osc.frequency.value = 440
        osc.type = "sine"
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3)
        osc.start()
        osc.stop(ctx.currentTime + 3)
        break
    }
  } catch { /* Audio not supported */ }
}

function getTodayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [customTones, setCustomTones] = useState<CustomTone[]>([])
  const [ringing, setRinging] = useState(false)
  const [ringingLabel, setRingingLabel] = useState("")
  const [newTime, setNewTime] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [newTone, setNewTone] = useState<AlarmTone>("classic")
  const [showUpload, setShowUpload] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)

  // track which alarms have fired today so they only play once
  const firedRef = useRef<Set<string>>(new Set())

  // load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("smart-school-alarms")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAlarms(parsed)
        } else {
          loadDefaults()
        }
      } catch { loadDefaults() }
    } else {
      loadDefaults()
    }
    const ct = localStorage.getItem("smart-school-custom-tones")
    if (ct) {
      try {
        const parsed = JSON.parse(ct)
        if (Array.isArray(parsed)) setCustomTones(parsed.filter((t: any) => t.id && t.name && t.dataUrl))
      } catch { /* ignore */ }
    }
  }, [])

  function loadDefaults() {
    const defaults: Alarm[] = defaultClassPeriods.map((p, i) => ({
      id: `default-${i}`,
      time: p.time,
      label: p.label,
      tone: "classic" as AlarmTone,
      enabled: true,
      days: [1, 2, 3, 4, 5],
    }))
    setAlarms(defaults)
    localStorage.setItem("smart-school-alarms", JSON.stringify(defaults))
  }

  useEffect(() => {
    localStorage.setItem("smart-school-alarms", JSON.stringify(alarms))
  }, [alarms])

  useEffect(() => {
    localStorage.setItem("smart-school-custom-tones", JSON.stringify(customTones))
  }, [customTones])

  // reset fired set when day changes
  useEffect(() => {
    let lastKey = getTodayKey()
    firedRef.current.clear()
    const resetter = setInterval(() => {
      const key = getTodayKey()
      if (key !== lastKey) {
        lastKey = key
        firedRef.current.clear()
      }
    }, 60000)
    return () => clearInterval(resetter)
  }, [])

  // alarm checker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, "0")
      const mm = String(now.getMinutes()).padStart(2, "0")
      const currentTime = `${hh}:${mm}`
      const today = now.getDay()
      const dayKey = getTodayKey()

      alarms.forEach((alarm) => {
        const fireKey = `${dayKey}-${alarm.id}`
        if (
          alarm.enabled &&
          alarm.time === currentTime &&
          alarm.days.includes(today) &&
          !firedRef.current.has(fireKey)
        ) {
          firedRef.current.add(fireKey)
          setRinging(true)
          setRingingLabel(alarm.label)
          playTone(alarm.tone, customTones)
          setTimeout(() => {
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification(`⏰ ${alarm.label}`, { body: `It's ${alarm.time}!` })
            }
          }, 200)
          setTimeout(() => {
            setRinging(false)
            setRingingLabel("")
          }, 5000)
        }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [alarms, customTones])

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission()
    }
    const init = () => {
      ensureAudioContext()
      document.removeEventListener("click", init)
      document.removeEventListener("touchstart", init)
    }
    document.addEventListener("click", init, { once: true })
    document.addEventListener("touchstart", init, { once: true })
    return () => {
      document.removeEventListener("click", init)
      document.removeEventListener("touchstart", init)
    }
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const addAlarm = useCallback(() => {
    if (!newTime) return
    const alarm: Alarm = {
      id: `alarm-${Date.now()}`,
      time: newTime,
      label: newLabel || `Alarm at ${newTime}`,
      tone: newTone,
      enabled: true,
      days: [1, 2, 3, 4, 5],
    }
    setAlarms((prev) =>
      [...prev, alarm].sort((a, b) => a.time.localeCompare(b.time))
    )
    setNewTime("")
    setNewLabel("")
    setNewTone("classic")
  }, [newTime, newLabel, newTone])

  const removeAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const toggleAlarm = useCallback((id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    )
  }, [])

  const testTone = useCallback((tone: AlarmTone) => {
    playTone(tone, customTones)
  }, [customTones])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("audio/")) {
      notify.error("Please select an audio file (MP3, WAV, etc.)")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const name = file.name.replace(/\.[^/.]+$/, "")
      const newTone: CustomTone = {
        id: `custom-${Date.now()}`,
        name,
        dataUrl,
      }
      setCustomTones((prev) => [...prev, newTone])
      setNewTone(newTone.id)
      setShowUpload(false)
    }
    reader.readAsDataURL(file)
    if (fileRef.current) fileRef.current.value = ""
  }, [])

  const removeCustomTone = useCallback((id: string) => {
    setCustomTones((prev) => prev.filter((ct) => ct.id !== id))
    setNewTone("classic")
  }, [])

  const allToneOptions = [
    ...Object.entries(builtInTones).map(([k, v]) => ({ id: k, name: v, custom: false })),
    ...customTones.map((ct) => ({ id: ct.id, name: ct.name, custom: true })),
  ]

  const activeCount = alarms.filter((a) => a.enabled).length

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => { ensureAudioContext(); setOpen(!open) }}
        className={`relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors ${ringing ? "animate-bell" : ""}`}
        title={ringing ? ringingLabel : "Alarms"}
      >
        <Bell className={`h-5 w-5 ${ringing ? "text-[var(--primary)]" : ""}`} />
        {activeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {activeCount > 9 ? "9+" : activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={popupRef}
          className="absolute right-0 top-full mt-2 w-[380px] max-h-[600px] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl z-50 dark:bg-gray-900 dark:border-gray-700"
        >
          <div className="sticky top-0 bg-white dark:bg-gray-900 px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Bell className="h-4 w-4 text-[var(--primary)]" />
              Alarms & Notifications
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Active Alarms ({activeCount})
              </h4>
              {alarms.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No alarms set</p>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {alarms.map((alarm) => {
                    const toneName = builtInTones[alarm.tone] || customTones.find((ct) => ct.id === alarm.tone)?.name || alarm.tone
                    return (
                      <div
                        key={alarm.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          alarm.enabled
                            ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                            : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 opacity-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => toggleAlarm(alarm.id)}
                            className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              alarm.enabled
                                ? "border-[var(--primary)] bg-[var(--primary)]"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            {alarm.enabled && (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {alarm.time}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {alarm.label}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                            {toneName}
                          </span>
                          <button
                            onClick={() => removeAlarm(alarm.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                Set New Alarm
              </h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] text-gray-500 mb-1">Time</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] text-gray-500 mb-1">Sound</label>
                    <div className="flex gap-1">
                      <select
                        value={newTone}
                        onChange={(e) => setNewTone(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        {allToneOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}{opt.custom ? " (custom)" : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => testTone(newTone)}
                        className="p-2 text-gray-500 hover:text-[var(--primary)] hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                        title="Preview sound"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] text-gray-500 mb-1">Label (optional)</label>
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="e.g. Period 4 End"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setShowUpload(!showUpload)}
                      className={`p-2 rounded-lg border transition-colors ${
                        showUpload
                          ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                          : "text-gray-500 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      title="Upload custom sound"
                    >
                      <Upload className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {showUpload && (
                  <div className="p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[var(--primary)] file:text-white hover:file:bg-[var(--secondary)] cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Supports MP3, WAV, OGG, etc.</p>
                    {customTones.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {customTones.map((ct) => (
                          <div key={ct.id} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Music className="h-3 w-3" />
                              {ct.name}
                            </span>
                            <button
                              onClick={() => removeCustomTone(ct.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={addAlarm}
                  disabled={!newTime}
                  className="w-full py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Alarm
                </button>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800/50 px-5 py-3 border-t border-gray-200 dark:border-gray-700 text-[11px] text-gray-400 flex items-center justify-between">
            <span>{alarms.length} alarms configured</span>
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              Rings once per day at set time
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
