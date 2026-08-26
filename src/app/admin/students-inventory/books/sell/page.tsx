"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ShoppingCart, UserCheck, Plus, Minus, Trash2 } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"
import { toast as notify } from "@/lib/toast"

type Class = { id?: number; name: string }
type Book = { id?: number; title: string; publisher?: string; sellingPrice?: number | string; classId?: number | null }
type Selected = { bookId: number; name: string; price: number; qty: number }
type Student = { id: number; admissionNo?: string; name: string; className?: string; sectionName?: string }

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"

export default function Page() {
  return (
    <Suspense>
      <SellBooksPage />
    </Suspense>
  )
}

function SellBooksPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { symbol } = useCurrency()
  const { data: classes } = useApi<Class>("/api/classes")
  const { data: books } = useApi<Book>("/api/students-inventory/book")

  const [selectedClass, setSelectedClass] = useState("")
  const [selected, setSelected] = useState<Record<number, Selected>>({})
  const [admissionNo, setAdmissionNo] = useState("")
  const [student, setStudent] = useState<Student | null>(null)
  const [findState, setFindState] = useState<"idle" | "loading" | "found" | "notfound">("idle")
  const [sending, setSending] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const c = searchParams.get("class")
    if (c) setSelectedClass(c)
  }, [searchParams])

  const classBooks = useMemo(
    () =>
      selectedClass
        ? books
            .filter((b) => String(b.classId ?? "") === String(selectedClass))
            .sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
        : [],
    [books, selectedClass]
  )

  const selectedClassName = classes.find((c) => String(c.id) === String(selectedClass))?.name || ""

  const selectedList = useMemo(() => Object.values(selected), [selected])
  const selectedCount = selectedList.reduce((s, i) => s + i.qty, 0)
  const selectedSubtotal = selectedList.reduce((s, i) => s + round2(i.price * i.qty), 0)

  const toggleBook = (book: Book) => {
    const id = book.id
    if (!id) return
    setSelected((prev) => {
      const next = { ...prev }
      if (next[id]) {
        delete next[id]
      } else {
        next[id] = { bookId: id, name: book.title || "Book", price: Number(book.sellingPrice) || 0, qty: 1 }
      }
      return next
    })
  }

  const updateQty = (bookId: number, qty: number) => {
    setSelected((prev) => (prev[bookId] ? { ...prev, [bookId]: { ...prev[bookId], qty: Math.max(1, Number(qty) || 1) } } : prev))
  }

  const removeSelected = (bookId: number) => {
    setSelected((prev) => {
      const next = { ...prev }
      delete next[bookId]
      return next
    })
  }

  const handleFindStudent = async () => {
    if (!admissionNo.trim()) return
    setFindState("loading")
    setStudent(null)
    try {
      const res = await fetch(`/api/students/lookup?admission_no=${encodeURIComponent(admissionNo.trim())}`)
      if (res.status === 404) {
        setFindState("notfound")
        return
      }
      if (!res.ok) throw new Error("Student not found")
      const data = await res.json()
      setStudent({ id: data.id, admissionNo: data.admissionNo, name: data.name, className: data.className, sectionName: data.sectionName })
      setFindState("found")
    } catch {
      setFindState("notfound")
    }
  }

  const handleSendToPos = () => {
    const errs: Record<string, string> = {}
    if (selectedList.length === 0) errs.selection = "Select at least one book"
    if (!student) errs.student = "Search and select a student first"
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    try {
      sessionStorage.setItem(
        "pos-cart-preselect",
        JSON.stringify({
          student: { id: student!.id, name: student!.name, admissionNo: student!.admissionNo, className: student!.className, sectionName: student!.sectionName },
          items: selectedList.map((i) => ({ type: "book", bookId: i.bookId, name: i.name, quantity: i.qty, unitPrice: i.price })),
        })
      )
      notify.success(`Sent ${selectedList.length} book(s) to POS for ${student!.name}`)
      router.push("/admin/students-inventory/student-sales")
    } catch {
      setFormErrors({ send: "Could not open POS. Please try again." })
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Sell Books</h2>
            <p className="text-sm text-white/80 mt-1">Students Inventory / Booklist / Sell Books</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-[var(--primary)]" />
                Select Books
              </h3>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => { setSelectedClass(e.target.value); setSelected({}); router.replace(`/admin/students-inventory/books/sell?class=${e.target.value}`) }}
                  className={`${inputCls} max-w-sm`}
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {!selectedClass ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-sm">Select a class to view its booklist.</p>
                </div>
              ) : classBooks.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-sm">No books assigned to {selectedClassName}. Add books from the booklist page first.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase w-12">
                          <input
                            type="checkbox"
                            className="accent-[var(--primary)] h-4 w-4"
                            checked={selectedList.length === classBooks.length}
                            onChange={(e) => {
                              setSelected(e.target.checked ? Object.fromEntries(classBooks.map((b) => [Number(b.id), { bookId: Number(b.id), name: b.title || "Book", price: Number(b.sellingPrice) || 0, qty: 1 }])) : {})
                            }}
                          />
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Sr. No.</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Name of the Book</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Publisher</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Price</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase w-32">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classBooks.map((b, idx) => {
                        const isSel = Boolean(selected[Number(b.id)])
                        return (
                          <tr key={b.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isSel ? "bg-[var(--primary)]/5" : ""}`}>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                className="accent-[var(--primary)] h-4 w-4"
                                checked={isSel}
                                onChange={() => toggleBook(b)}
                              />
                            </td>
                            <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{b.title}</td>
                            <td className="px-4 py-3 text-gray-600">{b.publisher || "-"}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{money(symbol, Number(b.sellingPrice) || 0)}</td>
                            <td className="px-4 py-3">
                              {isSel ? (
                                <div className="flex items-center rounded-lg border border-gray-300 w-fit">
                                  <button onClick={() => updateQty(Number(b.id), selected[Number(b.id)].qty - 1)} className="px-2 py-1.5 text-gray-500 hover:text-[var(--primary)]"><Minus className="h-3.5 w-3.5" /></button>
                                  <input
                                    type="number"
                                    min={1}
                                    value={selected[Number(b.id)].qty}
                                    onChange={(e) => updateQty(Number(b.id), Number(e.target.value))}
                                    className="w-10 text-center text-sm border-0 focus:ring-0"
                                  />
                                  <button onClick={() => updateQty(Number(b.id), selected[Number(b.id)].qty + 1)} className="px-2 py-1.5 text-gray-500 hover:text-[var(--primary)]"><Plus className="h-3.5 w-3.5" /></button>
                                </div>
                              ) : (
                                <span className="text-gray-300 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {formErrors.selection && <p className="text-red-500 text-xs mt-2">{formErrors.selection}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[var(--primary)]" />
                Search Student
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={admissionNo}
                  onChange={(e) => { setAdmissionNo(e.target.value); setFindState("idle"); setStudent(null) }}
                  className={inputCls}
                  placeholder="Enter admission no"
                />
                <button
                  onClick={handleFindStudent}
                  disabled={findState === "loading"}
                  className="px-3 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  <UserCheck className="h-4 w-4" />
                  {findState === "loading" ? "..." : "Search"}
                </button>
              </div>
              {formErrors.student && <p className="text-red-500 text-xs">{formErrors.student}</p>}
              {findState === "found" && student && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                  <span className="font-medium">{student.name}</span>
                  {student.className && <span> - {student.className}</span>}
                  {student.sectionName && <span> / {student.sectionName}</span>}
                </div>
              )}
              {findState === "notfound" && <p className="text-red-600 text-sm">Student not found</p>}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Selected Books</h3>
              {selectedList.length > 0 && (
                <span className="text-xs text-gray-500">{selectedCount} item{selectedCount === 1 ? "" : "s"}</span>
              )}
            </div>
            <div className="p-5 space-y-3">
              {selectedList.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No books selected yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {selectedList.map((i) => (
                    <div key={i.bookId} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{i.name}</div>
                        <div className="text-xs text-gray-500">{i.qty} × {money(symbol, i.price)}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-sm font-semibold text-gray-800">{money(symbol, round2(i.price * i.qty))}</div>
                        <button onClick={() => removeSelected(i.bookId)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items</span>
                  <span>{selectedCount}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-800">
                  <span>Subtotal</span>
                  <span>{money(symbol, selectedSubtotal)}</span>
                </div>
              </div>
              {formErrors.send && <p className="text-red-500 text-xs">{formErrors.send}</p>}
              <button
                onClick={handleSendToPos}
                disabled={sending}
                className="w-full px-4 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" />
                Send to POS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const round2 = (n: number) => Math.round(n * 100) / 100

const money = (symbol: string, v: number) => `${symbol}${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
