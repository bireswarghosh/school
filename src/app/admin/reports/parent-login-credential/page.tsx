"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, inputCls, selectCls } from "@/components/reports/ui"

type StudentRow = {
  id: number
  admission_no: string
  first_name: string
  last_name: string
  guardian_name: string
  guardian_email: string
  guardian_phone: string
  class?: string
  section?: string
}

export default function ParentLoginCredentialPage() {
  const { data: students, loading } = useReportData<StudentRow>("/api/reports/students")
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return students.filter((s) => {
      if (!term) return true
      return [s.first_name, s.last_name, s.guardian_name, s.guardian_email, s.guardian_phone, s.admission_no]
        .filter(Boolean).join(" ").toLowerCase().includes(term)
    })
  }, [students, q])

  return (
    <div className="space-y-6">
      <ReportBanner title="Parent Login Credential" subtitle="Reports / Student Information / Parent Login Credential" />

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

      <TableCard title={`Parent Login Credential (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Admission No</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Guardian Name</th>
                <th className="px-4 py-3">Guardian Email</th>
                <th className="px-4 py-3">Guardian Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={7} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={7} />
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.id} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{s.first_name} {s.last_name}</td>
                    <td className="px-4 py-2.5">{s.admission_no}</td>
                    <td className="px-4 py-2.5">{s.class || "—"}</td>
                    <td className="px-4 py-2.5">{s.guardian_name || "—"}</td>
                    <td className="px-4 py-2.5">{s.guardian_email || "—"}</td>
                    <td className="px-4 py-2.5">{s.guardian_phone || "—"}</td>
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
