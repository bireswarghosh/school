// Seed Class VI / VII Result Card templates + a demo record for St. Jonas Convent School.
// Reconstructed clean (no scan) design from the printed sample card layout.
// Run: node scripts/result-card-seed.cjs   (uses DATABASE_URL from .env)
const { Pool } = require("pg")
const { readFileSync } = require("fs")
const { join } = require("path")

function loadUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  try {
    const e = readFileSync(join(process.cwd(), ".env"), "utf8")
    const m = e.match(/DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/)
    if (m) return m[1].trim()
  } catch {}
  return "postgresql://postgres:123@localhost/appstrice_school"
}

const NAVY = "#1e3a8a"
const ORANGE = "#ff7732"
const DOT = "1.5px dotted #9aa3af"

function f(id, label, type, x, y, extra = {}) {
  return { id, label, type: type || "text", x, y, w: 20, h: 3.5, ...extra }
}

const coverFields = (className) => [
  { id: "band", label: "Header band", type: "text", x: 0, y: 0, w: 100, h: 15.2, value: "", bg: ORANGE },
  f("school", "School name", "text", 0, 1.4, { w: 100, h: 8, value: "ST. JONAS CONVENT SCHOOL", align: "center", bold: true, color: "#fff", size: 30 }),
  f("ls2", "Board line", "text", 0, 6.1, { w: 100, h: 3, value: "I.C.S.E (New Delhi)  |  Co-Ed. English Medium School", align: "center", color: "#fff", size: 12.5 }),
  f("ls3", "Address line", "text", 0, 8.7, { w: 100, h: 3, value: "Udang, Amta, Howrah - 711401  |  Estd. 2020", align: "center", color: "#fff", size: 11.5 }),
  f("title", "Report card title", "text", 0, 19, { w: 100, h: 8, value: "REPORT CARD", align: "center", bold: true, color: NAVY, size: 40 }),
  f("classLine", "Class line", "text", 0, 27, { w: 100, h: 5, value: `Class : ${className}`, align: "center", bold: true, color: NAVY, size: 17 }),
  f("session", "Session", "text", 0, 31.8, { w: 100, h: 3.5, value: "Session : 2025-2026", align: "center", color: "#334155", size: 14 }),
  f("fNameL", "Name label", "text", 14, 41, { w: 20, h: 3, value: "Name", bold: true, size: 14.5 }),
  f("fName", "Name", "text", 30, 40.2, { w: 47, h: 4.5, bind: "name", borderBottom: DOT, size: 14.5 }),
  f("fRollL", "Roll label", "text", 77, 41, { w: 22, h: 3, value: "Roll No.", bold: true, size: 14.5 }),
  f("fRoll", "Roll No", "text", 89.4, 40.2, { w: 10, h: 4.5, bind: "rollNo", borderBottom: DOT, size: 14.5 }),
  f("fClassL", "Class label", "text", 14, 48.5, { w: 20, h: 3, value: "Class", bold: true, size: 14.5 }),
  f("fClass", "Class", "text", 30, 47.7, { w: 47, h: 4.5, bind: "class", borderBottom: DOT, size: 14.5 }),
  f("fMotherL", "Mother label", "text", 14, 55.5, { w: 26, h: 3, value: "Mother's Name", bold: true, size: 14.5 }),
  f("fMother", "Mother Name", "text", 37, 54.7, { w: 53, h: 4.5, bind: "motherName", borderBottom: DOT, size: 14.5 }),
  f("fFatherL", "Father label", "text", 14, 62, { w: 26, h: 3, value: "Father's Name", bold: true, size: 14.5 }),
  f("fFather", "Father Name", "text", 37, 61.2, { w: 53, h: 4.5, bind: "fatherName", borderBottom: DOT, size: 14.5 }),
  f("motto", "Motto", "text", 0, 88.5, { w: 100, h: 4, value: "— The future begins here —", align: "center", italic: true, color: "#334155", size: 15 }),
  f("sigCT", "Class teacher sig", "text", 7, 95.5, { w: 26, h: 4, value: "Class Teacher's Signature", align: "center", size: 12.5, border: "1.5px solid #334155" }),
  f("sigPr", "Principal sig", "text", 37, 95.5, { w: 26, h: 4, value: "Principal's Signature", align: "center", size: 12.5, border: "1.5px solid #334155" }),
  f("sigGu", "Guardian sig", "text", 67, 95.5, { w: 26, h: 4, value: "Guardian's Signature", align: "center", size: 12.5, border: "1.5px solid #334155" }),
]

const MARK_COL = (id, label, sub, type, extra = {}) => ({ id, label, sub, type, width: extra.width || 48, ...extra })

function marksTable() {
  return {
    id: "marks",
    label: "Academic Performance (marks)",
    x: 4,
    y: 9,
    w: 697,
    h: 430,
    fontSize: 11,
    rowsKey: "marks",
    headerGroups: [
      { label: "TERM - I", span: 3 },
      { label: "TERM - II", span: 4 },
      { label: "OVERALL", span: 3 },
    ],
    cols: [
      MARK_COL("subject", "SUBJECT", "", "text", { width: 200 }),
      MARK_COL("u1", "Unit Test", "20", "mark"),
      MARK_COL("m1", "Mid Term", "80", "mark"),
      MARK_COL("t1", "Total", "100", "sum", { of: ["u1", "m1"], width: 52 }),
      MARK_COL("u2", "Unit Test", "20", "mark"),
      MARK_COL("m2", "Mid Term", "80", "mark"),
      MARK_COL("fin", "Final", "100", "mark", { width: 52 }),
      MARK_COL("over", "Grand Total", "200", "sum", { of: ["t1", "fin"], width: 52 }),
      MARK_COL("pct", "Percentage", "", "percent", { of: ["t1", "fin"], max: 200 }),
      MARK_COL("grade", "Grade", "", "grade", { of: ["pct"], width: 52 }),
    ],
  }
}

const PERSONALITY_ROWS = [
  "Art & Craft", "Dance", "Music", "Martial Arts", "Yoga", "Sports",
  "Regularity & Punctuality", "Sharing and Caring", "Initiative",
  "Neatness", "Care of belongings", "Confidence", "Courteousness",
]

function personalityPage() {
  return {
    id: "personality",
    label: "Personality Development",
    image: "",
    width: 794,
    height: 1123,
    fields: [
      f("title", "Title", "text", 0, 2, { w: 100, h: 5, value: "PERSONALITY DEVELOPMENT", align: "center", bold: true, color: NAVY, size: 20 }),
      f("attL", "Attendance label", "text", 14, 55, { w: 24, h: 3, value: "Attendance", bold: true, size: 14.5 }),
      f("att", "Attendance", "text", 30, 54.2, { w: 16, h: 4.5, bind: "attendance", borderBottom: DOT, size: 14 }),
      f("dpL", "Days present label", "text", 50, 55, { w: 18, h: 3, value: "Days Present", size: 13 }),
      f("dp", "Days present", "text", 66, 54.2, { w: 10, h: 4.5, bind: "daysPresent", borderBottom: DOT, size: 14 }),
      f("evL", "Activities label", "text", 14, 63, { w: 32, h: 3, value: "Co-curricular Activities", bold: true, size: 14.5 }),
      f("ev", "Activities", "text", 14, 67.5, { w: 72, h: 9, bind: "events", borderBottom: DOT, size: 13 }),
    ],
    tables: [
      {
        id: "pdc",
        label: "Personality Development",
        x: 12,
        y: 9,
        w: 602,
        h: 430,
        fontSize: 11,
        rowsKey: "personality",
        cols: [
          { id: "criterion", label: "Criteria", sub: "", type: "text", width: 400 },
          { id: "termI", label: "Term - I", sub: "", type: "text", width: 101 },
          { id: "termII", label: "Term - II", sub: "", type: "text", width: 101 },
        ],
      },
    ],
  }
}

const GRADE_SCALE = [
  { label: "A+", min: 91, max: 100, remark: "Outstanding" },
  { label: "A", min: 81, max: 90, remark: "Excellent" },
  { label: "B+", min: 71, max: 80, remark: "Very Good" },
  { label: "B", min: 61, max: 70, remark: "Good" },
  { label: "C+", min: 51, max: 60, remark: "Average" },
  { label: "C", min: 40, max: 50, remark: "Below Average" },
  { label: "Below", min: 0, max: 39, remark: "Needs Improvement" },
]

function keyPage(promotionClass) {
  return {
    id: "key",
    label: "Key to Grades & Remarks",
    image: "",
    width: 794,
    height: 1123,
    fields: [
      f("title", "Title", "text", 0, 2, { w: 100, h: 5, value: "KEY TO GRADES & REMARKS", align: "center", bold: true, color: NAVY, size: 20 }),
      f("keyText", "Grade key", "text", 24, 8, {
        w: 52, h: 12, value:
          "A+  :   91 - 100        Outstanding\nA   :   81 - 90         Excellent\nB+  :   71 - 80         Very Good\nB   :   61 - 70         Good\nC+  :   51 - 60         Average\nC   :   40 - 50         Below Average\n        Below 40        Needs Improvement",
        size: 13.5,
      }),
      f("remL", "Remarks label", "text", 14, 25, { w: 28, h: 3, value: "Class Teacher's Remarks", bold: true, size: 15 }),
      f("rem", "Remarks", "text", 14, 30, { w: 72, h: 6, bind: "remarks", borderBottom: DOT, size: 14 }),
      f("finL", "Final result label", "text", 14, 40, { w: 20, h: 3, value: "Final Result", bold: true, size: 15 }),
      f("fin", "Final result", "text", 29, 39.2, { w: 34, h: 4.5, bind: "finalResult", borderBottom: DOT, size: 14 }),
      f("prL", "Promotion label", "text", 14, 48, { w: 30, h: 3, value: `Promotion to Class - ${promotionClass}`, bold: true, size: 15 }),
      f("pr", "Promotion", "text", 45, 47.2, { w: 38, h: 4.5, bind: "promotion", borderBottom: DOT, size: 14 }),
      f("sigCT", "Class teacher sig", "text", 7, 74, { w: 26, h: 4, value: "Class Teacher's Signature", align: "center", size: 12.5, border: "1.5px solid #334155" }),
      f("sigPr", "Principal sig", "text", 37, 74, { w: 26, h: 4, value: "Principal's Signature", align: "center", size: 12.5, border: "1.5px solid #334155" }),
      f("sigGu", "Guardian sig", "text", 67, 74, { w: 26, h: 4, value: "Guardian's Signature", align: "center", size: 12.5, border: "1.5px solid #334155" }),
      f("footer", "Footer", "text", 0, 95.5, {
        w: 100, h: 4, value: "St. Jonas Convent School  •  Udang, Amta, Howrah - 711401  •  stjonasconventschool@gmail.com  •  Ph: 9083916403 / 7602146523",
        align: "center", color: "#475569", size: 10.5,
      }),
    ],
  }
}

function buildTemplate(className, promotionClass, key) {
  return {
    school_id: 1,
    name: `Class ${className} Result Card (2025-26)`,
    class_id: className === "VI" ? 23 : 24,
    session: "2025-2026",
    template_key: key,
    is_active: true,
    grade_scale: GRADE_SCALE,
    pages: [
      { id: "cover", label: "Cover", image: "", width: 794, height: 1123, fields: coverFields(className) },
      {
        id: "marks",
        label: "Academic Performance",
        image: "",
        width: 794,
        height: 1123,
        fields: [
          f("title", "Title", "text", 0, 2, { w: 100, h: 5, value: "ACADEMIC PERFORMANCE", align: "center", bold: true, color: NAVY, size: 20 }),
          f("subtitle", "Subtitle", "text", 0, 5.4, { w: 100, h: 3, value: "(for the Academic Year 2025-2026)", align: "center", color: "#475569", size: 12.5 }),
        ],
        tables: [marksTable()],
      },
      personalityPage(),
      keyPage(promotionClass),
    ],
  }
}

const SUBJECTS = [
  "English", "English Literature", "English Language", "2nd Language (Hindi)", "3rd Language (Bengali)",
  "Mathematics", "Science", "Physics", "Chemistry", "Biology", "Social Studies", "History & Civics",
  "Geography", "Computer Science",
]

const DEMO_MARKS = [
  [19, 76], [18, 72], [18, 74], [18, 75], [17, 70], [20, 80], [18, 72],
  [16, 70], [16, 72], [18, 74], [15, 68], [15, 64], [16, 67], [20, 80],
].map(([u, m], i) => ({
  subject: SUBJECTS[i],
  u1: u,
  m1: m,
  u2: Math.max(15, u - 2),
  m2: Math.max(60, m - 6),
  fin: Math.round(m * 1.15 + 8),
}))

const DEMO_PERSONALITY = [
  "Art & Craft", "Dance", "Music", "Martial Arts", "Yoga", "Sports",
  "Regularity & Punctuality", "Sharing and Caring", "Initiative",
  "Neatness", "Care of belongings", "Confidence", "Courteousness",
].map((c) => ({ criterion: c, termI: c.includes("Confidence") || c.includes("Courteous") ? "A" : "A+", termII: "A+" }))

const DEMO_META = {
  name: "Mihir Mondal",
  rollNo: "04",
  class: "VI",
  session: "2025-2026",
  motherName: "Mrs. Ayesha Mondal",
  fatherName: "Mr. Abdul Mondal",
  remarks: "An intelligent and sincere student. Keep it up.",
  finalResult: "Passed",
  promotion: "Granted",
  attendance: "104",
  daysPresent: "102",
  events: "Annual Function, Children's Day, Rabindra Jayanti, Christmas Celebration",
}

async function main() {
  const pool = new Pool({ connectionString: loadUrl() })
  const q = (t, p) => pool.query(t, p)
  try {
    const templates = [
      buildTemplate("VI", "VII", "class6_2025"),
      buildTemplate("VII", "VIII", "class7_2025"),
    ]
    const ids = {}
    for (const t of templates) {
      const existing = await q("SELECT id FROM result_card_templates WHERE school_id = $1 AND template_key = $2", [t.school_id, t.template_key])
      let id
      if (existing.rows.length) {
        await q(
          `UPDATE result_card_templates SET name=$1, class_id=$2, session=$3, pages=$4::jsonb, grade_scale=$5::jsonb, is_active=TRUE, updated_at=NOW() WHERE id=$6`,
          [t.name, t.class_id, t.session, JSON.stringify(t.pages), JSON.stringify(t.grade_scale), existing.rows[0].id]
        )
        id = existing.rows[0].id
        console.log("updated template", t.template_key, "->", id)
      } else {
        const ins = await q(
          `INSERT INTO result_card_templates (school_id, name, class_id, session, pages, grade_scale, template_key, is_active)
           VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,TRUE) RETURNING id`,
          [t.school_id, t.name, t.class_id, t.session, JSON.stringify(t.pages), JSON.stringify(t.grade_scale), t.template_key]
        )
        id = ins.rows[0].id
        console.log("created template", t.template_key, "->", id)
      }
      ids[t.template_key] = id
    }

    // demo record for Class VI template (student_id NULL = manual entry)
    const viKey = "class6_2025"
    const existingDemo = await q(
      "SELECT id FROM result_card_records WHERE school_id=1 AND template_id=$1 AND data->'__meta'->>'name' LIKE '%Mihir%'",
      [ids[viKey]]
    )
    const recordData = {
      __meta: DEMO_META,
      cover: {},
      marks: { marks: DEMO_MARKS },
      personality: { personality: DEMO_PERSONALITY },
      key: {},
    }
    if (existingDemo.rows.length) {
      await q("UPDATE result_card_records SET data=$2::jsonb, session='2025-2026', updated_at=NOW() WHERE id=$1", [existingDemo.rows[0].id, JSON.stringify(recordData)])
      console.log("updated demo record", existingDemo.rows[0].id)
    } else {
      const ins = await q(
        "INSERT INTO result_card_records (school_id, template_id, student_id, session, data) VALUES (1,$1,NULL,'2025-2026',$2::jsonb) RETURNING id",
        [ids[viKey], JSON.stringify(recordData)]
      )
      console.log("created demo record", ins.rows[0].id)
    }
  } finally {
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})