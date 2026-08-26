"use client"

import { useState } from "react"
import { Pencil, Check, RotateCcw } from "lucide-react"
import { useApi } from "@/lib/use-api"

type FieldStatus = "Required" | "Optional" | "Hidden"

type SystemField = {
  id: number
  module: string
  fieldName: string
  type: string
  status: FieldStatus
}

const statusCycle: FieldStatus[] = ["Required", "Optional", "Hidden"]

export default function SystemFieldsPanel() {
  const { data: fields, update, loading } = useApi<SystemField>("/api/system-setting/system-field")
  const [success, setSuccess] = useState("")

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3000)
  }

  const cycleStatus = async (id: number) => {
    const field = fields.find((f) => f.id === id)
    if (!field) return
    const currentIdx = statusCycle.indexOf(field.status)
    const nextStatus = statusCycle[(currentIdx + 1) % statusCycle.length]
    await update(id, { ...field, status: nextStatus })
    showSuccess("Field status updated!")
  }

  return (
    <>
      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["#", "Module", "Field Name", "Type", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No system fields found</td></tr>
              ) : (
                fields.map((f, idx) => (
                  <tr key={f.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-600">{f.module}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{f.fieldName}</td>
                    <td className="px-4 py-3 text-gray-600">{f.type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        f.status === "Required" ? "bg-red-100 text-red-700" :
                        f.status === "Optional" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-200 text-gray-600"
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => cycleStatus(f.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Toggle Status">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          Showing {fields.length} records
        </div>
      </div>
    </>
  )
}