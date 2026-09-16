"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, X, Save, Search, Wallet, Calendar, Tag, Receipt, CreditCard, FileText, TrendingUp, DollarSign, Filter, AlertTriangle } from "lucide-react"
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
  const [filterHead, setFilterHead] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [form, setForm] = useState({ expenseHeadId: "", name: "", invoiceNo: "", date: new Date().toISOString().split("T")[0], amount: "", description: "", paymentMode: "Cash", note: "", document: "" })
  const [editForm, setEditForm] = useState({ id: 0, expenseHeadId: "", name: "", invoiceNo: "", date: "", amount: "", description: "", paymentMode: "Cash", note: "", document: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    let arr = expenses || []
    const q = search.trim().toLowerCase()
    if (q) arr = arr.filter((exp) => [exp.name, exp.invoiceNo, exp.expenseHead, exp.description, exp.paymentMode].join(" ").toLowerCase().includes(q))
    if (filterHead) arr = arr.filter((exp) => exp.expenseHead === filterHead)
    return arr
  }, [expenses, search, filterHead])

  const stats = useMemo(() => {
    const total = (expenses || []).length
    const totalAmt = (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0)
    const thisMonth = (expenses || []).filter((e) => e.date && new Date(e.date).getMonth() === new Date().getMonth() && new Date(e.date).getFullYear() === new Date().getFullYear()).length
    const avg = total ? Math.round(totalAmt / total) : 0
    return { total, totalAmt, thisMonth, avg }
  }, [expenses])

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
    setSaving(true)
    try {
      await add({
        expenseHeadId: parseInt(form.expenseHeadId), name: form.name.trim(), invoiceNo: form.invoiceNo.trim(),
        date: form.date, amount: parseFloat(form.amount), description: form.description.trim(),
        paymentMode: form.paymentMode, note: form.note.trim(), document: form.document,
      })
      setForm({ expenseHeadId: "", name: "", invoiceNo: "", date: new Date().toISOString().split("T")[0], amount: "", description: "", paymentMode: "Cash", note: "", document: "" })
      setShowAddModal(false)
    } finally { setSaving(false) }
  }

  const handleEditOpen = (exp: ExpenseRecord) => {
    setEditForm({ id: exp.id, expenseHeadId: exp.expenseHeadId.toString(), name: exp.name, invoiceNo: exp.invoiceNo, date: exp.date?.slice(0, 10) || "", amount: exp.amount.toString(), description: exp.description || "", paymentMode: exp.paymentMode || "Cash", note: exp.note || "", document: exp.document || "" })
    setErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs = validateForm(editForm as any)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      await update(editForm.id, {
        expenseHeadId: parseInt(editForm.expenseHeadId), name: editForm.name.trim(), invoiceNo: editForm.invoiceNo.trim(),
        date: editForm.date, amount: parseFloat(editForm.amount), description: editForm.description.trim(),
        paymentMode: editForm.paymentMode, note: editForm.note.trim(), document: editForm.document,
      })
      setShowEditModal(false)
    } finally { setSaving(false) }
  }

  const handleDeleteOpen = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  const handleDocChange = (file: File | undefined, isEdit?: boolean) => {
    const setter = isEdit ? setEditForm : setForm
    setter((prev: any) => ({ ...prev, document: file ? file.name : "" }))
  }

  const paymentBadge = (m: string) => {
    if (m === "Cash") return "bg-emerald-50 text-emerald-700 border-emerald-200"
    if (m === "Cheque") return "bg-amber-50 text-amber-700 border-amber-200"
    if (m === "Online") return "bg-blue-50 text-blue-700 border-blue-200"
    if (m === "Card") return "bg-purple-50 text-purple-700 border-purple-200"
    return "bg-slate-50 text-slate-700 border-slate-200"
  }

  const Modal = ({ title, show, onClose, children }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-6 overflow-y-auto">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full mx-4 max-w-3xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2"><Receipt className="h-4 w-4 text-emerald-600" />{title}</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-white rounded-xl"><X className="h-5 w-5 text-gray-500" /></button>
          </div>
          {children}
        </div>
      </div>
    )
  }

  const FormFields = ({ data, onChange, isEdit }: { data: typeof form; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; isEdit?: boolean }) => (
    <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-600">Expense Head <span className="text-red-500">*</span></label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select name="expenseHeadId" value={data.expenseHeadId} onChange={onChange}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm">
              <option value="">Select head</option>
              {(heads || []).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          {errors.expenseHeadId && <p className="text-red-500 text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errors.expenseHeadId}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-600">Name <span className="text-red-500">*</span></label>
          <input type="text" name="name" value={data.name} onChange={onChange} placeholder="e.g. Lab Chemicals"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm" />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-600">Invoice Number</label>
          <input type="text" name="invoiceNo" value={data.invoiceNo} onChange={onChange} placeholder="INV-001"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm" />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-600">Date <span className="text-red-500">*</span></label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="date" name="date" value={data.date} onChange={onChange}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm" />
          </div>
          {errors.date && <p className="text-red-500 text-xs">{errors.date}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-600">Amount ({symbol}) <span className="text-red-500">*</span></label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="number" name="amount" value={data.amount} onChange={onChange} placeholder="0.00" min="0" step="0.01"
              className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm" />
          </div>
          {errors.amount && <p className="text-red-500 text-xs">{errors.amount}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-600">Payment Mode</label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select name="paymentMode" value={data.paymentMode} onChange={onChange}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm">
              {paymentModes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-600">Description</label>
          <textarea name="description" value={data.description} onChange={onChange} placeholder="What was this expense for?" rows={3}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 resize-none bg-white shadow-sm" />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-600">Note</label>
          <textarea name="note" value={data.note} onChange={onChange} placeholder="Internal note..." rows={3}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 resize-none bg-white shadow-sm" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-bold text-gray-600">Attach Document</label>
        <input type="file" onChange={(e) => handleDocChange(e.target.files?.[0], isEdit)}
          className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-gray-200 rounded-xl px-3 py-2 bg-white" />
        {data.document && <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1"><FileText className="h-3 w-3" />{data.document}</p>}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="absolute left-1/3 top-1/2 -translate-y-1/2 opacity-10 hidden lg:block"><Wallet className="h-28 w-28 text-white" /></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Receipt className="h-4 w-4 text-white" /></span>
              Add Expense
            </h2>
            <p className="text-sm text-white/80 mt-1">Expenses / Record and track every spend • {stats.total} records</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/90 text-xs bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20">
            <DollarSign className="h-3.5 w-3.5" /> {symbol}{stats.totalAmt.toLocaleString()} total
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-emerald-600"><Wallet className="h-4 w-4" /></span><TrendingUp className="h-4 w-4 text-emerald-500" /></div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{symbol}{stats.totalAmt.toLocaleString()}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-emerald-600/70">Total Amount</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-blue-600"><Receipt className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-blue-500" /></div>
          <p className="text-2xl font-black text-blue-700 mt-2">{stats.total}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-blue-600/70">Records</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-amber-600"><Calendar className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-amber-500" /></div>
          <p className="text-2xl font-black text-amber-700 mt-2">{stats.thisMonth}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-amber-600/70">This Month</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-violet-600"><DollarSign className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-violet-500" /></div>
          <p className="text-2xl font-black text-violet-700 mt-2">{symbol}{stats.avg.toLocaleString()}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-violet-600/70">Avg Expense</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Receipt className="h-4 w-4 text-emerald-600" /> Expense List</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, invoice, head..."
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-full bg-white focus:ring-2 focus:ring-emerald-200 w-56" />
            </div>
            <select value={filterHead} onChange={(e) => setFilterHead(e.target.value)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-full bg-white">
              <option value="">All Heads</option>
              {(heads || []).map((h) => <option key={h.id} value={h.name}>{h.name}</option>)}
            </select>
            <button onClick={() => { setForm({ expenseHeadId: "", name: "", invoiceNo: "", date: new Date().toISOString().split("T")[0], amount: "", description: "", paymentMode: "Cash", note: "", document: "" }); setErrors({}); setShowAddModal(true) }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-full shadow hover:opacity-95">
              <Plus className="h-3.5 w-3.5" /> Add Expense
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["#", "Name", "Head", "Invoice", "Date", `Amount (${symbol})`, "Mode", "Description", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border"><Receipt className="h-5 w-5 text-gray-400" /></div>
                  <p className="text-sm text-gray-500 mt-2">No expense records found</p>
                  <p className="text-xs text-gray-400">Add your first expense to see it here</p>
                </td></tr>
              ) : (
                filtered.map((exp, idx) => (
                  <tr key={exp.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">{exp.name}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold"><Tag className="h-3 w-3" />{exp.expenseHead}</span></td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{exp.invoiceNo || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap flex items-center gap-1"><Calendar className="h-3 w-3 text-gray-400" />{exp.date ? new Date(exp.date).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">{symbol}{Number(exp.amount).toLocaleString()}</span></td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${paymentBadge(exp.paymentMode)}`}>{exp.paymentMode || "—"}</span></td>
                    <td className="px-4 py-3 max-w-[160px] truncate text-xs text-gray-600">{exp.description || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditOpen(exp)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-xl border border-transparent hover:border-amber-100"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteOpen(exp.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30 text-xs text-gray-500 flex items-center justify-between">
          <span>Showing {filtered.length} of {expenses?.length || 0} records • Total {symbol}{filtered.reduce((s, e) => s + Number(e.amount || 0), 0).toLocaleString()}</span>
          <span className="hidden sm:inline">Tip: filter by head to group expenses</span>
        </div>
      </div>

      <Modal title="Add Expense" show={showAddModal} onClose={() => setShowAddModal(false)}>
        {FormFields({ data: form, onChange: handleFormChange, isEdit: false })}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50/50">
          <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm border border-gray-200 bg-white rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={handleAdd} disabled={saving} className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50">{saving ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Save className="h-4 w-4" />} Save Expense</button>
        </div>
      </Modal>

      <Modal title="Edit Expense" show={showEditModal} onClose={() => setShowEditModal(false)}>
        {FormFields({ data: editForm, onChange: (e) => { const { name, value } = e.target; setEditForm((prev) => ({ ...prev, [name]: value })); if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n }) }, isEdit: true })}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50/50">
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-gray-200 bg-white rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={handleEditSave} disabled={saving} className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50"><Save className="h-4 w-4" /> Update</button>
        </div>
      </Modal>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b bg-red-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white"><Trash2 className="h-4 w-4" /></span>
              <div><h3 className="text-base font-bold text-gray-800">Confirm Delete</h3><p className="text-xs text-gray-500">This cannot be undone</p></div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">Delete <strong className="text-gray-800">{(expenses || []).find((i) => i.id === deleteId)?.name}</strong> ?</p>
            </div>
            <div className="px-5 py-4 border-t bg-gray-50/50 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm border border-gray-200 bg-white rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 shadow-md">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
