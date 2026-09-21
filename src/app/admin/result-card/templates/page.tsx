"use client"

import { useEffect, useMemo, useState } from "react"
import { Save, Printer, Plus, Trash2, Award, Users, FileText, RotateCcw, Settings, Eye, Upload, ArrowUp, ArrowDown, GraduationCap, X, CheckSquare, Pencil, ToggleLeft, ToggleRight, Copy } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import PrimaryFormatCard, { PRIMARY_DEFAULT, PrimaryData } from "@/components/result-card/PrimaryFormatCard"
import ProgressReportCard, { PROGRESS_DEFAULT } from "@/components/result-card/ProgressReportCard"
import PrePrimaryFormatCard, { PREPRIMARY_DEFAULT } from "@/components/result-card/PrePrimaryFormatCard"
import MiddleSchoolFormatCard, { MIDDLE_DEFAULT } from "@/components/result-card/MiddleSchoolFormatCard"
import { DEFAULT_PRIMARY_CONFIG, PrimaryTemplateConfig, extractConfigFromTemplate, uid, ensureDataForConfig } from "@/lib/primary-config"
import { DEFAULT_PROGRESS_CONFIG, ProgressTemplateConfig, extractProgressConfig, ensureProgressData } from "@/lib/progress-config"
import { DEFAULT_PREPRIMARY_CONFIG, PrePrimaryConfig, extractPrePrimaryConfig, ensurePrePrimaryData } from "@/lib/preprimary-config"
import { DEFAULT_MIDDLE_CONFIG, MiddleSchoolConfig, extractMiddleConfig, ensureMiddleData } from "@/lib/middle-config"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"

const swal = Swal.mixin({
  customClass: {
    popup: "rounded-2xl shadow-2xl border border-gray-100 p-6",
    title: "text-[18px] font-bold text-gray-800 tracking-tight",
    htmlContainer: "text-sm text-gray-600 mt-1",
    confirmButton: "bg-[var(--primary)] hover:opacity-90 text-white rounded-xl px-6 py-2.5 text-sm font-semibold shadow-md transition-all",
    cancelButton: "bg-white hover:bg-gray-50 text-gray-700 rounded-xl px-6 py-2.5 text-sm font-medium border border-gray-200 shadow-sm transition-all",
    input: "rounded-xl border-gray-300 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent shadow-sm",
    actions: "gap-3 mt-6",
  },
  buttonsStyling: false,
  confirmButtonColor: "#ff7732",
  cancelButtonColor: "#6b7280",
  background: "#fff",
  backdrop: "rgba(15,23,42,0.45)",
  showClass: { popup: "swal2-show" },
  hideClass: { popup: "swal2-hide" },
})

const TEMPLATE_NAME = "Primary Format (Class I to V)"
const PROGRESS_NAME = "PROGRESS REPORT"
const PREPRIMARY_NAME = "Pre-Primary Format (Montessori to K.G.)"
const MIDDLE_NAME = "Middle School Format (Class VI to VIII)"
const SESSION_DEFAULT = "2025-26"
const isProgressTpl = (tpl: TemplateSetting | null | undefined) => !!tpl && tpl.name.toLowerCase().includes("progress")
const isPrePrimaryTpl = (tpl: TemplateSetting | null | undefined) => !!tpl && tpl.name.toLowerCase().includes("pre-primary")
const isMiddleTpl = (tpl: TemplateSetting | null | undefined) => !!tpl && tpl.name.toLowerCase().includes("middle")

type TemplateSetting = {
  id: number
  name: string
  class_id: number | null
  class_name?: string
  session: string | null
  is_active: boolean
  pages?: any
  grade_scale?: any
}

type Student = {
  id: number
  first_name?: string
  last_name?: string
  class_name?: string
  section_name?: string
  roll_no?: string | number
  mother_name?: string
  father_name?: string
  class_id?: number
}

type RecordRow = {
  id: number
  template_id: number
  student_id: number | null
  session: string | null
  data: PrimaryData
  first_name?: string
  last_name?: string
}

export default function TemplatesPage() {
  const { data: templates, loading: tplLoading, refetch: refetchTpl } = useApi<TemplateSetting>("/api/result-card/templates")
  const { data: records, refetch: refetchRecords } = useApi<RecordRow>("/api/result-card/records")
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<number | "manual" | null>(null)
  const [recordId, setRecordId] = useState<number | null>(null)
  const [data, setData] = useState<Record<string, string>>({ ...PRIMARY_DEFAULT })
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<"fill" | "edit">("fill")
  const [tplConfig, setTplConfig] = useState<PrimaryTemplateConfig>({ ...DEFAULT_PRIMARY_CONFIG })
  const [progressConfig, setProgressConfig] = useState<ProgressTemplateConfig>({ ...DEFAULT_PROGRESS_CONFIG })
  const [prePrimaryConfig, setPrePrimaryConfig] = useState<PrePrimaryConfig>({ ...DEFAULT_PREPRIMARY_CONFIG })
  const [middleConfig, setMiddleConfig] = useState<MiddleSchoolConfig>({ ...DEFAULT_MIDDLE_CONFIG })
  const [editTplName, setEditTplName] = useState("")
  const [savingTpl, setSavingTpl] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const { classes, sections, sectionsOf } = useClassesAndSections()
  const [assignTpl, setAssignTpl] = useState<TemplateSetting | null>(null)
  const [assignSelected, setAssignSelected] = useState<Record<number, { checked: boolean; sections: Set<number> }>>({})
  const [savingAssign, setSavingAssign] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const [activeTemplateId, setActiveTemplateId] = useState<number | null>(null)
  const primaryTemplate = useMemo(() => templates.find((t) => t.name === TEMPLATE_NAME) || null, [templates])
  const progressTemplate = useMemo(() => templates.find((t) => t.name.toLowerCase().includes("progress")) || null, [templates])
  const prePrimaryTemplate = useMemo(() => templates.find((t) => t.name.toLowerCase().includes("pre-primary")) || null, [templates])
  const middleTemplate = useMemo(() => templates.find((t) => t.name.toLowerCase().includes("middle")) || null, [templates])
  const activeTemplate = useMemo(() => {
    if (activeTemplateId) return templates.find((t) => t.id === activeTemplateId) || null
    return primaryTemplate || progressTemplate || prePrimaryTemplate || middleTemplate || templates[0] || null
  }, [templates, activeTemplateId, primaryTemplate, progressTemplate, prePrimaryTemplate, middleTemplate])
  const templateId = activeTemplate?.id ?? null
  const templateRecords = useMemo(() => (templateId ? records.filter((r) => r.template_id === templateId) : []), [records, templateId])

  // auto-select primary template when loaded
  useEffect(() => {
    if (!activeTemplateId && primaryTemplate) setActiveTemplateId(primaryTemplate.id)
    if (!activeTemplateId && templates.length === 1) setActiveTemplateId(templates[0].id)
  }, [primaryTemplate, templates, activeTemplateId])
  const selectedStudent = useMemo(() => (typeof selectedStudentId === "number" ? students.find((s) => s.id === selectedStudentId) || null : null), [students, selectedStudentId])

  useEffect(() => {
    fetch("/api/student-information/student")
      .then((r) => r.json())
      .then((list) => {
        const arr = Array.isArray(list) ? list : list?.data ?? []
        setStudents(arr)
      })
      .catch(() => {})
  }, [])

  // load config when template changes
  useEffect(() => {
    if (activeTemplate) {
      setEditTplName(activeTemplate.name)
      if (isMiddleTpl(activeTemplate)) {
        const cfg = extractMiddleConfig(activeTemplate as any)
        if (cfg) {
          setMiddleConfig(cfg)
          setData((prev) => ensureMiddleData(cfg, { ...MIDDLE_DEFAULT, ...prev }))
        } else {
          setMiddleConfig({ ...DEFAULT_MIDDLE_CONFIG })
          setData((prev) => ensureMiddleData(DEFAULT_MIDDLE_CONFIG, { ...MIDDLE_DEFAULT, ...prev }))
        }
      } else if (isPrePrimaryTpl(activeTemplate)) {
        const cfg = extractPrePrimaryConfig(activeTemplate as any)
        if (cfg) {
          setPrePrimaryConfig(cfg)
          setData((prev) => ensurePrePrimaryData(cfg, { ...PREPRIMARY_DEFAULT, ...prev }))
        } else {
          setPrePrimaryConfig({ ...DEFAULT_PREPRIMARY_CONFIG })
          setData((prev) => ensurePrePrimaryData(DEFAULT_PREPRIMARY_CONFIG, { ...PREPRIMARY_DEFAULT, ...prev }))
        }
      } else if (isProgressTpl(activeTemplate)) {
        const cfg = extractProgressConfig(activeTemplate as any)
        if (cfg) {
          setProgressConfig(cfg)
          setData((prev) => ensureProgressData(cfg, { ...PROGRESS_DEFAULT, ...prev }))
        } else {
          setProgressConfig({ ...DEFAULT_PROGRESS_CONFIG })
          setData((prev) => ensureProgressData(DEFAULT_PROGRESS_CONFIG, { ...PROGRESS_DEFAULT, ...prev }))
        }
      } else {
        const cfg = extractConfigFromTemplate(activeTemplate as any)
        if (cfg) {
          setTplConfig(cfg)
          setData((prev) => ensureDataForConfig(cfg, prev))
        } else {
          setTplConfig({ ...DEFAULT_PRIMARY_CONFIG })
          setData((prev) => ensureDataForConfig(DEFAULT_PRIMARY_CONFIG, prev))
        }
      }
    }
  }, [activeTemplate])

  const handleChange = (k: string, v: string) => setData((prev) => ({ ...prev, [k]: v }))

  const createTemplate = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/result-card/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: TEMPLATE_NAME,
          session: SESSION_DEFAULT,
          pages: [{ id: "primary-config", label: "Primary Config", config: DEFAULT_PRIMARY_CONFIG }],
          grade_scale: DEFAULT_PRIMARY_CONFIG.gradeScale,
          is_active: true,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create template")
      await refetchTpl()
      swal.fire({ icon: "success", title: "Template created", text: json.name || TEMPLATE_NAME, confirmButtonColor: "#ff7732" })
    } catch (e: any) {
      swal.fire({ icon: "error", title: "Create failed", text: e.message, confirmButtonColor: "#ff7732" })
    } finally {
      setCreating(false)
    }
  }

  const createProgressTemplate = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/result-card/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: PROGRESS_NAME,
          session: SESSION_DEFAULT,
          pages: [{ id: "progress-config", label: "Progress Config", config: DEFAULT_PROGRESS_CONFIG }],
          grade_scale: [],
          is_active: true,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create template")
      await refetchTpl()
      swal.fire({ icon: "success", title: "Template created", text: json.name || PROGRESS_NAME, confirmButtonColor: "#ff7732" })
    } catch (e: any) {
      swal.fire({ icon: "error", title: "Create failed", text: e.message, confirmButtonColor: "#ff7732" })
    } finally {
      setCreating(false)
    }
  }

  const createPrePrimaryTemplate = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/result-card/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: PREPRIMARY_NAME,
          session: SESSION_DEFAULT,
          pages: [{ id: "preprimary-config", label: "PrePrimary Config", config: DEFAULT_PREPRIMARY_CONFIG }],
          grade_scale: [],
          is_active: true,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create template")
      await refetchTpl()
      swal.fire({ icon: "success", title: "Template created", text: json.name || PREPRIMARY_NAME, confirmButtonColor: "#ff7732" })
    } catch (e: any) {
      swal.fire({ icon: "error", title: "Create failed", text: e.message, confirmButtonColor: "#ff7732" })
    } finally {
      setCreating(false)
    }
  }

  const createMiddleTemplate = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/result-card/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: MIDDLE_NAME,
          session: SESSION_DEFAULT,
          pages: [{ id: "middle-config", label: "Middle Config", config: DEFAULT_MIDDLE_CONFIG }],
          grade_scale: [],
          is_active: true,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create template")
      await refetchTpl()
      swal.fire({ icon: "success", title: "Template created", text: json.name || MIDDLE_NAME, confirmButtonColor: "#ff7732" })
    } catch (e: any) {
      swal.fire({ icon: "error", title: "Create failed", text: e.message, confirmButtonColor: "#ff7732" })
    } finally {
      setCreating(false)
    }
  }

  const renameTemplate = async (tpl: TemplateSetting, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) return swal.fire({ icon: "warning", title: "Name required", text: "Template name cannot be empty", confirmButtonColor: "#ff7732" })
    try {
      const res = await fetch(`/api/result-card/templates/${tpl.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          session: tpl.session || SESSION_DEFAULT,
          pages: (tpl as any).pages || [{ id: "primary-config", label: "Primary Config", config: extractConfigFromTemplate(tpl as any) || DEFAULT_PRIMARY_CONFIG }],
          grade_scale: (tpl as any).grade_scale || DEFAULT_PRIMARY_CONFIG.gradeScale,
          is_active: tpl.is_active,
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || "Rename failed")
      }
      await refetchTpl()
      swal.fire({ icon: "success", title: "Renamed", text: `Template renamed to "${trimmed}"`, confirmButtonColor: "#ff7732" })
    } catch (e: any) {
      swal.fire({ icon: "error", title: "Rename failed", text: e.message, confirmButtonColor: "#ff7732" })
    }
  }

  const toggleActive = async (tpl: TemplateSetting) => {
    const next = !tpl.is_active
    const result = await swal.fire({
      title: next ? "Activate template?" : "Deactivate template?",
      text: `${tpl.name} will be ${next ? "activated" : "deactivated"} — inactive templates are hidden from student records.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ff7732",
      cancelButtonColor: "#6b7280",
      confirmButtonText: next ? "Activate" : "Deactivate",
    })
    if (!result.isConfirmed) return
    try {
      const res = await fetch(`/api/result-card/templates/${tpl.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tpl.name,
          session: tpl.session || SESSION_DEFAULT,
          pages: (tpl as any).pages || [{ id: "primary-config", label: "Primary Config", config: extractConfigFromTemplate(tpl as any) || DEFAULT_PRIMARY_CONFIG }],
          grade_scale: (tpl as any).grade_scale || DEFAULT_PRIMARY_CONFIG.gradeScale,
          is_active: next,
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || "Update failed")
      }
      await refetchTpl()
      swal.fire({ icon: "success", title: next ? "Activated" : "Deactivated", text: `${tpl.name} is now ${next ? "active" : "inactive"}`, confirmButtonColor: "#ff7732" })
    } catch (e: any) {
      swal.fire({ icon: "error", title: "Update failed", text: e.message, confirmButtonColor: "#ff7732" })
    }
  }

   const saveTemplateConfig = async () => {
    if (!activeTemplate) return
    const trimmed = editTplName.trim()
    if (!trimmed) return swal.fire({ icon: "warning", title: "Name required", text: "Template name cannot be empty", confirmButtonColor: "#ff7732" })
    setSavingTpl(true)
    try {
      const isMiddle = isMiddleTpl(activeTemplate)
      const isPrePrimary = isPrePrimaryTpl(activeTemplate)
      const isProgress = isProgressTpl(activeTemplate)
      let pages: any
      let grade_scale: any
      if (isMiddle) {
        pages = [{ id: "middle-config", label: "Middle Config", config: middleConfig }]
        grade_scale = []
      } else if (isPrePrimary) {
        pages = [{ id: "preprimary-config", label: "PrePrimary Config", config: prePrimaryConfig }]
        grade_scale = []
      } else if (isProgress) {
        pages = [{ id: "progress-config", label: "Progress Config", config: progressConfig }]
        grade_scale = []
      } else {
        pages = [{ id: "primary-config", label: "Primary Config", config: tplConfig }]
        grade_scale = tplConfig.gradeScale
      }
      const res = await fetch(`/api/result-card/templates/${activeTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          session: activeTemplate.session || SESSION_DEFAULT,
          pages,
          grade_scale,
          is_active: true,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to save template")
      await refetchTpl()
      swal.fire({ icon: "success", title: "Template saved", text: `"${trimmed}" structure saved — changes are live`, confirmButtonColor: "#ff7732" })
    } catch (e: any) {
      swal.fire({ icon: "error", title: "Save failed", text: e.message, confirmButtonColor: "#ff7732" })
    } finally {
      setSavingTpl(false)
    }
  }

  const uploadLogo = async (file: File) => {
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append("files", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json()
      const url = json.uploaded?.[0]?.url
      if (url) setTplConfig((prev) => ({ ...prev, header: { ...prev.header, logo: url } }))
      else throw new Error("Upload failed")
      swal.fire({ icon: "success", title: "Logo uploaded", confirmButtonColor: "#ff7732", timer: 1200, showConfirmButton: false })
    } catch (e: any) {
      swal.fire({ icon: "error", title: "Upload failed", text: e.message, confirmButtonColor: "#ff7732" })
    } finally {
      setUploadingLogo(false)
    }
  }

  const deleteTemplate = async (id: number) => {
    const result = await swal.fire({
      title: "Delete template?",
      text: "All linked records will remain but template will be deleted. This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete",
    })
    if (!result.isConfirmed) return
    try {
      let res = await fetch(`/api/result-card/templates/${id}`, { method: "DELETE" })
      if (!res.ok) {
        res = await fetch(`/api/result-card/templates?id=${id}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Delete failed")
      }
      if (activeTemplateId === id) setActiveTemplateId(null)
      await refetchTpl()
      await refetchRecords()
      swal.fire({ icon: "success", title: "Deleted", text: "Template deleted", confirmButtonColor: "#ff7732", timer: 1200, showConfirmButton: false })
    } catch (e: any) {
      swal.fire({ icon: "error", title: "Delete failed", text: e.message, confirmButtonColor: "#ff7732" })
    }
  }

  const duplicateTemplate = async (tpl: TemplateSetting) => {
    try {
      const cfg = extractConfigFromTemplate(tpl as any) || DEFAULT_PRIMARY_CONFIG
      const res = await fetch("/api/result-card/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tpl.name + " (Copy)",
          session: tpl.session || SESSION_DEFAULT,
          pages: [{ id: "primary-config", label: "Primary Config", config: cfg }],
          grade_scale: (cfg as any).gradeScale || DEFAULT_PRIMARY_CONFIG.gradeScale,
          is_active: true,
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || "Duplicate failed")
      }
      await refetchTpl()
      swal.fire({ icon: "success", title: "Duplicated", text: `Created ${tpl.name} (Copy)`, confirmButtonColor: "#ff7732" })
    } catch (e: any) {
      swal.fire({ icon: "error", title: "Duplicate failed", text: e.message, confirmButtonColor: "#ff7732" })
    }
  }

  const createNewTemplate = async () => {
    const { value: name, isConfirmed } = await swal.fire({
      title: "New Template",
      input: "text",
      inputLabel: "Template name",
      inputValue: "Primary Format (Class I to V) - New",
      showCancelButton: true,
      confirmButtonColor: "#ff7732",
      inputValidator: (v) => (!v || !v.trim() ? "Name is required" : undefined),
    })
    if (!isConfirmed || !name || !name.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/result-card/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          session: SESSION_DEFAULT,
          pages: [{ id: "primary-config", label: "Primary Config", config: DEFAULT_PRIMARY_CONFIG }],
          grade_scale: DEFAULT_PRIMARY_CONFIG.gradeScale,
          is_active: true,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || "Create failed")
      await refetchTpl()
      swal.fire({ icon: "success", title: "Created", text: `Template "${name.trim()}" created`, confirmButtonColor: "#ff7732" })
    } catch (e: any) {
      swal.fire({ icon: "error", title: "Create failed", text: e.message, confirmButtonColor: "#ff7732" })
    } finally {
      setCreating(false)
    }
  }

  const openAssign = (tpl: TemplateSetting) => {
    const cfg = extractConfigFromTemplate(tpl as any) || DEFAULT_PRIMARY_CONFIG
    const sel: Record<number, { checked: boolean; sections: Set<number> }> = {}
    for (const c of classes) sel[c.id] = { checked: false, sections: new Set() }
    if (cfg.assignments) {
      for (const a of cfg.assignments) {
        if (!sel[a.classId]) sel[a.classId] = { checked: true, sections: new Set(a.sectionIds) }
        else {
          sel[a.classId].checked = true
          sel[a.classId].sections = new Set(a.sectionIds)
        }
      }
    }
    // also handle legacy: if no assignments, leave unchecked (means not assigned)
    setAssignTpl(tpl)
    setAssignSelected(sel)
  }

  const toggleAssignClass = (classId: number, checked: boolean) => {
    setAssignSelected((prev) => {
      const next = { ...prev }
      if (!next[classId]) next[classId] = { checked, sections: new Set() }
      else next[classId] = { checked, sections: checked ? next[classId].sections : new Set() }
      return next
    })
  }

  const toggleAssignSection = (classId: number, sectionId: number, checked: boolean) => {
    setAssignSelected((prev) => {
      const next = { ...prev }
      if (!next[classId]) next[classId] = { checked: true, sections: new Set() }
      const s = new Set(next[classId].sections)
      if (checked) s.add(sectionId)
      else s.delete(sectionId)
      next[classId] = { checked: true, sections: s }
      return next
    })
  }

  const saveAssign = async () => {
    if (!assignTpl) return
    setSavingAssign(true)
    try {
      const cfg = extractConfigFromTemplate(assignTpl as any) || DEFAULT_PRIMARY_CONFIG
      const assignments = Object.entries(assignSelected)
        .filter(([, v]) => v.checked)
        .map(([cid, v]) => {
          const cidNum = Number(cid)
          const c = classes.find((x) => x.id === cidNum)
          return {
            classId: cidNum,
            className: c?.name || String(cidNum),
            sectionIds: Array.from(v.sections),
            sectionNames: Array.from(v.sections).map((sid) => sections.find((s) => s.id === sid)?.name || String(sid)),
          }
        })
      const newCfg = { ...cfg, assignments }
      const res = await fetch(`/api/result-card/templates/${assignTpl.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: assignTpl.name,
          session: assignTpl.session || SESSION_DEFAULT,
          pages: [{ id: "primary-config", label: "Primary Config", config: newCfg }],
          grade_scale: newCfg.gradeScale,
          is_active: true,
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || "Save failed")
      }
      await refetchTpl()
      setAssignTpl(null)
    } catch (e: any) {
      swal.fire({ icon: "error", title: "Save failed", text: e.message, confirmButtonColor: "#ff7732" })
    } finally {
      setSavingAssign(false)
    }
  }

  const selectStudent = (id: number | "manual" | null) => {
    setSelectedStudentId(id)
    setRecordId(null)
    if (id === null) {
      if (isMiddleTpl(activeTemplate)) setData({ ...MIDDLE_DEFAULT })
      else if (isPrePrimaryTpl(activeTemplate)) setData({ ...PREPRIMARY_DEFAULT })
      else if (isProgressTpl(activeTemplate)) setData({ ...PROGRESS_DEFAULT })
      else setData(ensureDataForConfig(tplConfig, { ...PRIMARY_DEFAULT }))
      return
    }
    if (id === "manual") {
      if (isMiddleTpl(activeTemplate)) setData({ ...MIDDLE_DEFAULT })
      else if (isPrePrimaryTpl(activeTemplate)) setData({ ...PREPRIMARY_DEFAULT })
      else if (isProgressTpl(activeTemplate)) setData({ ...PROGRESS_DEFAULT })
      else setData(ensureDataForConfig(tplConfig, { ...PRIMARY_DEFAULT }))
      return
    }
    const s = students.find((x) => x.id === id)
    const existing = templateRecords.find((r) => r.student_id === id)
    if (existing) {
      setRecordId(existing.id)
      if (isMiddleTpl(activeTemplate)) {
        setData({ ...MIDDLE_DEFAULT, ...(existing.data as any) })
      } else if (isPrePrimaryTpl(activeTemplate)) {
        setData({ ...PREPRIMARY_DEFAULT, ...(existing.data as any) })
      } else if (isProgressTpl(activeTemplate)) {
        setData({ ...PROGRESS_DEFAULT, ...(existing.data as any) })
      } else {
        setData(ensureDataForConfig(tplConfig, { ...PRIMARY_DEFAULT, ...(existing.data as PrimaryData) }))
      }
    } else if (s) {
      if (isMiddleTpl(activeTemplate)) {
        setData({
          ...MIDDLE_DEFAULT,
          name: [s.first_name, s.last_name].filter(Boolean).join(" ") || MIDDLE_DEFAULT.name,
          class: s.class_name || MIDDLE_DEFAULT.class,
          rollNo: String(s.roll_no ?? MIDDLE_DEFAULT.rollNo),
          motherName: (s as any).mother_name || MIDDLE_DEFAULT.motherName,
          fatherName: (s as any).father_name || MIDDLE_DEFAULT.fatherName,
          session: SESSION_DEFAULT,
        })
      } else if (isPrePrimaryTpl(activeTemplate)) {
        setData({
          ...PREPRIMARY_DEFAULT,
          name: [s.first_name, s.last_name].filter(Boolean).join(" ") || PREPRIMARY_DEFAULT.name,
          class: s.class_name || PREPRIMARY_DEFAULT.class,
          rollNo: String(s.roll_no ?? PREPRIMARY_DEFAULT.rollNo),
          motherName: (s as any).mother_name || PREPRIMARY_DEFAULT.motherName,
          fatherName: (s as any).father_name || PREPRIMARY_DEFAULT.fatherName,
          session: SESSION_DEFAULT,
        })
      } else if (isProgressTpl(activeTemplate)) {
        setData({
          ...PROGRESS_DEFAULT,
          studentName: [s.first_name, s.last_name].filter(Boolean).join(" ") || PROGRESS_DEFAULT.studentName,
          class: s.class_name || PROGRESS_DEFAULT.class,
          rollNo: String(s.roll_no ?? PROGRESS_DEFAULT.rollNo),
          session: SESSION_DEFAULT,
        })
      } else {
        setData(ensureDataForConfig(tplConfig, {
          ...PRIMARY_DEFAULT,
          name: [s.first_name, s.last_name].filter(Boolean).join(" ") || PRIMARY_DEFAULT.name,
          class: s.class_name || PRIMARY_DEFAULT.class,
          section: (s as any).section_name || (s as any).section || PRIMARY_DEFAULT.section || "A",
          rollNo: String(s.roll_no ?? PRIMARY_DEFAULT.rollNo),
          motherName: s.mother_name || PRIMARY_DEFAULT.motherName,
          fatherName: s.father_name || PRIMARY_DEFAULT.fatherName,
          session: SESSION_DEFAULT,
        }))
      }
    }
  }

  const loadRecord = (r: RecordRow) => {
    setSelectedStudentId(r.student_id || "manual")
    setRecordId(r.id)
    if (isMiddleTpl(activeTemplate)) {
      setData({ ...MIDDLE_DEFAULT, ...(r.data as any) })
    } else if (isPrePrimaryTpl(activeTemplate)) {
      setData({ ...PREPRIMARY_DEFAULT, ...(r.data as any) })
    } else if (isProgressTpl(activeTemplate)) {
      setData({ ...PROGRESS_DEFAULT, ...(r.data as any) })
    } else {
      setData(ensureDataForConfig(tplConfig, { ...PRIMARY_DEFAULT, ...(r.data as PrimaryData) }))
    }
    setActiveTab("fill")
    window.scrollTo({ top: 400, behavior: "smooth" })
  }

  const save = async () => {
    if (!templateId) return swal.fire({ icon: "warning", title: "No template", text: "Create template first", confirmButtonColor: "#ff7732" })
    setSaving(true)
    try {
      const payload: any = {
        template_id: templateId,
        student_id: typeof selectedStudentId === "number" ? selectedStudentId : null,
        session: data.session || SESSION_DEFAULT,
        data,
      }
      if (recordId) payload.id = recordId
      const res = await fetch("/api/result-card/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to save")
      setRecordId(json.id)
      await refetchRecords()
      swal.fire({ icon: "success", title: "Saved", text: "Result saved successfully", confirmButtonColor: "#ff7732", timer: 1500, showConfirmButton: false })
    } catch (e: any) {
      swal.fire({ icon: "error", title: "Save failed", text: e.message, confirmButtonColor: "#ff7732" })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefault = async () => {
    const result = await swal.fire({
      title: "Reset marks?",
      text: "Reset all marks to sample values?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ff7732",
      confirmButtonText: "Reset",
    })
    if (!result.isConfirmed) return
    if (isMiddleTpl(activeTemplate)) {
      setData({ ...MIDDLE_DEFAULT })
    } else if (isPrePrimaryTpl(activeTemplate)) {
      setData({ ...PREPRIMARY_DEFAULT })
    } else if (isProgressTpl(activeTemplate)) {
      setData({ ...PROGRESS_DEFAULT })
    } else {
      setData(ensureDataForConfig(tplConfig, { ...PRIMARY_DEFAULT }))
    }
    swal.fire({ icon: "success", title: "Reset", text: "Marks reset to sample", confirmButtonColor: "#ff7732", timer: 1200, showConfirmButton: false })
  }

  // helpers for config editing
  const move = <T,>(arr: T[], from: number, to: number) => {
    const a = [...arr]
    const [item] = a.splice(from, 1)
    a.splice(to, 0, item)
    return a
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm no-print">
        <h1 className="text-xl font-semibold text-white">Primary Format (Class I to V)</h1>
        <p className="mt-1 text-sm text-white/80">Custom Result / Primary Format — dynamic editable template</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 no-print">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Award className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Result Templates</h2>
              <p className="text-xs text-gray-500">Primary Format (Class I to V) — every field editable & dynamic · Edit or Delete templates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={createNewTemplate} disabled={creating} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              <Plus className="h-4 w-4" /> New Template
            </button>
            {!primaryTemplate && !tplLoading && (
              <button onClick={createTemplate} disabled={creating} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-orange-50 disabled:opacity-50">
                <Plus className="h-4 w-4" /> Create Primary Format
              </button>
            )}
            {!progressTemplate && !tplLoading && (
              <button onClick={createProgressTemplate} disabled={creating} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50">
                <Plus className="h-4 w-4" /> Add PROGRESS REPORT
              </button>
            )}
            {!prePrimaryTemplate && !tplLoading && (
              <button onClick={createPrePrimaryTemplate} disabled={creating} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
                <Plus className="h-4 w-4" /> Add Pre-Primary Format
              </button>
            )}
            {!middleTemplate && !tplLoading && (
              <button onClick={createMiddleTemplate} disabled={creating} className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 px-4 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50 disabled:opacity-50">
                <Plus className="h-4 w-4" /> Add Middle School Format
              </button>
            )}
          </div>
        </div>

        {tplLoading ? (
          <p className="mt-4 text-xs text-gray-400">Loading templates…</p>
        ) : templates.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-xs text-amber-700">No templates yet. Click <b>New Template</b> or <b>Create Primary Format</b> to create <b>{TEMPLATE_NAME}</b> from <code>Subhrojit class 4.html</code> — every input in that file is mapped to an editable field.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Session</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className={`border-t border-gray-100 ${activeTemplate?.id === t.id ? "bg-orange-50/50" : "hover:bg-gray-50"}`}>
                    <td className="px-3 py-2">
                      <button onClick={() => { setActiveTemplateId(t.id); setActiveTab("fill") }} className="text-left">
                        <div className="font-medium text-gray-800 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-[var(--primary)]" />{t.name}</div>
                        <div className="text-[11px] text-gray-400">ID {t.id} {t.class_name ? `· ${t.class_name}` : ""}</div>
                        {(() => {
                          const cfg = extractConfigFromTemplate(t as any)
                          if (cfg?.assignments && cfg.assignments.length > 0) {
                            return <div className="text-[11px] text-indigo-600 whitespace-normal break-words max-w-[320px] leading-tight">{cfg.assignments.map((a) => `${a.className}${a.sectionIds.length ? ` (${a.sectionNames.join(",")})` : ""}`).join(" • ")}</div>
                          }
                          return <div className="text-[11px] text-gray-400">All classes • Click Assign to set</div>
                        })()}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">{t.session || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${t.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500"}`}>{t.is_active ? "Active" : "Inactive"}</span>
                      {activeTemplate?.id === t.id && <span className="ml-2 inline-flex px-2 py-0.5 rounded-full text-xs bg-[var(--primary)] text-white">Selected</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1.5 flex-wrap justify-end">
                        <button onClick={() => { setActiveTemplateId(t.id); setActiveTab("fill") }} className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-orange-50 hover:border-orange-200 text-gray-600 hover:text-[var(--primary)] shadow-sm transition-colors" title="Fill marks"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => { setActiveTemplateId(t.id); setActiveTab("edit") }} className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 shadow-sm transition-colors" title="Edit structure"><Settings className="h-4 w-4" /></button>
                        <button onClick={async () => {
                          const { value: n, isConfirmed } = await swal.fire({
                            title: "Rename Template",
                            input: "text",
                            inputValue: t.name,
                            inputLabel: "Template name",
                            showCancelButton: true,
                            confirmButtonColor: "#ff7732",
                            inputValidator: (v) => (!v || !v.trim() ? "Name cannot be empty" : undefined),
                          })
                          if (isConfirmed && n && n.trim() && n !== t.name) renameTemplate(t, n)
                        }} className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 text-amber-600 shadow-sm transition-colors" title="Rename"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => toggleActive(t)} className={`inline-flex items-center justify-center h-8 w-8 rounded-lg border shadow-sm transition-colors ${t.is_active ? "border-green-200 bg-green-50 text-green-600 hover:bg-green-100" : "border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200"}`} title={t.is_active ? "Set Inactive" : "Set Active"}>
                          {t.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                        <button onClick={() => openAssign(t)} className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-600 shadow-sm transition-colors" title="Assign Classes & Sections"><GraduationCap className="h-4 w-4" /></button>
                        <button onClick={() => duplicateTemplate(t)} className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 shadow-sm transition-colors" title="Duplicate"><Copy className="h-4 w-4" /></button>
                        <button onClick={() => deleteTemplate(t.id)} className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 shadow-sm transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTemplate && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500">Editing: <b className="text-gray-800">{activeTemplate.name}</b> (ID {activeTemplate.id})</span>
            <span className={`ml-2 inline-flex px-2 py-0.5 rounded-full text-xs ${activeTemplate.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500"}`}>{activeTemplate.is_active ? "Active" : "Inactive"}</span>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setActiveTab("fill")} className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ${activeTab === "fill" ? "bg-[var(--primary)] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                <Eye className="h-4 w-4" /> Fill Marks / Preview
              </button>
              <button onClick={() => setActiveTab("edit")} className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ${activeTab === "edit" ? "bg-[var(--primary)] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                <Settings className="h-4 w-4" /> Edit Template (Dynamic)
              </button>
            </div>
          </div>
        )}
      </div>

      {activeTemplate && activeTab === "fill" && (
        <>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 no-print">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Student</label>
                <select
                  value={selectedStudentId ?? ""}
                  onChange={(e) => selectStudent(e.target.value === "" ? null : e.target.value === "manual" ? "manual" : Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">— New / Manual —</option>
                  <option value="manual">Manual entry (no student link)</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{[s.first_name, s.last_name].filter(Boolean).join(" ")}{s.roll_no ? ` (${s.roll_no})` : ""}{s.class_name ? ` - ${s.class_name}` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={saving || !templateId} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
                  <Save className="h-4 w-4" /> {saving ? "Saving…" : recordId ? "Update" : "Save Result"}
                </button>
                <button onClick={() => setShowPreview(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50">
                  <Eye className="h-4 w-4" /> Preview
                </button>
                <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Printer className="h-4 w-4" /> Print
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={resetToDefault} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset to sample
                </button>
                <button onClick={() => { setSelectedStudentId(null); setRecordId(null); setData(ensureDataForConfig(tplConfig, { ...PRIMARY_DEFAULT })) }} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
                  Clear
                </button>
              </div>
              <div className="text-xs text-gray-500">
                <div className="font-medium text-gray-700 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {templateRecords.length} saved records</div>
                <div>{selectedStudent ? `Editing: ${[selectedStudent.first_name, selectedStudent.last_name].filter(Boolean).join(" ")}` : recordId ? `Editing record #${recordId}` : "New record"}</div>
              </div>
            </div>
            {templateRecords.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Saved Records — click to load</p>
                <div className="flex flex-wrap gap-2">
                  {templateRecords.map((r) => {
                    const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || (r.data as any)?.name || `Record #${r.id}`
                    return (
                      <button
                        key={r.id}
                        onClick={() => loadRecord(r)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs border ${recordId === r.id ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}
                      >
                        {name} <span className="opacity-60">#{r.id}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="overflow-auto bg-[#e9ecef] p-4 rounded-xl border border-gray-200 print-area">
            {isMiddleTpl(activeTemplate) ? (
              <MiddleSchoolFormatCard data={data} onChange={handleChange} editable config={middleConfig} />
            ) : isPrePrimaryTpl(activeTemplate) ? (
              <PrePrimaryFormatCard data={data} onChange={handleChange} editable config={prePrimaryConfig} />
            ) : isProgressTpl(activeTemplate) ? (
              <ProgressReportCard data={data} onChange={handleChange} editable config={progressConfig} />
            ) : (
              <PrimaryFormatCard data={data} onChange={handleChange} editable config={tplConfig} />
            )}
          </div>
        </>
      )}

      {activeTemplate && activeTab === "edit" && (
        <div className="space-y-5 no-print">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-800">Edit Template Structure — changes are dynamic & live</h3>
              <button onClick={saveTemplateConfig} disabled={savingTpl} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
                <Save className="h-4 w-4" /> {savingTpl ? "Saving…" : "Save Template"}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">Header, subjects, habits, grade scale are all editable. After saving, the card preview below and all future prints use the new structure. Add/remove rows — marks inputs are free-text (no auto totals) matching your HTML.</p>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <label className="block text-xs font-medium text-amber-800 mb-1">Template Name — editable (ID {activeTemplate.id})</label>
              <div className="flex gap-2">
                <input value={editTplName} onChange={(e) => setEditTplName(e.target.value)} placeholder="Primary Format (Class I to V)" className="flex-1 rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-200" />
                <span className="inline-flex items-center px-2 text-xs text-amber-700">Will be saved with structure</span>
              </div>
            </div>
          </div>

          {isMiddleTpl(activeTemplate) ? (
            <>
              <div className="rounded-xl border border-sky-200 bg-white shadow-sm p-5">
                <h4 className="text-sm font-semibold text-sky-800 mb-3">Middle School Header — Class VI to VIII — all editable</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">School Name</label>
                    <input value={middleConfig.header.schoolName} onChange={(e) => setMiddleConfig({ ...middleConfig, header: { ...middleConfig.header, schoolName: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Board</label>
                    <input value={middleConfig.header.board} onChange={(e) => setMiddleConfig({ ...middleConfig, header: { ...middleConfig.header, board: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tagline</label>
                    <input value={middleConfig.header.tagline} onChange={(e) => setMiddleConfig({ ...middleConfig, header: { ...middleConfig.header, tagline: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estd</label>
                    <input value={middleConfig.header.estd} onChange={(e) => setMiddleConfig({ ...middleConfig, header: { ...middleConfig.header, estd: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                    <input value={middleConfig.header.title} onChange={(e) => setMiddleConfig({ ...middleConfig, header: { ...middleConfig.header, title: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle</label>
                    <input value={middleConfig.header.subtitle} onChange={(e) => setMiddleConfig({ ...middleConfig, header: { ...middleConfig.header, subtitle: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800">Subjects ({middleConfig.subjects.length}) — TERM I/II table</h4>
                  <button onClick={() => setMiddleConfig({ ...middleConfig, subjects: [...middleConfig.subjects, { id: `sub${uid()}`, label: "New Subject" }] })} className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white"><Plus className="h-3.5 w-3.5" /> Add Subject</button>
                </div>
                <div className="space-y-2">
                  {middleConfig.subjects.map((s, idx) => (
                    <div key={s.id} className="flex gap-2 items-center rounded-lg border border-gray-200 p-3 bg-gray-50/50">
                      <input value={s.label} onChange={(e) => { const a = [...middleConfig.subjects]; a[idx] = { ...s, label: e.target.value }; setMiddleConfig({ ...middleConfig, subjects: a }) }} className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" placeholder="e.g. English (i) Language" />
                      <button onClick={() => { if (idx > 0) setMiddleConfig({ ...middleConfig, subjects: move(middleConfig.subjects, idx, idx - 1) }) }} className="p-1 rounded hover:bg-white"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { if (idx < middleConfig.subjects.length - 1) setMiddleConfig({ ...middleConfig, subjects: move(middleConfig.subjects, idx, idx + 1) }) }} className="p-1 rounded hover:bg-white"><ArrowDown className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setMiddleConfig({ ...middleConfig, subjects: middleConfig.subjects.filter((_, i) => i !== idx) })} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-800">Personality ({middleConfig.personality.length})</h4>
                    <button onClick={() => setMiddleConfig({ ...middleConfig, personality: [...middleConfig.personality, { id: `p${uid()}`, label: "New Item" }] })} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs hover:bg-gray-50"><Plus className="h-3 w-3" /> Add</button>
                  </div>
                  <div className="space-y-1">
                    {middleConfig.personality.map((p, idx) => (
                      <div key={p.id} className="flex gap-2">
                        <input value={p.label} onChange={(e) => { const a = [...middleConfig.personality]; a[idx] = { ...p, label: e.target.value }; setMiddleConfig({ ...middleConfig, personality: a }) }} className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs" />
                        <button onClick={() => setMiddleConfig({ ...middleConfig, personality: middleConfig.personality.filter((_, i) => i !== idx) })} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-800">Co-curricular ({middleConfig.coCurricular.length})</h4>
                    <button onClick={() => setMiddleConfig({ ...middleConfig, coCurricular: [...middleConfig.coCurricular, { id: `c${uid()}`, label: "New Item" }] })} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs hover:bg-gray-50"><Plus className="h-3 w-3" /> Add</button>
                  </div>
                  <div className="space-y-1">
                    {middleConfig.coCurricular.map((c, idx) => (
                      <div key={c.id} className="flex gap-2">
                        <input value={c.label} onChange={(e) => { const a = [...middleConfig.coCurricular]; a[idx] = { ...c, label: e.target.value }; setMiddleConfig({ ...middleConfig, coCurricular: a }) }} className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs" />
                        <button onClick={() => setMiddleConfig({ ...middleConfig, coCurricular: middleConfig.coCurricular.filter((_, i) => i !== idx) })} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-700">Live Preview — Middle School (VI-VIII)</p>
                <p className="text-[11px] text-gray-500 mb-3">All header/subjects/personality/co-curricular values are editable — marks remain editable in Fill tab.</p>
                <div className="overflow-auto bg-[#e9ecef] p-4 rounded-xl border border-gray-200 max-h-[70vh]">
                  <MiddleSchoolFormatCard data={data} onChange={() => {}} editable={false} config={middleConfig} />
                </div>
              </div>
            </>
          ) : isPrePrimaryTpl(activeTemplate) ? (
            <>
              <div className="rounded-xl border border-emerald-200 bg-white shadow-sm p-5">
                <h4 className="text-sm font-semibold text-emerald-800 mb-3">Pre-Primary Header — Montessori to K.G. — all editable</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">School Name</label>
                    <input value={prePrimaryConfig.header.schoolName} onChange={(e) => setPrePrimaryConfig({ ...prePrimaryConfig, header: { ...prePrimaryConfig.header, schoolName: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle</label>
                    <input value={prePrimaryConfig.header.subtitle} onChange={(e) => setPrePrimaryConfig({ ...prePrimaryConfig, header: { ...prePrimaryConfig.header, subtitle: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tagline</label>
                    <input value={prePrimaryConfig.header.tagline} onChange={(e) => setPrePrimaryConfig({ ...prePrimaryConfig, header: { ...prePrimaryConfig.header, tagline: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estd</label>
                    <input value={prePrimaryConfig.header.estd} onChange={(e) => setPrePrimaryConfig({ ...prePrimaryConfig, header: { ...prePrimaryConfig.header, estd: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                    <input value={prePrimaryConfig.header.title} onChange={(e) => setPrePrimaryConfig({ ...prePrimaryConfig, header: { ...prePrimaryConfig.header, title: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800">Left Column Groups ({prePrimaryConfig.leftGroups.length})</h4>
                  <button onClick={() => setPrePrimaryConfig({ ...prePrimaryConfig, leftGroups: [...prePrimaryConfig.leftGroups, { id: `lg${uid()}`, title: "New Group", items: [{ id: `it${uid()}`, label: "• New Item" }] }] })} className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white"><Plus className="h-3.5 w-3.5" /> Add Group</button>
                </div>
                <div className="space-y-4">
                  {prePrimaryConfig.leftGroups.map((g, gi) => (
                    <div key={g.id} className="rounded-lg border border-gray-200 p-3 bg-gray-50/50">
                      <div className="flex gap-2 mb-2">
                        <input value={g.title} onChange={(e) => { const a = [...prePrimaryConfig.leftGroups]; a[gi] = { ...g, title: e.target.value }; setPrePrimaryConfig({ ...prePrimaryConfig, leftGroups: a }) }} className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-semibold" placeholder="Group title e.g. Subject: a) ENGLISH (empty for no header)" />
                        <button onClick={() => setPrePrimaryConfig({ ...prePrimaryConfig, leftGroups: prePrimaryConfig.leftGroups.filter((_, i) => i !== gi) })} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="space-y-1">
                        {g.items.map((it, ii) => (
                          <div key={it.id} className="flex gap-2">
                            <input value={it.label} onChange={(e) => { const a = [...prePrimaryConfig.leftGroups]; const items = [...a[gi].items]; items[ii] = { ...it, label: e.target.value }; a[gi] = { ...g, items }; setPrePrimaryConfig({ ...prePrimaryConfig, leftGroups: a }) }} className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs" placeholder="• Item label" />
                            <button onClick={() => { const a = [...prePrimaryConfig.leftGroups]; a[gi] = { ...g, items: a[gi].items.filter((_, i) => i !== ii) }; setPrePrimaryConfig({ ...prePrimaryConfig, leftGroups: a }) }} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        ))}
                        <button onClick={() => { const a = [...prePrimaryConfig.leftGroups]; a[gi] = { ...g, items: [...g.items, { id: `it${uid()}`, label: "• New Item" }] }; setPrePrimaryConfig({ ...prePrimaryConfig, leftGroups: a }) }} className="text-xs text-[var(--primary)] hover:underline">+ Add item</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800">Right Column Groups ({prePrimaryConfig.rightGroups.length})</h4>
                  <button onClick={() => setPrePrimaryConfig({ ...prePrimaryConfig, rightGroups: [...prePrimaryConfig.rightGroups, { id: `rg${uid()}`, title: "New Group", items: [{ id: `it${uid()}`, label: "• New Item" }] }] })} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs hover:bg-gray-50"><Plus className="h-3 w-3" /> Add Group</button>
                </div>
                <div className="space-y-4">
                  {prePrimaryConfig.rightGroups.map((g, gi) => (
                    <div key={g.id} className="rounded-lg border border-gray-200 p-3 bg-gray-50/50">
                      <div className="flex gap-2 mb-2">
                        <input value={g.title} onChange={(e) => { const a = [...prePrimaryConfig.rightGroups]; a[gi] = { ...g, title: e.target.value }; setPrePrimaryConfig({ ...prePrimaryConfig, rightGroups: a }) }} className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-semibold" />
                        <button onClick={() => setPrePrimaryConfig({ ...prePrimaryConfig, rightGroups: prePrimaryConfig.rightGroups.filter((_, i) => i !== gi) })} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="space-y-1">
                        {g.items.map((it, ii) => (
                          <div key={it.id} className="flex gap-2">
                            <input value={it.label} onChange={(e) => { const a = [...prePrimaryConfig.rightGroups]; const items = [...a[gi].items]; items[ii] = { ...it, label: e.target.value }; a[gi] = { ...g, items }; setPrePrimaryConfig({ ...prePrimaryConfig, rightGroups: a }) }} className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs" />
                            <button onClick={() => { const a = [...prePrimaryConfig.rightGroups]; a[gi] = { ...g, items: a[gi].items.filter((_, i) => i !== ii) }; setPrePrimaryConfig({ ...prePrimaryConfig, rightGroups: a }) }} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        ))}
                        <button onClick={() => { const a = [...prePrimaryConfig.rightGroups]; a[gi] = { ...g, items: [...g.items, { id: `it${uid()}`, label: "• New Item" }] }; setPrePrimaryConfig({ ...prePrimaryConfig, rightGroups: a }) }} className="text-xs text-[var(--primary)] hover:underline">+ Add item</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-700">Live Preview — Pre-Primary (Montessori to K.G.)</p>
                <p className="text-[11px] text-gray-500 mb-3">All left/right groups and header are editable — marks remain editable in Fill tab.</p>
                <div className="overflow-auto bg-[#e9ecef] p-4 rounded-xl border border-gray-200 max-h-[70vh]">
                  <PrePrimaryFormatCard data={data} onChange={() => {}} editable={false} config={prePrimaryConfig} />
                </div>
              </div>
            </>
          ) : isProgressTpl(activeTemplate) ? (
            <>
              <div className="rounded-xl border border-indigo-200 bg-white shadow-sm p-5">
                <h4 className="text-sm font-semibold text-indigo-800 mb-3">Progress Header — all values editable</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">School Name</label>
                    <input value={progressConfig.header.schoolName} onChange={(e) => setProgressConfig({ ...progressConfig, header: { ...progressConfig.header, schoolName: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Board</label>
                    <input value={progressConfig.header.board} onChange={(e) => setProgressConfig({ ...progressConfig, header: { ...progressConfig.header, board: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="I.C.S.E (New Delhi)" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                    <input value={progressConfig.header.address} onChange={(e) => setProgressConfig({ ...progressConfig, header: { ...progressConfig.header, address: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                    <input value={progressConfig.header.title} onChange={(e) => setProgressConfig({ ...progressConfig, header: { ...progressConfig.header, title: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Year Label (e.g. ANNUAL)</label>
                    <input value={progressConfig.yearLabel} onChange={(e) => setProgressConfig({ ...progressConfig, yearLabel: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Principal Label</label>
                    <input value={progressConfig.principalLabel} onChange={(e) => setProgressConfig({ ...progressConfig, principalLabel: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800">Progress Subjects ({progressConfig.subjects.length}) — all editable</h4>
                  <button onClick={() => setProgressConfig({ ...progressConfig, subjects: [...progressConfig.subjects, { id: `sub${uid()}`, label: "New Subject", hasSplit: false }] })} className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white"><Plus className="h-3.5 w-3.5" /> Add Subject</button>
                </div>
                <div className="space-y-2">
                  {progressConfig.subjects.map((s, idx) => (
                    <div key={s.id} className="flex gap-2 items-center rounded-lg border border-gray-200 p-3 bg-gray-50/50">
                      <input value={s.label} onChange={(e) => { const a = [...progressConfig.subjects]; a[idx] = { ...s, label: e.target.value }; setProgressConfig({ ...progressConfig, subjects: a }) }} className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" placeholder="e.g. a) ENGLISH" />
                      <label className="inline-flex items-center gap-1 text-xs font-medium text-gray-600"><input type="checkbox" checked={!!s.hasSplit} onChange={(e) => { const a = [...progressConfig.subjects]; a[idx] = { ...s, hasSplit: e.target.checked }; setProgressConfig({ ...progressConfig, subjects: a }) }} /> Split Lit/Lang</label>
                      <button onClick={() => { if (idx > 0) setProgressConfig({ ...progressConfig, subjects: move(progressConfig.subjects, idx, idx - 1) }) }} className="p-1 rounded hover:bg-white"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { if (idx < progressConfig.subjects.length - 1) setProgressConfig({ ...progressConfig, subjects: move(progressConfig.subjects, idx, idx + 1) }) }} className="p-1 rounded hover:bg-white"><ArrowDown className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setProgressConfig({ ...progressConfig, subjects: progressConfig.subjects.filter((_, i) => i !== idx) })} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800">Other Subjects ({progressConfig.otherSubjects.length})</h4>
                  <button onClick={() => setProgressConfig({ ...progressConfig, otherSubjects: [...progressConfig.otherSubjects, { id: `other${uid()}`, label: "New Other" }] })} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs hover:bg-gray-50"><Plus className="h-3 w-3" /> Add</button>
                </div>
                <div className="space-y-1.5">
                  {progressConfig.otherSubjects.map((o, idx) => (
                    <div key={o.id} className="flex gap-2 items-center">
                      <input value={o.label} onChange={(e) => { const a = [...progressConfig.otherSubjects]; a[idx] = { ...o, label: e.target.value }; setProgressConfig({ ...progressConfig, otherSubjects: a }) }} className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs" />
                      <button onClick={() => setProgressConfig({ ...progressConfig, otherSubjects: progressConfig.otherSubjects.filter((_, i) => i !== idx) })} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-700">Live Preview — Progress Report</p>
                <p className="text-[11px] text-gray-500 mb-3">All header/subjects/other values above are editable — marks remain editable in Fill tab.</p>
                <div className="overflow-auto bg-[#e9ecef] p-4 rounded-xl border border-gray-200 max-h-[70vh]">
                  <ProgressReportCard data={data} onChange={() => {}} editable={false} config={progressConfig} />
                </div>
              </div>
            </>
          ) : (
            <>
          {/* Header */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Header</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">School Name</label>
                <input value={tplConfig.header.schoolName} onChange={(e) => setTplConfig({ ...tplConfig, header: { ...tplConfig.header, schoolName: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle (Class range)</label>
                <input value={tplConfig.header.subtitle} onChange={(e) => setTplConfig({ ...tplConfig, header: { ...tplConfig.header, subtitle: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tagline</label>
                <input value={tplConfig.header.tagline} onChange={(e) => setTplConfig({ ...tplConfig, header: { ...tplConfig.header, tagline: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estd</label>
                <input value={tplConfig.header.estd} onChange={(e) => setTplConfig({ ...tplConfig, header: { ...tplConfig.header, estd: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input value={tplConfig.header.title} onChange={(e) => setTplConfig({ ...tplConfig, header: { ...tplConfig.header, title: e.target.value } })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Logo</label>
                <div className="flex gap-2">
                  <input value={tplConfig.header.logo || ""} onChange={(e) => setTplConfig({ ...tplConfig, header: { ...tplConfig.header, logo: e.target.value } })} placeholder="https://... or /api/files/..." className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <Upload className="h-4 w-4" /> {uploadingLogo ? "..." : "Upload"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = "" }} />
                  </label>
                </div>
                {tplConfig.header.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tplConfig.header.logo} alt="logo preview" className="mt-2 h-16 object-contain border border-gray-200 rounded" />
                )}
              </div>
            </div>
          </div>

          {/* Academic Subjects */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">Academic Subjects ({tplConfig.academicSubjects.length})</h4>
              <button onClick={() => setTplConfig({ ...tplConfig, academicSubjects: [...tplConfig.academicSubjects, { id: `sub${uid()}`, label: "New Subject", hasSplit: false }] })} className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white"><Plus className="h-3.5 w-3.5" /> Add Subject</button>
            </div>
            <div className="space-y-2">
              {tplConfig.academicSubjects.map((s, idx) => (
                <div key={s.id} className="flex gap-2 items-start rounded-lg border border-gray-200 p-3 bg-gray-50/50">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input value={s.label} onChange={(e) => { const a = [...tplConfig.academicSubjects]; a[idx] = { ...s, label: e.target.value }; setTplConfig({ ...tplConfig, academicSubjects: a }) }} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" placeholder="Label e.g. 4. MATHEMATICS" />
                    <input value={s.sub || ""} onChange={(e) => { const a = [...tplConfig.academicSubjects]; a[idx] = { ...s, sub: e.target.value }; setTplConfig({ ...tplConfig, academicSubjects: a }) }} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" placeholder="Sub e.g. (Bengali/Hindi) or LIT\nLANG" />
                    <label className="inline-flex items-center gap-1 text-xs font-medium text-gray-600"><input type="checkbox" checked={!!s.hasSplit} onChange={(e) => { const a = [...tplConfig.academicSubjects]; a[idx] = { ...s, hasSplit: e.target.checked }; setTplConfig({ ...tplConfig, academicSubjects: a }) }} /> Split LIT/LANG (2 rows stacked)</label>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => { if (idx > 0) setTplConfig({ ...tplConfig, academicSubjects: move(tplConfig.academicSubjects, idx, idx - 1) }) }} className="p-1 rounded hover:bg-white"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { if (idx < tplConfig.academicSubjects.length - 1) setTplConfig({ ...tplConfig, academicSubjects: move(tplConfig.academicSubjects, idx, idx + 1) }) }} className="p-1 rounded hover:bg-white"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setTplConfig({ ...tplConfig, academicSubjects: tplConfig.academicSubjects.filter((_, i) => i !== idx) })} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">ID is internal key for marks (auto from label). Split subjects use 18 inputs (lit/lang stacked) — original English uses this.</p>
          </div>

          {/* Other Subjects */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[
              { key: "otherSubjects", label: "Other Subjects", hint: "a) LIFE SKILL etc. (5 inputs per row)" },
              { key: "workHabits", label: "Work Habits", hint: "• Attentiveness etc. (2 inputs per row)" },
              { key: "socialPersonal", label: "Social & Personal", hint: "• Punctuality etc." },
              { key: "regularity", label: "Regularity Record", hint: "• Attendance etc." },
              { key: "coCurricular", label: "Co-Curricular Activities", hint: "• Sports etc." },
            ].map((sec) => (
              <div key={sec.key} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">{sec.label} ({(tplConfig as any)[sec.key].length})</h4>
                    <p className="text-[11px] text-gray-400">{sec.hint}</p>
                  </div>
                  <button onClick={() => { const arr = [...(tplConfig as any)[sec.key]]; arr.push({ id: `item${uid()}`, label: "New Item" }); setTplConfig({ ...tplConfig, [sec.key]: arr } as any) }} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs hover:bg-gray-50"><Plus className="h-3 w-3" /> Add</button>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-auto">
                  {(tplConfig as any)[sec.key].map((it: any, idx: number) => (
                    <div key={it.id} className="flex gap-2 items-center">
                      <input value={it.label} onChange={(e) => { const a = [...(tplConfig as any)[sec.key]]; a[idx] = { ...it, label: e.target.value }; setTplConfig({ ...tplConfig, [sec.key]: a } as any) }} className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs" />
                      <button onClick={() => { if (idx > 0) { const a = move((tplConfig as any)[sec.key], idx, idx - 1); setTplConfig({ ...tplConfig, [sec.key]: a } as any) } }} className="p-1 hover:bg-gray-100 rounded"><ArrowUp className="h-3 w-3" /></button>
                      <button onClick={() => { if (idx < (tplConfig as any)[sec.key].length - 1) { const a = move((tplConfig as any)[sec.key], idx, idx + 1); setTplConfig({ ...tplConfig, [sec.key]: a } as any) } }} className="p-1 hover:bg-gray-100 rounded"><ArrowDown className="h-3 w-3" /></button>
                      <button onClick={() => { const a = (tplConfig as any)[sec.key].filter((_: any, i: number) => i !== idx); setTplConfig({ ...tplConfig, [sec.key]: a } as any) }} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Grade Scale */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">Key to Grades</h4>
              <button onClick={() => setTplConfig({ ...tplConfig, gradeScale: [...tplConfig.gradeScale, { grade: "F", range: "0% - 0%", min: 0, max: 0 }] })} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs hover:bg-gray-50"><Plus className="h-3 w-3" /> Add Grade</button>
            </div>
            <div className="space-y-2">
              {tplConfig.gradeScale.map((g, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input value={g.grade} onChange={(e) => { const a = [...tplConfig.gradeScale]; a[idx] = { ...g, grade: e.target.value }; setTplConfig({ ...tplConfig, gradeScale: a }) }} className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-xs" placeholder="A+" />
                  <input value={g.range} onChange={(e) => { const a = [...tplConfig.gradeScale]; a[idx] = { ...g, range: e.target.value }; setTplConfig({ ...tplConfig, gradeScale: a }) }} className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs" placeholder="91% - 100%" />
                  <button onClick={() => setTplConfig({ ...tplConfig, gradeScale: tplConfig.gradeScale.filter((_, i) => i !== idx) })} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-700">Live Preview — reflects saved + unsaved structure</p>
            <p className="text-[11px] text-gray-500 mb-3">Switch to Fill tab to edit marks for students; preview uses current template config.</p>
            <div className="overflow-auto bg-[#e9ecef] p-4 rounded-xl border border-gray-200 max-h-[70vh]">
              <PrimaryFormatCard data={data} onChange={handleChange} editable={false} config={tplConfig} />
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={saveTemplateConfig} disabled={savingTpl} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              <Save className="h-4 w-4" /> {savingTpl ? "Saving…" : "Save Template Structure"}
            </button>
          </div>
            </>
          )}
        </div>
      )}

      {assignTpl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAssignTpl(null)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-[var(--primary)]" /> Assign Classes & Sections</h3>
                <p className="text-xs text-gray-500">Template: <b className="text-gray-700">{assignTpl.name}</b> (ID {assignTpl.id}) — select multiple classes/sections</p>
              </div>
              <button onClick={() => setAssignTpl(null)} className="p-2 rounded-lg hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-auto p-5 space-y-3">
              {classes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No classes found. Create classes in Academics → Class & Section first.</p>
              ) : (
                classes.map((c) => {
                  const sects = sectionsOf(c.id)
                  const sel = assignSelected[c.id]
                  const isChecked = !!sel?.checked
                  return (
                    <div key={c.id} className={`rounded-lg border ${isChecked ? "border-[var(--primary)] bg-orange-50/50" : "border-gray-200 bg-white"} p-3`}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={isChecked} onChange={(e) => toggleAssignClass(c.id, e.target.checked)} className="rounded border-gray-300" />
                        <span className="text-sm font-semibold text-gray-800">{c.name}</span>
                        <span className="ml-auto text-xs text-gray-400">{sects.length} sections</span>
                        {isChecked && (
                          <button onClick={(e) => { e.preventDefault(); const all = sects.map((s) => s.id); const cur = assignSelected[c.id]?.sections; const allSelected = cur && all.every((id) => cur.has(id)); setAssignSelected((prev) => ({ ...prev, [c.id]: { checked: true, sections: allSelected ? new Set() : new Set(all) } })) }} className="ml-2 text-[11px] text-[var(--primary)] hover:underline">
                            {assignSelected[c.id]?.sections.size === sects.length ? "Clear all" : "Select all sections"}
                          </button>
                        )}
                      </label>
                      {isChecked && sects.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 pl-6">
                          {sects.map((s) => (
                            <label key={s.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                              <input type="checkbox" checked={!!assignSelected[c.id]?.sections.has(s.id)} onChange={(e) => toggleAssignSection(c.id, s.id, e.target.checked)} className="rounded border-gray-300" />
                              <span className="text-gray-700">{s.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {isChecked && sects.length === 0 && <p className="mt-2 pl-6 text-[11px] text-gray-400">No sections for this class — whole class will be assigned.</p>}
                    </div>
                  )
                })
              )}
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <p className="text-xs text-gray-500">
                {Object.values(assignSelected).filter((v) => v.checked).length} classes selected
                {Object.values(assignSelected).some((v) => v.sections.size > 0) ? ` • ${Object.values(assignSelected).reduce((a, v) => a + v.sections.size, 0)} sections` : ""}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setAssignTpl(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-white">Cancel</button>
                <button onClick={saveAssign} disabled={savingAssign} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50">
                  <CheckSquare className="h-4 w-4" /> {savingAssign ? "Saving…" : "Save Assignment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#3a3f44] no-print">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white border-b border-gray-700 no-print">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center"><Eye className="h-4 w-4" /></div>
              <div>
                <h3 className="text-sm font-semibold">Print Preview • A4 • 0.5in margins</h3>
                <p className="text-xs text-white/60">{activeTemplate?.name} • {isProgressTpl(activeTemplate) ? data.studentName : data.name} • {data.class}{data.section ? `-${data.section}` : ""}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"><Printer className="h-4 w-4" /> Print Now</button>
              <button onClick={() => setShowPreview(false)} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm text-white border border-white/20"><X className="h-4 w-4" /> Close</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center bg-[#525659] no-print">
            <div className="bg-white shadow-2xl print-area print-preview-page" style={{ width: "210mm", minHeight: "297mm", padding: "0.5in", boxSizing: "border-box", overflow: "visible" }}>
              <div style={{ transform: "scale(0.68)", transformOrigin: "top left", width: "147%" }}>
                {isMiddleTpl(activeTemplate) ? (
                  <MiddleSchoolFormatCard data={data} config={middleConfig} editable={false} />
                ) : isPrePrimaryTpl(activeTemplate) ? (
                  <PrePrimaryFormatCard data={data} config={prePrimaryConfig} editable={false} />
                ) : isProgressTpl(activeTemplate) ? (
                  <ProgressReportCard data={data} config={progressConfig} editable={false} />
                ) : (
                  <PrimaryFormatCard data={data} config={tplConfig} editable={false} />
                )}
              </div>
            </div>
          </div>
          <div className="px-4 py-2 bg-gray-900 text-white/70 text-xs text-center border-t border-gray-700 no-print">Full print • 0.5in margins all sides • Normal page breaks as needed • Use Print Now or Ctrl+P</div>
        </div>
      )}

      {activeTemplate && (
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 0.5in; }
            html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body * { visibility: hidden !important; }
            .print-area, .print-area * { visibility: visible !important; }
            .print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              border: none !important;
              box-shadow: none !important;
              overflow: visible !important;
            }
            .no-print, header, nav, aside { display: none !important; visibility: hidden !important; }
            .primary-format-root .page, .progress-report-root .page {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 10px !important;
              width: 100% !important;
              max-width: none !important;
              border: none !important;
            }
            .primary-format-root table, .progress-report-root table { page-break-inside: auto; break-inside: auto; }
            .primary-format-root .flex-container, .progress-report-root .flex-container { page-break-inside: auto; break-inside: auto; }
            .primary-format-root .page, .progress-report-root .page { page-break-after: auto; break-after: auto; }
            .primary-format-root, .progress-report-root { zoom: 0.68; }
            .print-preview-page { box-shadow: none !important; }
          }
          /* SweetAlert nicer overrides */
          div.swal2-popup { border-radius: 1rem !important; padding: 1.5rem !important; }
          .swal2-title { font-size: 1.05rem !important; font-weight: 700 !important; }
          .swal2-html-container { font-size: 0.875rem !important; color: #4b5563 !important; }
          .swal2-confirm, .swal2-cancel { border-radius: 0.75rem !important; padding: 0.6rem 1.25rem !important; font-weight: 600 !important; }
          .swal2-input { border-radius: 0.75rem !important; }
        `}</style>
      )}
    </div>
  )
}
