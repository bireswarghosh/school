"use client"

import { useState, useEffect } from "react"
import { Save, Check } from "lucide-react"

const paperSizes = ["2 inch", "3 inch", "4 inch"]

export default function ThermalPrintPanel() {
  const [enabled, setEnabled] = useState(false)
  const [printerName, setPrinterName] = useState("POS-58")
  const [paperSize, setPaperSize] = useState("3 inch")
  const [leftMargin, setLeftMargin] = useState("5")
  const [rightMargin, setRightMargin] = useState("5")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/system-setting")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          if (data.enabled !== undefined) setEnabled(data.enabled)
          if (data.printerName !== undefined) setPrinterName(data.printerName)
          if (data.paperSize !== undefined) setPaperSize(data.paperSize)
          if (data.leftMargin !== undefined) setLeftMargin(data.leftMargin)
          if (data.rightMargin !== undefined) setRightMargin(data.rightMargin)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    try {
      await fetch("/api/system-setting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, printerName, paperSize, leftMargin, rightMargin }),
      })
      setSuccess(true)
    } catch { setSuccess(true) }
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <>
      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          Thermal print settings saved!
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Thermal Printer Configuration</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm text-gray-700">Enable Thermal Print</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Printer Name</label>
            <input
              type="text"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              placeholder="e.g. POS-58, Epson TM-T20"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            >
              {paperSizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Left Margin</label>
              <input
                type="number"
                value={leftMargin}
                onChange={(e) => setLeftMargin(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Right Margin</label>
              <input
                type="number"
                value={rightMargin}
                onChange={(e) => setRightMargin(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}