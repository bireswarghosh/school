"use client"

import { useSchoolInfo } from "@/lib/use-school-info"
import { DEFAULT_PROGRESS_CONFIG, ProgressTemplateConfig } from "@/lib/progress-config"

export type ProgressData = Record<string, string>

export const PROGRESS_DEFAULT: ProgressData = {
  studentName: "DIPAN GANGULY",
  class: "III",
  rollNo: "08",
  session: "2025-26",
  yearLabel: "ANNUAL",
  // English Lit/Lang split - each cell has 2 inputs stacked
  en_fa2_lit: "13",
  en_fa2_lang: "7.5",
  en_proj_lit: "10",
  en_proj_lang: "8.5",
  en_ct_lit: "9",
  en_ct_lang: "7.5",
  en_sa2_lit: "24.5",
  en_sa2_lang: "25",
  en_ct2_lit: "9",
  en_ct2_lang: "6.5",
  en_viva_lit: "7",
  en_viva_lang: "7",
  // 2nd language
  lang2_fa2: "8.5",
  lang2_proj: "7.5",
  lang2_ct: "6.5",
  lang2_sa2: "21.5",
  lang2_ct2: "6.5",
  lang2_viva: "7.5",
  // 3rd language
  lang3_fa2: "-",
  lang3_proj: "-",
  lang3_ct: "-",
  lang3_sa2: "-",
  lang3_ct2: "-",
  lang3_viva: "-",
  // Maths
  maths_fa2: "10",
  maths_proj: "9",
  maths_ct: "8",
  maths_sa2: "29",
  maths_ct2: "9.5",
  maths_viva: "9",
  // EVS
  evs_fa2: "8.5",
  evs_proj: "6",
  evs_ct: "8",
  evs_sa2: "26.5",
  evs_ct2: "5.5",
  evs_viva: "9",
  // SST
  sst_fa2: "9",
  sst_proj: "8",
  sst_ct: "9",
  sst_sa2: "31",
  sst_ct2: "4",
  sst_viva: "6.5",
  // Computer - has W/P split in some cells but we keep as single text
  comp_fa2: "17.5(W) 9(P)",
  comp_proj: "8.5",
  comp_ct: "8.5",
  comp_sa2: "22.5(W) 6.5(P)",
  comp_ct2: "7",
  comp_viva: "7",
  // Other subjects
  life_skill: "20/20",
  gk: "18/20",
  // signatures
  principalName: "Zariin",
}

export default function ProgressReportCard({
  data,
  onChange,
  editable = true,
  config,
}: {
  data: ProgressData
  onChange?: (key: string, value: string) => void
  editable?: boolean
  config?: ProgressTemplateConfig
}) {
  const { info: schoolInfo } = useSchoolInfo()
  const logoSrc = schoolInfo.logoSrc || ""
  const cfg = config || DEFAULT_PROGRESS_CONFIG

  const cell = (k: string) =>
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

  const stacked = (k1: string, k2: string) =>
    editable ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <input
          value={data[k1] ?? ""}
          onChange={(e) => onChange?.(k1, e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", border: "1px solid transparent", background: "transparent", textAlign: "center", fontFamily: "inherit", fontSize: 13, padding: "4px 2px", color: "#111" }}
        />
        <input
          value={data[k2] ?? ""}
          onChange={(e) => onChange?.(k2, e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", border: "1px solid transparent", background: "transparent", textAlign: "center", fontFamily: "inherit", fontSize: 13, padding: "4px 2px", color: "#111" }}
        />
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 13, textAlign: "center" as const }}>
        <span>{data[k1] ?? ""}</span>
        <span>{data[k2] ?? ""}</span>
      </div>
    )

  return (
    <div className="progress-report-root">
      <style>{`
        .progress-report-root .page {
          max-width: 1050px;
          background: #fff;
          margin: 0 auto 30px auto;
          padding: 40px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .progress-report-root .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .progress-report-root .header h1 { margin: 5px 0; font-size: 28px; font-weight: 700; }
        .progress-report-root .header h4 { margin: 5px 0; font-size: 14px; font-weight: normal; line-height: 1.4; }
        .progress-report-root .header h2 { margin: 12px 0 0; text-decoration: underline; font-size: 20px; }
        .progress-report-root .student-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px 30px;
          margin-bottom: 20px;
          font-size: 15px;
          font-weight: bold;
        }
        .progress-report-root .info-group { display: flex; align-items: flex-end; }
        .progress-report-root .info-group label { margin-right: 10px; white-space: nowrap; }
        .progress-report-root .info-group input {
          flex-grow: 1;
          border: none;
          border-bottom: 1px dotted #000;
          font-size: 16px;
          font-weight: bold;
          padding: 2px 5px;
          font-family: inherit;
          background: transparent;
        }
        .progress-report-root table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
          font-size: 13px;
        }
        .progress-report-root th, .progress-report-root td {
          border: 1px solid #000;
          padding: 4px;
          text-align: center;
          vertical-align: middle;
        }
        .progress-report-root th { background-color: #fcfcfc; font-weight: bold; }
        .progress-report-root .text-left { text-align: left; padding-left: 8px; }
        .progress-report-root td input {
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
        .progress-report-root td input:focus, .progress-report-root .info-group input:focus {
          outline: none;
          border: 1px solid #007bff !important;
          background-color: #f0f8ff !important;
        }
        .progress-report-root .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          text-align: center;
          font-weight: bold;
          gap: 20px;
        }
        .progress-report-root .signatures div {
          border-top: 1px solid #000;
          flex: 1;
          padding-top: 5px;
          font-size: 13px;
        }
        .progress-report-root .signatures input {
          border: none;
          text-align: center;
          font-family: cursive;
          display: block;
          margin: auto;
          background: transparent;
          width: 100%;
        }
        @media print {
          .progress-report-root .page { box-shadow: none; margin: 0; padding: 20px; }
          .progress-report-root td input, .progress-report-root .info-group input { border: 1px solid transparent !important; }
        }
      `}</style>

      <div className="page">
        <div className="header page2-header" style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: "2px solid #000", paddingBottom: 15, marginBottom: 20 }}>
          <div style={{ flex: "0 0 150px", textAlign: "center", borderRight: "1px solid #e5e7eb", paddingRight: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="school logo" style={{ maxHeight: 90, maxWidth: 130, objectFit: "contain", display: "block" }} />
            ) : (
              <div style={{ height: 90, width: 110, border: "1px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#9ca3af" }}>Logo</div>
            )}
          </div>
          <div style={{ flex: 1, textAlign: "center", paddingLeft: 12 }}>
            <h1 style={{ margin: "4px 0", fontSize: 26, fontWeight: 700 }}>{cfg.header.schoolName}</h1>
            <h4 style={{ margin: "4px 0", fontSize: 13, fontWeight: 400, lineHeight: 1.4 }}>{cfg.header.board}<br />{cfg.header.address}</h4>
            <h2 style={{ margin: "8px 0 0", textDecoration: "underline", fontSize: 20, fontWeight: 700 }}>{cfg.header.title}</h2>
          </div>
        </div>

        <div className="student-info">
          <div className="info-group">
            <label>Student&apos;s Name:</label>
            {editable ? <input value={data.studentName ?? ""} onChange={(e) => onChange?.("studentName", e.target.value)} /> : <span style={{ flexGrow: 1, borderBottom: "1px dotted #000", padding: "2px 5px", fontWeight: 700 }}>{data.studentName ?? ""}</span>}
          </div>
          <div className="info-group" style={{ display: "flex", gap: 8 }}>
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
            <label>Session:</label>
            {editable ? <input value={data.session ?? ""} onChange={(e) => onChange?.("session", e.target.value)} /> : <span style={{ flexGrow: 1, borderBottom: "1px dotted #000", padding: "2px 5px", fontWeight: 700 }}>{data.session ?? ""}</span>}
          </div>
        </div>

        <h3 style={{ textAlign: "center", textDecoration: "underline", fontSize: 16, fontWeight: 700, margin: "10px 0" }}>{editable ? <input value={data.yearLabel ?? cfg.yearLabel} onChange={(e) => onChange?.("yearLabel", e.target.value)} style={{ border: "none", borderBottom: "1px solid #000", width: 120, textAlign: "center", fontWeight: 700, fontSize: 16, background: "transparent" }} /> : <span>{data.yearLabel || cfg.yearLabel}</span>}</h3>

        <table>
          <thead>
            <tr>
              <th rowSpan={2}>SUBJECTS</th>
              <th colSpan={3}>Formative - II</th>
              <th colSpan={3}>Summative - II</th>
            </tr>
            <tr>
              <th style={{ fontSize: 11 }}>F.A. 2<br />(20)</th>
              <th style={{ fontSize: 11 }}>Project/<br />Worksheet/<br />Group Activity<br />(10)</th>
              <th style={{ fontSize: 11 }}>Class<br />Test<br />(10)</th>
              <th style={{ fontSize: 11 }}>S.A. 2<br />(40)</th>
              <th style={{ fontSize: 11 }}>Class<br />Test<br />(10)</th>
              <th style={{ fontSize: 11 }}>VIVA<br />(10)</th>
            </tr>
          </thead>
          <tbody>
            {cfg.subjects.map((sub) => (
              <tr key={sub.id}>
                <td className="text-left" style={{ whiteSpace: "pre-line" }}>{sub.label}</td>
                {sub.hasSplit ? (
                  <>
                    <td>{stacked(`${sub.id}_fa2_lit`, `${sub.id}_fa2_lang`)}</td>
                    <td>{stacked(`${sub.id}_proj_lit`, `${sub.id}_proj_lang`)}</td>
                    <td>{stacked(`${sub.id}_ct_lit`, `${sub.id}_ct_lang`)}</td>
                    <td>{stacked(`${sub.id}_sa2_lit`, `${sub.id}_sa2_lang`)}</td>
                    <td>{stacked(`${sub.id}_ct2_lit`, `${sub.id}_ct2_lang`)}</td>
                    <td>{stacked(`${sub.id}_viva_lit`, `${sub.id}_viva_lang`)}</td>
                  </>
                ) : (
                  <>
                    <td>{cell(`${sub.id}_fa2`)}</td>
                    <td>{cell(`${sub.id}_proj`)}</td>
                    <td>{cell(`${sub.id}_ct`)}</td>
                    <td>{cell(`${sub.id}_sa2`)}</td>
                    <td>{cell(`${sub.id}_ct2`)}</td>
                    <td>{cell(`${sub.id}_viva`)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <table style={{ width: "50%", marginTop: 30 }}>
          <thead>
            <tr><th colSpan={2}>Other Subjects:</th></tr>
          </thead>
          <tbody>
            {cfg.otherSubjects.map((o) => (
              <tr key={o.id}>
                <td className="text-left" style={{ width: "70%" }}>{o.label}</td>
                <td>{cell(o.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="signatures">
          <div>Class Teacher&apos;s Signature</div>
          <div>Parent&apos;s Signature</div>
          <div>
            {editable ? (
              <input value={data.principalName ?? ""} onChange={(e) => onChange?.("principalName", e.target.value)} style={{ border: "none", textAlign: "center", fontFamily: "cursive", display: "block", margin: "auto", width: "100%", fontWeight: 700 }} />
            ) : (
              <span style={{ fontFamily: "cursive", fontWeight: 700 }}>{data.principalName ?? ""}</span>
            )}
            <div style={{ marginTop: 4, borderTop: "none" }}>{cfg.principalLabel}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
