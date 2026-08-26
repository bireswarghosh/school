"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save, Bus, MapPin } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"

type Route = { id: number; title: string; code: string }
type PickupPoint = { id: number; name: string; address: string; latitude: string; longitude: string }
type Mapping = { id: number; routeId: number; pickupPointId: number; pickupTime: string; amount: number }

const routes: Route[] = [
  { id: 1, title: "Route 1", code: "RT-001" },
  { id: 2, title: "Route 2", code: "RT-002" },
  { id: 3, title: "Route 3", code: "RT-003" },
  { id: 4, title: "Route 4", code: "RT-004" },
  { id: 5, title: "Route 5", code: "RT-005" },
]

const pickupPoints: PickupPoint[] = [
  { id: 1, name: "Main Gate", address: "School Main Entrance Gate", latitude: "28.6139", longitude: "77.2090" },
  { id: 2, name: "East Gate", address: "School East Side Entrance", latitude: "28.6145", longitude: "77.2100" },
  { id: 3, name: "North Stop", address: "North Block Crossing", latitude: "28.6200", longitude: "77.2050" },
  { id: 4, name: "Market", address: "City Market Bus Stop", latitude: "28.6000", longitude: "77.2150" },
  { id: 5, name: "Mall Stop", address: "Shopping Mall Main Gate", latitude: "28.5900", longitude: "77.2200" },
  { id: 6, name: "Stadium", address: "Sports Stadium Parking Lot", latitude: "28.6300", longitude: "77.2000" },
]

export default function RoutePickupPointPage() {
  const { symbol } = useCurrency()
  const { data, add, update, remove, loading } = useApi<Mapping>("/api/transport/route-pickup-point")
  const [routeId, setRouteId] = useState("")
  const [pickupPointId, setPickupPointId] = useState("")
  const [pickupTime, setPickupTime] = useState("")
  const [amount, setAmount] = useState("")
  const [editId, setEditId] = useState<number | null>(null)
  const [editRouteId, setEditRouteId] = useState("")
  const [editPickupPointId, setEditPickupPointId] = useState("")
  const [editPickupTime, setEditPickupTime] = useState("")
  const [editAmount, setEditAmount] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const getRoute = (rid: number) => routes.find((r) => r.id === rid)
  const getPickupPoint = (pid: number) => pickupPoints.find((p) => p.id === pid)

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!routeId) errs.routeId = "Please select a route"
    if (!pickupPointId) errs.pickupPointId = "Please select a pickup point"
    if (!pickupTime) errs.pickupTime = "Please select pickup time"
    if (!amount || isNaN(Number(amount))) errs.amount = "Valid amount is required"
    setErrors(errs)
    if (Object.keys(errs).length) return

    await add({ routeId: Number(routeId), pickupPointId: Number(pickupPointId), pickupTime, amount: Number(amount) })
    setRouteId(""); setPickupPointId(""); setPickupTime(""); setAmount("")
  }

  const handleEditOpen = (item: Mapping) => {
    setEditId(item.id)
    setEditRouteId(String(item.routeId))
    setEditPickupPointId(String(item.pickupPointId))
    setEditPickupTime(item.pickupTime)
    setEditAmount(String(item.amount))
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs: Record<string, string> = {}
    if (!editRouteId) errs.routeId = "Please select a route"
    if (!editPickupPointId) errs.pickupPointId = "Please select a pickup point"
    if (!editPickupTime) errs.pickupTime = "Please select pickup time"
    if (!editAmount || isNaN(Number(editAmount))) errs.amount = "Valid amount is required"
    setEditErrors(errs)
    if (Object.keys(errs).length) return

    await update(editId!, { routeId: Number(editRouteId), pickupPointId: Number(editPickupPointId), pickupTime: editPickupTime, amount: Number(editAmount) })
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
        <h1 className="text-xl font-semibold text-white">Route Pickup Point</h1>
        <p className="mt-1 text-sm text-white/80">Transport / Route Pickup Point</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Add Mapping</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Point <span className="text-red-500">*</span></label>
                <select value={pickupPointId} onChange={(e) => { setPickupPointId(e.target.value); if (errors.pickupPointId) setErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select Pickup Point</option>
                  {pickupPoints.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.pickupPointId && <p className="text-red-500 text-xs mt-1">{errors.pickupPointId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time <span className="text-red-500">*</span></label>
                <input type="time" value={pickupTime} onChange={(e) => { setPickupTime(e.target.value); if (errors.pickupTime) setErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.pickupTime && <p className="text-red-500 text-xs mt-1">{errors.pickupTime}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                <input type="number" value={amount} onChange={(e) => { setAmount(e.target.value); if (errors.amount) setErrors({}) }} placeholder="500" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
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
              <h3 className="text-sm font-semibold text-gray-700">Mapping List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pickup Point</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No mappings found</td></tr>
                  ) : (
                    data.map((item, idx) => {
                      const route = getRoute(item.routeId)
                      const point = getPickupPoint(item.pickupPointId)
                      return (
                        <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                          <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-800"><Bus className="h-3.5 w-3.5 inline mr-1 text-[var(--primary)]" />{route?.title || "—"}</td>
                          <td className="px-4 py-3 text-gray-700"><MapPin className="h-3.5 w-3.5 inline mr-1 text-[var(--primary)]" />{point?.name || "—"}</td>
                          <td className="px-4 py-3 text-gray-600">{item.pickupTime}</td>
                          <td className="px-4 py-3 text-gray-700 font-medium">{symbol}{item.amount}</td>
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
              <h3 className="text-base font-semibold text-gray-800">Edit Mapping</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Point <span className="text-red-500">*</span></label>
                <select value={editPickupPointId} onChange={(e) => { setEditPickupPointId(e.target.value); if (editErrors.pickupPointId) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select Pickup Point</option>
                  {pickupPoints.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {editErrors.pickupPointId && <p className="text-red-500 text-xs mt-1">{editErrors.pickupPointId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time <span className="text-red-500">*</span></label>
                <input type="time" value={editPickupTime} onChange={(e) => { setEditPickupTime(e.target.value); if (editErrors.pickupTime) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.pickupTime && <p className="text-red-500 text-xs mt-1">{editErrors.pickupTime}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                <input type="number" value={editAmount} onChange={(e) => { setEditAmount(e.target.value); if (editErrors.amount) setEditErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.amount && <p className="text-red-500 text-xs mt-1">{editErrors.amount}</p>}
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
              Are you sure you want to delete this mapping?
              {deleteId && (() => {
                const m = data.find((d) => d.id === deleteId)
                return <strong className="block mt-1 text-gray-800">{m ? `${getRoute(m.routeId)?.title} → ${getPickupPoint(m.pickupPointId)?.name}` : ""}</strong>
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
