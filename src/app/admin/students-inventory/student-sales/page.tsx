"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { UserCheck, Search, ShoppingCart, Plus, Minus, Trash2, Ticket, Save, Package, BookOpen, X, Loader2, Printer, FileDown, MessageCircle, CheckCircle2, Pencil, SlidersHorizontal, Eye, Layers, AlertTriangle } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { ProductIcon, getIconColors, InventoryBadge } from "@/lib/inventory-icons"
import { useCurrency } from "@/lib/currency-context"
import { useAuth } from "@/lib/auth-context"
import { useSchoolInfo } from "@/lib/use-school-info"
import { toast as notify } from "@/lib/toast"

type Product = { id?: number; name: string; sellingPrice?: number | string; icon?: string; iconImage?: string; categoryId?: number | null; categoryName?: string }
type Category = { id?: number; name: string; icon?: string; iconImage?: string }
type Variation = { id?: number; productId: number; componentName?: string; color?: string; size?: string; price?: number | string; sku?: string; quantity?: number; variantType?: string; variantValue?: string; additionalPrice?: number | string }
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
  variationId?: number
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
type BalanceRow = { productId: number; variationId: number | null; name?: string; label?: string; minStock?: number; balance: number; status: "ok" | "low" | "out" }
type BalanceResponse = { products: BalanceRow[]; variations: BalanceRow[] }

const inputCls = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-500/20 outline-none transition-all"

const round2 = (n: number) => Math.round(n * 100) / 100

export default function StudentSalesPage() {
  const { data: products } = useApi<Product>("/api/students-inventory/product")
  const { data: books } = useApi<Book>("/api/students-inventory/book")
  const { data: classes } = useApi<Class>("/api/classes")
  const { data: coupons } = useApi<Coupon>("/api/students-inventory/coupon")
  const { data: sales, update: updateSale, remove: removeSale, refetch } = useApi<Sale>("/api/students-inventory/sale")
  const { data: variations } = useApi<Variation>("/api/students-inventory/variation")
  const { data: categories } = useApi<Category>("/api/students-inventory/category")
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
  const [recentPageSize, setRecentPageSize] = useState(10)
  const [recentPage, setRecentPage] = useState(1)
  const [viewOrder, setViewOrder] = useState<{ saleNo: string; rows: Sale[] } | null>(null)

  const [balances, setBalances] = useState<BalanceResponse>({ products: [], variations: [] })
  const [lowAlertDismissed, setLowAlertDismissed] = useState(false)

  const refreshBalances = useCallback(() => {
    fetch("/api/students-inventory/stock/balance")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: BalanceResponse | null) => {
        if (d) setBalances({ products: d.products || [], variations: d.variations || [] })
      })
      .catch(() => {})
  }, [])

  useEffect(() => { refreshBalances() }, [refreshBalances])

  const productBalMap = useMemo(() => new Map(balances.products.map((b) => [b.productId, b])), [balances])
  const varBalMap = useMemo(() => new Map(balances.variations.map((b) => [b.variationId, b])), [balances])

  const lowOutItems = useMemo(() => {
    const list: { key: string; name: string; balance: number; status: string }[] = []
    for (const b of balances.products) {
      if (variations.some((v) => v.productId === b.productId)) continue
      if (b.status !== "ok") list.push({ key: `p-${b.productId}`, name: b.name || `Product #${b.productId}`, balance: b.balance, status: b.status })
    }
    for (const b of balances.variations) {
      if (b.status !== "ok") list.push({ key: `v-${b.variationId}`, name: b.label || `Variation #${b.variationId}`, balance: b.balance, status: b.status })
    }
    return list
  }, [balances, variations])

  // variation picker state - simple color/size flow
  const [varProduct, setVarProduct] = useState<Product | null>(null)
  const [varPickerOpen, setVarPickerOpen] = useState(false)
  const [pickerColor, setPickerColor] = useState("")
  const [pickerSize, setPickerSize] = useState("")
  const [varQty, setVarQty] = useState(1)

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

  const getProductVariations = (productId?: number) => (productId ? variations.filter((v) => v.productId === productId) : [])
  const hasVariations = (productId?: number) => getProductVariations(productId).length > 0

  const productStockTotal = (p?: Product): number => {
    if (!p || p.id == null) return 0
    const parent = productBalMap.get(p.id)?.balance ?? 0
    const vars = getProductVariations(p.id)
    if (vars.length === 0) return parent
    return parent + vars.reduce((s, v) => s + (varBalMap.get(v.id!)?.balance ?? 0), 0)
  }

  const availableFor = (item: CartItem): number | null => {
    if (item.type === "book" || item.bookId) return null
    if (item.variationId) {
      const vb = varBalMap.get(item.variationId)
      if (vb != null) return vb.balance
      return null
    }
    const p = products.find((x) => x.id === item.productId)
    if (!p) return null
    const total = productStockTotal(p)
    return Number.isFinite(total) ? total : null
  }

  const stockChip = (avail: number, min?: number, showMin = true) => {
    const isOut = avail <= 0
    const isLow = !isOut && typeof min === "number" && min > 0 && avail <= min
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${isOut ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30" : isLow ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30" : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"}`}>
        {isOut ? <X className="h-2.5 w-2.5" /> : <Package className="h-2.5 w-2.5" />}
        {isOut ? "Out of stock" : `${avail} in stock${showMin && min ? ` · min ${min}` : ""}`}
      </span>
    )
  }

  const capQuantity = (key: string, quantity: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i
        const max = availableFor(i)
        let q = Math.max(1, Math.floor(Number(quantity) || 1))
        if (max != null) q = Math.min(q, Math.max(1, max))
        return { ...i, quantity: q }
      })
    )
  }

  const variationAvail = (v?: Variation | null): number | null => {
    if (!v || v.id == null) return null
    const vb = varBalMap.get(v.id)
    if (vb != null) return vb.balance
    return v.quantity != null ? Number(v.quantity) : null
  }

  const addToCart = (type: "product" | "book", id: number | undefined, name: string, price: number | string | undefined, variationId?: number) => {
    if (!id) return
    const varId = variationId ?? undefined
    setCart((prev) => {
      const key = varId ? `${type}-${id}-var-${varId}` : `${type}-${id}`
      const existing = prev.find((i) => i.key === key)
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { key, type, productId: type === "product" ? id : undefined, bookId: type === "book" ? id : undefined, variationId: varId, name, quantity: 1, unitPrice: Number(price) || 0 }]
    })
  }

  const handleProductAdd = (p: Product) => {
    const vars = getProductVariations(p.id)
    if (vars.length > 0) {
      setVarProduct(p)
      // init picker to first variation
      const first = vars[0]
      setPickerColor(first?.color || "")
      setPickerSize(first?.size || first?.variantValue || "")
      setVarQty(1)
      setVarPickerOpen(true)
      return
    }
    const avail = productStockTotal(p)
    if (avail != null && avail <= 0 && (productBalMap.size > 0 || varBalMap.size > 0)) {
      notify.error(`${p.name} is out of stock`)
      return
    }
    addToCart("product", p.id, p.name, p.sellingPrice)
  }

  const pickerVars = useMemo(() => getProductVariations(varProduct?.id), [varProduct, variations])
  const pickerColors = useMemo(() => {
    const set = new Set(pickerVars.map((v) => (v.color || "").trim()).filter(Boolean))
    return Array.from(set)
  }, [pickerVars])
  const pickerSizesForColor = useMemo(() => {
    const filtered = pickerColor ? pickerVars.filter((v) => (v.color || "") === pickerColor) : pickerVars
    const set = new Set(filtered.map((v) => (v.size || v.variantValue || "").trim()).filter(Boolean))
    return Array.from(set)
  }, [pickerVars, pickerColor])
  const matchedVar = useMemo(() => {
    if (!pickerVars.length) return null
    // try exact color+size match
    let m = pickerVars.find((v) => (v.color || "") === pickerColor && (v.size || v.variantValue || "") === pickerSize)
    if (m) return m
    // fallback size only
    m = pickerVars.find((v) => (v.size || v.variantValue || "") === pickerSize)
    if (m) return m
    // fallback color only
    m = pickerVars.find((v) => (v.color || "") === pickerColor)
    if (m) return m
    return pickerVars[0]
  }, [pickerVars, pickerColor, pickerSize])

  const confirmVarAdd = () => {
    if (!varProduct?.id || !matchedVar) return
    const v = matchedVar
    const avail = variationAvail(v)
    if (avail != null && avail <= 0) {
      notify.error(`${varProduct.name} is out of stock`)
      return
    }
    const price = Number(v.price ?? v.additionalPrice ?? varProduct.sellingPrice) || 0
    const labelParts = [varProduct.name]
    const varLabel = [v.componentName || v.variantType, v.color, v.size || v.variantValue].filter(Boolean).join(" · ")
    if (varLabel) labelParts.push(varLabel)
    const displayName = labelParts.join(" — ")
    const wanted = Math.max(1, Number(varQty) || 1)
    const qty = avail != null ? Math.min(wanted, Math.max(1, avail)) : wanted
    if (qty !== wanted) notify.info(`Stock limited to ${qty} for ${displayName}`)
    const key = `product-${varProduct.id}-var-${v.id}`
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key)
      if (existing) return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + qty, unitPrice: price, name: displayName, variationId: v.id } : i))
      return [...prev, { key, type: "product", productId: varProduct.id, variationId: v.id, name: displayName, quantity: qty, unitPrice: price }]
    })
    setVarPickerOpen(false)
    setVarProduct(null)
    setPickerColor("")
    setPickerSize("")
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
    capQuantity(key, quantity)
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
    const stockIssues = cart
      .filter((i) => i.type === "product")
      .map((i) => ({ item: i, max: availableFor(i) }))
      .filter(({ item, max }) => max != null && item.quantity > max)
    if (stockIssues.length > 0) {
      errs.form = stockIssues.map(({ item, max }) => `${item.name}: only ${max} in stock (cart ${item.quantity})`).join("; ")
    }
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
            variationId: (i as any).variationId ?? null,
            variantId: (i as any).variationId ?? null,
            uniformName: i.name,
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
      refreshBalances()
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

  const groupedOrders = useMemo(() => {
    const map = new Map<string, Sale[]>()
    for (const s of sales) {
      const key = s.saleNo || `id-${s.id}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    const groups = Array.from(map.entries()).map(([saleNo, rows]) => {
      const first = rows[0]
      const total = rows.reduce((a, r) => a + (Number(r.totalAmount) || 0), 0)
      const qty = rows.reduce((a, r) => a + (Number(r.quantity) || 0), 0)
      return { saleNo, rows, first, total, qty, count: rows.length, date: first.saleDate || "" }
    })
    // already sales is id DESC, so groups retain order of first appearance (newest first)
    return groups
  }, [sales])

  const totalOrderPages = Math.max(1, Math.ceil(groupedOrders.length / recentPageSize))
  const pagedOrders = useMemo(() => {
    const start = (recentPage - 1) * recentPageSize
    return groupedOrders.slice(start, start + recentPageSize)
  }, [groupedOrders, recentPage, recentPageSize])

  // keep page in range when size changes
  useEffect(() => { setRecentPage(1) }, [recentPageSize])
  useEffect(() => { if (recentPage > totalOrderPages) setRecentPage(totalOrderPages) }, [totalOrderPages, recentPage])

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
    <div className="space-y-5">
      {/* POS hero — matches admin premium style */}
      <div className="relative overflow-hidden rounded-[24px] border border-orange-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-[0_8px_32px_rgba(255,119,50,0.12)]">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50/60 to-white dark:from-orange-950/15 dark:via-amber-950/10 dark:to-slate-900" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-orange-200/40 to-amber-200/30 blur-3xl opacity-60 dark:opacity-20" />
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />
        <div className="relative px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-3 py-1 text-[11px] font-black tracking-widest text-orange-700 dark:text-orange-300 uppercase">
              <ShoppingCart className="h-3.5 w-3.5" /> Students Inventory <span className="opacity-30">·</span> POS
            </p>
            <h2 className="mt-2 text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-white">Student Sales <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">POS</span></h2>
            <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400 mt-1">Scan student, add items, checkout — fast and accurate billing</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3.5 py-1.5 text-xs font-bold shadow">
              <Package className="h-3.5 w-3.5" /> {products.length} products
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <BookOpen className="h-3.5 w-3.5 text-violet-600" /> {books.length} books
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Ticket className="h-3.5 w-3.5 text-emerald-600" /> {activeCoupons.length} coupons
            </span>
          </div>
        </div>
      </div>

      {lowOutItems.length > 0 && !lowAlertDismissed && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-5 py-3.5 flex items-start gap-3 shadow-sm">
          <span className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0"><AlertTriangle className="h-5 w-5" /></span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-amber-800 dark:text-amber-300">
              {lowOutItems.length} item{lowOutItems.length === 1 ? "" : "s"} {lowOutItems.length === 1 ? "is" : "are"} low on stock — restock before selling
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {lowOutItems.slice(0, 10).map((it) => (
                <span key={it.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${it.status === "out" ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30" : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30"}`}>
                  {it.name} · {it.balance} left
                </span>
              ))}
              {lowOutItems.length > 10 && <span className="px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">+{lowOutItems.length - 10} more</span>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a href="/admin/students-inventory/stock-management" className="px-3.5 py-1.5 rounded-full bg-amber-500 text-white text-xs font-black hover:bg-amber-600 transition-colors inline-flex items-center gap-1">
              <Package className="h-3.5 w-3.5" /> Restock
            </a>
            <button onClick={() => setLowAlertDismissed(true)} title="Dismiss" className="h-7 w-7 rounded-full border border-amber-300 dark:border-amber-500/30 bg-white dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-300 hover:bg-amber-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center gap-2">
              <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-sm"><UserCheck className="h-4 w-4" /></span>
              <div>
                <h3 className="text-[13px] font-extrabold tracking-wide text-slate-900 dark:text-white uppercase">Find Student</h3>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Search by name, admission/roll or class</p>
              </div>
            </div>
            <div className="p-5">
              <div className="relative">
                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      onFocus={() => { if (searchResults.length > 0) setSearchOpen(true) }}
                      className={inputCls + " pl-10 pr-10 !rounded-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"}
                      placeholder="Search by name, roll, admission no…"
                    />
                    {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-orange-500" />}
                  </div>
                  <button
                    onClick={() => searchStudents()}
                    disabled={searching || searchQuery.trim().length < 2}
                    className="px-5 py-2.5 bg-gradient-to-br from-orange-500 to-amber-500 text-white text-sm font-black rounded-full hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 shadow-sm"
                  >
                    <Search className="h-4 w-4" />
                    Search
                  </button>
                </div>

                {searchOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSearchOpen(false)} />
                    <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl overflow-hidden">
                      {searchResults.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-400">No matching students</div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto">
                          {searchResults.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => selectStudent(r)}
                              className="w-full text-left px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-500/10 border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors flex items-center gap-3"
                            >
                              <span className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xs font-black shrink-0">{r.name.charAt(0)}</span>
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-slate-800 dark:text-white truncate">{r.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {r.class || "-"} {r.section ? `· ${r.section}` : ""} · Roll {r.rollNo || "-"} · {r.admissionNo || ""}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-500">
                        {searchResults.length} match{searchResults.length === 1 ? "" : "es"} · click to select
                      </div>
                    </div>
                  </>
                )}
              </div>

              {formErrors.student && <p className="text-red-500 text-xs mt-2 font-medium">{formErrors.student}</p>}
              {findState === "found" && student && (
                <div className="mt-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-black shrink-0">{student.name.charAt(0)}</span>
                    <div className="min-w-0">
                      <div className="font-extrabold truncate">{student.name}</div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-300">{student.className || "-"} {student.sectionName ? `· ${student.sectionName}` : ""}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setStudent(null); setFindState("idle"); setSearchQuery(""); setSearchResults([]); setSearchOpen(false) }}
                    className="shrink-0 h-8 w-8 rounded-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                    title="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              {findState === "notfound" && <p className="mt-2 text-red-600 text-sm font-medium">Student not found</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <h3 className="text-[13px] font-extrabold tracking-wide text-slate-900 dark:text-white uppercase flex items-center gap-2"><span className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center text-white"><Layers className="h-3.5 w-3.5" /></span> Catalog</h3>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">{catalogTab === "products" ? `${filteredProducts.length} products` : `${bookClassBooks.length} books`}</span>
            </div>
            <div className="px-5 pt-3 flex items-center gap-2">
              <div className="flex rounded-full bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setCatalogTab("products")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-black rounded-full transition-colors ${catalogTab === "products" ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
                >
                  <Package className="h-3.5 w-3.5" /> Products
                </button>
                <button
                  onClick={() => setCatalogTab("books")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-black rounded-full transition-colors ${catalogTab === "books" ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
                >
                  <BookOpen className="h-3.5 w-3.5" /> Books
                </button>
              </div>
              <div className="flex-1 flex items-center justify-end">
                {catalogTab === "products" && (
                  <div className="relative w-56 hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                      placeholder="Search products…"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="p-5">
              {catalogTab === "products" ? (
                filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">No products found</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredProducts.map((p) => {
                      const vars = getProductVariations(p.id)
                      const hasVar = vars.length > 0
                      const fromPrice = hasVar ? Math.min(...vars.map((v: any) => Number(v.price ?? v.additionalPrice ?? p.sellingPrice) || 0)) : 0
                      const totalAvail = productStockTotal(p)
                      return (
                      <div key={p.id} className={`group flex items-center justify-between rounded-2xl border px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md ${hasVar ? "border-orange-200 dark:border-orange-500/20 bg-orange-50/40 dark:bg-orange-500/5" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-orange-200 hover:bg-orange-50/30"}`}>
                        <div className="min-w-0 flex items-center gap-3">
                          {(() => { const cat = categories.find(c=> c.id===p.categoryId); const effIcon = (p as any).icon || (cat as any)?.icon; const effImage = (p as any).iconImage || (cat as any)?.iconImage; return <InventoryBadge name={p.name} icon={effIcon} iconImage={effImage} categoryName={cat?.name} size={40} /> })()}
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">{p.name}{hasVar && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black"><SlidersHorizontal className="h-3 w-3" />{vars.length}</span>}</div>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{hasVar ? `From ${money(fromPrice)} · ${vars.length} sizes` : money(Number(p.sellingPrice) || 0)}</div>
                            <div className="mt-1">{stockChip(totalAvail, p.id != null ? productBalMap.get(p.id)?.minStock : undefined, !hasVar)}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleProductAdd(p)}
                          disabled={!hasVar && totalAvail <= 0}
                          className="ml-2 shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black hover:scale-105 transition-transform shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          <Plus className="h-3.5 w-3.5" /> {hasVar ? (totalAvail <= 0 ? "No stock" : "Select") : totalAvail <= 0 ? "Sold Out" : "Add"}
                        </button>
                      </div>
                      )
                    })}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-full max-w-md">
                    <label className="block text-xs font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">Select Class</label>
                    <select
                      value={bookClass}
                      onChange={(e) => { setBookClass(e.target.value); setBookSelection({}); setBookModalOpen(false) }}
                      className={inputCls + " !rounded-full"}
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
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-sm font-black rounded-full hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed shadow"
                  >
                    <BookOpen className="h-4 w-4" />
                    Select Books
                  </button>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1">
                    {bookClass
                      ? `${bookClassBooks.length} books in ${bookClassName} · ${cart.filter((i) => i.type === "book").reduce((s, i) => s + i.quantity, 0)} in cart`
                      : "Select a class to pick books"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm self-start lg:sticky lg:top-4 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
            <h3 className="text-[13px] font-extrabold tracking-wide text-slate-900 dark:text-white uppercase flex items-center gap-2">
              <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white"><ShoppingCart className="h-3.5 w-3.5" /></span>
              Cart <span className="ml-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-0.5 text-[11px] font-black">{cart.length}</span>
            </h3>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-500/20">Clear</button>
            )}
          </div>
          <div className="p-5 space-y-4">
            {formErrors.cart && <p className="text-red-600 text-xs font-medium bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2">{formErrors.cart}</p>}
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <ShoppingCart className="h-6 w-6 opacity-60" />
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Cart is empty</p>
                <p className="text-xs mt-1">Add products or books from the catalog</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 portal-scroll">
                {cart.map((item) => {
                  const subtotal = round2(item.quantity * item.unitPrice)
                  const itemMax = availableFor(item)
                  return (
                    <div key={item.key} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3.5 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">{item.name}</div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black mt-1.5 border ${item.type === "book" ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30" : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30"}`}>
                            {item.type === "book" ? "Book" : "Product"}
                          </span>
                          {item.type === "product" && itemMax != null && (
                            <span className={`block mt-1 text-[10px] font-bold ${itemMax <= 0 ? "text-red-500 dark:text-red-300" : "text-slate-400 dark:text-slate-500"}`}>
                              {itemMax <= 0 ? "Out of stock" : `${itemMax} in stock${item.quantity >= itemMax ? " · at limit" : ""}`}
                            </span>
                          )}
                        </div>
                        <button onClick={() => removeFromCart(item.key)} className="h-7 w-7 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 shrink-0 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                          <button onClick={() => updateQty(item.key, item.quantity - 1)} disabled={item.quantity <= 1} className="h-8 w-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
                          <input
                            type="number"
                            min={1}
                            max={itemMax ?? undefined}
                            value={item.quantity}
                            onChange={(e) => updateQty(item.key, Number(e.target.value))}
                            className="w-11 text-center text-sm font-bold border-0 focus:ring-0 bg-transparent text-slate-900 dark:text-white"
                          />
                          <button onClick={() => updateQty(item.key, item.quantity + 1)} disabled={itemMax != null && item.quantity >= itemMax} className="h-8 w-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="flex-1 relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{symbol}</span>
                          <input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) => updatePrice(item.key, Number(e.target.value))}
                            className="w-full rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-7 pr-2 py-1.5 text-sm font-bold text-right text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                          />
                        </div>
                        <div className="text-sm font-black text-slate-900 dark:text-white w-20 text-right">{money(subtotal)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                  <Ticket className="h-3.5 w-3.5 text-orange-500" /> Coupon
                </label>
                <select value={couponId} onChange={(e) => setCouponId(e.target.value)} className={inputCls + " !py-2"}>
                  <option value="">No Coupon</option>
                  {activeCoupons.map((c) => (
                    <option key={c.id} value={c.id}>{c.code}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1.5">Payment</label>
                  <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={inputCls + " !py-2"}>
                    <option>Paid</option>
                    <option>Unpaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1.5">Sale Date</label>
                  <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className={inputCls + " !py-2"} />
                </div>
              </div>
              <div className="pt-2 space-y-1.5 text-sm border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between font-medium text-slate-600 dark:text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900 dark:text-white">{money(subtotalSum)}</span>
                </div>
                <div className="flex justify-between font-medium text-slate-600 dark:text-slate-300">
                  <span>Discount</span>
                  <span className="font-black text-red-600">- {money(couponDiscount)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 dark:text-white text-[16px] pt-1">
                  <span>Total</span>
                  <span>{money(total)}</span>
                </div>
              </div>
            </div>

            {formErrors.form && <p className="text-red-600 text-xs font-medium bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2">{formErrors.form}</p>}
            <button
              onClick={handleCheckout}
              disabled={saving}
              className="w-full px-4 py-3 bg-gradient-to-br from-orange-500 to-amber-500 text-white text-sm font-black rounded-full hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              <Save className="h-4 w-4" />
              {saving ? "Recording…" : `Checkout · ${money(total)}`}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
          <h3 className="text-[13px] font-extrabold tracking-wide text-slate-900 dark:text-white uppercase flex items-center gap-2"><span className="h-7 w-7 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900"><FileDown className="h-3.5 w-3.5" /></span> Recent Orders</h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden sm:inline font-medium">Show</span>
            <select value={recentPageSize} onChange={(e)=> setRecentPageSize(Number(e.target.value))} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-200">
              {[10,20,30,50,100].map(n=> <option key={n} value={n}>{n} / page</option>)}
            </select>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2.5 py-1 text-[11px] font-black">{groupedOrders.length} orders</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 font-black text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest">Sale No</th>
                <th className="text-left px-4 py-3 font-black text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest">Student</th>
                <th className="text-left px-4 py-3 font-black text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest">Items</th>
                <th className="text-center px-4 py-3 font-black text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest">Qty</th>
                <th className="text-right px-4 py-3 font-black text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest">Total</th>
                <th className="text-left px-4 py-3 font-black text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest">Date</th>
                <th className="text-left px-4 py-3 font-black text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest">Status</th>
                <th className="text-right px-4 py-3 font-black text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2"><ShoppingCart className="h-5 w-5" /></div>
                    <p className="text-sm font-semibold">No sales yet</p><p className="text-xs">Orders will appear here after checkout</p>
                  </td>
                </tr>
              ) : pagedOrders.length===0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">No orders on this page</td></tr>
              ) : (
                pagedOrders.map((g, idx) => (
                  <tr key={g.saleNo} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/40 dark:bg-slate-800/20"}`}>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{g.saleNo || "-"}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{g.first.studentName || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[280px]">
                        {g.rows.slice(0,3).map((r,i)=> (
                          <span key={r.id ?? i} className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black border ${r.bookId ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30" : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30"}`}>{productName(r)}</span>
                        ))}
                        {g.rows.length>3 && <span className="text-[11px] font-medium text-slate-400">+{g.rows.length-3} more</span>}
                      </div>
                      <div className="text-[11px] font-medium text-slate-400">{g.count} item{g.count>1?"s":""}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">{g.qty}</td>
                    <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">{money(g.total)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{g.date ? String(g.date).slice(0, 10) : "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${g.first.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${g.first.paymentStatus === "Paid" ? "bg-emerald-500" : "bg-red-500"}`} />{g.first.paymentStatus || "Unpaid"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewOrder({ saleNo: g.saleNo, rows: g.rows })} title="View details" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-orange-200 hover:text-orange-600">
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button onClick={() => printSaleReceipt(g.first)} title="Print" className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-orange-600 hover:border-orange-200">
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => downloadSaleInvoice(g.first)} title="Download PDF" className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-orange-600 hover:border-orange-200">
                          <FileDown className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={async()=>{ if(!confirm(`Delete order ${g.saleNo} with ${g.count} item(s)?`)) return; for(const r of g.rows){ if(r.id) await removeSale(r.id) } }} title="Delete order" className="h-7 w-7 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
          <span>Showing <b className="text-slate-900 dark:text-white">{pagedOrders.length}</b> of <b className="text-slate-900 dark:text-white">{groupedOrders.length}</b> · Page {recentPage} of {totalOrderPages}</span>
          <div className="flex items-center gap-1.5">
            <button onClick={()=> setRecentPage(p=> Math.max(1,p-1))} disabled={recentPage===1} className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold">Prev</button>
            <span className="px-2 font-black text-slate-900 dark:text-white">{recentPage}/{totalOrderPages}</span>
            <button onClick={()=> setRecentPage(p=> Math.min(totalOrderPages,p+1))} disabled={recentPage===totalOrderPages} className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold">Next</button>
          </div>
        </div>
      </div>

      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={()=> setViewOrder(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col z-10 border dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Order {viewOrder.saleNo}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{viewOrder.rows[0]?.studentName || "-"} · {viewOrder.rows[0]?.saleDate ? String(viewOrder.rows[0].saleDate).slice(0,10) : ""} · <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${viewOrder.rows[0]?.paymentStatus==="Paid"?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>{viewOrder.rows[0]?.paymentStatus || "Unpaid"}</span></p>
              </div>
              <button onClick={()=> setViewOrder(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700"><th className="text-left px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">#</th><th className="text-left px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Item</th><th className="text-center px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Qty</th><th className="text-right px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Unit</th><th className="text-right px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Total</th></tr></thead>
                  <tbody>
                    {viewOrder.rows.map((r, i)=> (
                      <tr key={r.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-3 py-2 text-gray-500">{i+1}</td>
                        <td className="px-3 py-2"><div className="font-medium text-gray-800 dark:text-gray-100">{productName(r)}</div><div className="text-[11px] text-gray-400">{r.bookId ? "Book" : "Product"} · ID {r.productId || r.bookId}</div></td>
                        <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">{r.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{money(Number(r.unitPrice)||0)}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-800 dark:text-gray-100">{money(Number(r.totalAmount)||0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-end text-sm">
                <div className="w-56 space-y-1">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal</span><span>{money(viewOrder.rows.reduce((a,r)=>a+(Number(r.subtotal)||0),0))}</span></div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Discount</span><span>-{money(viewOrder.rows.reduce((a,r)=>a+(Number(r.discountAmount)||0),0))}</span></div>
                  <div className="flex justify-between font-bold text-gray-800 dark:text-gray-100 border-t dark:border-gray-700 pt-1"><span>Total</span><span>{money(viewOrder.rows.reduce((a,r)=>a+(Number(r.totalAmount)||0),0))}</span></div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 bg-white dark:bg-gray-900">
              <button onClick={()=> setViewOrder(null)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Close</button>
              <button onClick={()=> { if(viewOrder) printSaleReceipt(viewOrder.rows[0]); }} className="px-4 py-2 bg-[var(--primary)] text-white text-sm rounded-lg hover:bg-[var(--secondary)] flex items-center gap-1"><Printer className="h-4 w-4"/> Print</button>
            </div>
          </div>
        </div>
      )}

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

      {varPickerOpen && varProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setVarPickerOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col z-10 border dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-[var(--primary)]" />{varProduct.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose Color → Size → Add to Cart</p>
              </div>
              <button onClick={() => setVarPickerOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {pickerVars.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No variations found for this product.</p>
              ) : (
                <>
                  <div className="rounded-lg border border-[var(--primary)]/20 dark:border-[var(--primary)]/30 bg-[var(--primary-light)]/40 dark:bg-primary/30 p-3">
                    <div className="text-xs font-semibold text-[var(--primary)] dark:text-[var(--primary)] uppercase mb-2">Product: {varProduct.name}</div>
                    {pickerColors.length > 0 ? (
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Color</label>
                        <select value={pickerColor} onChange={(e) => { setPickerColor(e.target.value); const remain = pickerVars.filter((v) => (v.color || "") === e.target.value).map((v) => v.size || v.variantValue || ""); if (remain.length && !remain.includes(pickerSize)) setPickerSize(remain[0]) }} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)]">
                          {pickerColors.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">No color variants — size only</div>
                    )}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Size *</label>
                      <select value={pickerSize} onChange={(e) => setPickerSize(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)]">
                        {pickerSizesForColor.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    {matchedVar && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--primary-light)] dark:border-[var(--primary)]/20 mt-3">
                        <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2">
                          <div className="text-[11px] text-gray-400 dark:text-gray-400 uppercase font-medium">Price</div>
                          <div className="text-base font-bold text-gray-800 dark:text-gray-100">{money(Number(matchedVar.price ?? matchedVar.additionalPrice ?? varProduct.sellingPrice) || 0)}</div>
                          <div className="text-[11px] text-gray-400 dark:text-gray-400">SKU: {matchedVar.sku || "-"}</div>
                        </div>
                        <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2">
                          <div className="text-[11px] text-gray-400 dark:text-gray-400 uppercase font-medium">Stock / Qty</div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {(() => { const a = variationAvail(matchedVar); if (a == null) return "—"; if (a <= 0) return <span className="text-red-600 dark:text-red-300 font-bold">Out of stock</span>; const m = varBalMap.get(matchedVar.id!)?.minStock ?? 0; return <span className={m > 0 && a <= m ? "text-amber-600 dark:text-amber-300" : "text-gray-700 dark:text-gray-200"}>{a} in stock</span>; })()}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => { const a = variationAvail(matchedVar); setVarQty((q) => Math.max(1, Math.min(q - 1, a ?? q))) }} disabled={varQty <= 1} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30"><Minus className="h-3 w-3" /></button>
                            <input type="number" min={1} max={variationAvail(matchedVar) ?? undefined} value={varQty} onChange={(e) => { const a = variationAvail(matchedVar); const v = Math.max(1, Number(e.target.value) || 1); setVarQty(a != null ? Math.min(v, a) : v) }} className="w-12 text-center text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-1 py-1" />
                            <button onClick={() => { const a = variationAvail(matchedVar); setVarQty((q) => Math.min(q + 1, a ?? q)) }} disabled={(() => { const a = variationAvail(matchedVar); return a != null && varQty >= a })()} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30"><Plus className="h-3 w-3" /></button>
                          </div>
                        </div>
                      </div>
                    )}
                    {matchedVar && (
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">{matchedVar.componentName || matchedVar.variantType || varProduct.name} {matchedVar.color ? `· ${matchedVar.color}` : ""} · Size {matchedVar.size || matchedVar.variantValue}</div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 shrink-0 bg-white dark:bg-gray-900">
              <button onClick={() => setVarPickerOpen(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={confirmVarAdd} disabled={!matchedVar || (variationAvail(matchedVar) != null && variationAvail(matchedVar)! <= 0)} className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] disabled:opacity-50 flex items-center gap-2"><ShoppingCart className="h-4 w-4" />{variationAvail(matchedVar) != null && variationAvail(matchedVar)! <= 0 ? "Out of Stock" : "Add to Cart"}</button>
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
