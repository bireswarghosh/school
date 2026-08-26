"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, CheckCircle2, XCircle, CreditCard, ShieldCheck, Crown } from "lucide-react"

export default function PayInvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    }>
      <PayInvoiceInner />
    </Suspense>
  )
}

type InvoiceInfo = {
  id: number
  invoiceNo: string
  planName: string | null
  amount: number
  currency: string
  status: string
  dueDate: string | null
  paidAt: string | null
  schoolName: string
  razorpayOrderId: string | null
  razorpayConfigured: boolean
}

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  unpaid: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  due: "bg-blue-100 text-blue-700",
}

function PayInvoiceInner() {
  const searchParams = useSearchParams()
  const invoiceParam = searchParams.get("invoice") || ""
  const [inv, setInv] = useState<InvoiceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [paying, setPaying] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/saas/invoices/pay/status?invoice=${invoiceParam}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load invoice")
      setInv(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [invoiceParam])

  useEffect(() => { load() }, [load])

  const handlePay = async () => {
    if (!inv) return
    setPaying(true)
    setError("")
    try {
      const res = await fetch("/api/saas/invoices/pay/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice: inv.id, paymentId: null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Payment failed")
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  if (error && !inv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <XCircle className="h-7 w-7 text-red-500" />
          </div>
          <p className="text-gray-700 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  if (!inv) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[var(--primary-light)] p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center mb-3">
            <Crown className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Smart School SaaS</h1>
          <p className="text-sm text-gray-500 mt-1">Pay your subscription invoice</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-[var(--primary)] px-6 py-4 text-white flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">Invoice {inv.invoiceNo}</p>
              <p className="font-semibold">{inv.schoolName}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-700"}`}>
              {inv.status?.toUpperCase()}
            </span>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="font-semibold text-gray-900">{inv.planName || "Subscription"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Amount Due</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inv.currency === "INR" ? "₹" : "$"} {Number(inv.amount).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-4">
              <div>
                <p className="text-gray-400 text-xs">Invoice number</p>
                <p className="font-medium text-gray-700">{inv.invoiceNo}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Due date</p>
                <p className="font-medium text-gray-700">{inv.dueDate || "—"}</p>
              </div>
            </div>

            {inv.status === "paid" && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Payment received</p>
                  <p className="text-xs text-emerald-600">{inv.paidAt ? new Date(inv.paidAt).toLocaleString() : "Paid"}</p>
                </div>
              </div>
            )}

            {inv.status !== "paid" && (
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm hover:bg-[var(--secondary)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {paying ? "Processing..." : `Pay ${inv.currency === "INR" ? "₹" : ""} ${Number(inv.amount).toLocaleString("en-IN")}`}
              </button>
            )}

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 border-t border-gray-100 pt-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secured payment by Razorpay
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}