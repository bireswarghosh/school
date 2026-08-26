"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, FooterCount, inputCls, selectCls } from "@/components/reports/ui"
import { useCurrency } from "@/lib/currency-context"

type FeeRow = {
  id: number
  studentId?: number
  classId?: number
  feesGroup?: string
  feesType?: string
  amount?: number
  discountId?: number
  discountAmount?: number
  fineAmount?: number
  paidAmount?: number
  paymentMode?: string
  paymentDate?: string
  status?: string
  createdAt?: string
}

type StudentRow = {
  id: number
  name?: string
  admission_no?: string
  class?: string
  section?: string
  class_id?: number
}

type GroupRow = {
  studentId: number
  feesType: string
  feesGroup: string
  amount: number
  discount: number
  fine: number
  paid: number
}

export default function BalanceFeesStatementPage() {
  const { symbol } = useCurrency()
  const fmt = (n: number) => symbol + (Number(n) || 0).toLocaleString("en-IN")
  const { data: fees, loading } = useReportData<FeeRow>("/api/fees/fees-payment")
  const { data: students } = useReportData<StudentRow>("/api/reports/students")
  const { data: classes } = useReportData<{ id: number; name: string }>("/api/classes")
  const [classId, setClassId] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students])

  const rows = useMemo(() => {
    return fees.filter((r) => {
      if (classId) {
        const st = studentMap.get(r.studentId ?? 0)
        if (st && String(st.class_id) !== classId) return false
        if (!st && String(r.classId ?? 0) !== classId) return false
      }
      const day = r.paymentDate ? String(r.paymentDate).slice(0, 10) : ""
      if (from && (!day || day < from)) return false
      if (to && (!day || day > to)) return false
      return true
    })
  }, [fees, classId, from, to, studentMap])

  const grouped = useMemo(() => {
    const m = new Map<string, GroupRow>()
    for (const r of rows) {
      const key = `${r.studentId ?? 0}-${r.feesType || ""}`
      const g = m.get(key) || {
        studentId: r.studentId ?? 0,
        feesType: r.feesType || "",
        feesGroup: r.feesGroup || "",
        amount: 0,
        discount: 0,
        fine: 0,
        paid: 0,
      }
      g.amount += Number(r.amount) || 0
      g.discount += Number(r.discountAmount) || 0
      g.fine += Number(r.fineAmount) || 0
      g.paid += Number(r.paidAmount) || 0
      m.set(key, g)
    }
    return Array.from(m.values()).filter((g) => g.amount - g.discount - g.paid + g.fine > 0)
  }, [rows])

  const totalBalance = useMemo(
    () => grouped.reduce((s, g) => s + (g.amount - g.discount - g.paid + g.fine), 0),
    [grouped]
  )

  return (
    <div className="space-y-6">
      <ReportBanner title="Balance Fees Statement" subtitle="Reports / Finance / Balance Fees Statement" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Class">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={selectCls}>
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="From Date">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          </Field>
          <Field label="To Date">
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </Field>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </FilterCard>

      <TableCard title={`Balance Fees Statement (${grouped.length})`} action={<PrintButtons />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Fees Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Fine</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <EmptyRow colSpan={9} message="Loading..." />
              ) : grouped.length === 0 ? (
                <EmptyRow colSpan={9} />
              ) : (
                grouped.map((g, i) => {
                  const st = studentMap.get(g.studentId)
                  const balance = g.amount - g.discount - g.paid + g.fine
                  return (
                    <tr key={`${g.studentId}-${g.feesType}`} className="hover:bg-orange-50/50">
                      <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium">{st?.name || "—"}</td>
                      <td className="px-4 py-2.5">{st?.class || st?.section || "—"}</td>
                      <td className="px-4 py-2.5">{g.feesGroup || "—"}</td>
                      <td className="px-4 py-2.5">{fmt(g.amount)}</td>
                      <td className="px-4 py-2.5">{fmt(g.discount)}</td>
                      <td className="px-4 py-2.5">{fmt(g.fine)}</td>
                      <td className="px-4 py-2.5">{fmt(g.paid)}</td>
                      <td className="px-4 py-2.5 font-semibold text-red-600">{fmt(balance)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {grouped.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-gray-700">
                  <td className="px-4 py-2.5" colSpan={8}>Total Balance</td>
                  <td className="px-4 py-2.5 text-red-600">{fmt(totalBalance)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {!loading && <FooterCount shown={grouped.length} total={grouped.length} />}
      </TableCard>
    </div>
  )
}
