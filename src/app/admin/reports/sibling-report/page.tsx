"use client"

import { useMemo, useState } from "react"
import { Search, Users2 } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, inputCls } from "@/components/reports/ui"

type StudentRow = {
  id: number
  admission_no: string
  first_name: string
  last_name: string
  father_name: string
  father_phone: string
  mother_name: string
  mother_phone: string
  guardian_name: string
  guardian_phone: string
  class?: string
  section?: string
}

type SiblingGroup = {
  key: string
  name: string
  phone: string
  students: { id: number; name: string; class?: string; section?: string; admission_no: string }[]
}

export default function SiblingReportPage() {
  const { data: students, loading } = useReportData<StudentRow>("/api/reports/students")
  const [q, setQ] = useState("")

  const groups = useMemo<SiblingGroup[]>(() => {
    const map = new Map<string, SiblingGroup>()
    students.forEach((s) => {
      const parentName = s.father_name || s.guardian_name || s.mother_name || ""
      const phone = s.father_phone || s.guardian_phone || s.mother_phone || ""
      const key = `${parentName.toLowerCase()}|${phone}`
      if (!parentName) return
      const cur = map.get(key) || { key, name: parentName, phone, students: [] }
      cur.students.push({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        class: s.class,
        section: s.section,
        admission_no: s.admission_no,
      })
      map.set(key, cur)
    })
    return Array.from(map.values()).filter((g) => g.students.length > 1)
  }, [students])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return groups
    return groups.filter((g) => g.name.toLowerCase().includes(term) || g.students.some((s) => s.name.toLowerCase().includes(term)))
  }, [groups, q])

  return (
    <div className="space-y-6">
      <ReportBanner title="Sibling Report" subtitle="Reports / Student Information / Sibling Report" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Parent / student name..." className={inputCls} />
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Families with multiple children (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Parent / Guardian</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Siblings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={4} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={4} message="No sibling groups found" />
              ) : (
                filtered.map((g, i) => (
                  <tr key={g.key} className="hover:bg-orange-50/50 align-top">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{g.name}</td>
                    <td className="px-4 py-3">{g.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {g.students.map((s) => (
                          <div key={s.id} className="flex items-center gap-2 text-sm">
                            <Users2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                            <span className="font-medium">{s.name}</span>
                            <span className="text-gray-400">({s.admission_no})</span>
                            <span className="text-gray-500">{s.class}{s.section ? ` · ${s.section}` : ""}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TableCard>
    </div>
  )
}
