"use client"

import { useState, useEffect } from "react"
import { Save, Check, Loader2, Zap, Camera, Video, LogIn, Maximize, QrCode, Settings2, Smartphone, ScanLine } from "lucide-react"
import { useSchoolSettings } from "@/lib/use-school-settings"

const cardIcon: Record<string, any> = {
  auto: Zap,
  scanner: Camera,
  camera: Video,
  inout: LogIn,
  fullscreen: Maximize,
}

export default function QRSettingPage() {
  const { settings, loading, save, saving } = useSchoolSettings("qrattendance.")
  const [autoAttendance, setAutoAttendance] = useState("enabled")
  const [scannerDevice, setScannerDevice] = useState("camera")
  const [cameraType, setCameraType] = useState("back")
  const [inOutAttendance, setInOutAttendance] = useState("disabled")
  const [fullScreen, setFullScreen] = useState("disabled")
  const [savedOk, setSavedOk] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!loading && !hydrated) {
      setAutoAttendance(settings["autoAttendance"] || "enabled")
      setScannerDevice(settings["scannerDevice"] || "camera")
      setCameraType(settings["cameraType"] || "back")
      setInOutAttendance(settings["inOutAttendance"] || "disabled")
      setFullScreen(settings["fullScreen"] || "disabled")
      setHydrated(true)
    }
  }, [loading, hydrated, settings])

  const handleSave = async () => {
    const ok = await save({
      "qrattendance.autoAttendance": autoAttendance,
      "qrattendance.scannerDevice": scannerDevice,
      "qrattendance.cameraType": cameraType,
      "qrattendance.inOutAttendance": inOutAttendance,
      "qrattendance.fullScreen": fullScreen,
    })
    if (!ok) return
    setSavedOk(true)
    setTimeout(() => setSavedOk(false), 2800)
  }

  const ToggleRow = ({ label, desc, value, onChange, options }: { label: string; desc: string; value: string; onChange: (v: string) => void; options: { value: string; title: string; sub: string }[] }) => (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${active ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-md" : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"}`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? "bg-white/20" : "bg-gray-100"}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-white" : "bg-gray-300"} ${active ? "shadow" : ""}`} />
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-semibold leading-none ${active ? "text-white" : "text-gray-800"}`}>{opt.title}</p>
              <p className={`text-xs mt-0.5 ${active ? "text-white/80" : "text-gray-500"}`}>{opt.sub}</p>
            </div>
            {active && <Check className="ml-auto h-4 w-4 text-white" />}
          </button>
        )
      })}
    </div>
  )

  if (loading && !hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 animate-pulse" />
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" /></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {savedOk && (
        <div className="fixed top-4 right-4 z-[100] bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20"><Check className="h-4 w-4" /></span>
          Settings saved successfully!
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="absolute left-1/3 top-1/2 -translate-y-1/2 opacity-10"><QrCode className="h-28 w-28 text-white" /></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Settings2 className="h-4 w-4 text-white" /></span>
              QR Code Attendance Setting
            </h2>
            <p className="text-sm text-white/80 mt-1">Configure scanner, camera and attendance behaviour • Applies to QR attendance page</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/90 text-xs bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20">
            <ScanLine className="h-3.5 w-3.5" /> Auto: {autoAttendance} • {scannerDevice}
          </div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="space-y-4">
        {/* Auto Attendance */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm"><Zap className="h-4 w-4" /></span>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Auto Attendance</h3>
              <p className="text-xs text-gray-500">When enabled, attendance is marked automatically on scan. When disabled, you manually select Present/Late/Half Day.</p>
            </div>
          </div>
          <div className="p-5">
            <ToggleRow value={autoAttendance} onChange={setAutoAttendance} label="Auto" desc="" options={[
              { value: "enabled", title: "Enabled", sub: "Attendance marked automatically" },
              { value: "disabled", title: "Disabled", sub: "Manual selection of attendance" },
            ]} />
          </div>
        </div>

        {/* Scanner Device */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-blue-50 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm"><Camera className="h-4 w-4" /></span>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Scanner Device Type</h3>
              <p className="text-xs text-gray-500">Choose the device type used for scanning QR codes / Barcodes</p>
            </div>
          </div>
          <div className="p-5">
            <ToggleRow value={scannerDevice} onChange={setScannerDevice} label="Scanner" desc="" options={[
              { value: "camera", title: "Camera", sub: "Use device camera / webcam" },
              { value: "sensor", title: "Sensor", sub: "Use external QR scanner / sensor" },
            ]} />
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Smartphone className="h-3.5 w-3.5" /> Tip: Camera works on mobile, tablet and laptop. Sensor is for USB barcode scanners.
            </div>
          </div>
        </div>

        {/* Camera Type */}
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-opacity ${scannerDevice !== "camera" ? "opacity-60" : "border-gray-200"}`}>
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500 text-white shadow-sm"><Video className="h-4 w-4" /></span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-800">Camera Type</h3>
              <p className="text-xs text-gray-500">Select front or back camera for scanning (only applicable for Camera device)</p>
            </div>
            {scannerDevice !== "camera" && <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Requires Camera</span>}
          </div>
          <div className="p-5">
            <ToggleRow value={cameraType} onChange={setCameraType} label="Camera" desc="" options={[
              { value: "front", title: "Front Camera", sub: "Selfie / front-facing camera" },
              { value: "back", title: "Back Camera", sub: "Rear / environment-facing camera" },
            ]} />
          </div>
        </div>

        {/* In and Out */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm"><LogIn className="h-4 w-4" /></span>
            <div>
              <h3 className="text-sm font-bold text-gray-800">In and Out Attendance</h3>
              <p className="text-xs text-gray-500">Enable In/Out attendance marking. Students scan once on entry and once on exit.</p>
            </div>
          </div>
          <div className="p-5">
            <ToggleRow value={inOutAttendance} onChange={setInOutAttendance} label="InOut" desc="" options={[
              { value: "enabled", title: "Enabled", sub: "In and Out attendance marking" },
              { value: "disabled", title: "Disabled", sub: "Standard single-scan attendance" },
            ]} />
          </div>
        </div>

        {/* Full Screen */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm"><Maximize className="h-4 w-4" /></span>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Full Screen Mode</h3>
              <p className="text-xs text-gray-500">Enable full screen mode for seamless scanning on mobile/tablet devices</p>
            </div>
          </div>
          <div className="p-5">
            <ToggleRow value={fullScreen} onChange={setFullScreen} label="FS" desc="" options={[
              { value: "enabled", title: "Enabled", sub: "Full screen scanner view" },
              { value: "disabled", title: "Disabled", sub: "Standard page view" },
            ]} />
          </div>
        </div>

        <div className="flex justify-end sticky bottom-4 z-10">
          <div className="bg-white border border-gray-200 shadow-xl rounded-2xl p-2 flex items-center gap-2">
            <span className="text-xs text-gray-500 px-2 hidden sm:inline">Changes apply to QR attendance scanner instantly</span>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:opacity-95 transition-opacity flex items-center gap-2 disabled:opacity-60 shadow-md">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
