"use client"

import { useState } from "react"
import { Search, Eye, X } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"

type PaymentStatus = "Pending" | "Approved" | "Rejected"

type PaymentRecord = {
  id?: number
  requestId: string
  admissionNo: string
  name: string
  className: string
  paymentDate: string
  submitDate: string
  amount: number
  status: PaymentStatus
  paymentId: string
  bank: string
  transactionId: string
  referenceNo: string
  notes: string
}

const statusColors: Record<PaymentStatus, string> = {
  Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Approved: "bg-green-50 text-green-700 border-green-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
}

const ModalOverlay = ({ onClose }: { onClose: () => void }) => (
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
)

export default function OfflineBankPaymentsPage() {
  const { symbol } = useCurrency()
  const { data: payments } = useApi<PaymentRecord>("/api/fees/fees-payment")
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewId, setViewId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<PaymentStatus>("Pending")

  const selected = viewId ? (payments || []).find((p) => p.requestId === viewId) : null

  const openView = (id: string) => {
    setViewId(id)
    const rec = (payments || []).find((p) => p.requestId === id)
    if (rec) setEditStatus(rec.status)
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
          <h2 className="text-xl font-bold text-gray-900">Offline Bank Payments</h2>
          <p className="text-xs text-gray-500 mt-0.5">Fees Collection / Offline Bank Payments</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Offline Bank Payments</h3>
          <span className="text-xs text-gray-400">{(payments || []).length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Request ID</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Admission No</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Class</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Payment Date</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Submit Date</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Amount</th>
                <th className="text-center px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Payment ID</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {(payments || []).length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-gray-300" />
                      <span className="text-sm">No payments found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                (payments || []).map((p, idx) => (
                  <tr key={p.requestId} className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{p.requestId}</td>
                    <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{p.admissionNo}</td>
                    <td className="px-4 py-2.5 text-gray-800">{p.name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{p.className}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{p.paymentDate}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{p.submitDate}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-800">${symbol}${p.amount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${statusColors[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{p.paymentId || <span className="text-gray-300">-</span>}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => openView(p.requestId)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
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
          <span>Showing {(payments || []).length} of {(payments || []).length} records</span>
          <span className="text-gray-300">Page 1 of 1</span>
        </div>
      </div>

      {/* Payment Detail Modal */}
      <Modal
        title="Payment Detail"
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        footer={
          <>
            <button onClick={() => setShowViewModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Close</button>
            <button onClick={() => setShowViewModal(false)} className="px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">Save</button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: "Request ID", value: selected.requestId },
                { label: "Admission No", value: selected.admissionNo },
                { label: "Student Name", value: selected.name },
                { label: "Class", value: selected.className },
                { label: "Payment Date", value: selected.paymentDate },
                { label: "Submit Date", value: selected.submitDate },
                { label: "Amount", value: `${symbol}${selected.amount.toLocaleString()}` },
                { label: "Bank", value: selected.bank },
                { label: "Transaction ID", value: selected.transactionId },
                { label: "Reference No", value: selected.referenceNo },
              ].map((item) => (
                <div key={item.label} className="border-b border-gray-50 pb-2">
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{item.label}</span>
                  <p className="text-sm text-gray-800 mt-0.5 font-medium">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1 block">Status</span>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as PaymentStatus)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Notes</span>
              <p className="text-sm text-gray-800 mt-1 bg-gray-50 rounded-lg p-3">{selected.notes}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
