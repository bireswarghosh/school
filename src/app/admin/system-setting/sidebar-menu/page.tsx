"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useMemo, useRef } from "react"
import { Plus, Pencil, X, Save, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Search, Download, Upload, Printer, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { useApi } from "@/lib/use-api"

type SidebarMenu = {
  id: number
  label: string
  icon: string
  parent_id: number | null
  path: string
  sort_order: number
  is_visible: boolean
}

const iconOptions = [
  "Menu", "Settings", "BarChart3", "Users", "Wallet", "BookOpen", "ShieldAlert",
  "GitBranch", "Video", "Camera", "TrendingUp", "TrendingDown", "QrCode",
  "ClipboardCheck", "FileText", "ClipboardList", "Monitor", "GraduationCap",
  "Calendar", "BookTemplate", "Briefcase", "MessageSquare", "Download",
  "BookCopy", "Library", "Package", "FileUser", "Bus", "Building2", "Award",
  "Layout", "UserCheck", "Phone", "Home", "Search", "PlusCircle", "List",
  "Printer", "CreditCard", "Clock", "Bell", "CheckSquare", "AlertTriangle",
  "Star", "Globe", "Mail", "MessageCircle", "Image", "Grid", "Hash", "Tag",
  "Percent", "DollarSign",
]

const emptyForm = { label: "", icon: "Menu", parentId: "", path: "", sortOrder: 1, isVisible: true }

export default function SidebarMenuPage() {
  const { data: menus, add, update, remove, loading } = useApi<SidebarMenu>("/api/system-setting/sidebar-menu")
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [editing, setEditing] = useState<SidebarMenu | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteItem, setDeleteItem] = useState<SidebarMenu | null>(null)
  const [success, setSuccess] = useState("")
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const topMenus = useMemo(() => menus.filter((m) => !m.parent_id), [menus])
  const childrenByParent = useMemo(() => {
    const map: Record<number, SidebarMenu[]> = {}
    for (const m of menus) {
      if (m.parent_id) {
        if (!map[m.parent_id]) map[m.parent_id] = []
        map[m.parent_id].push(m)
      }
    }
    return map
  }, [menus])

  const sortedMenus = useMemo(() => {
    const result: SidebarMenu[] = []
    const sorted = [...topMenus].sort((a, b) => a.sort_order - b.sort_order)
    for (const parent of sorted) {
      result.push(parent)
      const children = (childrenByParent[parent.id] || []).sort((a, b) => a.sort_order - b.sort_order)
      result.push(...children)
    }
    return result
  }, [topMenus, childrenByParent])

  const filtered = useMemo(() => {
    if (!keyword.trim()) return sortedMenus
    const kw = keyword.toLowerCase()
    return sortedMenus.filter((m) =>
      m.label.toLowerCase().includes(kw) || m.path.toLowerCase().includes(kw) || m.icon.toLowerCase().includes(kw)
    )
  }, [sortedMenus, keyword])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const parentOptions = menus.filter((m) => !m.parent_id).sort((a, b) => a.sort_order - b.sort_order)

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3000)
  }

  const handleSave = async () => {
    if (!form.label.trim() || !form.path.trim()) return
    const payload: any = {
      label: form.label.trim(),
      icon: form.icon,
      path: form.path.trim(),
      sort_order: form.sortOrder,
      is_visible: form.isVisible,
    }
    if (form.parentId) payload.parent_id = parseInt(form.parentId)

    if (editing) {
      await update(editing.id, payload)
      showSuccess("Menu item updated successfully!")
    } else {
      await add(payload)
      showSuccess("Menu item added successfully!")
    }
    setShowModal(false)
    setEditing(null)
    setForm({ ...emptyForm })
  }

  const handleEditOpen = (m: SidebarMenu) => {
    setEditing(m)
    setForm({
      label: m.label,
      icon: m.icon,
      parentId: m.parent_id ? String(m.parent_id) : "",
      path: m.path,
      sortOrder: m.sort_order,
      isVisible: m.is_visible,
    })
    setShowModal(true)
  }

  const handleDelete = (m: SidebarMenu) => {
    setDeleteItem(m)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteItem) return
    await remove(deleteItem.id)
    showSuccess(`"${deleteItem.label}" deleted successfully!`)
    setShowDeleteModal(false)
    setDeleteItem(null)
  }

  const toggleVisibility = async (m: SidebarMenu) => {
    await update(m.id, { is_visible: !m.is_visible })
    showSuccess(`${m.label} ${m.is_visible ? "hidden" : "visible"} successfully!`)
  }

  const moveUp = async (idx: number) => {
    if (idx <= 0) return
    const prev = sortedMenus[idx - 1]
    const curr = sortedMenus[idx]
    await update(curr.id, { sort_order: prev.sort_order })
    await update(prev.id, { sort_order: curr.sort_order })
  }

  const moveDown = async (idx: number) => {
    if (idx >= sortedMenus.length - 1) return
    const next = sortedMenus[idx + 1]
    const curr = sortedMenus[idx]
    await update(curr.id, { sort_order: next.sort_order })
    await update(next.id, { sort_order: curr.sort_order })
  }

  const clearForm = () => {
    setForm({ ...emptyForm })
    setEditing(null)
  }

  const Modal = ({ title, show, onClose, children, footer }: {
    title: string; show: boolean; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode
  }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5">{children}</div>
          {footer && (
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  }

  const paginationPages = useMemo(() => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages }
    pages.push(1)
    if (page > 3) pages.push("...")
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push("...")
    pages.push(totalPages)
    return pages
  }, [totalPages, page])

  const exportCSV = () => {
    const header = '"#","Menu Label","Icon","Parent Menu","Path","Order","Status"'
    const rows = filtered.map((m, idx) => {
      const parent = m.parent_id ? (menus.find((p) => p.id === m.parent_id)?.label || "") : ""
      return `"${idx + 1}","${m.label}","${m.icon}","${parent}","${m.path}","${m.sort_order}","${m.is_visible ? "Visible" : "Hidden"}"`
    })
    const csv = [header, ...rows].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "sidebar_menu.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    const header = "<tr><th>#</th><th>Menu Label</th><th>Icon</th><th>Parent Menu</th><th>Path</th><th>Order</th><th>Status</th></tr>"
    const rows = filtered.map((m, idx) => {
      const parent = m.parent_id ? (menus.find((p) => p.id === m.parent_id)?.label || "") : ""
      return `<tr><td>${idx + 1}</td><td>${m.label}</td><td>${m.icon}</td><td>${parent}</td><td>${m.path}</td><td>${m.sort_order}</td><td>${m.is_visible ? "Visible" : "Hidden"}</td></tr>`
    }).join("")
    const html = `<html><head><meta charset="utf-8"><title>Sidebar Menu</title></head><body><table>${header}${rows}</table></body></html>`
    const blob = new Blob([html], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "sidebar_menu.xls"; a.click()
    URL.revokeObjectURL(url)
  }

  const printTable = () => {
    window.print()
  }

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split("\n").filter((l) => l.trim())
    if (lines.length < 2) { notify.error("CSV must have a header row and at least one data row"); return }
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
      if (vals.length < 3) continue
      try {
        await add({
          label: vals[1] || vals[0],
          icon: vals[2] || "Menu",
          path: vals[4] || "/",
          sort_order: parseInt(vals[5]) || 1,
          is_visible: true,
        })
      } catch { }
    }
    notify.success(`Import completed`)
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sidebar Menu</h2>
          <p className="text-xs text-gray-500 mt-0.5">System Setting / Sidebar Menu</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv" onChange={importCSV} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-xs text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <div className="relative group">
            <button className="flex items-center gap-1.5 text-xs text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <button onClick={exportCSV} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-t-lg">CSV</button>
              <button onClick={exportExcel} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">Excel</button>
              <button onClick={printTable} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-b-lg">PDF</button>
            </div>
          </div>
          <button onClick={printTable} className="flex items-center gap-1.5 text-xs text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button onClick={() => { clearForm(); setShowModal(true) }}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-4 py-2 rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">
            <Plus className="h-3.5 w-3.5" /> Add Menu Item
          </button>
        </div>
      </div>

      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-2.5 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-indigo-500" />
            Search
          </h3>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
                placeholder="Search by label, path or icon..."
                className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <button type="button" onClick={() => { setKeyword(""); setPage(1) }}
              className="h-9 px-3 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-800">Menu List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                {["#", "Menu Label", "Icon", "Parent Menu", "Path", "Order", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-gray-300" />
                      <span className="text-sm">No menu items found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((m, idx) => {
                  const isChild = !!m.parent_id
                  const globalIdx = sortedMenus.indexOf(m)
                  return (
                    <tr key={m.id} className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{(page - 1) * rowsPerPage + idx + 1}</td>
                      <td className={`px-4 py-2.5 font-medium text-gray-800 ${isChild ? "pl-10" : ""}`}>
                        <div className="flex items-center gap-2">
                          {isChild && <span className="text-gray-300 text-xs">└─</span>}
                          {m.label}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                          {m.icon}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">
                        {m.parent_id ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                            {menus.find((p) => p.id === m.parent_id)?.label || "—"}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded max-w-[180px] inline-block truncate" title={m.path}>
                          {m.path}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                          {m.sort_order}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${m.is_visible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {m.is_visible ? "Visible" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => moveUp(globalIdx)} disabled={globalIdx === 0}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Move Up">
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => moveDown(globalIdx)} disabled={globalIdx === sortedMenus.length - 1}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Move Down">
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => toggleVisibility(m)}
                            className={`p-1.5 rounded-lg transition-colors ${m.is_visible ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                            title={m.is_visible ? "Hide" : "Show"}>
                            {m.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => handleEditOpen(m)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(m)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>
          <span>Showing {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} records</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {paginationPages.map((p, i) =>
                typeof p === "string"
                  ? <span key={`e${i}`} className="px-1 text-xs text-gray-400">...</span>
                  : <button key={p} onClick={() => setPage(p)}
                    className={`min-w-[28px] h-7 text-xs font-medium rounded-lg transition-colors ${page === p ? "bg-[var(--primary)] text-white" : "text-gray-600 hover:bg-gray-50 border border-transparent"}`}>
                    {p}
                  </button>
              )}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .overflow-x-auto, .overflow-x-auto * { visibility: visible; }
          .overflow-x-auto { position: absolute; left: 0; top: 0; width: 100%; }
          .space-y-5 > *:not(:last-child) { display: none; }
          th, td { padding: 6px 8px !important; font-size: 10px !important; }
        }
      `}</style>

      <Modal
        title={editing ? "Edit Menu Item" : "Add Menu Item"}
        show={showModal}
        onClose={() => { setShowModal(false); clearForm() }}
        footer={
          <>
            <button onClick={() => { setShowModal(false); clearForm() }}
              className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave}
              className="px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200 flex items-center gap-1.5">
              <Save className="h-3.5 w-3.5" /> Save
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Label <span className="text-red-400">*</span></label>
            <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              placeholder="Enter menu label" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Icon</label>
            <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
              {iconOptions.map((ico) => <option key={ico} value={ico}>{ico}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Path <span className="text-red-400">*</span></label>
            <input type="text" value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })}
              placeholder="/admin/path"
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Parent Menu</label>
            <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
              <option value="">None (Top Level)</option>
              {parentOptions.map((p) => <option key={p.id} value={String(p.id)}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} min={1}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isVisible} onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
              className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
            <span className="text-sm text-gray-700">Visible</span>
          </label>
        </div>
      </Modal>

      <Modal
        title="Confirm Delete"
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        footer={
          <>
            <button onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={confirmDelete}
              className="px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-200">
              Delete
            </button>
          </>
        }
      >
        <div className="text-center py-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <Trash2 className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Are you sure you want to delete this menu item?</p>
          {deleteItem && (
            <>
              <p className="text-sm font-semibold text-gray-800">{deleteItem.label}</p>
              <p className="text-xs text-gray-400 mt-1">Child menus will be unlinked but not deleted.</p>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
