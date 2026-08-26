"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Trash2, X, Wallet } from "lucide-react"
import { useApi } from "@/lib/use-api"

type LedgerEntry = { id?: number; studentId?: number | null; studentName?: string; entryDate?: string; debit?: number | string; credit?: number | string; referenceType?: string; referenceId?: number | null; notes?: string }

const inr = (n: string | number | null | undefined) => "&#8377;" + Number(n || 0).toLocaleString("en-IN")

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"

export default function StudentLedgerPage() {
  const { data: ledger, add, remove } = useApi<LedgerEntry>("/api/students-inventory/ledger")

  const [filter, setFilter] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ studentName: "", entryDate: new Date().toISOString().slice(0, 10), credit: "", notes: "" })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const filtered = useMemo(() => {
    return ledger
      .filter((r) => !filter || (r.studentName || "").toLowerCase().includes(filter.toLowerCase()))
      .slice()
      .sort((a, b) => String(a.entryDate || "").localeCompare(String(b.entryDate || "")) || (a.id ?? 0) - (b.id ?? 0))
  }, [ledger, filter])

  const rows = useMemo(() => {
    let balance = 0
    return filtered.map((r) => {
      const debit = Number(r.debit) || 0
      const credit = Number(r.credit) || 0
      balance += debit - credit
      return { ...r, debit, credit, balance }
    })
  }, [filtered])

  const totals = useMemo(() => {
    let debit = 0
    let credit = 0
    rows.forEach((r) => { debit += r.debit; credit += r.credit })
    return { debit, credit, net: debit - credit }
  }, [rows])

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!form.studentName.trim()) errs.studentName = "Required"
    const credit = Number(form.credit) || 0
    if (credit <= 0) errs.credit = "Must be greater than 0"
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    await add({
      studentName: form.studentName.trim(),
      entryDate: form.entryDate || new Date().toISOString().slice(0, 10),
      credit,
      referenceType: "Payment",
      notes: form.notes.trim(),
    })
    setForm({ studentName: "", entryDate: new Date().toISOString().slice(0, 10), credit: "", notes: "" })
    setFormErrors({})
    setShowAddModal(false)
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Student Ledger</h2>
          <p className="text-sm text-white/80 mt-1">Students Inventory / Student Ledger</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-700">Ledger Entries</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] w-56"
                placeholder="Search student"
              />
            </div>
            <button
              onClick={() => { setForm({ studentName: "", entryDate: new Date().toISOString().slice(0, 10), credit: "", notes: "" }); setFormErrors({}); setShowAddModal(true) }}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Payment
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Debit</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Credit</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Balance</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Reference</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">No entries found</td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={r.id ?? idx} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-600">{r.entryDate ? String(r.entryDate).slice(0, 10) : "-"}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.studentName || "-"}</td>
                    <td className="px-4 py-3 text-right text-red-600" dangerouslySetInnerHTML={{ __html: inr(r.debit) }} />
                    <td className="px-4 py-3 text-right text-emerald-600" dangerouslySetInnerHTML={{ __html: inr(r.credit) }} />
                    <td className={`px-4 py-3 text-right font-medium ${r.balance < 0 ? "text-red-600" : "text-gray-800"}`} dangerouslySetInnerHTML={{ __html: inr(r.balance) }} />
                    <td className="px-4 py-3 text-gray-600">{r.referenceType || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setDeleteId(r.id ?? null); setShowDeleteModal(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200 font-semibold text-gray-800">
                <td colSpan={3} className="px-4 py-3">Totals</td>
                <td className="px-4 py-3 text-right text-red-600" dangerouslySetInnerHTML={{ __html: inr(totals.debit) }} />
                <td className="px-4 py-3 text-right text-emerald-600" dangerouslySetInnerHTML={{ __html: inr(totals.credit) }} />
                <td className={`px-4 py-3 text-right ${totals.net < 0 ? "text-red-600" : "text-gray-800"}`} dangerouslySetInnerHTML={{ __html: inr(totals.net) }} />
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-[var(--primary)]" />
                Add Payment
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                <input type="text" value={form.studentName} onChange={(e) => { setForm({ ...form, studentName: e.target.value }); if (formErrors.studentName) setFormErrors({}) }} className={inputCls} placeholder="Enter student name" />
                {formErrors.studentName && <p className="text-red-500 text-xs mt-1">{formErrors.studentName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entry Date</label>
                <input type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Credit)</label>
                <input type="number" min={0} value={form.credit} onChange={(e) => { setForm({ ...form, credit: e.target.value }); if (formErrors.credit) setFormErrors({}) }} className={inputCls} placeholder="0" />
                {formErrors.credit && <p className="text-red-500 text-xs mt-1">{formErrors.credit}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={inputCls} placeholder="Enter notes" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">Are you sure you want to delete this ledger entry?</p>
              {deleteId !== null && <p className="text-sm font-semibold text-gray-800 mt-1">{ledger.find((r) => r.id === deleteId)?.studentName || ""}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
