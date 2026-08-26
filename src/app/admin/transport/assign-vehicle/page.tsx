"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save, Bus, Building2 } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Route = { id: number; title: string; code: string }
type Vehicle = { id: number; vehicleNumber: string; vehicleName: string; capacity: number; driverName: string; driverContact: string }
type Assignment = { id: number; routeId: number; vehicleId: number }

const routes: Route[] = [
  { id: 1, title: "Route 1", code: "RT-001" },
  { id: 2, title: "Route 2", code: "RT-002" },
  { id: 3, title: "Route 3", code: "RT-003" },
  { id: 4, title: "Route 4", code: "RT-004" },
  { id: 5, title: "Route 5", code: "RT-005" },
]

const vehicles: Vehicle[] = [
  { id: 1, vehicleNumber: "UP-1234", vehicleName: "School Bus A", capacity: 50, driverName: "Ramesh Kumar", driverContact: "9876543210" },
  { id: 2, vehicleNumber: "UP-5678", vehicleName: "School Bus B", capacity: 40, driverName: "Suresh Singh", driverContact: "9876543211" },
  { id: 3, vehicleNumber: "UP-9012", vehicleName: "School Van A", capacity: 20, driverName: "Dinesh Yadav", driverContact: "9876543212" },
  { id: 4, vehicleNumber: "UP-3456", vehicleName: "School Bus C", capacity: 55, driverName: "Mahesh Kumar", driverContact: "9876543213" },
  { id: 5, vehicleNumber: "UP-7890", vehicleName: "School Van B", capacity: 15, driverName: "Rajesh Verma", driverContact: "9876543214" },
  { id: 6, vehicleNumber: "UP-2345", vehicleName: "School Bus D", capacity: 45, driverName: "Rakesh Sharma", driverContact: "9876543215" },
]

export default function AssignVehiclePage() {
  const { data, add, update, remove, loading } = useApi<Assignment>("/api/transport/assign-vehicle")
  const [routeId, setRouteId] = useState("")
  const [vehicleId, setVehicleId] = useState("")
  const [editId, setEditId] = useState<number | null>(null)
  const [editRouteId, setEditRouteId] = useState("")
  const [editVehicleId, setEditVehicleId] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const getVehicle = (vid: number) => vehicles.find((v) => v.id === vid)
  const getRoute = (rid: number) => routes.find((r) => r.id === rid)

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!routeId) errs.routeId = "Please select a route"
    if (!vehicleId) errs.vehicleId = "Please select a vehicle"
    setErrors(errs)
    if (Object.keys(errs).length) return

    await add({ routeId: Number(routeId), vehicleId: Number(vehicleId) })
    setRouteId(""); setVehicleId("")
  }

  const handleEditOpen = (item: Assignment) => {
    setEditId(item.id)
    setEditRouteId(String(item.routeId))
    setEditVehicleId(String(item.vehicleId))
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs: Record<string, string> = {}
    if (!editRouteId) errs.routeId = "Please select a route"
    if (!editVehicleId) errs.vehicleId = "Please select a vehicle"
    setEditErrors(errs)
    if (Object.keys(errs).length) return

    await update(editId!, { routeId: Number(editRouteId), vehicleId: Number(editVehicleId) })
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

  const selectedVehicle = vehicleId ? getVehicle(Number(vehicleId)) : null

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Assign Vehicle</h1>
        <p className="mt-1 text-sm text-white/80">Transport / Assign Vehicle</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Add Assignment</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route <span className="text-red-500">*</span></label>
                <select value={routeId} onChange={(e) => { setRouteId(e.target.value); if (errors.routeId) setErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select Route</option>
                  {routes.map((r) => <option key={r.id} value={r.id}>{r.title} ({r.code})</option>)}
                </select>
                {errors.routeId && <p className="text-red-500 text-xs mt-1">{errors.routeId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle <span className="text-red-500">*</span></label>
                <select value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); if (errors.vehicleId) setErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select Vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicleNumber} - {v.vehicleName}</option>)}
                </select>
                {errors.vehicleId && <p className="text-red-500 text-xs mt-1">{errors.vehicleId}</p>}
              </div>
              {selectedVehicle && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Driver: <span className="font-medium text-gray-700">{selectedVehicle.driverName}</span></p>
                  <p className="text-xs text-gray-500">Contact: <span className="font-medium text-gray-700">{selectedVehicle.driverContact}</span></p>
                </div>
              )}
              <button onClick={handleAdd} className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                <Plus className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Assignment List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Driver</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No assignments found</td></tr>
                  ) : (
                    data.map((item, idx) => {
                      const route = getRoute(item.routeId)
                      const vehicle = getVehicle(item.vehicleId)
                      return (
                        <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                          <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-800"><Bus className="h-3.5 w-3.5 inline mr-1 text-[var(--primary)]" />{route?.title || "—"}</td>
                          <td className="px-4 py-3 text-gray-700">{vehicle?.vehicleNumber} - {vehicle?.vehicleName}</td>
                          <td className="px-4 py-3 text-gray-600">{vehicle?.driverName || "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleEditOpen(item)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => handleDeleteOpen(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
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
              <h3 className="text-base font-semibold text-gray-800">Edit Assignment</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route <span className="text-red-500">*</span></label>
                <select value={editRouteId} onChange={(e) => { setEditRouteId(e.target.value); if (editErrors.routeId) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select Route</option>
                  {routes.map((r) => <option key={r.id} value={r.id}>{r.title} ({r.code})</option>)}
                </select>
                {editErrors.routeId && <p className="text-red-500 text-xs mt-1">{editErrors.routeId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle <span className="text-red-500">*</span></label>
                <select value={editVehicleId} onChange={(e) => { setEditVehicleId(e.target.value); if (editErrors.vehicleId) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select Vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicleNumber} - {v.vehicleName}</option>)}
                </select>
                {editErrors.vehicleId && <p className="text-red-500 text-xs mt-1">{editErrors.vehicleId}</p>}
              </div>
              {editVehicleId && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Driver: <span className="font-medium text-gray-700">{getVehicle(Number(editVehicleId))?.driverName}</span></p>
                  <p className="text-xs text-gray-500">Contact: <span className="font-medium text-gray-700">{getVehicle(Number(editVehicleId))?.driverContact}</span></p>
                </div>
              )}
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
              Are you sure you want to delete this assignment?
              {deleteId && (() => {
                const a = data.find((d) => d.id === deleteId)
                return <strong className="block mt-1 text-gray-800">{a ? `${getRoute(a.routeId)?.title} → ${getVehicle(a.vehicleId)?.vehicleNumber}` : ""}</strong>
              })()}
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
