const {Pool}=require('pg');
const url = "postgresql://neondb_owner:npg_gO91MyoLsCkv@ep-super-voice-azabstqs-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const p=new Pool({connectionString: url, ssl: {require:true}});
const cfg = {
  header: {
    schoolName: "St. Jonas Convent School",
    tagline: "The Future begins here",
    estd: "Estd 2020",
    title: "Report Card",
    subtitle: "Montessori to K.G."
  },
  leftGroups: [
    {
      id: "eng",
      title: "Subject: a) ENGLISH",
      items: [
        { id: "eng_phonic", label: "• Identification of Phonic Sounds" },
        { id: "eng_alpha", label: "• Recognition of Alphabets +\n  Identification of Objects Around" },
        { id: "eng_topic", label: "• Understanding of the Topic" },
        { id: "eng_conv", label: "• Conversational Ability" },
        { id: "eng_strokes", label: "• Basic Strokes / Letters" },
        { id: "eng_write", label: "• Writing Ability + Written Work" },
        { id: "eng_pic", label: "• Picture Reading Ability" },
        { id: "eng_spell", label: "• Spelling Ability" }
      ]
    },
    {
      id: "maths",
      title: "Subject: b) MATHEMATICS",
      items: [
        { id: "maths_num", label: "• Identification of Numbers" },
        { id: "maths_classify", label: "• Classifies Objects with Respect to\n  Numbers" },
        { id: "maths_verbal", label: "• Verbal Counting" },
        { id: "maths_write", label: "• Writing Ability + Written Work" },
        { id: "maths_concept", label: "• Understanding of the Concept" }
      ]
    },
    {
      id: "lang2",
      title: "Subject: c) 2nd LANGUAGE\n              (Bengali / Hindi)",
      items: [
        { id: "lang2_letters", label: "• Identification of Letters" },
        { id: "lang2_topic", label: "• Understanding of the Topic" },
        { id: "lang2_write", label: "• Writing Ability + Written Work" }
      ]
    },
    {
      id: "otherLeft",
      title: "",
      items: [
        { id: "env", label: "c) ENVIRONMENTAL STUDY" },
        { id: "rhymes", label: "d) RHYMES" },
        { id: "art", label: "e) ART & CRAFT WORK" }
      ]
    }
  ],
  rightGroups: [
    {
      id: "work",
      title: "WORK HABITS",
      items: [
        { id: "work_attent", label: "• Attentiveness" },
        { id: "work_eager", label: "• Eagerness to Learn" },
        { id: "work_neat", label: "• Neatness" },
        { id: "work_comp", label: "• Completion of Work" }
      ]
    },
    {
      id: "sensorial",
      title: "SENSORIAL",
      items: [
        { id: "sens_colour", label: "• Recognition of Colours" },
        { id: "sens_shapes", label: "• Recognition of Basic Shapes" },
        { id: "sens_sizes", label: "• Concept of Sizes" },
        { id: "sens_weight", label: "• Determination of Weight of an Object" }
      ]
    },
    {
      id: "social",
      title: "SOCIAL & PERSONAL DEVELOPMENT",
      items: [
        { id: "soc_punct", label: "• Punctuality" },
        { id: "soc_resp", label: "• Sense of Responsibility" },
        { id: "soc_courtesy", label: "• Courtesy & Politeness" },
        { id: "soc_friendly", label: "• Friendly & Cheerful" },
        { id: "soc_response", label: "• Response in Class" },
        { id: "soc_tidy", label: "• Personal Tidiness" }
      ]
    },
    {
      id: "regularity",
      title: "REGULARITY RECORD",
      items: [
        { id: "reg_att", label: "• Attendance" },
        { id: "reg_pct", label: "• Attendance Percentage" }
      ]
    }
  ],
  gradeRows: [
    { grade: "A+", marks: "91% - 100%", remarks: "Excellent" },
    { grade: "A", marks: "81% - 90%", remarks: "Very Good" },
    { grade: "B+", marks: "71% - 80%", remarks: "Good" },
    { grade: "B", marks: "61% - 70%", remarks: "Satisfactory" },
    { grade: "C+", marks: "51% - 60%", remarks: "Average" },
    { grade: "C", marks: "40% - 50%", remarks: "Needs Improvement" },
    { grade: "D", marks: "Below 40%", remarks: "Below Average" }
  ]
};
(async()=>{
  const name = "Pre-Primary Format (Montessori to K.G.)";
  const existing = await p.query("SELECT id, name FROM result_card_templates WHERE school_id=1 AND name=$1", [name]);
  console.log('existing', existing.rows);
  if (existing.rows.length===0) {
    const r=await p.query("INSERT INTO result_card_templates (school_id, name, session, pages, grade_scale, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name", [1, name, "2025-26", JSON.stringify([{ id: "preprimary-config", label: "PrePrimary Config", config: cfg }]), JSON.stringify([]), true]);
    console.log('created for school 1', r.rows[0]);
    const r2=await p.query("INSERT INTO result_card_templates (school_id, name, session, pages, grade_scale, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name", [2, name, "2025-26", JSON.stringify([{ id: "preprimary-config", label: "PrePrimary Config", config: cfg }]), JSON.stringify([]), true]);
    console.log('created for school 2', r2.rows[0]);
  } else {
    console.log('already exists');
    // update to ensure full config
    await p.query("UPDATE result_card_templates SET pages=$1 WHERE id=$2", [JSON.stringify([{ id: "preprimary-config", label: "PrePrimary Config", config: cfg }]), existing.rows[0].id]);
    console.log('updated existing to full config');
  }
  const r=await p.query("SELECT id, name FROM result_card_templates WHERE school_id=1 AND name ILIKE '%pre-primary%'");
  console.log('final', r.rows);
  await p.end();
})().catch(e=>{console.error(e); process.exit(1)})
