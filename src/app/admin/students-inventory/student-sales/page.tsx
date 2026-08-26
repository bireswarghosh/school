"use client"

import { useEffect, useMemo, useState } from "react"
import { UserCheck, ShoppingCart, Plus, Minus, Trash2, Ticket, Save, Package, BookOpen, X } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"
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

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"

const round2 = (n: number) => Math.round(n * 100) / 100

export default function StudentSalesPage() {
  const { data: products } = useApi<Product>("/api/students-inventory/product")
  const { data: books } = useApi<Book>("/api/students-inventory/book")
  const { data: classes } = useApi<Class>("/api/classes")
  const { data: coupons } = useApi<Coupon>("/api/students-inventory/coupon")
  const { data: sales, refetch } = useApi<Sale>("/api/students-inventory/sale")
  const { symbol } = useCurrency()

  const money = (v: number) => `${symbol}${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const activeCoupons = useMemo(() => coupons.filter((c) => c.status === "Active"), [coupons])

  const [admissionNo, setAdmissionNo] = useState("")
  const [student, setStudent] = useState<{ id: number; name: string; className?: string; sectionName?: string } | null>(null)
  const [findState, setFindState] = useState<"idle" | "loading" | "found" | "notfound">("idle")
  const [catalogTab, setCatalogTab] = useState<"products" | "books">("products")
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [couponId, setCouponId] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("Paid")
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

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
        if (data.student.admissionNo) setAdmissionNo(data.student.admissionNo)
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
      setStudent({ id: data.id, name: data.name, className: data.className, sectionName: data.sectionName })
      setFindState("found")
    } catch {
      setFindState("notfound")
    }
  }

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
      notify.success(`Sale recorded — ${cart.length} item${cart.length === 1 ? "" : "s"}, total ${money(total)}`)
      setCart([])
      setCouponId("")
      setPaymentStatus("Paid")
      setSaleDate(new Date().toISOString().slice(0, 10))
      setAdmissionNo("")
      setStudent(null)
      setFindState("idle")
      await refetch()
    } catch (e: any) {
      setFormErrors({ form: e.message || "Failed to record sale" })
    } finally {
      setSaving(false)
    }
  }

  const productName = (sale: Sale) => {
    if (sale.bookId) return books.find((b) => b.id === sale.bookId)?.title ?? `Book #${sale.bookId}`
    return products.find((p) => p.id === sale.productId)?.name ?? `Product #${sale.productId}`
  }

  const recentSales = sales.slice(0, 15)

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
                  className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  <UserCheck className="h-4 w-4" />
                  {findState === "loading" ? "Finding..." : "Find"}
                </button>
              </div>
              {formErrors.student && <p className="text-red-500 text-xs mt-1">{formErrors.student}</p>}
              {findState === "found" && student && (
                <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                  <span className="font-medium">{student.name}</span>
                  {student.className && <span> - {student.className}</span>}
                  {student.sectionName && <span> / {student.sectionName}</span>}
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
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">No sales yet</td>
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
    </div>
  )
}
