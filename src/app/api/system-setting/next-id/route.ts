import { NextRequest, NextResponse } from "next/server"
import { getSessionSchoolId } from "@/lib/auth"
import { nextAutoId } from "@/lib/id-generation"

// Used by the student admission form to fetch the server-generated admission
// number according to the ID auto generation settings.
export async function GET(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    const admissionNo = await nextAutoId("student", schoolId, "admission_no")
    return NextResponse.json({ admissionNo })
  } catch (e) {
    return NextResponse.json({ admissionNo: null, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}