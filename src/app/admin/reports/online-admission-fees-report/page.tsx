"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportDataObject, useReportData as useClasses } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, Chip, inputCls } from "@/components/reports/ui"

type Application = {
  id: number
  name: string
  email: string
  phone: string
  class_id: number
  admission_no: string
  father_name: string
  mother_name: string
  date_of_birth: string
  gender: string
  address: string
  status: string
  created_at: string
}

type OnlineAdmissionResponse = {
  code: string
  name: string
  applications: Application[]
}

export default function OnlineAdmissionFeesReportPage() {
  const { data, loading } = useReportDataObject<OnlineAdmissionResponse>("/api/online-admission")
  const { data: classes } = useClasses<{ id: number; name: string }>("/api/classes")
  const [q, setQ] = useState("")

  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes])
  const applications = data?.applications || []

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return applications.filter((a) => {
      if (a.status !== "Approved") return false
      if (term && ![a.name, a.email, a.phone, a.admission_no, a.father_name].filter(Boolean).join(" ").toLowerCase().includes(term)) return false
      return true
    })
  }, [applications, q])

  return (
    <div className="space-y-6">
      <ReportBanner title="Online Admission Fees Collection Report" subtitle="Reports / Finance / Online Admission Fees Collection Report" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name / email / phone..." className={inputCls} />
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Approved Online Admissions (${filtered.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Applied On</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={7} message="Loading..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={7} />
              ) : (
                filtered.map((a, i) => (
                  <tr key={a.id} className="hover:bg-orange-50/50">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{a.name}</td>
                    <td className="px-4 py-2.5">{classMap.get(a.class_id) || "—"}</td>
                    <td className="px-4 py-2.5">{a.email || "—"}</td>
                    <td className="px-4 py-2.5">{a.phone || "—"}</td>
                    <td className="px-4 py-2.5">{a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-2.5"><Chip tone="green">{a.status}</Chip></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && <FooterCount shown={filtered.length} total={applications.length} />}
      </TableCard>
    </div>
  )
}
