"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save, Building2 } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Hostel = {
  id: number
  name: string
  type: string
  address: string
  phone: string
  wardenName: string
  wardenContact: string
}

export default function HostelPage() {
  const { data, add, update, remove, loading } = useApi<Hostel>("/api/hostel")
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [wardenName, setWardenName] = useState("")
  const [wardenContact, setWardenContact] = useState("")
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editType, setEditType] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editWardenName, setEditWardenName] = useState("")
  const [editWardenContact, setEditWardenContact] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Hostel name is required"
    if (!type) errs.type = "Hostel type is required"
    if (!wardenName.trim()) errs.wardenName = "Warden name is required"
    if (!wardenContact.trim()) errs.wardenContact = "Warden contact is required"
    setErrors(errs)
    if (Object.keys(errs).length) return

    await add({ name: name.trim(), type, address: address.trim(), phone: phone.trim(), wardenName: wardenName.trim(), wardenContact: wardenContact.trim() })
    setName(""); setType(""); setAddress(""); setPhone(""); setWardenName(""); setWardenContact("")
  }

  const handleEditOpen = (item: Hostel) => {
    setEditId(item.id)
    setEditName(item.name)
    setEditType(item.type)
    setEditAddress(item.address)
    setEditPhone(item.phone)
    setEditWardenName(item.wardenName)
    setEditWardenContact(item.wardenContact)
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs: Record<string, string> = {}
    if (!editName.trim()) errs.name = "Hostel name is required"
    if (!editType) errs.type = "Hostel type is required"
    if (!editWardenName.trim()) errs.wardenName = "Warden name is required"
    if (!editWardenContact.trim()) errs.wardenContact = "Warden contact is required"
    setEditErrors(errs)
    if (Object.keys(errs).length) return

    await update(editId!, { name: editName.trim(), type: editType, address: editAddress.trim(), phone: editPhone.trim(), wardenName: editWardenName.trim(), wardenContact: editWardenContact.trim() })
    setShowEditModal(false)
    setEditId(null)
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

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Hostel</h1>
        <p className="mt-1 text-sm text-white/80">Hostel / Hostel</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Add Hostel</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostel Name <span className="text-red-500">*</span></label>
                <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({}) }} placeholder="Enter hostel name" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostel Type <span className="text-red-500">*</span></label>
                <select value={type} onChange={(e) => { setType(e.target.value); if (errors.type) setErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select Type</option>
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="Co-ed">Co-ed</option>
                </select>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter address" rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0123456789" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warden Name <span className="text-red-500">*</span></label>
                <input type="text" value={wardenName} onChange={(e) => { setWardenName(e.target.value); if (errors.wardenName) setErrors({}) }} placeholder="Mr. Sharma" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.wardenName && <p className="text-red-500 text-xs mt-1">{errors.wardenName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warden Contact <span className="text-red-500">*</span></label>
                <input type="text" value={wardenContact} onChange={(e) => { setWardenContact(e.target.value); if (errors.wardenContact) setErrors({}) }} placeholder="9876543201" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.wardenContact && <p className="text-red-500 text-xs mt-1">{errors.wardenContact}</p>}
              </div>
              <button onClick={handleAdd} className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                <Plus className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Hostel List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hostel Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Warden</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hostels found</td></tr>
                  ) : (
                    data.map((item, idx) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800"><Building2 className="h-3.5 w-3.5 inline mr-1 text-[var(--primary)]" />{item.name}</td>
                        <td className="px-4 py-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{item.type}</span></td>
                        <td className="px-4 py-3 text-gray-700">{item.wardenName}</td>
                        <td className="px-4 py-3 text-gray-600">{item.phone || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEditOpen(item)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteOpen(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
              <span>Showing {data.length} records</span>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Edit Hostel</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostel Name <span className="text-red-500">*</span></label>
                <input type="text" value={editName} onChange={(e) => { setEditName(e.target.value); if (editErrors.name) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.name && <p className="text-red-500 text-xs mt-1">{editErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostel Type <span className="text-red-500">*</span></label>
                <select value={editType} onChange={(e) => { setEditType(e.target.value); if (editErrors.type) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select Type</option>
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="Co-ed">Co-ed</option>
                </select>
                {editErrors.type && <p className="text-red-500 text-xs mt-1">{editErrors.type}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={editAddress} onChange={(e) => setEditAddress(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warden Name <span className="text-red-500">*</span></label>
                <input type="text" value={editWardenName} onChange={(e) => { setEditWardenName(e.target.value); if (editErrors.wardenName) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.wardenName && <p className="text-red-500 text-xs mt-1">{editErrors.wardenName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warden Contact <span className="text-red-500">*</span></label>
                <input type="text" value={editWardenContact} onChange={(e) => { setEditWardenContact(e.target.value); if (editErrors.wardenContact) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.wardenContact && <p className="text-red-500 text-xs mt-1">{editErrors.wardenContact}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowEditModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><X className="h-4 w-4 inline mr-1" />Cancel</button>
              <button onClick={handleEditSave} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"><Save className="h-4 w-4 inline mr-1" />Save</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this hostel?
              {deleteId && <strong className="block mt-1 text-gray-800">{data.find((d) => d.id === deleteId)?.name}</strong>}
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowDeleteModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><X className="h-4 w-4 inline mr-1" />Cancel</button>
              <button onClick={confirmDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"><Trash2 className="h-4 w-4 inline mr-1" />Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
