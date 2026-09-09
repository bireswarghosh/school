"use client"
import {
  Shirt,
  Package,
  BookOpen,
  Backpack,
  Pencil,
  Ruler,
  ShoppingBag,
  Trophy,
  Briefcase,
  Crown,
  Bookmark,
  Book,
  Circle,
  Layers,
  GraduationCap,
  Footprints,
  BadgeCheck,
  ShoppingCart,
  Tag,
  Box,
  Archive,
  Gem,
  Star,
  Heart,
  Zap,
  PenTool,
  NotebookPen,
  School,
  Scissors,
  Palette,
  Calculator,
  FlaskConical,
  BookMarked,
  FileText,
  Library,
  Upload,
  Wand2,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react"
import type { LucideProps } from "lucide-react"
import { useState } from "react"

type IconType = React.ComponentType<LucideProps>

export const ICON_OPTIONS: { name: string; Icon: IconType; keywords: string[]; color: string; bg: string }[] = [
  { name: "Shirt", Icon: Shirt, keywords: ["uniform","shirt","skirt","pant"], color: "#0ea5e9", bg: "#e0f2fe" },
  { name: "Package", Icon: Package, keywords: ["pant","package","trouser","half pant"], color: "#3b82f6", bg: "#dbeafe" },
  { name: "Briefcase", Icon: Briefcase, keywords: ["blazer","jacket","suit"], color: "#475569", bg: "#e2e8f0" },
  { name: "Bookmark", Icon: Bookmark, keywords: ["tie","bookmark"], color: "#dc2626", bg: "#fee2e2" },
  { name: "ShoppingBag", Icon: ShoppingBag, keywords: ["belt","shopping","accessories"], color: "#d97706", bg: "#fef3c7" },
  { name: "Crown", Icon: Crown, keywords: ["cap","crown","hat"], color: "#7c3aed", bg: "#ede9fe" },
  { name: "Backpack", Icon: Backpack, keywords: ["bag","backpack","school bag"], color: "#ea580c", bg: "#ffedd5" },
  { name: "Footprints", Icon: Footprints, keywords: ["shoe","footwear","socks"], color: "#6b7280", bg: "#f3f4f6" },
  { name: "GraduationCap", Icon: GraduationCap, keywords: ["uniform","graduation","school"], color: "#1e40af", bg: "#dbeafe" },
  { name: "School", Icon: School, keywords: ["school","campus"], color: "#1d4ed8", bg: "#dbeafe" },
  { name: "BookOpen", Icon: BookOpen, keywords: ["book","diary","notebook"], color: "#059669", bg: "#d1fae5" },
  { name: "BookMarked", Icon: BookMarked, keywords: ["book","diary"], color: "#047857", bg: "#d1fae5" },
  { name: "Book", Icon: Book, keywords: ["book"], color: "#10b981", bg: "#d1fae5" },
  { name: "NotebookPen", Icon: NotebookPen, keywords: ["notebook","diary"], color: "#0891b2", bg: "#cffafe" },
  { name: "Library", Icon: Library, keywords: ["library","books"], color: "#0f766e", bg: "#ccfbf1" },
  { name: "FileText", Icon: FileText, keywords: ["file","document"], color: "#6366f1", bg: "#e0e7ff" },
  { name: "Pencil", Icon: Pencil, keywords: ["pen","pencil","stationery"], color: "#f59e0b", bg: "#fef3c7" },
  { name: "PenTool", Icon: PenTool, keywords: ["pen","draw"], color: "#f97316", bg: "#ffedd5" },
  { name: "Ruler", Icon: Ruler, keywords: ["ruler","scale","geometry"], color: "#84cc16", bg: "#ecfccb" },
  { name: "Scissors", Icon: Scissors, keywords: ["scissors","tailor","cut"], color: "#e11d48", bg: "#ffe4e6" },
  { name: "Palette", Icon: Palette, keywords: ["palette","art","color"], color: "#ec4899", bg: "#fce7f3" },
  { name: "Calculator", Icon: Calculator, keywords: ["calculator","math"], color: "#8b5cf6", bg: "#ede9fe" },
  { name: "FlaskConical", Icon: FlaskConical, keywords: ["science","flask","lab"], color: "#06b6d4", bg: "#cffafe" },
  { name: "Trophy", Icon: Trophy, keywords: ["sports","trophy","ball","track"], color: "#eab308", bg: "#fef9c3" },
  { name: "Box", Icon: Box, keywords: ["box","parcel"], color: "#a855f7", bg: "#f3e8ff" },
  { name: "Archive", Icon: Archive, keywords: ["store","archive"], color: "#78716c", bg: "#e7e5e4" },
  { name: "ShoppingCart", Icon: ShoppingCart, keywords: ["cart","shop"], color: "#14b8a6", bg: "#ccfbf1" },
  { name: "Tag", Icon: Tag, keywords: ["tag","label","price"], color: "#f43f5e", bg: "#ffe4e6" },
  { name: "Circle", Icon: Circle, keywords: ["ball","circle"], color: "#f97316", bg: "#ffedd5" },
  { name: "Layers", Icon: Layers, keywords: ["category","layers"], color: "#64748b", bg: "#f1f5f9" },
  { name: "BadgeCheck", Icon: BadgeCheck, keywords: ["badge","id","holder"], color: "#0ea5e9", bg: "#e0f2fe" },
  { name: "Gem", Icon: Gem, keywords: ["jewel","premium"], color: "#06b6d4", bg: "#ecfeff" },
  { name: "Star", Icon: Star, keywords: ["star","favorite"], color: "#f59e0b", bg: "#fef3c7" },
  { name: "Heart", Icon: Heart, keywords: ["heart","love"], color: "#ef4444", bg: "#fee2e2" },
  { name: "Zap", Icon: Zap, keywords: ["electric","energy"], color: "#eab308", bg: "#fef9c3" },
]

const iconMap = Object.fromEntries(ICON_OPTIONS.map(o=>[o.name, o.Icon])) as Record<string, IconType>

export function getIconByName(name?: string): IconType | null {
  if(!name) return null
  return (iconMap[name] as IconType) || null
}

export function getIconMeta(name?: string) {
  if(!name) return null
  return ICON_OPTIONS.find(o=> o.name===name) || null
}

function matchIcon(name: string, rules: [string[], IconType][] , fallback: IconType): IconType {
  const n = name.toLowerCase()
  for (const [keywords, Icon] of rules) {
    if (keywords.some((k) => n.includes(k))) return Icon
  }
  return fallback
}

const categoryRules: [string[], IconType][] = [
  [["uniform", "pant", "shirt", "skirt", "blazer", "pullover", "sweater", "tie"], Shirt],
  [["book", "diary", "notebook"], BookOpen],
  [["bag"], Backpack],
  [["stationery", "pen", "pencil"], Pencil],
  [["sports", "ball", "trophy", "track", "t-shirt"], Trophy],
  [["accessories", "belt", "cap", "holder", "id", "badge"], ShoppingBag],
  [["shoe"], Footprints],
]

const productRules: [string[], IconType][] = [
  [["notebook", "diary"], NotebookPen],
  [["book"], BookOpen],
  [["bag"], Backpack],
  [["pen", "pencil"], Pencil],
  [["ruler", "instrument"], Ruler],
  [["blazer"], Briefcase],
  [["cap"], Crown],
  [["tie"], Bookmark],
  [["belt"], ShoppingBag],
  [["id card", "holder", "i card"], BadgeCheck],
  [["pant", "trouser", "half pant", "full pant"], Package],
  [["skirt"], Shirt],
  [["shirt"], Shirt],
  [["pullover", "sweater", "jacket"], Shirt],
  [["t-shirt", "track"], Trophy],
  [["ball", "cricket", "football"], Circle],
  [["uniform"], GraduationCap],
]

export function getCategoryIcon(name: string, explicitIcon?: string): IconType {
  const byName = getIconByName(explicitIcon)
  if(byName) return byName
  return matchIcon(name, categoryRules, Layers)
}

export function getProductIcon(name: string, categoryName?: string, explicitIcon?: string): IconType {
  const byExplicit = getIconByName(explicitIcon)
  if(byExplicit) return byExplicit
  const byName = matchIcon(name, productRules, Package)
  if (byName !== Package) return byName
  if (categoryName) {
    const catIcon = matchIcon(categoryName, categoryRules, Package)
    if (catIcon !== Layers) return catIcon
  }
  return Package
}

export function getIconColors(explicitIcon?: string, fallbackName?: string) {
  if(explicitIcon){
    const m = getIconMeta(explicitIcon)
    if(m) return { color: m.color, bg: m.bg }
  }
  if(fallbackName){
    const prodIcon = matchIcon(fallbackName, productRules, Package)
    const opt = ICON_OPTIONS.find(o=> o.Icon===prodIcon)
    if(opt) return { color: opt.color, bg: opt.bg }
    const catIcon = matchIcon(fallbackName, categoryRules, Layers)
    const opt2 = ICON_OPTIONS.find(o=> o.Icon===catIcon)
    if(opt2) return { color: opt2.color, bg: opt2.bg }
  }
  return { color: "#7c3aed", bg: "#ede9fe" }
}

export function CategoryIcon({ name, icon, className, size = 16 }: { name: string; icon?: string; className?: string; size?: number }) {
  const Icon = getCategoryIcon(name, icon)
  return <Icon size={size} className={className} />
}

export function ProductIcon({ name, categoryName, icon, className, size = 16 }: { name: string; categoryName?: string; icon?: string; className?: string; size?: number }) {
  const Icon = getProductIcon(name, categoryName, icon)
  return <Icon size={size} className={className} />
}

export function IconPicker({ value, onChange, label }: { value?: string; onChange: (v: string)=>void; label?: string }) {
  const [q, setQ] = useState("")
  const filtered = ICON_OPTIONS.filter(o=> !q || o.name.toLowerCase().includes(q.toLowerCase()) || o.keywords.some(k=>k.includes(q.toLowerCase())))
  const preview = getIconMeta(value) || { color: "#7c3aed", bg: "#ede9fe", Icon: Package } as any
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-lg border flex items-center justify-center shrink-0" style={{ background: preview.bg, borderColor: preview.color, color: preview.color }}>
          {(() => { const I = getIconByName(value) || Package; return <I size={20} /> })()}
        </div>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search icon (shirt, book, bag, pant...)" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)]" />
        {value && <button onClick={()=>onChange("")} className="text-xs text-gray-500 hover:text-red-600 px-2">Clear (auto)</button>}
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-44 overflow-y-auto rounded-lg border border-gray-200 p-2 bg-gray-50/50">
        {filtered.map(o=>{
          const selected = value===o.name
          return (
            <button key={o.name} type="button" onClick={()=>onChange(o.name)} title={`${o.name} — ${o.keywords.slice(0,2).join(", ")}`} style={selected ? { background: o.color, color: "#fff", borderColor: o.color } : { background: o.bg, color: o.color, borderColor: o.bg }} className="flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors hover:opacity-90">
              <o.Icon size={18} />
              <span className="text-[9px] leading-none truncate w-full text-center">{o.name}</span>
            </button>
          )
        })}
        {filtered.length===0 && <span className="text-xs text-gray-400 col-span-6">No icons match</span>}
      </div>
      <p className="text-[11px] text-gray-400 mt-1">Auto picks colorful icon from name if empty. Pant→blue, Shirt→sky, Blazer→slate, Tie→red, Bag→orange. Click to override.</p>
    </div>
  )
}

export function InventoryBadge({ name, icon, iconImage, size = 32, categoryName }: { name: string; icon?: string; iconImage?: string; size?: number; categoryName?: string }) {
  const dim = size
  if (iconImage) {
    return <img src={iconImage} alt={name} width={dim} height={dim} className="rounded-lg object-cover border shrink-0" style={{ width: dim, height: dim, borderColor: "#e5e7eb" }} />
  }
  const col = getIconColors(icon, name || categoryName)
  const I = getIconByName(icon) || getProductIcon(name, categoryName, icon) || getCategoryIcon(name, icon)
  const Icon = I as IconType
  return <span className="rounded-lg border flex items-center justify-center shrink-0" style={{ width: dim, height: dim, background: col.bg, color: col.color, borderColor: col.bg }}><Icon size={Math.round(dim * 0.5)} /></span>
}

export function IconImageField({ name, icon, iconImage, onIconChange, onImageChange, label }: { name: string; icon?: string; iconImage?: string; onIconChange: (v:string)=>void; onImageChange: (v:string)=>void; label?: string }) {
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [tab, setTab] = useState<"icon"|"upload"|"ai">("icon")

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if(!f) return
    setUploading(true)
    try{
      const fd = new FormData()
      fd.append("files", f)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || "Upload failed")
      const url = data.files?.[0]?.url
      if(url) onImageChange(url)
    } catch(err:any){ alert(err.message || "Upload failed") } finally { setUploading(false); e.target.value="" }
  }

  const handleGenerate = async () => {
    if(!name.trim()) { alert("Enter product/category name first"); return }
    setGenerating(true)
    try{
      const res = await fetch("/api/ai/generate-icon", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ name })})
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || "Generate failed")
      if(data.url) onImageChange(data.url)
    } catch(err:any){ alert(err.message || "AI generate failed") } finally { setGenerating(false) }
  }

  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
      <div className="flex gap-1 mb-2">
        <button type="button" onClick={()=> setTab("icon")} className={`px-2.5 py-1 text-xs font-medium rounded-full border ${tab==="icon" ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white text-gray-600 border-gray-200"}`}>Icon</button>
        <button type="button" onClick={()=> setTab("upload")} className={`px-2.5 py-1 text-xs font-medium rounded-full border flex items-center gap-1 ${tab==="upload" ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white text-gray-600 border-gray-200"}`}><Upload size={12}/> Upload</button>
        <button type="button" onClick={()=> setTab("ai")} className={`px-2.5 py-1 text-xs font-medium rounded-full border flex items-center gap-1 ${tab==="ai" ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white text-gray-600 border-gray-200"}`}><Wand2 size={12}/> AI Generate</button>
      </div>

      {iconImage && (
        <div className="flex items-center gap-3 mb-2 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary-light)] px-3 py-2">
          <img src={iconImage} alt="icon" className="w-10 h-10 rounded-lg object-cover border" />
          <span className="text-xs text-[var(--primary)] flex-1 truncate">{iconImage}</span>
          <button type="button" onClick={()=> onImageChange("")} className="p-1 text-[var(--primary)] hover:bg-white rounded"><X size={14}/></button>
        </div>
      )}

      {tab==="icon" && <IconPicker value={icon} onChange={onIconChange} label={undefined} />}

      {tab==="upload" && (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 bg-gray-50/50 text-center">
          <ImageIcon size={24} className="mx-auto text-gray-400 mb-2" />
          <p className="text-xs text-gray-600 mb-2">Upload JPG/PNG — auto converts to <b>WebP</b> (≤4MB)</p>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-medium hover:bg-gray-50 cursor-pointer">
            <Upload size={14}/> {uploading ? "Uploading…" : "Choose Image"}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
          </label>
          <p className="text-[11px] text-gray-400 mt-2">Stored in DB, served as /api/files/*.webp</p>
        </div>
      )}

      {tab==="ai" && (
        <div className="rounded-lg border border-[var(--primary)]/20 bg-[var(--primary-light)]/60 p-4">
          <div className="flex items-center gap-2 mb-2 text-[var(--primary)]"><Wand2 size={16}/> <span className="text-xs font-semibold">AI Icon Generator</span></div>
          <p className="text-xs text-gray-600 mb-3">Generates a colorful flat icon for <b>{name || "— enter name above —"}</b> via Pollinations (no API key needed). Auto-saves as WebP.</p>
          <button type="button" onClick={handleGenerate} disabled={generating || !name.trim()} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--secondary)] disabled:opacity-50 flex items-center gap-1.5">
            {generating ? <Loader2 size={14} className="animate-spin"/> : <Wand2 size={14}/>} {generating ? "Generating…" : `Generate "${name || "icon"}"`}
          </button>
          {iconImage && <p className="text-[11px] text-emerald-600 mt-2">✓ Image set — preview above. Clear to revert to icon.</p>}
        </div>
      )}
    </div>
  )
}
