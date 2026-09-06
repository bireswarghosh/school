import { query } from "@/lib/db"

// Shared resolver for school identity + branding used on printed documents
// (bills, invoices, payment receipts, results, marksheets). Values come from
// General Settings ("general.schoolName" etc.) with the `schools` table as fallback,
// plus the Appearance logo ("logo.printLogo").
export type SchoolDocInfo = {
  name: string
  tagline: string
  address: string
  phone: string
  email: string
  website: string
  session: string
  logo: string | null // /api/files/... or "/" suffixed path
}

export async function getSchoolDocInfo(schoolId: number | null | undefined): Promise<SchoolDocInfo> {
  const empty: SchoolDocInfo = {
    name: "Smart School",
    tagline: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    session: "",
    logo: null,
  }
  if (!schoolId) return empty

  try {
    const [settingsRes, schoolRes] = await Promise.all([
      query(
        `SELECT key, value FROM school_settings
         WHERE school_id = $1 AND (key LIKE 'general.%' OR key = 'logo.printLogo')`,
        [schoolId]
      ),
      query(`SELECT name, tagline, address, phone, email FROM schools WHERE id = $1`, [schoolId]),
    ])

    const s: Record<string, string> = {}
    for (const row of settingsRes.rows) s[row.key] = row.value

    const school = schoolRes.rows[0] || {}

    const u = (v: string | null | undefined) => (v && !v.startsWith("/") && !/^https?:\/\//.test(v) ? "/" + v.replace(/^\//, "") : v || "")

    return {
      name: s["general.schoolName"] || school.name || "Smart School",
      tagline: school.tagline || "",
      address: s["general.address"] || school.address || "",
      phone: s["general.phone"] || school.phone || "",
      email: s["general.email"] || school.email || "",
      website: s["general.website"] || "",
      session: s["general.session"] || "",
      logo: s["logo.printLogo"] ? u(s["logo.printLogo"]) : null,
    }
  } catch {
    return empty
  }
}