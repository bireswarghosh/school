"use client"

import { useState, useEffect, useCallback } from "react"
import { Wallet, Loader2, CheckCircle2 } from "lucide-react"

export default function PortalFees() {
  const [kids, setKids] = useState<any[]>([])
  const [studentId, setStudentId] = useState("")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [payingId, setPayingId] = useState<number | null>(null)
  const [paidMsg, setPaidMsg] = useState("")

  useEffect(() => {
    fetch("/api/my/parent/kids")
      .then((r) => r.json())
      .then((d) => {
        const kidsList = d.kids || []
        setKids(kidsList)
        const qs = new URLSearchParams(window.location.search).get("studentId")
        const initial = qs || (kidsList[0] ? String(kidsList[0].id) : "")
        setStudentId(initial)
      })
      .catch(() => setError("Failed to load children"))
  }, [])

  const load = useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/my/parent/kids/fees?studentId=${encodeURIComponent(studentId)}`)
      const d = await res.json()
      if (d.error) setError(d.error)
      else setData(d)
    } catch {
      setError("Failed to load fees")
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    load()
  }, [load])

  const pay = async (masterId: number) => {
    setPayingId(masterId)
    setError("")
    setPaidMsg("")
    const due = data?.dues?.find((d: any) => d.masterId === masterId)
    if (!due) return
    try {
      const res = await fetch("/api/my/parent/kids/fees/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: Number(studentId),
          feesTypeId: due.feesTypeId,
          amount: due.balance,
          paymentMode: "Online",
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error || "Payment failed")
      } else {
        setPaidMsg(`Payment of ₹${due.balance.toLocaleString("en-IN")} recorded successfully`)
        load()
      }
    } catch {
      setError("Network error")
    } finally {
      setPayingId(null)
    }
  }

  const summary = data?.summary || {}
  const symbol = "₹"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">Fees & Payments</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">Fee dues and payment history for your children</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-[var(--foreground)]">Child</label>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
        >
          {kids.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name} · {k.class}-{k.section}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}
      {paidMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/40 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          {paidMsg}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--subtitle-color)]">Loading…</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--subtitle-color)]">Total Due</span>
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              </div>
              <span className="text-2xl font-bold text-[var(--title-color)]">
                {symbol}
                {(summary.totalDue ?? 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="glass-panel rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--subtitle-color)]">Total Paid</span>
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              </div>
              <span className="text-2xl font-bold text-[var(--title-color)]">
                {symbol}
                {(summary.totalPaid ?? 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="glass-panel rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--subtitle-color)]">Pending Heads</span>
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              </div>
              <span className="text-2xl font-bold text-[var(--title-color)]">{summary.pendingCount ?? 0}</span>
            </div>
          </div>

          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[var(--primary)]" />
              <h3 className="font-semibold text-[var(--title-color)]">Fee Dues</h3>
            </div>
            {data.dues.length === 0 ? (
              <p className="p-8 text-center text-sm text-[var(--subtitle-color)]">No fee records found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--subtitle-color)] border-b border-[var(--border)]">
                    <th className="px-5 py-2.5 font-medium">Fee Head</th>
                    <th className="px-5 py-2.5 font-medium">Amount</th>
                    <th className="px-5 py-2.5 font-medium">Paid</th>
                    <th className="px-5 py-2.5 font-medium">Balance</th>
                    <th className="px-5 py-2.5 font-medium">Due Date</th>
                    <th className="px-5 py-2.5 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.dues.map((d: any) => (
                    <tr key={d.masterId}>
                      <td className="px-5 py-2.5 font-medium text-[var(--foreground)]">{d.feesType}</td>
                      <td className="px-5 py-2.5 text-[var(--foreground)]">{symbol}{Number(d.amount).toLocaleString("en-IN")}</td>
                      <td className="px-5 py-2.5 text-[var(--foreground)]">{symbol}{Number(d.paidAmount).toLocaleString("en-IN")}</td>
                      <td className="px-5 py-2.5">
                        {d.balance > 0 ? (
                          <span className="font-semibold text-[var(--primary)]">{symbol}{Number(d.balance).toLocaleString("en-IN")}</span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Paid</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-[var(--foreground)]">{d.dueDate || "—"}</td>
                      <td className="px-5 py-2.5">
                        {d.balance > 0 && (
                          <button
                            onClick={() => pay(d.masterId)}
                            disabled={payingId === d.masterId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60"
                          >
                            {payingId === d.masterId && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Pay {symbol}{Number(d.balance).toLocaleString("en-IN")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--title-color)]">Payment History</h3>
            </div>
            {data.payments.length === 0 ? (
              <p className="p-8 text-center text-sm text-[var(--subtitle-color)]">No payments yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--subtitle-color)] border-b border-[var(--border)]">
                    <th className="px-5 py-2.5 font-medium">Date</th>
                    <th className="px-5 py-2.5 font-medium">Mode</th>
                    <th className="px-5 py-2.5 font-medium">Amount</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="px-5 py-2.5 text-[var(--foreground)]">{p.paymentDate}</td>
                      <td className="px-5 py-2.5 text-[var(--foreground)]">{p.paymentMode}</td>
                      <td className="px-5 py-2.5 text-[var(--foreground)]">
                        {symbol}{Number(p.paidAmount ?? p.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          {p.status || "Paid"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
