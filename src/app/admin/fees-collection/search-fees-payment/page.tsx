"use client"

import { useState, useMemo } from "react"
import { Search, Eye, X } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"

type PaymentRecord = {
  id?: number
  paymentId: string
  admissionNo: string
  studentName: string
  className: string
  amount: number
  paymentDate: string
  paymentMode: string
  paymentMethod?: string
  transactionId?: string
  status: string
}

const statusColors: Record<string, string> = {
  Completed: "bg-green-50 text-green-700 border-green-200",
  Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Failed: "bg-red-50 text-red-700 border-red-200",
}

const ModalOverlay = ({ onClose }: { onClose: () => void }) => (
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
)

export default function SearchFeesPaymentPage() {
  const { symbol } = useCurrency()
  const { data: allPayments } = useApi<PaymentRecord>("/api/fees/fees-payment")
  const [searchId, setSearchId] = useState("")
  const [searched, setSearched] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewPayment, setViewPayment] = useState<PaymentRecord | null>(null)

  const results = useMemo(() => {
    if (!searched || !allPayments) return []
    return allPayments.filter((p) =>
      p.paymentId.toLowerCase().includes(searchId.toLowerCase())
    )
  }, [searchId, searched])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearched(true)
  }

  const openView = (payment: PaymentRecord) => {
    setViewPayment(payment)
    setShowViewModal(true)
  }

  const Modal = ({
    title, show, onClose, children, footer,
  }: {
    title: string; show: boolean; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode
  }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <ModalOverlay onClose={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto z-10">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5">{children}</div>
          {footer && (
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Search Fees Payment</h2>
          <p className="text-xs text-gray-500 mt-0.5">Fees Collection / Search Fees Payment</p>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-2.5 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-[var(--primary)]" />
            Select Criteria
          </h3>
        </div>
        <form onSubmit={handleSearch} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Payment ID <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Payment ID"
                required
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="h-9 px-4 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200">
                <Search className="h-3.5 w-3.5" />
                Search
              </button>
              <button type="button" onClick={() => { setSearchId(""); setSearched(false) }} className="h-9 px-3 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results Table */}
      {searched && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Search Results</h3>
            <span className="text-xs text-gray-400">{results.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Payment ID</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Admission No</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Student Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Class</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Payment Date</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Payment Mode</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Gateway</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-gray-300" />
                        <span className="text-sm">No payments found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  results.map((p, idx) => (
                    <tr key={p.paymentId} className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{p.paymentId}</td>
                      <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{p.admissionNo}</td>
                      <td className="px-4 py-2.5 text-gray-800">{p.studentName}</td>
                      <td className="px-4 py-2.5 text-gray-600">{p.className}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-800">${symbol}${p.amount.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{p.paymentDate}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">{p.paymentMode}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        {p.paymentMethod ? (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-indigo-50 text-indigo-700">{p.paymentMethod}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${statusColors[p.status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => openView(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
            <span>Showing {results.length} of {results.length} records</span>
            <span className="text-gray-300">Page 1 of 1</span>
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      <Modal
        title="Payment Detail"
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        footer={
          <button onClick={() => setShowViewModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Close</button>
        }
      >
        {viewPayment && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {[
              { label: "Payment ID", value: viewPayment.paymentId },
              { label: "Admission No", value: viewPayment.admissionNo },
              { label: "Student Name", value: viewPayment.studentName },
              { label: "Class", value: viewPayment.className },
              { label: "Amount", value: `${symbol}${viewPayment.amount.toLocaleString()}` },
              { label: "Payment Date", value: viewPayment.paymentDate },
              { label: "Payment Mode", value: viewPayment.paymentMode },
              { label: "Gateway", value: viewPayment.paymentMethod || "—" },
              { label: "Transaction ID", value: viewPayment.transactionId || "—" },
              { label: "Status", value: viewPayment.status },
            ].map((item) => (
              <div key={item.label} className="border-b border-gray-50 pb-2">
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{item.label}</span>
                <p className="text-sm text-gray-800 mt-0.5 font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
