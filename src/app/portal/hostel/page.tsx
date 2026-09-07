"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Building2,
  Search,
  Loader2,
  Bed,
  Users,
  Phone,
  MapPin,
  User,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Home,
} from "lucide-react"
import { useCurrency } from "@/lib/currency-context"

type Room = {
  id: number; hostelId: number; roomNumber: string; capacity: number;
  rent: number; roomType: string; roomTypeDescription: string;
}

type Hostel = {
  id: number; name: string; type: string; address: string; phone: string;
  wardenName: string; wardenContact: string;
  rooms: Room[]; totalRooms: number; totalBeds: number;
}

export default function HostelPage() {
  const { symbol } = useCurrency()
  const [hostels, setHostels] = useState<Hostel[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [filterType, setFilterType] = useState("All")
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/my/student/hostel")
      const d = await res.json()
      setHostels(d.hostels || [])
    } catch { setHostels([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const types = ["All", ...Array.from(new Set(hostels.map(h => h.type).filter(Boolean)))]

  const filtered = hostels.filter(h => {
    const q = query.toLowerCase()
    if (q && !h.name?.toLowerCase().includes(q) && !h.address?.toLowerCase().includes(q) && !h.wardenName?.toLowerCase().includes(q)) return false
    if (filterType !== "All" && h.type !== filterType) return false
    return true
  })

  const toggle = (id: number) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const totalBeds = hostels.reduce((s, h) => s + h.totalBeds, 0)
  const totalRooms = hostels.reduce((s, h) => s + h.totalRooms, 0)

  const hostelColors = ["from-blue-500 to-blue-600", "from-rose-500 to-rose-600", "from-emerald-500 to-emerald-600", "from-purple-500 to-purple-600"]
  const hostelBorders = ["border-blue-200", "border-rose-200", "border-emerald-200", "border-purple-200"]
  const hostelBadge = ["bg-blue-100 text-blue-700", "bg-rose-100 text-rose-700", "bg-emerald-100 text-emerald-700", "bg-purple-100 text-purple-700"]
  const hostelBg = ["bg-blue-50", "bg-rose-50", "bg-emerald-50", "bg-purple-50"]

  const roomTypeColors: Record<string, string> = {
    Single: "bg-amber-100 text-amber-700",
    Double: "bg-blue-100 text-blue-700",
    Dormitory: "bg-purple-100 text-purple-700",
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-5 shadow-sm">
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-20 h-20 w-20 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white">Hostel Rooms</h1>
            <p className="mt-0.5 text-sm text-white/80">View available hostels, rooms and accommodation details</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
          <div className="flex items-center gap-2 mb-1"><Building2 className="h-4 w-4" style={{ color: "var(--primary)" }} /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Hostels</span></div>
          <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{hostels.length}</p>
        </div>
        <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
          <div className="flex items-center gap-2 mb-1"><Home className="h-4 w-4 text-blue-500" /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Total Rooms</span></div>
          <p className="text-xl font-bold text-blue-600">{totalRooms}</p>
        </div>
        <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
          <div className="flex items-center gap-2 mb-1"><Bed className="h-4 w-4 text-emerald-500" /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Total Beds</span></div>
          <p className="text-xl font-bold text-emerald-600">{totalBeds}</p>
        </div>
        <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
          <div className="flex items-center gap-2 mb-1"><IndianRupee className="h-4 w-4 text-amber-500" /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Min Rent</span></div>
          <p className="text-xl font-bold text-amber-600">
            {symbol}{hostels.flatMap(h => h.rooms.map(r => r.rent)).sort((a, b) => a - b)[0] || 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--subtitle-color)]" />
          <input type="search" placeholder="Search hostels, warden..." value={query} onChange={e => setQuery(e.target.value)}
            className="pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--subtitle-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-64" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)]">
          {types.map(t => <option key={t} value={t}>{t === "All" ? "All Types" : t}</option>)}
        </select>
      </div>

      {/* Hostels */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          <span className="text-sm text-[var(--subtitle-color)]">Loading hostels...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Building2 className="h-12 w-12 text-[var(--primary-light)]" />
          <p className="text-sm text-[var(--subtitle-color)]">{query ? "No matching hostels." : "No hostels available."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((hostel, i) => {
            const isOpen = expanded[hostel.id] !== false
            const ci = i % hostelColors.length
            return (
              <div key={hostel.id} className={`rounded-xl border overflow-hidden ${hostelBorders[ci]} bg-[var(--card)]`}>
                {/* Hostel Header */}
                <button onClick={() => toggle(hostel.id)} className="w-full text-left">
                  <div className={`bg-gradient-to-r ${hostelColors[ci]} px-5 py-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                          <Building2 className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-white">{hostel.name}</h3>
                          <p className="text-xs text-white/70">{hostel.type} Hostel</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-xs font-semibold">
                            {hostel.totalRooms} room{hostel.totalRooms !== 1 ? "s" : ""}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-xs font-semibold">
                            {hostel.totalBeds} bed{hostel.totalBeds !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-white/70" /> : <ChevronDown className="h-4 w-4 text-white/70" />}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Hostel Body */}
                {isOpen && (
                  <div className="p-5 space-y-5">
                    {/* Info Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className={`rounded-xl p-3 border ${hostelBorders[ci]} ${hostelBg[ci]}`}>
                        <div className="flex items-center gap-1.5 mb-1"><MapPin className="h-3 w-3" style={{ color: "var(--subtitle-color)" }} /><span className="text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Address</span></div>
                        <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{hostel.address}</p>
                      </div>
                      <div className={`rounded-xl p-3 border ${hostelBorders[ci]} ${hostelBg[ci]}`}>
                        <div className="flex items-center gap-1.5 mb-1"><Phone className="h-3 w-3" style={{ color: "var(--subtitle-color)" }} /><span className="text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Phone</span></div>
                        <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{hostel.phone}</p>
                      </div>
                      <div className={`rounded-xl p-3 border ${hostelBorders[ci]} ${hostelBg[ci]}`}>
                        <div className="flex items-center gap-1.5 mb-1"><User className="h-3 w-3" style={{ color: "var(--subtitle-color)" }} /><span className="text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Warden</span></div>
                        <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{hostel.wardenName}</p>
                      </div>
                      <div className={`rounded-xl p-3 border ${hostelBorders[ci]} ${hostelBg[ci]}`}>
                        <div className="flex items-center gap-1.5 mb-1"><Phone className="h-3 w-3" style={{ color: "var(--subtitle-color)" }} /><span className="text-[10px] font-semibold uppercase" style={{ color: "var(--subtitle-color)" }}>Warden Contact</span></div>
                        <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{hostel.wardenContact}</p>
                      </div>
                    </div>

                    {/* Rooms */}
                    {hostel.rooms.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: "var(--subtitle-color)" }}>
                          <Bed className="h-3.5 w-3.5" /> Room List
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {hostel.rooms.map(room => (
                            <div key={room.id} className={`rounded-xl p-4 border ${hostelBorders[ci]} ${hostelBg[ci]} hover:shadow-md transition-shadow`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${roomTypeColors[room.roomType] || "bg-gray-100 text-gray-700"}`}>
                                  {room.roomType}
                                </span>
                                <span className="text-xs font-semibold" style={{ color: "var(--subtitle-color)" }}>
                                  {room.roomNumber}
                                </span>
                              </div>
                              {room.roomTypeDescription && (
                                <p className="text-[11px] mb-2 line-clamp-2" style={{ color: "var(--subtitle-color)" }}>{room.roomTypeDescription}</p>
                              )}
                              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" style={{ color: "var(--subtitle-color)" }} />
                                  <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{room.capacity} bed{room.capacity !== 1 ? "s" : ""}</span>
                                </div>
                                <span className="text-sm font-bold text-green-600">{symbol}{room.rent}<span className="text-[10px] font-normal text-[var(--subtitle-color)]">/mo</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {hostel.rooms.length === 0 && (
                      <p className="text-center text-sm py-4" style={{ color: "var(--subtitle-color)" }}>
                        No rooms configured for this hostel yet.
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
