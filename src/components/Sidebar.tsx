"use client"

import { useState, useEffect, useCallback, useId } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { menuData, MenuCategory } from "@/lib/menu-data"
import { SessionPill } from "@/components/SessionSwitcher"
import { iconMap } from "@/lib/menu-icons"
import {
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
  School,
  Search,
  PlusCircle,
  List,
  Edit,
  Trash2,
  Printer,
  CreditCard,
  Clock,
  Bell,
  CheckSquare,
  AlertTriangle,
  Star,
  Globe,
  Mail,
  MessageCircle,
  Image,
  Grid,
  Hash,
  Tag,
  Percent,
  DollarSign,
  Home,
  Settings,
  BarChart3,
  Users,
  Wallet,
  FileText,
  ClipboardList,
  GraduationCap,
  BookOpen,
  Award,
  Bus,
  Building2,
  BookCopy,
  Calendar,
  Download,
  ShieldAlert,
  Package,
  FileUser,
  UserCheck,
} from "lucide-react"

function submenuIcon(label: string): React.ElementType {
  const l = label.toLowerCase()
  if (l.includes("setting") || l.includes("configuration")) return Settings
  if (l.includes("report") || l.includes("log")) return BarChart3
  if (l.includes("student") || l.includes("admission") || l.includes("user") || l.includes("member") || l.includes("staff")) return Users
  if (l.includes("fee") || l.includes("payment") || l.includes("collect") || l.includes("bank")) return Wallet
  if (l.includes("exam") || l.includes("mark") || l.includes("grade") || l.includes("question")) return FileText
  if (l.includes("attendance") || l.includes("leave")) return ClipboardList
  if (l.includes("class") || l.includes("section") || l.includes("subject") || l.includes("teacher") || l.includes("promote")) return GraduationCap
  if (l.includes("lesson") || l.includes("syllabus") || l.includes("topic") || l.includes("plan")) return BookOpen
  if (l.includes("certificate") || l.includes("id card") || l.includes("card")) return Award
  if (l.includes("transport") || l.includes("bus") || l.includes("route") || l.includes("vehicle") || l.includes("pickup")) return Bus
  if (l.includes("hostel") || l.includes("room")) return Building2
  if (l.includes("library") || l.includes("book") || l.includes("issue") || l.includes("return")) return BookCopy
  if (l.includes("menu") || l.includes("sidebar")) return Menu
  if (l.includes("gallery") || l.includes("banner") || l.includes("image") || l.includes("media")) return Image
  if (l.includes("news") || l.includes("notice")) return FileText
  if (l.includes("event") || l.includes("calendar")) return Calendar
  if (l.includes("template") || l.includes("print") || l.includes("thermal") || l.includes("header") || l.includes("footer")) return Printer
  if (l.includes("category") || l.includes("group") || l.includes("department") || l.includes("designation")) return Tag
  if (l.includes("type") || l.includes("reason")) return Hash
  if (l.includes("discount") || l.includes("promotion")) return Percent
  if (l.includes("income") || l.includes("expense") || l.includes("budget")) return DollarSign
  if (l.includes("email") || l.includes("sms") || l.includes("message") || l.includes("communicate") || l.includes("whatsapp")) return MessageCircle
  if (l.includes("language") || l.includes("translation")) return Globe
  if (l.includes("backup") || l.includes("restore") || l.includes("update")) return Download
  if (l.includes("role") || l.includes("permission")) return ShieldAlert
  if (l.includes("captcha") || l.includes("security")) return ShieldAlert
  if (l.includes("module") || l.includes("addon")) return Package
  if (l.includes("custom field") || l.includes("system field") || l.includes("file type")) return FileText
  if (l.includes("alumni")) return UserCheck
  if (l.includes("inventory") || l.includes("stock") || l.includes("product") || l.includes("supplier") || l.includes("brand") || l.includes("unit") || l.includes("store") || l.includes("purchase") || l.includes("barcode") || l.includes("transfer") || l.includes("adjustment")) return Package
  if (l.includes("online course") || l.includes("course")) return BookOpen
  if (l.includes("cv") || l.includes("build") || l.includes("resume")) return FileUser
  if (l.includes("overview") || l.includes("dashboard") || l.includes("home")) return Home
  if (l.includes("search")) return Search
  if (l.includes("add") && l.includes("create")) return PlusCircle
  if (l.includes("list") || l.includes("manage") || l.includes("view")) return List
  return Circle
}

function Circle({ className }: { className?: string }) {
  return <span className={`h-1.5 w-1.5 rounded-full bg-current shrink-0 ${className || ""}`} />
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    )
  }

  useEffect(() => {
    setExpandedMenus((prev) => {
      const next = [...prev]
      for (const category of menuData) {
        if (category.items.some((item) => pathname.startsWith(item.path)) && !next.includes(category.label)) {
          next.push(category.label)
        }
      }
      return next
    })
  }, [pathname])

  const [visMap, setVisMap] = useState<Record<string, boolean>>({})
  const [visLoaded, setVisLoaded] = useState(false)

  const fetchVis = useCallback(() => {
    fetch("/api/system-setting/sidebar-menu")
      .then((r) => r.json())
      .then((data: { id: number; label: string; parent_id: number | null; is_visible: boolean }[]) => {
        const map: Record<string, boolean> = {}
        for (const row of data) {
          if (row.parent_id === null) {
            map[row.label.toLowerCase()] = row.is_visible
          } else {
            const parent = data.find((p) => p.id === row.parent_id)
            if (parent) {
              map[parent.label.toLowerCase() + "::" + row.label.toLowerCase()] = row.is_visible
            }
          }
        }
        setVisMap(map)
        setVisLoaded(true)
      })
      .catch(() => setVisLoaded(true))
  }, [])

  useEffect(() => { fetchVis() }, [fetchVis, pathname])

  useEffect(() => {
    const handler = () => fetchVis()
    window.addEventListener("sidebar-visibility-changed", handler)
    return () => window.removeEventListener("sidebar-visibility-changed", handler)
  }, [fetchVis])

  const catVisible = (cat: MenuCategory) => visMap[cat.label.toLowerCase()] ?? true
  const itemVisible = (cat: MenuCategory, itemLabel: string) =>
    visMap[cat.label.toLowerCase() + "::" + itemLabel.toLowerCase()] ?? true

  const isActive = (path: string) => pathname === path
  const isParentActive = (category: MenuCategory) =>
    category.items.some((item) => pathname.startsWith(item.path))

  const sidebarContent = (
    <div className="flex flex-col h-full sidebar-scroll-wrap" style={{ backgroundColor: "var(--sidebar-bg)" }}>
      <style>{`
        .sidebar-scroll-wrap {
          --scrollbar-track: color-mix(in srgb, var(--sidebar-bg), white 8%);
          --scrollbar-thumb: color-mix(in srgb, var(--primary), transparent 30%);
          --scrollbar-thumb-hover: var(--primary);
        }
        .sidebar-scroll-wrap .sidebar-menu-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scroll-wrap .sidebar-menu-scroll::-webkit-scrollbar-track {
          background: var(--scrollbar-track);
          border-radius: 4px;
        }
        .sidebar-scroll-wrap .sidebar-menu-scroll::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb);
          border-radius: 4px;
          transition: background 0.3s ease, width 0.3s ease;
        }
        .sidebar-scroll-wrap .sidebar-menu-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--scrollbar-thumb-hover);
          width: 6px;
        }
        .sidebar-scroll-wrap .sidebar-menu-scroll {
          scrollbar-width: thin;
          scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
          transition: scrollbar-color 0.3s ease;
        }
        .sidebar-scroll-wrap .sidebar-menu-scroll:hover {
          scrollbar-color: var(--scrollbar-thumb-hover) var(--scrollbar-track);
        }
        @keyframes scrollbar-glow {
          0%, 100% { box-shadow: 0 0 3px color-mix(in srgb, var(--primary), transparent 60%); }
          50% { box-shadow: 0 0 8px color-mix(in srgb, var(--primary), transparent 30%); }
        }
        .sidebar-scroll-wrap .sidebar-menu-scroll::-webkit-scrollbar-thumb {
          animation: scrollbar-glow 3s ease-in-out infinite;
        }
      `}</style>
      <div className="flex items-center justify-between px-4 h-16 border-b" style={{ borderColor: "color-mix(in srgb, var(--sidebar-bg), white 15%)" }}>
        <Link href="/admin" className="flex items-center gap-2" style={{ color: "var(--sidebar-text)" }}>
          <School className="h-7 w-7" style={{ color: "var(--primary)" }} />
          {!collapsed && <span className="font-bold text-lg">Smart School</span>}
        </Link>
        <button
          onClick={collapsed ? onToggle : onToggle}
          className="lg:hidden"
          style={{ color: "var(--sidebar-text)" }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-2 sidebar-menu-scroll">
        <nav>
          <div className="px-2 mb-2">
            <SessionPill collapsed={collapsed} />
          </div>
          {menuData.filter(catVisible).map((category) => {
            const Icon = iconMap[category.icon] || Settings
            const isExpanded = expandedMenus.includes(category.label)
            const parentActive = isParentActive(category)
            const visibleItems = category.items.filter((item) => itemVisible(category, item.label))

            return (
              <div key={category.label} className="px-2 mb-0.5">
                <button
                  onClick={() => {
                    toggleMenu(category.label)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all rounded-lg`}
                  style={{
                    backgroundColor: parentActive ? "color-mix(in srgb, var(--sidebar-active-bg), transparent 85%)" : undefined,
                    color: parentActive ? "var(--sidebar-active-bg)" : "var(--sidebar-text)",
                  }}
                  onMouseEnter={(e) => { if (!parentActive) { e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--sidebar-bg), white 10%)"; e.currentTarget.style.color = "var(--sidebar-text)" } }}
                  onMouseLeave={(e) => { if (!parentActive) { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.color = "var(--sidebar-text)" } }}
                  title={category.label}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{category.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                      )}
                    </>
                  )}
                </button>
                {!collapsed && isExpanded && (
                  <div className="ml-2 mt-0.5 space-y-0.5">
                    {visibleItems.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={onMobileClose}
                        className={`flex items-center gap-3 pl-9 pr-3 py-2 text-sm transition-all rounded-lg`}
                        style={{
                          backgroundColor: isActive(item.path) ? "color-mix(in srgb, var(--sidebar-active-bg), transparent 85%)" : undefined,
                          color: isActive(item.path) ? "var(--sidebar-active-bg)" : "var(--sidebar-text)",
                        }}
                        onMouseEnter={(e) => { if (!isActive(item.path)) { e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--sidebar-bg), white 10%)" } }}
                        onMouseLeave={(e) => { if (!isActive(item.path)) { e.currentTarget.style.backgroundColor = "" } }}
                      >
                        <span className="h-1 w-1 rounded-full bg-current shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      <div className="border-t p-4" style={{ borderColor: "color-mix(in srgb, var(--sidebar-bg), white 15%)" }}>
        <div className="flex items-center gap-3" style={{ color: "var(--sidebar-text)" }}>
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: "color-mix(in srgb, var(--primary), transparent 80%)", color: "var(--primary)" }}>
            SA
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--sidebar-text)" }}>Super Admin</p>
              <p className="text-xs truncate" style={{ color: "color-mix(in srgb, var(--sidebar-text), transparent 40%)" }}>superadmin@gmail.com</p>
            </div>
          )}
          {!collapsed && (
            <button className="transition-colors p-1 rounded-lg" style={{ color: "var(--sidebar-text)" }}>
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="relative w-64 h-full overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
