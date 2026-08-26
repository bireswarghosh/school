"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Plus, Pencil, Trash2, X, Save, Layout, Type } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Template = {
  id: number
  name: string
  content: string
  backgroundImage: string
  templateDesign: string
}

type DesignBlock = {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily?: string
  width?: number
  height?: number
}

type DragState = {
  id: string
  startMouseX: number
  startMouseY: number
  startX: number
  startY: number
}

type ResizeState = {
  id: string
  startMouseX: number
  startMouseY: number
  startWidth: number
  startHeight: number
}

const placeholders = ["[student_name]", "[course_name]", "[assign_teacher]", "[start_date]", "[completion_date]", "[class_name]", "[section_name]", "[current_date]"]

const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72]
const FONTS = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', sans-serif" },
  { label: "Outfit", value: "Outfit, sans-serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Impact", value: "Impact, sans-serif" },
]
const DEFAULT_BG_IMAGE = "https://demo.smart-school.in/uploads/course_content/online_course_certificate/default_template.jpg"

function renderTextWithBadges(text: string) {
  const parts = text.split(/(\[.*?\])/g)
  return parts.map((part, i) => {
    if (placeholders.includes(part)) {
      return (
        <span
          key={i}
          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-[var(--primary-light)] text-[var(--primary)] border border-indigo-200 mx-0.5"
        >
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function linesFromContent(content: string): string[] {
  return content.split("\n").filter((l) => l.trim() !== "")
}

const emptyForm = { name: "", content: "", backgroundImage: "" }

export default function CertificateTemplatePage() {
  const { data: templates, add, update, remove } = useApi<Template>("/api/online-course/certificate-template")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setForm((prev) => ({ ...prev, backgroundImage: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = "Certificate name is required"
    if (!form.content.trim()) errs.content = "Certificate text is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openAddModal = () => {
    setForm({ ...emptyForm })
    setErrors({})
    setShowAddModal(true)
  }

  const handleAdd = async () => {
    if (!validate()) return
    await add({ name: form.name.trim(), content: form.content.trim(), backgroundImage: form.backgroundImage.trim() })
    setShowAddModal(false)
    setForm({ ...emptyForm })
  }

  const handleEditOpen = (template: Template) => {
    setEditId(template.id)
    setForm({ name: template.name, content: template.content, backgroundImage: template.backgroundImage || "" })
    setErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    if (!validate() || editId === null) return
    await update(editId, { name: form.name.trim(), content: form.content.trim(), backgroundImage: form.backgroundImage.trim() || null })
    setShowEditModal(false)
    setEditId(null)
    setForm({ ...emptyForm })
  }

  const handleDeleteOpen = (id: number) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  const ModalOverlay = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
  )

  const FormFields = () => (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Certificate Name <span className="text-red-400">*</span></label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="Enter certificate name"
          className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
        />
        {errors.name && <p className="text-red-400 text-xs mt-0.5">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Background Image [720px X 960px] <span className="text-red-400">*</span></label>
        <input
          type="file"
          accept="image/*"
          onChange={handleBackgroundImageUpload}
          className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[var(--primary-light)] file:text-[var(--primary)] hover:file:bg-indigo-100 cursor-pointer"
        />
        {form.backgroundImage && (
          <div className="mt-2 flex items-center gap-3">
            <img src={form.backgroundImage} alt="Preview" className="h-14 w-auto rounded border border-gray-200 object-cover" />
            <button
              type="button"
              onClick={() => handleInputChange("backgroundImage", "")}
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              Remove
            </button>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-0.5">Recommended: 720x960px. If not provided, a default certificate background will be used.</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Body Text <span className="text-red-400">*</span></label>
        <textarea
          value={form.content}
          onChange={(e) => handleInputChange("content", e.target.value)}
          rows={5}
          placeholder={`Each line becomes a draggable text block on the certificate.\nExample:\nThis is to certify that\n[student_name]\nhas completed\n[course_name]`}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
        />
        <p className="text-xs text-gray-400 mt-1.5">
          Each line becomes a draggable block on the certificate. Available placeholders: [student_name], [course_name], [assign_teacher], [start_date], [completion_date], [class_name], [section_name], [current_date]
        </p>
        {errors.content && <p className="text-red-400 text-xs mt-0.5">{errors.content}</p>}
      </div>
    </>
  )

  const Modal = ({ title, show, onClose, footer }: { title: string; show: boolean; onClose: () => void; footer?: React.ReactNode }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <ModalOverlay onClose={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            {FormFields()}
          </div>
          {footer && (
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  }

  // -------- Design Editor ----------
  const [showDesigner, setShowDesigner] = useState(false)
  const [designTemplateId, setDesignTemplateId] = useState<number | null>(null)
  const [designBlocks, setDesignBlocks] = useState<DesignBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [globalFontSize, setGlobalFontSize] = useState(16)
  const [globalFontFamily, setGlobalFontFamily] = useState("Arial, sans-serif")
  const [certBgImage, setCertBgImage] = useState("")
  const [designerContent, setDesignerContent] = useState("")
  const [designerName, setDesignerName] = useState("")

  const draggingRef = useRef<DragState | null>(null)
  const resizingRef = useRef<ResizeState | null>(null)
  const certRef = useRef<HTMLDivElement>(null)

  const openDesigner = useCallback((template: Template) => {
    setDesignTemplateId(template.id)
    setDesignerName(template.name)
    setDesignerContent(template.content)
    setCertBgImage(template.backgroundImage || DEFAULT_BG_IMAGE)
    const lines = linesFromContent(template.content)
    let blocks: DesignBlock[]
    if (template.templateDesign) {
      try {
        const saved = JSON.parse(template.templateDesign) as DesignBlock[]
        blocks = saved.map((b, idx) => ({ ...b, id: `block-${idx}`, width: b.width || 200, height: b.height || 40, fontFamily: b.fontFamily || globalFontFamily }))
        const existingTexts = new Set(blocks.map((b) => b.text))
        let nextY = blocks.length > 0 ? Math.max(...blocks.map((b) => b.y)) + 40 : 80
        for (const line of lines) {
          if (!existingTexts.has(line)) {
            blocks.push({ id: `block-${blocks.length}`, text: line, x: 60, y: nextY, fontSize: 16, width: 200, height: 40, fontFamily: globalFontFamily })
            nextY += 40
          }
        }
        setGlobalFontSize(blocks[0]?.fontSize || 16)
      } catch {
        blocks = lines.map((line, idx) => ({ id: `block-${idx}`, text: line, x: 60, y: 80 + idx * 40, fontSize: 16, width: 200, height: 40, fontFamily: globalFontFamily }))
        setGlobalFontSize(16)
      }
    } else {
      blocks = lines.map((line, idx) => ({ id: `block-${idx}`, text: line, x: 60, y: 80 + idx * 40, fontSize: 16, width: 200, height: 40, fontFamily: globalFontFamily }))
      setGlobalFontSize(16)
    }
    setDesignBlocks(blocks)
    setSelectedBlockId(null)
    setEditingBlockId(null)
    setShowDesigner(true)
  }, [])

  const closeDesigner = () => {
    setShowDesigner(false)
    setDesignTemplateId(null)
    setDesignBlocks([])
    setSelectedBlockId(null)
    setEditingBlockId(null)
    draggingRef.current = null
  }

  const updateBlockPos = useCallback((id: string, x: number, y: number) => {
    setDesignBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, x, y } : b)))
  }, [])

  const updateBlockSize = useCallback((id: string, w: number, h: number) => {
    setDesignBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, width: Math.max(60, w), height: Math.max(24, h) } : b)))
  }, [])

  const updateBlockFontSize = (id: string, fontSize: number) => {
    setDesignBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, fontSize } : b)))
  }

  const updateBlockFontFamily = (id: string, fontFamily: string) => {
    setDesignBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, fontFamily } : b)))
  }

  const updateBlockText = (id: string, text: string) => {
    setDesignBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)))
  }

  const handleResizeMouseDown = (e: React.MouseEvent, blockId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const block = designBlocks.find((b) => b.id === blockId)
    if (!block) return
    setSelectedBlockId(blockId)
    resizingRef.current = {
      id: blockId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startWidth: block.width || 200,
      startHeight: block.height || 40,
    }
  }

  const handleMouseDown = (e: React.MouseEvent, blockId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const block = designBlocks.find((b) => b.id === blockId)
    if (!block) return
    setSelectedBlockId(blockId)
    draggingRef.current = {
      id: blockId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: block.x,
      startY: block.y,
    }
  }

  useEffect(() => {
    if (!showDesigner) return
    const handleMouseMove = (e: MouseEvent) => {
      const drag = draggingRef.current
      const resize = resizingRef.current
      if (drag) {
        const dx = e.clientX - drag.startMouseX
        const dy = e.clientY - drag.startMouseY
        updateBlockPos(drag.id, Math.max(0, drag.startX + dx), Math.max(0, drag.startY + dy))
      } else if (resize) {
        const dw = e.clientX - resize.startMouseX
        const dh = e.clientY - resize.startMouseY
        updateBlockSize(resize.id, resize.startWidth + dw, resize.startHeight + dh)
      }
    }
    const handleMouseUp = () => {
      draggingRef.current = null
      resizingRef.current = null
    }
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [showDesigner, updateBlockPos, updateBlockSize])

  const handleGlobalFontSizeChange = (fontSize: number) => {
    setGlobalFontSize(fontSize)
    setDesignBlocks((prev) => prev.map((b) => ({ ...b, fontSize })))
  }

  const handleGlobalFontFamilyChange = (fontFamily: string) => {
    setGlobalFontFamily(fontFamily)
    setDesignBlocks((prev) => prev.map((b) => ({ ...b, fontFamily })))
  }

  const handleBlockDoubleClick = (block: DesignBlock) => {
    setEditingBlockId(block.id)
    setEditText(block.text)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      commitEdit(blockId)
    }
    if (e.key === "Escape") {
      setEditingBlockId(null)
    }
  }

  const commitEdit = (blockId: string) => {
    updateBlockText(blockId, editText)
    setEditingBlockId(null)
  }

  const saveDesign = async () => {
    if (designTemplateId === null) return
    await update(designTemplateId, { templateDesign: JSON.stringify(designBlocks) })
    closeDesigner()
  }

  const handleFieldDragStart = (e: React.DragEvent, text: string) => {
    e.dataTransfer.setData("text/plain", text)
    e.dataTransfer.effectAllowed = "copy"
  }

  const handleCertDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const text = e.dataTransfer.getData("text/plain")
    if (!text || !certRef.current) return
    const rect = certRef.current.getBoundingClientRect()
    const x = Math.max(0, e.clientX - rect.left)
    const y = Math.max(0, e.clientY - rect.top)
    setDesignBlocks((prev) => [
      ...prev,
      { id: `block-${Date.now()}`, text, x, y, fontSize: globalFontSize, fontFamily: globalFontFamily, width: 200, height: 40 },
    ])
  }

  const selectedBlock = designBlocks.find((b) => b.id === selectedBlockId)

  return (
    <>
      {/* ---- Main List View ---- */}
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white">Certificate Template</h2>
            <p className="text-sm text-white/70 mt-0.5">Online Course / Certificate Template</p>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button onClick={openAddModal} className="flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-4 py-2 rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">
            <Plus className="h-3.5 w-3.5" />
            Add Certificate
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Certificate Template List</h3>
            <span className="text-xs text-gray-400">{templates?.length || 0} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Certificate Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Certificate Text</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-12 text-gray-400">No certificate templates found</td></tr>
                ) : (
                  templates.map((template, idx) => (
                    <tr key={template.id} className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{template.name}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs leading-relaxed max-w-xl">{renderTextWithBadges(template.content)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <button onClick={() => handleEditOpen(template)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openDesigner(template)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Design"
                          >
                            <Layout className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteOpen(template.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
          <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
            <span>Showing {templates?.length || 0} of {templates?.length || 0} records</span>
            <span className="text-gray-300">Page 1 of 1</span>
          </div>
        </div>

        <Modal title="Add Certificate Template" show={showAddModal} onClose={() => setShowAddModal(false)}
          footer={<>
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleAdd} className="px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">Save</button>
          </>}
        />
        <Modal title="Edit Certificate Template" show={showEditModal} onClose={() => setShowEditModal(false)}
          footer={<>
            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleEditSave} className="px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">Save</button>
          </>}
        />

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
                <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5">
                <div className="text-center py-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                    <Trash2 className="h-6 w-6 text-red-500" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Are you sure you want to delete this certificate template?</p>
                  {deleteId && <p className="text-sm font-semibold text-gray-800">{templates.find((t) => t.id === deleteId)?.name}</p>}
                </div>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={confirmDelete} className="px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-200">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---- Design Editor Overlay ---- */}
      {showDesigner && (
        <div className="fixed inset-0 z-50 bg-gray-900/70 backdrop-blur-sm flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={closeDesigner} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Close">
                <X className="h-5 w-5" />
              </button>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Certificate Designer</h3>
                <p className="text-xs text-gray-400">{designerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveDesign}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-4 py-2 rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm"
              >
                <Save className="h-3.5 w-3.5" />
                Save Design
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Certificate Preview */}
            <div className="flex-1 overflow-auto p-6 flex items-start justify-center bg-gray-800/50">
              <div
                ref={certRef}
                className="relative shadow-2xl border border-gray-300 overflow-hidden"
                style={{
                  width: 770,
                  aspectRatio: "1.4 / 1",
                  backgroundImage: `url(${certBgImage || DEFAULT_BG_IMAGE})`,
                  backgroundSize: "100% 100%",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  cursor: draggingRef.current ? "grabbing" : "default",
                  borderRadius: 4,
                }}
                onClick={(e) => { if (e.target === e.currentTarget) setSelectedBlockId(null) }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy" }}
                onDrop={handleCertDrop}
              >
                  {designBlocks.map((block) => {
                  const isSelected = block.id === selectedBlockId
                  const isPlaceholder = placeholders.includes(block.text)
                  const isDragging = draggingRef.current?.id === block.id
                  const isResizing = resizingRef.current?.id === block.id
                  const isEditing = editingBlockId === block.id
                  const bw = block.width || 200
                  const bh = block.height || 40
                  return (
                    <div
                      key={block.id}
                      className="draggable select-none"
                      style={{
                        position: "absolute",
                        left: block.x,
                        top: block.y,
                        width: bw,
                        height: bh,
                        fontSize: block.fontSize,
                        fontFamily: block.fontFamily || globalFontFamily,
                        fontWeight: isPlaceholder ? 700 : 400,
                        color: isPlaceholder ? "#1e40af" : "#1e293b",
                        cursor: isResizing ? "se-resize" : "grab",
                        zIndex: isDragging || isResizing ? 10 : isSelected ? 5 : 1,
                        backgroundColor: isSelected ? "rgba(255,119,50,0.08)" : "transparent",
                        padding: "4px 8px",
                        borderRadius: 3,
                        outline: isSelected ? "2px solid #ff7732" : "none",
                        outlineOffset: 1,
                        overflow: isEditing ? "visible" : "hidden",
                        wordBreak: "break-word",
                        lineHeight: 1.3,
                        touchAction: "none",
                        boxSizing: "border-box",
                      }}
                      onMouseDown={(e) => handleMouseDown(e, block.id)}
                      onDoubleClick={() => handleBlockDoubleClick(block)}
                    >
                      {isEditing ? (
                        <textarea
                          autoFocus
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onBlur={() => commitEdit(block.id)}
                          onKeyDown={(e) => handleEditKeyDown(e, block.id)}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            outline: "none",
                            resize: "none",
                            background: "transparent",
                            font: "inherit",
                            color: "inherit",
                            padding: 0,
                            margin: 0,
                            overflow: "hidden",
                            lineHeight: 1.3,
                          }}
                        />
                      ) : (
                        renderTextWithBadges(block.text)
                      )}
                      {isSelected && !isEditing && (
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, block.id)}
                          style={{
                            position: "absolute",
                            right: 0,
                            bottom: 0,
                            width: 14,
                            height: 14,
                            cursor: "se-resize",
                            borderRight: "3px solid #ff7732",
                            borderBottom: "3px solid #ff7732",
                            borderRadius: "0 0 3px 0",
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Controls Panel */}
            <div className="w-72 bg-white border-l border-gray-200 shrink-0 overflow-y-auto p-5 space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Template Info</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400 text-xs">Name</span>
                    <p className="text-gray-800 font-medium">{designerName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Body Text</span>
                    <p className="text-gray-600 text-xs whitespace-pre-wrap leading-relaxed">{designerContent}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Text Blocks</span>
                    <p className="text-gray-800 font-medium">{designBlocks.length}</p>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Typography</h4>

                {selectedBlock && (
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Font Size <span className="text-gray-400">(Selected Block)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedBlock.fontSize}
                        onChange={(e) => updateBlockFontSize(selectedBlock.id, parseInt(e.target.value))}
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none bg-white"
                      >
                        {FONT_SIZES.map((s) => (
                          <option key={s} value={s}>{s}px</option>
                        ))}
                      </select>
                      <Type className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 italic truncate">
                      Selected: <span className="font-mono font-medium text-gray-600">{selectedBlock.text.length > 30 ? selectedBlock.text.slice(0, 28) + "..." : selectedBlock.text}</span>
                    </p>
                  </div>
                )}

                {selectedBlock && (
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Font <span className="text-gray-400">(Selected Block)</span>
                    </label>
                    <select
                      value={selectedBlock.fontFamily || globalFontFamily}
                      onChange={(e) => updateBlockFontFamily(selectedBlock.id, e.target.value)}
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none bg-white"
                    >
                      {FONTS.map((f) => (
                        <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Font Size <span className="text-gray-400">(All Blocks)</span>
                  </label>
                  <div className="relative">
                    <select
                      value={globalFontSize}
                      onChange={(e) => handleGlobalFontSizeChange(parseInt(e.target.value))}
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none bg-white"
                    >
                      {FONT_SIZES.map((s) => (
                        <option key={s} value={s}>{s}px</option>
                      ))}
                    </select>
                    <Type className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Font <span className="text-gray-400">(All Blocks)</span>
                  </label>
                  <select
                    value={globalFontFamily}
                    onChange={(e) => handleGlobalFontFamilyChange(e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none bg-white"
                  >
                    {FONTS.map((f) => (
                      <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Available Fields</h4>
                <p className="text-xs text-gray-400 mb-2">Use these in body text (one per line):</p>
                <div className="flex flex-wrap gap-1.5">
                  {placeholders.map((p) => (
                    <span
                      key={p}
                      draggable
                      onDragStart={(e) => handleFieldDragStart(e, p)}
                      className="inline-flex items-center px-2 py-1 rounded text-[11px] font-mono font-semibold bg-[var(--primary-light)] text-[var(--primary)] border border-indigo-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <hr className="border-gray-100" />

              <div className="space-y-2">
                <button
                  onClick={saveDesign}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-4 py-2.5 rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Design
                </button>
                <button
                  onClick={closeDesigner}
                  className="w-full text-xs font-medium text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
