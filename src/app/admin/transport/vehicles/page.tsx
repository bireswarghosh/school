"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save, Bus } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Vehicle = {
  id: number
  vehicleNumber: string
  vehicleName: string
  capacity: number
  driverName: string
  driverContact: string
}

export default function VehiclesPage() {
  const { data, add, update, remove, loading } = useApi<Vehicle>("/api/transport/vehicle")
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [vehicleName, setVehicleName] = useState("")
  const [capacity, setCapacity] = useState("")
  const [driverName, setDriverName] = useState("")
  const [driverContact, setDriverContact] = useState("")
  const [editId, setEditId] = useState<number | null>(null)
  const [editVehicleNumber, setEditVehicleNumber] = useState("")
  const [editVehicleName, setEditVehicleName] = useState("")
  const [editCapacity, setEditCapacity] = useState("")
  const [editDriverName, setEditDriverName] = useState("")
  const [editDriverContact, setEditDriverContact] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!vehicleNumber.trim()) errs.vehicleNumber = "Vehicle number is required"
    if (!vehicleName.trim()) errs.vehicleName = "Vehicle name is required"
    if (!capacity.trim() || isNaN(Number(capacity))) errs.capacity = "Valid capacity is required"
    if (!driverName.trim()) errs.driverName = "Driver name is required"
    if (!driverContact.trim()) errs.driverContact = "Driver contact is required"
    setErrors(errs)
    if (Object.keys(errs).length) return

    await add({ vehicleNumber: vehicleNumber.trim(), vehicleName: vehicleName.trim(), capacity: Number(capacity), driverName: driverName.trim(), driverContact: driverContact.trim() })
    setVehicleNumber(""); setVehicleName(""); setCapacity(""); setDriverName(""); setDriverContact("")
  }

  const handleEditOpen = (item: Vehicle) => {
    setEditId(item.id)
    setEditVehicleNumber(item.vehicleNumber)
    setEditVehicleName(item.vehicleName)
    setEditCapacity(String(item.capacity))
    setEditDriverName(item.driverName)
    setEditDriverContact(item.driverContact)
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs: Record<string, string> = {}
    if (!editVehicleNumber.trim()) errs.vehicleNumber = "Vehicle number is required"
    if (!editVehicleName.trim()) errs.vehicleName = "Vehicle name is required"
    if (!editCapacity.trim() || isNaN(Number(editCapacity))) errs.capacity = "Valid capacity is required"
    if (!editDriverName.trim()) errs.driverName = "Driver name is required"
    if (!editDriverContact.trim()) errs.driverContact = "Driver contact is required"
    setEditErrors(errs)
    if (Object.keys(errs).length) return

    await update(editId!, { vehicleNumber: editVehicleNumber.trim(), vehicleName: editVehicleName.trim(), capacity: Number(editCapacity), driverName: editDriverName.trim(), driverContact: editDriverContact.trim() })
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
        <h1 className="text-xl font-semibold text-white">Vehicles</h1>
        <p className="mt-1 text-sm text-white/80">Transport / Vehicles</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Add Vehicle</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number <span className="text-red-500">*</span></label>
                <input type="text" value={vehicleNumber} onChange={(e) => { setVehicleNumber(e.target.value); if (errors.vehicleNumber) setErrors({}) }} placeholder="UP-1234" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.vehicleNumber && <p className="text-red-500 text-xs mt-1">{errors.vehicleNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name <span className="text-red-500">*</span></label>
                <input type="text" value={vehicleName} onChange={(e) => { setVehicleName(e.target.value); if (errors.vehicleName) setErrors({}) }} placeholder="School Bus A" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.vehicleName && <p className="text-red-500 text-xs mt-1">{errors.vehicleName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity <span className="text-red-500">*</span></label>
                <input type="number" value={capacity} onChange={(e) => { setCapacity(e.target.value); if (errors.capacity) setErrors({}) }} placeholder="50" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name <span className="text-red-500">*</span></label>
                <input type="text" value={driverName} onChange={(e) => { setDriverName(e.target.value); if (errors.driverName) setErrors({}) }} placeholder="Ramesh Kumar" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.driverName && <p className="text-red-500 text-xs mt-1">{errors.driverName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Contact <span className="text-red-500">*</span></label>
                <input type="text" value={driverContact} onChange={(e) => { setDriverContact(e.target.value); if (errors.driverContact) setErrors({}) }} placeholder="9876543210" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.driverContact && <p className="text-red-500 text-xs mt-1">{errors.driverContact}</p>}
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
              <h3 className="text-sm font-semibold text-gray-700">Vehicle List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vehicle Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Capacity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Driver</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">No vehicles found</td></tr>
                  ) : (
                    data.map((item, idx) => (
                      <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800"><Bus className="h-3.5 w-3.5 inline mr-1 text-[var(--primary)]" />{item.vehicleNumber}</td>
                        <td className="px-4 py-3 text-gray-700">{item.vehicleName}</td>
                        <td className="px-4 py-3 text-gray-600">{item.capacity}</td>
                        <td className="px-4 py-3 text-gray-700">{item.driverName}</td>
                        <td className="px-4 py-3 text-gray-600">{item.driverContact}</td>
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
              <h3 className="text-base font-semibold text-gray-800">Edit Vehicle</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number <span className="text-red-500">*</span></label>
                <input type="text" value={editVehicleNumber} onChange={(e) => { setEditVehicleNumber(e.target.value); if (editErrors.vehicleNumber) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.vehicleNumber && <p className="text-red-500 text-xs mt-1">{editErrors.vehicleNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name <span className="text-red-500">*</span></label>
                <input type="text" value={editVehicleName} onChange={(e) => { setEditVehicleName(e.target.value); if (editErrors.vehicleName) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.vehicleName && <p className="text-red-500 text-xs mt-1">{editErrors.vehicleName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity <span className="text-red-500">*</span></label>
                <input type="number" value={editCapacity} onChange={(e) => { setEditCapacity(e.target.value); if (editErrors.capacity) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.capacity && <p className="text-red-500 text-xs mt-1">{editErrors.capacity}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name <span className="text-red-500">*</span></label>
                <input type="text" value={editDriverName} onChange={(e) => { setEditDriverName(e.target.value); if (editErrors.driverName) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.driverName && <p className="text-red-500 text-xs mt-1">{editErrors.driverName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Contact <span className="text-red-500">*</span></label>
                <input type="text" value={editDriverContact} onChange={(e) => { setEditDriverContact(e.target.value); if (editErrors.driverContact) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.driverContact && <p className="text-red-500 text-xs mt-1">{editErrors.driverContact}</p>}
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
              Are you sure you want to delete this vehicle?
              {deleteId && <strong className="block mt-1 text-gray-800">{data.find((d) => d.id === deleteId)?.vehicleNumber} - {data.find((d) => d.id === deleteId)?.vehicleName}</strong>}
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
