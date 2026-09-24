"use client"

import { useState, useEffect, useCallback } from "react"
import { Wallet, Loader2, CheckCircle2, ListChecks, History, ChevronDown, ChevronRight, CreditCard, Landmark, ShieldCheck } from "lucide-react"
import { useCurrency } from "@/lib/currency-context"

function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true)
    const s = document.createElement("script")
    s.src = src
    s.onload = () => resolve(true)
    s.onerror = () => reject(new Error("Failed to load payment SDK"))
    document.head.appendChild(s)
  })
}

// Opens the Razorpay checkout sheet. Resolves with the Razorpay payment id on
// success, or null when the user cancels / the payment fails.
async function openRazorpayCheckout(order: any): Promise<{ razorpayPaymentId: string } | null> {
  await loadScript("https://checkout.razorpay.com/v1/checkout.js")
  return new Promise((resolve) => {
    const RazorpayCtor = (window as any).Razorpay
    if (!RazorpayCtor) {
      resolve(null)
      return
    }
    const rzp = new RazorpayCtor({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amountPaise,
      currency: order.currency,
      name: order.name || "School",
      description: order.description || "Fee payment",
      prefill: { email: order.prefillEmail },
      handler: (resp: any) => resolve({ razorpayPaymentId: resp.razorpay_payment_id }),
      modal: { ondismiss: () => resolve(null) },
    })
    rzp.on("payment.failed", () => resolve(null))
    rzp.open()
  })
}

const PAY_MODES = ["Cash", "UPI", "Cheque", "Card", "Bank Transfer", "Online", "Other"]

type Tab = "dues" | "history"
type ManualAnswer = { mode: string; reference: string }

export default function PortalFees() {
  const { symbol } = useCurrency()
  const [role, setRole] = useState("")
  const [kids, setKids] = useState<any[]>([])
  const [studentId, setStudentId] = useState("")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [payingId, setPayingId] = useState<number | null>(null)
  const [payingGroup, setPayingGroup] = useState<string | null>(null)
  const [payingAll, setPayingAll] = useState(false)
  const [paidMsg, setPaidMsg] = useState("")
  const [tab, setTab] = useState<Tab>("dues")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [manualPrompt, setManualPrompt] = useState<{ amount: number; resolve: (a: ManualAnswer | null) => void } | null>(null)
  const [gateways, setGateways] = useState<any[]>([])
  const [chooser, setChooser] = useState<{ amount: number; resolve: (g: string | null) => void } | null>(null)
  const [demoPrompt, setDemoPrompt] = useState<{ order: any; resolve: (ok: boolean) => void } | null>(null)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setRole(d.user?.role || ""))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!role) return
    fetch("/api/my/fees/gateways")
      .then((r) => r.json())
      .then((d) => setGateways(Array.isArray(d) ? d : d.gateways || []))
      .catch(() => setGateways([]))
  }, [role])

  useEffect(() => {
    if (role !== "parent") return
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
  }, [role])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      if (role === "student") {
        const res = await fetch("/api/my/student/fees")
        const d = await res.json()
        if (d.error) setError(d.error)
        else {
          setData(d)
          setStudentId(String(d.studentId ?? ""))
        }
      } else {
        if (!studentId) return
        const res = await fetch(`/api/my/parent/kids/fees?studentId=${encodeURIComponent(studentId)}`)
        const d = await res.json()
        if (d.error) setError(d.error)
        else setData(d)
      }
    } catch {
      setError("Failed to load fees")
    } finally {
      setLoading(false)
    }
  }, [role, studentId])

  useEffect(() => {
    load()
  }, [load])

  const askManual = (amount: number) =>
    new Promise<ManualAnswer | null>((resolve) => setManualPrompt({ amount, resolve }))

  // Ask the payer which payment method to use (gateways list + manual). When no
  // gateway is enabled we go straight to the manual flow.
  const chooseGateway = (amount: number): Promise<string | null> => {
    if (gateways.length === 0) return Promise.resolve("manual")
    return new Promise((resolve) => setChooser({ amount, resolve }))
  }

  const confirmDemoCheckout = (order: any): Promise<boolean> =>
    new Promise((resolve) => setDemoPrompt({ order, resolve }))

  // Gateway order → Robby checkout + verify. Demo gateway order → branded demo
  // checkout + verify. Manual order → ask how the user paid, then confirm via
  // verify so the school keeps the payment mode/reference.
  const startPayment = async (order: any) => {
    if (order.mode === "razorpay_order") {
      const result = await openRazorpayCheckout(order)
      if (!result) throw new Error("Payment was not completed (cancelled or failed)")
      const verifyRes = await fetch("/api/my/fees/pay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: Number(studentId),
          paymentId: order.paymentId,
          paymentIds: order.paymentIds,
          razorpayPaymentId: result.razorpayPaymentId,
        }),
      })
      const verified = await verifyRes.json()
      if (!verifyRes.ok) throw new Error(verified.error || "Verification failed")
    } else if (order.mode === "demo") {
      const ok = await confirmDemoCheckout(order)
      if (!ok) throw new Error("Payment was not completed (cancelled)")
      const verifyRes = await fetch("/api/my/fees/pay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: Number(studentId),
          paymentIds: order.paymentIds,
          paymentMode: "Online",
        }),
      })
      const verified = await verifyRes.json()
      if (!verifyRes.ok) throw new Error(verified.error || "Verification failed")
    } else {
      const answer = await askManual(order.amount ?? 0)
      if (!answer) throw new Error("Payment was not recorded (cancelled)")
      const verifyRes = await fetch("/api/my/fees/pay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: Number(studentId),
          paymentIds: order.paymentIds,
          paymentMode: answer.mode,
          reference: answer.reference,
        }),
      })
      const verified = await verifyRes.json()
      if (!verifyRes.ok) throw new Error(verified.error || "Verification failed")
    }
  }

  const runOrder = async (payload: any): Promise<number> => {
    const orderRes = await fetch("/api/my/fees/pay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: Number(studentId), ...payload }),
    })
    const order = await orderRes.json()
    if (!orderRes.ok) throw new Error(order.error || "Failed to start payment")
    await startPayment(order)
    return order.amount ?? 0
  }

  const pay = async (feesTypeId: number) => {
    const due = data?.dues?.find((d: any) => d.feesTypeId === feesTypeId)
    if (!due || Number(due.balance) <= 0) return
    setPayingId(feesTypeId)
    setError("")
    setPaidMsg("")
    try {
      const freshBalance = Number(due.balance)
      const gateway = await chooseGateway(freshBalance)
      if (gateway === null) {
        setPayingId(null)
        return
      }
      const amount = await runOrder({ feesTypeId: due.feesTypeId, amount: freshBalance, gateway })
      setPaidMsg(`Payment of ${symbol}${amount.toLocaleString("en-IN")} completed successfully`)
      await load()
    } catch (e: any) {
      setError(e.message || "Network error")
    } finally {
      setPayingId(null)
    }
  }

  const payGroup = async (group: any) => {
    const heads = group.dues.filter((d: any) => Number(d.balance) > 0)
    if (heads.length === 0) return
    const freshTotal = heads.reduce((s: number, h: any) => s + Number(h.balance), 0)
    setPayingGroup(group.name)
    setError("")
    setPaidMsg("")
    try {
      const gateway = await chooseGateway(freshTotal)
      if (gateway === null) {
        setPayingGroup(null)
        return
      }
      const amount = await runOrder({ feesTypeIds: heads.map((h: any) => h.feesTypeId), gateway })
      setPaidMsg(`Payment of ${symbol}${amount.toLocaleString("en-IN")} completed successfully`)
      await load()
    } catch (e: any) {
      setError(e.message || "Network error")
    } finally {
      setPayingGroup(null)
    }
  }

  const payAll = async () => {
    const freshTotal = Number(summary.totalDue ?? 0)
    if (freshTotal <= 0) return
    setPayingAll(true)
    setError("")
    setPaidMsg("")
    try {
      const gateway = await chooseGateway(freshTotal)
      if (gateway === null) {
        setPayingAll(false)
        return
      }
      const amount = await runOrder({ payAll: true, gateway })
      setPaidMsg(`Full payment of ${symbol}${amount.toLocaleString("en-IN")} completed successfully`)
      await load()
    } catch (e: any) {
      setError(e.message || "Network error")
    } finally {
      setPayingAll(false)
    }
  }

  const summary = data?.summary || {}
  const gatewayName = (code: string | null | undefined) => {
    if (!code) return "—"
    const g = gateways.find((x: any) => x.code === code)
    return g ? g.name : code.charAt(0).toUpperCase() + code.slice(1)
  }
  const allHeads = data?.dues || []
  const dueHeads = allHeads.filter((d: any) => Number(d.balance) > 0)

  // Group the dues by their fee group (fallback to "No Group").
  const groups: { name: string; dues: any[] }[] = []
  for (const d of allHeads) {
    const name = d.feesGroup || "No Group"
    const g = groups.find((x) => x.name === name)
    if (g) g.dues.push(d)
    else groups.push({ name, dues: [d] })
  }
  const groupTotal = (g: any) => g.dues.reduce((s: number, d: any) => s + Number(d.balance), 0)

  const toggleGroup = (name: string) => {
    setExpanded((p) => {
      const next = { ...p }
      if (next[name] === undefined) next[name] = true
      else next[name] = !next[name]
      return next
    })
  }

  const statusBadge = (status: string) => {
    const s = String(status || "").toLowerCase()
    if (s === "paid" || s === "success") return "bg-green-100 text-green-700"
    if (s === "pending") return "bg-amber-100 text-amber-700"
    return "bg-gray-100 text-gray-600"
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">Fees & Payments</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">
          {role === "student" ? "Your fee dues and payment history" : "Fee dues and payment history for your children"}
        </p>
      </div>

      {role === "parent" && (
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
      )}

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}
      {paidMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/40 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          {paidMsg}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--subtitle-color)] flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel rounded-xl p-5">
              <span className="text-sm font-medium text-[var(--subtitle-color)]">Total Due</span>
              <div className="mt-2 text-2xl font-bold text-[var(--title-color)]">
                {symbol}
                {(summary.totalDue ?? 0).toLocaleString("en-IN")}
              </div>
              <div className="mt-4">
                {dueHeads.length > 0 ? (
                  <button
                    onClick={payAll}
                    disabled={payingAll}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60"
                  >
                    {payingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}
                    Pay Full Due {symbol}{(summary.totalDue ?? 0).toLocaleString("en-IN")}
                  </button>
                ) : (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">All Cleared</span>
                )}
                {gateways.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <p className="text-[11px] font-medium text-[var(--subtitle-color)] mb-1.5">PAY WITH</p>
                    <div className="flex flex-wrap gap-1.5">
                      {gateways.map((g: any) => (
                        <span
                          key={g.code}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--primary-light)]/60 text-[var(--primary)] text-[11px] font-semibold"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {g.name}
                          {g.demo && <span className="text-[10px] font-medium opacity-70">Demo</span>}
                        </span>
                      ))}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold">
                        <Landmark className="h-3 w-3" />
                        Cash / Manual
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="glass-panel rounded-xl p-5">
              <span className="text-sm font-medium text-[var(--subtitle-color)]">Total Paid</span>
              <div className="mt-2 text-2xl font-bold text-[var(--title-color)]">
                {symbol}
                {(summary.totalPaid ?? 0).toLocaleString("en-IN")}
              </div>
            </div>
            <div className="glass-panel rounded-xl p-5">
              <span className="text-sm font-medium text-[var(--subtitle-color)]">Pending Heads</span>
              <div className="mt-2 text-2xl font-bold text-[var(--title-color)]">{summary.pendingCount ?? 0}</div>
            </div>
          </div>

          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-1">
              <button
                onClick={() => setTab("dues")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tab === "dues" ? "bg-[var(--primary)] text-white" : "text-[var(--subtitle-color)] hover:text-[var(--primary)]"
                }`}
              >
                <ListChecks className="h-4 w-4" />
                Fee Dues
                {dueHeads.length > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === "dues" ? "bg-white/20" : "bg-[var(--primary-light)] text-[var(--primary)]"}`}>
                    {dueHeads.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab("history")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tab === "history" ? "bg-[var(--primary)] text-white" : "text-[var(--subtitle-color)] hover:text-[var(--primary)]"
                }`}
              >
                <History className="h-4 w-4" />
                Payment History
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === "history" ? "bg-white/20" : "bg-[var(--primary-light)] text-[var(--primary)]"}`}>
                  {(data.payments || []).length}
                </span>
              </button>
            </div>

            {tab === "dues" ? (
              allHeads.length === 0 ? (
                <p className="p-8 text-center text-sm text-[var(--subtitle-color)]">No fee records found.</p>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {groups.map((group) => {
                    const open = expanded[group.name] !== false
                    const total = groupTotal(group)
                    const pendingHeads = group.dues.filter((d: any) => Number(d.balance) > 0)
                    return (
                      <div key={group.name}>
                        <div className="px-5 py-3 flex items-center gap-3">
                          <button onClick={() => toggleGroup(group.name)} className="text-[var(--subtitle-color)] hover:text-[var(--primary)]">
                            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[var(--title-color)] truncate">{group.name}</p>
                            <p className="text-xs text-[var(--subtitle-color)]">
                              {group.dues.length} head{group.dues.length === 1 ? "" : "s"}
                              {pendingHeads.length > 0 && ` · ${pendingHeads.length} pending`}
                            </p>
                          </div>
                          <div className="shrink-0 flex items-center gap-3">
                            {total > 0 ? (
                              <span className="font-bold text-[var(--primary)]">
                                {symbol}{total.toLocaleString("en-IN")}
                              </span>
                            ) : (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Paid</span>
                            )}
                            {pendingHeads.length > 0 && (
                              <button
                                onClick={() => payGroup(group)}
                                disabled={payingGroup === group.name}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60"
                              >
                                {payingGroup === group.name && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Pay Group
                              </button>
                            )}
                          </div>
                        </div>
                        {open && (
                          <table className="w-full text-sm border-t border-[var(--border)]">
                            <thead>
                              <tr className="text-left text-xs text-[var(--subtitle-color)] border-b border-[var(--border)]">
                                <th className="px-5 pl-12 py-2 font-medium">Fee Head</th>
                                <th className="px-5 py-2 font-medium">Amount</th>
                                <th className="px-5 py-2 font-medium">Paid</th>
                                <th className="px-5 py-2 font-medium">Balance</th>
                                <th className="px-5 py-2 font-medium">Due Date</th>
                                <th className="px-5 py-2 font-medium">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                              {group.dues.map((d: any) => (
                                <tr key={d.feesTypeId}>
                                  <td className="px-5 pl-12 py-2.5 font-medium text-[var(--foreground)]">{d.feesType}</td>
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
                                        onClick={() => pay(d.feesTypeId)}
                                        disabled={payingId === d.feesTypeId}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60"
                                      >
                                        {payingId === d.feesTypeId && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
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
                    )
                  })}
                </div>
              )
            ) : (data.payments || []).length === 0 ? (
              <p className="p-8 text-center text-sm text-[var(--subtitle-color)]">No payments yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--subtitle-color)] border-b border-[var(--border)]">
                    <th className="px-5 py-2.5 font-medium">Date</th>
                    <th className="px-5 py-2.5 font-medium">Gateway</th>
                    <th className="px-5 py-2.5 font-medium">Mode</th>
                    <th className="px-5 py-2.5 font-medium">Reference</th>
                    <th className="px-5 py-2.5 font-medium">Receipt</th>
                    <th className="px-5 py-2.5 font-medium">Amount</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {(data.payments || []).map((p: any) => (
                    <tr key={p.id}>
                      <td className="px-5 py-2.5 text-[var(--foreground)]">{p.paymentDate || "—"}</td>
                      <td className="px-5 py-2.5">
                        {p.paymentMethod ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-semibold">
                            <CreditCard className="h-3 w-3" />
                            {gatewayName(p.paymentMethod)}
                          </span>
                        ) : (
                          <span className="text-[var(--subtitle-color)]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-[var(--foreground)]">{p.paymentMode || "—"}</td>
                      <td className="px-5 py-2.5 text-[var(--subtitle-color)] font-mono text-xs">{p.transactionId || "—"}</td>
                      <td className="px-5 py-2.5 text-[var(--subtitle-color)] font-mono text-xs">#{p.id}</td>
                      <td className="px-5 py-2.5 text-[var(--foreground)]">
                        {symbol}{Number(p.paidAmount ?? p.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(p.status)}`}>
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

      {manualPrompt && (
        <ManualPayDialog
          amount={manualPrompt.amount}
          onCancel={() => {
            manualPrompt.resolve(null)
            setManualPrompt(null)
          }}
          onConfirm={(answer) => {
            manualPrompt.resolve(answer)
            setManualPrompt(null)
          }}
        />
      )}

      {chooser && (
        <PaymentChooser
          gateways={gateways}
          amount={chooser.amount}
          onCancel={() => {
            chooser.resolve(null)
            setChooser(null)
          }}
          onSelect={(code) => {
            chooser.resolve(code)
            setChooser(null)
          }}
        />
      )}

      {demoPrompt && (
        <DemoCheckoutDialog
          order={demoPrompt.order}
          onCancel={() => {
            demoPrompt.resolve(false)
            setDemoPrompt(null)
          }}
          onConfirm={() => {
            demoPrompt.resolve(true)
            setDemoPrompt(null)
          }}
        />
      )}
    </div>
  )
}

function ManualPayDialog({
  amount,
  onCancel,
  onConfirm,
}: {
  amount: number
  onCancel: () => void
  onConfirm: (a: ManualAnswer) => void
}) {
  const [mode, setMode] = useState("")
  const [reference, setReference] = useState("")
  const { symbol } = useCurrency()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative glass-panel rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold text-[var(--title-color)]">How did you pay?</h3>
        <p className="text-sm text-[var(--subtitle-color)]">
          Your payment of <span className="font-semibold text-[var(--primary)]">{symbol}{(amount || 0).toLocaleString("en-IN")}</span> will
          be recorded as pending. Tell us how you paid so the school can confirm it.
        </p>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Payment Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">Choose how you paid</option>
            {PAY_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Transaction / Reference No. <span className="text-xs text-[var(--subtitle-color)]">(optional)</span>
          </label>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. UPI transaction id, cheque no., bank ref"
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--subtitle-color)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
          <button
            onClick={() => mode && onConfirm({ mode, reference: reference.trim() })}
            disabled={!mode}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  )
}

function PaymentChooser({
  gateways,
  amount,
  onCancel,
  onSelect,
}: {
  gateways: any[]
  amount: number
  onCancel: () => void
  onSelect: (code: string) => void
}) {
  const { symbol } = useCurrency()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative glass-panel rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold text-[var(--title-color)]">Choose payment method</h3>
        <p className="text-sm text-[var(--subtitle-color)]">
          Paying <span className="font-semibold text-[var(--primary)]">{symbol}{(amount || 0).toLocaleString("en-IN")}</span>.
          Pick an online gateway or pay in cash / offline.
        </p>
        <div className="space-y-2">
          {gateways.map((g: any) => (
            <button
              key={g.code}
              onClick={() => onSelect(g.code)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:ring-2 hover:ring-[var(--primary-light)] transition-all text-left"
            >
              <div className="h-9 w-9 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--foreground)]">{g.name}</p>
                <p className="text-xs text-[var(--subtitle-color)]">{g.notes || g.mode}</p>
              </div>
              {g.demo && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                  Demo
                </span>
              )}
              <span className="text-[var(--subtitle-color)]">›</span>
            </button>
          ))}
          <button
            onClick={() => onSelect("manual")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:ring-2 hover:ring-[var(--primary-light)] transition-all text-left"
          >
            <div className="h-9 w-9 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
              <Landmark className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--foreground)]">Cash / Offline Payment</p>
              <p className="text-xs text-[var(--subtitle-color)]">Pay at the school office, then confirm here</p>
            </div>
            <span className="text-[var(--subtitle-color)]">›</span>
          </button>
        </div>
        <div className="flex items-center justify-end pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--subtitle-color)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function DemoCheckoutDialog({
  order,
  onCancel,
  onConfirm,
}: {
  order: any
  onCancel: () => void
  onConfirm: () => void
}) {
  const { symbol } = useCurrency()
  const gw = order.gateway || {}
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative glass-panel rounded-xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--title-color)]">{gw.name || "Gateway"}</h3>
            <p className="text-xs text-[var(--subtitle-color)]">
              {gw.demo ? "Test / Demo checkout" : "Secure online payment"}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--subtitle-color)]">Amount</span>
            <span className="font-bold text-[var(--foreground)]">
              {symbol}{Number(order.amount || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--subtitle-color)]">Heads</span>
            <span className="text-[var(--foreground)]">
              {Array.isArray(order.heads) && order.heads.length > 0
                ? `${order.heads.length} head${order.heads.length === 1 ? "" : "s"}`
                : order.bulk
                ? "Multiple"
                : "1"}
            </span>
          </div>
        </div>
        <p className="text-xs text-[var(--subtitle-color)]">
          This gateway is running in <span className="font-semibold">Test mode</span> with demo credentials. No real money
          is moved. Confirm below to simulate the {gw.name} payment — the gateway and transaction details are recorded for
          the school.
        </p>
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--subtitle-color)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90"
          >
            <CheckCircle2 className="h-4 w-4" />
            Simulate Payment
          </button>
        </div>
      </div>
    </div>
  )
}