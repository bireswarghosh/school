"use client"

import { useState, useEffect } from "react"
import { Search, Eye, X, Save, DollarSign } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useCurrency } from "@/lib/currency-context"

type Route = { id: number; title: string }
type PickupPoint = { id: number; name: string }
type Vehicle = { id: number; vehicleNumber: string; driverName: string }

type StudentFee = {
  id: number
  studentName: string
  className: string
  section: string
  routeId: number
  pickupPointId: number
  vehicleId: number
  feesAmount: number
  paidAmount: number
  status: "Paid" | "Pending" | "Due"
}

const routes: Route[] = [
  { id: 1, title: "Route 1" }, { id: 2, title: "Route 2" }, { id: 3, title: "Route 3" }, { id: 4, title: "Route 4" }, { id: 5, title: "Route 5" },
]

const pickupPoints: PickupPoint[] = [
  { id: 1, name: "Main Gate" }, { id: 2, name: "East Gate" }, { id: 3, name: "North Stop" }, { id: 4, name: "Market" }, { id: 5, name: "Mall Stop" }, { id: 6, name: "Stadium" },
]

const vehicles: Vehicle[] = [
  { id: 1, vehicleNumber: "UP-1234", driverName: "Ramesh Kumar" },
  { id: 2, vehicleNumber: "UP-5678", driverName: "Suresh Singh" },
  { id: 3, vehicleNumber: "UP-9012", driverName: "Dinesh Yadav" },
  { id: 4, vehicleNumber: "UP-3456", driverName: "Mahesh Kumar" },
  { id: 5, vehicleNumber: "UP-7890", driverName: "Rajesh Verma" },
]

export default function StudentTransportFeesPage() {
  const { symbol } = useCurrency()
  const { classNames: classes, sectionNames: sections } = useClassesAndSections();
  const { data, update, loading } = useApi<StudentFee>("/api/transport/student-fees")
  const [filterClass, setFilterClass] = useState("")
  const [filterSection, setFilterSection] = useState("")
  const [filterStudent, setFilterStudent] = useState("")
  const [filteredData, setFilteredData] = useState<StudentFee[]>([])

  useEffect(() => { setFilteredData(data) }, [data])
  const [showCollectModal, setShowCollectModal] = useState(false)
  const [collectId, setCollectId] = useState<number | null>(null)
  const [collectAmount, setCollectAmount] = useState("")
  const [collectMode, setCollectMode] = useState("Cash")
  const [collectDate, setCollectDate] = useState(new Date().toISOString().split("T")[0])
  const [collectErrors, setCollectErrors] = useState<Record<string, string>>({})
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewItem, setViewItem] = useState<StudentFee | null>(null)

  const getRoute = (rid: number) => routes.find((r) => r.id === rid)
  const getPickupPoint = (pid: number) => pickupPoints.find((p) => p.id === pid)
  const getVehicle = (vid: number) => vehicles.find((v) => v.id === vid)

  const getUniqueStudents = () => {
    let list = data
    if (filterClass) list = list.filter((d) => d.className === filterClass)
    if (filterSection) list = list.filter((d) => d.section === filterSection)
    return [...new Set(list.map((d) => d.studentName))]
  }

  const handleSearch = () => {
    let result = data
    if (filterClass) result = result.filter((d) => d.className === filterClass)
    if (filterSection) result = result.filter((d) => d.section === filterSection)
    if (filterStudent) result = result.filter((d) => d.studentName === filterStudent)
    setFilteredData(result)
  }

  const handleCollectOpen = (item: StudentFee) => {
    setCollectId(item.id)
    setCollectAmount(String(item.feesAmount - item.paidAmount))
    setCollectMode("Cash")
    setCollectDate(new Date().toISOString().split("T")[0])
    setCollectErrors({})
    setShowCollectModal(true)
  }

  const handleCollectSave = async () => {
    const errs: Record<string, string> = {}
    if (!collectAmount || isNaN(Number(collectAmount)) || Number(collectAmount) <= 0) errs.amount = "Valid amount is required"
    if (!collectDate) errs.date = "Date is required"
    setCollectErrors(errs)
    if (Object.keys(errs).length) return

    const item = data.find((d) => d.id === collectId)
    if (item) {
      const newPaid = item.paidAmount + Number(collectAmount)
      const newStatus = newPaid >= item.feesAmount ? "Paid" : "Due"
      await update(collectId!, { paidAmount: newPaid, status: newStatus })
      setFilteredData((prev) =>
        prev.map((d) => d.id === collectId ? { ...d, paidAmount: newPaid, status: newStatus } : d)
      )
    }
    setShowCollectModal(false)
    setCollectId(null)
  }

  const handleViewOpen = (item: StudentFee) => {
    setViewItem(item)
    setShowViewModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Student Transport Fees</h1>
        <p className="mt-1 text-sm text-white/80">Transport / Student Transport Fees</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Filter Records</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">All Classes</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">All Sections</option>
                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
              <select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">All Students</option>
                {getUniqueStudents().map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleSearch} className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                <Search className="h-4 w-4" /> Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Student Transport Fee List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Class</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pickup Point</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fees Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Paid Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">No records found</td></tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{item.className} - {item.section}</td>
                    <td className="px-4 py-3 text-gray-700">{getRoute(item.routeId)?.title || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{getPickupPoint(item.pickupPointId)?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{getVehicle(item.vehicleId)?.vehicleNumber || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{symbol}{item.feesAmount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === "Paid" ? "bg-green-100 text-green-800" :
                        item.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleCollectOpen(item)} disabled={item.status === "Paid"} className={`p-1.5 rounded-lg transition-colors ${item.status === "Paid" ? "text-gray-300 cursor-not-allowed" : "text-green-600 hover:bg-green-50"}`} title="Collect"><DollarSign className="h-4 w-4" /></button>
                        <button onClick={() => handleViewOpen(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          <span>Showing {filteredData.length} records</span>
        </div>
      </div>

      {showCollectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Collect Fees</h3>
              <button onClick={() => setShowCollectModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            {collectId && (() => {
              const item = data.find((d) => d.id === collectId)
              return (
                <div className="space-y-4">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm text-gray-700"><span className="font-medium">Student:</span> {item?.studentName}</p>
                    <p className="text-sm text-gray-700"><span className="font-medium">Total Fees:</span> {symbol}{item?.feesAmount}</p>
                    <p className="text-sm text-gray-700"><span className="font-medium">Paid:</span> {symbol}{item?.paidAmount}</p>
                    <p className="text-sm font-semibold text-gray-800"><span className="font-medium">Due:</span> {symbol}{(item?.feesAmount || 0) - (item?.paidAmount || 0)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                    <input type="number" value={collectAmount} onChange={(e) => { setCollectAmount(e.target.value); if (collectErrors.amount) setCollectErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                    {collectErrors.amount && <p className="text-red-500 text-xs mt-1">{collectErrors.amount}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                    <select value={collectMode} onChange={(e) => setCollectMode(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                    <input type="date" value={collectDate} onChange={(e) => { setCollectDate(e.target.value); if (collectErrors.date) setCollectErrors({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                    {collectErrors.date && <p className="text-red-500 text-xs mt-1">{collectErrors.date}</p>}
                  </div>
                </div>
              )
            })()}
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCollectModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><X className="h-4 w-4 inline mr-1" />Cancel</button>
              <button onClick={handleCollectSave} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"><Save className="h-4 w-4 inline mr-1" />Save</button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Transport Fee Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Student Name:</span></div>
                <div className="font-medium text-gray-800">{viewItem.studentName}</div>
                <div><span className="text-gray-500">Class:</span></div>
                <div className="font-medium text-gray-800">{viewItem.className} - {viewItem.section}</div>
                <div><span className="text-gray-500">Route:</span></div>
                <div className="font-medium text-gray-800">{getRoute(viewItem.routeId)?.title || "—"}</div>
                <div><span className="text-gray-500">Pickup Point:</span></div>
                <div className="font-medium text-gray-800">{getPickupPoint(viewItem.pickupPointId)?.name || "—"}</div>
                <div><span className="text-gray-500">Vehicle:</span></div>
                <div className="font-medium text-gray-800">{getVehicle(viewItem.vehicleId)?.vehicleNumber || "—"}</div>
                <div><span className="text-gray-500">Driver:</span></div>
                <div className="font-medium text-gray-800">{getVehicle(viewItem.vehicleId)?.driverName || "—"}</div>
                <div><span className="text-gray-500">Total Fees:</span></div>
                <div className="font-medium text-gray-800">{symbol}{viewItem.feesAmount}</div>
                <div><span className="text-gray-500">Paid Amount:</span></div>
                <div className="font-medium text-green-700">{symbol}{viewItem.paidAmount}</div>
                <div><span className="text-gray-500">Due Amount:</span></div>
                <div className="font-medium text-red-700">{symbol}{viewItem.feesAmount - viewItem.paidAmount}</div>
                <div><span className="text-gray-500">Status:</span></div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    viewItem.status === "Paid" ? "bg-green-100 text-green-800" :
                    viewItem.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>{viewItem.status}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowViewModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><X className="h-4 w-4 inline mr-1" />Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
