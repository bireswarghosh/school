"use client"

import { useState } from "react"
import { Search, Printer, Download, Eye, X, Save, Plus, Pencil, Trash2 } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type AdmitCardRecord = {
  id: number
  studentName: string
  admissionNo: string
  class: string
  section: string
  examName: string
  rollNo: number
  fatherName: string
  motherName: string
  dateOfBirth: string
  photo: string | null
}

type Exam = {
  id: number
  name: string
  term: string
  class: string
  section: string
}

const availableFields = [  "Student Name",
  "Father Name",
  "Date of Birth",
  "Class",
  "Section",
  "Roll No",
  "Profile Roll No",
  "Photo",
  "Exam Name",
  "School Name",
  "Address",
]

let nextDesignId = 0

type AdmitCardDesign = {
  id: number
  templateName: string
  heading: string
  title: string
  examName: string
  description: string
  schoolName: string
  examCentre: string
  sectionList: string[]
  enabledFields: string[]
  leftLogo: string
  rightLogo: string
  sign: string
  backgroundImage: string
  footerText: string
}

export default function CbseAdmitCardPage() {
  const { classNames: classes, sectionNames } = useClassesAndSections();
  const sectionOptions = ["Select All", ...sectionNames];
  const { data: admitCards, loading } = useApi<AdmitCardRecord>("/api/cbse/admit-card")
  const { data: exams } = useApi<Exam>("/api/cbse/exam")
  const [search, setSearch] = useState("")
  const [filterClass, setFilterClass] = useState("All")
  const [filterSection, setFilterSection] = useState("All")
  const [previewItem, setPreviewItem] = useState<AdmitCardRecord | null>(null)

  const [designs, setDesigns] = useState<AdmitCardDesign[]>([])
  const [editingDesignId, setEditingDesignId] = useState<number | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewDesign, setPreviewDesign] = useState<AdmitCardDesign | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteDesignId, setDeleteDesignId] = useState<number | null>(null)

  const [designForm, setDesignForm] = useState({
    templateName: "",
    heading: "SMART SCHOOL",
    title: "ADMIT CARD",
    examName: "",
    description: "",
    schoolName: "",
    examCentre: "",
    sectionList: [] as string[],
    enabledFields: ["Student Name", "Class", "Section", "Roll No"],
    leftLogo: "",
    rightLogo: "",
    sign: "",
    backgroundImage: "",
    footerText: "",
  })

  const filtered = admitCards.filter((a) => {
    const matchSearch = a.studentName.toLowerCase().includes(search.toLowerCase()) || a.admissionNo.toLowerCase().includes(search.toLowerCase())
    const matchClass = filterClass === "All" || a.class === filterClass
    const matchSection = filterSection === "All" || a.section === filterSection
    return matchSearch && matchClass && matchSection
  })

  const handleDesignFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setDesignForm((prev) => ({ ...prev, [name]: value }))
  }

  const toggleSection = (section: string) => {
    setDesignForm((prev) => {
      if (section === "Select All") {
        return prev.sectionList.length === sectionOptions.length - 1
          ? { ...prev, sectionList: [] }
          : { ...prev, sectionList: [...sectionOptions.filter((s) => s !== "Select All")] }
      }
      const list = prev.sectionList.includes(section)
        ? prev.sectionList.filter((s) => s !== section)
        : [...prev.sectionList, section]
      return { ...prev, sectionList: list }
    })
  }

  const toggleField = (field: string) => {
    setDesignForm((prev) => ({
      ...prev,
      enabledFields: prev.enabledFields.includes(field)
        ? prev.enabledFields.filter((f) => f !== field)
        : [...prev.enabledFields, field],
    }))
  }

  const saveDesign = () => {
    const design: AdmitCardDesign = {
      id: editingDesignId ?? ++nextDesignId,
      templateName: designForm.templateName,
      heading: designForm.heading,
      title: designForm.title,
      examName: designForm.examName,
      description: designForm.description,
      schoolName: designForm.schoolName,
      examCentre: designForm.examCentre,
      sectionList: [...designForm.sectionList],
      enabledFields: [...designForm.enabledFields],
      leftLogo: designForm.leftLogo,
      rightLogo: designForm.rightLogo,
      sign: designForm.sign,
      backgroundImage: designForm.backgroundImage,
      footerText: designForm.footerText,
    }
    if (editingDesignId !== null) {
      setDesigns((prev) => prev.map((d) => d.id === editingDesignId ? design : d))
    } else {
      setDesigns((prev) => [...prev, design])
    }
    resetDesignForm()
  }

  const editDesign = (design: AdmitCardDesign) => {
    setDesignForm({
      templateName: design.templateName,
      heading: design.heading,
      title: design.title,
      examName: design.examName,
      description: design.description,
      schoolName: design.schoolName,
      examCentre: design.examCentre,
      sectionList: [...design.sectionList],
      enabledFields: [...design.enabledFields],
      leftLogo: design.leftLogo,
      rightLogo: design.rightLogo,
      sign: design.sign,
      backgroundImage: design.backgroundImage,
      footerText: design.footerText,
    })
    setEditingDesignId(design.id)
  }

  const resetDesignForm = () => {
    setDesignForm({
      templateName: "",
      heading: "SMART SCHOOL",
      title: "ADMIT CARD",
      examName: "",
      description: "",
      schoolName: "",
      examCentre: "",
      sectionList: [],
      enabledFields: ["Student Name", "Class", "Section", "Roll No"],
      leftLogo: "",
      rightLogo: "",
      sign: "",
      backgroundImage: "",
      footerText: "",
    })
    setEditingDesignId(null)
  }

  const openDesignPreview = (design: AdmitCardDesign) => {
    setPreviewDesign(design)
    setShowPreviewModal(true)
  }

  const confirmDeleteDesign = () => {
    if (deleteDesignId !== null) {
      setDesigns((prev) => prev.filter((d) => d.id !== deleteDesignId))
    }
    setShowDeleteModal(false)
    setDeleteDesignId(null)
  }

  const Modal = ({ title, show, onClose, children, wide }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative bg-white rounded-xl shadow-2xl z-10 w-full mx-4 ${wide ? "max-w-4xl" : "max-w-lg"}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
          </div>
          {children}
        </div>
      </div>
    )
  }

  const AdmitCardPreview = ({ design }: { design: AdmitCardDesign }) => (
    <div className="border-2 border-gray-300 rounded-xl overflow-hidden shadow-lg bg-white"
      style={design.backgroundImage ? { backgroundImage: `url(${design.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
      <div className="p-6 space-y-4" style={design.backgroundImage ? { backgroundColor: "rgba(255,255,255,0.92)" } : {}}>
        <div className="flex items-center justify-between">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 border">
            {design.leftLogo ? design.leftLogo : "Left Logo"}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900">{design.heading}</h3>
            <p className="text-sm font-semibold text-indigo-700">{design.title}</p>
          </div>
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 border">
            {design.rightLogo ? design.rightLogo : "Right Logo"}
          </div>
        </div>

        <div className="border-t border-b border-gray-300 py-3">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            {design.enabledFields.includes("Student Name") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-28">Student Name</span><span className="text-gray-800">: ________________</span></div>
            )}
            {design.enabledFields.includes("Father Name") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-28">Father Name</span><span className="text-gray-800">: ________________</span></div>
            )}
            {design.enabledFields.includes("Date of Birth") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-28">Date of Birth</span><span className="text-gray-800">: ________________</span></div>
            )}
            {design.enabledFields.includes("Class") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-28">Class</span><span className="text-gray-800">: ________________</span></div>
            )}
            {design.enabledFields.includes("Section") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-28">Section</span><span className="text-gray-800">: ________________</span></div>
            )}
            {design.enabledFields.includes("Roll No") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-28">Roll No</span><span className="text-gray-800">: ________________</span></div>
            )}
            {design.enabledFields.includes("Profile Roll No") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-28">Profile Roll No</span><span className="text-gray-800">: ________________</span></div>
            )}
            {design.enabledFields.includes("Exam Name") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-28">Exam Name</span><span className="text-gray-800">: {design.examName}</span></div>
            )}
            {design.enabledFields.includes("School Name") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-28">School Name</span><span className="text-gray-800">: {design.schoolName}</span></div>
            )}
            {design.enabledFields.includes("Address") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-28">Address</span><span className="text-gray-800">: ________________</span></div>
            )}
            {design.enabledFields.includes("Photo") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-28">Photo</span><span className="text-gray-800">: [Photo]</span></div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            <p>Exam Centre: {design.examCentre}</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-10 bg-gray-100 rounded border mx-auto flex items-center justify-center text-xs text-gray-400">
              {design.sign ? design.sign : "Sign"}
            </div>
            <p className="mt-1 font-medium text-gray-600">Principal</p>
          </div>
        </div>

        {design.footerText && (
          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-3">
            {design.footerText}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Admit Card</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">CBSE Examination / Admit Card</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">{editingDesignId !== null ? "Edit" : "Add"} Admit Card Design</h3>
          </div>
          <div className="p-5 space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Template Name <span className="text-red-500">*</span></label>
              <input type="text" name="templateName" value={designForm.templateName} onChange={handleDesignFormChange} placeholder="Enter template name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Heading <span className="text-red-500">*</span></label>
              <input type="text" name="heading" value={designForm.heading} onChange={handleDesignFormChange} placeholder="e.g. SMART SCHOOL"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Title <span className="text-red-500">*</span></label>
              <input type="text" name="title" value={designForm.title} onChange={handleDesignFormChange} placeholder="e.g. ADMIT CARD"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Exam Name <span className="text-red-500">*</span></label>
                <select name="examName" value={designForm.examName} onChange={handleDesignFormChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                  <option value="">Select</option>
                  {(exams || []).map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Description</label>
                <textarea name="description" value={designForm.description} onChange={handleDesignFormChange} placeholder="Enter description" rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">School Name</label>
              <input type="text" name="schoolName" value={designForm.schoolName} onChange={handleDesignFormChange} placeholder="Enter school name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam Centre</label>
              <input type="text" name="examCentre" value={designForm.examCentre} onChange={handleDesignFormChange} placeholder="Enter exam centre"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Footer Text</label>
              <textarea name="footerText" value={designForm.footerText} onChange={handleDesignFormChange} placeholder="Enter footer text" rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Section <span className="text-red-500">*</span></label>
              <div className="border border-gray-300 rounded-lg p-2 max-h-24 overflow-y-auto space-y-1">
                {sectionOptions.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer py-0.5">
                    <input type="checkbox" checked={s === "Select All" ? designForm.sectionList.length === sectionOptions.length - 1 : designForm.sectionList.includes(s)}
                      onChange={() => toggleSection(s)}
                      className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-600">Enable / Disable Fields</label>
              <div className="grid grid-cols-2 gap-2">
                {availableFields.map((field) => (
                  <label key={field} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={designForm.enabledFields.includes(field)} onChange={() => toggleField(field)}
                      className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                    {field}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button onClick={saveDesign}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
                <Save className="h-4 w-4" /> {editingDesignId !== null ? "Update" : "Save"}
              </button>
              {editingDesignId !== null && (
                <button onClick={resetDesignForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-gray-700">Design List</h3>
              <span className="text-xs text-gray-500">{designs.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Template", "Exam Name", "Sections", "Fields", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {designs.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No designs saved yet</td></tr>
                  ) : (
                    designs.map((d, idx) => (
                      <tr key={d.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{d.templateName}</td>
                        <td className="px-4 py-3 text-gray-600">{d.examName}</td>
                        <td className="px-4 py-3 text-gray-600">{d.sectionList.join(", ") || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {d.enabledFields.map((f, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{f}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openDesignPreview(d)} className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors" title="Preview"><Eye className="h-4 w-4" /></button>
                            <button onClick={() => editDesign(d)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => { setDeleteDesignId(d.id); setShowDeleteModal(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-gray-700">Admit Card List</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..."
                    className="w-48 pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                </div>
                <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                  <option value="All">All Classes</option>
                  {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                  <option value="All">All Sections</option>
                  {["A", "B", "C", "D"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Student Name", "Admission No", "Class", "Section", "Exam", "Roll No", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">No admit cards found</td></tr>
                  ) : (
                    filtered.map((a, idx) => (
                      <tr key={a.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{a.studentName}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{a.admissionNo}</td>
                        <td className="px-4 py-3 text-gray-600">{a.class}</td>
                        <td className="px-4 py-3 text-gray-600">{a.section}</td>
                        <td className="px-4 py-3 text-gray-600">{a.examName}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold">{a.rollNo}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setPreviewItem(a)} className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors" title="Preview"><Eye className="h-4 w-4" /></button>
                            <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Print"><Printer className="h-4 w-4" /></button>
                            <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Download"><Download className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
              <span>Showing {filtered.length} of {admitCards.length} records</span>
            </div>
          </div>
        </div>
      </div>

      <Modal title="Admit Card Preview - Design" show={showPreviewModal} onClose={() => setShowPreviewModal(false)} wide>
        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {previewDesign && <AdmitCardPreview design={previewDesign} />}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowPreviewModal(false)} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Close</button>
        </div>
      </Modal>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">Are you sure you want to delete this design?</p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"><X className="h-4 w-4" /> Cancel</button>
              <button onClick={confirmDeleteDesign} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPreviewItem(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Admit Card - {previewItem.studentName}</h2>
              <button onClick={() => setPreviewItem(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-4">
              <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
                <div className="text-center mb-4 border-b-2 border-gray-300 pb-3">
                  <h3 className="text-lg font-bold text-gray-900 uppercase">Smart School</h3>
                  <p className="text-sm text-gray-500">CBSE Affiliated School</p>
                  <h4 className="text-base font-semibold text-gray-800 mt-2">Admit Card</h4>
                  <p className="text-sm font-medium text-[var(--primary)]">{previewItem.examName}</p>
                </div>
                <div className="flex gap-6">
                  <div className="flex-1 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div><span className="font-semibold text-gray-600">Student Name:</span></div>
                      <div className="text-gray-800">{previewItem.studentName}</div>
                      <div><span className="font-semibold text-gray-600">Admission No:</span></div>
                      <div className="text-gray-800">{previewItem.admissionNo}</div>
                      <div><span className="font-semibold text-gray-600">Class:</span></div>
                      <div className="text-gray-800">{previewItem.class}</div>
                      <div><span className="font-semibold text-gray-600">Section:</span></div>
                      <div className="text-gray-800">{previewItem.section}</div>
                      <div><span className="font-semibold text-gray-600">Roll No:</span></div>
                      <div className="text-gray-800">{previewItem.rollNo}</div>
                      <div><span className="font-semibold text-gray-600">Father's Name:</span></div>
                      <div className="text-gray-800">{previewItem.fatherName}</div>
                      <div><span className="font-semibold text-gray-600">Mother's Name:</span></div>
                      <div className="text-gray-800">{previewItem.motherName}</div>
                      <div><span className="font-semibold text-gray-600">Date of Birth:</span></div>
                      <div className="text-gray-800">{previewItem.dateOfBirth}</div>
                    </div>
                  </div>
                  <div className="w-28 h-32 border-2 border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-50">
                    <span className="text-xs text-gray-400">Photo</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200 text-center text-xs text-gray-400">
                  This is a computer-generated admit card. No signature required.
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)]"><Printer className="h-4 w-4" /> Print</button>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"><Download className="h-4 w-4" /> Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
