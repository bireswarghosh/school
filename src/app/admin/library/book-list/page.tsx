"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Pencil, Trash2, X, BookOpen, RotateCcw } from "lucide-react"
import { useApi } from "@/lib/use-api"

type BookRecord = {
  id: number
  bookName: string
  bookNumber: string
  isbn: string
  author: string
  publisher: string
  subject: string
  rackNumber: string
  price: string
  qty: number
  postDate: string
  description: string
}

const defaultSubjects = ["Mathematics", "Science", "English", "Hindi", "Computer", "Social Studies"]

const initialForm = {
  bookName: "", bookNumber: "", isbn: "", author: "", publisher: "",
  subject: "", rackNumber: "", price: "", qty: 1, postDate: "", description: "",
}

export default function BookListPage() {
  const { data: books, add, update, remove } = useApi<BookRecord>("/api/library/book")

  const [filterTitle, setFilterTitle] = useState("")
  const [filterPublisher, setFilterPublisher] = useState("")
  const [filterAuthor, setFilterAuthor] = useState("")
  const [filterSubject, setFilterSubject] = useState("")
  const [filterRack, setFilterRack] = useState("")

  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [subjectMode, setSubjectMode] = useState<"select" | "input">("select")
  const [customSubject, setCustomSubject] = useState("")

  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<BookRecord | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [editSubjectMode, setEditSubjectMode] = useState<"select" | "input">("select")
  const [editCustomSubject, setEditCustomSubject] = useState("")

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const allSubjects = useMemo(() => {
    const set = new Set(defaultSubjects)
    books.forEach((b) => { if (b.subject) set.add(b.subject) })
    return Array.from(set).sort()
  }, [books])

  const filtered = useMemo(() => {
    return books.filter((b) => {
      if (filterTitle && !b.bookName.toLowerCase().includes(filterTitle.toLowerCase())) return false
      if (filterPublisher && !b.publisher?.toLowerCase().includes(filterPublisher.toLowerCase())) return false
      if (filterAuthor && !b.author.toLowerCase().includes(filterAuthor.toLowerCase())) return false
      if (filterSubject && b.subject !== filterSubject) return false
      if (filterRack && !b.rackNumber?.toLowerCase().includes(filterRack.toLowerCase())) return false
      return true
    })
  }, [books, filterTitle, filterPublisher, filterAuthor, filterSubject, filterRack])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault() }

  const clearFilters = () => {
    setFilterTitle(""); setFilterPublisher(""); setFilterAuthor("")
    setFilterSubject(""); setFilterRack("")
  }

  const handleField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!form.bookName.trim()) errs.bookName = "Required"
    if (!form.bookNumber.trim()) errs.bookNumber = "Required"
    if (!form.author.trim()) errs.author = "Required"
    if (!form.price.trim()) errs.price = "Required"
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return

    const subject = subjectMode === "input" ? customSubject.trim() : form.subject

    await add({
      bookName: form.bookName.trim(), bookNumber: form.bookNumber.trim(), isbn: form.isbn,
      author: form.author.trim(), publisher: form.publisher, subject,
      rackNumber: form.rackNumber, price: form.price, qty: form.qty,
      postDate: form.postDate, description: form.description,
    })
    setForm(initialForm)
    setCustomSubject("")
    setSubjectMode("select")
    setShowAddModal(false)
  }

  const openEdit = (book: BookRecord) => {
    setEditId(book.id)
    setEditForm({ ...book })
    setEditErrors({})
    setEditSubjectMode("select")
    setEditCustomSubject("")
    setShowEditModal(true)
  }

  const handleEditField = (field: string, value: string | number) => {
    if (!editForm) return
    setEditForm({ ...editForm, [field]: value })
    if (editErrors[field]) setEditErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const handleUpdate = async () => {
    if (!editForm || editId === null) return
    const errs: Record<string, string> = {}
    if (!editForm.bookName.trim()) errs.bookName = "Required"
    if (!editForm.bookNumber.trim()) errs.bookNumber = "Required"
    if (!editForm.author.trim()) errs.author = "Required"
    if (!editForm.price.trim()) errs.price = "Required"
    setEditErrors(errs)
    if (Object.keys(errs).length > 0) return

    const subject = editSubjectMode === "input" ? editCustomSubject.trim() : editForm.subject

    await update(editId, { ...editForm, subject })
    setShowEditModal(false)
    setEditId(null)
    setEditForm(null)
  }

  const handleDelete = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false); setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Book List</h2>
          <p className="text-sm text-white/80 mt-1">Library / Book List</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Select Criteria
          </h3>
        </div>
        <form onSubmit={handleSearch} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Book Title</label>
              <input type="text" value={filterTitle} onChange={(e) => setFilterTitle(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Search by title" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Publisher</label>
              <input type="text" value={filterPublisher} onChange={(e) => setFilterPublisher(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Search by publisher" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Author</label>
              <input type="text" value={filterAuthor} onChange={(e) => setFilterAuthor(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Search by author" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">All</option>
                {allSubjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rack Number</label>
              <input type="text" value={filterRack} onChange={(e) => setFilterRack(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Search by rack" />
            </div>
            <div className="flex items-end gap-2 lg:col-span-3">
              <button type="submit" className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </button>
              <button type="button" onClick={clearFilters} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Book List</h3>
          <button onClick={() => { setForm(initialForm); setFormErrors({}); setSubjectMode("select"); setCustomSubject(""); setShowAddModal(true) }} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Book
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Book Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Book No.</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">ISBN</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Publisher</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Author</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Subject</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Rack No.</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Qty</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Price</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Post Date</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-gray-400">No books found</td>
                </tr>
              ) : (
                filtered.map((b, idx) => (
                  <tr key={b.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{b.bookName}</td>
                    <td className="px-4 py-3 text-gray-600">{b.bookNumber}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{b.isbn || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{b.publisher || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{b.author}</td>
                    <td className="px-4 py-3 text-gray-600">{b.subject || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{b.rackNumber || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">{b.qty}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">&#8377;{b.price}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{b.postDate || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(b)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length} of {books.length} records</span>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[var(--primary)]" />
                Add Book
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
                  <input type="text" value={form.bookName} onChange={(e) => handleField("bookName", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter book title" />
                  {formErrors.bookName && <p className="text-red-500 text-xs mt-1">{formErrors.bookName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book Number</label>
                  <input type="text" value={form.bookNumber} onChange={(e) => handleField("bookNumber", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter book number" />
                  {formErrors.bookNumber && <p className="text-red-500 text-xs mt-1">{formErrors.bookNumber}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISBN Number</label>
                  <input type="text" value={form.isbn} onChange={(e) => handleField("isbn", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter ISBN number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                  <input type="text" value={form.publisher} onChange={(e) => handleField("publisher", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter publisher" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input type="text" value={form.author} onChange={(e) => handleField("author", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter author name" />
                  {formErrors.author && <p className="text-red-500 text-xs mt-1">{formErrors.author}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  {subjectMode === "select" ? (
                    <div className="flex gap-2">
                      <select value={form.subject} onChange={(e) => handleField("subject", e.target.value)} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                        <option value="">Select</option>
                        {allSubjects.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                        <option value="__add_new__">+ Add New Subject</option>
                      </select>
                    </div>
                  ) : (
                    <input type="text" value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter new subject" autoFocus />
                  )}
                  {subjectMode === "input" && (
                    <button type="button" onClick={() => { setSubjectMode("select"); setCustomSubject("") }} className="text-xs text-[var(--primary)] mt-1 hover:underline">Back to selection</button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rack Number</label>
                  <input type="text" value={form.rackNumber} onChange={(e) => handleField("rackNumber", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter rack number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min={1} value={form.qty} onChange={(e) => handleField("qty", parseInt(e.target.value) || 1)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book Price (&#8377;)</label>
                  <input type="text" value={form.price} onChange={(e) => handleField("price", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter price" />
                  {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Post Date</label>
                  <input type="date" value={form.postDate} onChange={(e) => handleField("postDate", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => handleField("description", e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter description" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowEditModal(false); setEditErrors({}) }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Edit Book</h3>
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
                  <input type="text" value={editForm.bookName} onChange={(e) => handleEditField("bookName", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {editErrors.bookName && <p className="text-red-500 text-xs mt-1">{editErrors.bookName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book Number</label>
                  <input type="text" value={editForm.bookNumber} onChange={(e) => handleEditField("bookNumber", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {editErrors.bookNumber && <p className="text-red-500 text-xs mt-1">{editErrors.bookNumber}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISBN Number</label>
                  <input type="text" value={editForm.isbn ?? ""} onChange={(e) => handleEditField("isbn", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                  <input type="text" value={editForm.publisher ?? ""} onChange={(e) => handleEditField("publisher", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input type="text" value={editForm.author} onChange={(e) => handleEditField("author", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {editErrors.author && <p className="text-red-500 text-xs mt-1">{editErrors.author}</p>}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    {editSubjectMode === "select" && (
                      <button type="button" onClick={() => setEditSubjectMode("input")} className="text-xs text-[var(--primary)] hover:underline font-medium">+ Add Subject</button>
                    )}
                  </div>
                  {editSubjectMode === "select" ? (
                    <select value={editForm.subject ?? ""} onChange={(e) => handleEditField("subject", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                      <option value="">Select</option>
                      {allSubjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={editCustomSubject} onChange={(e) => setEditCustomSubject(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter new subject" autoFocus />
                  )}
                  {editSubjectMode === "input" && (
                    <button type="button" onClick={() => { setEditSubjectMode("select"); setEditCustomSubject("") }} className="text-xs text-[var(--primary)] mt-1 hover:underline">Back to selection</button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rack Number</label>
                  <input type="text" value={editForm.rackNumber ?? ""} onChange={(e) => handleEditField("rackNumber", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min={1} value={editForm.qty} onChange={(e) => handleEditField("qty", parseInt(e.target.value) || 1)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book Price (&#8377;)</label>
                  <input type="text" value={editForm.price} onChange={(e) => handleEditField("price", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {editErrors.price && <p className="text-red-500 text-xs mt-1">{editErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Post Date</label>
                  <input type="date" value={editForm.postDate ?? ""} onChange={(e) => handleEditField("postDate", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editForm.description ?? ""} onChange={(e) => handleEditField("description", e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter description" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdate} className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">Are you sure you want to delete this book?</p>
              {deleteId && <p className="text-sm font-semibold text-gray-800 mt-1">{books.find((b) => b.id === deleteId)?.bookName}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
