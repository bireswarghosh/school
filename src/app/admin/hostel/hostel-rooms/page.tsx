"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save, Building2 } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"

type Hostel = { id: number; name: string }
type HostelRoom = {
  id: number
  hostelId: number
  roomNumber: string
  roomType: string
  capacity: number
  rent: number
}

const hostels: Hostel[] = [
  { id: 1, name: "Boys Hostel" },
  { id: 2, name: "Girls Hostel" },
]

const roomTypes = ["Single", "Double", "Triple", "Dormitory"]

export default function HostelRoomsPage() {
  const { symbol } = useCurrency()
  const { data, add, update, remove, loading } = useApi<HostelRoom>("/api/hostel/room")
  const [hostelId, setHostelId] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
  const [roomType, setRoomType] = useState("")
  const [capacity, setCapacity] = useState("")
  const [rent, setRent] = useState("")
  const [editId, setEditId] = useState<number | null>(null)
  const [editHostelId, setEditHostelId] = useState("")
  const [editRoomNumber, setEditRoomNumber] = useState("")
  const [editRoomType, setEditRoomType] = useState("")
  const [editCapacity, setEditCapacity] = useState("")
  const [editRent, setEditRent] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const getHostel = (hid: number) => hostels.find((h) => h.id === hid)

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!hostelId) errs.hostelId = "Please select a hostel"
    if (!roomNumber.trim()) errs.roomNumber = "Room number is required"
    if (!roomType) errs.roomType = "Please select room type"
    if (!capacity || isNaN(Number(capacity))) errs.capacity = "Valid capacity is required"
    if (!rent || isNaN(Number(rent))) errs.rent = "Valid rent is required"
    setErrors(errs)
    if (Object.keys(errs).length) return

    await add({ hostelId: Number(hostelId), roomNumber: roomNumber.trim(), roomType, capacity: Number(capacity), rent: Number(rent) })
    setHostelId(""); setRoomNumber(""); setRoomType(""); setCapacity(""); setRent("")
  }

  const handleEditOpen = (item: HostelRoom) => {
    setEditId(item.id)
    setEditHostelId(String(item.hostelId))
    setEditRoomNumber(item.roomNumber)
    setEditRoomType(item.roomType)
    setEditCapacity(String(item.capacity))
    setEditRent(String(item.rent))
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs: Record<string, string> = {}
    if (!editHostelId) errs.hostelId = "Please select a hostel"
    if (!editRoomNumber.trim()) errs.roomNumber = "Room number is required"
    if (!editRoomType) errs.roomType = "Please select room type"
    if (!editCapacity || isNaN(Number(editCapacity))) errs.capacity = "Valid capacity is required"
    if (!editRent || isNaN(Number(editRent))) errs.rent = "Valid rent is required"
    setEditErrors(errs)
    if (Object.keys(errs).length) return

    await update(editId!, { hostelId: Number(editHostelId), roomNumber: editRoomNumber.trim(), roomType: editRoomType, capacity: Number(editCapacity), rent: Number(editRent) })
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
        <h1 className="text-xl font-semibold text-white">Hostel Rooms</h1>
        <p className="mt-1 text-sm text-white/80">Hostel / Hostel Rooms</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Add Room</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostel <span className="text-red-500">*</span></label>
                <select value={hostelId} onChange={(e) => { setHostelId(e.target.value); if (errors.hostelId) setErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select Hostel</option>
                  {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                {errors.hostelId && <p className="text-red-500 text-xs mt-1">{errors.hostelId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number <span className="text-red-500">*</span></label>
                <input type="text" value={roomNumber} onChange={(e) => { setRoomNumber(e.target.value); if (errors.roomNumber) setErrors({}) }} placeholder="101" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.roomNumber && <p className="text-red-500 text-xs mt-1">{errors.roomNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type <span className="text-red-500">*</span></label>
                <select value={roomType} onChange={(e) => { setRoomType(e.target.value); if (errors.roomType) setErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select Room Type</option>
                  {roomTypes.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
                </select>
                {errors.roomType && <p className="text-red-500 text-xs mt-1">{errors.roomType}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity <span className="text-red-500">*</span></label>
                <input type="number" value={capacity} onChange={(e) => { setCapacity(e.target.value); if (errors.capacity) setErrors({}) }} placeholder="2" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rent <span className="text-red-500">*</span></label>
                <input type="number" value={rent} onChange={(e) => { setRent(e.target.value); if (errors.rent) setErrors({}) }} placeholder="8000" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.rent && <p className="text-red-500 text-xs mt-1">{errors.rent}</p>}
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
              <h3 className="text-sm font-semibold text-gray-700">Room List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hostel</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Room No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Capacity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rent</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">No rooms found</td></tr>
                  ) : (
                    data.map((item, idx) => (
                      <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800"><Building2 className="h-3.5 w-3.5 inline mr-1 text-[var(--primary)]" />{getHostel(item.hostelId)?.name || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{item.roomNumber}</td>
                        <td className="px-4 py-3 text-gray-600">{item.roomType}</td>
                        <td className="px-4 py-3 text-gray-600">{item.capacity}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{symbol}{item.rent}</td>
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
              <h3 className="text-base font-semibold text-gray-800">Edit Room</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostel <span className="text-red-500">*</span></label>
                <select value={editHostelId} onChange={(e) => { setEditHostelId(e.target.value); if (editErrors.hostelId) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select Hostel</option>
                  {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                {editErrors.hostelId && <p className="text-red-500 text-xs mt-1">{editErrors.hostelId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number <span className="text-red-500">*</span></label>
                <input type="text" value={editRoomNumber} onChange={(e) => { setEditRoomNumber(e.target.value); if (editErrors.roomNumber) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.roomNumber && <p className="text-red-500 text-xs mt-1">{editErrors.roomNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type <span className="text-red-500">*</span></label>
                <select value={editRoomType} onChange={(e) => { setEditRoomType(e.target.value); if (editErrors.roomType) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select Room Type</option>
                  {roomTypes.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
                </select>
                {editErrors.roomType && <p className="text-red-500 text-xs mt-1">{editErrors.roomType}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity <span className="text-red-500">*</span></label>
                <input type="number" value={editCapacity} onChange={(e) => { setEditCapacity(e.target.value); if (editErrors.capacity) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.capacity && <p className="text-red-500 text-xs mt-1">{editErrors.capacity}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rent <span className="text-red-500">*</span></label>
                <input type="number" value={editRent} onChange={(e) => { setEditRent(e.target.value); if (editErrors.rent) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.rent && <p className="text-red-500 text-xs mt-1">{editErrors.rent}</p>}
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
              Are you sure you want to delete this room?
              {deleteId && <strong className="block mt-1 text-gray-800">{data.find((d) => d.id === deleteId)?.roomNumber} ({getHostel(data.find((d) => d.id === deleteId)?.hostelId || 0)?.name})</strong>}
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
