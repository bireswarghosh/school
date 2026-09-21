"use client"
import { useEffect } from "react"
import { Printer, X } from "lucide-react"
import { useSchoolInfo } from "@/lib/use-school-info"

export type RegFormInvoiceData = {
  name: string
  phone?: string
  email?: string
  address?: string
  classVal?: string
  reference?: string
  source?: string
  regFormNo?: string
  regFormAmount?: number | string
  regFormPaymentMode?: string
  regFormPaymentDate?: string
  regFormStatus?: string
  regFormTransactionId?: string
  regFormChequeNo?: string
  regFormBank?: string
  regFormNote?: string
}

const fmtDate = (d?: string) => (d && d.split("T")[0]) || "—"
const amount = (a?: number | string) => Number(a) || 0
const inr = (n: number) => "₹" + n.toLocaleString("en-IN")

export default function RegFormInvoiceModal({ data, onClose }: { data: RegFormInvoiceData; onClose: () => void }) {
  const { info: school } = useSchoolInfo()
  useEffect(() => {
    document.body.classList.add("printing-modal-open")
    return () => document.body.classList.remove("printing-modal-open")
  }, [])

  const amt = amount(data.regFormAmount)
  const refParts = [data.regFormTransactionId, data.regFormChequeNo].filter(Boolean)
  const statusColor =
    (data.regFormStatus || "").toLowerCase() === "purchased"
      ? "text-emerald-700 border-emerald-200 bg-emerald-50"
      : "text-amber-700 border-amber-200 bg-amber-50"
  const infoRow = (label: string, value?: string) =>
    value ? (
      <div className="flex justify-between gap-4 py-0.5">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-800 text-right">{value}</span>
      </div>
    ) : null

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 print:block print:p-0" id="reg-form-invoice-modal">
        <div className="absolute inset-0 bg-black/50 print:hidden" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible print:rounded-none print:shadow-none">
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between print:hidden sticky top-0 bg-white z-10 rounded-t-2xl">
            <h3 className="text-base font-semibold text-gray-800">Registration Form Purchase — Invoice</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div id="reg-form-invoice" className="p-6 print:p-4">
            <div className="flex items-start justify-between gap-6 border-b-2 border-gray-800 pb-4">
              <div>
                {school.logoSrc && (
                  <img src={school.logoSrc} alt={`${school.name} logo`} className="h-12 w-12 object-contain mb-2" />
                )}
                <p className="text-2xl font-black text-gray-900">{school.name || "Smart School"}</p>
                {school.address && <p className="text-xs text-gray-500 mt-0.5 max-w-[260px]">{school.address}</p>}
                <p className="text-xs text-gray-500 mt-0.5">
                  {[school.phone, school.email, school.website].filter(Boolean).join(" · ")}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Registration Form Purchase</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black tracking-wide text-[var(--primary)]">INVOICE</p>
                <p className="text-xs text-gray-600 mt-1">
                  Reg Form No: <span className="font-bold text-gray-900">{data.regFormNo || "—"}</span>
                </p>
                <p className="text-xs text-gray-600">Date: {fmtDate(data.regFormPaymentDate)}</p>
                <span className={`mt-2 inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColor}`}>
                  {data.regFormStatus || "Pending"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 py-4 border-b border-gray-200">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Billed To</p>
                <p className="text-sm font-bold text-gray-900">{data.name}</p>
                {infoRow("Phone", data.phone)}
                {infoRow("Email", data.email)}
                {infoRow("Class", data.classVal)}
                {infoRow("Source", data.source)}
                {infoRow("Reference", data.reference)}
                {data.address && <p className="text-xs text-gray-600 mt-1">{data.address}</p>}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Payment Details</p>
                <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 space-y-1">
                  {infoRow("Payment Mode", data.regFormPaymentMode || "—")}
                  {refParts.length > 0 && (
                    <div className="flex justify-between gap-4 py-0.5">
                      <span className="text-gray-500">Txn / Cheque</span>
                      <span className="font-mono font-semibold text-gray-800 text-right">{refParts.join(" · ")}</span>
                    </div>
                  )}
                  {data.regFormBank && (
                    <div className="flex justify-between gap-4 py-0.5">
                      <span className="text-gray-500">Bank</span>
                      <span className="font-semibold text-gray-800">{data.regFormBank}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <table className="w-full text-sm my-4">
              <thead>
                <tr className="border-b-2 border-gray-300 text-gray-500 text-xs uppercase">
                  <th className="text-left py-2 font-bold">Description</th>
                  <th className="text-right py-2 font-bold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2.5 text-gray-800">
                    Registration Form
                    {data.classVal ? ` for Class ${data.classVal}` : ""}
                    {data.regFormNo ? ` (${data.regFormNo})` : ""}
                  </td>
                  <td className="py-2.5 font-semibold text-gray-800 text-right">{inr(amt)}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="py-2" />
                </tr>
                <tr className="border-t-2 border-gray-300">
                  <td className="py-2 text-sm font-bold text-gray-900">Total</td>
                  <td className="py-2 text-base font-black text-[var(--primary)] text-right">{inr(amt)}</td>
                </tr>
              </tbody>
            </table>

            {data.regFormNote && (
              <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 mb-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Payment Note</p>
                <p className="text-xs text-gray-700">{data.regFormNote}</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-dashed border-gray-300 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">
                This is a computer-generated invoice for the Registration Form Purchase recorded in the Admission Enquiry module.
              </p>
              <p className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">{school.name || "Smart School"} · Front Office</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #reg-form-invoice-modal {
            position: absolute !important;
            inset: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            display: block !important;
            padding: 0 !important;
            background: #fff !important;
          }
          #reg-form-invoice, #reg-form-invoice * { visibility: visible; }
          #reg-form-invoice-modal .absolute { display: none !important; }
        }
      `}</style>
    </>
  )
}