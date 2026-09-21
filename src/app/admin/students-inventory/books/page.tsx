"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, X, BookOpen, ClipboardPaste, Upload, ChevronDown, ShoppingCart } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Class = { id?: number; name: string }

type Book = {
  id?: number
  title: string
  publisher?: string
  classId?: number | null
  sellingPrice?: number | string
  isRequired?: string
  sortOrder?: number
}

type Row = {
  id: number | null
  bookName: string
  publisher: string
  price: string
}

const emptyRow = (): Row => ({ id: null, bookName: "", publisher: "", price: "" })

const inr = (n: string | number | null | undefined) => "&#8377;" + Number(n || 0).toLocaleString("en-IN")

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"

type ParsedBook = { bookName: string; publisher: string; price: string }

function parseBooksFromText(text: string): { rows: ParsedBook[]; errors: number } {
  const rows: ParsedBook[] = []
  let errors = 0
  const lines = text.split("\n")
  for (const raw of lines) {
    let line = raw.trim()
    if (!line) continue
    line = line.replace(/^\d+[.\-\)]?\s*/, "")
    if (/^(book\s*name|name|sr\s*no)/i.test(line)) continue
    const delim = line.includes("\t") ? "\t" : line.includes(",") ? "," : null
    let parsed: ParsedBook | null = null
    if (delim) {
      const parts = line.split(delim).map((p) => p.trim())
      const price = parseFloat(parts[parts.length - 1])
      if (parts.length >= 2 && !isNaN(price)) {
        parsed = {
          bookName: parts[0],
          publisher: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
          price: String(price),
        }
      }
    }
    if (!parsed) {
      const match = line.match(/^(.+?)\s+((?:[^\s]+\s+){0,2}[^\s]+)\s+(\d+(?:\.\d+)?)\s*$/)
      if (match) {
        parsed = { bookName: match[1].trim(), publisher: match[2].trim(), price: match[3] }
      }
    }
    if (parsed) rows.push(parsed)
    else errors++
  }
  return { rows, errors }
}

export default function BooklistPage() {
  const router = useRouter()
  const { data: books, add, update, remove, refetch } = useApi<Book>("/api/students-inventory/book")
  const { data: classes } = useApi<Class>("/api/classes")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedClass, setSelectedClass] = useState("")
  const [rows, setRows] = useState<Row[]>([])
  const [modalTitle, setModalTitle] = useState("Add Books to Booklist")
  const [showModal, setShowModal] = useState(false)
  const [showPaste, setShowPaste] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [parseMsg, setParseMsg] = useState("")
  const [saveError, setSaveError] = useState("")
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([])

  useEffect(() => {
    setSelectedIds([])
  }, [selectedClass])

  const classBooks = useMemo(() => {
    return selectedClass
      ? books
          .filter((b) => String(b.classId ?? "") === String(selectedClass))
          .sort((a, b) => (a.sortOrder ?? 0) - (a.id ?? 0))
      : []
  }, [books, selectedClass])

  const allSelected = classBooks.length > 0 && selectedIds.length === classBooks.length
  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? [] : classBooks.map((b) => b.id ?? 0).filter((id) => id > 0))
  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))

  const bookCount = (id?: number) => books.filter((b) => b.classId === id).length

  const classStats = useMemo(() => {
    return classes
      .map((c) => {
        const clsBooks = books.filter((b) => String(b.classId ?? "") === String(c.id))
        return {
          id: c.id,
          name: c.name,
          count: clsBooks.length,
          total: clsBooks.reduce((sum, b) => sum + (Number(b.sellingPrice) || 0), 0),
        }
      })
      .filter((c) => c.count > 0)
      .sort((a, b) => a.count - b.count)
  }, [books, classes])

  const selectedClassName = classes.find((c) => String(c.id) === selectedClass)?.name || ""

  const openAddModal = () => {
    if (!selectedClass) return
    setRows([emptyRow()])
    setModalTitle("Add Books to Booklist")
    setPasteText("")
    setParseMsg("")
    setSaveError("")
    setShowPaste(false)
    setShowModal(true)
  }

  const openEditModal = (cid?: string) => {
    const clsId = cid ?? selectedClass
    if (!clsId) return
    const clsName = classes.find((c) => String(c.id) === String(clsId))?.name || ""
    const clsBooksList = books
      .filter((b) => String(b.classId ?? "") === String(clsId))
      .sort((a, b) => (a.sortOrder ?? 0) - (a.id ?? 0))
    setSelectedClass(String(clsId))
    setRows(
      clsBooksList.length
        ? clsBooksList.map((b) => ({
            id: b.id ?? null,
            bookName: b.title || "",
            publisher: b.publisher || "",
            price: b.sellingPrice !== undefined && b.sellingPrice !== null ? String(b.sellingPrice) : "",
          }))
        : [emptyRow()]
    )
    setModalTitle(`Edit Booklist - ${clsName}`)
    setPasteText("")
    setParseMsg("")
    setSaveError("")
    setShowPaste(false)
    setShowModal(true)
  }

  const updateRow = (idx: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const addRow = () => setRows((prev) => [...prev, emptyRow()])

  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx))

  const fillRows = (list: ParsedBook[]) => {
    if (list.length === 0) return
    setRows((prev) => [...prev, ...list.map((p) => ({ id: null, ...p }))])
    setParseMsg(`${list.length} book(s) parsed. Clear all rows to start fresh.`)
  }

  const handleParse = () => {
    if (!pasteText.trim()) return
    const { rows: parsed, errors } = parseBooksFromText(pasteText)
    fillRows(parsed)
    if (errors > 0) setParseMsg(`${parsed.length} book(s) parsed. ${errors} line(s) could not be parsed.`)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const { rows: parsed, errors } = parseBooksFromText(String(reader.result || ""))
      fillRows(parsed)
      if (errors > 0) setParseMsg(`${parsed.length} book(s) imported. ${errors} line(s) could not be parsed.`)
      else setParseMsg(`${parsed.length} book(s) imported from ${file.name}.`)
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const clearRows = () => {
    setRows([emptyRow()])
    setPasteText("")
    setParseMsg("")
  }

  const handleSave = async () => {
    const valid = rows.filter((r) => r.bookName.trim())
    if (valid.length === 0) {
      setSaveError("Please enter at least one book name.")
      return
    }
    setSaving(true)
    setSaveError("")
    try {
      let idx = 0
      for (const r of valid) {
        const payload = {
          title: r.bookName.trim(),
          publisher: r.publisher.trim() || undefined,
          sellingPrice: r.price !== "" ? Number(r.price) : undefined,
          classId: Number(selectedClass),
          sortOrder: idx,
        }
        if (r.id) await update(r.id, payload)
        else await add(payload)
        idx++
      }
      setShowModal(false)
      setRows([])
      refetch()
    } catch (err: any) {
      setSaveError(err.message || "Failed to save booklist")
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (pendingDeleteIds.length === 0) return
    for (const id of pendingDeleteIds) await remove(id)
    setShowDeleteModal(false)
    setPendingDeleteIds([])
    setSelectedIds((prev) => prev.filter((i) => !pendingDeleteIds.includes(i)))
    refetch()
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Class-wise Booklist</h2>
          <p className="text-sm text-white/80 mt-1">Students Inventory / Booklist</p>
        </div>
      </div>

      {classStats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {classStats.map((c, ci) => {
            const accents = [
              { bg: "from-[var(--primary)] to-orange-400", soft: "bg-orange-50 text-orange-600 border-orange-100", bar: "bg-[var(--primary)]" },
              { bg: "from-indigo-500 to-violet-400", soft: "bg-indigo-50 text-indigo-600 border-indigo-100", bar: "bg-indigo-500" },
              { bg: "from-emerald-500 to-teal-400", soft: "bg-emerald-50 text-emerald-600 border-emerald-100", bar: "bg-emerald-500" },
              { bg: "from-sky-500 to-cyan-400", soft: "bg-sky-50 text-sky-600 border-sky-100", bar: "bg-sky-500" },
              { bg: "from-rose-500 to-pink-400", soft: "bg-rose-50 text-rose-600 border-rose-100", bar: "bg-rose-500" },
            ]
            const a = accents[ci % accents.length]
            return (
              <div
                key={c.id}
                onClick={() => openEditModal(String(c.id))}
                className="group cursor-pointer rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:border-[var(--primary)]/40 transition-all duration-200"
              >
                <div className={`h-1.5 ${a.bar}`} />
                <div className="p-4">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${a.soft} border mb-3 group-hover:scale-[1.03] transition-transform`}>
                    <BookOpen className="h-3 w-3" />
                    Class {c.name}
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-3xl font-extrabold text-gray-900 leading-none">{c.count}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{c.count === 1 ? "book" : "books"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Total Cost</p>
                      <p className="text-base font-bold text-gray-800 leading-none" dangerouslySetInnerHTML={{ __html: inr(c.total) }} />
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] font-semibold text-[var(--primary)]/0 group-hover:text-[var(--primary)] uppercase tracking-wider transition-colors flex items-center gap-1">
                    <Pencil className="h-2.5 w-2.5" /> Click to edit booklist
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap items-end justify-between gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Class <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] min-w-64"
            >
              <option value="">-- Select Class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({bookCount(c.id)} books)</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={() => { setPendingDeleteIds(selectedIds); setShowDeleteModal(true) }}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedIds.length})
              </button>
            )}
            <button
              onClick={openAddModal}
              disabled={!selectedClass}
              className={`px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${selectedClass ? "hover:bg-emerald-700" : "opacity-50 cursor-not-allowed"}`}
              title={selectedClass ? "Add books to selected class" : "Select a class first"}
            >
              <Plus className="h-4 w-4" />
              Add Books
            </button>
            <button
              onClick={() => openEditModal()}
              disabled={!selectedClass}
              className={`px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${selectedClass ? "hover:bg-amber-600" : "opacity-50 cursor-not-allowed"}`}
              title={selectedClass ? "Edit booklist for selected class" : "Select a class first"}
            >
              <Pencil className="h-4 w-4" />
              Edit Booklist
            </button>
            <button
              onClick={() => router.push(`/admin/students-inventory/books/sell?class=${selectedClass}`)}
              disabled={!selectedClass}
              className={`px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${selectedClass ? "hover:bg-[var(--secondary)]" : "opacity-50 cursor-not-allowed"}`}
              title={selectedClass ? "Sell books from the selected class booklist" : "Select a class first"}
            >
              <ShoppingCart className="h-4 w-4" />
              Sell Books
            </button>
          </div>
        </div>
        {!selectedClass && (
          <div className="px-5 py-2 border-b border-amber-200 bg-amber-50 text-xs font-medium text-amber-700">
            Select a class to view, add or edit its booklist.
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="accent-[var(--primary)]"
                  />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Sr. No.</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Name of the Book</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Publisher</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Price</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {classBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    {selectedClass ? "No books assigned to this class yet." : "Select a class to view its booklist."}
                  </td>
                </tr>
              ) : (
                classBooks.map((b, idx) => (
                  <tr key={b.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={b.id != null && b.id > 0 && selectedIds.includes(b.id)}
                        onChange={() => b.id != null && b.id > 0 && toggleSelect(b.id)}
                        className="accent-[var(--primary)]"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{b.title}</td>
                    <td className="px-4 py-3 text-gray-600">{b.publisher || "-"}</td>
                    <td className="px-4 py-3 text-gray-600" dangerouslySetInnerHTML={{ __html: inr(b.sellingPrice) }} />
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setPendingDeleteIds([b.id ?? 0]); setShowDeleteModal(true) }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from booklist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {classBooks.length} books for {selectedClassName || "selected class"}</span>
          {selectedClass && (
            <button onClick={() => openEditModal()} className="text-[var(--primary)] font-medium hover:underline flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Add / Edit books
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[var(--primary)]" />
                {modalTitle}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500">Class: <span className="font-semibold text-gray-700">{selectedClassName}</span></p>

              <div className="rounded-lg border border-gray-200">
                <button
                  onClick={() => setShowPaste((p) => !p)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2">
                    <ClipboardPaste className="h-4 w-4 text-[var(--primary)]" /> Paste from Text / Import
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showPaste ? "rotate-180" : ""}`} />
                </button>
                {showPaste && (
                  <div className="px-4 pb-4 space-y-2">
                    <textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      rows={4}
                      className={inputCls}
                      placeholder={"Paste book list here (one per line).\nFormat: <Sr.No> Book Name Publisher Price\nTip: you can also paste CSV/TSV (Book Name,Publisher,Price)"}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleParse}
                        className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"
                      >
                        Parse &amp; Fill
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                      >
                        <Upload className="h-3.5 w-3.5" /> Import CSV/TXT
                      </button>
                      <input ref={fileInputRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFile} />
                      <button onClick={clearRows} className="px-3 py-1.5 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors">
                        Clear all rows
                      </button>
                      {parseMsg && <span className="text-xs text-emerald-600 font-medium">{parseMsg}</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase w-12">Sr.</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase">Name of the Book <span className="text-red-500">*</span></th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase">Publisher</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase w-32">Price</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600 text-xs uppercase w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-6 text-gray-400">No rows. Add a row or import a book list.</td></tr>
                    ) : (
                      rows.map((r, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={r.bookName}
                              onChange={(e) => updateRow(idx, { bookName: e.target.value })}
                              className={inputCls}
                              placeholder="Enter book name"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={r.publisher}
                              onChange={(e) => updateRow(idx, { publisher: e.target.value })}
                              className={inputCls}
                              placeholder="Publisher"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={r.price}
                              onChange={(e) => updateRow(idx, { price: e.target.value })}
                              className={inputCls}
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => removeRow(idx)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove row"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <button onClick={addRow} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>

              {saveError && <p className="text-red-500 text-xs font-medium">{saveError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg transition-colors ${saving ? "opacity-60 cursor-not-allowed" : "hover:bg-[var(--secondary)]"}`}
              >
                {saving ? "Saving..." : "Save Booklist"}
              </button>
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
              <p className="text-sm text-gray-600">
                Are you sure you want to remove {pendingDeleteIds.length > 1 ? `these ${pendingDeleteIds.length} books` : "this book"} from the class booklist?
              </p>
              {pendingDeleteIds.length > 0 && (
                <p className="text-sm font-semibold text-gray-800 mt-3 space-y-1 max-h-40 overflow-y-auto">
                  {pendingDeleteIds.map((id) => (
                    <span key={id} className="block">• {classBooks.find((b) => b.id === id)?.title}</span>
                  ))}
                </p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">
                Delete {pendingDeleteIds.length > 1 ? `(${pendingDeleteIds.length})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
