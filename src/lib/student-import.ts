// Shared logic for the Import Student (CSV) feature on the
// student-admission and student-details pages.

export const importColumnMap: Record<string, string> = {
  "admission_no": "admissionNo",
  "Admission No": "admissionNo",
  "Admission No.": "admissionNo",
  "roll_no": "rollNo",
  "Roll No": "rollNo",
  "Roll No.": "rollNo",
  "first_name": "firstName",
  "First Name": "firstName",
  "middlename": "middleName",
  "middle_name": "middleName",
  "Middle Name": "middleName",
  "last_name": "lastName",
  "Last Name": "lastName",
  "Class": "class",
  "class": "class",
  "Section": "section",
  "section": "section",
  "gender": "gender",
  "Gender": "gender",
  "date_of_birth": "dob",
  "DOB": "dob",
  "Date of Birth": "dob",
  "category": "category",
  "Category": "category",
  "religion": "religion",
  "Religion": "religion",
  "caste": "caste",
  "Caste": "caste",
  "mobile_no": "mobile",
  "Mobile": "mobile",
  "Phone": "mobile",
  "Mobile Number": "mobile",
  "email": "email",
  "Email": "email",
  "admission_date": "admissionDate",
  "Admission Date": "admissionDate",
  "blood_group": "bloodGroup",
  "Blood Group": "bloodGroup",
  "student_house": "house",
  "House": "house",
  "house": "house",
  "height": "height",
  "Height": "height",
  "weight": "weight",
  "Weight": "weight",
  "measurement_date": "measurementDate",
  "Measurement Date": "measurementDate",
  "father_name": "fatherName",
  "Father Name": "fatherName",
  "father_phone": "fatherPhone",
  "Father Phone": "fatherPhone",
  "father_occupation": "fatherOccupation",
  "Father Occupation": "fatherOccupation",
  "mother_name": "motherName",
  "Mother Name": "motherName",
  "mother_phone": "motherPhone",
  "Mother Phone": "motherPhone",
  "mother_occupation": "motherOccupation",
  "Mother Occupation": "motherOccupation",
  "guardian_is": "guardianIs",
  "Guardian Is": "guardianIs",
  "guardian_name": "guardianName",
  "Guardian Name": "guardianName",
  "guardian_relation": "guardianRelation",
  "Guardian Relation": "guardianRelation",
  "guardian_email": "guardianEmail",
  "Guardian Email": "guardianEmail",
  "guardian_phone": "guardianPhone",
  "Guardian Phone": "guardianPhone",
  "guardian_occupation": "guardianOccupation",
  "Guardian Occupation": "guardianOccupation",
  "guardian_address": "guardianAddress",
  "Guardian Address": "guardianAddress",
  "current_address": "currentAddress",
  "Current Address": "currentAddress",
  "permanent_address": "permanentAddress",
  "Permanent Address": "permanentAddress",
  "bank_account_no": "bankAccount",
  "Bank Account Number": "bankAccount",
  "bank_name": "bankName",
  "Bank Name": "bankName",
  "ifsc_code": "ifscCode",
  "IFSC Code": "ifscCode",
  "national_identification_no": "nationalId",
  "National Identification Number": "nationalId",
  "local_identification_no": "localId",
  "Local Identification Number": "localId",
  "rte": "rte",
  "RTE": "rte",
  "previous_school": "previousSchool",
  "Previous School": "previousSchool",
  "note": "note",
  "Note": "note",
  "Address": "address",
}

export const importHeaders = ["admission_no", "roll_no", "first_name", "middlename", "last_name", "gender", "date_of_birth", "category", "religion", "caste", "mobile_no", "email", "admission_date", "blood_group", "student_house", "height", "weight", "measurement_date", "father_name", "father_phone", "father_occupation", "mother_name", "mother_phone", "mother_occupation", "guardian_is", "guardian_name", "guardian_relation", "guardian_email", "guardian_phone", "guardian_occupation", "guardian_address", "current_address", "permanent_address", "bank_account_no", "bank_name", "ifsc_code", "national_identification_no", "local_identification_no", "rte", "previous_school", "note"]

export function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++ } else { inQuotes = false }
      } else cur += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      row.push(cur); cur = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(cur); cur = ""
      if (row.some((c) => c.trim() !== "")) rows.push(row)
      row = []
    } else cur += ch
  }
  row.push(cur)
  if (row.some((c) => c.trim() !== "")) rows.push(row)
  return rows
}

export function normalizeImportDate(v: string | undefined): string {
  const s = (v || "").trim()
  if (!s) return ""
  // ISO: 2021-12-27 or 2021/12/27
  let m = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/)
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`
  // MM/DD/YYYY or DD/MM/YYYY (slash or dash separated)
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    const year = m[3]
    if (a > 12) return `${year}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` // DD/MM/YYYY
    if (b > 12) return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` // MM/DD/YYYY
    return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` // ambiguous → treat as MM/DD/YYYY
  }
  return ""
}

export function downloadSampleCSV() {
  const sample = [["19001", "201", "Edward", "", "Thomas", "Male", "11/3/2014", "", "", "", "8233366613", "thomas@gmail.com", "3/18/2021", "A", "", "4'2", "34 kg", "", "Olivier Thomas", "98654646", "Lawyer", "Caroline Thomas", "6598656", "Teacher", "Father", "Olivier Thomas", "Father", "", "98654646", "Lawyer", "West Brooklyn", "West Brooklyn", "West Brooklyn", "68654", "UBS Bank", "UBS5644", "46464746", "446464", "", "", ""]]
  const esc = (v: string) => `"${(v || "").replace(/"/g, '""')}"`
  const csv = [importHeaders.map(esc).join(","), ...sample.map((r) => r.map(esc).join(","))].join("\n")
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "student_import_sample.csv"; a.click()
}

export function blankImportRow(): Record<string, string> {
  const blank: Record<string, string> = {}
  importHeaders.forEach((h) => { blank[importColumnMap[h]] = "" })
  return blank
}

export function parseImportFile(text: string): { preview: Record<string, string>[]; error?: string } {
  const rows = parseCSV(text)
  if (rows.length < 2) return { preview: [], error: "CSV must contain a header row and at least one data row" }
  const headers = rows[0].map((h) => h.trim().replace(/^"|"$/g, "")).map((h) => importColumnMap[h] || h)
  const preview = rows.slice(1).map((vals) => {
    const rec: Record<string, string> = {}
    headers.forEach((key, idx) => { rec[key] = (vals[idx] || "").trim() })
    return rec
  })
  return { preview }
}

export function buildStudentImportPayload(rows: Record<string, string>[]) {
  return rows.map((r) => ({
    admissionNo: r.admissionNo || "",
    rollNo: r.rollNo || "",
    firstName: r.firstName || "",
    middleName: r.middleName || "",
    lastName: r.lastName || "",
    class: r.class || "",
    section: r.section || "",
    gender: r.gender || "",
    dob: normalizeImportDate(r.dob),
    category: r.category || "",
    religion: r.religion || "",
    caste: r.caste || "",
    mobile: r.mobile || "",
    email: r.email || "",
    admissionDate: normalizeImportDate(r.admissionDate),
    bloodGroup: r.bloodGroup || "",
    house: r.house || "",
    height: r.height || "",
    weight: r.weight || "",
    measurementDate: normalizeImportDate(r.measurementDate),
    fatherName: r.fatherName || "",
    fatherPhone: r.fatherPhone || "",
    fatherOccupation: r.fatherOccupation || "",
    motherName: r.motherName || "",
    motherPhone: r.motherPhone || "",
    motherOccupation: r.motherOccupation || "",
    guardianIs: r.guardianIs || "",
    guardianName: r.guardianName || "",
    guardianRelation: r.guardianRelation || "",
    guardianEmail: r.guardianEmail || "",
    guardianPhone: r.guardianPhone || "",
    guardianOccupation: r.guardianOccupation || "",
    guardianAddress: r.guardianAddress || "",
    currentAddress: r.currentAddress || "",
    permanentAddress: r.permanentAddress || "",
    bankAccount: r.bankAccount || "",
    bankName: r.bankName || "",
    ifscCode: r.ifscCode || "",
    nationalId: r.nationalId || "",
    localId: r.localId || "",
    rte: r.rte || "",
    address: r.address || "",
    previousSchool: r.previousSchool || "",
    note: r.note || "",
  }))
}