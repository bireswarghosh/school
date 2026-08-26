"use client"

import { useState } from "react"
import { Save, Check, Loader2 } from "lucide-react"
import { useSchoolSettings } from "@/lib/use-school-settings"

export default function QRSettingPage() {
  const { settings, loading, save, saving } = useSchoolSettings("qrattendance.")
  const [autoAttendance, setAutoAttendance] = useState("enabled")
  const [scannerDevice, setScannerDevice] = useState("camera")
  const [cameraType, setCameraType] = useState("back")
  const [inOutAttendance, setInOutAttendance] = useState("disabled")
  const [fullScreen, setFullScreen] = useState("disabled")
  const [savedOk, setSavedOk] = useState(false)

  // Hydrate form from server once settings arrive (render-phase init, runs once)
  const [hydrated, setHydrated] = useState(false)
  if (!loading && !hydrated) {
    setHydrated(true)
    setAutoAttendance(settings["autoAttendance"] || "enabled")
    setScannerDevice(settings["scannerDevice"] || "camera")
    setCameraType(settings["cameraType"] || "back")
    setInOutAttendance(settings["inOutAttendance"] || "disabled")
    setFullScreen(settings["fullScreen"] || "disabled")
  }

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
    setTimeout(() => setSavedOk(false), 3000)
  }

  return (
    <div className="space-y-6">
      {savedOk && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          Settings saved successfully!
        </div>
      )}

      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">QR Code Attendance Setting</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">QR Code Attendance / Setting</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
      <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">Auto Attendance</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              When enabled, attendance is marked automatically on scan. When disabled, you manually select Present/Late/Half Day.
            </p>
          </div>
          <div className="p-5 flex items-center gap-8">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="autoAttendance" value="enabled" checked={autoAttendance === "enabled"}
                onChange={(e) => setAutoAttendance(e.target.value)}
                className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]" />
              <div>
                <span className="text-sm font-medium text-gray-700">Enabled</span>
                <p className="text-xs text-gray-400 mt-0.5">Attendance marked automatically</p>
              </div>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="autoAttendance" value="disabled" checked={autoAttendance === "disabled"}
                onChange={(e) => setAutoAttendance(e.target.value)}
                className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]" />
              <div>
                <span className="text-sm font-medium text-gray-700">Disabled</span>
                <p className="text-xs text-gray-400 mt-0.5">Manual selection of attendance</p>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">Scanner Device Type</h3>
            <p className="text-xs text-gray-500 mt-0.5">Choose the device type used for scanning QR codes / Barcodes</p>
          </div>
          <div className="p-5 flex items-center gap-8">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="scannerDevice" value="camera" checked={scannerDevice === "camera"}
                onChange={(e) => setScannerDevice(e.target.value)}
                className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]" />
              <div>
                <span className="text-sm font-medium text-gray-700">Camera</span>
                <p className="text-xs text-gray-400 mt-0.5">Use device camera / webcam</p>
              </div>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="scannerDevice" value="sensor" checked={scannerDevice === "sensor"}
                onChange={(e) => setScannerDevice(e.target.value)}
                className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]" />
              <div>
                <span className="text-sm font-medium text-gray-700">Sensor</span>
                <p className="text-xs text-gray-400 mt-0.5">Use external QR scanner / sensor</p>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">Camera Type</h3>
            <p className="text-xs text-gray-500 mt-0.5">Select front or back camera for scanning (only applicable for Camera device)</p>
          </div>
          <div className="p-5 flex items-center gap-8">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="cameraType" value="front" checked={cameraType === "front"}
                onChange={(e) => setCameraType(e.target.value)}
                className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]" />
              <div>
                <span className="text-sm font-medium text-gray-700">Front Camera</span>
                <p className="text-xs text-gray-400 mt-0.5">Selfie / front-facing camera</p>
              </div>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="cameraType" value="back" checked={cameraType === "back"}
                onChange={(e) => setCameraType(e.target.value)}
                className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]" />
              <div>
                <span className="text-sm font-medium text-gray-700">Back Camera</span>
                <p className="text-xs text-gray-400 mt-0.5">Rear / environment-facing camera</p>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">In and Out Attendance</h3>
            <p className="text-xs text-gray-500 mt-0.5">Enable In/Out attendance marking. Students scan once on entry and once on exit.</p>
          </div>
          <div className="p-5 flex items-center gap-8">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="inOutAttendance" value="enabled" checked={inOutAttendance === "enabled"}
                onChange={(e) => setInOutAttendance(e.target.value)}
                className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]" />
              <div>
                <span className="text-sm font-medium text-gray-700">Enabled</span>
                <p className="text-xs text-gray-400 mt-0.5">In and Out attendance marking</p>
              </div>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="inOutAttendance" value="disabled" checked={inOutAttendance === "disabled"}
                onChange={(e) => setInOutAttendance(e.target.value)}
                className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]" />
              <div>
                <span className="text-sm font-medium text-gray-700">Disabled</span>
                <p className="text-xs text-gray-400 mt-0.5">Standard single-scan attendance</p>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">Full Screen Mode</h3>
            <p className="text-xs text-gray-500 mt-0.5">Enable full screen mode for seamless scanning on mobile/tablet devices</p>
          </div>
          <div className="p-5 flex items-center gap-8">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="fullScreen" value="enabled" checked={fullScreen === "enabled"}
                onChange={(e) => setFullScreen(e.target.value)}
                className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]" />
              <div>
                <span className="text-sm font-medium text-gray-700">Enabled</span>
                <p className="text-xs text-gray-400 mt-0.5">Full screen scanner view</p>
              </div>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="fullScreen" value="disabled" checked={fullScreen === "disabled"}
                onChange={(e) => setFullScreen(e.target.value)}
                className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]" />
              <div>
                <span className="text-sm font-medium text-gray-700">Disabled</span>
                <p className="text-xs text-gray-400 mt-0.5">Standard page view</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </form>
      )}
    </div>
  )
}
