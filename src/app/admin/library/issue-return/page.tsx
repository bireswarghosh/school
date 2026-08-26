"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Plus, RotateCcw, X, BookOpen, Eye } from "lucide-react"
import { useApi } from "@/lib/use-api"
import Link from "next/link"

type IssueRecord = {
  id: number
  bookId: number
  bookName: string
  bookNumber: string
  memberName: string
  memberType: "Student" | "Staff"
  memberId: string
  issueDate: string
  returnDate: string
  status: "Issued" | "Returned" | "Due"
}

type BookRecord = {
  id: number
  bookName: string
  bookNumber: string
}

type MemberRecord = {
  id: number
  member_type: string
  member_id: number
  name: string
  library_card_no: string
}

export default function IssueReturnPage() {
  const { data: records, add, update } = useApi<IssueRecord>("/api/library/issue")
  const [books, setBooks] = useState<BookRecord[]>([])
  const [members, setMembers] = useState<MemberRecord[]>([])

  useEffect(() => {
    fetch("/api/library/book").then((r) => r.json()).then(setBooks).catch(() => {})
    fetch("/api/library/members").then((r) => r.json()).then(setMembers).catch(() => {})
  }, [])

  const [filterBook, setFilterBook] = useState("")
  const [filterMemberType, setFilterMemberType] = useState("")
  const [filterMemberName, setFilterMemberName] = useState("")

  const [showIssueModal, setShowIssueModal] = useState(false)
  const [issueBookId, setIssueBookId] = useState("")
  const [issueMemberType, setIssueMemberType] = useState<"Student" | "Staff">("Student")
  const [issueMemberId, setIssueMemberId] = useState("")
  const [issueMemberSearch, setIssueMemberSearch] = useState("")
  const [issueShowDropdown, setIssueShowDropdown] = useState(false)
  const [issueDate, setIssueDate] = useState("")
  const [issueReturnDate, setIssueReturnDate] = useState("")
  const [issueErrors, setIssueErrors] = useState<Record<string, string>>({})
  const [issueBookSearch, setIssueBookSearch] = useState("")
  const [issueBookShowDropdown, setIssueBookShowDropdown] = useState(false)

  const memberOptions = useMemo(() => {
    return members.filter((m) => m.member_type === issueMemberType.toLowerCase())
  }, [members, issueMemberType])

  const filteredMemberOptions = useMemo(() => {
    if (!issueMemberSearch) return memberOptions
    const q = issueMemberSearch.toLowerCase()
    return memberOptions.filter((m) => m.name.toLowerCase().includes(q) || (m.library_card_no && m.library_card_no.toLowerCase().includes(q)))
  }, [memberOptions, issueMemberSearch])

  const filteredBookOptions = useMemo(() => {
    if (!issueBookSearch) return books
    const q = issueBookSearch.toLowerCase()
    return books.filter((b) => b.bookName.toLowerCase().includes(q) || b.bookNumber.toLowerCase().includes(q))
  }, [books, issueBookSearch])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterBook && r.bookName !== filterBook) return false
      if (filterMemberType && r.memberType !== filterMemberType) return false
      if (filterMemberName && r.memberName !== filterMemberName) return false
      return true
    })
  }, [records, filterBook, filterMemberType, filterMemberName])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault() }

  const handleIssueBook = async () => {
    const errs: Record<string, string> = {}
    if (!issueBookId) errs.issueBook = "Book is required"
    if (!issueMemberId) errs.issueMemberName = "Member is required"
    if (!issueDate) errs.issueDate = "Issue date is required"
    if (!issueReturnDate) errs.issueReturnDate = "Return date is required"
    setIssueErrors(errs)
    if (Object.keys(errs).length > 0) return

    const book = books.find((b) => b.id === parseInt(issueBookId))

    const selected = memberOptions.find((m) => m.id === parseInt(issueMemberId))
    await add({
      bookId: parseInt(issueBookId),
      bookName: book?.bookName || "",
      bookNumber: book?.bookNumber || "",
      memberType: issueMemberType,
      memberName: selected?.name || "",
      memberId: String(selected?.member_id ?? ""),
      issueDate,
      returnDate: issueReturnDate,
      status: "Issued",
    })
    setShowIssueModal(false)
    setIssueBookId("")
    setIssueBookSearch("")
    setIssueBookShowDropdown(false)
    setIssueMemberType("Student")
    setIssueMemberId("")
    setIssueMemberSearch("")
    setIssueShowDropdown(false)
    setIssueDate("")
    setIssueReturnDate("")
  }

  const handleReturn = async (id: number) => {
    await update(id, { status: "Returned" })
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "Issued":
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Issued</span>
      case "Returned":
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Returned</span>
      case "Due":
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Due</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Issue & Return</h2>
          <p className="text-sm text-white/80 mt-1">Library / Issue & Return</p>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Book Name</label>
              <select value={filterBook} onChange={(e) => setFilterBook(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">Select</option>
                {books.map((b) => (
                  <option key={b.id} value={b.bookName}>{b.bookName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Member Type</label>
              <select value={filterMemberType} onChange={(e) => setFilterMemberType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">All</option>
                <option value="Student">Student</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Member Name</label>
              <select value={filterMemberName} onChange={(e) => setFilterMemberName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">Select</option>
                {members.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </button>
              <button type="button" onClick={() => setShowIssueModal(true)} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Issue Book
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Book Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Book No.</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Member Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Member Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Issue Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Return Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">No records found</td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.bookName}</td>
                    <td className="px-4 py-3 text-gray-600">{r.bookNumber}</td>
                    <td className="px-4 py-3 text-gray-800">{r.memberName}</td>
                    <td className="px-4 py-3">
                      {r.memberType === "Student" ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Student</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">Staff</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.issueDate}</td>
                    <td className="px-4 py-3 text-gray-600">{r.returnDate}</td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(() => {
                          const memberLink = members.find((m) => m.name === r.memberName)
                          return memberLink ? (
                            <Link href={`/admin/library/member/issue/${memberLink.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Member History">
                              <Eye className="h-4 w-4" />
                            </Link>
                          ) : null
                        })()}
                        {r.status !== "Returned" && (
                          <button onClick={() => handleReturn(r.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Return">
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length} of {records.length} records</span>
        </div>
      </div>

      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowIssueModal(false); setIssueErrors({}) }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Issue Book</h3>
              <button onClick={() => { setShowIssueModal(false); setIssueErrors({}) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Book</label>
                <input type="text" value={issueBookSearch} onChange={(e) => { setIssueBookSearch(e.target.value); setIssueBookId(""); setIssueBookShowDropdown(true) }} onFocus={() => setIssueBookShowDropdown(true)} onBlur={() => setTimeout(() => setIssueBookShowDropdown(false), 200)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Search book..." />
                {issueBookId && (
                  <p className="text-xs text-emerald-600 mt-1">{books.find((b) => b.id === parseInt(issueBookId))?.bookName} selected</p>
                )}
                {issueBookShowDropdown && filteredBookOptions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredBookOptions.map((b) => (
                      <button key={b.id} type="button" onMouseDown={() => { setIssueBookId(String(b.id)); setIssueBookSearch(b.bookName); setIssueBookShowDropdown(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 hover:text-[var(--primary)] border-b border-gray-100 last:border-0">
                        <span className="font-medium">{b.bookName}</span>
                        <span className="text-xs text-gray-400 ml-2">{b.bookNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
                {issueErrors.issueBook && <p className="text-red-500 text-xs mt-1">{issueErrors.issueBook}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="memberType" checked={issueMemberType === "Student"} onChange={() => { setIssueMemberType("Student"); setIssueMemberId(""); setIssueMemberSearch("") }} className="text-[var(--primary)]" />
                    Student
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="memberType" checked={issueMemberType === "Staff"} onChange={() => { setIssueMemberType("Staff"); setIssueMemberId(""); setIssueMemberSearch("") }} className="text-[var(--primary)]" />
                    Staff
                  </label>
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
                <input type="text" value={issueMemberSearch} onChange={(e) => { setIssueMemberSearch(e.target.value); setIssueMemberId(""); setIssueShowDropdown(true) }} onFocus={() => setIssueShowDropdown(true)} onBlur={() => setTimeout(() => setIssueShowDropdown(false), 200)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder={`Search ${issueMemberType}...`} />
                {issueMemberId && (
                  <p className="text-xs text-emerald-600 mt-1">{memberOptions.find((m) => m.id === parseInt(issueMemberId))?.name} selected</p>
                )}
                {issueShowDropdown && filteredMemberOptions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredMemberOptions.map((m) => (
                      <button key={m.id} type="button" onMouseDown={() => { setIssueMemberId(String(m.id)); setIssueMemberSearch(m.name); setIssueShowDropdown(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 hover:text-[var(--primary)] border-b border-gray-100 last:border-0">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{m.library_card_no}</span>
                      </button>
                    ))}
                  </div>
                )}
                {issueErrors.issueMemberName && <p className="text-red-500 text-xs mt-1">{issueErrors.issueMemberName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {issueErrors.issueDate && <p className="text-red-500 text-xs mt-1">{issueErrors.issueDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                  <input type="date" value={issueReturnDate} onChange={(e) => setIssueReturnDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {issueErrors.issueReturnDate && <p className="text-red-500 text-xs mt-1">{issueErrors.issueReturnDate}</p>}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => { setShowIssueModal(false); setIssueErrors({}) }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleIssueBook} className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
