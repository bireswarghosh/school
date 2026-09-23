"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { GraduationCap, Loader2, ShieldCheck, CreditCard, Lock, CheckCircle2, Copy, XCircle } from "lucide-react"

export default function RegistrationFormPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    }>
      <RegistrationFormInner />
    </Suspense>
  )
}

type Config = {
  school: { code: string; name: string }
  amount: number
  currency: string
  razorpayAvailable: boolean
  classes: string[]
  enquiry: {
    name: string
    phone: string
    email: string
    classVal: string
    address: string
    description: string
  } | null
}

type OrderResult = {
  mode: "razorpay" | "test"
  registrationId: number
  regFormNo: string
  orderId?: string
  keyId?: string
  amountPaise: number
  amount: number
  currency: string
  schoolName: string
}

type VerifyResult = {
  success: boolean
  regFormNo: string
  amount: number
  regLink: string
  emailSent: boolean
  emailReason?: string
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] bg-white"

function RegistrationFormInner() {
  const searchParams = useSearchParams()
  const code = searchParams.get("code") || ""
  const eid = searchParams.get("eid") || ""

  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [classVal, setClassVal] = useState("")
  const [address, setAddress] = useState("")
  const [description, setDescription] = useState("")

  const [paying, setPaying] = useState(false)
  const [notice, setNotice] = useState("")
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const qs = new URLSearchParams()
      if (code) qs.set("code", code)
      if (eid) qs.set("eid", eid)
      const res = await fetch(`/api/online-admission/registration/config?${qs.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")
      setConfig(data)
      if (data.enquiry) {
        setName(data.enquiry.name || "")
        setPhone(data.enquiry.phone || "")
        setEmail(data.enquiry.email || "")
        setClassVal(data.enquiry.classVal || "")
        setAddress(data.enquiry.address || "")
        setDescription(data.enquiry.description || "")
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [code, eid])

  useEffect(() => { load() }, [load])

  const copyLink = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.regLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  const finish = (res: Response) =>
    res.json().then((d: VerifyResult & { error?: string }) => {
      if (!res.ok) throw new Error(d.error || "Verification failed")
      setResult(d)
    })

  const verify = (payload: any) =>
    fetch("/api/online-admission/registration/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(finish)

  const handlePay = async () => {
    if (!config) return
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setNotice("Please fill Name, Phone and Email before proceeding.")
      return
    }
    setNotice("")
    setPaying(true)
    setError("")
    try {
      const res = await fetch("/api/online-admission/registration/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: config.school.code, enquiryId: eid, name, phone, email, classVal, address, description }),
      })
      const order: OrderResult & { error?: string } = await res.json()
      if (!res.ok) throw new Error(order.error || "Failed to create order")

      if (order.mode === "test") {
        await verify({ registrationId: order.registrationId, testMode: true })
        return
      }

      await loadRazorpay()
      const rzp = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency || "INR",
        name: order.schoolName,
        description: `Admission Registration Fee (${order.regFormNo})`,
        order_id: order.orderId,
        prefill: { name, email, contact: phone },
        handler: (resp: any) => {
          verify({
            registrationId: order.registrationId,
            orderId: resp.razorpay_order_id,
            paymentId: resp.razorpay_payment_id,
            razorpaySignature: resp.razorpay_signature,
          }).catch((e) => setError(e.message)).finally(() => setPaying(false))
        },
        modal: { ondismiss: () => setPaying(false) },
      })
      rzp.on("payment.failed", (resp: any) => {
        setPaying(false)
        setError(resp?.error?.description || "Payment failed. Please try again.")
      })
      rzp.open()
    } catch (e: any) {
      setError(e.message)
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

  if (error && !config) {
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

  if (!config) return null

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-8 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mt-3">Payment Successful!</h2>
            <p className="text-emerald-50 text-sm mt-1">Admission Registration Form #{result.regFormNo}</p>
          </div>
          <div className="p-6">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-5">
              <p className="text-sm text-green-800">
                Thank you for paying the admission enquiry fee of <strong>{config.currency}{Number(result.amount).toLocaleString("en-IN")}</strong>. Your registration form is ready — use the link below to complete registration.
              </p>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Registration Form Link</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={result.regLink}
                className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-700 bg-gray-50 focus:outline-none"
              />
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--secondary)] transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              {result.emailSent ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> A copy of this link was emailed to {email || "your email"}.
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-700">
                  <Copy className="h-3.5 w-3.5" /> Copy this link and send it to the parent. {result.emailReason ? "Email could not be sent." : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] px-6 py-7">
          <div className="flex items-center gap-3">
            <span className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-white">{config.school.name}</h1>
              <p className="text-white/80 text-sm">Online Admission Enquiry & Registration</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {notice && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              {notice}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Parent / student name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone *</label>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
              <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email — registration link will be sent here" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Class (Interested)</label>
              <select className={inputCls} value={classVal} onChange={(e) => setClassVal(e.target.value)}>
                <option value="">Select class</option>
                {config.classes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
              <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Residential address" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description / Note</label>
              <textarea className={`${inputCls} min-h-[80px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any additional details" />
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CreditCard className="h-4 w-4 text-[var(--primary)]" />
              <span>Admission Enquiry & Registration Fee</span>
            </div>
            <div className="text-lg font-bold text-gray-900">{config.currency}{config.amount.toLocaleString("en-IN")}</div>
          </div>

          <button
            onClick={handlePay}
            disabled={paying}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--primary)] text-white text-sm font-bold rounded-xl hover:bg-[var(--secondary)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {paying ? "Processing..." : `Pay ${config.currency}${config.amount.toLocaleString("en-IN")} & Continue`}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure payment · Card · UPI · NetBanking · Wallet
          </p>
        </div>
      </div>
    </div>
  )
}

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    const src = "https://checkout.razorpay.com/v1/checkout.js"
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement("script")
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Could not load the payment gateway. Please try again."))
    document.head.appendChild(s)
  })
}