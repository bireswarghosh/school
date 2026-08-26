import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

const fieldMap: Record<string, string> = {
  liveLink: "live_link",
  meetingId: "meeting_id",
  hostName: "host_name",
  startTime: "start_time",
  endTime: "end_time",
  invitedStaff: "invited_staff",
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (id) {
      const result = await query(`
        SELECT lm.*,
          COALESCE(
            json_agg(
          json_build_object('staffId', lmi.staff_id, 'staffName', s.name)
              ORDER BY lmi.id
            ) FILTER (WHERE lmi.id IS NOT NULL),
            '[]'::json
          ) AS invited_staff
        FROM live_meetings lm
        LEFT JOIN live_meeting_invitees lmi ON lmi.meeting_id = lm.id
        LEFT JOIN staff s ON s.id = lmi.staff_id
        WHERE lm.id = $1
        GROUP BY lm.id
      `, [parseInt(id)])
      const item = result.rows[0] || null
      return NextResponse.json(item ? mapResponse(item, fieldMap) : { error: "Not found" }, { status: item ? 200 : 404 })
    }

    const result = await query(`
      SELECT lm.*,
        COALESCE(
          json_agg(
            json_build_object('staffId', lmi.staff_id, 'staffName', s.name)
            ORDER BY lmi.id
          ) FILTER (WHERE lmi.id IS NOT NULL),
          '[]'::json
        ) AS invited_staff
      FROM live_meetings lm
      LEFT JOIN live_meeting_invitees lmi ON lmi.meeting_id = lm.id
      LEFT JOIN staff s ON s.id = lmi.staff_id
      GROUP BY lm.id
      ORDER BY lm.id DESC
    `)
    return NextResponse.json(mapResponse(result.rows, fieldMap))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { invitedStaff, ...rest } = body
    const data = camelToSnake(rest, fieldMap)
    delete data.invited_staff

    const ins = await query(
      `INSERT INTO live_meetings (${Object.keys(data).join(", ")}) VALUES (${Object.keys(data).map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *`,
      Object.values(data)
    )
    const item = ins.rows[0]

    if (invitedStaff && Array.isArray(invitedStaff) && invitedStaff.length > 0) {
      const vals: any[] = []
      const phs: string[] = []
      invitedStaff.forEach((sid: number, i: number) => {
        phs.push(`($${i * 2 + 1}, $${i * 2 + 2})`)
        vals.push(item.id, sid)
      })
      await query(
        `INSERT INTO live_meeting_invitees (meeting_id, staff_id) VALUES ${phs.join(", ")}`,
        vals
      )
    }

    const full = await query(`
      SELECT lm.*,
        COALESCE(
          json_agg(
            json_build_object('staffId', lmi.staff_id, 'staffName', s.name)
            ORDER BY lmi.id
          ) FILTER (WHERE lmi.id IS NOT NULL),
          '[]'::json
        ) AS invited_staff
      FROM live_meetings lm
      LEFT JOIN live_meeting_invitees lmi ON lmi.meeting_id = lm.id
      LEFT JOIN staff s ON s.id = lmi.staff_id
      WHERE lm.id = $1
      GROUP BY lm.id
    `, [item.id])

    return NextResponse.json(mapResponse(full.rows[0], fieldMap), { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, invitedStaff, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const data = camelToSnake(rest, fieldMap)
    delete data.invited_staff

    if (Object.keys(data).length > 0) {
      const setClause = Object.keys(data).map((k, i) => `${k} = $${i + 1}`).join(", ")
      await query(
        `UPDATE live_meetings SET ${setClause} WHERE id = $${Object.keys(data).length + 1}`,
        [...Object.values(data), id]
      )
    }

    if (invitedStaff && Array.isArray(invitedStaff)) {
      await query(`DELETE FROM live_meeting_invitees WHERE meeting_id = $1`, [id])
      if (invitedStaff.length > 0) {
        const vals: any[] = []
        const phs: string[] = []
        invitedStaff.forEach((sid: number, i: number) => {
          phs.push(`($${i * 2 + 1}, $${i * 2 + 2})`)
          vals.push(id, sid)
        })
        await query(
          `INSERT INTO live_meeting_invitees (meeting_id, staff_id) VALUES ${phs.join(", ")}`,
          vals
        )
      }
    }

    const full = await query(`
      SELECT lm.*,
        COALESCE(
          json_agg(
            json_build_object('staffId', lmi.staff_id, 'staffName', s.name)
            ORDER BY lmi.id
          ) FILTER (WHERE lmi.id IS NOT NULL),
          '[]'::json
        ) AS invited_staff
      FROM live_meetings lm
      LEFT JOIN live_meeting_invitees lmi ON lmi.meeting_id = lm.id
      LEFT JOIN staff s ON s.id = lmi.staff_id
      WHERE lm.id = $1
      GROUP BY lm.id
    `, [id])

    return NextResponse.json(mapResponse(full.rows[0], fieldMap))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get("id") || "0")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    await query(`DELETE FROM live_meeting_invitees WHERE meeting_id = $1`, [id])
    await query(`DELETE FROM live_meetings WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
