import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"
import { getSessionSchoolId } from "@/lib/auth"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "payroll"
const ORDER = "id DESC"

const fieldMap: Record<string, string> = {
  staffId: "staff_id",
  staffName: "staff_name",
  basicSalary: "basic_salary",
  paymentDate: "payment_date",
  netSalary: "net_salary",
}

function toNumber(v: any, fallback = 0) {
  const n = parseFloat(String(v ?? fallback))
  return Number.isNaN(n) ? fallback : n
}

async function enrichRows(rows: any[]) {
  return rows.map((r: any) => {
    const mapped: any = { ...r }
    // staff display: prefer joined names, fallback to stored staff_name
    const staffDisplay = r.s_name ? `${r.s_name}${r.surname ? " " + r.surname : ""}`.trim() : r.staff_name || ""
    const deptDisplay = r.dept_name || r.department || ""
    mapped.staffName = staffDisplay
    mapped.department = deptDisplay
    // also expose s_staff_id for reference
    mapped.staffCode = r.s_staff_id || ""
    return mapResponse(mapped, fieldMap)
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const schoolId = getSessionSchoolId(req)

  if (id) {
    const sql = `SELECT p.*, s.staff_id as s_staff_id, s.name as s_name, s.surname, d.name as dept_name
      FROM payroll p
      LEFT JOIN staff s ON s.id = p.staff_id
      LEFT JOIN departments d ON d.id = s.department_id
      WHERE p.id = $1 ${schoolId ? "AND p.school_id = $2" : ""}`
    const params: any[] = schoolId ? [parseInt(id), schoolId] : [parseInt(id)]
    const res = await query(sql, params)
    if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const enriched = await enrichRows(res.rows)
    return NextResponse.json(enriched[0])
  }

  const sql = `SELECT p.*, s.staff_id as s_staff_id, s.name as s_name, s.surname, d.name as dept_name
    FROM payroll p
    LEFT JOIN staff s ON s.id = p.staff_id
    LEFT JOIN departments d ON d.id = s.department_id
    ORDER BY p.id DESC`
  const res = await query(sql)
  // query auto-scopes payroll via x-school-id header (p.school_id)
  // but we also had schoolId filter via scopeStatement, so already filtered
  const enriched = await enrichRows(res.rows)
  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const schoolId = getSessionSchoolId(req)
    const snake = camelToSnake(body, fieldMap)

    // support both staffId (staff.id) and staffName fallback
    let staffIdNum: number | null = null
    if (snake.staff_id !== undefined && snake.staff_id !== null && String(snake.staff_id).trim() !== "") {
      const n = parseInt(String(snake.staff_id), 10)
      staffIdNum = Number.isNaN(n) ? null : n
    }
    // fallback: lookup by staffName if staffId not provided (legacy)
    if (!staffIdNum && snake.staff_name) {
      const found = await query(`SELECT id FROM staff WHERE lower(TRIM(name)) = lower($1) ${schoolId ? "AND school_id=$2" : ""} LIMIT 1`, schoolId ? [String(snake.staff_name).trim(), schoolId] : [String(snake.staff_name).trim()])
      if (found.rows[0]) staffIdNum = Number(found.rows[0].id)
    }
    if (!staffIdNum) return NextResponse.json({ error: "Select Staff is required" }, { status: 400 })

    // verify staff exists and belongs to school
    const staffRes = await query(`SELECT s.*, d.name as dept_name FROM staff s LEFT JOIN departments d ON d.id=s.department_id WHERE s.id=$1 ${schoolId ? "AND s.school_id=$2" : ""}`, schoolId ? [staffIdNum, schoolId] : [staffIdNum])
    const st = staffRes.rows[0]
    if (!st) return NextResponse.json({ error: "Staff not found" }, { status: 404 })

    const basic = toNumber(snake.basic_salary, 0)
    const allow = toNumber(snake.allowances, 0)
    const deduct = toNumber(snake.deductions, 0)
    if (basic < 0) return NextResponse.json({ error: "Basic salary is required" }, { status: 400 })
    const net = basic + allow - deduct

    const month = String(snake.month || body.month || "").trim()
    const yearRaw = snake.year ?? body.year
    const year = yearRaw ? parseInt(String(yearRaw), 10) : null
    if (!month) return NextResponse.json({ error: "Month is required" }, { status: 400 })
    if (!year || Number.isNaN(year)) return NextResponse.json({ error: "Year is required" }, { status: 400 })

    const paymentDate = snake.payment_date || body.paymentDate || null
    const status = String(snake.status || body.status || "Pending").trim() || "Pending"

    // prevent duplicate payroll for same staff/month/year/school
    const dup = await query(`SELECT id FROM payroll WHERE staff_id=$1 AND lower(month)=lower($2) AND year=$3 ${schoolId ? "AND school_id=$4" : ""} LIMIT 1`, schoolId ? [staffIdNum, month, year, schoolId] : [staffIdNum, month, year])
    if (dup.rows.length > 0) {
      return NextResponse.json({ error: `Payroll already exists for this staff for ${month} ${year}` }, { status: 400 })
    }

    const staffName = `${st.name}${st.surname ? " " + st.surname : ""}`.trim()
    const deptName = st.dept_name || ""

    const item: any = await create(
      TABLE,
      {
        staff_id: staffIdNum,
        staff_name: staffName,
        department: deptName,
        basic_salary: basic,
        allowances: allow,
        deductions: deduct,
        net_salary: net,
        month,
        year,
        payment_date: paymentDate || null,
        status,
      } as any,
      schoolId ?? undefined
    )
    const createdRes = await query(
      `SELECT p.*, s.staff_id as s_staff_id, s.name as s_name, s.surname, d.name as dept_name FROM payroll p LEFT JOIN staff s ON s.id=p.staff_id LEFT JOIN departments d ON d.id=s.department_id WHERE p.id=$1`,
      [item.id]
    )
    const enriched = await enrichRows(createdRes.rows)
    return NextResponse.json(enriched[0], { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const schoolId = getSessionSchoolId(req)
    const snake = camelToSnake(rest, fieldMap)

    // if staff_id is being changed, verify
    if (snake.staff_id !== undefined) {
      const n = parseInt(String(snake.staff_id), 10)
      if (Number.isNaN(n)) return NextResponse.json({ error: "Invalid staff" }, { status: 400 })
      const st = await query(`SELECT id FROM staff WHERE id=$1 ${schoolId ? "AND school_id=$2" : ""}`, schoolId ? [n, schoolId] : [n])
      if (!st.rows[0]) return NextResponse.json({ error: "Staff not found" }, { status: 404 })
      snake.staff_id = n
      // also update denormalized name/dept
      const s2 = await query(`SELECT s.name, s.surname, d.name as dept_name FROM staff s LEFT JOIN departments d ON d.id=s.department_id WHERE s.id=$1`, [n])
      if (s2.rows[0]) {
        snake.staff_name = `${s2.rows[0].name}${s2.rows[0].surname ? " " + s2.rows[0].surname : ""}`.trim()
        snake.department = s2.rows[0].dept_name || ""
      }
    }

    // recalc net if any salary component changed
    if (snake.basic_salary !== undefined || snake.allowances !== undefined || snake.deductions !== undefined) {
      const cur = await query(`SELECT basic_salary, allowances, deductions FROM payroll WHERE id=$1 ${schoolId ? "AND school_id=$2" : ""}`, schoolId ? [id, schoolId] : [id])
      const curRow = cur.rows[0]
      if (!curRow) return NextResponse.json({ error: "Not found" }, { status: 404 })
      const basic = snake.basic_salary !== undefined ? toNumber(snake.basic_salary) : Number(curRow.basic_salary) || 0
      const allow = snake.allowances !== undefined ? toNumber(snake.allowances) : Number(curRow.allowances) || 0
      const deduct = snake.deductions !== undefined ? toNumber(snake.deductions) : Number(curRow.deductions) || 0
      snake.basic_salary = basic
      snake.allowances = allow
      snake.deductions = deduct
      snake.net_salary = basic + allow - deduct
    }

    if (snake.payment_date === "") snake.payment_date = null

    // clean empty
    const clean: any = {}
    for (const [k, v] of Object.entries(snake)) {
      if (v !== undefined) clean[k] = v
    }

    const item = await update(TABLE, id, clean, schoolId ?? undefined)
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
    // enrich response
    const sql = `SELECT p.*, s.staff_id as s_staff_id, s.name as s_name, s.surname, d.name as dept_name FROM payroll p LEFT JOIN staff s ON s.id=p.staff_id LEFT JOIN departments d ON d.id=s.department_id WHERE p.id=$1`
    const res = await query(sql, [id])
    const enriched = await enrichRows(res.rows)
    return NextResponse.json(enriched[0])
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const schoolId = getSessionSchoolId(req)
  await remove(TABLE, id, schoolId ?? undefined)
  return NextResponse.json({ success: true })
}
