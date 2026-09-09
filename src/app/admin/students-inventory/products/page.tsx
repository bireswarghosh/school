"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Pencil, Trash2, X, Layers, SlidersHorizontal, Package, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { ProductIcon, IconPicker, getIconColors, InventoryBadge, IconImageField } from "@/lib/inventory-icons"

type Category = { id?: number; name: string }
type Brand = { id?: number; name: string }
type Unit = { id?: number; name: string }

type Product = {
  id?: number
  name: string
  code?: string
  categoryId?: number | null
  brandId?: number | null
  unitId?: number | null
  purchasePrice?: number | string
  sellingPrice?: number | string
  minStock?: number
  barcode?: string
  description?: string
  icon?: string
  iconImage?: string
}

type Variation = {
  id?: number
  productId: number
  componentName?: string
  color?: string
  size?: string
  price?: number
  sku?: string
  barcode?: string
  quantity?: number
  variantType?: string
  variantValue?: string
  additionalPrice?: number
}

type Form = {
  name: string
  code: string
  categoryId: string
  brandId: string
  unitId: string
  purchasePrice: string
  sellingPrice: string
  minStock: string
  barcode: string
  description: string
  icon: string
  iconImage: string
}

const initialForm: Form = {
  name: "",
  code: "",
  categoryId: "",
  brandId: "",
  unitId: "",
  purchasePrice: "",
  sellingPrice: "",
  minStock: "",
  barcode: "",
  description: "",
  icon: "",
  iconImage: "",
}

const inr = (n: string | number | null | undefined) => "&#8377;" + Number(n || 0).toLocaleString("en-IN")

const selectCls = "w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
const inputCls = "w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"

export default function ProductMasterPage() {
  const { data: products, add, update, remove } = useApi<Product>("/api/students-inventory/product")
  const { data: categories } = useApi<Category>("/api/students-inventory/category")
  const { data: brands } = useApi<Brand>("/api/students-inventory/brand")
  const { data: units } = useApi<Unit>("/api/students-inventory/unit")
  const { data: variations, add: addVar, update: updateVar, remove: removeVar, refetch: refetchVar } = useApi<Variation>("/api/students-inventory/variation")

  const [filter, setFilter] = useState("")
  const [form, setForm] = useState<Form>(initialForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Form>(initialForm)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Variable product state
  const [variantProduct, setVariantProduct] = useState<Product | null>(null)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [variantForm, setVariantForm] = useState({ componentName: "", color: "", size: "", price: "", sku: "", quantity: "" })
  const [variantFormErrors, setVariantFormErrors] = useState<Record<string,string>>({})
  const [editingVariantId, setEditingVariantId] = useState<number|null>(null)
  const [variantFilter, setVariantFilter] = useState("")
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkForm, setBulkForm] = useState({ componentName: "", color: "", basePrice: "", quantity: "1", skuPrefix: "" })
  const [bulkSizesText, setBulkSizesText] = useState("20,22,24,26,28,30,32,34,36,38,40,42,44,S,L,XL")
  const [bulkPricesText, setBulkPricesText] = useState("350,350,350,350,350,350,350,350,350,350,350,350,350,350,350,350")
  const [bulkPrices, setBulkPrices] = useState<Record<string,string>>({})
  const [bulkSaving, setBulkSaving] = useState(false)

  const productVariants = useMemo(()=> {
    if(!variantProduct?.id) return []
    return variations.filter(v=> v.productId === variantProduct.id)
  }, [variations, variantProduct])
  const filteredVariants = useMemo(()=> {
    if(!variantFilter) return productVariants
    const q=variantFilter.toLowerCase()
    return productVariants.filter(v=> (v.componentName||"").toLowerCase().includes(q) || (v.color||"").toLowerCase().includes(q) || (v.size||"").toLowerCase().includes(q))
  }, [productVariants, variantFilter])

  const openVariantModal = (p: Product) => {
    setVariantProduct(p)
    setVariantForm({ componentName:"", color:"", size:"", price:"", sku:"", quantity:"" })
    setBulkForm({ componentName: p.name.replace(/BLUE/i,"").trim() || p.name, color:"BLUE", basePrice:"350", quantity:"1", skuPrefix:"" })
    setBulkSizesText("20,22,24,26,28,30,32,34,36,38,40,42,44,S,L,XL")
    setBulkPricesText("350,360,370,380,390,400,410,420,430,440,450,460,470,350,350,350")
    setBulkPrices({})
    setBulkMode(false)
    setVariantFormErrors({})
    setEditingVariantId(null)
    setVariantFilter("")
    setShowVariantModal(true)
  }
  const handleVariantSave = async () => {
    if(!variantProduct?.id) return
    const errs: Record<string,string>={}
    if(!variantForm.componentName.trim()) errs.componentName="Required"
    if(!variantForm.size.trim()) errs.size="Required"
    if(!variantForm.price.trim() || isNaN(Number(variantForm.price))) errs.price="Valid price required"
    setVariantFormErrors(errs)
    if(Object.keys(errs).length) return
    const payload:any = {
      productId: variantProduct.id,
      componentName: variantForm.componentName.trim(),
      color: variantForm.color.trim() || undefined,
      size: variantForm.size.trim(),
      price: Number(variantForm.price),
      sku: variantForm.sku.trim() || undefined,
      quantity: variantForm.quantity ? Number(variantForm.quantity) : 0,
      // keep legacy fields for compatibility
      variantType: variantForm.componentName.trim() + (variantForm.color.trim() ? ` (${variantForm.color.trim()})`:""),
      variantValue: variantForm.size.trim(),
      additionalPrice: Number(variantForm.price),
    }
    if(editingVariantId){
      await updateVar(editingVariantId, payload)
      setEditingVariantId(null)
    } else {
      await addVar(payload)
    }
    setVariantForm({ componentName:"", color:"", size:"", price:"", sku:"", quantity:"" })
    setVariantFormErrors({})
  }
  const startEditVariant = (v: Variation) => {
    setEditingVariantId(v.id!)
    setVariantForm({
      componentName: v.componentName || v.variantType || "",
      color: v.color || "",
      size: v.size || v.variantValue || "",
      price: v.price !== undefined && v.price !== null ? String(v.price) : v.additionalPrice !== undefined ? String(v.additionalPrice) : "",
      sku: v.sku || "",
      quantity: v.quantity !== undefined ? String(v.quantity) : "",
    })
  }
  const handleDeleteVariant = async (id:number) => { await removeVar(id); if(editingVariantId===id){ setEditingVariantId(null); setVariantForm({ componentName:"", color:"", size:"", price:"", sku:"", quantity:"" }) } }

  const parsedBulkSizes = useMemo(()=> bulkSizesText.split(/[\s,]+/).map(s=>s.trim()).filter(Boolean), [bulkSizesText])
  const parsedBulkPrices = useMemo(()=> bulkPricesText.split(/[\s,]+/).map(s=>s.trim()).filter(Boolean), [bulkPricesText])
  const autoSku = (size:string) => {
    if(bulkForm.skuPrefix.trim()) return `${bulkForm.skuPrefix.trim()}-${size}`
    const comp = (bulkForm.componentName||"ITEM").trim().toUpperCase().replace(/\s+/g,'-').slice(0,12) || "ITEM"
    const col = (bulkForm.color||"NA").trim().toUpperCase().slice(0,5)
    return `${comp}-${col}-${size}`.replace(/--+/g,'-')
  }
  const bulkCombined = useMemo(()=>{
    const max = Math.max(parsedBulkSizes.length, parsedBulkPrices.length)
    if(max===0) return [] as {size:string, price:string}[]
    return parsedBulkSizes.map((sz,i)=> ({ size: sz, price: parsedBulkPrices[i] ?? bulkPrices[sz] ?? bulkForm.basePrice ?? "" }))
  }, [parsedBulkSizes, parsedBulkPrices, bulkPrices, bulkForm.basePrice])
  const handleBulkCreate = async () => {
    if(!variantProduct?.id) return
    if(!bulkForm.componentName.trim()){ setVariantFormErrors({ componentName:"Required" }); return }
    if(parsedBulkSizes.length===0) return
    if(parsedBulkPrices.length>0 && parsedBulkPrices.length !== parsedBulkSizes.length){
      setVariantFormErrors({ price:`Sizes (${parsedBulkSizes.length}) and Prices (${parsedBulkPrices.length}) count must match` }); return
    }
    for(const row of bulkCombined){
      const p = row.price
      if(!p || isNaN(Number(p))) { setVariantFormErrors({ price:`Price for size ${row.size} required` }); return }
    }
    setBulkSaving(true)
    try{
      const makeKey = (c:string,s:string,comp:string) => `${(comp||"").trim().toUpperCase()}|${(c||"").trim().toUpperCase()}|${(s||"").trim()}`
      const bulkComp = bulkForm.componentName.trim()
      const bulkCol = bulkForm.color.trim()
      const existingKeys = new Set(productVariants.map(v=> makeKey(v.color||"", v.size||v.variantValue||"", v.componentName||v.variantType||"")))
      let created=0
      for(const row of bulkCombined){
        const sz = row.size
        const key = makeKey(bulkCol, sz, bulkComp)
        if(existingKeys.has(key)) continue
        const priceStr = row.price
        const payload:any={
          productId: variantProduct.id,
          componentName: bulkForm.componentName.trim(),
          color: bulkForm.color.trim() || undefined,
          size: sz,
          price: Number(priceStr),
          sku: autoSku(sz),
          quantity: bulkForm.quantity ? Number(bulkForm.quantity) : 1,
          variantType: bulkForm.componentName.trim() + (bulkForm.color.trim() ? ` (${bulkForm.color.trim()})`:""),
          variantValue: sz,
          additionalPrice: Number(priceStr),
        }
        await addVar(payload)
        created++
      }
      if(created===0) alert("All sizes already exist — no new variations created.")
      else { setBulkPrices({}); }
    } finally { setBulkSaving(false) }
  }

  const variantCount = (productId?: number) => variations.filter(v=> v.productId===productId).length

  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc"|"desc">("asc")
  const handleSort = (key: string) => {
    if(sortKey===key) setSortDir(d=> d==="asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }
  const SortIcon = ({k}:{k:string}) => {
    if(sortKey!==k) return <ChevronsUpDown className="h-3 w-3 text-gray-400" />
    return sortDir==="asc" ? <ArrowUp className="h-3 w-3 text-[var(--primary)]" /> : <ArrowDown className="h-3 w-3 text-[var(--primary)]" />
  }

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (filter) {
        const q = filter.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !(p.code || "").toLowerCase().includes(q)) return false
      }
      return true
    })
    if(sortKey){
      const dir = sortDir==="asc" ? 1 : -1
      const catMap = new Map(categories.map(c=>[c.id, c.name]))
      const brandMap = new Map(brands.map(b=>[b.id, b.name]))
      const unitMap = new Map(units.map(u=>[u.id, u.name]))
      list = [...list].sort((a:any,b:any)=>{
        let av:any, bv:any
        switch(sortKey){
          case "name": av=a.name||""; bv=b.name||""; return String(av).localeCompare(String(bv))*dir
          case "code": av=a.code||""; bv=b.code||""; return String(av).localeCompare(String(bv))*dir
          case "category": av=catMap.get(a.categoryId)||""; bv=catMap.get(b.categoryId)||""; return String(av).localeCompare(String(bv))*dir
          case "brand": av=brandMap.get(a.brandId)||""; bv=brandMap.get(b.brandId)||""; return String(av).localeCompare(String(bv))*dir
          case "unit": av=unitMap.get(a.unitId)||""; bv=unitMap.get(b.unitId)||""; return String(av).localeCompare(String(bv))*dir
          case "purchasePrice": av=Number(a.purchasePrice)||0; bv=Number(b.purchasePrice)||0; return (av-bv)*dir
          case "sellingPrice": av=Number(a.sellingPrice)||0; bv=Number(b.sellingPrice)||0; return (av-bv)*dir
          case "minStock": av=Number(a.minStock)||0; bv=Number(b.minStock)||0; return (av-bv)*dir
          default: return 0
        }
      })
    }
    return list
  }, [products, filter, sortKey, sortDir, categories, brands, units])

  const catName = (id?: number | null) => categories.find((c) => c.id === id)?.name || "-"
  const brandName = (id?: number | null) => brands.find((b) => b.id === id)?.name || "-"
  const unitName = (id?: number | null) => units.find((u) => u.id === id)?.name || "-"

  const formToPayload = (f: Form) => ({
    name: f.name.trim(),
    code: f.code.trim() || undefined,
    categoryId: f.categoryId ? Number(f.categoryId) : null,
    brandId: f.brandId ? Number(f.brandId) : null,
    unitId: f.unitId ? Number(f.unitId) : null,
    purchasePrice: f.purchasePrice !== "" ? Number(f.purchasePrice) : undefined,
    sellingPrice: f.sellingPrice !== "" ? Number(f.sellingPrice) : undefined,
    minStock: f.minStock !== "" ? Number(f.minStock) : undefined,
    barcode: f.barcode.trim() || undefined,
    description: f.description.trim() || undefined,
    icon: f.icon || undefined,
    iconImage: f.iconImage || undefined,
  })

  const validate = (f: Form) => {
    const errs: Record<string, string> = {}
    if (!f.name.trim()) errs.name = "Required"
    return errs
  }

  const handleAdd = async () => {
    const errs = validate(form)
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    await add(formToPayload(form))
    setForm(initialForm)
    setShowAddModal(false)
  }

  const openEdit = (p: Product) => {
    setEditId(p.id ?? null)
    setEditForm({
      name: p.name || "",
      code: p.code || "",
      categoryId: p.categoryId ? String(p.categoryId) : "",
      brandId: p.brandId ? String(p.brandId) : "",
      unitId: p.unitId ? String(p.unitId) : "",
      purchasePrice: p.purchasePrice !== undefined && p.purchasePrice !== null ? String(p.purchasePrice) : "",
      sellingPrice: p.sellingPrice !== undefined && p.sellingPrice !== null ? String(p.sellingPrice) : "",
      minStock: p.minStock !== undefined && p.minStock !== null ? String(p.minStock) : "",
      barcode: p.barcode || "",
      description: p.description || "",
      icon: (p as any).icon || "",
      iconImage: (p as any).iconImage || "",
    })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (editId === null) return
    const errs = validate(editForm)
    setEditErrors(errs)
    if (Object.keys(errs).length > 0) return
    await update(editId, formToPayload(editForm))
    setShowEditModal(false)
    setEditId(null)
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  const modalField = (form: Form, setForm: (f: Form) => void, errors: Record<string, string>, setErrors: (e: Record<string, string>) => void) => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({}) }}
          className={inputCls}
          placeholder="Enter product name"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
        <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputCls} placeholder="Enter product code" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={selectCls}>
          <option value="">Select category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
        <select value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })} className={selectCls}>
          <option value="">Select brand</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
        <select value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} className={selectCls}>
          <option value="">Select unit</option>
          {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
          <input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} className={inputCls} placeholder="0.00" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
          <input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} className={inputCls} placeholder="0.00" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
        <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className={inputCls} placeholder="0" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
        <input type="text" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className={inputCls} placeholder="Enter barcode" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputCls} placeholder="Enter description" />
      </div>
      <div>
        <IconImageField name={form.name} icon={form.icon} iconImage={form.iconImage} onIconChange={(v)=> setForm({ ...form, icon: v })} onImageChange={(v)=> setForm({ ...form, iconImage: v })} label="Icon — pick, upload (→WebP) or AI generate" />
      </div>
    </>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Product Master</h2>
          <p className="text-sm text-white/80 mt-1">Students Inventory / Product Master</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Product Master List</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] w-56"
                placeholder="Search product"
              />
            </div>
            <button
              onClick={() => { setForm(initialForm); setFormErrors({}); setShowAddModal(true) }}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase cursor-pointer select-none hover:text-[var(--primary)]" onClick={()=>handleSort("name")}><span className="inline-flex items-center gap-1">Product <SortIcon k="name" /></span></th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase cursor-pointer select-none hover:text-[var(--primary)]" onClick={()=>handleSort("code")}><span className="inline-flex items-center gap-1">Code <SortIcon k="code" /></span></th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase cursor-pointer select-none hover:text-[var(--primary)]" onClick={()=>handleSort("category")}><span className="inline-flex items-center gap-1">Category <SortIcon k="category" /></span></th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase cursor-pointer select-none hover:text-[var(--primary)]" onClick={()=>handleSort("brand")}><span className="inline-flex items-center gap-1">Brand <SortIcon k="brand" /></span></th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase cursor-pointer select-none hover:text-[var(--primary)]" onClick={()=>handleSort("unit")}><span className="inline-flex items-center gap-1">Unit <SortIcon k="unit" /></span></th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase cursor-pointer select-none hover:text-[var(--primary)]" onClick={()=>handleSort("purchasePrice")}><span className="inline-flex items-center gap-1">Purchase Price <SortIcon k="purchasePrice" /></span></th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase cursor-pointer select-none hover:text-[var(--primary)]" onClick={()=>handleSort("sellingPrice")}><span className="inline-flex items-center gap-1">Selling Price <SortIcon k="sellingPrice" /></span></th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase cursor-pointer select-none hover:text-[var(--primary)]" onClick={()=>handleSort("minStock")}><span className="inline-flex items-center gap-1">Min Stock <SortIcon k="minStock" /></span></th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Variants</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-400">No products found</td>
                </tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">{(() => { const cat = categories.find(c=> c.id===p.categoryId); const effIcon = (p as any).icon || (cat as any)?.icon; const effImage = (p as any).iconImage || (cat as any)?.iconImage; return <InventoryBadge name={p.name} icon={effIcon} iconImage={effImage} categoryName={cat?.name} size={32} /> })()}{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.code || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{catName(p.categoryId)}</td>
                    <td className="px-4 py-3 text-gray-600">{brandName(p.brandId)}</td>
                    <td className="px-4 py-3 text-gray-600">{unitName(p.unitId)}</td>
                    <td className="px-4 py-3 text-gray-600" dangerouslySetInnerHTML={{ __html: inr(p.purchasePrice) }} />
                    <td className="px-4 py-3 text-gray-600" dangerouslySetInnerHTML={{ __html: inr(p.sellingPrice) }} />
                    <td className="px-4 py-3 text-gray-600">{p.minStock ?? "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openVariantModal(p)} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${variantCount(p.id)>0 ? "bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]/20" : "bg-gray-100 text-gray-600 border-gray-200"} hover:bg-[var(--primary-light)]`} title="Manage variants">
                        <SlidersHorizontal className="h-3 w-3" /> {variantCount(p.id)>0 ? `${variantCount(p.id)} vars` : "Add vars"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openVariantModal(p)} className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg" title="Variables">
                          <SlidersHorizontal className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(p)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setDeleteId(p.id ?? null); setShowDeleteModal(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length} of {products.length} records</span>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col z-10 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><Layers className="h-4 w-4 text-white" /></span>
                Add Product
              </h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-gray-50/50 dark:bg-gray-800/30">
              {modalField(form, setForm, formErrors, setFormErrors)}
            </div>
            <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={handleAdd} className="px-7 py-2 bg-[var(--primary)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--secondary)] shadow-md shadow-[var(--primary)]/20 transition-all">Save Product</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col z-10 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><Pencil className="h-4 w-4 text-white" /></span>
                Edit Product
              </h3>
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-gray-50/50 dark:bg-gray-800/30">
              {modalField(editForm, setEditForm, editErrors, setEditErrors)}
            </div>
            <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={handleUpdate} className="px-7 py-2 bg-[var(--primary)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--secondary)] shadow-md shadow-[var(--primary)]/20 transition-all">Update</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md z-10 border dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Are you sure you want to delete this product?</p>
              {deleteId !== null && <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1">{products.find((p) => p.id === deleteId)?.name}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 bg-white dark:bg-gray-900">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showVariantModal && variantProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={()=> setShowVariantModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col z-10 border dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2"><Package className="h-5 w-5 text-[var(--primary)]"/> {variantProduct.name} — Variables</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">School Uniform: Add Component × Color × Size with price. Example: Boys Half Pant — Blue — Size 20 → ₹350</p>
              </div>
              <button onClick={()=> setShowVariantModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Add / Edit form - Single vs Bulk */}
              <div className="rounded-xl border border-[var(--primary)]/20 dark:border-gray-700 bg-[var(--primary-light)]/50 dark:bg-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-[var(--primary)] flex items-center gap-2"><SlidersHorizontal className="h-4 w-4"/>{editingVariantId ? "Edit Variant" : bulkMode ? "Bulk Create Variations" : "Add Variant"}</h4>
                  {!editingVariantId && (
                    <div className="flex rounded-lg border border-[var(--primary)]/20 overflow-hidden">
                      <button onClick={()=> setBulkMode(false)} className={`px-3 py-1 text-xs font-medium ${!bulkMode ? "bg-[var(--primary)] text-white" : "bg-white text-[var(--primary)] hover:bg-[var(--primary-light)]"}`}>Single</button>
                      <button onClick={()=> setBulkMode(true)} className={`px-3 py-1 text-xs font-medium ${bulkMode ? "bg-[var(--primary)] text-white" : "bg-white text-[var(--primary)] hover:bg-[var(--primary-light)]"}`}>Bulk</button>
                    </div>
                  )}
                </div>
                {!bulkMode || editingVariantId ? (
                <>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Component *</label>
                    <input value={variantForm.componentName} onChange={(e)=>{ setVariantForm({...variantForm, componentName:e.target.value}); if(variantFormErrors.componentName) setVariantFormErrors({}) }} placeholder="e.g. Boys Half Pant" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-2 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                    {variantFormErrors.componentName && <p className="text-red-500 text-xs mt-1">{variantFormErrors.componentName}</p>}
                    <p className="text-[11px] text-gray-500 mt-1">Boys Half Pant, Bag, Blazer…</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                    <input value={variantForm.color} onChange={(e)=> setVariantForm({...variantForm, color:e.target.value})} placeholder="Blue / Brown or blank" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-2 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Size *</label>
                    <input value={variantForm.size} onChange={(e)=>{ setVariantForm({...variantForm, size:e.target.value}); if(variantFormErrors.size) setVariantFormErrors({}) }} placeholder="20, 22, S, L" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-2 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)]" />
                    {variantFormErrors.size && <p className="text-red-500 text-xs mt-1">{variantFormErrors.size}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Price *</label>
                    <input type="number" value={variantForm.price} onChange={(e)=>{ setVariantForm({...variantForm, price:e.target.value}); if(variantFormErrors.price) setVariantFormErrors({}) }} placeholder="350" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-2 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)]" />
                    {variantFormErrors.price && <p className="text-red-500 text-xs mt-1">{variantFormErrors.price}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Qty</label>
                    <input type="number" value={variantForm.quantity} onChange={(e)=> setVariantForm({...variantForm, quantity:e.target.value})} placeholder="0" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-2 py-2 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-3">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">SKU (optional)</label>
                    <input value={variantForm.sku} onChange={(e)=> setVariantForm({...variantForm, sku:e.target.value})} placeholder="e.g. HP-BLUE-20" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-2 py-2 text-sm" />
                  </div>
                  <div className="md:col-span-3 flex items-end gap-2">
                    <button onClick={handleVariantSave} className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] flex items-center gap-2"><Plus className="h-4 w-4"/>{editingVariantId ? "Update" : "Add"} Variant</button>
                    {editingVariantId && <button onClick={()=>{ setEditingVariantId(null); setVariantForm({ componentName:"", color:"", size:"", price:"", sku:"", quantity:"" }); setVariantFormErrors({}) }} className="px-4 py-2 text-sm border rounded-lg bg-white">Cancel Edit</button>}
                  </div>
                </div>
                </>
                ) : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Component *</label>
                    <input value={bulkForm.componentName} onChange={(e)=> setBulkForm({...bulkForm, componentName:e.target.value})} placeholder="Boys Half Pant" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-2 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                    <input value={bulkForm.color} onChange={(e)=> setBulkForm({...bulkForm, color:e.target.value})} placeholder="BLUE" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-2 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Base Price *</label>
                    <input type="number" value={bulkForm.basePrice} onChange={(e)=> setBulkForm({...bulkForm, basePrice:e.target.value})} placeholder="350" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-2 py-2 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Qty (each) default 1</label>
                    <input type="number" value={bulkForm.quantity} onChange={(e)=> setBulkForm({...bulkForm, quantity:e.target.value})} placeholder="1" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-2 py-2 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">SKU Prefix (auto if empty)</label>
                    <input value={bulkForm.skuPrefix} onChange={(e)=> setBulkForm({...bulkForm, skuPrefix:e.target.value})} placeholder="HP-BLUE (auto: BOYS-HALF-PANT-BLUE-20)" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-2 py-2 text-sm" />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sizes — comma or newline separated *</label>
                    <textarea value={bulkSizesText} onChange={(e)=> setBulkSizesText(e.target.value)} rows={4} placeholder="20,22,24,26,28,30,32,34,36,38,40,42,44,S,L,XL" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm font-mono h-24" />
                    <p className="text-[11px] text-gray-500 mt-1">{parsedBulkSizes.length} sizes</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Prices — comma or newline separated * (same order as sizes)</label>
                    <textarea value={bulkPricesText} onChange={(e)=> setBulkPricesText(e.target.value)} rows={4} placeholder="350,360,370,380,390,400,410,420,430,440,450,460,470,350,350,350" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm font-mono h-24" />
                    <p className="text-[11px] text-gray-500 mt-1">{parsedBulkPrices.length} prices {parsedBulkPrices.length !== parsedBulkSizes.length && parsedBulkPrices.length>0 ? <span className="text-red-500">· count must match sizes!</span> : ""}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-1">
                  <button onClick={()=> { const map:Record<string,string>={}; parsedBulkSizes.forEach(s=> map[s]= bulkForm.basePrice); setBulkPrices(map); if(parsedBulkSizes.length>0){ setBulkPricesText(parsedBulkSizes.map(()=> bulkForm.basePrice).join(",")) } }} className="text-[11px] text-[var(--primary)] hover:text-[var(--primary)] font-medium">Apply base price to all</button>
                </div>
                {parsedBulkSizes.length>0 && (
                  <div className="mt-3 rounded-lg border border-gray-200 overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700"><th className="text-left px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Size</th><th className="text-left px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Price *</th><th className="text-center px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Qty</th><th className="text-left px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">SKU (auto)</th><th className="text-center px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Status</th></tr></thead>
                      <tbody>
                        {bulkCombined.map(row=>{
                          const exists = productVariants.some(v=> (v.size||v.variantValue||"").trim()===row.size.trim() && (v.color||"").trim().toUpperCase()===bulkForm.color.trim().toUpperCase() && (v.componentName||v.variantType||"").trim().toUpperCase()===bulkForm.componentName.trim().toUpperCase())
                          return (
                            <tr key={row.size} className={`border-b dark:border-gray-700 ${exists ? "bg-amber-50/50 dark:bg-amber-950/20" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                              <td className="px-3 py-1.5 font-medium text-gray-800 dark:text-gray-100">{row.size}</td>
                              <td className="px-3 py-1.5"><input type="number" value={row.price} onChange={(e)=> {
                                const idx = parsedBulkSizes.indexOf(row.size)
                                if(idx>=0){
                                  const arr = bulkPricesText.split(/[\s,]+/).map(s=>s.trim()).filter(Boolean)
                                  // ensure length
                                  while(arr.length < parsedBulkSizes.length) arr.push(bulkForm.basePrice)
                                  arr[idx]= e.target.value
                                  setBulkPricesText(arr.join(","))
                                } else {
                                  setBulkPrices(prev=> ({...prev, [row.size]: e.target.value}))
                                }
                              }} placeholder="350" className="w-24 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-2 py-1 text-sm" disabled={exists} /></td>
                              <td className="px-3 py-1.5 text-center text-xs text-gray-600 dark:text-gray-400">{bulkForm.quantity || "1"}</td>
                              <td className="px-3 py-1.5 font-mono text-xs text-gray-500 dark:text-gray-400">{autoSku(row.size)}</td>
                              <td className="px-3 py-1.5 text-center">{exists ? <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium">Exists</span> : <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-medium">New</span>}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <button onClick={handleBulkCreate} disabled={bulkSaving} className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] disabled:opacity-50 flex items-center gap-2"><Plus className="h-4 w-4"/>{bulkSaving ? "Creating..." : `Bulk Create ${bulkCombined.filter(row=> !productVariants.some(v=> (v.size||v.variantValue||"").trim()===row.size.trim() && (v.color||"").trim().toUpperCase()===bulkForm.color.trim().toUpperCase() && (v.componentName||v.variantType||"").trim().toUpperCase()===bulkForm.componentName.trim().toUpperCase())).length} Variations`}</button>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">Each size becomes Component + Color + Size → Price with Qty 1 and auto SKU. Edit Price per size above before creating.</p>
                </>
                )}
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-xs"><Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/><input value={variantFilter} onChange={(e)=> setVariantFilter(e.target.value)} placeholder="Filter by component / color / size" className="pl-9 pr-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 text-sm" /></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{filteredVariants.length} of {productVariants.length} variants</span>
              </div>

              {/* Variants table grouped */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700"><th className="text-left px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">#</th><th className="text-left px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Component</th><th className="text-left px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Color</th><th className="text-left px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Size</th><th className="text-right px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Price</th><th className="text-center px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Qty</th><th className="text-left px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">SKU</th><th className="text-right px-3 py-2 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">Action</th></tr></thead>
                  <tbody>
                    {filteredVariants.length===0 ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">No variants yet. Add Boys Half Pant / Bag / Blazer etc. with Color + Size + Price.</td></tr> :
                    filteredVariants.map((v, idx)=> (
                      <tr key={v.id} className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${editingVariantId===v.id ? "bg-[var(--primary-light)] dark:bg-primary/30" : idx%2?"bg-gray-50/50 dark:bg-gray-800/50":"bg-white dark:bg-gray-900"}`}>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{idx+1}</td>
                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-100">{v.componentName || v.variantType || "-"}</td>
                        <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs ${v.color ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "text-gray-400 dark:text-gray-500"}`}>{v.color || "—"}</span></td>
                        <td className="px-3 py-2"><span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium">{v.size || v.variantValue || "-"}</span></td>
                        <td className="px-3 py-2 text-right font-medium text-gray-800 dark:text-gray-100" dangerouslySetInnerHTML={{__html: inr(v.price ?? v.additionalPrice)}} />
                        <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{v.quantity ?? 0}</td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">{v.sku || "-"}</td>
                        <td className="px-3 py-2 text-right"><div className="flex justify-end gap-1"><button onClick={()=> startEditVariant(v)} className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg"><Pencil className="h-4 w-4"/></button><button onClick={()=> handleDeleteVariant(v.id!)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"><Trash2 className="h-4 w-4"/></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {productVariants.length>0 && (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-2">Preview Hierarchy (like School Uniform)</p>
                  <div className="space-y-2 text-xs">
                    {Array.from(new Set(productVariants.map(v=> v.componentName || v.variantType || "Other"))).map(comp=> {
                      const comps = productVariants.filter(v=> (v.componentName || v.variantType)===comp)
                      const colors = Array.from(new Set(comps.map(v=> v.color || "No Color")))
                      return (
                        <div key={comp} className="rounded border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 px-3 py-2">
                          <div className="font-medium text-gray-800 dark:text-gray-100">{comp} <span className="text-gray-400 font-normal">({comps.length} variants)</span></div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {colors.map(col=> {
                              const byColor = comps.filter(v=> (v.color||"No Color")===col)
                              return <div key={col} className="text-[11px] text-gray-600 dark:text-gray-400"><span className="font-medium text-[var(--primary)] dark:text-primary">{col}:</span> {byColor.map(v=> `${v.size || v.variantValue}→${inr(v.price ?? v.additionalPrice).replace("&#8377;","₹")}`).join(", ")}</div>
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t dark:border-gray-700 flex justify-end gap-2 shrink-0 bg-white dark:bg-gray-900">
              <button onClick={()=> setShowVariantModal(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
