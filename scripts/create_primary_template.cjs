const fs=require('fs');
const {Pool}=require('pg');
const p=new Pool({connectionString:'postgresql://postgres:123@localhost/appstrice_school'});

async function main(){
  const schoolId = 1; // Smart School (admin.stjonas.org)
  // Find class IDs for I to V to associate? Use first one or null
  const classRes = await p.query("SELECT id, name FROM classes WHERE school_id=$1 AND name IN ('Class- I','Class- II','Class- III','Class- IV','Class- V') ORDER BY id", [schoolId]);
  console.log('classes I-V', classRes.rows);
  const primaryClassId = classRes.rows[0]?.id || null;

  const pages = [
    {
      id: "page1",
      label: "Page 1 - Main Report Card",
      image: "",
      width: 794,
      height: 1123,
      fields: [
        { id: "f_name", label: "Student Name", type: "text", x: 15, y: 18, w: 35, h: 3, size: 12, bind: "name" },
        { id: "f_class", label: "Class", type: "text", x: 62, y: 18, w: 12, h: 3, size: 12, bind: "class" },
        { id: "f_rollNo", label: "Roll No", type: "text", x: 82, y: 18, w: 12, h: 3, size: 12, bind: "rollNo" },
        { id: "f_motherName", label: "Mother's Name", type: "text", x: 15, y: 21, w: 35, h: 3, size: 11, bind: "motherName" },
        { id: "f_session", label: "Session", type: "text", x: 62, y: 21, w: 32, h: 3, size: 11, bind: "session" },
        { id: "f_fatherName", label: "Father's Name", type: "text", x: 15, y: 24, w: 35, h: 3, size: 11, bind: "fatherName" },
        { id: "f_year", label: "For the year", type: "text", x: 45, y: 27, w: 15, h: 3, size: 12, bind: "session" },
        { id: "f_overall", label: "Overall Marks & Grade", type: "text", x: 10, y: 78, w: 40, h: 3, size: 12, bind: "overall" },
        { id: "f_halfRemark", label: "Half-Yearly Remark", type: "text", x: 10, y: 82, w: 80, h: 4, size: 10, bind: "halfRemark" },
        { id: "f_annualRemark", label: "Annual Remark", type: "text", x: 10, y: 88, w: 80, h: 4, size: 10, bind: "annualRemark" },
        { id: "f_finalResult", label: "Final Result", type: "text", x: 10, y: 94, w: 40, h: 3, size: 12, bind: "finalResult" },
      ],
      tables: [
        {
          id: "academic",
          label: "ACADEMIC PERFORMANCE",
          x: 5, y: 30, w: 90, h: 30, fontSize: 9, rowsKey: "academic",
          cols: [
            { id: "subject", label: "SUBJECTS", type: "text", width: 22 },
            { id: "f1", label: "F1", sub: "Half-Yearly", type: "mark", max: 40 },
            { id: "s1", label: "S1", sub: "Half-Yearly", type: "mark", max: 60 },
            { id: "total1", label: "TOTAL", type: "sum", of: ["f1","s1"] },
            { id: "f2", label: "F2", sub: "Annual", type: "mark", max: 40 },
            { id: "s2", label: "S2", sub: "Annual", type: "mark", max: 60 },
            { id: "total2", label: "TOTAL", type: "sum", of: ["f2","s2"] },
            { id: "ff", label: "F1+F2", type: "sum", of: ["f1","f2"] },
            { id: "ss", label: "S1+S2", type: "sum", of: ["s1","s2"] },
            { id: "overall", label: "Overall Marks & Grade", type: "text" },
          ]
        },
        {
          id: "otherSubjects",
          label: "OTHER SUBJECTS",
          x: 5, y: 62, w: 90, h: 8, fontSize: 9, rowsKey: "otherSubjects",
          cols: [
            { id: "subject", label: "OTHER SUBJECTS", type: "text", width: 35 },
            { id: "half1", label: "Half-Yearly", type: "mark", max: 20 },
            { id: "annual1", label: "Annual", type: "mark", max: 20 },
          ]
        },
        {
          id: "workHabits",
          label: "WORK HABITS",
          x: 5, y: 71, w: 30, h: 12, fontSize: 8, rowsKey: "workHabits",
          cols: [
            { id: "habit", label: "WORK HABITS", type: "text", width: 50 },
            { id: "half", label: "Half-Yearly", type: "mark" },
            { id: "annual", label: "Annual", type: "mark" },
          ]
        },
        {
          id: "social",
          label: "SOCIAL & PERSONAL",
          x: 37, y: 71, w: 30, h: 12, fontSize: 8, rowsKey: "social",
          cols: [
            { id: "item", label: "SOCIAL & PERSONAL", type: "text", width: 50 },
            { id: "half", label: "Half-Yearly", type: "mark" },
            { id: "annual", label: "Annual", type: "mark" },
          ]
        },
        {
          id: "regularity",
          label: "REGULARITY RECORD",
          x: 69, y: 71, w: 26, h: 6, fontSize: 8, rowsKey: "regularity",
          cols: [
            { id: "item", label: "REGULARITY", type: "text", width: 50 },
            { id: "half", label: "Half-Yearly", type: "text" },
            { id: "annual", label: "Annual", type: "text" },
          ]
        },
      ]
    },
    {
      id: "page2",
      label: "Page 2 - Progress Report",
      image: "",
      width: 794,
      height: 1123,
      fields: [
        { id: "f_name2", label: "Student's Name", type: "text", x: 15, y: 15, w: 35, h: 3, size: 12, bind: "name" },
        { id: "f_class2", label: "Class", type: "text", x: 60, y: 15, w: 15, h: 3, size: 12, bind: "class" },
        { id: "f_roll2", label: "Roll No", type: "text", x: 80, y: 15, w: 12, h: 3, size: 12, bind: "rollNo" },
        { id: "f_session2", label: "Session", type: "text", x: 15, y: 18, w: 30, h: 3, size: 11, bind: "session" },
      ],
      tables: [
        {
          id: "progress",
          label: "PROGRESS REPORT - Formative & Summative",
          x: 5, y: 22, w: 90, h: 35, fontSize: 8, rowsKey: "progress",
          cols: [
            { id: "subject", label: "SUBJECTS", type: "text", width: 20 },
            { id: "fa2", label: "F.A.2 (20)", type: "mark", max: 20 },
            { id: "proj", label: "Project (10)", type: "mark", max: 10 },
            { id: "ct1", label: "Class Test (10)", type: "mark", max: 10 },
            { id: "ct2", label: "Class Test (10)", type: "mark", max: 10 },
            { id: "sa2", label: "S.A.2 (40)", type: "mark", max: 40 },
            { id: "viva", label: "VIVA (10)", type: "mark", max: 10 },
          ]
        },
        {
          id: "otherProgress",
          label: "Other Subjects Progress",
          x: 5, y: 60, w: 50, h: 8, fontSize: 8, rowsKey: "otherProgress",
          cols: [
            { id: "subject", label: "Other Subjects", type: "text", width: 50 },
            { id: "marks", label: "Marks", type: "text" },
          ]
        }
      ]
    }
  ];

  const grade_scale = [
    { min: 0, max: 39, label: "D" },
    { min: 40, max: 50, label: "C" },
    { min: 51, max: 60, label: "C+" },
    { min: 61, max: 70, label: "B" },
    { min: 71, max: 80, label: "B+" },
    { min: 81, max: 90, label: "A" },
    { min: 91, max: 100, label: "A+" },
  ];

  // Check if already exists
  const existing = await p.query("SELECT id FROM result_card_templates WHERE school_id=$1 AND name=$2", [schoolId, "Class I - V"]);
  if(existing.rows.length){
    console.log('updating existing', existing.rows[0].id);
    await p.query("UPDATE result_card_templates SET pages=$1, grade_scale=$2, class_id=$3, session=$4, updated_at=NOW() WHERE id=$5", [JSON.stringify(pages), JSON.stringify(grade_scale), primaryClassId, "2025-26", existing.rows[0].id]);
    console.log('updated');
  } else {
    const res = await p.query("INSERT INTO result_card_templates (school_id, name, class_id, session, pages, grade_scale, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id", [schoolId, "Class I - V", primaryClassId, "2025-26", JSON.stringify(pages), JSON.stringify(grade_scale), true]);
    console.log('created', res.rows[0].id);
  }

  // Also create for school 2 if needed
  const school2 = 2;
  const existing2 = await p.query("SELECT id FROM result_card_templates WHERE school_id=$1 AND name=$2", [school2, "Class I - V"]);
  if(!existing2.rows.length){
    const c2 = await p.query("SELECT id FROM classes WHERE school_id=$1 AND name ILIKE '%I%' LIMIT 1", [school2]);
    const cid2 = c2.rows[0]?.id || null;
    await p.query("INSERT INTO result_card_templates (school_id, name, class_id, session, pages, grade_scale, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7)", [school2, "Class I - V", cid2, "2025-26", JSON.stringify(pages), JSON.stringify(grade_scale), true]);
    console.log('created for school 2');
  }

  await p.end();
}
main().catch(e=>{console.error(e); process.exit(1)});
