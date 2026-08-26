"use client"

import { useState } from "react"
import { Plus, Trash2, Eye, X, Save, FileText, GraduationCap } from "lucide-react"
import { useApi } from "@/lib/use-api"

interface Education {
  school: string
  board: string
  year: string
  percentage: string
}

interface CvData {
  id: number
  name: string
  dob: string
  gender: string
  address: string
  education: Education[]
  achievements: string
  skills: string
  hobbies: string
}

export default function BuildCvPage() {
  const { data: cvs, add, update, remove, loading } = useApi<CvData>("/api/student-information/student")
  const [showForm, setShowForm] = useState(false)
  const [previewCv, setPreviewCv] = useState<CvData | null>(null)
  const [editingCv, setEditingCv] = useState<CvData | null>(null)

  const emptyCv: CvData = { id: 0, name: "", dob: "", gender: "", address: "", education: [{ school: "", board: "", year: "", percentage: "" }], achievements: "", skills: "", hobbies: "" }
  const [form, setForm] = useState<CvData>(emptyCv)

  const openAddForm = () => {
    setEditingCv(null)
    setForm(JSON.parse(JSON.stringify(emptyCv)))
    setShowForm(true)
  }

  const openEditForm = (cv: CvData) => {
    setEditingCv(cv)
    setForm(JSON.parse(JSON.stringify(cv)))
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingCv(null)
    setForm(JSON.parse(JSON.stringify(emptyCv)))
  }

  const addEducationRow = () => {
    setForm({ ...form, education: [...form.education, { school: "", board: "", year: "", percentage: "" }] })
  }

  const removeEducationRow = (index: number) => {
    if (form.education.length <= 1) return
    setForm({ ...form, education: form.education.filter((_, i) => i !== index) })
  }

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = form.education.map((e, i) => i === index ? { ...e, [field]: value } : e)
    setForm({ ...form, education: updated })
  }

  const handleSave = async () => {
    if (!form.name) return
    try {
      if (editingCv) {
        await update(editingCv.id, { ...form })
      } else {
        await add({ ...form })
      }
      closeForm()
    } catch (e: any) {
      console.error(e)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await remove(id)
    } catch (e: any) {
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Build Student CV</h1>
            <p className="text-blue-100 text-sm">Create and manage student curriculum vitae</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!showForm ? (
          <>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Saved CVs</h2>
                <button onClick={openAddForm} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md text-sm">
                  <Plus className="w-4 h-4" /> New CV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                      <th className="text-left p-3">#</th>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">DOB</th>
                      <th className="text-left p-3">Gender</th>
                      <th className="text-center p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cvs.length === 0 ? (
                      <tr><td colSpan={5} className="text-center p-6 text-gray-400">No CVs saved.</td></tr>
                    ) : cvs.map((cv, i) => (
                      <tr key={cv.id} className={`border-t border-gray-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                        <td className="p-3 text-gray-500">{cv.id}</td>
                        <td className="p-3 font-medium text-gray-800">{cv.name}</td>
                        <td className="p-3 text-gray-600">{cv.dob}</td>
                        <td className="p-3 text-gray-600">{cv.gender}</td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => setPreviewCv(cv)} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-all" title="Preview"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => openEditForm(cv)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all" title="Edit"><FileText className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(cv.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">CV Builder</h2>
              </div>
              <p className="text-gray-500 text-sm mb-4">Click "New CV" or select an existing CV to edit. You can preview before saving.</p>
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>Select a CV or create a new one</p>
              </div>
            </div>
          </>
        ) : (
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">{editingCv ? "Edit CV" : "New CV"}</h2>
              <div className="flex gap-2">
                <button onClick={() => setPreviewCv(form)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md text-sm">
                  <Eye className="w-4 h-4" /> Preview
                </button>
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md text-sm">
                  <Save className="w-4 h-4" /> Save
                </button>
                <button onClick={closeForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all text-sm">Cancel</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Full Name</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date of Birth</label>
                    <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Gender</label>
                    <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-sm">
                      <option value="">Select</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Address</label>
                  <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm" />
                </div>

                <h3 className="font-medium text-gray-700 border-b pb-2 mt-6">Education</h3>
                {form.education.map((edu, idx) => (
                  <div key={idx} className="flex gap-2 items-start border p-3 rounded-lg bg-gray-50/50">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <input type="text" value={edu.school} onChange={e => updateEducation(idx, "school", e.target.value)} placeholder="School" className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
                      <input type="text" value={edu.board} onChange={e => updateEducation(idx, "board", e.target.value)} placeholder="Board" className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
                      <input type="text" value={edu.year} onChange={e => updateEducation(idx, "year", e.target.value)} placeholder="Year" className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
                      <input type="text" value={edu.percentage} onChange={e => updateEducation(idx, "percentage", e.target.value)} placeholder="Percentage" className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
                    </div>
                    <button onClick={() => removeEducationRow(idx)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-all mt-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={addEducationRow} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                  <Plus className="w-3 h-3" /> Add Education
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 border-b pb-2">Achievements</h3>
                <textarea value={form.achievements} onChange={e => setForm({ ...form, achievements: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm" placeholder="List achievements (one per line)" />

                <h3 className="font-medium text-gray-700 border-b pb-2">Skills</h3>
                <textarea value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm" placeholder="List skills (comma separated)" />

                <h3 className="font-medium text-gray-700 border-b pb-2">Hobbies</h3>
                <textarea value={form.hobbies} onChange={e => setForm({ ...form, hobbies: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm" placeholder="List hobbies (comma separated)" />
              </div>
            </div>
          </div>
        )}
      </div>

      {previewCv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">CV Preview</h3>
              <button onClick={() => setPreviewCv(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
                <h2 className="text-2xl font-bold">{previewCv.name}</h2>
                <p className="text-blue-100">{previewCv.gender} | DOB: {previewCv.dob}</p>
                <p className="text-blue-100 text-sm mt-1">{previewCv.address}</p>
              </div>

              {previewCv.education.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Education</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                          <th className="text-left p-2">School</th>
                          <th className="text-left p-2">Board</th>
                          <th className="text-left p-2">Year</th>
                          <th className="text-left p-2">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewCv.education.map((edu, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{edu.school}</td>
                            <td className="p-2">{edu.board}</td>
                            <td className="p-2">{edu.year}</td>
                            <td className="p-2">{edu.percentage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {previewCv.achievements && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">Achievements</h3>
                  <p className="text-gray-700 text-sm whitespace-pre-line">{previewCv.achievements}</p>
                </div>
              )}

              {previewCv.skills && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">Skills</h3>
                  <p className="text-gray-700 text-sm">{previewCv.skills}</p>
                </div>
              )}

              {previewCv.hobbies && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">Hobbies</h3>
                  <p className="text-gray-700 text-sm">{previewCv.hobbies}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
