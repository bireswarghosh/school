const {Pool}=require('pg');
const url = "postgresql://neondb_owner:npg_gO91MyoLsCkv@ep-super-voice-azabstqs-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const p=new Pool({connectionString: url, ssl: {require:true}});
const cfg = {
  header: {
    schoolName: "ST. JONAS CONVENT SCHOOL",
    board: "I.C.S.E (New Delhi)",
    address: "Udang, Amta, Howrah - 711401",
    title: "PROGRESS REPORT"
  },
  yearLabel: "ANNUAL",
  subjects: [
    { id: "en", label: "a) ENGLISH", hasSplit: true },
    { id: "lang2", label: "b) 2nd LANGUAGE", hasSplit: false },
    { id: "lang3", label: "c) 3rd LANGUAGE", hasSplit: false },
    { id: "maths", label: "d) MATHEMATICS", hasSplit: false },
    { id: "evs", label: "e) ENVIRONMENTAL SCIENCE", hasSplit: false },
    { id: "sst", label: "f) SOCIAL STUDIES", hasSplit: false },
    { id: "comp", label: "g) COMPUTER", hasSplit: false }
  ],
  otherSubjects: [
    { id: "life_skill", label: "a) LIFE SKILL" },
    { id: "gk", label: "b) GENERAL KNOWLEDGE" }
  ],
  principalLabel: "Principal's Signature"
};
(async()=>{
  const r=await p.query("UPDATE result_card_templates SET pages=$1 WHERE id IN (9,10) RETURNING id, name", [JSON.stringify([{ id: "progress-config", label: "Progress Config", config: cfg }]),]);
  console.log('updated', r.rows);
  // also check
  const r2=await p.query("SELECT id, name, pages::text FROM result_card_templates WHERE name ILIKE '%progress%'");
  console.log(r2.rows.map(x=> `${x.id}: ${x.name} pages=${x.pages.substring(0,80)}`));
  await p.end();
})().catch(e=>{console.error(e); process.exit(1)})
