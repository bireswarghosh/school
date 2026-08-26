"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, inputCls, selectCls } from "@/components/reports/ui"
import { useReportData as useClasses } from "@/components/reports/use-report-data"

type StudentRow = {
  id: number
  admission_no: string
  first_name: string
  last_name: string
  class?: string
  section?: string
  class_id: number
  father_name: string
  father_phone: string
  mother_name: string
  mother_phone: string
  guardian_is: string
  guardian_name: string
  guardian_relation: string
  guardian_email: string
  guardian_phone: string
  guardian_address: string
}

export default function GuardianReportPage() {
  const { data: students, loading } = useReportData<StudentRow>("/api/reports/students")
  const { data: classes } = useClasses<{ id: number; name: string }>("/api/classes")
  const [classId, setClassId] = useState("")
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return students.filter((s) => {
      if (classId && String(s.class_id) !== classId) return false
      if (term) {
        const hay = [s.father_name, s.mother_name, s.guardian_name, `${s.first_name} ${s.last_name}`, s.admission_no]
          .filter(Boolean).join(" ").toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [students, classId, q])

  return (
    <div className="space-y-6">
      <ReportBanner title="Guardian Report" subtitle="Reports / Student Information / Guardian Report" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Class">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={selectCls}>
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Student / guardian name..." className={inputCls} />
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Guardian Report (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Admission No</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Father Name</th>
                <th className="px-4 py-3">Father Phone</th>
                <th className="px-4 py-3">Mother Name</th>
                <th className="px-4 py-3">Mother Phone</th>
                <th className="px-4 py-3">Guardian</th>
                <th className="px-4 py-3">Guardian Relation</th>
                <th className="px-4 py-3">Guardian Phone</th>
                <th className="px-4 py-3">Guardian Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={12} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={12} />
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.id} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{s.first_name} {s.last_name}</td>
                    <td className="px-4 py-2.5">{s.admission_no}</td>
                    <td className="px-4 py-2.5">{s.class || "—"}</td>
                    <td className="px-4 py-2.5">{s.father_name || "—"}</td>
                    <td className="px-4 py-2.5">{s.father_phone || "—"}</td>
                    <td className="px-4 py-2.5">{s.mother_name || "—"}</td>
                    <td className="px-4 py-2.5">{s.mother_phone || "—"}</td>
                    <td className="px-4 py-2.5">{s.guardian_name || s.guardian_is || "—"}</td>
                    <td className="px-4 py-2.5">{s.guardian_relation || "—"}</td>
                    <td className="px-4 py-2.5">{s.guardian_phone || "—"}</td>
                    <td className="px-4 py-2.5">{s.guardian_email || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && <FooterCount shown={filtered.length} total={students.length} />}
      </TableCard>
    </div>
  )
}
