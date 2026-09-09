"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, X, Save, Download, Upload, Printer, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, GripVertical, Search, UserPlus, Percent } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"

interface FineRow {
  id: string
  overdueDays: number
  fineAmount: number
}

interface FeesMasterRecord {
  id: number
  feesGroup: string
  feesType: string
  class: string
  amount: number
  dueDate: string
  dueDay?: number | null
  fineType: "None" | "Percentage" | "Fix Amount" | "Cumulative"
  fineValue?: number
  perDay?: boolean
  fineRows?: FineRow[]
  status: string
  sortOrder?: number
}

type Option = { id: number; name: string }

type AddMultipleRow = {
  key: string
  class: string
  feesGroup: string
  feesType: string
  dueDate: string
  amount: string
  fineType: "None" | "Percentage" | "Fix Amount" | "Cumulative"
  fineValue: string
  perDay: boolean
  fineRows: FineRow[]
}

const today = () => new Date().toISOString().split("T")[0]

let fineRowIdCounter = 100
let addRowKeyCounter = 1000

function nextFineRowId() {
  return String(fineRowIdCounter++)
}

function nextAddRowKey() {
  return String(addRowKeyCounter++)
}

export default function FeesMasterPage() {
  const { symbol } = useCurrency()
  const router = useRouter()
  const { data: records, add, update, remove, refetch } = useApi<FeesMasterRecord>("/api/fees/fees-master")
  const { data: classes } = useApi<Option>("/api/academics/class")
  const { data: groups } = useApi<Option>("/api/fees/fees-group")
  const { data: types } = useApi<Option>("/api/fees/fees-type")
  const fileRef = useRef<HTMLInputElement>(null)

  const [classVal, setClassVal] = useState("")
  const [feesGroup, setFeesGroup] = useState("")
  const [feesType, setFeesType] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [amount, setAmount] = useState("")
  const [fineType, setFineType] = useState<"None" | "Percentage" | "Fix Amount" | "Cumulative">("None")
  const [fineValue, setFineValue] = useState("")
  const [perDay, setPerDay] = useState(false)
  const [fineRows, setFineRows] = useState<FineRow[]>([{ id: nextFineRowId(), overdueDays: 0, fineAmount: 0 }])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [showEditModal, setShowEditModal] = useState(false)
  const [editRecord, setEditRecord] = useState<FeesMasterRecord | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteRecord, setDeleteRecord] = useState<FeesMasterRecord | null>(null)

  const [dragItem, setDragItem] = useState<{ group: string; id: number } | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)

  const [showAddMultipleModal, setShowAddMultipleModal] = useState(false)
  const [addMultipleRows, setAddMultipleRows] = useState<AddMultipleRow[]>([])
  const [addMultipleErrors, setAddMultipleErrors] = useState<Record<string, string>>({})

  const [showApplyFineModal, setShowApplyFineModal] = useState(false)
  const [applyFineTypeId, setApplyFineTypeId] = useState("")
  const [applyDueDay, setApplyDueDay] = useState("")
  const [applyFineType, setApplyFineType] = useState<"None" | "Percentage" | "Fix Amount" | "Cumulative">("None")
  const [applyFineValue, setApplyFineValue] = useState("")
  const [applyPerDay, setApplyPerDay] = useState(false)
  const [applyFineRows, setApplyFineRows] = useState<FineRow[]>([])
  const [applyFineErrors, setApplyFineErrors] = useState<Record<string, string>>({})

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkGroupName, setBulkGroupName] = useState("")
  const [bulkRows, setBulkRows] = useState<FeesMasterRecord[]>([])
  const [bulkErrors, setBulkErrors] = useState<Record<string, string>>({})

  const [keyword, setKeyword] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(50)

  const currentData = records || []
  const classList = classes || []
  const groupList = groups || []
  const typeList = types || []

  function resetForm() {
    setClassVal("")
    setFeesGroup("")
    setFeesType("")
    setDueDate("")
    setAmount("")
    setFineType("None")
    setFineValue("")
    setPerDay(false)
    setFineRows([{ id: nextFineRowId(), overdueDays: 0, fineAmount: 0 }])
    setErrors({})
  }

  async function handleAdd() {
    const errs: Record<string, string> = {}
    if (!feesGroup) errs.feesGroup = "Fees group is required"
    if (!feesType) errs.feesType = "Fees type is required"
    if (!amount || parseFloat(amount) <= 0) errs.amount = "Valid amount is required"
    setErrors(errs)
    if (Object.keys(errs).length) return

    const payload: any = {
      class: classVal,
      feesGroup,
      feesType,
      amount: parseFloat(amount),
      dueDate,
      fineType,
    }
    if (fineType === "Percentage" || fineType === "Fix Amount") {
      payload.fineValue = parseFloat(fineValue) || 0
    }
    if (fineType === "Cumulative") {
      payload.perDay = perDay
      payload.fineRows = fineRows
    }
    await add(payload)
    resetForm()
  }

  function openAddMultiple() {
    setAddMultipleRows([{ key: nextAddRowKey(), class: "", feesGroup: "", feesType: "", dueDate: "", amount: "", fineType: "None", fineValue: "", perDay: false, fineRows: [] }])
    setAddMultipleErrors({})
    setShowAddMultipleModal(true)
  }

  function addMultipleRow() {
    setAddMultipleRows((prev) => [...prev, { key: nextAddRowKey(), class: "", feesGroup: "", feesType: "", dueDate: "", amount: "", fineType: "None", fineValue: "", perDay: false, fineRows: [] }])
  }

  function removeAddMultipleRow(key: string) {
    setAddMultipleRows((prev) => prev.filter((r) => r.key !== key))
  }

  function updateAddMultipleRow(key: string, field: string, value: any) {
    setAddMultipleRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r
        if (field === "fineType") {
          const next: AddMultipleRow = { ...r, fineType: value }
          if (value === "None") {
            next.fineValue = ""
            next.perDay = false
            next.fineRows = []
          }
          return next
        }
        return { ...r, [field]: value }
      })
    )
  }

  function updateAddMultipleFineRows(key: string, fineRows: FineRow[]) {
    setAddMultipleRows((prev) => prev.map((r) => (r.key === key ? { ...r, fineRows } : r)))
  }

  function openApplyFine() {
    setApplyFineTypeId("")
    setApplyDueDay("")
    setApplyFineType("None")
    setApplyFineValue("")
    setApplyPerDay(false)
    setApplyFineRows([])
    setApplyFineErrors({})
    setShowApplyFineModal(true)
  }

  const applyFineName = () => typeList.find((t: any) => String(t.id) === applyFineTypeId)?.name || ""

  const applyFineMatches = () => {
    const name = applyFineName()
    if (!name) return []
    return currentData.filter((r) => r.feesType === name)
  }

  function updateApplyFineType(ft: "None" | "Percentage" | "Fix Amount" | "Cumulative") {
    setApplyFineType(ft)
    if (ft === "None") {
      setApplyFineValue("")
      setApplyPerDay(false)
      setApplyFineRows([])
    }
  }

  function addApplyFineRow() {
    setApplyFineRows((prev) => [...prev, { id: nextFineRowId(), overdueDays: 0, fineAmount: 0 }])
  }

  function updateApplyFineRow(id: string, field: keyof FineRow, value: number) {
    setApplyFineRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  async function confirmApplyFine() {
    const errs: Record<string, string> = {}
    if (!applyFineTypeId) errs.feesType = "Fees type is required"
    const dueDayNum = parseInt(applyDueDay, 10)
    if (!(dueDayNum >= 1 && dueDayNum <= 28)) errs.dueDay = "Select a due day (1-28)"
    if ((applyFineType === "Percentage" || applyFineType === "Fix Amount") && !(parseFloat(applyFineValue) > 0)) {
      errs.fineValue = "Fine value is required"
    }
    setApplyFineErrors(errs)
    if (Object.keys(errs).length) return
    const matches = applyFineMatches()
    if (matches.length === 0) {
      notify.error("No fees master rows use this fees type")
      return
    }
    try {
      await Promise.all(
        matches.map((r) => {
          const payload: any = { dueDay: dueDayNum, fineType: applyFineType }
          if (applyFineType === "Percentage" || applyFineType === "Fix Amount") {
            payload.fineValue = parseFloat(applyFineValue) || 0
            payload.perDay = false
            payload.fineRows = []
          } else if (applyFineType === "Cumulative") {
            payload.fineValue = null
            payload.perDay = applyPerDay
            payload.fineRows = applyFineRows
          } else {
            payload.fineValue = null
            payload.perDay = false
            payload.fineRows = []
          }
          return update(r.id, payload)
        })
      )
      notify.success(`Applied to ${matches.length} fee(s) using "${applyFineName()}"`)
      setShowApplyFineModal(false)
      await refetch()
    } catch (e: any) {
      notify.error(e.message || "Failed to apply changes")
    }
  }

  async function saveAddMultiple() {
    const errs: Record<string, string> = {}
    addMultipleRows.forEach((r) => {
      if (!r.feesGroup) errs[`${r.key}-feesGroup`] = "Required"
      if (!r.feesType) errs[`${r.key}-feesType`] = "Required"
      if (!r.amount || parseFloat(r.amount) <= 0) errs[`${r.key}-amount`] = "Required"
    })
    setAddMultipleErrors(errs)
    if (Object.keys(errs).length) return

    const payloads = addMultipleRows.map((r) => {
      const p: any = {
        class: r.class,
        feesGroup: r.feesGroup,
        feesType: r.feesType,
        amount: parseFloat(r.amount),
        dueDate: r.dueDate,
        fineType: r.fineType,
      }
      if (r.fineType === "Percentage" || r.fineType === "Fix Amount") {
        p.fineValue = parseFloat(r.fineValue) || 0
      }
      if (r.fineType === "Cumulative") {
        p.perDay = r.perDay
        p.fineRows = r.fineRows
      }
      return p
    })

    try {
      const res = await fetch("/api/fees/fees-master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloads),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Failed to add fees")
      notify.success(`Added ${payloads.length} fees successfully`)
      setShowAddMultipleModal(false)
      setAddMultipleRows([])
      await refetch()
    } catch (e: any) {
      notify.error(e.message || "Failed to add fees")
    }
  }

  function openEdit(record: FeesMasterRecord) {
    setEditRecord({ ...record })
    setEditErrors({})
    setShowEditModal(true)
  }

  function updateEdit(field: string, value: any) {
    if (!editRecord) return
    if (field === "fineType") {
      setEditRecord({ ...editRecord, fineType: value, fineValue: undefined, perDay: false, fineRows: undefined })
    } else {
      setEditRecord({ ...editRecord, [field]: value })
    }
  }

  async function handleEditSave() {
    if (!editRecord) return
    const errs: Record<string, string> = {}
    if (!editRecord.feesGroup) errs.feesGroup = "Fees group is required"
    if (!editRecord.feesType) errs.feesType = "Fees type is required"
    if (!editRecord.amount || editRecord.amount <= 0) errs.amount = "Valid amount is required"
    setEditErrors(errs)
    if (Object.keys(errs).length) return
    await update(editRecord.id, editRecord)
    setShowEditModal(false)
    setEditRecord(null)
  }

  function openDelete(record: FeesMasterRecord) {
    setDeleteRecord(record)
    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    if (!deleteRecord) return
    await remove(deleteRecord.id)
    setShowDeleteModal(false)
    setDeleteRecord(null)
  }

  async function persistReorder(groupRows: FeesMasterRecord[], reordered: FeesMasterRecord[]) {
    const updates = reordered
      .map((r, i) => ({ id: r.id, sortOrder: i + 1 }))
      .filter((u) => (groupRows.find((r) => r.id === u.id)?.sortOrder ?? 0) !== u.sortOrder)
    if (updates.length === 0) return
    for (const u of updates) await update(u.id, { sortOrder: u.sortOrder })
    await refetch()
  }

  async function moveRecord(record: FeesMasterRecord, dir: -1 | 1) {
    const groupKey = record.feesGroup || "Unassigned"
    const groupRows = currentData.filter((r) => (r.feesGroup || "Unassigned") === groupKey)
    const idx = groupRows.findIndex((r) => r.id === record.id)
    const targetIdx = idx + dir
    if (idx === -1 || targetIdx < 0 || targetIdx >= groupRows.length) return

    const reordered = [...groupRows]
    const [moved] = reordered.splice(idx, 1)
    reordered.splice(targetIdx, 0, moved)

    try {
      await persistReorder(groupRows, reordered)
    } catch (e: any) {
      notify.error(e.message || "Failed to reorder")
    }
  }

  function handleDragStart(e: React.DragEvent, record: FeesMasterRecord) {
    setDragItem({ group: record.feesGroup || "Unassigned", id: record.id })
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(record.id))
  }

  function handleDragOver(e: React.DragEvent, record: FeesMasterRecord) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverId(record.id)
  }

  async function handleDrop(e: React.DragEvent, target: FeesMasterRecord) {
    e.preventDefault()
    const source = dragItem
    setDragItem(null)
    setDragOverId(null)
    if (!source) return

    const groupRows = currentData.filter((r) => (r.feesGroup || "Unassigned") === source.group)
    const fromIdx = groupRows.findIndex((r) => r.id === source.id)
    const toIdx = groupRows.findIndex((r) => r.id === target.id)
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return

    const reordered = [...groupRows]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)

    try {
      await persistReorder(groupRows, reordered)
    } catch (err: any) {
      notify.error(err.message || "Failed to reorder")
    }
  }

  function toggleCollapse(name: string) {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  function openBulkEdit(group: { name: string; rows: FeesMasterRecord[] }) {
    setBulkGroupName(group.name)
    setBulkRows(group.rows.map((r) => ({ ...r })))
    setBulkErrors({})
    setShowBulkModal(true)
  }

  function updateBulkRow(id: number, field: string, value: any) {
    setBulkRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        if (field === "fineType") {
          const next: FeesMasterRecord = { ...r, fineType: value }
          if (value === "None") {
            next.fineValue = undefined
            next.perDay = false
            next.fineRows = undefined
          }
          return next
        }
        return { ...r, [field]: value }
      })
    )
  }

  async function saveBulkEdit() {
    const errs: Record<string, string> = {}
    for (const r of bulkRows) {
      if (!r.feesType) errs[`${r.id}-feesType`] = "Fees type is required"
      if (!r.amount || r.amount <= 0) errs[`${r.id}-amount`] = "Valid amount is required"
    }
    setBulkErrors(errs)
    if (Object.keys(errs).length) return
    try {
      await Promise.all(bulkRows.map((r) => update(r.id, r)))
      setShowBulkModal(false)
      setBulkRows([])
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  function addFineRow() {
    setFineRows((prev) => [...prev, { id: nextFineRowId(), overdueDays: 0, fineAmount: 0 }])
  }

  function removeFineRow(id: string) {
    setFineRows((prev) => prev.filter((r) => r.id !== id))
  }

  function updateFineRow(id: string, field: keyof FineRow, value: number) {
    setFineRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const filtered = useMemo(() => {
    if (!keyword.trim()) return currentData
    const kw = keyword.toLowerCase()
    return currentData.filter(
      (r) =>
        r.feesGroup.toLowerCase().includes(kw) ||
        r.feesType.toLowerCase().includes(kw) ||
        (r.class || "").toLowerCase().includes(kw) ||
        String(r.amount).includes(kw) ||
        (r.dueDate || "").includes(kw)
    )
  }, [currentData, keyword])

  const grouped = useMemo(() => {
    const map = new Map<string, FeesMasterRecord[]>()
    for (const r of filtered) {
      const key = r.feesGroup || "Unassigned"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    return Array.from(map.entries()).map(([name, rows]) => ({ name, rows }))
  }, [filtered])

  const totalPages = Math.max(1, Math.ceil(grouped.length / recordsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage
    return grouped.slice(start, start + recordsPerPage)
  }, [grouped, currentPage, recordsPerPage])

  function formatCurrency(val: number) {
    return symbol + (Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return ""
    const [y, m, d] = dateStr.split("-")
    return `${m}/${d}/${y}`
  }

  function fineLabel(record: FeesMasterRecord) {
    if (record.fineType === "None") return "None"
    if (record.fineType === "Percentage") return `Percentage (${record.fineValue}%)`
    if (record.fineType === "Fix Amount") return `Fix (${symbol}${record.fineValue})`
    return "Cumulative"
  }

  const exportCSV = () => {
    const headers = "FeesGroup,FeesType,Class,Amount,DueDate,FineType"
    const rows = currentData.map(
      (r) =>
        `"${r.feesGroup}","${r.feesType}","${r.class || ""}","${r.amount}","${r.dueDate || ""}","${r.fineType}"`
    )
    const blob = new Blob(["\uFEFF" + headers + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "Fees_Master.csv"
    a.click()
  }

  const exportExcel = () => {
    const rows = currentData
      .map(
        (r) =>
          `<tr><td>${r.feesGroup}</td><td>${r.feesType}</td><td>${r.class || ""}</td><td>${r.amount}</td><td>${r.dueDate || ""}</td><td>${r.fineType}</td></tr>`
      )
      .join("")
    const blob = new Blob(
      [
        `<html><meta charset="utf-8"><body><table><tr><th>Fees Group</th><th>Fees Type</th><th>Class</th><th>Amount</th><th>Due Date</th><th>Fine Type</th></tr>${rows}</table></body></html>`,
      ],
      { type: "application/vnd.ms-excel" }
    )
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "Fees_Master.xls"
    a.click()
  }

  const printTable = () => {
    const rows = currentData
      .map(
        (r) =>
          `<tr><td>${r.feesGroup}</td><td>${r.feesType}</td><td>${r.class || ""}</td><td>${symbol}${r.amount.toLocaleString()}</td><td>${formatDate(r.dueDate)}</td><td>${fineLabel(r)}</td></tr>`
      )
      .join("")
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(
        `<html><head><title>Fees Master</title><style>body{font-family:Arial;font-size:12px;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#f5f5f5}</style></head><body><h2>Fees Master</h2><table><tr><th>Fees Group</th><th>Fees Type</th><th>Class</th><th>Amount</th><th>Due Date</th><th>Fine Type</th></tr>${rows}</table><p style="color:#999;font-size:11px;margin-top:10px">Generated on ${today()}</p></body></html>`
      )
      win.document.close()
      win.print()
    }
  }

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split("\n").filter((l) => l.trim())
    if (lines.length < 2) {
      notify.error("CSV must have header + data rows")
      return
    }
    const parsed = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim())
      if (cols[0]) {
        parsed.push({
          feesGroup: cols[0],
          feesType: cols[1] || "",
          class: cols[2] || "",
          amount: parseFloat(cols[3]) || 0,
          dueDate: cols[4] || "",
          fineType: cols[5] || "None",
        })
      }
    }
    if (parsed.length === 0) {
      notify.error("No valid records")
      return
    }
    try {
      const res = await fetch("/api/fees/fees-master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Import failed")
      notify.success(`Imported ${parsed.length} records`)
    } catch (err: any) {
      notify.error(err.message)
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  const paginationPages = useMemo(() => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }
    pages.push(1)
    if (currentPage > 3) pages.push("...")
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push("...")
    pages.push(totalPages)
    return pages
  }, [totalPages, currentPage])

  function FormFields({
    symbol,
    group,
    type,
    cls,
    date,
    amt,
    fType,
    fValue,
    pDay,
    fRows,
    onGroupChange,
    onTypeChange,
    onClassChange,
    onDateChange,
    onAmtChange,
    onFineTypeChange,
    onFineValueChange,
    onPerDayChange,
    onFineRowsChange,
    fieldErrors,
  }: {
    symbol: string
    group: string
    type: string
    cls: string
    date: string
    amt: string
    fType: "None" | "Percentage" | "Fix Amount" | "Cumulative"
    fValue: string
    pDay: boolean
    fRows: FineRow[]
    onGroupChange: (v: string) => void
    onTypeChange: (v: string) => void
    onClassChange: (v: string) => void
    onDateChange: (v: string) => void
    onAmtChange: (v: string) => void
    onFineTypeChange: (v: "None" | "Percentage" | "Fix Amount" | "Cumulative") => void
    onFineValueChange: (v: string) => void
    onPerDayChange: (v: boolean) => void
    onFineRowsChange: (v: FineRow[]) => void
    fieldErrors?: Record<string, string>
  }) {
    const errs = fieldErrors || {}
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Class <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            value={cls}
            onChange={(e) => onClassChange(e.target.value)}
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">Select Class</option>
            {classList.map((c: any) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Fees Group <span className="text-red-400">*</span>
          </label>
          <select
            value={group}
            onChange={(e) => onGroupChange(e.target.value)}
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">Select Fees Group</option>
            {groupList.map((g: any) => (
              <option key={g.id} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>
          {errs.feesGroup && <p className="text-red-400 text-xs mt-0.5">{errs.feesGroup}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Fees Type <span className="text-red-400">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">Select Fees Type</option>
            {typeList.map((t: any) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          {errs.feesType && <p className="text-red-400 text-xs mt-0.5">{errs.feesType}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Due Date <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Amount <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            placeholder="Enter amount"
            value={amt}
            onChange={(e) => onAmtChange(e.target.value)}
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
          />
          {errs.amount && <p className="text-red-400 text-xs mt-0.5">{errs.amount}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Fine Type</label>
          <div className="flex flex-wrap gap-4">
            {(["None", "Percentage", "Fix Amount", "Cumulative"] as const).map((ft) => (
              <label key={ft} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="fineType"
                  checked={fType === ft}
                  onChange={() => onFineTypeChange(ft)}
                  className="accent-[var(--primary)]"
                />
                {ft}
              </label>
            ))}
          </div>
        </div>
        {(fType === "Percentage" || fType === "Fix Amount") && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {fType === "Percentage" ? "Percentage (%)" : `Fix Amount (${symbol})`}
            </label>
            <input
              type="number"
              placeholder={fType === "Percentage" ? "Enter percentage" : "Enter fix amount"}
              value={fValue}
              onChange={(e) => onFineValueChange(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
        )}
        {fType === "Cumulative" && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="perDay"
                checked={pDay}
                onChange={(e) => onPerDayChange(e.target.checked)}
                className="accent-[var(--primary)]"
              />
              <label htmlFor="perDay" className="text-xs font-medium text-gray-600 cursor-pointer">
                Per Day
              </label>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Overdue Days</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Fine Amount</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {fRows.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-gray-400">
                        No fine rows
                      </td>
                    </tr>
                  )}
                  {fRows.map((row) => (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          value={row.overdueDays}
                          onChange={(e) => {
                            const updated = fRows.map((r) =>
                              r.id === row.id ? { ...r, overdueDays: parseInt(e.target.value) || 0 } : r
                            )
                            onFineRowsChange(updated)
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-[var(--primary)]"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          value={row.fineAmount}
                          onChange={(e) => {
                            const updated = fRows.map((r) =>
                              r.id === row.id ? { ...r, fineAmount: parseFloat(e.target.value) || 0 } : r
                            )
                            onFineRowsChange(updated)
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-[var(--primary)]"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <button
                          onClick={() => onFineRowsChange(fRows.filter((r) => r.id !== row.id))}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => {
                const newRow: FineRow = { id: nextFineRowId(), overdueDays: 0, fineAmount: 0 }
                onFineRowsChange([...fRows, newRow])
              }}
              className="mt-2 flex items-center gap-1.5 text-xs text-[var(--primary)] hover:text-[var(--secondary)] font-medium"
            >
              <Plus size={14} /> Add Fine Row
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-white">Fees Master</h2>
          <p className="text-xs text-white/80 mt-0.5">Fees Collection / Fees Master</p>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search..."
            className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <button
                onClick={exportCSV}
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-t-lg"
              >
                CSV
              </button>
              <button
                onClick={exportExcel}
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
              >
                Excel
              </button>
              <button
                onClick={printTable}
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-b-lg"
              >
                PDF
              </button>
            </div>
          </div>
          <button
            onClick={printTable}
            className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={importCSV} className="hidden" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Add Fees Master</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={openApplyFine}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--primary)] border border-[var(--primary)]/30 rounded-lg hover:bg-[var(--primary-light)] transition-colors"
                  title="Apply a fine to all fee master rows of a fees type"
                >
                  <Percent className="h-3.5 w-3.5" />
                  Apply Fine
                </button>
                <button
                  onClick={openAddMultiple}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--primary)] border border-[var(--primary)]/30 rounded-lg hover:bg-[var(--primary-light)] transition-colors"
                  title="Add multiple fees at once"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Multiple
                </button>
              </div>
            </div>
            <div className="p-5">
              {FormFields({
                symbol,
                group: feesGroup,
                type: feesType,
                cls: classVal,
                date: dueDate,
                amt: amount,
                fType: fineType,
                fValue: fineValue,
                pDay: perDay,
                fRows: fineRows,
                onGroupChange: setFeesGroup,
                onTypeChange: setFeesType,
                onClassChange: setClassVal,
                onDateChange: setDueDate,
                onAmtChange: setAmount,
                onFineTypeChange: setFineType,
                onFineValueChange: setFineValue,
                onPerDayChange: setPerDay,
                onFineRowsChange: setFineRows,
                fieldErrors: errors,
              })}
              <button
                onClick={handleAdd}
                className="mt-5 flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-5 py-2.5 rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Fees Master List</h3>
            </div>
            <div className="p-4 space-y-4">
              {paginated.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No fees master records found</div>
              ) : (
                paginated.map((group) => {
                  const groupTotal = group.rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
                  return (
                    <div key={group.name} className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary)]/5 border-b border-gray-200 cursor-pointer" onClick={() => toggleCollapse(group.name)}>
                        <div className="flex items-center gap-3 min-w-0">
                          <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${expanded[group.name] ? "" : "-rotate-90"}`} />
                          <span className="text-sm font-bold text-gray-800 truncate">{group.name}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-gray-600 border border-gray-200">{group.rows.length} fees</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-sm font-bold text-[var(--primary)] whitespace-nowrap">
                            {formatCurrency(groupTotal)}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(
                                `/admin/fees-collection/fees-master/assign-group?masters=${group.rows.map((r) => r.id).join(",")}`
                              )
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm shadow-green-200"
                            title="Assign all fees in this group to students"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Assign Fees
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openBulkEdit(group) }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit All
                          </button>
                        </div>
                      </div>
                      {expanded[group.name] && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="text-left px-2 py-2 font-semibold text-gray-500 text-[11px] uppercase w-8"></th>
                              <th className="text-left px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Fees Type</th>
                              <th className="text-left px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Class</th>
                              <th className="text-left px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Amount</th>
                              <th className="text-left px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Due Date</th>
                              <th className="text-left px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Fine Type</th>
                              <th className="text-right px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.rows.map((record, idx) => (
                              <tr
                                key={record.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, record)}
                                onDragOver={(e) => handleDragOver(e, record)}
                                onDragLeave={() => setDragOverId((prev) => (prev === record.id ? null : prev))}
                                onDrop={(e) => handleDrop(e, record)}
                                onDragEnd={() => { setDragItem(null); setDragOverId(null) }}
                                className={`border-b border-gray-50 transition-colors cursor-grab active:cursor-grabbing ${
                                  dragOverId === record.id
                                    ? "bg-[var(--primary-light)] ring-1 ring-inset ring-[var(--primary)]/40"
                                    : dragItem?.id === record.id
                                      ? "opacity-60 bg-gray-100"
                                      : idx % 2 === 0
                                        ? "bg-white"
                                        : "bg-gray-50/30"
                                } hover:bg-[var(--primary-light)]`}
                              >
                                <td className="px-2 py-2.5">
                                  <GripVertical className="h-4 w-4 text-gray-300" />
                                </td>
                                <td className="px-4 py-2.5 font-medium text-gray-800">{record.feesType}</td>
                                <td className="px-4 py-2.5 text-gray-500 text-xs">{record.class || <span className="text-gray-300">-</span>}</td>
                                <td className="px-4 py-2.5 text-gray-700">{formatCurrency(record.amount)}</td>
                                <td className="px-4 py-2.5 text-gray-500 text-xs">{formatDate(record.dueDate)}</td>
                                <td className="px-4 py-2.5 text-xs">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                    {fineLabel(record)}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-0.5">
                                    <button
                                      onClick={() => moveRecord(record, -1)}
                                      disabled={idx === 0}
                                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Move up"
                                    >
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => moveRecord(record, 1)}
                                      disabled={idx === group.rows.length - 1}
                                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Move down"
                                    >
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => openEdit(record)}
                                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                                      title="Edit"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => openDelete(record)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span>{grouped.length} groups · {filtered.length} records</span>
                <select
                  value={recordsPerPage}
                  onChange={(e) => {
                    setRecordsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  {paginationPages.map((p, i) =>
                    typeof p === "string" ? (
                      <span key={`e${i}`} className="px-1 text-gray-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[28px] h-7 text-xs font-medium rounded-lg ${
                          currentPage === p
                            ? "bg-[var(--primary)] text-white"
                            : "text-gray-600 hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEditModal && editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Edit Fees Master</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              {FormFields({
                symbol,
                group: editRecord.feesGroup,
                type: editRecord.feesType,
                cls: editRecord.class || "",
                date: editRecord.dueDate,
                amt: String(editRecord.amount),
                fType: editRecord.fineType,
                fValue: editRecord.fineValue !== undefined ? String(editRecord.fineValue) : "",
                pDay: editRecord.perDay || false,
                fRows: editRecord.fineRows && editRecord.fineRows.length > 0 ? editRecord.fineRows : [{ id: nextFineRowId(), overdueDays: 0, fineAmount: 0 }],
                onGroupChange: (v) => updateEdit("feesGroup", v),
                onTypeChange: (v) => updateEdit("feesType", v),
                onClassChange: (v) => updateEdit("class", v),
                onDateChange: (v) => updateEdit("dueDate", v),
                onAmtChange: (v) => updateEdit("amount", parseFloat(v) || 0),
                onFineTypeChange: (v) => updateEdit("fineType", v),
                onFineValueChange: (v) => updateEdit("fineValue", parseFloat(v) || 0),
                onPerDayChange: (v) => updateEdit("perDay", v),
                onFineRowsChange: (v) => updateEdit("fineRows", v),
                fieldErrors: editErrors,
              })}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] shadow-sm shadow-indigo-200"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deleteRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-sm text-gray-600">Are you sure you want to delete this fees master record?</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                {deleteRecord.feesGroup} / {deleteRecord.feesType}
              </p>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm shadow-red-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMultipleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddMultipleModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl z-10 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Add Multiple Fees</h3>
                <p className="text-xs text-gray-500 mt-0.5">{addMultipleRows.length} fee(s) · add all at once</p>
              </div>
              <button
                onClick={() => setShowAddMultipleModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              {addMultipleRows.map((row, i) => (
                <div key={row.key} className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Fee {i + 1}</span>
                    <button
                      onClick={() => removeAddMultipleRow(row.key)}
                      disabled={addMultipleRows.length === 1}
                      className="text-red-500 hover:text-red-700 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fees Group <span className="text-red-400">*</span></label>
                      <select
                        value={row.feesGroup}
                        onChange={(e) => updateAddMultipleRow(row.key, "feesGroup", e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value="">Select Fees Group</option>
                        {groupList.map((g: any) => (
                          <option key={g.id} value={g.name}>{g.name}</option>
                        ))}
                      </select>
                      {addMultipleErrors[`${row.key}-feesGroup`] && <p className="text-red-400 text-xs mt-0.5">{addMultipleErrors[`${row.key}-feesGroup`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fees Type <span className="text-red-400">*</span></label>
                      <select
                        value={row.feesType}
                        onChange={(e) => updateAddMultipleRow(row.key, "feesType", e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value="">Select Fees Type</option>
                        {typeList.map((t: any) => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                      {addMultipleErrors[`${row.key}-feesType`] && <p className="text-red-400 text-xs mt-0.5">{addMultipleErrors[`${row.key}-feesType`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Class <span className="text-gray-400 font-normal">(optional)</span></label>
                      <select
                        value={row.class}
                        onChange={(e) => updateAddMultipleRow(row.key, "class", e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value="">Select Class</option>
                        {classList.map((c: any) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Due Date <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input
                        type="date"
                        value={row.dueDate}
                        onChange={(e) => updateAddMultipleRow(row.key, "dueDate", e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
                      />
                      {addMultipleErrors[`${row.key}-dueDate`] && <p className="text-red-400 text-xs mt-0.5">{addMultipleErrors[`${row.key}-dueDate`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Amount <span className="text-red-400">*</span></label>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={row.amount}
                        onChange={(e) => updateAddMultipleRow(row.key, "amount", e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
                      />
                      {addMultipleErrors[`${row.key}-amount`] && <p className="text-red-400 text-xs mt-0.5">{addMultipleErrors[`${row.key}-amount`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fine Type</label>
                      <select
                        value={row.fineType}
                        onChange={(e) => updateAddMultipleRow(row.key, "fineType", e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value="None">None</option>
                        <option value="Percentage">Percentage</option>
                        <option value="Fix Amount">Fix Amount</option>
                        <option value="Cumulative">Cumulative</option>
                      </select>
                    </div>
                    {(row.fineType === "Percentage" || row.fineType === "Fix Amount") && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {row.fineType === "Percentage" ? "Percentage (%)" : `Fix Amount (${symbol})`}
                        </label>
                        <input
                          type="number"
                          placeholder={row.fineType === "Percentage" ? "Enter percentage" : "Enter fix amount"}
                          value={row.fineValue}
                          onChange={(e) => updateAddMultipleRow(row.key, "fineValue", e.target.value)}
                          className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
                        />
                      </div>
                    )}
                  </div>
                  {row.fineType === "Cumulative" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={row.perDay}
                          onChange={(e) => updateAddMultipleRow(row.key, "perDay", e.target.checked)}
                          className="accent-[var(--primary)]"
                        />
                        <label className="text-xs font-medium text-gray-600 cursor-pointer">Per Day</label>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-left px-3 py-2 font-medium text-gray-600">Overdue Days</th>
                              <th className="text-left px-3 py-2 font-medium text-gray-600">Fine Amount</th>
                              <th className="w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.fineRows.length === 0 && (
                              <tr>
                                <td colSpan={3} className="text-center py-4 text-gray-400">No fine rows</td>
                              </tr>
                            )}
                            {row.fineRows.map((fr) => (
                              <tr key={fr.id} className="border-t border-gray-100">
                                <td className="px-1 py-1">
                                  <input
                                    type="number"
                                    value={fr.overdueDays}
                                    onChange={(e) => {
                                      const updated = row.fineRows.map((x) =>
                                        x.id === fr.id ? { ...x, overdueDays: parseInt(e.target.value) || 0 } : x
                                      )
                                      updateAddMultipleFineRows(row.key, updated)
                                    }}
                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-[var(--primary)]"
                                  />
                                </td>
                                <td className="px-1 py-1">
                                  <input
                                    type="number"
                                    value={fr.fineAmount}
                                    onChange={(e) => {
                                      const updated = row.fineRows.map((x) =>
                                        x.id === fr.id ? { ...x, fineAmount: parseFloat(e.target.value) || 0 } : x
                                      )
                                      updateAddMultipleFineRows(row.key, updated)
                                    }}
                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-[var(--primary)]"
                                  />
                                </td>
                                <td className="px-1 py-1">
                                  <button
                                    onClick={() => updateAddMultipleFineRows(row.key, row.fineRows.filter((x) => x.id !== fr.id))}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button
                        onClick={() =>
                          updateAddMultipleFineRows(row.key, [...row.fineRows, { id: nextFineRowId(), overdueDays: 0, fineAmount: 0 }])
                        }
                        className="flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--secondary)] font-medium"
                      >
                        <Plus size={14} /> Add Fine Row
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={addMultipleRow}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[var(--primary)] border border-dashed border-[var(--primary)]/40 rounded-lg hover:bg-[var(--primary-light)] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Row
              </button>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowAddMultipleModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveAddMultiple}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] shadow-sm shadow-indigo-200"
              >
                <Save className="h-3.5 w-3.5" />
                Save All
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBulkModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl z-10 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Edit Fees Master</h3>
                <p className="text-xs text-gray-500 mt-0.5">{bulkGroupName} · {bulkRows.length} fees</p>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              {bulkRows.map((row) => (
                <div key={row.id} className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">{row.feesType}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fees Type <span className="text-red-400">*</span></label>
                      <select
                        value={row.feesType}
                        onChange={(e) => updateBulkRow(row.id, "feesType", e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        {typeList.map((t: any) => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                      {bulkErrors[`${row.id}-feesType`] && <p className="text-red-400 text-xs mt-0.5">{bulkErrors[`${row.id}-feesType`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                      <select
                        value={row.class || ""}
                        onChange={(e) => updateBulkRow(row.id, "class", e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value="">Select Class</option>
                        {classList.map((c: any) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Amount <span className="text-red-400">*</span></label>
                      <input
                        type="number"
                        value={row.amount}
                        onChange={(e) => updateBulkRow(row.id, "amount", parseFloat(e.target.value) || 0)}
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
                      />
                      {bulkErrors[`${row.id}-amount`] && <p className="text-red-400 text-xs mt-0.5">{bulkErrors[`${row.id}-amount`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Due Date <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input
                        type="date"
                        value={row.dueDate}
                        onChange={(e) => updateBulkRow(row.id, "dueDate", e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
                      />
                      {bulkErrors[`${row.id}-dueDate`] && <p className="text-red-400 text-xs mt-0.5">{bulkErrors[`${row.id}-dueDate`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fine Type</label>
                      <select
                        value={row.fineType}
                        onChange={(e) => updateBulkRow(row.id, "fineType", e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value="None">None</option>
                        <option value="Percentage">Percentage</option>
                        <option value="Fix Amount">Fix Amount</option>
                        <option value="Cumulative">Cumulative</option>
                      </select>
                    </div>
                    {(row.fineType === "Percentage" || row.fineType === "Fix Amount") && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {row.fineType === "Percentage" ? "Percentage (%)" : `Fix Amount (${symbol})`}
                        </label>
                        <input
                          type="number"
                          value={row.fineValue ?? ""}
                          onChange={(e) => updateBulkRow(row.id, "fineValue", parseFloat(e.target.value) || 0)}
                          className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveBulkEdit}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] shadow-sm shadow-indigo-200"
              >
                <Save className="h-3.5 w-3.5" />
                Save All
              </button>
            </div>
          </div>
        </div>
      )}

      {showApplyFineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowApplyFineModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Apply Fine</h3>
                <p className="text-xs text-gray-500 mt-0.5">Apply this due date and fine to every fee using the fees type</p>
              </div>
              <button
                onClick={() => setShowApplyFineModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fees Type <span className="text-red-400">*</span></label>
                <select
                  value={applyFineTypeId}
                  onChange={(e) => setApplyFineTypeId(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white text-gray-800"
                >
                  <option value="">Select Fees Type</option>
                  {typeList.map((t: any) => (
                    <option key={t.id} value={String(t.id)}>{t.name}</option>
                  ))}
                </select>
                {applyFineErrors.feesType && <p className="text-red-400 text-xs mt-0.5">{applyFineErrors.feesType}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Due Day of Month <span className="text-red-400">*</span></label>
                <select
                  value={applyDueDay}
                  onChange={(e) => setApplyDueDay(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white text-gray-800"
                >
                  <option value="">Select day</option>
                  {Array.from({ length: 24 }, (_, i) => i + 5).map((d) => (
                    <option key={d} value={String(d)}>{d}th of every month</option>
                  ))}
                </select>
                {applyFineErrors.dueDay && <p className="text-red-400 text-xs mt-0.5">{applyFineErrors.dueDay}</p>}
                <p className="text-[11px] text-gray-500 mt-0.5">Fee will be due on this day every month (e.g. 8th of every month). Late fine starts from the next day.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Fine Type <span className="text-red-400">*</span></label>
                <div className="flex flex-wrap gap-4">
                  {(["None", "Percentage", "Fix Amount", "Cumulative"] as const).map((ft) => (
                    <label key={ft} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="applyFineType"
                        checked={applyFineType === ft}
                        onChange={() => updateApplyFineType(ft)}
                        className="accent-[var(--primary)]"
                      />
                      {ft}
                    </label>
                  ))}
                </div>
              </div>
              {(applyFineType === "Percentage" || applyFineType === "Fix Amount") && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {applyFineType === "Percentage" ? "Percentage (%)" : `Fix Amount (${symbol})`} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder={applyFineType === "Percentage" ? "Enter percentage" : "Enter fix amount"}
                    value={applyFineValue}
                    onChange={(e) => setApplyFineValue(e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white text-gray-800"
                  />
                  {applyFineErrors.fineValue && <p className="text-red-400 text-xs mt-0.5">{applyFineErrors.fineValue}</p>}
                </div>
              )}
              {applyFineType === "Cumulative" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={applyPerDay}
                      onChange={(e) => setApplyPerDay(e.target.checked)}
                      className="accent-[var(--primary)]"
                    />
                    <label className="text-xs font-medium text-gray-600 cursor-pointer">Per Day</label>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Overdue Days</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Fine Amount</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {applyFineRows.length === 0 && (
                          <tr>
                            <td colSpan={3} className="text-center py-4 text-gray-400">No fine rows</td>
                          </tr>
                        )}
                        {applyFineRows.map((fr) => (
                          <tr key={fr.id} className="border-t border-gray-100">
                            <td className="px-1 py-1">
                              <input
                                type="number"
                                value={fr.overdueDays}
                                onChange={(e) => updateApplyFineRow(fr.id, "overdueDays", parseInt(e.target.value) || 0)}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-[var(--primary)] bg-white text-gray-800"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="number"
                                value={fr.fineAmount}
                                onChange={(e) => updateApplyFineRow(fr.id, "fineAmount", parseFloat(e.target.value) || 0)}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-[var(--primary)] bg-white text-gray-800"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <button
                                onClick={() => setApplyFineRows((prev) => prev.filter((x) => x.id !== fr.id))}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={addApplyFineRow}
                    className="flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--secondary)] font-medium"
                  >
                    <Plus size={14} /> Add Fine Row
                  </button>
                </div>
              )}
              <div className="rounded-lg bg-[var(--primary-light)] px-3 py-2 text-xs text-gray-700">
                {applyFineMatches().length > 0
                  ? `Will apply to ${applyFineMatches().length} fee master row(s) using "${applyFineName()}"`
                  : "Select a fees type to see how many rows will be affected"}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowApplyFineModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmApplyFine}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] shadow-sm shadow-indigo-200"
              >
                <Save className="h-3.5 w-3.5" />
                Apply Fine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
