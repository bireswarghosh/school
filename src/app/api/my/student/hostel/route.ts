import { NextRequest } from "next/server"
import { handle, requireRole } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])

  const hostelsResult = await query(
    `SELECT id, name, type, address, phone,
       warden_name AS "wardenName", warden_contact AS "wardenContact"
     FROM hostels ORDER BY id`
  )

  const roomsResult = await query(
    `SELECT hr.id, hr.hostel_id AS "hostelId", hr.room_number AS "roomNumber",
       hr.capacity, hr.rent, rt.name AS "roomType", rt.description AS "roomTypeDescription"
     FROM hostel_rooms hr
     LEFT JOIN room_types rt ON rt.id = hr.room_type_id
     ORDER BY hr.hostel_id, hr.room_number`
  )

  const typeMap: Record<number, typeof roomsResult.rows> = {}
  for (const room of roomsResult.rows) {
    if (!typeMap[room.hostelId]) typeMap[room.hostelId] = []
    typeMap[room.hostelId].push(room)
  }

  const hostels = hostelsResult.rows.map(h => ({
    ...h,
    rooms: typeMap[h.id] || [],
    totalRooms: (typeMap[h.id] || []).length,
    totalBeds: (typeMap[h.id] || []).reduce((s, r) => s + (r.capacity || 0), 0),
  }))

  return { hostels }
})
