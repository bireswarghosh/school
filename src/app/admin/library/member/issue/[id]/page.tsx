"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Plus, RotateCcw, Phone, CreditCard, Hash, Calendar } from "lucide-react"
import { useApi } from "@/lib/use-api"

type IssueRecord = {
  id: number
  bookId: number
  bookName: string
  bookNumber: string
  memberName: string
  memberType: string
  issueDate: string
  returnDate: string
  status: string
}

type LibraryMember = {
  id: number
  member_type: string
  member_id: number
  library_card_no: string
  admission_no: string
  name: string
  phone: string
}

type BookRecord = {
  id: number
  bookName: string
  bookNumber: string
}

export default function IssueToMemberPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: records, add, update } = useApi<IssueRecord>("/api/library/issue")
  const { data: members } = useApi<LibraryMember>("/api/library/members")
  const [books, setBooks] = useState<BookRecord[]>([])

  const [member, setMember] = useState<LibraryMember | null>(null)
  const [bookId, setBookId] = useState("")
  const [bookSearch, setBookSearch] = useState("")
  const [bookShowDropdown, setBookShowDropdown] = useState(false)
  const [issueDate, setIssueDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/library/book").then((r) => r.json()).then(setBooks).catch(() => {})
  }, [])

  useEffect(() => {
    const m = members.find((x) => x.id === parseInt(id))
    if (m) setMember(m)
  }, [members, id])

  const memberIssues = records.filter((r) => r.memberName === member?.name)
  const issuedCount = memberIssues.filter((r) => r.status === "Issued").length
  const returnedCount = memberIssues.filter((r) => r.status === "Returned").length

  const filteredBooks = books.filter((b) => {
    if (!bookSearch) return true
    const q = bookSearch.toLowerCase()
    return b.bookName.toLowerCase().includes(q) || b.bookNumber.toLowerCase().includes(q)
  })

  const handleIssue = async () => {
    const errs: Record<string, string> = {}
    if (!bookId) errs.book = "Book is required"
    if (!issueDate) errs.issueDate = "Issue date is required"
    if (!returnDate) errs.returnDate = "Return date is required"
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    if (!member) return

    const book = books.find((b) => b.id === parseInt(bookId))
    await add({
      bookId: parseInt(bookId),
      bookName: book?.bookName || "",
      bookNumber: book?.bookNumber || "",
      memberName: member.name,
      memberType: member.member_type === "student" ? "Student" : "Staff",
      memberId: String(member.member_id),
      issueDate,
      returnDate,
      status: "Issued",
    })
    setBookId(""); setBookSearch(""); setIssueDate(""); setReturnDate("")
  }

  const handleReturn = async (recordId: number) => {
    await update(recordId, { status: "Returned" })
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "Issued": return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Issued</span>
      case "Returned": return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Returned</span>
      case "Due": return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Due</span>
      default: return null
    }
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Member Details</h2>
          <p className="text-sm text-white/80 mt-1">Library / Members</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-72 shrink-0">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-6 text-center border border-orange-200/50">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-orange-200">
                  {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mt-4">{member.name}</h3>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${member.member_type === "student" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"}`}>
                  {member.member_type === "student" ? "Student" : "Staff"}
                </span>
                <div className="mt-4 space-y-2 text-left text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-xs">Card No.: <span className="font-medium text-gray-800">{member.library_card_no || "-"}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Hash className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-xs">Admission No.: <span className="font-medium text-gray-800">{member.admission_no || "-"}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-xs">Phone: <span className="font-medium text-gray-800">{member.phone || "-"}</span></span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                  <p className="text-2xl font-bold text-blue-700">{issuedCount}</p>
                  <p className="text-xs text-blue-600 font-medium mt-0.5">Issued</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                  <p className="text-2xl font-bold text-green-700">{returnedCount}</p>
                  <p className="text-xs text-green-600 font-medium mt-0.5">Returned</p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-5 border border-gray-200">
                <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2 mb-4">
                  <BookOpen className="h-4 w-4 text-[var(--primary)]" />
                  Issue New Book
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Book</label>
                    <input type="text" value={bookSearch} onChange={(e) => { setBookSearch(e.target.value); setBookId(""); setBookShowDropdown(true) }} onFocus={() => setBookShowDropdown(true)} onBlur={() => setTimeout(() => setBookShowDropdown(false), 200)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Search book..." />
                    {bookId && <p className="text-xs text-emerald-600 mt-1">{books.find((b) => b.id === parseInt(bookId))?.bookName} selected</p>}
                    {bookShowDropdown && filteredBooks.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredBooks.map((b) => (
                          <button key={b.id} type="button" onMouseDown={() => { setBookId(String(b.id)); setBookSearch(b.bookName); setBookShowDropdown(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 hover:text-[var(--primary)] border-b border-gray-100 last:border-0">
                            <span className="font-medium">{b.bookName}</span>
                            <span className="text-xs text-gray-400 ml-2">{b.bookNumber}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {errors.book && <p className="text-red-500 text-xs mt-1">{errors.book}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Issue Date</label>
                    <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                    {errors.issueDate && <p className="text-red-500 text-xs mt-1">{errors.issueDate}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Return Date</label>
                    <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                    {errors.returnDate && <p className="text-red-500 text-xs mt-1">{errors.returnDate}</p>}
                  </div>
                </div>
                <button onClick={handleIssue} className="mt-4 px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Book Issue History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Book Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Book No.</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Issue Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Return Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {memberIssues.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No books issued yet</td></tr>
              ) : (
                memberIssues.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.bookName}</td>
                    <td className="px-4 py-3 text-gray-600">{r.bookNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{r.issueDate}</td>
                    <td className="px-4 py-3 text-gray-600">{r.returnDate}</td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status !== "Returned" && (
                        <button onClick={() => handleReturn(r.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Return">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    </div>
  )
}
