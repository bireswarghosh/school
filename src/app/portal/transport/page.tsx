"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Bus,
  Search,
  Loader2,
  MapPin,
  Clock,
  User,
  Phone,
  Car,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useCurrency } from "@/lib/currency-context"

type Vehicle = {
  vehicleId: number; vehicleNumber: string; vehicleName: string;
  capacity: number; driverName: string; driverContact: string;
}

type PickupPoint = {
  pickupPointId: number; pickupPointName: string; address: string;
  pickupTime: string; amount: number;
}

type Route = {
  id: number; title: string; code: string;
  vehicles: Vehicle[]; pickupPoints: PickupPoint[];
}

export default function TransportPage() {
  const { symbol } = useCurrency()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/my/student/transport")
      const d = await res.json()
      setRoutes(d.routes || [])
    } catch { setRoutes([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = routes.filter(r => {
    if (!query) return true
    const q = query.toLowerCase()
    return r.title?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q) ||
      r.vehicles.some(v => v.vehicleName?.toLowerCase().includes(q) || v.driverName?.toLowerCase().includes(q)) ||
      r.pickupPoints.some(p => p.pickupPointName?.toLowerCase().includes(q))
  })

  const toggle = (id: number) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const routeColors = ["from-blue-500 to-blue-600", "from-emerald-500 to-emerald-600", "from-purple-500 to-purple-600", "from-amber-500 to-amber-600", "from-rose-500 to-rose-600"]
  const routeBorders = ["border-blue-200", "border-emerald-200", "border-purple-200", "border-amber-200", "border-rose-200"]
  const routeBadge = ["bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700"]
  const routeBg = ["bg-blue-50", "bg-emerald-50", "bg-purple-50", "bg-amber-50", "bg-rose-50"]

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-5 shadow-sm">
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-20 h-20 w-20 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white">
            <Bus className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white">Transport Routes</h1>
            <p className="mt-0.5 text-sm text-white/80">View your school transport routes, vehicles & pickup points</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
        <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
          <div className="flex items-center gap-2 mb-1"><Bus className="h-4 w-4" style={{ color: "var(--primary)" }} /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Total Routes</span></div>
          <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{routes.length}</p>
        </div>
        <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
          <div className="flex items-center gap-2 mb-1"><Car className="h-4 w-4 text-blue-500" /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Vehicles</span></div>
          <p className="text-xl font-bold text-blue-600">{routes.reduce((s, r) => s + r.vehicles.length, 0)}</p>
        </div>
        <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
          <div className="flex items-center gap-2 mb-1"><MapPin className="h-4 w-4 text-amber-500" /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Pickup Points</span></div>
          <p className="text-xl font-bold text-amber-600">{routes.reduce((s, r) => s + r.pickupPoints.length, 0)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--subtitle-color)]" />
        <input type="search" placeholder="Search routes, vehicles, pickup points..." value={query} onChange={e => setQuery(e.target.value)}
          className="pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--subtitle-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-full max-w-md" />
      </div>

      {/* Routes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          <span className="text-sm text-[var(--subtitle-color)]">Loading transport routes...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Bus className="h-12 w-12 text-[var(--primary-light)]" />
          <p className="text-sm text-[var(--subtitle-color)]">{query ? "No matching routes." : "No transport routes available."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((route, i) => {
            const isOpen = expanded[route.id] !== false
            const ci = i % routeColors.length
            return (
              <div key={route.id} className={`rounded-xl border overflow-hidden ${routeBorders[ci]} bg-[var(--card)]`}>
                {/* Route Header */}
                <button onClick={() => toggle(route.id)} className="w-full text-left">
                  <div className={`bg-gradient-to-r ${routeColors[ci]} px-5 py-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                          <Bus className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-white">{route.title}</h3>
                          <p className="text-xs text-white/70">{route.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-xs font-semibold">
                            {route.vehicles.length} vehicle{route.vehicles.length !== 1 ? "s" : ""}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-xs font-semibold">
                            {route.pickupPoints.length} stop{route.pickupPoints.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-white/70" /> : <ChevronDown className="h-4 w-4 text-white/70" />}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Route Body */}
                {isOpen && (
                  <div className="p-5 space-y-5">
                    {/* Vehicles */}
                    {route.vehicles.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: "var(--subtitle-color)" }}>
                          <Car className="h-3.5 w-3.5" /> Vehicles Assigned
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {route.vehicles.map(v => (
                            <div key={v.vehicleId} className={`rounded-xl p-4 border ${routeBorders[ci]} ${routeBg[ci]}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${routeBadge[ci]}`}>{v.vehicleNumber}</span>
                              </div>
                              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{v.vehicleName}</p>
                              <div className="mt-2 space-y-1 text-xs" style={{ color: "var(--subtitle-color)" }}>
                                <div className="flex items-center gap-1.5"><Users className="h-3 w-3" />Capacity: {v.capacity}</div>
                                <div className="flex items-center gap-1.5"><User className="h-3 w-3" />{v.driverName}</div>
                                <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{v.driverContact}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pickup Points Timeline */}
                    {route.pickupPoints.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: "var(--subtitle-color)" }}>
                          <MapPin className="h-3.5 w-3.5" /> Pickup Points
                        </h4>
                        <div className="relative ml-3">
                          <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ backgroundColor: "var(--border)" }} />
                          <div className="space-y-0">
                            {route.pickupPoints.map((p, pi) => (
                              <div key={p.pickupPointId} className="relative flex items-start gap-4 py-3">
                                <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${routeColors[ci]} ring-2 ring-white z-10`}>
                                  {pi + 1}
                                </div>
                                <div className="ml-10 flex-1 rounded-xl p-3 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{p.pickupPointName}</p>
                                      <p className="text-xs mt-0.5" style={{ color: "var(--subtitle-color)" }}>{p.address}</p>
                                    </div>
                                    <div className="text-right">
                                      {p.pickupTime && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold">
                                          <Clock className="h-3 w-3" />{p.pickupTime}
                                        </span>
                                      )}
                                      {p.amount > 0 && (
                                        <p className="text-xs font-semibold text-green-600 mt-1">{symbol}{p.amount}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {route.vehicles.length === 0 && route.pickupPoints.length === 0 && (
                      <p className="text-center text-sm py-4" style={{ color: "var(--subtitle-color)" }}>
                        No vehicles or pickup points assigned to this route yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
