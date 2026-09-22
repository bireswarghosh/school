"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, RefreshCw, Wallet, AlertCircle, ArrowUpRight } from "lucide-react"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useCurrency } from "@/lib/currency-context"

type CarryForwardEntry = {
  id?: number
  paymentId: number
  studentId: number
  feesGroupId: number | null
  feesTypeId: number | null
  amount: number | string
  paidAmount: number | string
  discountAmount: number | string
  fineAmount: number | string
  status: string | null
  paymentMode: string | null
  paymentDate: string | null
  studentName: string | null
  admissionNo: string | null
  className: string | null
  sectionName: string | null
  feeTypeName: string | null
  balance: number | string
}

const num = (v: unknown) => {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

const money = (symbol: string, v: number) => `${symbol}${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function FeesCarryForwardPage() {
  const router = useRouter()
  const { symbol } = useCurrency()
  const { classNames: classOptions, sectionNames: sectionOptions, classes, sectionsOf } = useClassesAndSections()
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [rows, setRows] = useState<CarryForwardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const selectedClassId = classes.find((c) => c.name === selectedClass)?.id

  const load = useCallback(() => {
    setLoading(true)
    setError("")
    fetch("/api/fees/carry-forward")
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d)) setRows(d)
        else { setRows([]); if (d?.error) setError(d.error) }
      })
      .catch(() => { setRows([]); setError("Failed to load carry forward data") })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const grouped = useMemo(() => {
    const map = new Map<string, { className: string; sectionName: string; students: Set<number>; totalFees: number; totalPaid: number; totalPending: number; count: number }>()
    for (const r of rows) {
      const key = `${r.className || "Unknown"}::${r.sectionName || ""}`
      let g = map.get(key)
      if (!g) {
        g = { className: r.className || "Unknown", sectionName: r.sectionName || "", students: new Set(), totalFees: 0, totalPaid: 0, totalPending: 0, count: 0 }
        map.set(key, g)
      }
      g.students.add(r.studentId)
      g.totalFees += num(r.amount)
      g.totalPaid += num(r.paidAmount)
      g.totalPending += num(r.balance)
      g.count += 1
    }
    return Array.from(map.values()).sort((a, b) => a.className.localeCompare(b.className) || a.sectionName.localeCompare(b.sectionName))
  }, [rows])

  const totals = useMemo(() => {
    const t = { students: new Set<number>(), totalFees: 0, totalPaid: 0, totalPending: 0, count: 0 }
    for (const r of rows) {
      t.students.add(r.studentId)
      t.totalFees += num(r.amount)
      t.totalPaid += num(r.paidAmount)
      t.totalPending += num(r.balance)
      t.count += 1
    }
    return { students: t.students.size, totalFees: t.totalFees, totalPaid: t.totalPaid, totalPending: t.totalPending, count: t.count }
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (selectedClass && r.className !== selectedClass) return false
      if (selectedSection && r.sectionName !== selectedSection) return false
      if (activeGroup) {
        const key = `${r.className || "Unknown"}::${r.sectionName || ""}`
        if (key !== activeGroup) return false
      }
      return true
    })
  }, [rows, selectedClass, selectedSection, activeGroup])

  const resetFilters = () => {
    setSelectedClass("")
    setSelectedSection("")
    setActiveGroup(null)
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fees Carry Forward</h2>
          <p className="text-xs text-gray-500 mt-0.5">Fees Collection / Fees Carry Forward</p>
        </div>
        <button
          onClick={() => { load(); resetFilters() }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-800">
          <p className="font-semibold mb-0.5">Leftover of partially paid fees shown here as Fees Carry Forward</p>
          <p>If a student paid part of a fee (less than the total due), the remaining leftover is carried forward and shown here, class and section wise. Students who paid nothing or paid in full are not shown.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Pending Fees</span>
            <span className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500"><Wallet className="h-4 w-4" /></span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{money(symbol, totals.totalPending)}</p>
          <p className="text-[11px] text-gray-400 mt-1">{totals.students} student(s) · {totals.count} fee record(s)</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Collected So Far</span>
            <span className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500"><Wallet className="h-4 w-4" /></span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{money(symbol, totals.totalPaid)}</p>
          <p className="text-[11px] text-gray-400 mt-1">of {money(symbol, totals.totalFees)} total assigned fees</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Classes</span>
            <span className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500"><Search className="h-4 w-4" /></span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{new Set(rows.map((r) => r.className)).size}</p>
          <p className="text-[11px] text-gray-400 mt-1">{grouped.length} class · section group(s)</p>
        </div>
      </div>

      {/* Class-wise Cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-[var(--primary)]" />
          Class wise Fees Carry Forward
        </h3>
        {loading && rows.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl border border-gray-200 bg-white animate-pulse" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
            <Wallet className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No carry forward fees found</p>
            <p className="text-xs text-gray-300 mt-1">Partially paid fees will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {grouped.map((g) => {
              const key = `${g.className}::${g.sectionName}`
              const active = activeGroup === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveGroup(active ? null : key)}
                  className={`rounded-xl border overflow-hidden text-left transition-all ${active ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20 shadow-md" : "border-gray-200 bg-white hover:border-[var(--primary)]/50 hover:shadow-md"}`}
                >
                  <div className="px-4 py-3 bg-gradient-to-r from-orange-500 to-[#c24e0e] text-white flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold leading-tight">{g.className}</p>
                      <p className="text-[11px] text-white/80">Section {g.sectionName || "-"}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                      {g.students.size} student{g.students.size !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Total Pending</p>
                    <p className="text-lg font-bold text-red-600">{money(symbol, g.totalPending)}</p>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500">
                      <span>Fees {money(symbol, g.totalFees)}</span>
                      <span>Paid {money(symbol, g.totalPaid)}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-2.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-[var(--primary)]" />
            Filter Carry Forward List
          </h3>
          {activeGroup && (
            <span className="text-[11px] font-medium text-[var(--primary)] bg-[var(--primary-light)] px-2 py-1 rounded-full">{activeGroup.split("::").join(" - ")}</span>
          )}
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); setActiveGroup(null) }}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
            >
              <option value="">All Classes</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => { setSelectedSection(e.target.value); setActiveGroup(null) }}
              disabled={!selectedClass}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">All Sections</option>
              {(selectedClass ? sectionsOf(selectedClassId ?? null).map((s) => s.name) : sectionOptions).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={resetFilters}
              className="h-9 px-4 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <p className="text-[11px] text-gray-400 leading-tight">
              Showing {filtered.length} of {rows.length} carry forward records
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Fees Carry Forward List</h3>
          <span className="text-xs text-gray-400">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Student</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Admission No</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Class / Section</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Fee Type</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Total</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Discount</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Paid</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Pending</th>
                <th className="text-center px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Payment</th>
                <th className="text-center px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400">
                    <RefreshCw className="h-4 w-4 animate-spin inline-block mr-2" />
                    Loading carry forward fees...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-red-500">{error}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-gray-300" />
                      <span className="text-sm">No carry forward fees found for the selected filters</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr key={r.paymentId} className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{r.studentName || "-"}</td>
                    <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{r.admissionNo || "-"}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-gray-600">{r.className || "-"}</span>
                      {r.sectionName ? <span className="text-gray-400"> / {r.sectionName}</span> : null}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{r.feeTypeName || "-"}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-800">{money(symbol, num(r.amount))}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{num(r.discountAmount) > 0 ? money(symbol, num(r.discountAmount)) : "-"}</td>
                    <td className="px-4 py-2.5 text-right text-green-600">{money(symbol, num(r.paidAmount))}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="font-medium text-red-600">{money(symbol, num(r.balance))}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {num(r.paidAmount) > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-600">
                          {r.paymentMode || "Partial"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-600">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => router.push(`/admin/fees-collection/collect-fees/addfee/${r.studentId}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-white rounded-lg transition-colors shadow-sm"
                        style={{ background: "var(--primary)" }}
                        title={`Collect pending ${money(symbol, num(r.balance))}`}
                      >
                        Collect
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}