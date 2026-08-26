"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save, Search } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"

type ExpenseHead = { id: number; name: string }

type ExpenseRecord = {
  id: number
  expenseHeadId: number
  expenseHead: string
  name: string
  invoiceNo: string
  date: string
  amount: number
  description: string
  paymentMode: string
  note: string
  document: string | null
}

const paymentModes = ["Cash", "Cheque", "Online", "DD", "Card"]

export default function AddExpensePage() {
  const { symbol } = useCurrency()
  const { data: expenses, add, update, remove } = useApi<ExpenseRecord>("/api/expenses")
  const { data: heads } = useApi<ExpenseHead>("/api/expenses/head")
  const [search, setSearch] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [form, setForm] = useState({ expenseHeadId: "", name: "", invoiceNo: "", date: "", amount: "", description: "", paymentMode: "Cash", note: "", document: "" })
  const [editForm, setEditForm] = useState({ id: 0, expenseHeadId: "", name: "", invoiceNo: "", date: "", amount: "", description: "", paymentMode: "Cash", note: "", document: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filtered = (expenses || []).filter((exp) =>
    exp.name.toLowerCase().includes(search.toLowerCase()) ||
    exp.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
    exp.expenseHead.toLowerCase().includes(search.toLowerCase())
  )

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const validateForm = (data: typeof form) => {
    const errs: Record<string, string> = {}
    if (!data.expenseHeadId) errs.expenseHeadId = "Expense head is required"
    if (!data.name.trim()) errs.name = "Name is required"
    if (!data.date) errs.date = "Date is required"
    if (!data.amount || parseFloat(data.amount) <= 0) errs.amount = "Valid amount is required"
    return errs
  }

  const handleAdd = async () => {
    const errs = validateForm(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    await add({
      expenseHeadId: parseInt(form.expenseHeadId), name: form.name.trim(), invoiceNo: form.invoiceNo,
      date: form.date, amount: parseFloat(form.amount), description: form.description.trim(),
      paymentMode: form.paymentMode, note: form.note.trim(), document: form.document,
    })
    setForm({ expenseHeadId: "", name: "", invoiceNo: "", date: "", amount: "", description: "", paymentMode: "Cash", note: "", document: "" })
    setShowAddModal(false)
  }

  const handleEditOpen = (exp: ExpenseRecord) => {
    setEditForm({ id: exp.id, expenseHeadId: exp.expenseHeadId.toString(), name: exp.name, invoiceNo: exp.invoiceNo, date: exp.date, amount: exp.amount.toString(), description: exp.description, paymentMode: exp.paymentMode || "Cash", note: exp.note || "", document: exp.document || "" })
    setErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs = validateForm(editForm)
    setErrors(errs)
    if (Object.keys(errs).length) return
    await update(editForm.id, {
      expenseHeadId: parseInt(editForm.expenseHeadId), name: editForm.name.trim(), invoiceNo: editForm.invoiceNo,
      date: editForm.date, amount: parseFloat(editForm.amount), description: editForm.description.trim(),
      paymentMode: editForm.paymentMode, note: editForm.note.trim(), document: editForm.document,
    })
    setShowEditModal(false)
  }

  const handleDeleteOpen = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  const Modal = ({ title, show, onClose, children, wide }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative bg-white rounded-xl shadow-2xl z-10 w-full mx-4 ${wide ? "max-w-3xl" : "max-w-lg"}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
          </div>
          {children}
        </div>
      </div>
    )
  }

  const handleDocChange = (file: File | undefined, isEdit: boolean | undefined) => {
    const setter = isEdit ? setEditForm : setForm
    setter((prev: any) => ({ ...prev, document: file ? file.name : "" }))
  }

  const FormFields = ({ data, onChange, isEdit }: { data: typeof form; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; isEdit?: boolean }) => (
    <div className="px-6 py-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Expense Head <span className="text-red-500">*</span></label>
          <select name="expenseHeadId" value={data.expenseHeadId} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
            <option value="">Select</option>
            {(heads || []).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          {errors.expenseHeadId && <p className="text-red-500 text-xs mt-1">{errors.expenseHeadId}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Name <span className="text-red-500">*</span></label>
          <input type="text" name="name" value={data.name} onChange={onChange} placeholder="Enter expense name"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Invoice Number</label>
          <input type="text" name="invoiceNo" value={data.invoiceNo} onChange={onChange} placeholder="Auto-generated"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Date <span className="text-red-500">*</span></label>
          <input type="date" name="date" value={data.date} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Amount ({symbol}) <span className="text-red-500">*</span></label>
          <input type="number" name="amount" value={data.amount} onChange={onChange} placeholder="0.00" min="0" step="0.01"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Payment Mode</label>
          <select name="paymentMode" value={data.paymentMode} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
            {paymentModes.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Description</label>
          <textarea name="description" value={data.description} onChange={onChange} placeholder="Enter description" rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Note</label>
          <textarea name="note" value={data.note} onChange={onChange} placeholder="Enter note" rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">Attach Document</label>
        <input type="file" onChange={(e) => handleDocChange(e.target.files?.[0], isEdit)}
          className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--primary)]/10 file:text-[var(--primary)] hover:file:bg-[var(--primary)]/20" />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Add Expense</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">Expenses / Add Expense</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-700">Expense List</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, invoice, head..."
                className="w-64 pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <button onClick={() => { setForm({ expenseHeadId: "", name: "", invoiceNo: "", date: "", amount: "", description: "", paymentMode: "Cash", note: "", document: "" }); setErrors({}); setShowAddModal(true) }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
              <Plus className="h-4 w-4" /> Add Expense
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Name", "Expense Head", "Invoice No", "Date", `Amount (${symbol})`, "Payment Mode", "Description", "Document", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-400">No expense records found</td></tr>
              ) : (
                filtered.map((exp, idx) => (
                  <tr key={exp.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{exp.name}</td>
                    <td className="px-4 py-3 text-gray-600">{exp.expenseHead}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{exp.invoiceNo}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{exp.date}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{exp.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{exp.paymentMode || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{exp.description || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{exp.document || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditOpen(exp)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteOpen(exp.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          <span>Showing {filtered.length} of {expenses?.length || 0} records</span>
        </div>
      </div>

      <Modal title="Add Expense" show={showAddModal} onClose={() => setShowAddModal(false)} wide>
        {FormFields({ data: form, onChange: handleFormChange, isEdit: false })}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <Modal title="Edit Expense" show={showEditModal} onClose={() => setShowEditModal(false)} wide>
        {FormFields({ data: editForm, onChange: (e) => { const { name, value } = e.target; setEditForm((prev) => ({ ...prev, [name]: value })); if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n }) }, isEdit: true })}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleEditSave} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">Are you sure you want to delete this expense record?
                {deleteId && <strong className="block mt-1 text-gray-800">{(expenses || []).find((i) => i.id === deleteId)?.name}</strong>}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"><X className="h-4 w-4" /> Cancel</button>
              <button onClick={confirmDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
