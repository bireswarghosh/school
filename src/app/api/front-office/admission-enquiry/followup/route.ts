import { NextRequest, NextResponse } from "next/server"
import { query, create, update } from "@/lib/db"
import { getSessionUserId, getSessionSchoolId } from "@/lib/auth"
import { snakeToCamel } from "@/lib/field-mapping"

const TABLE = "admission_enquiry_followups"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const enquiryId = parseInt(searchParams.get("enquiryId") || "0")
  if (!enquiryId) return NextResponse.json({ error: "enquiryId required" }, { status: 400 })
  try {
    const result = await query(
      `SELECT id, admission_enquiry_id, note, followup_date, followup_time, status, created_by, created_at
       FROM ${TABLE} WHERE admission_enquiry_id = $1 ORDER BY created_at DESC, id DESC`,
      [enquiryId]
    )
    const rows = result.rows.map((r) =>
      snakeToCamel(r, { admissionEnquiryId: "admission_enquiry_id", followUpDate: "followup_date", followUpTime: "followup_time", createdBy: "created_by" })
    )
    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const enquiryId = parseInt(body.enquiryId || "0")
    const note = (body.note || "").toString().trim()
    if (!enquiryId) return NextResponse.json({ error: "enquiryId required" }, { status: 400 })
    if (!note) return NextResponse.json({ error: "note required" }, { status: 400 })

    const schoolId = getSessionSchoolId(req)
    const userId = getSessionUserId(req)
    let createdBy: string | null = null
    if (userId) {
      const u = await query(`SELECT name FROM users WHERE id = $1`, [userId])
      createdBy = u.rows[0]?.name || null
    }

    const followUpDate = (body.followUpDate || "").toString().trim()
    const followUpTime = (body.followUpTime || "").toString().trim()
    const status = (body.status || "Active").toString().trim()

    const created = (await create(TABLE, {
      admission_enquiry_id: enquiryId,
      note,
      ...(followUpDate ? { followup_date: followUpDate } : {}),
      ...(followUpTime ? { followup_time: followUpTime } : {}),
      status,
      ...(createdBy ? { created_by: createdBy } : {}),
    })) as unknown as { id: number }

    // Keep the enquiry in sync: last follow-up date + current status
    const enquiryUpdate: Record<string, any> = { status }
    if (followUpDate) enquiryUpdate.last_followup_date = followUpDate
    await update("admission_enquiries", enquiryId, enquiryUpdate, schoolId)

    const rows = await query(
      `SELECT id, admission_enquiry_id, note, followup_date, followup_time, status, created_by, created_at
       FROM ${TABLE} WHERE id = $1`,
      [created.id]
    )
    return NextResponse.json(
      snakeToCamel(rows.rows[0], { admissionEnquiryId: "admission_enquiry_id", followUpDate: "followup_date", followUpTime: "followup_time", createdBy: "created_by" }),
      { status: 201 }
    )
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
