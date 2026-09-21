"use client"

import { useSchoolInfo } from "@/lib/use-school-info"
import { DEFAULT_PREPRIMARY_CONFIG, PrePrimaryConfig } from "@/lib/preprimary-config"

export type PrePrimaryData = Record<string, string>

export const PREPRIMARY_DEFAULT: PrePrimaryData = {
  name: "SK ABDUR RAHMAN",
  class: "K.G-A",
  rollNo: "20",
  motherName: "RAJIA BEGUM",
  fatherName: "SK ARIFUL",
  session: "2025-26",
  overallGrade: "A+",
  halfRemark: "Abdur is excellent in academics. He must be attentive in class.",
  annualRemark: "Abdur's academic performance is excellent. His perseverance is commendable.",
  finalClass: "I",
  finalGranted: "Granted",
  // English
  eng_phonic_half: "A+",
  eng_phonic_annual: "A+",
  eng_alpha_half: "A+",
  eng_alpha_annual: "A+",
  eng_topic_half: "A+",
  eng_topic_annual: "A+",
  eng_conv_half: "A+",
  eng_conv_annual: "A+",
  eng_strokes_half: "A+",
  eng_strokes_annual: "A+",
  eng_write_half: "A+",
  eng_write_annual: "A+",
  eng_pic_half: "A+",
  eng_pic_annual: "A+",
  eng_spell_half: "A+",
  eng_spell_annual: "A+",
  // Maths
  maths_num_half: "A+",
  maths_num_annual: "A+",
  maths_classify_half: "A+",
  maths_classify_annual: "A+",
  maths_verbal_half: "A",
  maths_verbal_annual: "A+",
  maths_write_half: "A+",
  maths_write_annual: "A+",
  maths_concept_half: "A+",
  maths_concept_annual: "A+",
  // 2nd lang
  lang2_letters_half: "A+",
  lang2_letters_annual: "A+",
  lang2_topic_half: "A+",
  lang2_topic_annual: "A+",
  lang2_write_half: "A+",
  lang2_write_annual: "A+",
  // other left
  env_half: "A+",
  env_annual: "A+",
  rhymes_half: "A+",
  rhymes_annual: "A+",
  art_half: "A",
  art_annual: "A+",
  // work
  work_attent_half: "A",
  work_attent_annual: "B+",
  work_eager_half: "A",
  work_eager_annual: "B+",
  work_neat_half: "A",
  work_neat_annual: "A",
  work_comp_half: "A",
  work_comp_annual: "B+",
  // sensorial
  sens_colour_half: "A",
  sens_colour_annual: "A+",
  sens_shapes_half: "A",
  sens_shapes_annual: "A+",
  sens_sizes_half: "A",
  sens_sizes_annual: "A",
  sens_weight_half: "-",
  sens_weight_annual: "-",
  // social
  soc_punct_half: "A",
  soc_punct_annual: "A",
  soc_resp_half: "A",
  soc_resp_annual: "B+",
  soc_courtesy_half: "A",
  soc_courtesy_annual: "B+",
  soc_friendly_half: "A",
  soc_friendly_annual: "A+",
  soc_response_half: "A",
  soc_response_annual: "A+",
  soc_tidy_half: "A",
  soc_tidy_annual: "A",
  // regularity
  reg_att_half: "93/100",
  reg_att_annual: "100/105",
  reg_pct_half: "93%",
  reg_pct_annual: "95%",
  // principal
  principalHalf: "Zariin",
  principalAnnual: "Zariin",
  guardianAnnual: "Rajia Begum",
}

export default function PrePrimaryFormatCard({
  data,
  onChange,
  editable = true,
  config,
}: {
  data: PrePrimaryData
  onChange?: (key: string, value: string) => void
  editable?: boolean
  config?: PrePrimaryConfig
}) {
  const cfg = config || DEFAULT_PREPRIMARY_CONFIG
  const { info: schoolInfo } = useSchoolInfo()
  const logoSrc = schoolInfo.logoSrc || (cfg as any).header?.logo || ""

  const cell = (k: string) =>
    editable ? (
      <input
        value={data[k] ?? ""}
        onChange={(e) => onChange?.(k, e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", border: "1px solid transparent", background: "transparent", textAlign: "center", fontFamily: "inherit", fontSize: 13, padding: "4px 2px", color: "#111" }}
      />
    ) : (
      <span style={{ fontSize: 13, color: "#111" }}>{data[k] ?? ""}</span>
    )

  return (
    <div className="preprimary-root">
      <style>{`
        .preprimary-root .page {
          max-width: 1000px;
          background: #fff;
          margin: 0 auto;
          padding: 40px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .preprimary-root .header {
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .preprimary-root .header-left {
          flex: 0 0 150px;
          text-align: center;
          border-right: 1px solid #e5e7eb;
          padding-right: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .preprimary-root .header-right { flex: 1; text-align: center; padding-left: 12px; }
        .preprimary-root .header-right h1 { margin: 4px 0; font-size: 26px; font-family: "Times New Roman", serif; font-weight: 700; }
        .preprimary-root .header-right h3 { margin: 2px 0 6px; font-weight: normal; font-size: 12px; font-style: italic; }
        .preprimary-root .header-right h2 { margin: 6px 0 4px; text-decoration: underline; font-size: 20px; font-weight: 700; }
        .preprimary-root .header-right h4 { margin: 4px 0 0; font-size: 14px; font-weight: 500; }
        .preprimary-root .student-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px 30px;
          margin-bottom: 25px;
          font-size: 15px;
          font-weight: bold;
        }
        .preprimary-root .info-group { display: flex; align-items: flex-end; }
        .preprimary-root .info-group label { margin-right: 10px; white-space: nowrap; }
        .preprimary-root .info-group input {
          flex-grow: 1;
          border: none;
          border-bottom: 1px dotted #000;
          font-size: 16px;
          font-weight: bold;
          padding: 2px 5px;
          font-family: inherit;
          background: transparent;
        }
        .preprimary-root .flex-container { display: flex; gap: 30px; margin-bottom: 20px; align-items: flex-start; }
        .preprimary-root .flex-col { flex: 1; min-width: 0; }
        .preprimary-root table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
        .preprimary-root th, .preprimary-root td { border: 1px solid #000; padding: 5px; text-align: center; vertical-align: middle; }
        .preprimary-root th { background-color: #fcfcfc; font-weight: bold; }
        .preprimary-root .text-left { text-align: left; padding-left: 8px; font-weight: bold; }
        .preprimary-root .sub-item { text-align: left; padding-left: 15px; font-weight: normal; }
        .preprimary-root td input { width: 100%; box-sizing: border-box; border: 1px solid transparent; background: transparent; text-align: center; font-family: inherit; fontSize: 13px; padding: 4px 2px; color: #111; }
        .preprimary-root .text-left input { text-align: left; }
        .preprimary-root td input:focus, .preprimary-root .info-group input:focus, .preprimary-root .remarks-section input:focus { outline: none; border: 1px solid #007bff !important; background-color: #f0f8ff !important; }
        .preprimary-root .remarks-section { border: 1px solid #000; padding: 15px; margin-top: 20px; margin-bottom: 20px; }
        .preprimary-root .remark-row { display: flex; align-items: flex-start; margin-bottom: 10px; }
        .preprimary-root .remark-row label { font-weight: bold; white-space: nowrap; margin-top: 5px; }
        .preprimary-root .remark-row input { flex-grow: 1; border: none; border-bottom: 1px dashed #000; margin-left: 10px; font-family: cursive; font-size: 15px; width: 100%; background: transparent; }
        .preprimary-root .signatures { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; font-weight: bold; }
        .preprimary-root .signatures div { border-top: 1px solid #000; width: 25%; padding-top: 5px; font-size: 13px; }
        .preprimary-root .overall-grade { text-align: left; font-size: 16px; font-weight: bold; margin: 20px 0; display: flex; align-items: center; }
        .preprimary-root .final-result { font-size: 16px; font-weight: bold; margin: 20px 0; display: flex; align-items: center; }
        .preprimary-root .final-result input { border: none; border-bottom: 1px dashed #000; text-align: center; font-weight: bold; font-size: 16px; margin: 0 10px; background: transparent; }
        .preprimary-root .section-title { background-color: #eee; font-weight: bold; text-align: left; padding-left: 8px; }
        @media print {
          .preprimary-root .page { box-shadow: none; margin: 0; padding: 20px; }
          .preprimary-root td input, .preprimary-root .info-group input { border: 1px solid transparent !important; }
        }
      `}</style>

      <div className="page">
        <div className="header">
          <div className="header-left">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="logo" style={{ maxHeight: 85, maxWidth: 120, objectFit: "contain", marginBottom: 6 }} />
            ) : (
              <div style={{ height: 85, width: 90, border: "1px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#9ca3af", marginBottom: 6 }}>Logo</div>
            )}
            <div style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>&quot;{cfg.header.tagline}&quot;</div>
            <div style={{ fontSize: 10, color: "#374151" }}>{cfg.header.estd}</div>
          </div>
          <div className="header-right">
            <h1>{cfg.header.schoolName}</h1>
            <div style={{ fontSize: 11, fontStyle: "italic", margin: "2px 0 6px" }}>&quot;{cfg.header.tagline}&quot;</div>
            <h2>{cfg.header.title}</h2>
            <h4>{cfg.header.subtitle}</h4>
          </div>
        </div>

        <div className="student-info">
          <div className="info-group">
            <label>Name:</label>
            {editable ? <input value={data.name ?? ""} onChange={(e) => onChange?.("name", e.target.value)} /> : <span style={{ flexGrow: 1, borderBottom: "1px dotted #000", padding: "2px 5px", fontWeight: 700 }}>{data.name ?? ""}</span>}
          </div>
          <div className="info-group" style={{ display: "flex", gap: 6 }}>
            <div style={{ display: "flex", flex: "1 1 0", minWidth: 0, alignItems: "flex-end" }}>
              <label style={{ marginRight: 4, whiteSpace: "nowrap", fontSize: 13 }}>Class:</label>
              {editable ? <input value={data.class ?? ""} onChange={(e) => onChange?.("class", e.target.value)} style={{ flex: "1 1 0", minWidth: 0, fontSize: 13, padding: "2px 4px", textAlign: "center" }} /> : <span style={{ flex: "1 1 0", borderBottom: "1px dotted #000", padding: "2px 4px", fontWeight: 700, fontSize: 13, textAlign: "center" as const }}>{data.class ?? ""}</span>}
            </div>
            <div style={{ display: "flex", flex: "1 1 0", minWidth: 0, alignItems: "flex-end" }}>
              <label style={{ marginRight: 4, whiteSpace: "nowrap", fontSize: 13 }}>Roll No.:</label>
              {editable ? <input value={data.rollNo ?? ""} onChange={(e) => onChange?.("rollNo", e.target.value)} style={{ flex: "1 1 0", minWidth: 0, fontSize: 13, padding: "2px 4px", textAlign: "center" }} /> : <span style={{ flex: "1 1 0", borderBottom: "1px dotted #000", padding: "2px 4px", fontWeight: 700, fontSize: 13, textAlign: "center" as const }}>{data.rollNo ?? ""}</span>}
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

        <div className="flex-container">
          <div className="flex-col">
            {cfg.leftGroups.map((group) => (
              <table key={group.id}>
                {group.title && (
                  <thead>
                    <tr>
                      <th style={{ width: "60%", whiteSpace: "pre-line" }}>{group.title}</th>
                      <th style={{ width: "20%" }}>Half-Yearly</th>
                      <th style={{ width: "20%" }}>Annual</th>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {group.items.map((it) => (
                    <tr key={it.id}>
                      <td className={group.title ? "sub-item" : "text-left"} style={{ whiteSpace: "pre-line" }}>{it.label}</td>
                      <td>{cell(`${it.id}_half`)}</td>
                      <td>{cell(`${it.id}_annual`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>

          <div className="flex-col">
            {cfg.rightGroups.map((group) => (
              <table key={group.id}>
                <thead>
                  <tr>
                    <th style={{ width: "60%", textAlign: "left", paddingLeft: 8 }}>{group.title}</th>
                    <th style={{ width: "20%" }}>Half-Yearly</th>
                    <th style={{ width: "20%" }}>Annual</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((it) => (
                    <tr key={it.id}>
                      <td className="sub-item">{it.label}</td>
                      <td>{cell(`${it.id}_half`)}</td>
                      <td>{cell(`${it.id}_annual`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}

            <table>
              <thead>
                <tr><th colSpan={3}>Key to Grades</th></tr>
                <tr><th>GRADE</th><th>MARKS</th><th>REMARKS</th></tr>
              </thead>
              <tbody>
                {cfg.gradeRows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.grade}</td>
                    <td>{r.marks}</td>
                    <td style={{ textAlign: "left", paddingLeft: 8 }}>{r.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="overall-grade">
              Overall Grade :{" "}
              {editable ? <input value={data.overallGrade ?? ""} onChange={(e) => onChange?.("overallGrade", e.target.value)} style={{ width: 50, fontWeight: "bold", borderBottom: "1px dashed #000", marginLeft: 10, borderTop: "none", borderLeft: "none", borderRight: "none", textAlign: "center", background: "transparent" }} /> : <span style={{ borderBottom: "1px dashed #000", padding: "0 8px", minWidth: 50, textAlign: "center" }}>{data.overallGrade ?? ""}</span>}
            </div>
          </div>
        </div>

        <div className="remarks-section">
          <div className="remark-row">
            <label>Half-Yearly Class Teacher&apos;s Remarks:</label>
            {editable ? <input value={data.halfRemark ?? ""} onChange={(e) => onChange?.("halfRemark", e.target.value)} /> : <span style={{ flexGrow: 1, marginLeft: 10, fontFamily: "cursive", fontSize: 15, borderBottom: "1px dashed #000" }}>{data.halfRemark ?? ""}</span>}
          </div>
          <div className="signatures" style={{ marginTop: 30, marginBottom: 20 }}>
            <div>Class Teacher&apos;s<br />Signature</div>
            <div>Principal&apos;s<br />Signature<br /><span style={{ fontFamily: "cursive", fontSize: 12 }}>{data.principalHalf ?? ""}</span></div>
            <div>Guardian&apos;s<br />Signature</div>
          </div>

          <div className="remark-row" style={{ marginTop: 40 }}>
            <label>Annual Class Teacher&apos;s Remarks:</label>
            {editable ? <input value={data.annualRemark ?? ""} onChange={(e) => onChange?.("annualRemark", e.target.value)} /> : <span style={{ flexGrow: 1, marginLeft: 10, fontFamily: "cursive", fontSize: 15, borderBottom: "1px dashed #000" }}>{data.annualRemark ?? ""}</span>}
          </div>
          <div className="signatures" style={{ marginTop: 30 }}>
            <div>Class Teacher&apos;s<br />Signature</div>
            <div>Principal&apos;s<br />Signature<br /><span style={{ fontFamily: "cursive", fontSize: 12 }}>{data.principalAnnual ?? "Zariin"}</span></div>
            <div>Guardian&apos;s<br />Signature<br /><span style={{ fontFamily: "cursive", fontSize: 12 }}>{data.guardianAnnual ?? ""}</span></div>
          </div>
        </div>

        <div className="final-result">
          FINAL RESULT: Promotion to Class{" "}
          {editable ? <input value={data.finalClass ?? ""} onChange={(e) => onChange?.("finalClass", e.target.value)} style={{ width: 50, border: "none", borderBottom: "1px dashed #000", textAlign: "center", fontWeight: 700, fontSize: 16, background: "transparent" }} /> : <span style={{ borderBottom: "1px dashed #000", padding: "0 8px" }}>{data.finalClass ?? ""}</span>} is{" "}
          {editable ? <input value={data.finalGranted ?? ""} onChange={(e) => onChange?.("finalGranted", e.target.value)} style={{ width: 150, border: "none", borderBottom: "1px dashed #000", textAlign: "center", fontWeight: 700, fontSize: 16, background: "transparent" }} /> : <span style={{ borderBottom: "1px dashed #000", padding: "0 8px" }}>{data.finalGranted ?? ""}</span>} / Not Granted.
        </div>

        <div className="signatures" style={{ marginTop: 50 }}>
          <div>Class Teacher&apos;s Signature</div>
          <div>Principal&apos;s Signature<br /><span style={{ fontFamily: "cursive", fontSize: 12 }}>{data.principalAnnual ?? "Zariin"}</span></div>
        </div>
      </div>
    </div>
  )
}
