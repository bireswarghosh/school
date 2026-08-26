"use client"

import { useState } from "react"
import { Save, Download, Printer } from "lucide-react"
import { useApi } from "@/lib/use-api"

type ReminderType = "Before" | "After"

type ReminderRow = {
  id: number
  type: ReminderType
  days: number
  isActive: boolean
}

const today = () => new Date().toISOString().split("T")[0]

export default function FeesReminderPage() {
  const { data: reminders, update, loading } = useApi<ReminderRow>("/api/fees/fees-reminder")
  const [toast, setToast] = useState("")

  const toggleActive = async (id: number) => {
    const row = reminders?.find((r) => r.id === id)
    if (row) await update(id, { id, type: row.type, days: row.days, isActive: !row.isActive })
  }

  const updateDays = async (id: number, days: number) => {
    const row = reminders?.find((r) => r.id === id)
    if (row) await update(id, { id, type: row.type, days, isActive: row.isActive })
  }

  const handleSave = () => {
    setToast("Reminder settings saved successfully")
    setTimeout(() => setToast(""), 3000)
  }

  const currentData = reminders || []

  const exportCSV = () => {
    const rows = currentData.map((r) => `"${r.type}","${r.days}","${r.isActive}"`)
    const blob = new Blob(["\uFEFFType,Days,Active\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Fees_Reminder.csv"; a.click()
  }

  const exportExcel = () => {
    const rows = currentData.map((r) => `<tr><td>${r.type}</td><td>${r.days}</td><td>${r.isActive ? "Yes" : "No"}</td></tr>`).join("")
    const blob = new Blob([`<html><meta charset="utf-8"><body><table><tr><th>Type</th><th>Days</th><th>Active</th></tr>${rows}</table></body></html>`], { type: "application/vnd.ms-excel" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Fees_Reminder.xls"; a.click()
  }

  const printTable = () => {
    const rows = currentData.map((r) => `<tr><td>${r.type}</td><td>${r.days}</td><td>${r.isActive ? "Yes" : "No"}</td></tr>`).join("")
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(`<html><head><title>Fees Reminder</title><style>body{font-family:Arial;font-size:12px;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#f5f5f5}</style></head><body><h2>Fees Reminder</h2><table><tr><th>Type</th><th>Days</th><th>Active</th></tr>${rows}</table><p style="color:#999;font-size:11px;margin-top:10px">Generated on ${today()}</p></body></html>`)
      win.document.close(); win.print()
    }
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-white">Fees Reminder</h2>
          <p className="text-xs text-white/80 mt-0.5">Fees Collection / Fees Reminder</p>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-5 py-3 rounded-lg shadow-lg">{toast}</div>
      )}

      <div className="flex items-center justify-end flex-wrap gap-2">
        <div className="relative group">
          <button className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />Export</button>
          <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
            <button onClick={exportCSV} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-t-lg">CSV</button>
            <button onClick={exportExcel} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">Excel</button>
            <button onClick={printTable} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-b-lg">PDF</button>
          </div>
        </div>
        <button onClick={printTable} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"><Printer className="h-3.5 w-3.5" />Print</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-800">Reminder Settings</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase">Action</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase">Reminder Type</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase">Days</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase">ID</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => (
                <tr key={row.id} className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                  <td className="px-4 py-2.5">
                    <input type="checkbox" checked={row.isActive} onChange={() => toggleActive(row.id)} className="h-4 w-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] accent-indigo-600 cursor-pointer" />
                  </td>
                  <td className="px-4 py-2.5 text-gray-700 font-medium">{row.type}</td>
                  <td className="px-4 py-2.5">
                    <input type="number" value={row.days} onChange={(e) => updateDays(row.id, Number(e.target.value))} min={0} className="w-20 h-8 px-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{row.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-5 py-2.5 rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">
          <Save className="h-3.5 w-3.5" />Save
        </button>
      </div>
    </div>
  )
}
