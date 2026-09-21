"use client"

import { useSchoolInfo } from "@/lib/use-school-info"
import { DEFAULT_MIDDLE_CONFIG, MiddleSchoolConfig } from "@/lib/middle-config"

export type MiddleData = Record<string, string>

export const MIDDLE_DEFAULT: MiddleData = {
  name: "TANISHA BAG",
  class: "VII",
  rollNo: "11",
  motherName: "SASWATI BAG",
  fatherName: "KR. BAG",
  session: "2025-2026",
  // English Language
  eng_lang_ut1: "17",
  eng_lang_mid1: "71",
  eng_lang_total1: "88 A",
  eng_lang_ut2: "18",
  eng_lang_mid2: "79 B+",
  eng_lang_total2: "167",
  eng_lang_total200: "-",
  eng_lang_overall: "84% (A)",
  // Literature
  eng_lit_ut1: "20",
  eng_lit_mid1: "68",
  eng_lit_total1: "88 A",
  eng_lit_ut2: "18",
  eng_lit_mid2: "91 A+",
  eng_lit_total2: "179",
  eng_lit_total200: "-",
  eng_lit_overall: "90% (A)",
  // 2nd Lang
  lang2_ut1: "18",
  lang2_mid1: "70",
  lang2_total1: "88 A",
  lang2_ut2: "15",
  lang2_mid2: "85 A",
  lang2_total2: "173",
  lang2_total200: "-",
  lang2_overall: "87% (A)",
  // 3rd Lang
  lang3_ut1: "18",
  lang3_mid1: "72",
  lang3_total1: "90 A",
  lang3_ut2: "18",
  lang3_mid2: "88 A",
  lang3_total2: "178",
  lang3_total200: "-",
  lang3_overall: "89% (A)",
  // Maths
  maths_ut1: "19",
  maths_mid1: "75",
  maths_total1: "94 A+",
  maths_ut2: "18",
  maths_mid2: "89 A",
  maths_total2: "183",
  maths_total200: "-",
  maths_overall: "92% (A+)",
  // Physics
  phy_ut1: "19",
  phy_mid1: "74",
  phy_total1: "93 A+",
  phy_ut2: "18",
  phy_mid2: "92 A+",
  phy_total2: "185",
  phy_total200: "-",
  phy_overall: "93% (A+)",
  // Chemistry
  chem_ut1: "20",
  chem_mid1: "70",
  chem_total1: "90 A",
  chem_ut2: "18",
  chem_mid2: "89 A",
  chem_total2: "179",
  chem_total200: "-",
  chem_overall: "90% (A)",
  // Biology
  bio_ut1: "18",
  bio_mid1: "72",
  bio_total1: "90 A",
  bio_ut2: "18",
  bio_mid2: "96 A+",
  bio_total2: "186",
  bio_total200: "-",
  bio_overall: "93% (A+)",
  // History
  hist_ut1: "20",
  hist_mid1: "65",
  hist_total1: "85 A",
  hist_ut2: "17",
  hist_mid2: "86 A",
  hist_total2: "171",
  hist_total200: "-",
  hist_overall: "86% (A)",
  // Geography
  geo_ut1: "19",
  geo_mid1: "74",
  geo_total1: "93 A+",
  geo_ut2: "17",
  geo_mid2: "83 A",
  geo_total2: "176",
  geo_total200: "-",
  geo_overall: "88% (A)",
  // Computer
  comp_ut1: "20",
  comp_mid1: "74",
  comp_total1: "94 A+",
  comp_ut2: "20",
  comp_mid2: "96 A+",
  comp_total2: "190",
  comp_total200: "-",
  comp_overall: "95% (A+)",
  overallPercent: "89.4% (A)",
  // Personality
  courteous_t1: "A+",
  courteous_t2: "A+",
  confidence_t1: "A+",
  confidence_t2: "A+",
  care_t1: "A+",
  care_t2: "A+",
  neatness_t1: "A+",
  neatness_t2: "A+",
  regularity_t1: "A+",
  regularity_t2: "A",
  // Co-curricular
  sports_t1: "A",
  sports_t2: "A",
  yoga_t1: "A",
  yoga_t2: "A",
  martial_t1: "A",
  martial_t2: "A+",
  music_t1: "A+",
  music_t2: "A+",
  dance_t1: "A+",
  dance_t2: "A+",
  // Regularity
  working_t1: "104",
  working_t2: "102",
  present_t1: "103",
  present_t2: "93",
  attendance_t1: "99%",
  attendance_t2: "91%",
  // Remarks
  remark1: "Tanisha is a pleasure to have in class. But she lacks interest in History. Her academic performance is outstanding.",
  remark2: "Tanisha is very inattentive in classroom discussion. She needs to be more patient. Her academic performance is brilliant.",
  finalClass: "VIII",
  finalGranted: "Granted",
  teacherName: "Tithi Bera Barui",
  principalName: "",
  guardianName: "",
}

export default function MiddleSchoolFormatCard({
  data,
  onChange,
  editable = true,
  config,
}: {
  data: MiddleData
  onChange?: (key: string, value: string) => void
  editable?: boolean
  config?: MiddleSchoolConfig
}) {
  const cfg = config || DEFAULT_MIDDLE_CONFIG
  const { info: schoolInfo } = useSchoolInfo()
  const logoSrc = schoolInfo.logoSrc || ""

  const cell = (k: string) =>
    editable ? (
      <input
        value={data[k] ?? ""}
        onChange={(e) => onChange?.(k, e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", border: "1px solid transparent", background: "transparent", textAlign: "center", fontFamily: "inherit", fontSize: 12, padding: "4px 2px", color: "#111" }}
      />
    ) : (
      <span style={{ fontSize: 12, color: "#111" }}>{data[k] ?? ""}</span>
    )

  return (
    <div className="middle-root">
      <style>{`
        .middle-root .report-card {
          max-width: 900px;
          background: #fff;
          margin: auto;
          padding: 30px;
          box-shadow: 0 0 15px rgba(0,0,0,0.2);
        }
        .middle-root .header {
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .middle-root .header-left {
          flex: 0 0 150px;
          text-align: center;
          border-right: 1px solid #e5e7eb;
          padding-right: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .middle-root .header-right { flex: 1; text-align: center; }
        .middle-root .header-right h1 { margin: 4px 0; font-size: 24px; font-family: "Times New Roman", serif; font-weight: 700; }
        .middle-root .header-right h3 { margin: 2px 0; font-weight: normal; font-size: 11px; font-style: italic; }
        .middle-root .header-right h4 { margin: 2px 0; font-size: 12px; }
        .middle-root .header-right h2 { margin: 6px 0 4px; text-decoration: underline; font-size: 18px; font-weight: 700; }
        .middle-root .student-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: bold;
        }
        .middle-root .info-group { display: flex; align-items: center; }
        .middle-root .info-group label { font-weight: bold; margin-right: 10px; white-space: nowrap; font-size: 13px; }
        .middle-root .info-group input {
          flex-grow: 1;
          border: none;
          border-bottom: 1px dashed #000;
          font-size: 14px;
          padding: 2px 5px;
          font-weight: bold;
          background: transparent;
        }
        .middle-root table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
        .middle-root th, .middle-root td { border: 1px solid #000; padding: 4px; text-align: center; vertical-align: middle; }
        .middle-root th { background-color: #f9f9f9; font-weight: bold; font-size: 11px; }
        .middle-root .text-left { text-align: left; padding-left: 6px; }
        .middle-root td input { width: 100%; boxSizing: border-box; border: 1px solid transparent; background: transparent; text-align: center; font-family: inherit; font-size: 12px; padding: 4px; color: #111; }
        .middle-root .text-left input { text-align: left; }
        .middle-root td input:focus, .middle-root .info-group input:focus { outline: none; border: 1px solid #007bff !important; background-color: #f0f8ff !important; }
        .middle-root .flex-tables { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 20px; }
        .middle-root .flex-tables > div { flex: 1; }
        .middle-root .remarks-section { margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 15px; }
        .middle-root .remarks-section p { display: flex; align-items: flex-start; gap: 10px; margin: 10px 0; font-size: 13px; }
        .middle-root .remarks-section input { flex-grow: 1; border: none; border-bottom: 1px solid #000; margin-left: 10px; font-family: inherit; background: transparent; padding: 2px 4px; }
        .middle-root .signatures { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; font-size: 12px; font-weight: bold; }
        .middle-root .signatures div { border-top: 1px solid #000; width: 25%; padding-top: 5px; }
        .middle-root .signatures input { border: none; text-align: center; font-family: cursive; background: transparent; width: 100%; font-weight: bold; }
        @media print {
          .middle-root .report-card { box-shadow: none; margin: 0; padding: 20px; }
          .middle-root td input, .middle-root .info-group input { border: 1px solid transparent !important; }
        }
      `}</style>

      <div className="report-card">
        <div className="header">
          <div className="header-left">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="logo" style={{ maxHeight: 85, maxWidth: 120, objectFit: "contain", marginBottom: 6 }} />
            ) : (
              <div style={{ height: 85, width: 90, border: "1px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#9ca3af", marginBottom: 6 }}>Logo</div>
            )}
            <div style={{ fontSize: 11, fontStyle: "italic", marginTop: 4 }}>&quot;{cfg.header.tagline}&quot;</div>
            <div style={{ fontSize: 10, color: "#374151" }}>{cfg.header.estd}</div>
          </div>
          <div className="header-right">
            <h1>{cfg.header.schoolName}</h1>
            <h3>{cfg.header.board}</h3>
            <h2>{cfg.header.title}</h2>
            <h4>{cfg.header.subtitle} &nbsp;&nbsp;&nbsp; Session: {editable ? <input value={data.session ?? ""} onChange={(e) => onChange?.("session", e.target.value)} style={{ width: 80, border: "none", borderBottom: "1px dashed #000", fontSize: "inherit", fontWeight: "bold", textAlign: "center", background: "transparent" }} /> : <span style={{ borderBottom: "1px dashed #000", padding: "0 6px" }}>{data.session ?? ""}</span>}</h4>
          </div>
        </div>

        <div className="student-info">
          <div className="info-group">
            <label>Name:</label>
            {editable ? <input value={data.name ?? ""} onChange={(e) => onChange?.("name", e.target.value)} /> : <span style={{ flexGrow: 1, borderBottom: "1px dashed #000", padding: "2px 5px", fontWeight: 700 }}>{data.name ?? ""}</span>}
          </div>
          <div className="info-group" style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", flex: "1 1 0", minWidth: 0, alignItems: "center" }}>
              <label style={{ marginRight: 4, fontSize: 13 }}>Class:</label>
              {editable ? <input value={data.class ?? ""} onChange={(e) => onChange?.("class", e.target.value)} style={{ flex: "1 1 0", minWidth: 0, fontSize: 13, padding: "2px 4px", textAlign: "center" }} /> : <span style={{ flex: "1 1 0", borderBottom: "1px dashed #000", padding: "2px 4px", fontWeight: 700, fontSize: 13, textAlign: "center" as const }}>{data.class ?? ""}</span>}
            </div>
            <div style={{ display: "flex", flex: "1 1 0", minWidth: 0, alignItems: "center" }}>
              <label style={{ marginRight: 4, fontSize: 13 }}>Roll No.:</label>
              {editable ? <input value={data.rollNo ?? ""} onChange={(e) => onChange?.("rollNo", e.target.value)} style={{ flex: "1 1 0", minWidth: 0, fontSize: 13, padding: "2px 4px", textAlign: "center" }} /> : <span style={{ flex: "1 1 0", borderBottom: "1px dashed #000", padding: "2px 4px", fontWeight: 700, fontSize: 13, textAlign: "center" as const }}>{data.rollNo ?? ""}</span>}
            </div>
          </div>
          <div className="info-group">
            <label>Mother&apos;s Name:</label>
            {editable ? <input value={data.motherName ?? ""} onChange={(e) => onChange?.("motherName", e.target.value)} /> : <span style={{ flexGrow: 1, borderBottom: "1px dashed #000", padding: "2px 5px", fontWeight: 700 }}>{data.motherName ?? ""}</span>}
          </div>
          <div className="info-group">
            <label>Father&apos;s Name:</label>
            {editable ? <input value={data.fatherName ?? ""} onChange={(e) => onChange?.("fatherName", e.target.value)} /> : <span style={{ flexGrow: 1, borderBottom: "1px dashed #000", padding: "2px 5px", fontWeight: 700 }}>{data.fatherName ?? ""}</span>}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: "18%" }}>Subjects</th>
              <th colSpan={3}>TERM-I</th>
              <th colSpan={3}>TERM-II</th>
              <th colSpan={2}>TERM I & II</th>
            </tr>
            <tr>
              <th>Unit Test 1 (20)</th>
              <th>Mid Term Exam (80)</th>
              <th>Total (100) Marks & Grade</th>
              <th>Unit Test 2 (20)</th>
              <th>Final Term Exam (80)</th>
              <th>Total (100) Marks & Grade</th>
              <th>Total Marks (200)</th>
              <th>Overall Percentage & Grade</th>
            </tr>
          </thead>
          <tbody>
            {cfg.subjects.map((s) => (
              <tr key={s.id}>
                <td className="text-left" style={{ whiteSpace: "pre-line", fontWeight: 600, fontSize: 11 }}>{s.label}</td>
                <td>{cell(`${s.id}_ut1`)}</td>
                <td>{cell(`${s.id}_mid1`)}</td>
                <td>{cell(`${s.id}_total1`)}</td>
                <td>{cell(`${s.id}_ut2`)}</td>
                <td>{cell(`${s.id}_mid2`)}</td>
                <td>{cell(`${s.id}_total2`)}</td>
                <td>{cell(`${s.id}_total200`)}</td>
                <td>{cell(`${s.id}_overall`)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}>
              <td colSpan={8} className="text-left">Overall Percentage & Grade :</td>
              <td>{cell("overallPercent")}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex-tables">
          <div>
            <table>
              <thead>
                <tr>
                  <th>Personality Development</th>
                  <th>Term - I</th>
                  <th>Term - II</th>
                </tr>
              </thead>
              <tbody>
                {cfg.personality.map((p) => (
                  <tr key={p.id}>
                    <td className="text-left">{p.label}</td>
                    <td>{cell(`${p.id}_t1`)}</td>
                    <td>{cell(`${p.id}_t2`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <table>
              <thead>
                <tr>
                  <th>Co-curricular Activities</th>
                  <th>Term - I</th>
                  <th>Term - II</th>
                </tr>
              </thead>
              <tbody>
                {cfg.coCurricular.map((c) => (
                  <tr key={c.id}>
                    <td className="text-left">{c.label}</td>
                    <td>{cell(`${c.id}_t1`)}</td>
                    <td>{cell(`${c.id}_t2`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex-tables">
          <div>
            <table>
              <thead>
                <tr>
                  <th>Regularity Record</th>
                  <th>Term - I</th>
                  <th>Term - II</th>
                </tr>
              </thead>
              <tbody>
                {cfg.regularity.map((r) => (
                  <tr key={r.id}>
                    <td className="text-left">{r.label}</td>
                    <td>{cell(`${r.id}_t1`)}</td>
                    <td>{cell(`${r.id}_t2`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <table>
              <thead>
                <tr><th colSpan={3}>Key to Grades</th></tr>
                <tr><th>Grade</th><th>Marks</th><th>Parameter</th></tr>
              </thead>
              <tbody>
                {cfg.grades.map((g, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{g.grade}</td>
                    <td>{g.marks}</td>
                    <td style={{ textAlign: "left", paddingLeft: 8 }}>{g.param}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="remarks-section">
          <p><strong>Term - I Class Teacher&apos;s Remarks:</strong> {editable ? <input value={data.remark1 ?? ""} onChange={(e) => onChange?.("remark1", e.target.value)} /> : <span style={{ flexGrow: 1, borderBottom: "1px solid #000", marginLeft: 10 }}>{data.remark1 ?? ""}</span>}</p>
          <p><strong>Term - II Class Teacher&apos;s Remarks:</strong> {editable ? <input value={data.remark2 ?? ""} onChange={(e) => onChange?.("remark2", e.target.value)} /> : <span style={{ flexGrow: 1, borderBottom: "1px solid #000", marginLeft: 10 }}>{data.remark2 ?? ""}</span>}</p>
          <p><strong>Final Result:</strong> Promotion to Class {editable ? <input value={data.finalClass ?? ""} onChange={(e) => onChange?.("finalClass", e.target.value)} style={{ width: 50, borderBottom: "1px dashed #000", flexGrow: 0, textAlign: "center", fontWeight: 700 }} /> : <span style={{ borderBottom: "1px dashed #000", padding: "0 6px", fontWeight: 700 }}>{data.finalClass ?? ""}</span>} is {editable ? <input value={data.finalGranted ?? ""} onChange={(e) => onChange?.("finalGranted", e.target.value)} style={{ width: 100, borderBottom: "1px dashed #000", flexGrow: 0, textAlign: "center", fontWeight: 700 }} /> : <span style={{ borderBottom: "1px dashed #000", padding: "0 6px", fontWeight: 700 }}>{data.finalGranted ?? ""}</span>}</p>
        </div>

        <div className="signatures">
          <div>
            {editable ? <input value={data.teacherName ?? ""} onChange={(e) => onChange?.("teacherName", e.target.value)} style={{ display: "block", margin: "0 auto 5px", border: "none", textAlign: "center", fontFamily: "cursive", fontWeight: 700 }} /> : <span style={{ fontFamily: "cursive", fontWeight: 700 }}>{data.teacherName ?? ""}</span>}
            <div style={{ borderTop: "1px solid #000", paddingTop: 5 }}>Class Teacher&apos;s Signature</div>
          </div>
          <div>
            <div style={{ borderTop: "1px solid #000", paddingTop: 5 }}>Principal&apos;s Signature</div>
          </div>
          <div>
            <div style={{ borderTop: "1px solid #000", paddingTop: 5 }}>Guardian&apos;s Signature</div>
          </div>
        </div>
      </div>
    </div>
  )
}
