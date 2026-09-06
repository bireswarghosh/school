"use client"

import { useEffect, useMemo, useState } from "react"
import { UserCheck, Search, ShoppingCart, Plus, Minus, Trash2, Ticket, Save, Package, BookOpen, X, Loader2, Printer, FileDown, MessageCircle, CheckCircle2, Pencil } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"
import { useAuth } from "@/lib/auth-context"
import { useSchoolInfo } from "@/lib/use-school-info"
import { toast as notify } from "@/lib/toast"

type Product = { id?: number; name: string; sellingPrice?: number | string }
type Book = { id?: number; title: string; publisher?: string; sellingPrice?: number | string; classId?: number | null }
type Class = { id?: number; name: string }
type BookSelection = { bookId: number; name: string; price: number; qty: number }
type Coupon = { id?: number; code: string; discountType?: string; discountValue?: number | string; minOrderAmount?: number | string; status?: string }
type Sale = {
  id?: number
  saleNo?: string
  studentId?: number | null
  studentName?: string
  productId?: number | null
  bookId?: number | null
  quantity?: number
  unitPrice?: number | string
  subtotal?: number | string
  discountAmount?: number | string
  totalAmount?: number | string
  saleDate?: string
  paymentStatus?: string
}
type CartItem = {
  key: string
  type: "product" | "book"
  productId?: number
  bookId?: number
  name: string
  quantity: number
  unitPrice: number
}
type StudentHit = {
  id: number
  name: string
  admissionNo?: string
  rollNo?: string
  class?: string
  section?: string
  phone?: string
  mobile?: string
}
type ReceiptItem = { name: string; type: "product" | "book"; quantity: number; unitPrice: number; subtotal: number; discount: number; total: number }
type Receipt = {
  saleNo: string
  saleDate: string
  items: ReceiptItem[]
  subtotal: number
  discount: number
  total: number
  paymentStatus: string
  student: { id: number; name: string; className?: string; sectionName?: string; phone?: string } | null
}

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"

const round2 = (n: number) => Math.round(n * 100) / 100

export default function StudentSalesPage() {
  const { data: products } = useApi<Product>("/api/students-inventory/product")
  const { data: books } = useApi<Book>("/api/students-inventory/book")
  const { data: classes } = useApi<Class>("/api/classes")
  const { data: coupons } = useApi<Coupon>("/api/students-inventory/coupon")
  const { data: sales, update: updateSale, remove: removeSale, refetch } = useApi<Sale>("/api/students-inventory/sale")
  const { symbol } = useCurrency()

  const money = (v: number) => `${symbol}${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const activeCoupons = useMemo(() => coupons.filter((c) => c.status === "Active"), [coupons])

  const [student, setStudent] = useState<{ id: number; name: string; className?: string; sectionName?: string; phone?: string } | null>(null)
  const [findState, setFindState] = useState<"idle" | "loading" | "found" | "notfound">("idle")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<StudentHit[]>([])
  const [searching, setSearching] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const { school } = useAuth()
  const { info: schoolInfo } = useSchoolInfo()
  const [catalogTab, setCatalogTab] = useState<"products" | "books">("products")
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [couponId, setCouponId] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("Paid")
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [editSale, setEditSale] = useState<Sale | null>(null)
  const [saleForm, setSaleForm] = useState({ quantity: 1, unitPrice: 0, discountAmount: 0, saleDate: "", paymentStatus: "Paid" })
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleteSaleTarget, setDeleteSaleTarget] = useState<Sale | null>(null)
  const [deletingSale, setDeletingSale] = useState(false)

  const [bookClass, setBookClass] = useState("")
  const [bookModalOpen, setBookModalOpen] = useState(false)
  const [bookSelection, setBookSelection] = useState<Record<number, BookSelection>>({})

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? products.filter((p) => (p.name || "").toLowerCase().includes(q)) : products
  }, [products, search])

  const bookClassBooks = useMemo(
    () => (bookClass ? books.filter((b) => String(b.classId ?? "") === String(bookClass)).sort((a, b) => (a.id ?? 0) - (b.id ?? 0)) : []),
    [books, bookClass]
  )
  const bookClassName = classes.find((c) => String(c.id) === String(bookClass))?.name || ""
  const bookSelectionList = useMemo(() => Object.values(bookSelection), [bookSelection])
  const bookSelectionCount = bookSelectionList.reduce((s, i) => s + i.qty, 0)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pos-cart-preselect")
      if (!raw) return
      sessionStorage.removeItem("pos-cart-preselect")
      const data = JSON.parse(raw)
      if (data?.student?.id) {
        setStudent({ id: data.student.id, name: data.student.name, className: data.student.className, sectionName: data.student.sectionName })
        setFindState("found")
        if (data.student.name) setSearchQuery(data.student.name)
      }
      if (Array.isArray(data?.items) && data.items.length) {
        const items: CartItem[] = data.items.map((it: any, i: number) => {
          const type = it.type === "product" ? "product" : "book"
          const id = type === "product" ? it.productId : it.bookId
          return {
            key: `${type}-${id}-${i}`,
            type,
            productId: type === "product" ? Number(id) : undefined,
            bookId: type === "book" ? Number(id) : undefined,
            name: it.name || "Item",
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
          }
        })
        setCart(items)
        notify.info(`${items.length} item(s) added to cart`)
      }
    } catch {
      // ignore invalid preselect payload
    }
  }, [])

  const searchStudents = async (q?: string) => {
    const query = (q ?? searchQuery).trim()
    if (query.length < 2) {
      setSearchResults([])
      setSearchOpen(false)
      return
    }
    setSearching(true)
    setFindState("idle")
    try {
      const res = await fetch(`/api/students?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      const list: StudentHit[] = Array.isArray(data) ? data : []
      setSearchResults(list)
      setSearchOpen(true)
    } catch {
      setSearchResults([])
      setSearchOpen(false)
    } finally {
      setSearching(false)
    }
  }

  const handleSearchInput = (v: string) => {
    setSearchQuery(v)
    if (student && v.trim() !== student.name) {
      setStudent(null)
      setFindState("idle")
      setSearchOpen(false)
    }
  }

  const selectStudent = (r: StudentHit) => {
    setStudent({ id: r.id, name: r.name, className: r.class, sectionName: r.section, phone: r.phone || r.mobile || undefined })
    setFindState("found")
    setSearchQuery(r.name)
    setSearchResults([])
    setSearchOpen(false)
    setFormErrors((prev) => ({ ...prev, student: "" }))
  }

  useEffect(() => {
    const q = searchQuery.trim()
    const isSelected = !!student && q === student.name
    const t = setTimeout(() => {
      if (q.length < 2 || isSelected) {
        setSearchOpen(false)
        return
      }
      searchStudents(q)
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, student])

  const addToCart = (type: "product" | "book", id: number | undefined, name: string, price: number | string | undefined) => {
    if (!id) return
    setCart((prev) => {
      const key = `${type}-${id}`
      const existing = prev.find((i) => i.key === key)
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { key, type, productId: type === "product" ? id : undefined, bookId: type === "book" ? id : undefined, name, quantity: 1, unitPrice: Number(price) || 0 }]
    })
  }

  const openBookModal = () => {
    if (!bookClass) return
    const all: Record<number, BookSelection> = {}
    bookClassBooks.forEach((b) => {
      if (b.id) all[b.id] = { bookId: b.id, name: b.title || "Book", price: Number(b.sellingPrice) || 0, qty: 1 }
    })
    setBookSelection(all)
    setBookModalOpen(true)
  }

  const toggleModalBook = (book: Book) => {
    const id = book.id
    if (!id) return
    setBookSelection((prev) => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else next[id] = { bookId: id, name: book.title || "Book", price: Number(book.sellingPrice) || 0, qty: 1 }
      return next
    })
  }

  const updateModalQty = (bookId: number, qty: number) => {
    setBookSelection((prev) => (prev[bookId] ? { ...prev, [bookId]: { ...prev[bookId], qty: Math.max(1, Number(qty) || 1) } } : prev))
  }

  const toggleSelectAllBooks = (checked: boolean) => {
    if (!checked) {
      setBookSelection({})
      return
    }
    const all: Record<number, BookSelection> = {}
    bookClassBooks.forEach((b) => {
      if (b.id) all[b.id] = { bookId: b.id, name: b.title || "Book", price: Number(b.sellingPrice) || 0, qty: 1 }
    })
    setBookSelection(all)
  }

  const addBooksToCart = () => {
    const list = bookSelectionList
    if (list.length === 0) return
    setCart((prev) => {
      const next = [...prev]
      for (const it of list) {
        const key = `book-${it.bookId}`
        const idx = next.findIndex((i) => i.key === key)
        if (idx >= 0) {
          next[idx] = { ...next[idx], quantity: next[idx].quantity + it.qty }
        } else {
          next.push({ key, type: "book", bookId: it.bookId, name: it.name, quantity: it.qty, unitPrice: it.price })
        }
      }
      return next
    })
    setBookModalOpen(false)
    setBookSelection({})
    notify.success(`${list.length} book(s) added to cart`)
  }

  const updateQty = (key: string, quantity: number) => {
    setCart((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Number(quantity) || 1) } : i)))
  }

  const updatePrice = (key: string, unitPrice: number) => {
    setCart((prev) => prev.map((i) => (i.key === key ? { ...i, unitPrice: Math.max(0, Number(unitPrice) || 0) } : i)))
  }

  const removeFromCart = (key: string) => {
    setCart((prev) => prev.filter((i) => i.key !== key))
  }

  const subtotalSum = useMemo(() => cart.reduce((s, i) => s + round2(i.quantity * i.unitPrice), 0), [cart])
  const selectedCoupon = activeCoupons.find((c) => String(c.id) === couponId)
  const couponDiscount = useMemo(() => {
    if (!selectedCoupon) return 0
    const val = Number(selectedCoupon.discountValue) || 0
    if (selectedCoupon.discountType === "Percent") return round2((subtotalSum * val) / 100)
    return Math.min(subtotalSum, val)
  }, [selectedCoupon, subtotalSum])
  const total = Math.max(0, round2(subtotalSum - couponDiscount))

  const itemDiscount = (item: CartItem) => {
    if (couponDiscount <= 0 || subtotalSum <= 0) return 0
    return round2((round2(item.quantity * item.unitPrice) / subtotalSum) * couponDiscount)
  }

  const handleCheckout = async () => {
    const errs: Record<string, string> = {}
    if (!student) errs.student = "Find a student first"
    if (cart.length === 0) errs.cart = "Add at least one item to the cart"
    setFormErrors(errs)
    if (Object.keys(errs).length > 0 || !student) return
    setSaving(true)
    try {
      const payload = {
        studentId: student.id,
        studentName: student.name,
        saleDate,
        paymentStatus,
        discountId: selectedCoupon ? Number(selectedCoupon.id) : null,
        items: cart.map((i) => {
          const d = itemDiscount(i)
          const subtotal = round2(i.quantity * i.unitPrice)
          return {
            productId: i.productId ?? null,
            bookId: i.bookId ?? null,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            subtotal,
            discountAmount: d,
            totalAmount: Math.max(0, round2(subtotal - d)),
          }
        }),
      }
      const res = await fetch("/api/students-inventory/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to record sale")
      }
      const created = await res.json()
      const saleNo = Array.isArray(created) ? created[0]?.saleNo : created?.saleNo
      const receiptItems: ReceiptItem[] = cart.map((it) => {
        const sub = round2(it.quantity * it.unitPrice)
        const d = itemDiscount(it)
        return { name: it.name, type: it.type, quantity: it.quantity, unitPrice: it.unitPrice, subtotal: sub, discount: d, total: Math.max(0, round2(sub - d)) }
      })
      setReceipt({
        saleNo: saleNo || `SL-${Date.now()}`,
        saleDate: String(saleDate || new Date().toISOString().slice(0, 10)).slice(0, 10),
        items: receiptItems,
        subtotal: subtotalSum,
        discount: couponDiscount,
        total,
        paymentStatus,
        student: student ? { id: student.id, name: student.name, className: student.className, sectionName: student.sectionName, phone: student.phone } : null,
      })
      setReceiptOpen(true)
      notify.success(`Order placed — ${cart.length} item${cart.length === 1 ? "" : "s"}, total ${money(total)}`)
      setCart([])
      setCouponId("")
      setPaymentStatus("Paid")
      setSaleDate(new Date().toISOString().slice(0, 10))
      setSearchQuery("")
      setStudent(null)
      setFindState("idle")
      await refetch()
    } catch (e: any) {
      setFormErrors({ form: e.message || "Failed to record sale" })
    } finally {
      setSaving(false)
    }
  }

  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

  const buildReceiptHtml = (r: Receipt): string => {
    const fmt = (n: number) => `${symbol}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const sName = esc(schoolInfo.name || school?.name || "Smart School")
    const sTagline = school?.tagline ? esc(school.tagline) : ""
    const sAddress = esc(schoolInfo.address || school?.address || "")
    const sPhone = esc(schoolInfo.phone || school?.phone || "")
    const sEmail = esc(schoolInfo.email || school?.email || "")
    const sLogo = schoolInfo.logoSrc ? esc(schoolInfo.logoSrc) : ""
    const items = r.items
      .map(
        (it) =>
          `<tr><td>${esc(it.name)}<span class="sub">${it.type === "book" ? "Book" : "Product"}${it.discount ? ` · Disc ${fmt(it.discount)}` : ""}</span></td><td class="c">${it.quantity}</td><td class="c">${fmt(it.unitPrice)}</td><td class="r">${fmt(it.total)}</td></tr>`
      )
      .join("")
    const statusColor = r.paymentStatus === "Paid" ? "#059669" : "#dc2626"
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt ${esc(r.saleNo)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 13px; }
  .sheet { max-width: 420px; margin: 0 auto; padding: 30px 24px; }
  .r-head { text-align: center; border-bottom: 2px dashed #d1d5db; padding-bottom: 14px; margin-bottom: 14px; }
  .r-head img { width: 58px; height: 58px; object-fit: contain; margin-bottom: 6px; }
  .r-head h1 { font-size: 18px; color: #111827; }
  .r-head .tag { color: #ff7732; font-size: 11px; margin-top: 2px; }
  .r-head .meta { font-size: 12px; color: #4b5563; margin-top: 8px; line-height: 1.6; }
  .r-head .meta .r-no { font-weight: 700; color: #111827; }
  .status { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; color: ${statusColor}; border: 1px solid ${statusColor}; }
  .cust { font-size: 12px; color: #374151; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th { background: #ff7732; color: #fff; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 8px; }
  td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  td .sub { display: block; font-size: 10px; color: #6b7280; margin-top: 1px; }
  .c { text-align: center; }
  .r { text-align: right; }
  .totals { border-top: 1px solid #9ca3af; padding-top: 8px; }
  .totals .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; }
  .totals .row.grand { font-weight: 700; font-size: 15px; color: #111827; border-top: 1px dashed #d1d5db; margin-top: 4px; padding-top: 6px; }
  .foot { margin-top: 20px; text-align: center; color: #6b7280; font-size: 11px; border-top: 1px dashed #d1d5db; padding-top: 10px; line-height: 1.5; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="r-head">
      ${sLogo ? `<img src="${sLogo}" alt="logo" />` : ""}
      <h1>${sName}</h1>
      ${sTagline ? `<div class="tag">${sTagline}</div>` : ""}
      ${sAddress ? `<div style="font-size:11px;color:#4b5563;margin-top:3px;">${sAddress}</div>` : ""}
      ${sPhone || sEmail ? `<div style="font-size:11px;color:#4b5563;margin-top:2px;">${[sPhone, sEmail].filter(Boolean).join(" | ")}</div>` : ""}
      <div class="meta">
        <span class="r-no">${esc(r.saleNo)}</span> · Date: ${esc(r.saleDate)}<br />
        <span class="status">${esc(r.paymentStatus)}</span>
      </div>
    </div>

    <div class="cust">
      Student: <b>${esc(r.student?.name || "-")}</b>${r.student?.className ? ` (${esc(r.student.className)}${r.student.sectionName ? ` - ${esc(r.student.sectionName)}` : ""})` : ""}
    </div>

    <table>
      <thead><tr><th>Item</th><th class="c">Qty</th><th class="c">Rate</th><th class="r">Amount</th></tr></thead>
      <tbody>${items}</tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${fmt(r.subtotal)}</span></div>
      ${r.discount ? `<div class="row"><span>Discount</span><span>${fmt(r.discount)}</span></div>` : ""}
      <div class="row grand"><span>Grand Total</span><span>${fmt(r.total)}</span></div>
    </div>

    <div class="foot">Thank you for your purchase!<br />This is a computer-generated receipt.</div>
  </div>
</body>
</html>`
  }

  const printReceipt = () => {
    if (!receipt) return
    const frame = document.getElementById("receipt-frame") as HTMLIFrameElement | null
    if (!frame) return
    frame.onload = () => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    }
    frame.srcdoc = buildReceiptHtml(receipt)
  }

  const shareWhatsApp = () => {
    if (!receipt) return
    const sName = school?.name || "Smart School"
    const itemsTxt = receipt.items
      .map((it) => `• ${it.name} (${it.type === "book" ? "Book" : "Product"})\n   Qty ${it.quantity} x ${money(it.unitPrice)} = ${money(it.subtotal)}${it.discount ? ` (Disc ${money(it.discount)})` : ""}`)
      .join("\n")
    const invoiceLink = `${window.location.origin}/api/students-inventory/sale/invoice?no=${encodeURIComponent(receipt.saleNo)}`
    const text =
      `*${sName}*\nOrder Confirmed ✔\nInvoice: ${receipt.saleNo}\nDate: ${receipt.saleDate}\nStudent: ${receipt.student?.name || "-"}${receipt.student?.className ? ` (${receipt.student.className}${receipt.student.sectionName ? ` - ${receipt.student.sectionName}` : ""})` : ""}\n\n${itemsTxt}\n\nSubtotal: ${money(receipt.subtotal)}${receipt.discount ? `\nDiscount: ${money(receipt.discount)}` : ""}\n*Total: ${money(receipt.total)}*\nStatus: ${receipt.paymentStatus}\n\nView PDF receipt: ${invoiceLink}\n\nThank you for your purchase!`
    const phone = receipt.student?.phone
    const digits = phone ? String(phone).replace(/[^\d]/g, "") : ""
    const url = digits.length >= 10 ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, "_blank")
  }

  const productName = (sale: Sale) => {
    if (sale.bookId) return books.find((b) => b.id === sale.bookId)?.title ?? `Book #${sale.bookId}`
    return products.find((p) => p.id === sale.productId)?.name ?? `Product #${sale.productId}`
  }

  const recentSales = sales.slice(0, 15)

  const buildSaleInvoiceHtml = (base: Sale, rows: Sale[]): string => {
    const fmt = (n: number) => `${symbol}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const sName = esc(school?.name || "Smart School")
    const sTagline = school?.tagline ? esc(school.tagline) : ""
    const sAddress = school?.address ? esc(school.address) : ""
    const sPhone = school?.phone ? esc(school.phone) : ""
    const sEmail = school?.email ? esc(school.email) : ""
    const sub = rows.reduce((s, r) => s + (Number(r.subtotal) || 0), 0)
    const disc = rows.reduce((s, r) => s + (Number(r.discountAmount) || 0), 0)
    const total = rows.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0)
    const status = base.paymentStatus || "Unpaid"
    const statusColor = status === "Paid" ? "#059669" : "#dc2626"
    const items = rows
      .map(
        (r, i) =>
          `<tr><td class="c">${i + 1}</td><td>${esc(productName(r))}<span class="sub">${r.bookId ? "Book" : "Product"}</span></td><td class="c">${Number(r.quantity) || 0}</td><td class="r">${fmt(Number(r.unitPrice) || 0)}</td><td class="r">${Number(r.discountAmount) ? fmt(Number(r.discountAmount)) : "-"}</td><td class="r">${fmt(Number(r.totalAmount) || 0)}</td></tr>`
      )
      .join("")
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice ${esc(base.saleNo || "")}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 13px; }
  .sheet { max-width: 820px; margin: 0 auto; padding: 30px 26px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ff7732; padding-bottom: 16px; margin-bottom: 18px; }
  .head h1 { font-size: 20px; color: #111827; }
  .head .tag { color: #ff7732; font-size: 12px; margin-top: 2px; }
  .head .meta { text-align: right; font-size: 12px; color: #4b5563; line-height: 1.6; }
  .head .meta .inv-no { font-size: 14px; font-weight: 700; color: #111827; }
  .status { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; color: ${statusColor}; border: 1px solid ${statusColor}; }
  .info { display: flex; justify-content: space-between; margin-bottom: 16px; }
  .info .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  th { background: #ff7732; color: #fff; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 8px; }
  td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  td .sub { display: block; font-size: 10px; color: #6b7280; margin-top: 1px; }
  .c { text-align: center; }
  .r { text-align: right; }
  .totals { width: 280px; margin-left: auto; }
  .totals .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; }
  .totals .row.grand { font-weight: 700; font-size: 15px; color: #111827; border-top: 1px solid #9ca3af; margin-top: 4px; padding-top: 6px; }
  .foot { margin-top: 22px; text-align: center; color: #6b7280; font-size: 11px; border-top: 1px dashed #d1d5db; padding-top: 10px; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <h1>${sName}</h1>
        ${sTagline ? `<div class="tag">${sTagline}</div>` : ""}
        ${sAddress ? `<div style="font-size:12px;color:#4b5563;margin-top:4px;">${sAddress}</div>` : ""}
        ${sPhone || sEmail ? `<div style="font-size:12px;color:#4b5563;margin-top:2px;">${[sPhone, sEmail].filter(Boolean).join(" | ")}</div>` : ""}
      </div>
      <div class="meta">
        <div class="inv-no">Invoice ${esc(base.saleNo || "")}</div>
        <div>Date: ${esc(String(base.saleDate || "").slice(0, 10))}</div>
        <div><span class="status">${esc(status)}</span></div>
      </div>
    </div>

    <div class="info">
      <div>
        <div class="lbl">Billed To</div>
        <div style="font-weight:600;">${esc(base.studentName || "-")}</div>
      </div>
    </div>

    <table>
      <thead><tr><th class="c">#</th><th>Item</th><th class="c">Qty</th><th class="r">Unit Price</th><th class="r">Discount</th><th class="r">Amount</th></tr></thead>
      <tbody>${items}</tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${fmt(sub)}</span></div>
      ${disc ? `<div class="row"><span>Discount</span><span>${fmt(disc)}</span></div>` : ""}
      <div class="row grand"><span>Grand Total</span><span>${fmt(total)}</span></div>
    </div>

    <div class="foot">Thank you for your purchase! This is a computer-generated invoice.</div>
  </div>
</body>
</html>`
  }

  const printSaleReceipt = (sale: Sale) => {
    if (!sale.saleNo) return
    const rows = sales.filter((s) => s.saleNo === sale.saleNo)
    const frame = document.getElementById("sale-invoice-frame") as HTMLIFrameElement | null
    if (!frame) return
    frame.onload = () => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    }
    frame.srcdoc = buildSaleInvoiceHtml(sale, rows)
  }

  const downloadSaleInvoice = (sale: Sale) => {
    if (!sale.saleNo) {
      printSaleReceipt(sale)
      return
    }
    window.open(`${window.location.origin}/api/students-inventory/sale/invoice?no=${encodeURIComponent(sale.saleNo)}`, "_blank")
  }

  const openEditSale = (sale: Sale) => {
    setEditSale(sale)
    setSaleForm({
      quantity: Number(sale.quantity) || 1,
      unitPrice: Number(sale.unitPrice) || 0,
      discountAmount: Number(sale.discountAmount) || 0,
      saleDate: String(sale.saleDate || new Date().toISOString().slice(0, 10)).slice(0, 10),
      paymentStatus: sale.paymentStatus === "Paid" ? "Paid" : "Unpaid",
    })
  }

  const saveEditSale = async () => {
    if (!editSale?.id) return
    const qty = Math.max(1, Number(saleForm.quantity) || 1)
    const unitPrice = Math.max(0, Number(saleForm.unitPrice) || 0)
    const discountAmount = Math.max(0, Number(saleForm.discountAmount) || 0)
    const subtotal = round2(qty * unitPrice)
    const totalAmount = Math.max(0, round2(subtotal - discountAmount))
    setSavingEdit(true)
    try {
      await updateSale(editSale.id, {
        quantity: qty,
        unitPrice,
        subtotal,
        discountAmount,
        totalAmount,
        saleDate: saleForm.saleDate,
        paymentStatus: saleForm.paymentStatus,
      })
      await refetch()
      notify.success("Sale updated")
      setEditSale(null)
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : "Failed to update sale")
    } finally {
      setSavingEdit(false)
    }
  }

  const confirmDeleteSale = async () => {
    if (!deleteSaleTarget?.id) return
    setDeletingSale(true)
    try {
      await removeSale(deleteSaleTarget.id)
      setDeleteSaleTarget(null)
      notify.success(`Sale ${deleteSaleTarget.saleNo || ""} deleted`)
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : "Failed to delete sale")
    } finally {
      setDeletingSale(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Student Sales (POS)</h2>
          <p className="text-sm text-white/80 mt-1">Students Inventory / Student Sales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[var(--primary)]" />
                Find Student
              </h3>
            </div>
            <div className="p-5">
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      onFocus={() => { if (searchResults.length > 0) setSearchOpen(true) }}
                      className={inputCls + " pl-9 pr-9"}
                      placeholder="Search by name, roll no, admission no or class"
                    />
                    {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[var(--primary)]" />}
                  </div>
                  <button
                    onClick={() => searchStudents()}
                    disabled={searching || searchQuery.trim().length < 2}
                    className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                  >
                    <UserCheck className="h-4 w-4" />
                    Search
                  </button>
                </div>

                {searchOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSearchOpen(false)} />
                    <div className="absolute z-20 mt-1.5 w-full rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden">
                      {searchResults.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400">No matching students</div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto">
                          {searchResults.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => selectStudent(r)}
                              className="w-full text-left px-4 py-2.5 hover:bg-[var(--primary-light)]/40 border-b border-gray-50 last:border-0 transition-colors"
                            >
                              <div className="text-sm font-medium text-gray-800">{r.name}</div>
                              <div className="text-xs text-gray-500">
                                Class {r.class || "-"}{r.section ? ` - ${r.section}` : ""} · Roll {r.rollNo || "-"} · {r.admissionNo || ""}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400">
                        {searchResults.length} match{searchResults.length === 1 ? "" : "es"} · click a row to select
                      </div>
                    </div>
                  </>
                )}
              </div>

              {formErrors.student && <p className="text-red-500 text-xs mt-1">{formErrors.student}</p>}
              {findState === "found" && student && (
                <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-sm text-emerald-700 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-medium">{student.name}</span>
                    {student.className && <span> - {student.className}</span>}
                    {student.sectionName && <span> / {student.sectionName}</span>}
                  </div>
                  <button
                    onClick={() => { setStudent(null); setFindState("idle"); setSearchQuery(""); setSearchResults([]); setSearchOpen(false) }}
                    className="shrink-0 p-1 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                    title="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              {findState === "notfound" && <p className="mt-2 text-red-600 text-sm">Student not found</p>}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Catalog</h3>
            </div>
            <div className="border-b border-gray-200 px-5">
              <div className="flex gap-4">
                <button
                  onClick={() => setCatalogTab("products")}
                  className={`flex items-center gap-2 px-2 py-3 text-sm font-medium border-b-2 transition-colors ${catalogTab === "products" ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  <Package className="h-4 w-4" /> Products
                </button>
                <button
                  onClick={() => setCatalogTab("books")}
                  className={`flex items-center gap-2 px-2 py-3 text-sm font-medium border-b-2 transition-colors ${catalogTab === "books" ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  <BookOpen className="h-4 w-4" /> Books
                </button>
                <div className="flex-1 flex items-center justify-end pb-2">
                  {catalogTab === "products" && (
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-56 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="Search products..."
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="p-5">
              {catalogTab === "products" ? (
                filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No products found</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredProducts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:border-[var(--primary)] transition-colors">
                        <div>
                          <div className="text-sm font-medium text-gray-800">{p.name}</div>
                          <div className="text-xs text-gray-500">{money(Number(p.sellingPrice) || 0)}</div>
                        </div>
                        <button
                          onClick={() => addToCart("product", p.id, p.name, p.sellingPrice)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--secondary)] transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-full max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                    <select
                      value={bookClass}
                      onChange={(e) => { setBookClass(e.target.value); setBookSelection({}); setBookModalOpen(false) }}
                      className={inputCls}
                    >
                      <option value="">-- Select Class --</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={openBookModal}
                    disabled={!bookClass}
                    className="flex items-center gap-2 px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <BookOpen className="h-4 w-4" />
                    Select Books
                  </button>
                  <p className="text-xs text-gray-400">
                    {bookClass
                      ? `${bookClassBooks.length} book(s) in ${bookClassName} · ${cart.filter((i) => i.type === "book").reduce((s, i) => s + i.quantity, 0)} book(s) in cart`
                      : "Select a class to pick books for the student"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm self-start lg:sticky lg:top-4">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-[var(--primary)]" />
              Cart
            </h3>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-600 font-medium">Clear</button>
            )}
          </div>
          <div className="p-5 space-y-4">
            {formErrors.cart && <p className="text-red-500 text-xs">{formErrors.cart}</p>}
            {cart.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Cart is empty. Add items from the catalog.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => {
                  const subtotal = round2(item.quantity * item.unitPrice)
                  return (
                    <div key={item.key} className="rounded-lg border border-gray-200 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{item.name}</div>
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium mt-1 ${item.type === "book" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                            {item.type === "book" ? "Book" : "Product"}
                          </span>
                        </div>
                        <button onClick={() => removeFromCart(item.key)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-gray-300">
                          <button onClick={() => updateQty(item.key, item.quantity - 1)} className="px-2 py-1.5 text-gray-500 hover:text-[var(--primary)]"><Minus className="h-3.5 w-3.5" /></button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateQty(item.key, Number(e.target.value))}
                            className="w-10 text-center text-sm border-0 focus:ring-0"
                          />
                          <button onClick={() => updateQty(item.key, item.quantity + 1)} className="px-2 py-1.5 text-gray-500 hover:text-[var(--primary)]"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) => updatePrice(item.key, Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                          />
                        </div>
                        <div className="text-sm font-semibold text-gray-800 w-20 text-right">{money(subtotal)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Ticket className="h-3.5 w-3.5 text-[var(--primary)]" /> Coupon
                </label>
                <select value={couponId} onChange={(e) => setCouponId(e.target.value)} className={inputCls}>
                  <option value="">No Coupon</option>
                  {activeCoupons.map((c) => (
                    <option key={c.id} value={c.id}>{c.code}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={inputCls}>
                  <option>Paid</option>
                  <option>Unpaid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
                <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className={inputCls} />
              </div>
              <div className="pt-1 space-y-1.5 text-sm border-t border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{money(subtotalSum)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Discount</span>
                  <span className="text-red-600">- {money(couponDiscount)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-800 text-base">
                  <span>Total</span>
                  <span>{money(total)}</span>
                </div>
              </div>
            </div>

            {formErrors.form && <p className="text-red-500 text-xs">{formErrors.form}</p>}
            <button
              onClick={handleCheckout}
              disabled={saving}
              className="w-full px-4 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Recording..." : `Checkout · ${money(total)}`}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Recent Sales</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Sale No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Item</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Type</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Qty</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">No sales yet</td>
                </tr>
              ) : (
                recentSales.map((s, idx) => (
                  <tr key={s.id ?? idx} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.saleNo || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.studentName || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{productName(s)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${s.bookId ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {s.bookId ? "Book" : "Product"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{s.quantity}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">{money(Number(s.totalAmount) || 0)}</td>
                    <td className="px-4 py-3 text-gray-600">{s.saleDate ? String(s.saleDate).slice(0, 10) : "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {s.paymentStatus || "Unpaid"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => printSaleReceipt(s)}
                          title="Print"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadSaleInvoice(s)}
                          title="Download PDF"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                        >
                          <FileDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditSale(s)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteSaleTarget(s)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
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
      </div>

      {bookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setBookModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[var(--primary)]" />
                Select Books - {bookClassName}
              </h3>
              <button onClick={() => setBookModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {bookClassBooks.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No books assigned to this class yet.</div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-[var(--primary)] h-4 w-4"
                        checked={bookSelectionList.length === bookClassBooks.length}
                        onChange={(e) => toggleSelectAllBooks(e.target.checked)}
                      />
                      Select all books
                    </label>
                    <span className="text-gray-500">{bookSelectionCount} book(s) selected</span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase w-12"></th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Sr. No.</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Name of the Book</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Publisher</th>
                          <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Price</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase w-32">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookClassBooks.map((b, idx) => {
                          const sel = bookSelection[Number(b.id)]
                          const checked = Boolean(sel)
                          return (
                            <tr key={b.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${checked ? "bg-[var(--primary)]/5" : ""}`}>
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  className="accent-[var(--primary)] h-4 w-4"
                                  checked={checked}
                                  onChange={() => toggleModalBook(b)}
                                />
                              </td>
                              <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium text-gray-800">{b.title}</td>
                              <td className="px-4 py-3 text-gray-600">{b.publisher || "-"}</td>
                              <td className="px-4 py-3 text-right text-gray-600">{money(Number(b.sellingPrice) || 0)}</td>
                              <td className="px-4 py-3">
                                {checked ? (
                                  <div className="flex items-center rounded-lg border border-gray-300 w-fit">
                                    <button onClick={() => updateModalQty(Number(b.id), sel.qty - 1)} className="px-2 py-1.5 text-gray-500 hover:text-[var(--primary)]"><Minus className="h-3.5 w-3.5" /></button>
                                    <input
                                      type="number"
                                      min={1}
                                      value={sel.qty}
                                      onChange={(e) => updateModalQty(Number(b.id), Number(e.target.value))}
                                      className="w-10 text-center text-sm border-0 focus:ring-0"
                                    />
                                    <button onClick={() => updateModalQty(Number(b.id), sel.qty + 1)} className="px-2 py-1.5 text-gray-500 hover:text-[var(--primary)]"><Plus className="h-3.5 w-3.5" /></button>
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
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center sticky bottom-0 bg-white rounded-b-xl">
              <span className="text-sm text-gray-600 font-medium">
                {bookSelectionCount} book(s) · {money(bookSelectionList.reduce((s, i) => s + round2(i.price * i.qty), 0))}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setBookModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button
                  onClick={addBooksToCart}
                  disabled={bookSelectionList.length === 0}
                  className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add {bookSelectionCount > 0 ? `${bookSelectionCount} Book(s)` : "Books"} to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {receiptOpen && receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setReceiptOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Order Placed
              </h3>
              <button onClick={() => setReceiptOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
                <h4 className="text-base font-bold text-gray-900">{school?.name || "Smart School"}</h4>
                {school?.tagline && <p className="text-[11px] text-[var(--primary)] mt-0.5">{school.tagline}</p>}
                <p className="text-sm font-semibold text-gray-800 mt-2">{receipt.saleNo}</p>
                <p className="text-xs text-gray-500">Date: {receipt.saleDate}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${receipt.paymentStatus === "Paid" ? "text-emerald-700 border-emerald-600" : "text-red-600 border-red-600"}`}>
                  {receipt.paymentStatus}
                </span>
              </div>

              {receipt.student && (
                <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 mb-4">
                  <span className="text-xs text-gray-400">Student:</span> <b>{receipt.student.name}</b>
                  {receipt.student.className && <span> — {receipt.student.className}</span>}
                  {receipt.student.sectionName && <span> / {receipt.student.sectionName}</span>}
                </div>
              )}

              <div className="rounded-lg border border-gray-200 overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--primary)] text-white text-left text-xs uppercase">
                      <th className="px-3 py-2 font-medium">Item</th>
                      <th className="px-3 py-2 font-medium text-center w-16">Qty</th>
                      <th className="px-3 py-2 font-medium text-right w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items.map((it, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        <td className="px-3 py-2">
                          <div className="text-gray-800 font-medium">{it.name}</div>
                          <div className="text-[11px] text-gray-400 flex items-center gap-1">
                            <span className={`inline-flex px-1 py-0.5 rounded text-[9px] font-medium ${it.type === "book" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                              {it.type === "book" ? "Book" : "Product"}
                            </span>
                            {it.discount > 0 && <span className="text-red-500">Disc {money(it.discount)}</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-600">{it.quantity}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-800">{money(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between"><span>Subtotal</span><span>{money(receipt.subtotal)}</span></div>
                {receipt.discount > 0 && (
                  <div className="flex justify-between text-red-600"><span>Discount</span><span>- {money(receipt.discount)}</span></div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1.5 border-t border-gray-200">
                  <span>Grand Total</span><span>{money(receipt.total)}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-2 sticky bottom-0 bg-white rounded-b-xl">
              <button
                onClick={shareWhatsApp}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#25D366] hover:bg-[#1eb958] rounded-lg transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </button>
              <button
                onClick={printReceipt}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FileDown className="h-4 w-4" /> Download PDF
              </button>
              <button
                onClick={printReceipt}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
              <button
                onClick={() => setReceiptOpen(false)}
                className="flex items-center justify-center px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {editSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditSale(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Pencil className="h-5 w-5 text-[var(--primary)]" />
                Edit Sale
              </h3>
              <button onClick={() => setEditSale(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm">
                <div className="text-gray-500 text-xs">Sale</div>
                <div className="font-semibold text-gray-800">{editSale.saleNo || "-"}</div>
                <div className="text-gray-500 text-xs mt-1">{editSale.studentName || "-"}</div>
                <div className="text-gray-500 text-xs">{productName(editSale)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm((p) => ({ ...p, quantity: Number(e.target.value) }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price ({symbol})</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={saleForm.unitPrice}
                    onChange={(e) => setSaleForm((p) => ({ ...p, unitPrice: Number(e.target.value) }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Discount ({symbol})</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={saleForm.discountAmount}
                    onChange={(e) => setSaleForm((p) => ({ ...p, discountAmount: Number(e.target.value) }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Status</label>
                  <select
                    value={saleForm.paymentStatus}
                    onChange={(e) => setSaleForm((p) => ({ ...p, paymentStatus: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sale Date</label>
                <input
                  type="date"
                  value={saleForm.saleDate}
                  onChange={(e) => setSaleForm((p) => ({ ...p, saleDate: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{money(round2((Math.max(1, Number(saleForm.quantity) || 1)) * (Math.max(0, Number(saleForm.unitPrice) || 0))))}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Discount</span>
                  <span>- {money(Math.min(Math.max(0, Number(saleForm.discountAmount) || 0), round2((Math.max(1, Number(saleForm.quantity) || 1)) * (Math.max(0, Number(saleForm.unitPrice) || 0)))))}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>
                    {money(Math.max(0, round2((Math.max(1, Number(saleForm.quantity) || 1)) * (Math.max(0, Number(saleForm.unitPrice) || 0)) - (Math.max(0, Number(saleForm.discountAmount) || 0)))))}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 rounded-b-xl">
              <button onClick={() => setEditSale(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={saveEditSale}
                disabled={savingEdit}
                className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] disabled:opacity-50 flex items-center gap-2"
              >
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSaleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteSaleTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm z-10">
            <div className="px-6 pt-6 pb-2 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Delete Sale</h3>
              <p className="text-sm text-gray-500 mt-1">
                Delete sale <b>{deleteSaleTarget.saleNo || "-"}</b> ({productName(deleteSaleTarget)})? This cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 flex justify-center gap-2">
              <button onClick={() => setDeleteSaleTarget(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={confirmDeleteSale}
                disabled={deletingSale}
                className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deletingSale ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <iframe
        id="receipt-frame"
        title="Receipt print frame"
        style={{ position: "fixed", left: -9999, top: 0, width: 820, height: 1100, border: 0 }}
      />
      <iframe
        id="sale-invoice-frame"
        title="Sale invoice print frame"
        style={{ position: "fixed", left: -9999, top: 0, width: 900, height: 1200, border: 0 }}
      />
    </div>
  )
}
