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
  gender: string
  dob: string
  father_name: string
  phone: string
  mobile: string
  class?: string
  section?: string
  roll_no: string
  class_id: number
  section_id: number
}

export default function StudentReportPage() {
  const { data: students, loading } = useReportData<StudentRow>("/api/reports/students")
  const { data: classes } = useClasses<{ id: number; name: string }>("/api/classes")
  const [classId, setClassId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [q, setQ] = useState("")

  const sections = useMemo(() => {
    const all = students
      .filter((s) => (classId ? String(s.class_id) === classId : true))
      .map((s) => ({ id: s.section_id, name: s.section || "" }))
    return Array.from(new Map(all.map((s) => [s.id, s])).values())
  }, [students, classId])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return students.filter((s) => {
      if (classId && String(s.class_id) !== classId) return false
      if (sectionId && String(s.section_id) !== sectionId) return false
      if (term) {
        const fullName = `${s.first_name} ${s.last_name}`.toLowerCase()
        if (!fullName.includes(term) && !String(s.admission_no).toLowerCase().includes(term)) return false
      }
      return true
    })
  }, [students, classId, sectionId, q])

  return (
    <div className="space-y-6">
      <ReportBanner title="Student Report" subtitle="Reports / Student Information / Student Report" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Class">
            <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId("") }} className={selectCls}>
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Section">
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={selectCls}>
              <option value="">All Sections</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or admission no..." className={inputCls} />
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Student Report (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Admission No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">DOB</th>
                <th className="px-4 py-3">Father Name</th>
                <th className="px-4 py-3">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={10} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={10} />
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.id} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{s.admission_no}</td>
                    <td className="px-4 py-2.5">{s.first_name} {s.last_name}</td>
                    <td className="px-4 py-2.5">{s.class || "—"}</td>
                    <td className="px-4 py-2.5">{s.section || "—"}</td>
                    <td className="px-4 py-2.5">{s.roll_no || "—"}</td>
                    <td className="px-4 py-2.5">{s.gender || "—"}</td>
                    <td className="px-4 py-2.5">{s.dob ? String(s.dob).slice(0, 10) : "—"}</td>
                    <td className="px-4 py-2.5">{s.father_name || "—"}</td>
                    <td className="px-4 py-2.5">{s.phone || s.mobile || "—"}</td>
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
