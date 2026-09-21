export function formatDobPassword(dob: string | Date): string {
  if (dob instanceof Date) {
    if (isNaN(dob.getTime())) return ""
    return `${String(dob.getDate()).padStart(2, "0")}${String(dob.getMonth() + 1).padStart(2, "0")}${String(dob.getFullYear()).padStart(4, "0")}`
  }
  const raw = String(dob || "").trim()
  if (!raw) return ""
  let d = ""
  let m = ""
  let y = ""
  let iso = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (iso) {
    y = iso[1]
    m = iso[2]
    d = iso[3]
  } else {
    const dmy = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/)
    if (dmy) {
      d = dmy[1]
      m = dmy[2]
      y = dmy[3]
    }
  }
  if (!y) {
    const t = new Date(raw)
    if (!isNaN(t.getTime())) {
      d = String(t.getDate())
      m = String(t.getMonth() + 1)
      y = String(t.getFullYear())
    }
  }
  if (!y) return ""
  return `${d.padStart(2, "0")}${m.padStart(2, "0")}${y.padStart(4, "0")}`
}

export function studentPasswordFrom(firstName: string, dob: string | Date): string {
  const name = String(firstName || "").trim()
  const dobPart = formatDobPassword(dob)
  if (!name || !dobPart) return ""
  const first = name.charAt(0).toUpperCase()
  const second = name.length > 1 ? name.charAt(1).toLowerCase() : "x"
  return `${first}${second}${dobPart}`
}