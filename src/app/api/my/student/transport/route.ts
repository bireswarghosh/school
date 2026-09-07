import { NextRequest } from "next/server"
import { handle, requireRole } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])

  const routes = await query(
    `SELECT id, title, code FROM routes ORDER BY id`
  )

  const vehicles = await query(
    `SELECT rv.route_id AS "routeId", v.id AS "vehicleId", v.number AS "vehicleNumber",
       v.name AS "vehicleName", v.capacity, v.driver_name AS "driverName",
       v.driver_contact AS "driverContact"
     FROM route_vehicles rv
     JOIN vehicles v ON v.id = rv.vehicle_id`
  )

  const pickupPoints = await query(
    `SELECT rpp.route_id AS "routeId", p.id AS "pickupPointId", p.name AS "pickupPointName",
       p.address, rpp.pickup_time AS "pickupTime", rpp.amount
     FROM route_pickup_points rpp
     JOIN pickup_points p ON p.id = rpp.pickup_point_id
     ORDER BY rpp.pickup_time ASC NULLS LAST`
  )

  const routeMap: Record<number, { id: number; title: string; code: string; vehicles: typeof vehicles.rows; pickupPoints: typeof pickupPoints.rows }> = {}
  for (const r of routes.rows) {
    routeMap[r.id] = { id: r.id, title: r.title, code: r.code, vehicles: [], pickupPoints: [] }
  }
  for (const v of vehicles.rows) {
    if (routeMap[v.routeId]) routeMap[v.routeId].vehicles.push(v)
  }
  for (const pp of pickupPoints.rows) {
    if (routeMap[pp.routeId]) routeMap[pp.routeId].pickupPoints.push(pp)
  }

  return { routes: Object.values(routeMap) }
})
