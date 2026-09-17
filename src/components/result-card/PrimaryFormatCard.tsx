"use client"

import { DEFAULT_PRIMARY_CONFIG, PrimaryTemplateConfig } from "@/lib/primary-config"
import { useSchoolInfo } from "@/lib/use-school-info"

export type PrimaryData = Record<string, string>

export const PRIMARY_DEFAULT: PrimaryData = {
  // student info
  name: "SUBHRAJIT GHOW",
  class: "IV",
  section: "A",
  rollNo: "23",
  motherName: "SUKLA GHOW",
  fatherName: "PROSENJIT GHOW",
  session: "2025-26",
  year: "2025-2026",
  // English - LIT / LANG split (two values per cell stacked)
  en_f1_lit: "32",
  en_f1_lang: "35",
  en_s1_lit: "51",
  en_s1_lang: "55",
  en_t1_lit: "83 A",
  en_t1_lang: "90 A",
  en_f2_lit: "35",
  en_f2_lang: "36.5",
  en_s2_lit: "54",
  en_s2_lang: "52.5",
  en_t2_lit: "89(A)",
  en_t2_lang: "89(A)",
  en_ff_lit: "67",
  en_ff_lang: "71.5",
  en_ss_lit: "105",
  en_ss_lang: "107.5",
  en_overall_lit: "172(A)",
  en_overall_lang: "179(A)",
  // 2nd Language Bengali/Hindi
  ben_f1: "31",
  ben_s1: "52",
  ben_t1: "83 A",
  ben_f2: "33",
  ben_s2: "50",
  ben_t2: "83(A)",
  ben_ff: "64",
  ben_ss: "102",
  ben_overall: "166(A)",
  // 3rd Language (empty)
  third_f1: "-",
  third_s1: "-",
  third_t1: "-",
  third_f2: "-",
  third_s2: "-",
  third_t2: "-",
  third_ff: "-",
  third_ss: "-",
  third_overall: "-",
  // Mathematics
  maths_f1: "40",
  maths_s1: "58",
  maths_t1: "98",
  maths_f2: "36",
  maths_s2: "53",
  maths_t2: "89(A)",
  maths_ff: "76",
  maths_ss: "111",
  maths_overall: "187(A+)",
  // EVS
  evs_f1: "36",
  evs_s1: "56",
  evs_t1: "92 A+",
  evs_f2: "33",
  evs_s2: "48",
  evs_t2: "81(A)",
  evs_ff: "69",
  evs_ss: "104",
  evs_overall: "173(A)",
  // SST
  sst_f1: "33",
  sst_s1: "52",
  sst_t1: "85 A",
  sst_f2: "39",
  sst_s2: "47",
  sst_t2: "86(A)",
  sst_ff: "72",
  sst_ss: "99",
  sst_overall: "171(A)",
  // Computer
  comp_f1: "38",
  comp_s1: "53",
  comp_t1: "91 A+",
  comp_f2: "38.5",
  comp_s2: "52.5",
  comp_t2: "91(A+)",
  comp_ff: "76.5",
  comp_ss: "105.5",
  comp_overall: "182(A+)",
  // Other subjects
  life_half: "20",
  life_half_grade: "20 A+",
  life_annual: "17",
  life_annual_grade: "17(A)",
  life_overall: "37(A+)",
  gk_half: "19",
  gk_half_grade: "19 A+",
  gk_annual: "19.5",
  gk_annual_grade: "20(A+)",
  gk_overall: "39(A+)",
  // Work Habits
  work_attent_half: "A",
  work_attent_annual: "A",
  work_eager_half: "A",
  work_eager_annual: "A",
  work_neat_half: "A+",
  work_neat_annual: "A",
  work_comp_half: "A+",
  work_comp_annual: "A+",
  work_hand_half: "A",
  work_hand_annual: "A+",
  work_resp_half: "A",
  work_resp_annual: "A+",
  // Social & Personal
  social_punct_half: "A",
  social_punct_annual: "A+",
  social_resp_half: "A+",
  social_resp_annual: "A+",
  social_courtesy_half: "A+",
  social_courtesy_annual: "A+",
  social_friendly_half: "A+",
  social_friendly_annual: "A+",
  social_conf_half: "A+",
  social_conf_annual: "A",
  social_tidy_half: "A+",
  social_tidy_annual: "A",
  // Regularity
  attend_half: "98/103",
  attend_annual: "79/102",
  attend_pct_half: "95.1%",
  attend_pct_annual: "77.4%",
  // Co-curricular
  sports_half: "A+",
  sports_annual: "A",
  art_half: "B+",
  art_annual: "A",
  dance_half: "A",
  dance_annual: "A",
  music_half: "C",
  music_annual: "A",
  // Final
  overallMarks: "1306/1480 (A)",
  halfRemark: "Subhrajit is a modest, hardworking and an active student in the class. His academic performance is very good.",
  annualRemark: "Subhrajit is an intelligent, cheerful and hard-working student of the class. His academic performance is excellent.",
  finalClass: "V",
  finalGranted: "Granted",
}

export default function PrimaryFormatCard({
  data,
  onChange,
  editable = true,
  config,
}: {
  data: PrimaryData
  onChange?: (key: string, value: string) => void
  editable?: boolean
  config?: PrimaryTemplateConfig
}) {
  const cfg = config || DEFAULT_PRIMARY_CONFIG
  const { info: schoolInfo } = useSchoolInfo()
  const logoSrc = cfg.header.logo || schoolInfo.logoSrc || ""

  const cellInput = (k: string) =>
    editable ? (
      <input
        value={data[k] ?? ""}
        onChange={(e) => onChange?.(k, e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "1px solid transparent",
          background: "transparent",
          textAlign: "center",
          fontFamily: "inherit",
          fontSize: 13,
          padding: "6px 2px",
          color: "#111",
        }}
      />
    ) : (
      <span style={{ fontSize: 13, color: "#111" }}>{data[k] ?? ""}</span>
    )

  const cellInputStacked = (k1: string, k2: string) =>
    editable ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <input
          value={data[k1] ?? ""}
          onChange={(e) => onChange?.(k1, e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid transparent",
            background: "transparent",
            textAlign: "center",
            fontFamily: "inherit",
            fontSize: 13,
            padding: "4px 2px",
            color: "#111",
          }}
        />
        <input
          value={data[k2] ?? ""}
          onChange={(e) => onChange?.(k2, e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid transparent",
            background: "transparent",
            textAlign: "center",
            fontFamily: "inherit",
            fontSize: 13,
            padding: "4px 2px",
            color: "#111",
          }}
        />
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 13, textAlign: "center" as const }}>
        <span>{data[k1] ?? ""}</span>
        <span>{data[k2] ?? ""}</span>
      </div>
    )

  return (
    <div className="primary-format-root">
      <style>{`
        .primary-format-root .page {
            max-width: 1050px;
            background: #fff;
            margin: 0 auto 30px auto;
            padding: 40px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .primary-format-root .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .primary-format-root .header h3 { margin: 5px 0; font-weight: normal; font-size: 16px; }
        .primary-format-root .header h1 { margin: 10px 0; font-size: 32px; font-family: "Times New Roman", serif; }
        .primary-format-root .header h4 { margin: 5px 0; font-size: 18px; }
        .primary-format-root .header h2 { margin: 15px 0; text-decoration: underline; font-size: 24px; }
        .primary-format-root .student-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px 30px;
            margin-bottom: 25px;
            font-size: 15px;
            font-weight: bold;
        }
        .primary-format-root .info-group {
            display: flex;
            align-items: flex-end;
        }
        .primary-format-root .info-group label {
            margin-right: 10px;
            white-space: nowrap;
        }
        .primary-format-root .info-group input {
            flex-grow: 1;
            border: none;
            border-bottom: 1px dotted #000;
            font-size: 16px;
            font-weight: bold;
            padding: 2px 5px;
            font-family: inherit;
            background: transparent;
        }
        .primary-format-root table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 13px;
        }
        .primary-format-root th, .primary-format-root td {
            border: 1px solid #000;
            padding: 4px;
            text-align: center;
            vertical-align: middle;
        }
        .primary-format-root th {
            background-color: #fcfcfc;
            font-weight: bold;
        }
        .primary-format-root .text-left {
            text-align: left;
            padding-left: 8px;
        }
        .primary-format-root td input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid transparent;
            background: transparent;
            text-align: center;
            font-family: inherit;
            font-size: 13px;
            padding: 6px 2px;
            color: #111;
        }
        .primary-format-root .text-left input {
            text-align: left;
        }
        .primary-format-root td input:focus, .primary-format-root .info-group input:focus, .primary-format-root .remarks-section input:focus {
            outline: none;
            border: 1px solid #007bff !important;
            background-color: #f0f8ff !important;
        }
        .primary-format-root .flex-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 20px;
        }
        .primary-format-root .flex-col {
            flex: 1;
            min-width: 300px;
        }
        .primary-format-root .remarks-section {
            border: 1px solid #000;
            padding: 15px;
            margin-bottom: 20px;
        }
        .primary-format-root .remarks-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 10px;
        }
        .primary-format-root .remark-row {
            display: flex;
            align-items: flex-end;
            margin-bottom: 10px;
        }
        .primary-format-root .remark-row label { font-weight: bold; white-space: nowrap; }
        .primary-format-root .remark-row input {
            flex-grow: 1;
            border: none;
            border-bottom: 1px dashed #000;
            margin-left: 10px;
            font-family: cursive;
            font-size: 15px;
            background: transparent;
        }
        .primary-format-root .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            text-align: center;
            font-weight: bold;
        }
        .primary-format-root .signatures div {
            border-top: 1px solid #000;
            width: 25%;
            padding-top: 5px;
        }
        .primary-format-root .final-result {
            font-size: 16px;
            font-weight: bold;
            margin: 20px 0;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
        }
        .primary-format-root .final-result input {
            border: none;
            border-bottom: 1px dashed #000;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            margin: 0 10px;
            background: transparent;
        }
        @media print {
          .primary-format-root .page { box-shadow: none; margin: 0; padding: 20px; }
          .primary-format-root td input, .primary-format-root .info-group input, .primary-format-root .remark-row input { border: 1px solid transparent !important; }
        }
      `}</style>

      <div className="page">
        <div className="header" style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: "2px solid #000", paddingBottom: 15, marginBottom: 20 }}>
          <div style={{ flex: "0 0 150px", textAlign: "center", borderRight: "1px solid #e5e7eb", paddingRight: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="school logo" style={{ maxHeight: 85, maxWidth: 120, objectFit: "contain", marginBottom: 6 }} />
            ) : (
              <div style={{ height: 85, width: 90, border: "1px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#9ca3af", marginBottom: 6 }}>Logo</div>
            )}
            <h4 style={{ margin: "4px 0 0", fontSize: 10, color: "#374151" }}>{cfg.header.estd}</h4>
          </div>
          <div style={{ flex: 1, textAlign: "center", paddingLeft: 12 }}>
            <h1 style={{ margin: "4px 0 2px", fontSize: 26, fontFamily: '"Times New Roman", serif', fontWeight: 700, lineHeight: 1.1 }}>{cfg.header.schoolName}</h1>
            <h3 style={{ margin: "2px 0 6px", fontWeight: "normal", fontSize: 12, lineHeight: 1.2, fontStyle: "italic" }}>&quot;{cfg.header.tagline}&quot;</h3>
            <h2 style={{ margin: "6px 0 4px", textDecoration: "underline", fontSize: 20, fontWeight: 700 }}>{cfg.header.title}</h2>
            <h4 style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 500 }}>{cfg.header.subtitle}</h4>
          </div>
        </div>

        <div className="student-info">
          <div className="info-group">
            <label>Name:</label>
            {editable ? (
              <input value={data.name ?? ""} onChange={(e) => onChange?.("name", e.target.value)} />
            ) : (
              <span style={{ flexGrow: 1, borderBottom: "1px dotted #000", padding: "2px 5px", fontWeight: 700 }}>{data.name ?? ""}</span>
            )}
          </div>
          <div className="info-group" style={{ display: "flex", gap: 6 }}>
            <div style={{ display: "flex", flex: "1 1 0", minWidth: 0, alignItems: "flex-end" }}>
              <label style={{ marginRight: 4, whiteSpace: "nowrap", fontSize: 13 }}>Class:</label>
              {editable ? <input value={data.class ?? ""} onChange={(e) => onChange?.("class", e.target.value)} style={{ flex: "1 1 0", minWidth: 0, fontSize: 13, padding: "2px 4px", textAlign: "center" }} /> : <span style={{ flex: "1 1 0", minWidth: 0, borderBottom: "1px dotted #000", padding: "2px 4px", fontWeight: 700, fontSize: 13, textAlign: "center" as const }}>{data.class ?? ""}</span>}
            </div>
            <div style={{ display: "flex", flex: "0 0 70px", minWidth: 0, alignItems: "flex-end" }}>
              <label style={{ marginRight: 4, whiteSpace: "nowrap", fontSize: 13 }}>Sec:</label>
              {editable ? <input value={data.section ?? ""} onChange={(e) => onChange?.("section", e.target.value)} style={{ flex: "1 1 0", minWidth: 0, fontSize: 13, padding: "2px 4px", textAlign: "center" }} /> : <span style={{ flex: "1 1 0", minWidth: 0, borderBottom: "1px dotted #000", padding: "2px 4px", fontWeight: 700, fontSize: 13, textAlign: "center" as const }}>{data.section ?? ""}</span>}
            </div>
            <div style={{ display: "flex", flex: "1 1 0", minWidth: 0, alignItems: "flex-end" }}>
              <label style={{ marginRight: 4, whiteSpace: "nowrap", fontSize: 13 }}>Roll No.:</label>
              {editable ? <input value={data.rollNo ?? ""} onChange={(e) => onChange?.("rollNo", e.target.value)} style={{ flex: "1 1 0", minWidth: 0, fontSize: 13, padding: "2px 4px", textAlign: "center" }} /> : <span style={{ flex: "1 1 0", minWidth: 0, borderBottom: "1px dotted #000", padding: "2px 4px", fontWeight: 700, fontSize: 13, textAlign: "center" as const }}>{data.rollNo ?? ""}</span>}
            </div>
          </div>
          <div className="info-group">
            <label>Mother&apos;s Name:</label>
            {editable ? <input value={data.motherName ?? ""} onChange={(e) => onChange?.("motherName", e.target.value)} /> : <span style={{ flexGrow: 1, borderBottom: "1px dotted #000", padding: "2px 5px", fontWeight: 700 }}>{data.motherName ?? ""}</span>}
          </div>
          <div className="info-group">
            <label>Session:</label>
            {editable ? <input value={data.session ?? ""} onChange={(e) => onChange?.("session", e.target.value)} style={{ textAlign: "center" }} /> : <span style={{ flexGrow: 1, borderBottom: "1px dotted #000", padding: "2px 5px", fontWeight: 700, textAlign: "center" as const }}>{data.session ?? ""}</span>}
          </div>
          <div className="info-group">
            <label>Father&apos;s Name:</label>
            {editable ? <input value={data.fatherName ?? ""} onChange={(e) => onChange?.("fatherName", e.target.value)} /> : <span style={{ flexGrow: 1, borderBottom: "1px dotted #000", padding: "2px 5px", fontWeight: 700 }}>{data.fatherName ?? ""}</span>}
          </div>
        </div>

        <h3 style={{ textAlign: "center", textDecoration: "underline" }}>
          ACADEMIC PERFORMANCE
          <br />
          For the year{" "}
          {editable ? (
            <input value={data.year ?? ""} onChange={(e) => onChange?.("year", e.target.value)} style={{ border: "none", borderBottom: "1px solid #000", width: 100, textAlign: "center", fontWeight: "bold", fontSize: 18, background: "transparent" }} />
          ) : (
            <span style={{ borderBottom: "1px solid #000", padding: "0 10px", fontWeight: 700 }}>{data.year ?? ""}</span>
          )}
        </h3>

        <table>
          <thead>
            <tr>
              <th rowSpan={2}>SUBJECTS</th>
              <th colSpan={3}>Half-Yearly</th>
              <th colSpan={3}>Annual</th>
              <th colSpan={2}>Half-Yearly + Annual</th>
              <th rowSpan={2}>Overall Marks & Grade</th>
            </tr>
            <tr>
              <th>F1</th>
              <th>S1</th>
              <th>TOTAL</th>
              <th>F2</th>
              <th>S2</th>
              <th>TOTAL</th>
              <th>F1 + F2</th>
              <th>S1 + S2</th>
            </tr>
          </thead>
          <tbody>
            {cfg.academicSubjects.map((sub) => (
              <tr key={sub.id}>
                <td className="text-left" style={{ whiteSpace: "pre-line" }}>
                  {sub.label}
                  {sub.sub ? <><br />{sub.sub.split("\n").map((l, i) => <span key={i}>&nbsp;&nbsp;&nbsp;{l}<br /></span>)}</> : null}
                </td>
                {sub.hasSplit ? (
                  <>
                    <td>{cellInputStacked(`${sub.id}_f1_lit`, `${sub.id}_f1_lang`)}</td>
                    <td>{cellInputStacked(`${sub.id}_s1_lit`, `${sub.id}_s1_lang`)}</td>
                    <td>{cellInputStacked(`${sub.id}_t1_lit`, `${sub.id}_t1_lang`)}</td>
                    <td>{cellInputStacked(`${sub.id}_f2_lit`, `${sub.id}_f2_lang`)}</td>
                    <td>{cellInputStacked(`${sub.id}_s2_lit`, `${sub.id}_s2_lang`)}</td>
                    <td>{cellInputStacked(`${sub.id}_t2_lit`, `${sub.id}_t2_lang`)}</td>
                    <td>{cellInputStacked(`${sub.id}_ff_lit`, `${sub.id}_ff_lang`)}</td>
                    <td>{cellInputStacked(`${sub.id}_ss_lit`, `${sub.id}_ss_lang`)}</td>
                    <td>{cellInputStacked(`${sub.id}_overall_lit`, `${sub.id}_overall_lang`)}</td>
                  </>
                ) : (
                  <>
                    <td>{cellInput(`${sub.id}_f1`)}</td>
                    <td>{cellInput(`${sub.id}_s1`)}</td>
                    <td>{cellInput(`${sub.id}_t1`)}</td>
                    <td>{cellInput(`${sub.id}_f2`)}</td>
                    <td>{cellInput(`${sub.id}_s2`)}</td>
                    <td>{cellInput(`${sub.id}_t2`)}</td>
                    <td>{cellInput(`${sub.id}_ff`)}</td>
                    <td>{cellInput(`${sub.id}_ss`)}</td>
                    <td>{cellInput(`${sub.id}_overall`)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex-container">
          <div className="flex-col" style={{ flex: "1.5" as any }}>
            <table>
              <thead>
                <tr><th colSpan={6}>OTHER SUBJECTS</th></tr>
              </thead>
              <tbody>
                {cfg.otherSubjects.map((o) => (
                  <tr key={o.id}>
                    <td className="text-left">{o.label}</td>
                    <td>{cellInput(`${o.id}_half`)}</td>
                    <td>{cellInput(`${o.id}_half_grade`)}</td>
                    <td>{cellInput(`${o.id}_annual`)}</td>
                    <td>{cellInput(`${o.id}_annual_grade`)}</td>
                    <td>{cellInput(`${o.id}_overall`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex-col">
            <table>
              <thead>
                <tr><th>WORK HABITS</th><th>Half-Yearly</th><th>Annual</th></tr>
              </thead>
              <tbody>
                {cfg.workHabits.map((w) => (
                  <tr key={w.id}><td className="text-left">{w.label}</td><td>{cellInput(`${w.id}_half`)}</td><td>{cellInput(`${w.id}_annual`)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex-container">
          <div className="flex-col">
            <table>
              <thead>
                <tr><th>SOCIAL & PERSONAL<br />Development</th><th>Half-Yearly</th><th>Annual</th></tr>
              </thead>
              <tbody>
                {cfg.socialPersonal.map((s) => (
                  <tr key={s.id}><td className="text-left">{s.label}</td><td>{cellInput(`${s.id}_half`)}</td><td>{cellInput(`${s.id}_annual`)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex-col">
            <table>
              <thead>
                <tr><th>REGULARITY RECORD</th><th>Half-Yearly</th><th>Annual</th></tr>
              </thead>
              <tbody>
                {cfg.regularity.map((r) => (
                  <tr key={r.id}><td className="text-left">{r.label}</td><td>{cellInput(`${r.id}_half`)}</td><td>{cellInput(`${r.id}_annual`)}</td></tr>
                ))}
              </tbody>
            </table>

            <table>
              <thead>
                <tr><th>CO-CURRICULAR ACTIVITIES</th><th>Half-Yearly</th><th>Annual</th></tr>
              </thead>
              <tbody>
                {cfg.coCurricular.map((c) => (
                  <tr key={c.id}><td className="text-left">{c.label}</td><td>{cellInput(`${c.id}_half`)}</td><td>{cellInput(`${c.id}_annual`)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex-col">
            <table>
              <thead>
                <tr><th colSpan={2}>KEY TO GRADES</th></tr>
                <tr><th>GRADE</th><th>MARKS</th></tr>
              </thead>
              <tbody>
                {cfg.gradeScale.map((g, i) => (
                  <tr key={i}><td>{g.grade}</td><td>{g.range}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="final-result">
          Overall Marks & Grade :{" "}
          {editable ? (
            <input value={data.overallMarks ?? ""} onChange={(e) => onChange?.("overallMarks", e.target.value)} style={{ width: 250, border: "none", borderBottom: "1px dashed #000", textAlign: "center", fontWeight: 700, fontSize: 16 }} />
          ) : (
            <span style={{ borderBottom: "1px dashed #000", padding: "0 10px" }}>{data.overallMarks ?? ""}</span>
          )}
        </div>

        <div className="remarks-section">
          <div className="remark-row">
            <label>Half-Yearly Class Teacher&apos;s Remarks:</label>
            {editable ? (
              <input value={data.halfRemark ?? ""} onChange={(e) => onChange?.("halfRemark", e.target.value)} />
            ) : (
              <span style={{ flexGrow: 1, marginLeft: 10, fontFamily: "cursive", fontSize: 15, borderBottom: "1px dashed #000" }}>{data.halfRemark ?? ""}</span>
            )}
          </div>
          <div className="signatures" style={{ marginTop: 30, marginBottom: 20 }}>
            <div>Class Teacher&apos;s<br />Signature</div>
            <div>Vice-Principal&apos;s<br />Signature</div>
            <div>Guardian&apos;s<br />Signature</div>
          </div>

          <div className="remark-row" style={{ marginTop: 40 }}>
            <label>Annual Class Teacher&apos;s Remarks:</label>
            {editable ? (
              <input value={data.annualRemark ?? ""} onChange={(e) => onChange?.("annualRemark", e.target.value)} />
            ) : (
              <span style={{ flexGrow: 1, marginLeft: 10, fontFamily: "cursive", fontSize: 15, borderBottom: "1px dashed #000" }}>{data.annualRemark ?? ""}</span>
            )}
          </div>
          <div className="signatures" style={{ marginTop: 30 }}>
            <div>Class Teacher&apos;s<br />Signature</div>
            <div>Vice-Principal&apos;s<br />Signature</div>
            <div>Guardian&apos;s<br />Signature</div>
          </div>
        </div>

        <div className="final-result">
          FINAL RESULT: Promotion to Class{" "}
          {editable ? (
            <input value={data.finalClass ?? ""} onChange={(e) => onChange?.("finalClass", e.target.value)} style={{ width: 50, border: "none", borderBottom: "1px dashed #000", textAlign: "center", fontWeight: 700, fontSize: 16 }} />
          ) : (
            <span style={{ borderBottom: "1px dashed #000", padding: "0 8px" }}>{data.finalClass ?? ""}</span>
          )}{" "}
          is{" "}
          {editable ? (
            <input value={data.finalGranted ?? ""} onChange={(e) => onChange?.("finalGranted", e.target.value)} style={{ width: 150, border: "none", borderBottom: "1px dashed #000", textAlign: "center", fontWeight: 700, fontSize: 16 }} />
          ) : (
            <span style={{ borderBottom: "1px dashed #000", padding: "0 8px" }}>{data.finalGranted ?? ""}</span>
          )}{" "}
          / Not Granted.
        </div>

        <div className="signatures">
          <div>Class Teacher&apos;s Signature</div>
          <div>Vice-Principal&apos;s Signature</div>
        </div>
      </div>
    </div>
  )
}
