"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save, Building2, Layers, List } from "lucide-react"
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

function parseRoomNumbers(input: string): string[] {
  const tokens = input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
  const seen = new Set<string>()
  const out: string[] = []
  for (const tok of tokens) {
    const m = tok.match(/^(\d+)\s*[-–—]\s*(\d+)$/)
    if (m) {
      let a = parseInt(m[1], 10)
      let b = parseInt(m[2], 10)
      if (a > b) { const t = a; a = b; b = t }
      if (b - a > 1000) continue
      for (let i = a; i <= b; i++) {
        const v = String(i)
        if (!seen.has(v)) { seen.add(v); out.push(v) }
      }
    } else if (!seen.has(tok)) {
      seen.add(tok)
      out.push(tok)
    }
  }
  return out
}

export default function HostelRoomsPage() {
  const { symbol } = useCurrency()
  const { data, add, update, remove, loading, refetch } = useApi<HostelRoom>("/api/hostel/room")
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
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkRoomNumbers, setBulkRoomNumbers] = useState("")
  const [bulkMessage, setBulkMessage] = useState("")
  const [bulkSaving, setBulkSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const getHostel = (hid: number) => hostels.find((h) => h.id === hid)

  const parsedRooms = parseRoomNumbers(bulkRoomNumbers)
  const allSelected = data.length > 0 && data.every((d) => selectedIds.includes(d.id))

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    const ids = data.map((d) => d.id)
    setSelectedIds((prev) => (ids.length > 0 && ids.every((i) => prev.includes(i)) ? [] : ids))
  }

  const handleBulkSave = async () => {
    const errs: Record<string, string> = {}
    if (!hostelId) errs.hostelId = "Please select a hostel"
    if (!roomType) errs.roomType = "Please select room type"
    if (!capacity || isNaN(Number(capacity))) errs.capacity = "Valid capacity is required"
    if (!rent || isNaN(Number(rent))) errs.rent = "Valid rent is required"
    if (parsedRooms.length === 0) errs.roomNumber = "Enter at least one room number"
    if (parsedRooms.length > 500) errs.roomNumber = "Too many rooms — max 500 at once"
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBulkSaving(true)
    setBulkMessage("")
    try {
      const payload = parsedRooms.map((rn) => ({
        hostelId: Number(hostelId),
        roomNumber: rn,
        roomType,
        capacity: Number(capacity),
        rent: Number(rent),
      }))
      const res = await fetch("/api/hostel/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to add rooms")
      }
      const saved = await res.json()
      await refetch()
      setBulkRoomNumbers("")
      setBulkMessage(`Added ${saved.length} rooms successfully`)
    } catch (e) {
      setBulkMessage(e instanceof Error ? e.message : "Failed to add rooms")
    } finally {
      setBulkSaving(false)
    }
  }

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

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setBulkDeleting(true)
    try {
      const res = await fetch(`/api/hostel/room?ids=${selectedIds.join(",")}`, { method: "DELETE" })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Failed to delete rooms")
      }
      await refetch()
      setSelectedIds([])
      setShowBulkDeleteModal(false)
    } catch (e) {
      setBulkMessage(e instanceof Error ? e.message : "Failed to delete rooms")
      setShowBulkDeleteModal(false)
    } finally {
      setBulkDeleting(false)
    }
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
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => { setBulkMode(false); setErrors({}); setBulkMessage("") }}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${!bulkMode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <List className="h-4 w-4" /> Single
                </button>
                <button
                  onClick={() => { setBulkMode(true); setErrors({}); setBulkMessage("") }}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${bulkMode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <Layers className="h-4 w-4" /> Bulk
                </button>
              </div>
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
              {!bulkMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Number <span className="text-red-500">*</span></label>
                  <input type="text" value={roomNumber} onChange={(e) => { setRoomNumber(e.target.value); if (errors.roomNumber) setErrors({}) }} placeholder="101" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {errors.roomNumber && <p className="text-red-500 text-xs mt-1">{errors.roomNumber}</p>}
                </div>
              )}
              {bulkMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Numbers <span className="text-red-500">*</span></label>
                  <textarea
                    value={bulkRoomNumbers}
                    onChange={(e) => { setBulkRoomNumbers(e.target.value); if (errors.roomNumber) setErrors((p) => ({ ...p, roomNumber: "" })) }}
                    placeholder={"Comma separated, e.g. 101, 102, 105-110"}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  {errors.roomNumber && <p className="text-red-500 text-xs mt-1">{errors.roomNumber}</p>}
                  {parsedRooms.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Will create <span className="font-semibold text-[var(--primary)]">{parsedRooms.length}</span> room{parsedRooms.length === 1 ? "" : "s"}
                      {parsedRooms.length <= 12 && <span className="text-gray-400"> — {parsedRooms.join(", ")}</span>}
                    </p>
                  )}
                </div>
              )}
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
              {bulkMessage && (
                <p className={`text-xs font-medium ${bulkMessage.includes("successfully") ? "text-emerald-600" : "text-red-600"}`}>{bulkMessage}</p>
              )}
              {bulkMode ? (
                <button onClick={handleBulkSave} disabled={bulkSaving} className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                  <Layers className="h-4 w-4" /> {bulkSaving ? "Adding..." : `Save All (${parsedRooms.length})`}
                </button>
              ) : (
                <button onClick={handleAdd} className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                  <Plus className="h-4 w-4" /> Save
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Room List</h3>
              {selectedIds.length > 0 && (
                <span className="text-xs font-medium text-gray-500">{selectedIds.length} selected</span>
              )}
            </div>
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 border-b border-emerald-200">
                <span className="text-sm font-medium text-emerald-800">{selectedIds.length} room{selectedIds.length === 1 ? "" : "s"} selected</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedIds([])} className="text-xs font-medium text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                    Clear
                  </button>
                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Selected
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                        title="Select all"
                      />
                    </th>
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
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">No rooms found</td></tr>
                  ) : (
                    data.map((item, idx) => (
                      <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedIds.includes(item.id) ? "bg-emerald-50/60" : idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                        </td>
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
    {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Delete Selected Rooms</h3>
              <button onClick={() => setShowBulkDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <strong className="text-gray-800">{selectedIds.length}</strong> selected room{selectedIds.length === 1 ? "" : "s"}?
            </p>
            <div className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-gray-200 p-2">
              {data.filter((d) => selectedIds.includes(d.id)).map((d) => (
                <div key={d.id} className="text-xs text-gray-600 px-1 py-0.5">
                  {d.roomNumber} — {getHostel(d.hostelId)?.name || "—"} ({d.roomType})
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowBulkDeleteModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><X className="h-4 w-4 inline mr-1" />Cancel</button>
              <button onClick={confirmBulkDelete} disabled={bulkDeleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                <Trash2 className="h-4 w-4 inline mr-1" />{bulkDeleting ? "Deleting..." : `Delete (${selectedIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
