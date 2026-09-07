"use client"

import { useState, useEffect } from "react"
import { User, Wallet, FileSpreadsheet, CalendarCheck, FolderOpen, History, Loader2, Printer, FileDown } from "lucide-react"
import { useCurrency } from "@/lib/currency-context"

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function fullName(first: string | null | undefined, middle: string | null | undefined, last: string | null | undefined) {
  return [first, middle, last].filter((n) => n && n.trim()).join(" ")
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?"
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  const parts = d.split("T")[0].split("-")
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d
}

function partsOf(d: string | null | undefined): { y: string; m: number; day: number } | null {
  if (!d) return null
  const p = d.split("T")[0].split("-")
  if (p.length !== 3) return null
  return { y: p[0], m: parseInt(p[1], 10) - 1, day: parseInt(p[2], 10) }
}

const num = (v: unknown) => {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

const money = (symbol: string, v: number) => `${symbol}${v.toLocaleString("en-IN")}`

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right">{value}</span>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-[11px]">{title}</h4>
}

function emptyBlock(text: string) {
  return <div className="text-center py-12 text-gray-400 text-sm">{text}</div>
}

function statusBadge(status: string | undefined) {
  const s = String(status || "").toLowerCase()
  const cls =
    s === "paid" || s === "success" ? "bg-green-100 text-green-800" :
    s === "partial" || s === "pending" ? "bg-yellow-100 text-yellow-800" :
    "bg-red-100 text-red-800"
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status || "Pending"}</span>
}

export default function PortalProfile() {
  const { symbol } = useCurrency()
  const [details, setDetails] = useState<any>(null)
  const [fees, setFees] = useState<any>(null)
  const [exams, setExams] = useState<any>(null)
  const [attendance, setAttendance] = useState<any>(null)
  const [otherPayments, setOtherPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("profile")

  useEffect(() => {
    Promise.all([
      fetch("/api/my/student/details").then((r) => r.json()),
      fetch("/api/my/student/fees").then((r) => r.json()),
      fetch("/api/my/student/exams").then((r) => r.json()),
      fetch("/api/my/student/attendance").then((r) => r.json()),
      fetch("/api/my/student/other-payments").then((r) => r.json()),
    ])
      .then(([d, f, e, a, op]) => {
        setDetails(d)
        setFees(f)
        setExams(e)
        setAttendance(a)
        setOtherPayments(op?.sales || [])
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false))
  }, [])

  const student = details?.student
  const academic = details?.academic
  const parent = details?.parent
  const bank = details?.bank
  const className = `${student?.className || academic?.className || "—"}${student?.sectionName || academic?.sectionName ? ` - ${student?.sectionName || academic?.sectionName}` : ""}`

  const tabs = [
    { key: "profile", label: "Profile", icon: User },
    { key: "fees", label: "Fees", icon: Wallet },
    { key: "otherPayments", label: "Other Payments", icon: Wallet },
    { key: "exam", label: "Exam", icon: FileSpreadsheet },
    { key: "attendance", label: "Attendance", icon: CalendarCheck },
    { key: "documents", label: "Documents", icon: FolderOpen },
    { key: "timeline", label: "Timeline", icon: History },
  ]

  const buildReceiptHtml = (sale: any) => {
    return `<!DOCTYPE html><html><head><title>Payment Receipt - ${sale.saleNo || ""}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
      .receipt { max-width: 400px; margin: 0 auto; border: 2px dashed #ccc; padding: 20px; }
      .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
      .header h2 { margin: 0; font-size: 18px; }
      .header p { margin: 2px 0 0; font-size: 12px; color: #666; }
      .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
      .row .label { color: #666; }
      .row .value { font-weight: bold; }
      .total { border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
      .footer { text-align: center; margin-top: 15px; font-size: 11px; color: #999; }
      @media print { body { padding: 0; } .receipt { border: none; } }
    </style></head><body>
    <div class="receipt">
      <div class="header">
        <h2>PAYMENT RECEIPT</h2>
        <p>School Name</p>
      </div>
      <div class="row"><span class="label">Receipt No:</span><span class="value">${sale.saleNo || "—"}</span></div>
      <div class="row"><span class="label">Student:</span><span class="value">${sale.studentName || student?.name || "—"}</span></div>
      <div class="row"><span class="label">Class:</span><span class="value">${className || "—"}</span></div>
      <div class="row"><span class="label">Date:</span><span class="value">${sale.saleDate ? new Date(sale.saleDate).toLocaleDateString("en-IN") : "—"}</span></div>
      <hr style="border:none;border-top:1px dashed #ccc;margin:10px 0">
      <div class="row"><span class="label">Item:</span><span class="value">${sale.bookName || sale.productName || "—"}</span></div>
      <div class="row"><span class="label">Quantity:</span><span class="value">${sale.quantity || 0}</span></div>
      <div class="row"><span class="label">Amount:</span><span class="value">${symbol}${Number(sale.totalAmount || 0).toLocaleString("en-IN")}</span></div>
      ${Number(sale.discountAmount || 0) > 0 ? `<div class="row"><span class="label">Discount:</span><span class="value" style="color:red">-${symbol}${Number(sale.discountAmount).toLocaleString("en-IN")}</span></div>` : ""}
      <div class="row total"><span class="label">Total Paid:</span><span class="value">${symbol}${Number(sale.totalAmount || 0).toLocaleString("en-IN")}</span></div>
      <div class="row"><span class="label">Status:</span><span class="value" style="color:${String(sale.paymentStatus || "").toLowerCase() === "paid" ? "green" : "red"}">${sale.paymentStatus || "Unpaid"}</span></div>
      <div class="footer">Thank you for your payment!</div>
    </div>
    </body></html>`
  }

  const buildFeeReceiptHtml = (fee: any) => {
    return `<!DOCTYPE html><html><head><title>Fee Receipt - ${fee.feesType || ""}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
      .receipt { max-width: 400px; margin: 0 auto; border: 2px dashed #ccc; padding: 20px; }
      .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
      .header h2 { margin: 0; font-size: 18px; }
      .header p { margin: 2px 0 0; font-size: 12px; color: #666; }
      .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
      .row .label { color: #666; }
      .row .value { font-weight: bold; }
      .total { border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
      .footer { text-align: center; margin-top: 15px; font-size: 11px; color: #999; }
      @media print { body { padding: 0; } .receipt { border: none; } }
    </style></head><body>
    <div class="receipt">
      <div class="header">
        <h2>FEE RECEIPT</h2>
        <p>School Name</p>
      </div>
      <div class="row"><span class="label">Student:</span><span class="value">${student?.name || "—"}</span></div>
      <div class="row"><span class="label">Class:</span><span class="value">${className || "—"}</span></div>
      <div class="row"><span class="label">Admission No:</span><span class="value">${student?.admissionNo || "—"}</span></div>
      <div class="row"><span class="label">Date:</span><span class="value">${fee.dueDate ? new Date(fee.dueDate).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN")}</span></div>
      <hr style="border:none;border-top:1px dashed #ccc;margin:10px 0">
      <div class="row"><span class="label">Fees Group:</span><span class="value">${fee.feesGroup || "—"}</span></div>
      <div class="row"><span class="label">Fees Type:</span><span class="value">${fee.feesType || "—"}</span></div>
      <div class="row"><span class="label">Due Date:</span><span class="value">${fee.dueDate ? new Date(fee.dueDate).toLocaleDateString("en-IN") : "—"}</span></div>
      <div class="row"><span class="label">Amount:</span><span class="value">${symbol}${Number(fee.amount || 0).toLocaleString("en-IN")}</span></div>
      ${Number(fee.paidAmount || 0) > 0 ? `<div class="row"><span class="label">Paid:</span><span class="value" style="color:green">${symbol}${Number(fee.paidAmount).toLocaleString("en-IN")}</span></div>` : ""}
      <div class="row total"><span class="label">Balance:</span><span class="value" style="color:${Number(fee.balance || 0) > 0 ? "red" : "green"}">${symbol}${Number(fee.balance || 0).toLocaleString("en-IN")}</span></div>
      <div class="footer">Thank you for your payment!</div>
    </div>
    </body></html>`
  }

  const printReceipt = (sale: any) => {
    const win = window.open("", "_blank", "width=500,height=600")
    if (!win) return
    win.document.write(buildReceiptHtml(sale))
    win.document.close()
    win.onload = () => { win.print() }
  }

  const downloadReceipt = (sale: any) => {
    const win = window.open("", "_blank", "width=500,height=600")
    if (!win) return
    win.document.write(buildReceiptHtml(sale))
    win.document.close()
    win.onload = () => { win.print() }
  }

  const printFeeReceipt = (fee: any) => {
    const win = window.open("", "_blank", "width=500,height=600")
    if (!win) return
    win.document.write(buildFeeReceiptHtml(fee))
    win.document.close()
    win.onload = () => { win.print() }
  }

  const downloadFeeReceipt = (fee: any) => {
    const win = window.open("", "_blank", "width=500,height=600")
    if (!win) return
    win.document.write(buildFeeReceiptHtml(fee))
    win.document.close()
    win.onload = () => { win.print() }
  }

  const presentCount = attendance?.summary?.["Present"] || 0
  const absentCount = attendance?.summary?.["Absent"] || 0
  const summaryTotal = Object.values(attendance?.summary || {}).reduce((s: number, v: any) => s + num(v), 0)
  const totalAttendance = summaryTotal || 1

  const timelineEvents = [
    { title: "Student Admitted", description: null as string | null, timelineDate: student?.admissionDate, admission: true },
  ].filter((e) => e.timelineDate)

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--title-color)]">My Profile</h2>
          <p className="text-sm text-[var(--subtitle-color)] mt-1">Your complete student record</p>
        </div>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-[var(--title-color)]">My Profile</h2>
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error || "Profile not found"}</div>
      </div>
    )
  }

  const name = fullName(student.firstName, student.middleName, student.lastName) || "Student"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">My Profile</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">Your complete student record</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary)]/5 px-6 py-6 text-center">
              <div className="relative mx-auto w-24 h-24">
                {student.studentPhoto ? (
                  <img src={student.studentPhoto} alt="Student" className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-white" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-3xl shadow-md border-4 border-white">
                    {initials(name)}
                  </div>
                )}
              </div>
              <h1 className="text-lg font-bold text-gray-900 mt-4">{name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{className}</p>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Admission No</span>
                <span className="font-medium text-gray-800">{student.admissionNo || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Roll No</span>
                <span className="font-medium text-gray-800">{student.rollNo ?? "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Date of Birth</span>
                <span className="font-medium text-gray-800">{fmtDate(student.dob)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Gender</span>
                <span className="font-medium text-gray-800">{student.gender || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Session</span>
                <span className="font-medium text-gray-800">{student.session || academic?.session || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${String(student.status || "").toLowerCase() === "active" ? "bg-green-100 text-green-800" : String(student.status || "").toLowerCase() === "disabled" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"}`}>{student.status || "Active"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 overflow-x-auto">
            <div className="flex gap-0">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === tab.key
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "profile" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <SectionTitle title="Personal Details" />
                  <div className="space-y-3">
                    <Row label="Admission No" value={student.admissionNo || "—"} />
                    <Row label="Roll No" value={student.rollNo ?? "—"} />
                    <Row label="First Name" value={student.firstName || "—"} />
                    <Row label="Middle Name" value={student.middleName || "—"} />
                    <Row label="Last Name" value={student.lastName || "—"} />
                    <Row label="Class" value={className} />
                    <Row label="Date of Birth" value={fmtDate(student.dob)} />
                    <Row label="Gender" value={student.gender || "—"} />
                    <Row label="Blood Group" value={student.bloodGroup || "—"} />
                    <Row label="Height" value={student.height || "—"} />
                    <Row label="Weight" value={student.weight || "—"} />
                  </div>
                  <SectionTitle title="Contact & Other Details" />
                  <div className="space-y-3">
                    <Row label="Mobile" value={student.mobile || student.phone || "—"} />
                    <Row label="Email" value={student.email || "—"} />
                    <Row label="Address" value={student.address || student.currentAddress || "—"} />
                    <Row label="Religion" value={student.religion || "—"} />
                    <Row label="Caste" value={student.caste || "—"} />
                    <Row label="Category" value={student.category || "—"} />
                    <Row label="House" value={student.house || "—"} />
                    <Row label="Admission Date" value={fmtDate(student.admissionDate)} />
                    <Row label="Previous School" value={student.previousSchool || "—"} />
                  </div>
                </div>

                <div className="space-y-4">
                  <SectionTitle title="Parent Details" />
                  <div className="space-y-3">
                    <Row label="Father Name" value={parent?.fatherName || "—"} />
                    <Row label="Father Phone" value={parent?.fatherPhone || "—"} />
                    <Row label="Father Occupation" value={parent?.fatherOccupation || "—"} />
                    <Row label="Mother Name" value={parent?.motherName || "—"} />
                    <Row label="Mother Phone" value={parent?.motherPhone || "—"} />
                    <Row label="Mother Occupation" value={parent?.motherOccupation || "—"} />
                  </div>
                  <SectionTitle title="Guardian Details" />
                  <div className="space-y-3">
                    <Row label="Guardian Is" value={parent?.guardianIs || "—"} />
                    <Row label="Guardian Name" value={parent?.guardianName || "—"} />
                    <Row label="Guardian Relation" value={parent?.guardianRelation || "—"} />
                    <Row label="Guardian Email" value={parent?.guardianEmail || "—"} />
                    <Row label="Guardian Phone" value={parent?.guardianPhone || "—"} />
                    <Row label="Guardian Occupation" value={parent?.guardianOccupation || "—"} />
                    <Row label="Guardian Address" value={parent?.guardianAddress || "—"} />
                  </div>
                  <SectionTitle title="Addresses" />
                  <div className="space-y-3">
                    <Row label="Current Address" value={student.currentAddress || "—"} />
                    <Row label="Permanent Address" value={student.permanentAddress || "—"} />
                  </div>
                  <SectionTitle title="Bank & Identification" />
                  <div className="space-y-3">
                    <Row label="Bank Account No" value={bank?.bankAccountNo || "—"} />
                    <Row label="Bank Name" value={bank?.bankName || "—"} />
                    <Row label="IFSC Code" value={bank?.ifscCode || "—"} />
                    <Row label="National Identification No" value={bank?.nationalIdentificationNo || "—"} />
                    <Row label="Local Identification No" value={bank?.localIdentificationNo || "—"} />
                    <Row label="RTE" value={student.rte || "—"} />
                  </div>
                  {student.note && (
                    <>
                      <SectionTitle title="Note" />
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{student.note}</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "fees" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-800">Fees History</h4>
                  {fees?.dues && fees.dues.length > 0 && (
                    <button onClick={() => {
                      fees.dues.forEach((d: any, i: number) => {
                        setTimeout(() => downloadFeeReceipt(d), i * 200)
                      })
                    }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90">
                      <FileDown className="h-3.5 w-3.5" /> Download All
                    </button>
                  )}
                </div>
                {(!fees?.dues || fees.dues.length === 0) ? (
                  emptyBlock("No fee records found")
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Fees Group</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Fees Type</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Due Date</th>
                          <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Amount</th>
                          <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Paid</th>
                          <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Balance</th>
                          <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fees.dues.map((d: any, i: number) => (
                          <tr key={i} className="border-t border-gray-100 hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 text-gray-700">{d.feesGroup || "—"}</td>
                            <td className="px-4 py-2.5 text-gray-700">{d.feesType || "—"}</td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs">{fmtDate(d.dueDate)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-800 font-medium">{money(symbol,num(d.amount))}</td>
                            <td className="px-4 py-2.5 text-right text-gray-700">{num(d.paidAmount) > 0 ? money(symbol,num(d.paidAmount)) : "—"}</td>
                            <td className={`px-4 py-2.5 text-right font-semibold ${num(d.balance) > 0 ? "text-red-600" : "text-green-600"}`}>{money(symbol,num(d.balance))}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => printFeeReceipt(d)} title="Print Receipt" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[var(--primary)] transition-colors">
                                  <Printer className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => downloadFeeReceipt(d)} title="Download Receipt" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[var(--primary)] transition-colors">
                                  <FileDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 border-t border-gray-200">
                          <td colSpan={3} className="px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Total Due</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{money(symbol,fees.dues.reduce((s: number, d: any) => s + num(d.amount), 0))}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{money(symbol,fees.dues.reduce((s: number, d: any) => s + num(d.paidAmount), 0))}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-red-600">{money(symbol,fees.dues.reduce((s: number, d: any) => s + num(d.balance), 0))}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "otherPayments" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-800">Other Payments (POS Sales)</h4>
                  {otherPayments.length > 0 && (
                    <button onClick={() => {
                      otherPayments.forEach((s: any, i: number) => {
                        setTimeout(() => downloadReceipt(s), i * 200)
                      })
                    }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90">
                      <FileDown className="h-3.5 w-3.5" /> Download All
                    </button>
                  )}
                </div>
                {otherPayments.length === 0 ? (
                  emptyBlock("No other payments recorded")
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Sale No</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Item</th>
                          <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Qty</th>
                          <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Amount</th>
                          <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Discount</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Date</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Status</th>
                          <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {otherPayments.map((s: any, i: number) => (
                          <tr key={s.id ?? i} className="border-t border-gray-100 hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 font-medium text-gray-800">{s.saleNo || "—"}</td>
                            <td className="px-4 py-2.5 text-gray-700">{s.bookName || s.productName || "—"}</td>
                            <td className="px-4 py-2.5 text-right text-gray-600">{s.quantity}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-800">{money(symbol, num(s.totalAmount))}</td>
                            <td className="px-4 py-2.5 text-right text-red-600">{money(symbol, num(s.discountAmount))}</td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs">{fmtDate(s.saleDate)}</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${String(s.paymentStatus || "").toLowerCase() === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                {s.paymentStatus || "Unpaid"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => printReceipt(s)} title="Print Receipt" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[var(--primary)] transition-colors">
                                  <Printer className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => downloadReceipt(s)} title="Download Receipt" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[var(--primary)] transition-colors">
                                  <FileDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 border-t border-gray-200">
                          <td colSpan={3} className="px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Total</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{money(symbol, otherPayments.reduce((s: number, p: any) => s + num(p.totalAmount), 0))}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-red-600">{money(symbol, otherPayments.reduce((s: number, p: any) => s + num(p.discountAmount), 0))}</td>
                          <td colSpan={3}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "exam" && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Exam Results</h4>
                {(!exams?.results || exams.results.length === 0) ? (
                  emptyBlock("No exam records found for this student")
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Exam</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Subject</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Marks</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exams.results.map((m: any, i: number) => {
                          const theory = num(m.theoryMarks)
                          const practical = num(m.practicalMarks)
                          const marksText = m.absent ? "Absent" : theory > 0 || practical > 0 ? `${theory + practical}` : "—"
                          return (
                            <tr key={i} className="border-t border-gray-100 hover:bg-gray-50/50">
                              <td className="px-4 py-2.5 text-gray-700">{m.examName || "—"}</td>
                              <td className="px-4 py-2.5 text-gray-700">{m.subject || "—"}</td>
                              <td className="px-4 py-2.5 text-gray-700">{marksText}</td>
                              <td className="px-4 py-2.5 text-gray-700">{m.grade || "—"}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "attendance" && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Attendance Summary</h4>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 rounded-xl p-5 text-center border border-green-200">
                    <p className="text-3xl font-bold text-green-700">{presentCount}</p>
                    <p className="text-xs text-green-600 mt-1">Present</p>
                    <p className="text-[10px] text-green-400 mt-0.5">{((presentCount / totalAttendance) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-5 text-center border border-red-200">
                    <p className="text-3xl font-bold text-red-700">{absentCount}</p>
                    <p className="text-xs text-red-600 mt-1">Absent</p>
                    <p className="text-[10px] text-red-400 mt-0.5">{((absentCount / totalAttendance) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-5 text-center border border-yellow-200">
                    <p className="text-3xl font-bold text-yellow-700">{summaryTotal - presentCount - absentCount}</p>
                    <p className="text-xs text-yellow-600 mt-1">Leave</p>
                    <p className="text-[10px] text-yellow-400 mt-0.5">{(((summaryTotal - presentCount - absentCount) / totalAttendance) * 100).toFixed(1)}%</p>
                  </div>
                </div>
                {attendance?.records && attendance.records.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Date</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.records.map((a: any, i: number) => (
                          <tr key={i} className="border-t border-gray-100 hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 text-gray-500 text-xs">{a.date ? fmtDate(a.date) : "—"}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                String(a.attendanceType || "").toLowerCase() === "present" ? "bg-green-100 text-green-800" :
                                String(a.attendanceType || "").toLowerCase() === "absent" ? "bg-red-100 text-red-800" :
                                "bg-yellow-100 text-yellow-800"
                              }`}>
                                {a.attendanceType || "Leave"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  emptyBlock("No attendance records found")
                )}
              </div>
            )}

            {activeTab === "documents" && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Documents</h4>
                {emptyBlock("No documents uploaded")}
              </div>
            )}

            {activeTab === "timeline" && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Timeline</h4>
                {timelineEvents.length === 0 ? (
                  emptyBlock("No timeline events")
                ) : (
                  <div className="relative">
                    <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-gradient-to-b from-[var(--primary)] via-gray-200 to-gray-200" />
                    <div className="space-y-8">
                      {timelineEvents.map((ev: any, ei: number) => {
                        const pd = partsOf(ev.timelineDate)
                        return (
                          <div key={ei} className="relative pl-8">
                            <div className="absolute left-[7px] -translate-x-1/2 top-0.5 w-5 h-5 rounded-full bg-[var(--primary)] ring-4 ring-[var(--primary)]/15 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                              <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gradient-to-r from-[var(--primary)]/5 to-transparent px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${ev.admission ? "bg-[var(--primary)]" : "bg-blue-500"}`} />
                                  <span className="text-sm font-semibold text-gray-800 truncate">{ev.title}</span>
                                </div>
                              </div>
                              <div className="px-3 py-2.5">
                                {ev.description ? (
                                  <p className="text-xs text-gray-600">{ev.description}</p>
                                ) : (
                                  <p className="text-[11px] text-gray-400 italic">No description</p>
                                )}
                              </div>
                              <div className="px-3 py-1.5 border-t border-gray-50 bg-gray-50/60 text-right">
                                <span className="text-[11px] text-gray-500">
                                  {pd ? `${DAYS[new Date(Number(pd.y), Number(pd.m), Number(pd.day)).getDay()]}, ${pd.day} ${MONTHS[pd.m]}, ${pd.y}` : fmtDate(ev.timelineDate)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
