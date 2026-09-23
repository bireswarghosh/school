"use client"

import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react"

export type RegistrationFormData = Record<string, string>

export const EMPTY_REGISTRATION_FORM: RegistrationFormData = {
  headerSlNo: "",
  headerSessionStart: "",
  headerSessionEnd: "",
  headerRegNo: "",
  sessionFrom: "",
  sessionTo: "",
  seekingClass: "",
  studentName: "",
  gender: "",
  dob: "",
  religion: "",
  languages: "",
  studentEmail: "",
  whatsappNo: "",
  fatherName: "",
  fatherOccupation: "",
  fatherQualification: "",
  fatherDesignation: "",
  fatherOfficeAddress: "",
  fatherMobile: "",
  fatherMonthlyIncome: "",
  fatherOfficePhone: "",
  fatherEmail: "",
  motherName: "",
  motherOccupation: "",
  motherQualification: "",
  motherDesignation: "",
  motherOfficeAddress: "",
  motherMobile: "",
  motherEmail: "",
  motherOfficePhone: "",
  permanentAddress: "",
  residentialAddress: "",
  guardianName: "",
  guardianAddress: "",
  guardianMobile: "",
  lastSchool: "",
  tcAttached: "",
  otherInfo1: "",
  otherInfo2: "",
  signatureMother: "",
  signatureMotherMode: "",
  signatureFather: "",
  signatureFatherMode: "",
  studentPhoto: "",
  formDate: "",
  officeTotalFees: "",
  officeRegNo: "",
  officeReceiverSignature: "",
}

const REG_CSS = `
  .sj-reg * { box-sizing: border-box; }
  .sj-reg .form-wrapper { background-color: #fff; max-width: 850px; margin: 0 auto; padding: 40px; border: 1px solid #888; box-shadow: 0 4px 10px rgba(0,0,0,0.1); color: #000; }
  .sj-reg .header-top { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-bottom: 10px; }
  .sj-reg .header-main { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 15px; }
  .sj-reg .logo-container { width: 20%; display: flex; justify-content: center; }
  .sj-reg .logo-placeholder { border: 2px solid #555; background: #eee; width: 100px; height: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 5px 5px 50% 50%; text-align: center; }
  .sj-reg .logo-placeholder span { font-weight: bold; font-size: 28px; font-family: "Times New Roman", Times, serif; }
  .sj-reg .logo-placeholder small { font-size: 9px; margin-top: 5px; }
  .sj-reg .school-info { width: 60%; text-align: center; }
  .sj-reg .school-info h4 { margin: 0 0 5px 0; font-style: italic; font-weight: normal; }
  .sj-reg .school-info h1 { margin: 0; font-size: 26px; color: #000; font-family: "Times New Roman", Times, serif; letter-spacing: 1px; }
  .sj-reg .school-info h3 { margin: 4px 0; font-size: 15px; }
  .sj-reg .school-info p { margin: 2px 0; font-size: 13px; }
  .sj-reg .photo-box { width: 130px; height: 150px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 12px; padding: 10px; }
  .sj-reg .form-title { text-align: center; font-size: 18px; font-weight: bold; margin-top: 10px; }
  .sj-reg .form-title-inputs { display: inline-block; width: 30px; border: none; border-bottom: 1px solid #000; text-align: center; font-weight: bold; outline: none; font-family: inherit; }
  .sj-reg .form-subtitle { text-align: center; font-size: 12px; margin-bottom: 25px; }
  .sj-reg .input-group { display: flex; align-items: baseline; margin-bottom: 12px; width: 100%; }
  .sj-reg .input-group label { font-weight: bold; margin-right: 8px; white-space: nowrap; font-size: 14px; }
  .sj-reg .sj-reg-span2 { grid-column: span 2; }
  .sj-reg .line-input { border: none; border-bottom: 1px dotted #000; flex-grow: 1; background: transparent; font-size: 14px; padding: 2px 5px; outline: none; font-family: inherit; color: #000; min-width: 0; }
  .sj-reg .line-input:focus { border-bottom: 1px solid #000; }
  .sj-reg .line-input:disabled { cursor: default; }
  .sj-reg select.line-input { -webkit-appearance: none; appearance: none; }
  .sj-reg input[type="date"].line-input { min-height: 26px; }
  .sj-reg .flex-row { display: flex; gap: 20px; margin-bottom: 12px; }
  .sj-reg .flex-row .input-group { margin-bottom: 0; }
  .sj-reg .section-title { font-weight: bold; font-size: 14px; margin: 15px 0 10px 0; }
  .sj-reg .grid-layout { display: grid; grid-template-columns: 1fr 1fr; column-gap: 30px; row-gap: 12px; }
  .sj-reg ul { margin: 5px 0 15px 25px; padding: 0; color: #000; }
  .sj-reg ul li { margin-bottom: 6px; font-size: 13px; line-height: 1.4; text-align: justify; color: #000; }
  .sj-reg .signature-area { display: flex; justify-content: space-between; gap: 20px; margin-top: 50px; margin-bottom: 30px; }
  .sj-reg .sj-sigbox { width: 40%; border-top: 1px dashed #000; text-align: center; padding-top: 10px; font-weight: bold; font-size: 14px; }
  .sj-reg .sig-actions { display: flex; gap: 6px; justify-content: center; margin-bottom: 8px; }
  .sj-reg .sig-mode-btn { font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 999px; border: 1px solid #999; background: #fff; color: #555; cursor: pointer; }
  .sj-reg .sig-mode-btn.active { background: var(--primary, #ff7732); border-color: var(--primary, #ff7732); color: #fff; }
  .sj-reg .sig-mode-btn:disabled { opacity: .5; cursor: not-allowed; }
  .sj-reg .sig-canvas { border: 1px dashed #000; border-radius: 4px; background: #fff; display: block; margin: 0 auto; touch-action: none; }
  .sj-reg .sig-canvas-wrap { position: relative; display: inline-block; }
  .sj-reg .sig-clear { display: block; margin: 6px auto 0; font-size: 11px; color: #c00; border: none; background: none; cursor: pointer; text-decoration: underline; }
  .sj-reg .sig-label { margin-top: 6px; font-weight: bold; font-size: 13px; }
  .sj-reg .sig-input { border: none; border-bottom: 1px dashed #000; width: 100%; background: transparent; text-align: center; font-family: inherit; font-size: 14px; outline: none; padding: 2px; color: #000; }
  .sj-reg .date-line { margin-top: 20px; font-weight: bold; }
  .sj-reg .office-use-box { border: 2px solid #000; padding: 20px; margin-top: 30px; }
  .sj-reg .office-use-box h4 { text-align: center; margin: 0 0 20px 0; font-size: 14px; }
  .sj-reg .office-flex { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; }
  .sj-reg .office-sig { width: 30%; border-top: 1px dashed #000; text-align: center; padding-top: 5px; font-weight: bold; }
  .sj-reg .office-oinline { border: none; border-bottom: 1px dotted #000; outline: none; font-family: inherit; color: #000; background: transparent; }
  .sj-reg .header-oinline { width: 100px; border: none; border-bottom: 1px dotted #000; outline: none; }
  .sj-reg .radio-inline { font-weight: normal !important; margin: 0 4px 0 8px !important; }
  .sj-reg input[readonly] { cursor: default; }
  .sj-reg .photo-preview { width: 128px; height: 146px; object-fit: cover; border-radius: 4px; display: block; }
  .sj-reg .photo-preview-wrap { position: relative; display: flex; flex-direction: column; align-items: center; gap: 5px; }
  .sj-reg .photo-replace { font-size: 10px; border: none; background: rgba(0,0,0,.65); color: #fff; padding: 3px 10px; border-radius: 999px; cursor: pointer; }
  .sj-reg .photo-empty { font-size: 11px; display: flex; flex-direction: column; gap: 7px; align-items: center; }
  .sj-reg .photo-upload-btn { font-size: 11px; font-weight: 600; border: 1px solid var(--primary, #ff7732); color: var(--primary, #ff7732); background: #fff; padding: 5px 12px; border-radius: 999px; cursor: pointer; }
  .sj-reg .photo-input { display: none; }
  .sj-reg .sj-img-logo { max-width: 100px; max-height: 110px; object-fit: contain; border-radius: 4px; }
  .sj-reg .form-wrapper { position: relative; }
  .sj-reg .sj-admitted-stamp {
    position: absolute; top: 250px; right: -18px; z-index: 6;
    transform: rotate(-18deg); pointer-events: none;
    border: 4px solid #16a34a; color: #15803d; background: rgba(220,252,231,.55);
    font-weight: 800; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;
    text-align: center; padding: 12px 28px; border-radius: 14px;
    text-shadow: 0 0 3px #fff; box-shadow: 0 4px 18px rgba(22,163,74,.25);
  }
  @media print {
    .sj-reg .sj-admitted-stamp { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  @media print {
    body * { visibility: hidden !important; }
    .sj-reg, .sj-reg * { visibility: visible !important; overflow: visible !important; max-height: none !important; }
    .sj-reg .form-wrapper { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 100% !important; box-shadow: none !important; border: none !important; padding: 24px !important; }
    .\\max-h-\\[92vh\\] { max-height: none !important; overflow: visible !important; }
    .sj-reg .photo-input, .sj-reg .photo-upload-btn, .sj-reg .photo-replace, .sj-reg .sig-mode-btn, .sj-reg .sig-clear { display: none !important; }
    .sj-reg .sj-sigbox { border-top: 1px dashed #000 !important; }
  }
`

type FieldProps = {
  name: keyof RegistrationFormData
  value: RegistrationFormData
  onChange: (next: RegistrationFormData) => void
  readOnly?: boolean
  label?: string
  type?: string
  divCls?: string
  gRow?: boolean
  placeholder?: string
}

function Field({ name, value, onChange, readOnly, label, type, divCls, gRow, placeholder }: FieldProps) {
  return (
    <div className={`input-group${divCls ? ` ${divCls}` : ""}${gRow ? " sj-reg-span2" : ""}`}>
      {label != null && <label>{label}</label>}
      <input
        className="line-input"
        name={String(name)}
        type={type || "text"}
        value={value[name] || ""}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ ...value, [name]: e.target.value })}
      />
    </div>
  )
}

type SelectFieldProps = {
  name: keyof RegistrationFormData
  value: RegistrationFormData
  onChange: (next: RegistrationFormData) => void
  readOnly?: boolean
  label?: string
  options: string[]
  divCls?: string
  placeholder?: string
}

function SelectField({ name, value, onChange, readOnly, label, options, divCls, placeholder }: SelectFieldProps) {
  return (
    <div className={`input-group${divCls ? ` ${divCls}` : ""}`}>
      {label != null && <label>{label}</label>}
      <select
        className="line-input"
        name={String(name)}
        value={value[name] || ""}
        disabled={readOnly}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange({ ...value, [name]: e.target.value })}
      >
        <option value="">{placeholder || "Select"}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

type DateFieldProps = FieldProps

function DateField(props: DateFieldProps) {
  return <Field {...props} type="date" />
}

type SignaturePadProps = {
  name: keyof RegistrationFormData
  modeName: keyof RegistrationFormData
  label: string
  value: RegistrationFormData
  onChange: (next: RegistrationFormData) => void
  readOnly?: boolean
}

function SignaturePad({ name, modeName, label, value, onChange, readOnly }: SignaturePadProps) {
  const initialMode: "type" | "draw" = value[modeName] === "draw" ? "draw" : "type"
  const [mode, setMode] = useState<"type" | "draw">(initialMode)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  useEffect(() => {
    const c = canvasRef.current
    if (!c || mode !== "draw") return
    const ctx = c.getContext("2d")
    if (!ctx) return
    const saved = value[name]
    if (saved && saved.startsWith("data:image")) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, c.width, c.height)
        ctx.drawImage(img, 0, 0, c.width, c.height)
      }
      img.src = saved
    } else {
      ctx.clearRect(0, 0, c.width, c.height)
    }
  }, [mode, value, name])

  const switchMode = (m: "type" | "draw") => {
    if (readOnly) return
    setMode(m)
    if (m === "type") onChange({ ...value, [modeName]: "type", [name]: value[name]?.startsWith("data:image") ? "" : value[name] })
    else onChange({ ...value, [modeName]: "draw" })
  }

  const start = (e: PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return
    const c = canvasRef.current
    if (!c) return
    drawing.current = true
    const ctx = c.getContext("2d")
    if (!ctx) return
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    const r = c.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - r.left, e.clientY - r.top)
    c.setPointerCapture?.(e.pointerId)
  }

  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    const r = c.getBoundingClientRect()
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top)
    ctx.stroke()
  }

  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    const c = canvasRef.current
    if (!c) return
    onChange({ ...value, [name]: c.toDataURL("image/png"), [modeName]: "draw" })
  }

  const clear = () => {
    if (readOnly) return
    const c = canvasRef.current
    const ctx = c?.getContext("2d")
    if (ctx && c) ctx.clearRect(0, 0, c.width, c.height)
    onChange({ ...value, [name]: "", [modeName]: "draw" })
  }

  return (
    <div className="sj-sigbox">
      <div className="sig-actions">
        <button type="button" className={`sig-mode-btn${mode === "type" ? " active" : ""}`} onClick={() => switchMode("type")} disabled={readOnly}>
          Type
        </button>
        <button type="button" className={`sig-mode-btn${mode === "draw" ? " active" : ""}`} onClick={() => switchMode("draw")} disabled={readOnly}>
          Draw
        </button>
      </div>
      {mode === "draw" ? (
        <div>
          <div className="sig-canvas-wrap">
            <canvas
              ref={canvasRef}
              width={210}
              height={90}
              className="sig-canvas"
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
            />
          </div>
          <button type="button" className="sig-clear" onClick={clear} disabled={readOnly}>
            Clear
          </button>
        </div>
      ) : (
        <input
          className="sig-input"
          name={String(name)}
          value={value[name] || ""}
          readOnly={readOnly}
          placeholder={readOnly ? (value[name] ? "" : "—") : "Type signature"}
          onChange={(e) => onChange({ ...value, [name]: e.target.value, [modeName]: "type" })}
        />
      )}
      <div className="sig-label">{label}</div>
    </div>
  )
}

type PhotoBoxProps = {
  name: keyof RegistrationFormData
  value: RegistrationFormData
  onChange: (next: RegistrationFormData) => void
  readOnly?: boolean
}

function PhotoBox({ name, value, onChange, readOnly }: PhotoBoxProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const hasPhoto = Boolean(value[name])

  const readFile = (file: File) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const maxW = 320
      const maxH = 400
      let w = img.width
      let h = img.height
      if (w > maxW) { h = (h * maxW) / w; w = maxW }
      if (h > maxH) { w = (w * maxH) / h; h = maxH }
      const canvas = document.createElement("canvas")
      canvas.width = Math.max(1, Math.round(w))
      canvas.height = Math.max(1, Math.round(h))
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      URL.revokeObjectURL(url)
      onChange({ ...value, [name]: canvas.toDataURL("image/webp", 0.85) })
      setBusy(false)
    }
    img.onerror = () => { URL.revokeObjectURL(url); setBusy(false) }
    img.src = url
  }

  return (
    <div className="photo-box">
      {hasPhoto ? (
        <div className="photo-preview-wrap">
          <img src={value[name]} alt="Student photo" className="photo-preview" />
          {!readOnly && (
            <button type="button" className="photo-replace" onClick={() => fileRef.current?.click()}>
              Replace
            </button>
          )}
        </div>
      ) : readOnly ? (
        <div className="photo-empty">No photo attached</div>
      ) : (
        <div className="photo-empty">
          Affix a recent passport size photo of the Student.
          <button type="button" className="photo-upload-btn" onClick={() => fileRef.current?.click()}>
            {busy ? "Uploading..." : "Upload photo"}
          </button>
        </div>
      )}
      {!readOnly && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="photo-input"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            setBusy(true)
            readFile(f)
            e.target.value = ""
          }}
        />
      )}
    </div>
  )
}

type RegistrationFormProps = {
  value: RegistrationFormData
  onChange: (next: RegistrationFormData) => void
  readOnly?: boolean
  regNo?: string
  logoSrc?: string
  admitted?: boolean
}

export default function RegistrationForm({ value, onChange, readOnly = false, regNo, logoSrc, admitted = false }: RegistrationFormProps) {
  return (
    <div className="sj-reg">
      <style>{REG_CSS}</style>
      <div className="form-wrapper">
        {admitted && (
          <div className="sj-admitted-stamp">
            Admission Confirmed
          </div>
        )}
        <div className="header-top">
          <div>
            SL. NO{" "}
            <input
              className="header-oinline"
              value={value.headerSlNo || ""}
              readOnly={readOnly}
              onChange={(e) => onChange({ ...value, headerSlNo: e.target.value })}
            />{" "}
            /SJ/Adm 20
            <input
              className="header-oinline"
              style={{ width: 30 }}
              maxLength={2}
              value={value.headerSessionStart || ""}
              readOnly={readOnly}
              onChange={(e) => onChange({ ...value, headerSessionStart: e.target.value })}
            />{" "}
            - 20
            <input
              className="header-oinline"
              style={{ width: 30 }}
              maxLength={2}
              value={value.headerSessionEnd || ""}
              readOnly={readOnly}
              onChange={(e) => onChange({ ...value, headerSessionEnd: e.target.value })}
            />
          </div>
          <div style={{ textAlign: "right" }}>
            Registration No.{" "}
            {regNo ? (
              <b>{regNo}</b>
            ) : (
              <input
                className="header-oinline"
                style={{ width: 150 }}
                value={value.headerRegNo || ""}
                readOnly={readOnly}
                onChange={(e) => onChange({ ...value, headerRegNo: e.target.value })}
              />
            )}
            <br />
            <span style={{ fontWeight: "normal", fontSize: 12 }}>(For Office Use Only)</span>
          </div>
        </div>

        <div className="header-main">
          <div className="logo-container">
            {logoSrc ? (
              <img src={logoSrc} alt="School logo" className="sj-img-logo" />
            ) : (
              <div className="logo-placeholder">
                <small>&quot;The Future begins here&quot;</small>
                <span>StJ</span>
                <small>Estd: 2020</small>
              </div>
            )}
          </div>

          <div className="school-info">
            <h4>&quot;The Future begins here&quot;</h4>
            <h1>ST. JONAS CONVENT SCHOOL</h1>
            <h3>I.C.S.E (New Delhi)</h3>
            <p>(Co.Ed., English Medium School)</p>
            <p>Regn. No. SO007105 of 2019 - 2020</p>
            <p>Udang, Amta, Howrah - 711401 | 📞 7364859830 / 9083916403</p>
            <p>🌐 www.stjonas.org &nbsp;&nbsp; ✉️ stjonasconventschool@gmail.com</p>
          </div>

          <PhotoBox name="studentPhoto" value={value} onChange={onChange} readOnly={readOnly} />
        </div>

        <div className="form-title">
          REGISTRATION FORM FOR THE SESSION 20
          <input
            className="form-title-inputs"
            maxLength={2}
            value={value.sessionFrom || ""}
            readOnly={readOnly}
            onChange={(e) => onChange({ ...value, sessionFrom: e.target.value })}
          />{" "}
          - 20
          <input
            className="form-title-inputs"
            maxLength={2}
            value={value.sessionTo || ""}
            readOnly={readOnly}
            onChange={(e) => onChange({ ...value, sessionTo: e.target.value })}
          />
        </div>
        <div className="form-subtitle">(to be filled in neatly and in BLOCK LETTERS ONLY)</div>

        <Field name="seekingClass" label="1. Seeking Admission to Class :" value={value} onChange={onChange} readOnly={readOnly} />

        <div className="flex-row">
          <Field name="studentName" label="2. Name of Student:" divCls="sj-reg-flex2" value={value} onChange={onChange} readOnly={readOnly} />
          <SelectField
            name="gender"
            label="Gender:"
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            options={["Male", "Female", "Others"]}
          />
        </div>

        <div className="flex-row">
          <DateField name="dob" label="3. Date of Birth:" value={value} onChange={onChange} readOnly={readOnly} />
          <SelectField
            name="religion"
            label="Religion:"
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            options={["Hinduism", "Islam", "Christianity", "Sikhism", "Buddhism", "Prefer not to say"]}
          />
        </div>

        <Field name="languages" label="4. Language(s) spoken at home:" value={value} onChange={onChange} readOnly={readOnly} />

        <div className="flex-row">
          <Field name="studentEmail" label="5. Email id :" type="email" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="whatsappNo" label="WhatsApp No.:" value={value} onChange={onChange} readOnly={readOnly} />
        </div>

        <div className="section-title">6. Details of Father:</div>
        <div className="grid-layout">
          <Field name="fatherName" label="Name:" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="fatherOccupation" label="Occupation:" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="fatherQualification" label="Qualification:" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="fatherDesignation" label="Designation:" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="fatherOfficeAddress" label="Office Address:" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="fatherMobile" label="Mobile No.:" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="fatherMonthlyIncome" label="Monthly Income:" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="fatherOfficePhone" label="Office Phone No.:" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="fatherEmail" label="Email Id :" type="email" gRow value={value} onChange={onChange} readOnly={readOnly} />
        </div>

        <div className="section-title">7. Details of Mother :</div>
        <div className="grid-layout">
          <Field name="motherName" label="Name :" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="motherOccupation" label="Occupation:" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="motherQualification" label="Qualification:" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="motherDesignation" label="Designation:" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="motherOfficeAddress" label="Office Address:" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="motherMobile" label="Mobile No.:" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="motherEmail" label="Email Id :" type="email" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="motherOfficePhone" label="Office Phone No.:" value={value} onChange={onChange} readOnly={readOnly} />
        </div>

        <div className="section-title">8. Details of Residence :</div>
        <Field name="permanentAddress" label="Permanent Address :" value={value} onChange={onChange} readOnly={readOnly} />
        <Field name="residentialAddress" label="Residential Address :" value={value} onChange={onChange} readOnly={readOnly} />

        <div className="section-title">9. Name of Guardians (if any):</div>
        <div className="input-group">
          <input
            className="line-input"
            style={{ width: "100%", marginBottom: 12 }}
            name="guardianName"
            value={value.guardianName || ""}
            readOnly={readOnly}
            onChange={(e) => onChange({ ...value, guardianName: e.target.value })}
          />
        </div>
        <div className="flex-row">
          <Field name="guardianAddress" label="Address:" divCls="sj-reg-flex2" value={value} onChange={onChange} readOnly={readOnly} />
          <Field name="guardianMobile" label="Mobile No.:" value={value} onChange={onChange} readOnly={readOnly} />
        </div>

        <div className="input-group" style={{ marginTop: 10 }}>
          <label>10. Name of the School last attended and the class in which the student is presently studying :</label>
        </div>
        <div className="input-group">
          <input
            className="line-input"
            style={{ width: "100%" }}
            name="lastSchool"
            value={value.lastSchool || ""}
            readOnly={readOnly}
            onChange={(e) => onChange({ ...value, lastSchool: e.target.value })}
          />
        </div>

        <div className="input-group" style={{ marginTop: 10 }}>
          <label>11. Is the applicant&apos;s Transfer Certificate / Migration Certificate attached ?</label>
          <label className="radio-inline">
            <input
              type="radio"
              name="tcAttached"
              value="Yes"
              disabled={readOnly}
              checked={(value.tcAttached || "") === "Yes"}
              onChange={() => onChange({ ...value, tcAttached: "Yes" })}
            />{" "}
            Yes
          </label>
          <label className="radio-inline">
            <input
              type="radio"
              name="tcAttached"
              value="No"
              disabled={readOnly}
              checked={(value.tcAttached || "") === "No"}
              onChange={() => onChange({ ...value, tcAttached: "No" })}
            />{" "}
            No
          </label>
        </div>

        <div className="input-group" style={{ marginTop: 10 }}>
          <label>12. Is there any other information you would like to furnish about your son / daughter ? If yes, describe briefly :</label>
        </div>
        <div className="input-group">
          <input
            className="line-input"
            style={{ width: "100%" }}
            name="otherInfo1"
            value={value.otherInfo1 || ""}
            readOnly={readOnly}
            onChange={(e) => onChange({ ...value, otherInfo1: e.target.value })}
          />
        </div>
        <div className="input-group">
          <input
            className="line-input"
            style={{ width: "100%" }}
            name="otherInfo2"
            value={value.otherInfo2 || ""}
            readOnly={readOnly}
            onChange={(e) => onChange({ ...value, otherInfo2: e.target.value })}
          />
        </div>

        <div className="section-title" style={{ marginTop: 25 }}>RULES &amp; REGULATIONS</div>
        <ul>
          <li>Admission is subject to qualifying in the Admission Interview / Test. The test results are final and binding.[cite: 1]</li>
          <li>Original Birth Certificate issued by the Gram Panchayat / Municipality / Hospital should be presented for verification of age at the time of submission of Admission Forms. A photocopy of the Birth Certificate, duly attested by a Gazette Officer or a school Principal must be attached with this form.[cite: 1]</li>
          <li>Original Aadhaar Card of the Student and both the parents should be presented for verification at the time of form submission.[cite: 1]</li>
          <li>The School Fees are subject to increase as needed.[cite: 1]</li>
          <li>Money deposited during admission is neither adjustable nor refundable.[cite: 1]</li>
          <li>In case of withdrawal of students, parents should give an application in writing at-least two calendar months prior or pay the fees for two succeeding months in cash.[cite: 1]</li>
        </ul>

        <div className="section-title">DECLARATION BY PARENTS</div>
        <ul>
          <li>I hereby promise to pay the fees and charges levied by the school as per the rules and conditions of admission.[cite: 1]</li>
          <li>I hereby declare that the particulars entered by me on this form are all true to the best of my knowledge and belief.[cite: 1]</li>
          <li>I shall abide by all the Rules &amp; Regulations of the school.[cite: 1]</li>
          <li>I understand that the school fees are liable to increase as needed and I have no objection to the same.[cite: 1]</li>
          <li>I hereby declare that I will not claim any money deposited at the time of admission.[cite: 1]</li>
          <li>I will abide by all the rules enforced by the school authority from time to time and cooperate.[cite: 1]</li>
        </ul>

        <div className="signature-area">
          <SignaturePad name="signatureMother" modeName="signatureMotherMode" label="Signature of Mother" value={value} onChange={onChange} readOnly={readOnly} />
          <SignaturePad name="signatureFather" modeName="signatureFatherMode" label="Signature of Father / Guardian" value={value} onChange={onChange} readOnly={readOnly} />
        </div>

        <div className="date-line">
          Date:{" "}
          <input
            type="date"
            className="office-oinline"
            style={{ width: 150, fontFamily: "inherit" }}
            name="formDate"
            value={value.formDate || ""}
            readOnly={readOnly}
            onChange={(e) => onChange({ ...value, formDate: e.target.value })}
          />
        </div>

        <div className="section-title" style={{ marginTop: 25 }}>Documents to be submitted:</div>
        <ul>
          <li>Attested photocopy of Birth Certificate[cite: 1]</li>
          <li>Photocopy of Student&apos;s and Parents&apos; Aadhaar Cards[cite: 1]</li>
          <li>2 Additional Passport-Size Photographs of Applicant[cite: 1]</li>
        </ul>

        <div className="office-use-box">
          <h4>(FOR OFFICE USE ONLY)</h4>
          <div className="office-flex">
            <div style={{ width: "40%", fontWeight: "bold" }}>
              Total Fees Received:{" "}
              <input
                className="office-oinline"
                style={{ width: "60%" }}
                name="officeTotalFees"
                value={value.officeTotalFees || ""}
                readOnly={readOnly}
                onChange={(e) => onChange({ ...value, officeTotalFees: e.target.value })}
              />
              <br />
              <br />
              Regn. No.:{" "}
              <input
                className="office-oinline"
                style={{ width: "75%" }}
                name="officeRegNo"
                value={value.officeRegNo || ""}
                readOnly={readOnly}
                onChange={(e) => onChange({ ...value, officeRegNo: e.target.value })}
              />
            </div>
            <div className="office-sig" style={{ borderTop: "none", textAlign: "center" }}>
              <div style={{ height: 40 }}></div>
              <span style={{ borderTop: "1px dashed #000", display: "block", paddingTop: 5 }}>School Seal</span>
            </div>
            <div className="office-sig">
              <input
                className="sig-input"
                name="officeReceiverSignature"
                value={value.officeReceiverSignature || ""}
                readOnly={readOnly}
                onChange={(e) => onChange({ ...value, officeReceiverSignature: e.target.value })}
              />
              <div className="sig-label">Signature of Receiver</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}