"use client"
import { toast as notify } from "@/lib/toast"

import { useCallback, useEffect, useState } from "react"
import { CreditCard, Loader2, CheckCircle2, AlertCircle, Crown, Calendar, FileText, Link2 } from "lucide-react"
import { useCurrency } from "@/lib/currency-context"

type BillingData = {
  school: {
    id: number
    name: string
    code: string
    status: string
    plan: string | null
    plan_id: number | null
  }
  plan: {
    id: number
    name: string
    price: number
    billing_period: string
    features: string[]
    description: string | null
  } | null
  subscription: {
    id: number
    status: string
    current_period_start: string | null
    current_period_end: string | null
  } | null
  invoices: {
    id: number
    invoice_no: string
    plan_name: string | null
    amount: number
    currency: string
    status: string
    due_date: string | null
    paid_at: string | null
    payment_link: string | null
  }[]
}

const STATUS_COLOR: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  unpaid: "bg-amber-100 text-amber-700",
  due: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-700",
}

export default function SubscriptionPage() {
  const { symbol } = useCurrency()
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/billing")
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Failed to load billing")
      setData(d)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      notify.success("Payment link copied")
    } catch {
      notify.info(link)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 text-red-500 font-medium">
        {error || "Failed to load billing information"}
      </div>
    )
  }

  const totalDue = data.invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + Number(i.amount), 0)
  const plan = data.plan

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Subscription & Billing</h2>
        <p className="text-sm text-gray-500 mt-1">View your plan, subscription and invoices</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-6 text-white bg-[var(--primary)] relative overflow-hidden">
          <Crown className="h-10 w-10 mb-3 opacity-90" />
          <p className="text-xs opacity-80">Current plan</p>
          <p className="text-2xl font-bold mt-1">{plan?.name || data.school.plan || "—"}</p>
          <p className="text-sm opacity-80 mt-1">
            {plan ? `${symbol} ${Number(plan.price).toLocaleString("en-IN")} / ${plan.billing_period}` : "—"}
          </p>
          <p className="text-xs opacity-70 mt-4">{data.school.name} · {data.school.code}</p>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-[var(--primary)]" />
            <h3 className="font-semibold text-gray-800">Subscription status</h3>
          </div>
          {data.subscription ? (
            <>
              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                data.subscription.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {data.subscription.status?.toUpperCase()}
              </div>
              {data.subscription.current_period_end && (
                <p className="text-sm text-gray-500 mt-3">
                  <span className="font-medium text-gray-700">Renews on:</span>{" "}
                  {data.subscription.current_period_end}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">No active subscription period.</p>
          )}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Total due</span>
            <span className="text-xl font-bold text-amber-600">{symbol} {totalDue.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {plan && plan.features && plan.features.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Plan features</h3>
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(plan.features) ? plan.features : []).map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary-light)] text-sm text-[var(--primary)]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--primary)]" />
            <h3 className="font-semibold text-gray-800">Invoices</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3 font-medium">Invoice</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Due date</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-semibold text-[var(--primary)]">{inv.invoice_no}</td>
                  <td className="px-6 py-3 text-gray-700">{inv.plan_name || "—"}</td>
                  <td className="px-6 py-3 font-semibold text-gray-800">
                    {inv.currency === "INR" ? symbol : inv.currency} {Number(inv.amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[inv.status] || "bg-gray-100 text-gray-600"}`}>
                      {inv.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{inv.due_date || "—"}</td>
                  <td className="px-6 py-3 text-right">
                    {inv.status === "paid" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : "Paid"}
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        <a
                          href={`/saas/pay?invoice=${inv.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Pay now
                        </a>
                        <button
                          onClick={() => copyLink(inv.payment_link || `/saas/pay?invoice=${inv.id}`)}
                          title="Copy payment link"
                          className="p-1.5 text-gray-500 hover:text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg"
                        >
                          <Link2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {data.invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data.invoices.some((i) => i.status === "unpaid") && (
        <div className="flex items-center gap-2 text-xs text-amber-600">
          <AlertCircle className="h-4 w-4" />
          Outstanding invoices are due. Please complete payment to keep your subscription active.
        </div>
      )}
    </div>
  )
}