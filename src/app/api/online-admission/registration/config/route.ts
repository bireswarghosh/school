import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { razorpayConfigured } from "@/lib/razorpay"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const ENQUIRY_FEE = 1000

async function resolveSchool(code?: string | null) {
  const c = String(code || "DEFAULT").trim()
  const r = await query(`SELECT id, code, name FROM schools WHERE lower(code) = lower($1) LIMIT 1`, [c])
  return r.rows[0] as { id: number; code: string; name: string } | undefined
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")
    const school = await resolveSchool(code)
    if (!school) return NextResponse.json({ error: "Invalid school code" }, { status: 404 })

    const classesRes = await query(`SELECT id, name FROM classes WHERE school_id = $1 ORDER BY id`, [school.id])
    const classes = (classesRes.rows as { id: number; name: string }[]).map((c) => c.name)

    const razorpayAvailable = await razorpayConfigured()

    const classMap = new Map<number, string>(classesRes.rows.map((c) => [c.id, c.name]))

    let enquiry = null
    const eid = parseInt(searchParams.get("eid") || "0", 10)
    if (eid > 0) {
      const e = (
        await query(`SELECT * FROM admission_enquiries WHERE id = $1 AND school_id = $2`, [eid, school.id])
      ).rows[0]
      if (e) {
        enquiry = {
          name: e.name,
          phone: e.phone,
          email: e.email,
          classVal: e.class_id ? classMap.get(Number(e.class_id)) || "" : "",
          address: e.address,
          description: e.description,
        }
      }
    }

    return NextResponse.json({
      school: { code: school.code, name: school.name },
      amount: ENQUIRY_FEE,
      currency: "INR",
      razorpayAvailable,
      classes,
      enquiry,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}