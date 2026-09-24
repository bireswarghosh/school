"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"
import { useSchoolInfo, type SchoolInfo } from "@/lib/use-school-info"
import { ArrowLeft, Loader2, Printer, CreditCard, Banknote, Building2, X, Check, Trash2, FileText, Tag, RotateCcw, CalendarDays, ChevronDown } from "lucide-react"
import { incomeHeadForGroup } from "@/lib/income-mapping"

type StudentRecord = {
  id: number
  admissionNo: string
  rollNo: string
  firstName: string
  middleName: string
  lastName: string
  class: string
  section: string
  gender: string
  dob: string
  category: string
  mobile: string
  fatherName: string
  status?: string
}

type FeeRecord = {
  id: number
  studentId: number | string
  feesGroup: number | string
  feesType: number | string
  amount: number | string
  discountAmount: number | string
  fineAmount: number | string
  paidAmount: number | string
  status: string
  paymentMode: string
  paymentDate: string
  transactionId: string
  session?: string
}

type ResolvedFee = FeeRecord & {
  feeTypeName: string
  groupName: string
  dueDate: string
  dueDay: number | null
  amount: number
  discount: number
  fine: number
  paid: number
  balance: number
  appliedDiscount: number
  appliedDiscountId: number | null
  hasAppliedNew: boolean
}

type StudentDiscount = {
  id: number
  name: string
  discountCode: string
  discountType: string
  percentage: number | null
  amount: number | null
  expiryDate: string
  useCount: number | null
  isActive: boolean | null
  approvedBy?: string | null
  approvedAt?: string | null
  used?: boolean | null
}

type CurrentUser = {
  id: number
  name: string
  role: string
  schoolId: number
}

type PaymentFormData = {
  method: "Cash" | "Cheque" | "Card" | "Online Transfer"
  chequeNo: string
  bank: string
  transactionId: string
  note: string
  date: string
}

type IncomeHead = { id: number; name: string }

const num = (v: unknown) => {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

const round2 = (n: number) => Math.round(n * 100) / 100

const money = (symbol: string, v: number) => `${symbol}${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fullName = (first: string | undefined | null, middle: string | undefined | null, last: string | undefined | null) =>
  [first, middle, last].filter((n) => n && n.trim()).join(" ")

const fmtDate = (d: string | undefined | null) => {
  if (!d) return "-"
  const parts = d.split("T")[0].split("-")
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d
}

type ReceiptLine = {
  sno: number
  group: string
  feeType: string
  amount: number
  discount: number
  fine: number
  paid: number
}

type ReceiptData = {
  receiptNo: string
  date: string
  method: string
  methodDetail: string
  note: string
  student: StudentRecord | null
  lines: ReceiptLine[]
  total: number
  school: SchoolInfo
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

const buildReceiptHtml = (r: ReceiptData): string => {
  const money = (v: number) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const rows = r.lines
    .map(
      (l) => `<tr>
        <td class="c">${l.sno}</td>
        <td>${esc(l.feeType)}<span class="sub">${esc(l.group)}</span></td>
        <td class="r">${money(l.amount)}</td>
        <td class="r">${l.discount > 0 ? money(l.discount) : "-"}</td>
        <td class="r">${l.fine > 0 ? money(l.fine) : "-"}</td>
        <td class="r strong">${money(l.paid)}</td>
      </tr>`
    )
    .join("")
  const st = r.student
  const contact = [r.school.address, [r.school.phone, r.school.email].filter(Boolean).join(" | ")]
    .filter((x) => x.trim())
    .join("<br />")

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Payment Receipt ${esc(r.receiptNo)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Arial, Helvetica, "Segoe UI", sans-serif; color: #1f2937; font-size: 13px; line-height: 1.5; background: #fff; padding: 20px; }
  .sheet { max-width: 720px; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: center; gap: 20px; border-bottom: 3px solid #ff7732; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand img { width: 64px; height: 64px; object-fit: contain; }
  .brand h1 { font-size: 22px; color: #111827; line-height: 1.2; }
  .brand .tag { color: #ff7732; font-size: 12px; margin-top: 2px; }
  .brand .contact { font-size: 11px; color: #4b5563; margin-top: 4px; }
  .meta { text-align: right; font-size: 12px; color: #4b5563; line-height: 1.9; white-space: nowrap; }
  .meta .doc { font-size: 17px; font-weight: 700; color: #ff7732; letter-spacing: 0.5px; }
  .meta .no { font-weight: 700; color: #111827; }
  .info { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 18px; font-size: 12px; }
  .info .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 3px; }
  .info .name { font-weight: 600; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  th { background: #ff7732; color: #fff; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 9px 12px; }
  td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  td .sub { display: block; font-size: 10px; color: #6b7280; margin-top: 1px; }
  .c { text-align: center; }
  .r { text-align: right; }
  .strong { font-weight: 700; }
  .totals { width: 320px; margin-left: auto; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
  .totals .row.grand { border-top: 2px solid #ff7732; font-weight: 700; font-size: 15px; padding-top: 10px; color: #111827; }
  .foot { margin-top: 26px; text-align: center; color: #6b7280; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  @page { size: A4; margin: 14mm; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="brand">
        ${r.school.logoSrc ? `<img src="${esc(r.school.logoSrc)}" alt="logo" />` : ""}
        <div>
          <h1>${esc(r.school.name)}</h1>
          ${r.school.session ? `<div class="tag">Session: ${esc(r.school.session)}</div>` : ""}
          ${contact ? `<div class="contact">${contact}</div>` : ""}
        </div>
      </div>
      <div class="meta">
        <div class="doc">PAYMENT RECEIPT</div>
        <div>Receipt No: <span class="no">${esc(r.receiptNo)}</span></div>
        <div>Date: ${esc(r.date)}</div>
        <div>Method: ${esc(r.method)}${r.methodDetail ? ` (${esc(r.methodDetail)})` : ""}</div>
      </div>
    </div>

    <div class="info">
      <div>
        <div class="lbl">Received From</div>
        <div class="name">${esc(st ? [st.firstName, st.middleName, st.lastName].filter(Boolean).join(" ") : "-")}</div>
        <div class="lbl" style="margin-top:6px">Class</div>
        <div>${st ? esc(`${st.class || ""}${st.section ? " - " + st.section : ""}`) : "-"}</div>
      </div>
      <div>
        <div class="lbl">Admission No</div>
        <div class="name">${esc(st?.admissionNo || "-")}</div>
        <div class="lbl" style="margin-top:6px">Roll No</div>
        <div>${esc(st?.rollNo || "-")}</div>
      </div>
      <div>
        <div class="lbl">Payment Details</div>
        <div>${esc(r.method)}</div>
        ${r.note ? `<div style="margin-top:3px;color:#4b5563">Note: ${esc(r.note)}</div>` : ""}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="c">#</th>
          <th>Fee Type</th>
          <th class="r">Amount</th>
          <th class="r">Discount</th>
          <th class="r">Fine</th>
          <th class="r">Paid</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div class="row grand"><span>Total Collected</span><span>${money(r.total)}</span></div>
    </div>

    <div class="foot">Thank you — This is a computer-generated receipt and does not require a signature.</div>
  </div>
</body>
</html>`
}

export default function AddFeePage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { symbol } = useCurrency()

  const [student, setStudent] = useState<StudentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [studentDiscounts, setStudentDiscounts] = useState<StudentDiscount[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  const [feeGroups, setFeeGroups] = useState<Record<number, string>>({})
  const [feeTypes, setFeeTypes] = useState<Record<number, { name: string; group: string }>>({})
  const [masterDueDates, setMasterDueDates] = useState<Record<string, string>>({})
  const [masterDueDays, setMasterDueDays] = useState<Record<string, number>>({})
  const [incomeHeads, setIncomeHeads] = useState<IncomeHead[]>([])

  const feesApi = useMemo(() => `/api/fees/fees-payment?studentId=${id}`, [id])
  const { data: fees, update, refetch } = useApi<FeeRecord>(feesApi)

  const [selectedFeeIds, setSelectedFeeIds] = useState<number[]>([])
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [payAmount, setPayAmount] = useState("")
  const [useDiscount, setUseDiscount] = useState(true)
  const [payment, setPayment] = useState<PaymentFormData>({
    method: "Cash", chequeNo: "", bank: "", transactionId: "", note: "",
    date: new Date().toISOString().split("T")[0],
  })
  const [paying, setPaying] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FeeRecord | null>(null)
  const [statusTargets, setStatusTargets] = useState<ResolvedFee[] | null>(null)
  const [statusSelection, setStatusSelection] = useState<Set<number>>(new Set())
  const [statusNote, setStatusNote] = useState("")
  const [savingStatus, setSavingStatus] = useState(false)
  const { info: schoolInfo } = useSchoolInfo()
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const docFrameRef = useRef<HTMLIFrameElement>(null)

  const buildReceipt = (): ReceiptData | null => {
    if (coverMeta.coverage.length === 0) return null
    const lines: ReceiptLine[] = coverMeta.coverage.map((c, i) => {
      const f = resolved.find((r) => r.id === c.id)!
      return { sno: i + 1, group: f.groupName, feeType: f.feeTypeName, amount: c.amount, discount: 0, fine: f.fine, paid: c.paid }
    })
    const methodDetail =
      payment.method === "Cheque"
        ? [payment.chequeNo ? `Cheque ${payment.chequeNo}` : "", payment.bank || ""].filter(Boolean).join(", ")
        : payment.method === "Card" || payment.method === "Online Transfer"
          ? payment.transactionId || ""
          : ""
    const appliedNote = coverMeta.discountUsed > 0 && activeDiscount ? discountNote() : ""
    return {
      receiptNo: `RC-${Date.now().toString().slice(-8)}`,
      date: payment.date || new Date().toISOString().split("T")[0],
      method: payment.method,
      methodDetail,
      note: [payment.note, appliedNote].filter(Boolean).join(" | "),
      student,
      lines,
      total: lines.reduce((s, l) => s + l.paid, 0),
      school: schoolInfo,
    }
  }

  const printReceipt = () => {
    if (!receipt) return
    const frame = docFrameRef.current
    if (!frame) return
    frame.srcdoc = buildReceiptHtml(receipt)
    frame.onload = () => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    }
  }

  const handlePrintReceipt = () => {
    if (coverMeta.coverage.length > 0) {
      const r = buildReceipt()
      if (r) setReceipt(r)
      else {
        notify.error("Select at least one fee to generate the receipt")
        return
      }
    } else if (!receipt) {
      notify.error("Collect a payment first to generate a receipt")
      return
    }
    setReceiptOpen(true)
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/student-information/student?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return }
        setStudent(data)
      })
      .catch(() => setError("Failed to load student"))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => { if (!d.error) setCurrentUser(d) })
        .catch(() => {}),
      fetch(`/api/fees/fees-discount?studentId=${id}`)
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d)) setStudentDiscounts(d) })
        .catch(() => {}),
    ])
  }, [id])

  useEffect(() => {
    Promise.all([
      fetch("/api/fees/fees-group").then((r) => r.json()).then((d) => {
        const map: Record<number, string> = {}
        ;(Array.isArray(d) ? d : []).forEach((g: any) => { map[Number(g.id)] = g.name })
        setFeeGroups(map)
      }),
      fetch("/api/fees/fees-type").then((r) => r.json()).then((d) => {
        const map: Record<number, { name: string; group: string }> = {}
        ;(Array.isArray(d) ? d : []).forEach((t: any) => { map[Number(t.id)] = { name: t.name, group: t.feesGroup } })
        setFeeTypes(map)
      }),
      fetch("/api/income/head").then((r) => r.json()).then((d) => {
        setIncomeHeads(Array.isArray(d) ? d : [])
      }).catch(() => {}),
      fetch("/api/fees/fees-master").then((r) => r.json()).then((d) => {
        const map: Record<string, string> = {}
        const dayMap: Record<string, number> = {}
        ;(Array.isArray(d) ? d : []).forEach((m: any) => {
          const key = `${m.feesGroup}|${m.feesType}`
          if (m.dueDay && m.dueDay >= 1 && m.dueDay <= 28) {
            dayMap[key] = Number(m.dueDay)
            map[key] = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), Number(m.dueDay)))
              .toISOString()
              .split("T")[0]
          } else if (m.dueDate) {
            map[key] = m.dueDate
          }
        })
        setMasterDueDates(map)
        setMasterDueDays(dayMap)
      }),
    ]).catch(() => {})
  }, [])

  useEffect(() => {
    if (!fees) return
    setSelectedFeeIds((prev) => {
      if (prev.length > 0) return prev
      return (fees || [])
        .filter((f) => num(f.amount) - num(f.discountAmount) - num(f.paidAmount) > 0)
        .map((f) => Number(f.id))
    })
  }, [fees])

const baseResolved: ResolvedFee[] = useMemo(() => {
  return (fees || []).map((f) => {
    const amount = num(f.amount)
    const discount = num(f.discountAmount)
    const fine = num(f.fineAmount)
    const paid = num(f.paidAmount)
    const balance = amount - discount - paid
    const groupName = f.feesGroup ? (feeGroups[Number(f.feesGroup)] ?? `Group ${f.feesGroup}`) : "-"
    const feeTypeName = f.feesType ? (feeTypes[Number(f.feesType)]?.name ?? `Type ${f.feesType}`) : "-"
    const key = `${groupName}|${feeTypeName}`
    const dueDate = masterDueDates[key] || "-"
    const dueDay = masterDueDays[key] ?? null
    return { ...f, groupName, feeTypeName, dueDate, dueDay, amount, discount, fine, paid, balance, appliedDiscount: 0, appliedDiscountId: null, hasAppliedNew: false }
  })
}, [fees, feeGroups, feeTypes, masterDueDates, masterDueDays])

const activeDiscount = useMemo<StudentDiscount | null>(() => {
  const t = new Date().toISOString().split("T")[0]
  return (
    (studentDiscounts || []).find(
      (d) =>
        d.isActive !== false &&
        !d.used &&
        (!d.expiryDate || d.expiryDate >= t) &&
        ((d.discountType === "Percentage" && num(d.percentage) > 0) ||
          (d.discountType === "Fix" && num(d.amount) > 0))
    ) ?? null
  )
}, [studentDiscounts])

const resolved: ResolvedFee[] = useMemo(() => {
  return baseResolved.map((f) => ({ ...f, appliedDiscount: 0, appliedDiscountId: null, hasAppliedNew: false }))
}, [baseResolved])

  const totalBalance = resolved.reduce((s, f) => s + f.balance, 0)

  const groupedFees = useMemo(() => {
    const map = new Map<string, ResolvedFee[]>()
    for (const f of resolved) {
      const key = f.groupName || "Unassigned"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(f)
    }
    return Array.from(map.entries()).map(([name, fees]) => ({ name, fees }))
  }, [resolved])

  const toggleGroupCollapse = (name: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const selectableFees = useMemo(() => {
    return resolved.filter((f) => f.balance > 0)
  }, [resolved])

  const allSelectableSelected =
    selectableFees.length > 0 && selectableFees.every((f) => selectedFeeIds.includes(f.id))

  const toggleSelectAll = () => {
    setSelectedFeeIds((prev) => {
      if (prev.length > 0 && selectableFees.every((f) => prev.includes(f.id))) {
        return prev.filter((id) => !selectableFees.some((f) => f.id === id))
      }
      const kept = prev.filter((id) => !selectableFees.some((f) => f.id === id))
      return [...kept, ...selectableFees.map((f) => f.id)]
    })
  }

  const groupSelectables = (fees: ResolvedFee[]) => fees.filter((f) => f.balance > 0)

  const allGroupSelected = (fees: ResolvedFee[]) => {
    const sel = groupSelectables(fees)
    return sel.length > 0 && sel.every((f) => selectedFeeIds.includes(f.id))
  }

  const toggleGroupSelection = (fees: ResolvedFee[]) => {
    const sel = groupSelectables(fees)
    setSelectedFeeIds((prev) => {
      if (sel.length > 0 && sel.every((f) => prev.includes(f.id))) {
        return prev.filter((id) => !sel.some((f) => f.id === id))
      }
      const kept = prev.filter((id) => !sel.some((f) => f.id === id))
      return [...kept, ...sel.map((f) => f.id)]
    })
  }

  const toggleFeeSelection = (feeId: number) => {
    setSelectedFeeIds((prev) =>
      prev.includes(feeId) ? prev.filter((id) => id !== feeId) : [...prev, feeId]
    )
  }

  const selectedFees = resolved.filter((f) => selectedFeeIds.includes(f.id) && f.balance > 0)
  const selectedBalance = selectedFees.reduce((sum, f) => sum + f.balance, 0)

  const coverMeta = useMemo(() => {
    const sorted = [...selectedFees].sort((a, b) => a.id - b.id)
    const totalGross = round2(selectedBalance)
    const discRaw = useDiscount && activeDiscount
      ? activeDiscount.discountType === "Percentage"
        ? round2((totalGross * num(activeDiscount.percentage)) / 100)
        : num(activeDiscount.amount)
      : 0
    const discountUsed = round2(Math.min(totalGross, Math.max(0, discRaw)))
    const netPayable = round2(Math.max(0, totalGross - discountUsed))

    const enteredRaw = parseFloat(payAmount)
    const entered = payAmount.trim() === "" || isNaN(enteredRaw) ? netPayable : Math.max(0, Math.min(enteredRaw, netPayable))

    const coverage: { id: number; amount: number; discount: number; paid: number }[] = []
    const balSum = sorted.reduce((s, f) => s + f.balance, 0)
    let remDisc = discountUsed
    for (let i = 0; i < sorted.length; i++) {
      const f = sorted[i]
      const share =
        i === sorted.length - 1
          ? Math.min(f.balance, remDisc)
          : Math.min(f.balance, round2((discountUsed * f.balance) / Math.max(1, balSum)))
      coverage.push({ id: f.id, amount: f.balance, discount: round2(share), paid: 0 })
      remDisc = round2(remDisc - share)
    }
    let remPaid = entered
    for (const c of coverage) {
      if (remPaid <= 0) break
      const take = Math.min(c.amount - c.discount, remPaid)
      c.paid = round2(Math.max(0, take))
      remPaid = round2(remPaid - take)
    }
    return { entered, discountUsed, netPayable, coverage }
  }, [selectedFees, selectedBalance, payAmount, activeDiscount, useDiscount])

  const discountNote = () => {
    if (!activeDiscount || !useDiscount || coverMeta.discountUsed <= 0) return ""
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    const when = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    return `Discount ${activeDiscount.discountCode} applied in full (${activeDiscount.discountType === "Percentage" ? `${activeDiscount.percentage}%` : `${activeDiscount.discountCode} ${num(activeDiscount.amount)}`}) approved by ${currentUser?.name || "Admin"} on ${when}.`
  }

  const handlePayNow = async () => {
    if (coverMeta.coverage.length === 0) return
    setPaying(true)
    const paymentDate = payment.date || new Date().toISOString().split("T")[0]
    const note = discountNote()
    const studentName = student ? fullName(student.firstName, student.middleName, student.lastName) : ""
    try {
      let collected = 0
      for (const c of coverMeta.coverage) {
        const f = resolved.find((r) => r.id === c.id)!
        const newPaid = f.paid + c.paid
        const status = newPaid >= f.amount ? "Paid" : newPaid > 0 ? "Partial" : "Unpaid"
        await update(c.id, {
          paidAmount: newPaid,
          status,
          paymentMode: payment.method,
          paymentDate,
          transactionId: payment.transactionId || null,
          bankName: payment.method === "Cheque" ? (payment.bank || null) : null,
          chequeNo: payment.method === "Cheque" ? (payment.chequeNo || null) : null,
          discountId: c.discount > 0 && activeDiscount ? activeDiscount.id : null,
          discountAmount: c.discount > 0 ? c.discount : null,
          note: c.discount > 0 && note ? [payment.note || "", note].filter(Boolean).join(" | ") : payment.note || null,
        })
        if (c.paid <= 0) continue
        collected = round2(collected + c.paid)
        const incomeHeadId = incomeHeadForGroup(f.groupName, incomeHeads)
        if (incomeHeadId) {
          await fetch("/api/income", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              incomeHeadId,
              name: studentName,
              date: paymentDate,
              amount: c.paid,
              description: `${f.feeTypeName} (${f.groupName})`,
              paymentMode: payment.method,
              note: c.discount > 0 && note ? [payment.note || "", note].filter(Boolean).join(" | ") : payment.note || "",
              feePaymentId: c.id,
              studentId: Number(id),
            }),
          })
        }
      }
      setToast(`Payment of ${money(symbol, collected)} collected successfully!`)
      const r = buildReceipt()
      if (r) {
        setReceipt(r)
        setReceiptOpen(true)
      }
      setSelectedFeeIds([])
      setPayAmount("")
      await refetch()
    } catch (e: any) {
      notify.error(e.message || "Payment failed")
    } finally {
      setPaying(false)
    }
  }

  const handleDeleteFee = (f: FeeRecord) => setDeleteTarget(f)

  const confirmDeleteFee = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/fees/fees-payment?id=${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete fee record")
      notify.success("Fee record deleted successfully!")
      setDeleteTarget(null)
      setSelectedFeeIds((prev) => prev.filter((id) => id !== deleteTarget.id))
      await refetch()
    } catch (e: any) {
      notify.error(e.message || "Failed to delete fee record")
    }
  }

  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const openStatusChange = (fee: ResolvedFee) => {
    setStatusTargets([fee])
    setStatusNote("")
  }

  const openBulkStatusChange = () => {
    const targets = resolved.filter((f) => statusSelection.has(f.id) && (f.status === "Paid" || f.status === "paid" || f.status === "Partial" || f.paid > 0))
    if (targets.length === 0) return
    setStatusTargets(targets)
    setStatusNote("")
  }

  const toggleStatusSelection = (fee: ResolvedFee) => {
    const selectable = fee.status === "Paid" || fee.status === "paid" || fee.status === "Partial" || fee.paid > 0
    if (!selectable) return
    setStatusSelection((prev) => {
      const next = new Set(prev)
      if (next.has(fee.id)) next.delete(fee.id)
      else next.add(fee.id)
      return next
    })
  }

  const clearStatusSelection = () => setStatusSelection(new Set())

  const confirmStatusChange = async () => {
    if (!statusTargets || statusTargets.length === 0) return
    const reason = statusNote.trim()
    if (!reason) {
      notify.error("Please provide a reason for changing the payment status")
      return
    }
    setSavingStatus(true)
    try {
      for (const target of statusTargets) {
        const before = target.paid
        await update(target.id, {
          status: "Unpaid",
          paidAmount: 0,
          paymentDate: null,
          transactionId: null,
          bankName: null,
          chequeNo: null,
          note: reason,
        })
        await fetch(`/api/income?feePaymentId=${target.id}`, { method: "DELETE" }).catch(() => {})
        await fetch("/api/fees/fees-payment-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: Number(id),
            feePaymentId: target.id,
            feeTypeId: target.feesType ?? null,
            feeGroupId: target.feesGroup ?? null,
            amountPaid: 0,
            paidBefore: before,
            paidAfter: 0,
            paymentMode: target.paymentMode || null,
            changeKind: "status",
            oldStatus: target.status,
            newStatus: "Unpaid",
            studentName: student ? fullName(student.firstName, student.middleName, student.lastName) : "",
            feeTypeName: target.feeTypeName,
            note: reason,
            createdBy: currentUser?.name || "Admin",
            paidAt: new Date().toISOString(),
          }),
        })
      }
      notify.success(`${statusTargets.length} payment status${statusTargets.length > 1 ? "es" : ""} changed to Not Paid (Due)`)
      setStatusTargets(null)
      setStatusSelection(new Set())
      setStatusNote("")
      await refetch()
    } catch (e: any) {
      notify.error(e.message || "Failed to change payment status")
    } finally {
      setSavingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-sm">{error || "Student not found"}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-[var(--primary)] border border-gray-300 rounded-lg hover:bg-[var(--primary-light)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
          <Check className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Collect Fees</h2>
            <p className="text-sm text-gray-500 mt-1">
              Fees Collection / Collect Fees / {fullName(student.firstName, student.middleName, student.lastName)}
            </p>
          </div>
        </div>
      </div>

      {/* Student Info + Fees Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50/50 to-white flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-800">Fee Details</h3>
          <div className="flex items-center gap-4">
            {selectableFees.length > 0 && (
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allSelectableSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                {allSelectableSelected ? "Unselect All" : "Select All"}
              </label>
            )}
            <span className="text-xs text-gray-500">Admission No: {student.admissionNo}</span>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Student Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 h-fit">
              <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Student Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium text-gray-800">{fullName(student.firstName, student.middleName, student.lastName)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Class</span>
                  <span className="font-medium text-gray-800">{student.class}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Section</span>
                  <span className="font-medium text-gray-800">{student.section}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Admission No</span>
                  <span className="font-medium text-gray-800">{student.admissionNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Roll No</span>
                  <span className="font-medium text-gray-800">{student.rollNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Father Name</span>
                  <span className="font-medium text-gray-800">{student.fatherName || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">DOB</span>
                  <span className="font-medium text-gray-800">{fmtDate(student.dob)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mobile</span>
                  <span className="font-medium text-gray-800">{student.mobile || "-"}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Total Balance</span>
                  <span className={`font-semibold ${totalBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                    {money(symbol, totalBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Panel - Fees Table */}
            <div className="lg:col-span-2 overflow-x-auto">
              {statusSelection.size > 0 && (
                <div className="flex items-center justify-between flex-wrap gap-3 mb-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                  <span className="text-xs font-medium text-amber-800">
                    <RotateCcw className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" />
                    {statusSelection.size} fee record{statusSelection.size !== 1 ? "s" : ""} selected to change payment status
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearStatusSelection}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-white transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={openBulkStatusChange}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Change to Not Paid
                    </button>
                  </div>
                </div>
              )}
              {resolved.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No fee records found for this student</div>
              ) : (
                <div className="space-y-3">
                  {groupedFees.map((group) => {
                    const collapsed = !!collapsedGroups[group.name]
                    const groupBalance = group.fees.reduce((s, f) => s + f.balance, 0)
                    return (
                      <div key={group.name} className="rounded-xl border border-gray-200 overflow-hidden">
                        <div
                          className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary)]/5 border-b border-gray-200 cursor-pointer select-none"
                          onClick={() => toggleGroupCollapse(group.name)}
                        >
                          <div className="flex items-center gap-3 min-w-0" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={allGroupSelected(group.fees)}
                              onChange={() => toggleGroupSelection(group.fees)}
                              title={allGroupSelected(group.fees) ? "Unselect all in this group" : "Select all in this group"}
                              className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                            />
                            <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
                            <span className="text-sm font-bold text-gray-800 truncate">{group.name}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-gray-600 border border-gray-200">
                              {group.fees.length} fee{group.fees.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-red-600 whitespace-nowrap">
                            Balance: {money(symbol, groupBalance)}
                          </div>
                        </div>
                        {!collapsed && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase w-8">#</th>
                                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Fee Type</th>
                                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Due Date</th>
                                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Amount</th>
                                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Fine</th>
                                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Paid</th>
                                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Balance</th>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Status</th>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase" title="Select fees to change their payment status">Not Paid?</th>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.fees.map((fee, idx) => {
                                  const isSelected = selectedFeeIds.includes(fee.id)
                                  const isPaid = fee.status === "Paid" || fee.status === "paid"
                                  const hasPayment = isPaid || fee.status === "Partial" || fee.paid > 0
                                  return (
                                    <tr key={fee.id} className={`border-b border-gray-100 hover:bg-[var(--primary-light)]/20 transition-colors ${idx % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                                      <td className="px-3 py-2.5">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          disabled={isPaid}
                                          onChange={() => toggleFeeSelection(fee.id)}
                                          className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                                        />
                                      </td>
                                      <td className="px-3 py-2.5 font-medium text-gray-800">{fee.feeTypeName}</td>
                                      <td className="px-3 py-2.5 text-gray-600">{fee.dueDay ? `${fee.dueDay}th of every month` : fee.dueDate === "-" ? "-" : fmtDate(fee.dueDate)}</td>
                                      <td className="px-3 py-2.5 text-right text-gray-800">{money(symbol, fee.amount)}</td>
                                      <td className="px-3 py-2.5 text-right text-red-600">{fee.fine > 0 ? money(symbol, fee.fine) : "-"}</td>
                                      <td className="px-3 py-2.5 text-right text-green-600">{fee.paid > 0 ? money(symbol, fee.paid) : "-"}</td>
                                      <td className={`px-3 py-2.5 text-right font-medium ${fee.balance > 0 ? "text-red-600" : "text-green-600"}`}>{money(symbol, fee.balance)}</td>
                                      <td className="px-3 py-2.5 text-center">
                                        {isPaid ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">Paid</span>
                                        ) : fee.status === "Partial" || fee.paid > 0 ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">Partial</span>
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700">Unpaid</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2.5 text-center">
                                        {hasPayment ? (
                                          <input
                                            type="checkbox"
                                            checked={statusSelection.has(fee.id)}
                                            onChange={() => toggleStatusSelection(fee)}
                                            title="Mark as Not Paid (select multiple allowed)"
                                            className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                          />
                                        ) : (
                                          <span className="text-gray-300 text-xs">—</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2.5 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          {hasPayment ? (
                                            <button
                                              onClick={() => openStatusChange(fee)}
                                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                                              title="Mark as Not Paid / Due (revert payment)"
                                            >
                                              <RotateCcw className="h-3 w-3" />
                                              Change
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => handleDeleteFee(fee)}
                                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                              title="Delete"
                                            >
                                              <X className="h-3.5 w-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeDiscount && (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary-light)] px-4 py-3 text-xs text-gray-700">
          <Tag className="h-4 w-4 text-[var(--primary)] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useDiscount}
                onChange={() => setUseDiscount((v) => !v)}
                className="accent-[var(--primary)]"
              />
              <span className="font-semibold text-gray-800">Use student discount ({activeDiscount.discountCode})</span>
            </label>
            <p className="mt-1 text-gray-600">
              {activeDiscount.discountType === "Percentage"
                ? `${activeDiscount.percentage}%`
                : `${symbol}${num(activeDiscount.amount)}`}{" "}
              off the total selected fees.
              {activeDiscount.approvedBy
                ? ` Approved by ${activeDiscount.approvedBy}${activeDiscount.approvedAt ? ` on ${fmtDate(activeDiscount.approvedAt)}` : ""}.`
                : " Approved."}
              {activeDiscount.expiryDate ? ` Valid till ${fmtDate(activeDiscount.expiryDate)}.` : ""}{" "}
              {useDiscount
                ? "The discount is applied once on the total — it will not be split per fee item."
                : "Unchecked — the discount will not be applied to this payment."}
            </p>
          </div>
        </div>
      )}

      {/* Payment Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700">Payment Details</h4>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Payment Method */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Payment Method</label>
              <div className="space-y-2">
                {[
                  { value: "Cash", icon: Banknote },
                  { value: "Cheque", icon: Building2 },
                  { value: "Card", icon: CreditCard },
                  { value: "Online Transfer", icon: CreditCard },
                ].map(({ value, icon: Icon }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-[var(--primary)]">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={payment.method === value}
                      onChange={() => setPayment((prev) => ({ ...prev, method: value as PaymentFormData["method"] }))}
                      className="text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <Icon className="h-4 w-4 text-gray-400" />
                    {value}
                  </label>
                ))}
              </div>
            </div>

            {/* Dynamic Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Received Payment Date</label>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="date"
                    value={payment.date}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setPayment((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
              </div>
              {payment.method === "Cheque" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cheque/DD No</label>
                    <input
                      type="text"
                      value={payment.chequeNo}
                      onChange={(e) => setPayment((prev) => ({ ...prev, chequeNo: e.target.value }))}
                      placeholder="Enter cheque number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bank</label>
                    <input
                      type="text"
                      value={payment.bank}
                      onChange={(e) => setPayment((prev) => ({ ...prev, bank: e.target.value }))}
                      placeholder="Enter bank name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    />
                  </div>
                </>
              )}
              {(payment.method === "Card" || payment.method === "Online Transfer") && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Transaction ID</label>
                  <input
                    type="text"
                    value={payment.transactionId}
                    onChange={(e) => setPayment((prev) => ({ ...prev, transactionId: e.target.value }))}
                    placeholder="Enter transaction ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
              <textarea
                value={payment.note}
                onChange={(e) => setPayment((prev) => ({ ...prev, note: e.target.value }))}
                rows={3}
                placeholder="Add a note..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              />
            </div>

            {/* Amount to Pay */}
            <div className="bg-[var(--primary-light)] rounded-xl p-4 flex flex-col justify-center">
              <label className="block text-xs font-medium text-[var(--primary)] uppercase tracking-wider">Amount Received (cash)</label>
              <input
                type="number"
                min={0}
                max={coverMeta.netPayable > 0 ? coverMeta.netPayable : selectedBalance}
                step="1"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder={String(coverMeta.netPayable)}
                className="mt-1.5 w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
              />
              <p className="text-xs text-gray-500 mt-1.5">{selectedFees.length} fee(s) selected · Total {money(symbol, selectedBalance)}</p>
              {activeDiscount && (
                <label className={`mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer ${useDiscount ? "border-emerald-300 bg-emerald-50" : "border-gray-300 bg-white"}`}>
                  <input
                    type="checkbox"
                    checked={useDiscount}
                    onChange={() => setUseDiscount((v) => !v)}
                    className="accent-[var(--primary)]"
                  />
                  <span className="text-xs font-medium text-gray-700">
                    {useDiscount
                      ? <>Applying discount <span className="font-mono text-[var(--primary)]">{activeDiscount.discountCode}</span> on the total</>
                      : <>Discount skipped — not applied</>}
                  </span>
                </label>
              )}
              {activeDiscount && coverMeta.discountUsed > 0 && (
                <div className="mt-2 space-y-0.5 text-xs">
                  <p className="text-emerald-700 font-medium">Discount − {money(symbol, coverMeta.discountUsed)} ({activeDiscount.discountCode}) <span className="text-gray-500">(applied in full)</span></p>
                  <p className="text-base font-bold text-[var(--primary)] text-xl">Net Payable {money(symbol, coverMeta.netPayable)}</p>
                </div>
              )}
              {activeDiscount && coverMeta.discountUsed === 0 && (
                <p className="text-xs text-gray-500 mt-1.5">{useDiscount ? "Select fees and enter an amount to apply the discount on the total." : "Discount skipped — the full selected amount is payable."}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-500">{selectedFees.length} fee(s) selected</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintReceipt}
            className="px-4 py-2 text-sm font-medium text-[var(--primary)] border border-indigo-300 rounded-lg hover:bg-[var(--primary-light)] transition-colors flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
          <button
            onClick={handlePayNow}
            disabled={selectedFeeIds.length === 0 || paying}
            className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-green-200"
          >
            {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            {paying ? "Processing..." : "Pay Now"}
          </button>
        </div>
      </div>

      {/* Delete Fee Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setDeleteTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-red-50">
                  <Trash2 className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-sm text-gray-600">
                  Are you sure you want to remove this fee record?
                  <strong className="block mt-1 text-gray-800">
                    {(() => {
                      const f = resolved.find((r) => r.id === deleteTarget.id)
                      return f ? `${f.feeTypeName} (${money(symbol, f.amount)})` : ""
                    })()}
                  </strong>
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFee}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Payment Status Modal */}
      {statusTargets && statusTargets.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !savingStatus && setStatusTargets(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Change Payment Status</h3>
                  <p className="text-xs text-gray-500">
                    {statusTargets.length > 1 ? `${statusTargets.length} fee records selected` : `${statusTargets[0].feeTypeName} · ${student.admissionNo}`}
                  </p>
                </div>
              </div>
              <button onClick={() => !savingStatus && setStatusTargets(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
                {statusTargets.length > 1 ? (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    <div className="flex justify-between text-sm pb-1 border-b border-amber-200">
                      <span className="text-gray-500 font-medium">Fee</span>
                      <span className="text-gray-500 font-medium">Status · Paid</span>
                    </div>
                    {statusTargets.map((t) => (
                      <div key={t.id} className="flex justify-between text-sm">
                        <span className="text-gray-800 font-medium">{t.feeTypeName}</span>
                        <span className="text-gray-600">
                          {t.status} · {money(symbol, t.paid)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-1 border-t border-amber-200">
                      <span className="text-gray-500">Total marked Not Paid</span>
                      <span className="font-semibold text-amber-700">All {statusTargets.length} → Not Paid (Due)</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Current Status</span>
                      <span className="font-semibold text-gray-800">{statusTargets[0].status}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount Paid</span>
                      <span className="font-semibold text-gray-800">{money(symbol, statusTargets[0].paid)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">New Status</span>
                      <span className="font-semibold text-amber-700">Not Paid (Due)</span>
                    </div>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500">
                This will revert the paid amount{statusTargets.length > 1 ? "s" : ""} to{" "}
                <strong>{money(symbol, 0)}</strong> so the payment{statusTargets.length > 1 ? "s can" : " can"} be
                collected again. Every change is recorded in the Payment Change Log.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Reason for change <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  placeholder="Why are you changing this payment status? e.g. wrong payment recorded, cheque bounced..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setStatusTargets(null)}
                disabled={savingStatus}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={savingStatus || !statusNote.trim()}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
              >
                {savingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Mark as Not Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptOpen && receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setReceiptOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl z-10 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[var(--primary)]" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Payment Receipt</h3>
                  <p className="text-xs text-gray-500">{receipt.school.name} · {receipt.receiptNo}</p>
                </div>
              </div>
              <button onClick={() => setReceiptOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100">
              <iframe
                ref={docFrameRef}
                title="Receipt preview"
                className="w-full h-full min-h-[560px] bg-white"
                srcDoc={buildReceiptHtml(receipt)}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setReceiptOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={printReceipt}
                className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
