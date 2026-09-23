"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { GraduationCap, Loader2, CheckCircle2, XCircle, Printer, Send, CheckCheck } from "lucide-react"
import RegistrationForm, { EMPTY_REGISTRATION_FORM, type RegistrationFormData } from "@/components/registration-form"

type LookupResult = {
  regFormNo: string
  name: string
  phone: string
  email: string
  classVal: string
  status: string
  admitted: boolean
  admittedAt: string | null
  formData: RegistrationFormData | null
  formSubmittedAt: string | null
  schoolName: string
  schoolCode: string
  regLink: string
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    }>
      <RegisterInner />
    </Suspense>
  )
}

function RegisterInner() {
  const sp = useSearchParams()
  const ref = sp.get("ref") || ""

  const [data, setData] = useState<LookupResult | null>(null)
  const [logoSrc, setLogoSrc] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState<RegistrationFormData>(EMPTY_REGISTRATION_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/online-admission/registration/lookup?ref=${encodeURIComponent(ref)}`)
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Invalid link")
      setData(d)
      setForm({
        ...EMPTY_REGISTRATION_FORM,
        ...(d.formData || {}),
        seekingClass: d.formData?.seekingClass || d.classVal || "",
        headerRegNo: d.formData?.headerRegNo || d.regFormNo || "",
        formDate: d.formData?.formDate || new Date().toISOString().slice(0, 10),
      })
      try {
        const sres = await fetch(`/api/settings/public?code=${encodeURIComponent(d.schoolCode || "DEFAULT")}`)
        const s = await sres.json()
        setLogoSrc(s.logo_printLogo || s.logo_adminLogo || s.logo_appLogo || "")
      } catch { /* logo optional */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [ref])

  useEffect(() => { if (ref) load() }, [ref, load])

  const handleSubmit = async () => {
    if (!data) return
    setSubmitting(true)
    setMessage("")
    try {
      const res = await fetch("/api/online-admission/registration/form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, formData: form }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Could not submit the form")
      setSubmitted(true)
      setMessage(`Registration form #${d.regFormNo} submitted successfully.`)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not submit the form")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  if (error) {
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

  if (!data) return null

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .sj-reg .form-wrapper { box-shadow: none !important; border: 1px solid #888 !important; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 py-6 print:p-0 print:m-0">
        <div className="no-print mb-5 bg-white rounded-2xl shadow p-5 border border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <span className="h-11 w-11 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900">{data.schoolName}</h1>
              <p className="text-sm text-gray-500">
                Admission Registration Form #{data.regFormNo} — {data.name}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Payment verified — your enrolment is ready. Fill in every field of the form below and click{" "}
              <strong>Submit Registration Form</strong>.
            </span>
          </div>
        </div>

        <RegistrationForm
          value={form}
          onChange={setForm}
          readOnly={submitted}
          regNo={data.regFormNo}
          logoSrc={logoSrc}
          admitted={data.admitted}
        />

        <div className="no-print mt-4 bg-white rounded-xl border border-gray-200 p-4">
          {message && (
            <div className={`mb-3 rounded-lg px-4 py-3 text-sm font-medium ${submitted ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message}
            </div>
          )}
          {submitted ? (
            <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
              <CheckCheck className="h-5 w-5" />
              Form submitted — the school office has received your registration details.
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--primary)] text-white text-sm font-bold rounded-xl hover:bg-[var(--secondary)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "Submitting..." : "Submit Registration Form"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}