"use client"

import { Suspense, useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Search, Users, Check, Loader2, BadgeCheck, Layers } from "lucide-react"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"

type MasterRecord = {
  id: number
  feesGroup: string
  feesType: string
  className: string
  amount: number
  dueDate: string | null
  class_id: number | null
}

type StudentRow = {
  id: number
  admissionNo: string
  name: string
  rollNo: string
  className: string
  sectionName: string
  category: string
}

type CategoryItem = { id: number; name: string }

export default function AssignGroupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    }>
      <AssignGroupInner />
    </Suspense>
  )
}

function AssignGroupInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { symbol } = useCurrency()
  const { classes, sectionsOf } = useClassesAndSections()
  const { data: categories } = useApi<CategoryItem>("/api/student-information/student-category")

  const masterIds = useMemo(
    () =>
      (searchParams.get("masters") || "")
        .split(",")
        .map((v) => parseInt(v, 10))
        .filter((n) => Number.isFinite(n) && n > 0),
    [searchParams]
  )

  const [masters, setMasters] = useState<MasterRecord[]>([])
  const [classId, setClassId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [category, setCategory] = useState("")
  const [students, setStudents] = useState<StudentRow[]>([])
  const [searched, setSearched] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [assigning, setAssigning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (masterIds.length === 0) return
    fetch(`/api/fees/fees-assign?masterIds=${masterIds.join(",")}`)
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res?.masters) && res.masters.length > 0) {
          setMasters(res.masters)
          const first = res.masters.find((m: MasterRecord) => m.class_id) || res.masters[0]
          if (first?.class_id) setClassId(String(first.class_id))
        }
      })
      .catch(() => {})
  }, [masterIds])

  const groupTotal = useMemo(
    () => masters.reduce((sum, m) => sum + (Number(m.amount) || 0), 0),
    [masters]
  )
  const groupName = masters[0]?.feesGroup || ""

  const availableSections = useMemo(() => {
    const cid = parseInt(classId, 10)
    if (!Number.isFinite(cid)) return []
    return sectionsOf(cid)
  }, [classId, sectionsOf])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId) {
      setError("Please select a class to search students")
      return
    }
    setError("")
    setLoadingStudents(true)
    setResult(null)
    try {
      const qs = new URLSearchParams()
      qs.set("class_id", classId)
      if (sectionId) qs.set("section_id", sectionId)
      if (category) qs.set("category", category)
      const res = await fetch(`/api/fees/fees-assign?${qs.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load students")
      setStudents(data.students || [])
      setSelectedIds([])
      setSearched(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingStudents(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) setSelectedIds([])
    else setSelectedIds(students.map((s) => s.id))
  }

  const toggleSelect = (sid: number) => {
    setSelectedIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    )
  }

  const handleAssign = async () => {
    if (masterIds.length === 0 || (students.length === 0 && selectedIds.length === 0)) return
    setAssigning(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/fees/fees-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterIds,
          classId: classId ? parseInt(classId, 10) : undefined,
          sectionId: sectionId ? parseInt(sectionId, 10) : undefined,
          category: category || undefined,
          studentIds: selectedIds.length > 0 ? selectedIds : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to assign fees")
      const feeNames = (data.masters || []).map((m: any) => m.feesType).join(", ")
      setResult(
        `${data.feesCount} fee type(s) (${feeNames}) assigned to ${data.assigned} of ${data.total} student(s)` +
          (data.skipped > 0 ? ` (${data.skipped} already assigned)` : "")
      )
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAssigning(false)
    }
  }

  const targetLabel = [
    classes.find((c) => c.id === parseInt(classId, 10))?.name,
    availableSections.find((s) => s.id === parseInt(sectionId, 10))?.name,
    category,
  ]
    .filter(Boolean)
    .join(" - ") || "All students"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Assign Fees to Students</h2>
          <p className="text-xs text-gray-500 mt-0.5">Fees Collection / Fees Master / Assign Fees</p>
        </div>
        <button
          onClick={() => router.push("/admin/fees-collection/fees-master")}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Fees Master
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <Check className="h-4 w-4" />
          {result}
        </div>
      )}

      {masters.length > 0 && (
        <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 rounded-xl px-6 py-4 shadow-sm text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Fees Group</p>
              <h3 className="text-lg font-bold mt-0.5">{groupName}</h3>
              <p className="text-xs text-white/80 mt-0.5">
                {masters.length} fee type(s) · Class: {masters[0]?.className || "All Classes"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{symbol}{groupTotal.toFixed(2)}</p>
              <p className="text-xs text-white/80">total per student</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {masters.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white">
                <Layers className="h-3 w-3" />
                {m.feesType} · {symbol}{(Number(m.amount) || 0).toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5 text-[var(--primary)]" />
          <h3 className="text-xs font-semibold text-gray-700">Select Criteria</h3>
        </div>
        <form onSubmit={handleSearch} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Class <span className="text-red-400">*</span></label>
              <select
                value={classId}
                onChange={(e) => { setClassId(e.target.value); setSectionId(""); setResult(null) }}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Section <span className="text-gray-400 font-normal">(optional)</span></label>
              <select
                value={sectionId}
                onChange={(e) => { setSectionId(e.target.value); setResult(null) }}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
              >
                <option value="">All Sections</option>
                {availableSections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category <span className="text-gray-400 font-normal">(optional)</span></label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setResult(null) }}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={loadingStudents}
                className="h-9 px-4 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200 disabled:opacity-50"
              >
                {loadingStudents ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setClassId(masters.find((m) => m.class_id)?.class_id ? String(masters.find((m) => m.class_id)?.class_id) : "")
                  setSectionId("")
                  setCategory("")
                  setStudents([])
                  setSelectedIds([])
                  setSearched(false)
                  setResult(null)
                  setError("")
                }}
                className="h-9 px-3 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      {searched && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[var(--primary)]" />
              Students
              <span className="text-xs font-normal text-gray-400">({targetLabel})</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{students.length} found · {selectedIds.length} selected</span>
              <button
                onClick={handleAssign}
                disabled={assigning || students.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-green-200"
              >
                {assigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                {assigning ? "Assigning..." : "Assign Fees"}
              </button>
            </div>
          </div>
          {students.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No students found for the selected criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                    <th className="px-4 py-2.5 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === students.length && students.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                    </th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Admission No</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Student Name</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Roll No</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Class</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Section</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => (
                    <tr
                      key={s.id}
                      onClick={() => toggleSelect(s.id)}
                      className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors cursor-pointer ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                    >
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{s.admissionNo}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{s.rollNo}</td>
                      <td className="px-4 py-2.5 text-gray-600">{s.className}</td>
                      <td className="px-4 py-2.5 text-gray-600">{s.sectionName}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                          {s.category || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {students.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
              <span>
                Will assign <span className="font-medium text-gray-700">{symbol}{groupTotal.toFixed(2)}</span> of{" "}
                <span className="font-medium text-gray-700">{masters.length} fee type(s)</span> to{" "}
                <span className="font-medium text-gray-700">
                  {selectedIds.length > 0 ? `${selectedIds.length} selected` : `all ${students.length}`}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-gray-400">
                Fees will appear as pending in each student&apos;s fees
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
