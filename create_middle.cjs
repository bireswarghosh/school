const {Pool}=require('pg');
const url = "postgresql://neondb_owner:npg_gO91MyoLsCkv@ep-super-voice-azabstqs-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const p=new Pool({connectionString: url, ssl: {require:true}});
const cfg = {
  header: {
    schoolName: "St. Jonas Convent School",
    tagline: "The Future begins here",
    estd: "Estd 2020",
    board: "I.C.S.E (New Delhi) | Co-Ed. English Medium School",
    title: "REPORT CARD",
    subtitle: "Class - VI to VIII"
  },
  subjects: [
    { id: "eng_lang", label: "English\n(i) Language" },
    { id: "eng_lit", label: "(ii) Literature" },
    { id: "lang2", label: "2nd Language\n(Hindi/Bengali)" },
    { id: "lang3", label: "3rd Language\n(Hindi/Bengali)" },
    { id: "maths", label: "Mathematics" },
    { id: "phy", label: "Science\n(i) Physics" },
    { id: "chem", label: "(ii) Chemistry" },
    { id: "bio", label: "(iii) Biology" },
    { id: "hist", label: "Social Studies & Civics\n(i) History" },
    { id: "geo", label: "(ii) Geography" },
    { id: "comp", label: "Computer" }
  ],
  personality: [
    { id: "courteous", label: "Courteousness" },
    { id: "confidence", label: "Confidence" },
    { id: "care", label: "Care of belongings" },
    { id: "neatness", label: "Neatness" },
    { id: "regularity", label: "Regularity and Punctuality" }
  ],
  coCurricular: [
    { id: "sports", label: "• Sports" },
    { id: "yoga", label: "• Yoga" },
    { id: "martial", label: "• Martial Arts" },
    { id: "music", label: "• Music" },
    { id: "dance", label: "• Dance" }
  ],
  regularity: [
    { id: "working", label: "Working Days" },
    { id: "present", label: "Days Present" },
    { id: "attendance", label: "Attendance Percentage" }
  ],
  grades: [
    { grade: "A+", marks: "91%-100%", param: "Excellent" },
    { grade: "A", marks: "81%-90%", param: "Very Good" },
    { grade: "B+", marks: "71%-80%", param: "Good" },
    { grade: "B", marks: "61%-70%", param: "Satisfactory" }
  ]
};
(async()=>{
  const name = "Middle School Format (Class VI to VIII)";
  const existing = await p.query("SELECT id, name FROM result_card_templates WHERE school_id=1 AND name=$1", [name]);
  console.log('existing', existing.rows);
  if (existing.rows.length===0) {
    const r=await p.query("INSERT INTO result_card_templates (school_id, name, session, pages, grade_scale, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name", [1, name, "2025-26", JSON.stringify([{ id: "middle-config", label: "Middle Config", config: cfg }]), JSON.stringify([]), true]);
    console.log('created for school 1', r.rows[0]);
    const r2=await p.query("INSERT INTO result_card_templates (school_id, name, session, pages, grade_scale, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name", [2, name, "2025-26", JSON.stringify([{ id: "middle-config", label: "Middle Config", config: cfg }]), JSON.stringify([]), true]);
    console.log('created for school 2', r2.rows[0]);
  } else {
    console.log('already exists');
  }
  const r=await p.query("SELECT id, name FROM result_card_templates WHERE school_id=1 AND name ILIKE '%middle%'");
  console.log('final', r.rows);
  await p.end();
})().catch(e=>{console.error(e); process.exit(1)})
