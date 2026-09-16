import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"


function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "disabled_staff"
const ORDER = "id DESC"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 })
  }
  const items = await getAll(TABLE, ORDER)
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const schoolId = getSessionSchoolId(req)

    // Enhanced disable flow: { staffId: number (staff.id), reason: string }
    // If staffId + reason provided, perform transactional disable (insert disabled_staff + update staff/users)
    const rawStaffId = body.staffId ?? body.staff_id ?? body.staff_id_string ?? body.id
    const reason = String(body.reason ?? body.disabledReason ?? body.remarks ?? "").trim()

    if (rawStaffId && reason) {
      const staffIdNum = parseInt(String(rawStaffId), 10)
      if (!staffIdNum) return NextResponse.json({ error: "Valid staffId required" }, { status: 400 })
      if (reason.length < 3) return NextResponse.json({ error: "Reason must be at least 3 characters" }, { status: 400 })

      // Fetch staff with department name
      const staffRes = await query(
        `SELECT s.*, d.name as department_name FROM staff s LEFT JOIN departments d ON d.id = s.department_id WHERE s.id = $1`,
        [staffIdNum]
      )
      const st: any = staffRes.rows[0]
      if (!st) return NextResponse.json({ error: "Staff not found" }, { status: 404 })
      if (schoolId && st.school_id !== schoolId) return NextResponse.json({ error: "Staff not found in this school" }, { status: 404 })
      if (st.status && String(st.status).toLowerCase() === "disabled") {
        return NextResponse.json({ error: "Staff is already disabled" }, { status: 400 })
      }
      // Check already in disabled_staff by staff_id string
      const existsRes = await query(`SELECT id FROM disabled_staff WHERE staff_id = $1 AND school_id = $2`, [st.staff_id, st.school_id ?? schoolId])
      if (existsRes.rows.length > 0) {
        return NextResponse.json({ error: "Staff is already in disabled list" }, { status: 400 })
      }

      const disabledDate = new Date().toISOString().split("T")[0]
      const deptName = st.department_name || ""
      const item = await create(
        TABLE,
        {
          staff_id: st.staff_id,
          name: st.name + (st.surname ? ` ${st.surname}` : ""),
          email: st.email || "",
          department: deptName,
          disabled_date: disabledDate,
          reason,
        } as any,
        schoolId ?? st.school_id ?? undefined
      )

      // Mark staff as Disabled
      await query(`UPDATE staff SET status = 'Disabled' WHERE id = $1`, [st.id])
      // Disable linked user login
      if (st.user_id) {
        await query(`UPDATE users SET status = 'Inactive' WHERE id = $1`, [st.user_id])
      } else if (st.email) {
        // fallback: disable by email if no user_id link
        await query(`UPDATE users SET status = 'Inactive' WHERE lower(email) = lower($1) AND school_id = $2`, [st.email, st.school_id ?? schoolId])
      }

      return NextResponse.json(item, { status: 201 })
    }

    const item = await create(TABLE, body, schoolId ?? undefined)
    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const schoolId = getSessionSchoolId(req)
    const item = await update(TABLE, id, data, schoolId ?? undefined)
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const schoolId = getSessionSchoolId(req)

  // Enable flow: restore staff/users before deleting disabled record
  try {
    const cur = await getById<any>(TABLE, id, schoolId ?? undefined)
    if (cur) {
      const staffIdStr = cur.staff_id
      if (staffIdStr) {
        const staffRes = await query(`SELECT id, user_id, email FROM staff WHERE staff_id = $1 ${schoolId ? "AND school_id = $2" : ""}`, schoolId ? [staffIdStr, schoolId] : [staffIdStr])
        const st = staffRes.rows[0]
        if (st) {
          await query(`UPDATE staff SET status = 'Active' WHERE id = $1`, [st.id])
          if (st.user_id) {
            await query(`UPDATE users SET status = 'Active' WHERE id = $1`, [st.user_id])
          } else if (st.email) {
            await query(`UPDATE users SET status = 'Active' WHERE lower(email)=lower($1) ${schoolId ? "AND school_id=$2" : ""}`, schoolId ? [st.email, schoolId] : [st.email])
          }
          // Also ensure by email (cur.email) is enabled
          if (cur.email && cur.email !== st.email) {
            await query(`UPDATE users SET status='Active' WHERE lower(email)=lower($1) ${schoolId ? "AND school_id=$2" : ""}`, schoolId ? [cur.email, schoolId] : [cur.email])
          }
        } else if (cur.email) {
          await query(`UPDATE users SET status='Active' WHERE lower(email)=lower($1) ${schoolId ? "AND school_id=$2" : ""}`, schoolId ? [cur.email, schoolId] : [cur.email])
        }
      }
    }
  } catch {
    // proceed to delete even if restore fails
  }

  await remove(TABLE, id, schoolId ?? undefined)
  return NextResponse.json({ success: true })
}