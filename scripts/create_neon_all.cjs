const fs=require('fs');
const env = fs.readFileSync('.env','utf8').match(/DATABASE_URL="([^"]+)"/)[1];
const {Pool}=require('pg');
const p=new Pool({connectionString: env});
(async()=>{
  const sql=fs.readFileSync('src/lib/sql/065_result_card.sql','utf8');
  await p.query(sql);
  console.log('migration neon done');
  // Primary
  const schoolId=1;
  const classRes = await p.query("SELECT id FROM classes WHERE school_id=$1 AND name IN ('Class- I','Class- II') ORDER BY id LIMIT 1", [schoolId]);
  const primaryClassId = classRes.rows[0]?.id || null;
  const pagesPrimary = [
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
      ],
      tables: [
        {
          id: "academic",
          label: "ACADEMIC PERFORMANCE",
          x: 5, y: 30, w: 90, h: 30, fontSize: 9, rowsKey: "academic",
          cols: [
            { id: "subject", label: "SUBJECTS", type: "text", width: 22 },
            { id: "f1", label: "F1", type: "mark", max: 40 },
            { id: "s1", label: "S1", type: "mark", max: 60 },
            { id: "total1", label: "TOTAL", type: "sum", of: ["f1","s1"] },
            { id: "f2", label: "F2", type: "mark", max: 40 },
            { id: "s2", label: "S2", type: "mark", max: 60 },
            { id: "total2", label: "TOTAL", type: "sum", of: ["f2","s2"] },
            { id: "ff", label: "F1+F2", type: "sum", of: ["f1","f2"] },
            { id: "ss", label: "S1+S2", type: "sum", of: ["s1","s2"] },
            { id: "overall", label: "Overall", type: "text" },
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
      ],
      tables: [
        {
          id: "progress",
          label: "PROGRESS REPORT",
          x: 5, y: 22, w: 90, h: 35, fontSize: 8, rowsKey: "progress",
          cols: [
            { id: "subject", label: "SUBJECTS", type: "text", width: 20 },
            { id: "fa2", label: "F.A.2 (20)", type: "mark", max: 20 },
            { id: "proj", label: "Project (10)", type: "mark", max: 10 },
            { id: "ct1", label: "CT1 (10)", type: "mark", max: 10 },
            { id: "ct2", label: "CT2 (10)", type: "mark", max: 10 },
            { id: "sa2", label: "S.A.2 (40)", type: "mark", max: 40 },
            { id: "viva", label: "VIVA (10)", type: "mark", max: 10 },
          ]
        },
      ]
    }
  ];
  const grade_scale=[
    { min: 0, max: 39, label: "D" },
    { min: 40, max: 50, label: "C" },
    { min: 51, max: 60, label: "C+" },
    { min: 61, max: 70, label: "B" },
    { min: 71, max: 80, label: "B+" },
    { min: 81, max: 90, label: "A" },
    { min: 91, max: 100, label: "A+" },
  ];
  for(const sid of [1,2]){
    const exists = await p.query("SELECT id FROM result_card_templates WHERE school_id=$1 AND name=$2", [sid, "Class I - V"]);
    if(exists.rows.length){
      await p.query("UPDATE result_card_templates SET pages=$1, grade_scale=$2, updated_at=NOW() WHERE id=$3", [JSON.stringify(pagesPrimary), JSON.stringify(grade_scale), exists.rows[0].id]);
      console.log('updated primary for',sid);
    } else {
      const r=await p.query("INSERT INTO result_card_templates (school_id, name, class_id, session, pages, grade_scale, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id", [sid, "Class I - V", primaryClassId, "2025-26", JSON.stringify(pagesPrimary), JSON.stringify(grade_scale), true]);
      console.log('created primary for',sid,r.rows[0].id);
    }
  }
  // Middle
  const pagesMiddle=[{
      id:"page1",
      label:"Middle School - Report Card",
      image:"",
      width:794,
      height:1123,
      fields:[
        {id:"f_name",label:"Name",type:"text",x:15,y:12,w:35,h:3,size:12,bind:"name"},
        {id:"f_class",label:"Class",type:"text",x:60,y:12,w:15,h:3,size:12,bind:"class"},
        {id:"f_roll",label:"Roll No",type:"text",x:80,y:12,w:12,h:3,size:12,bind:"rollNo"},
        {id:"f_mother",label:"Mother's Name",type:"text",x:15,y:15,w:35,h:3,size:11,bind:"motherName"},
        {id:"f_father",label:"Father's Name",type:"text",x:15,y:18,w:35,h:3,size:11,bind:"fatherName"},
        {id:"f_session",label:"Session",type:"text",x:60,y:15,w:20,h:3,size:11,bind:"session"},
      ],
      tables:[
        {
          id:"academic",
          label:"ACADEMIC - TERM I & II",
          x:5,y:22,w:90,h:32,fontSize:8, rowsKey:"academic",
          cols:[
            {id:"subject",label:"Subjects",type:"text",width:18},
            {id:"ut1",label:"Unit Test 1 (20)",type:"mark",max:20},
            {id:"mid1",label:"Mid Term (80)",type:"mark",max:80},
            {id:"total1",label:"Total (100)",type:"sum",of:["ut1","mid1"]},
            {id:"ut2",label:"Unit Test 2 (20)",type:"mark",max:20},
            {id:"final",label:"Final (80)",type:"mark",max:80},
            {id:"total2",label:"Total (100)",type:"sum",of:["ut2","final"]},
            {id:"grand",label:"Total (200)",type:"sum",of:["total1","total2"]},
            {id:"percent",label:"Overall % & Grade",type:"grade",of:["grand"]},
          ]
        },
      ]
    }
  ];
  for(const sid of [1,2]){
    const cRes = await p.query("SELECT id FROM classes WHERE school_id=$1 AND name ILIKE '%VI%' ORDER BY id LIMIT 1", [sid]);
    const cid = cRes.rows[0]?.id || null;
    const exists = await p.query("SELECT id FROM result_card_templates WHERE school_id=$1 AND name=$2", [sid, "Class VI - VIII"]);
    if(exists.rows.length){
      await p.query("UPDATE result_card_templates SET pages=$1, grade_scale=$2, class_id=$3, updated_at=NOW() WHERE id=$4", [JSON.stringify(pagesMiddle), JSON.stringify(grade_scale), cid, exists.rows[0].id]);
      console.log('updated middle for',sid);
    } else {
      const r=await p.query("INSERT INTO result_card_templates (school_id, name, class_id, session, pages, grade_scale, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id", [sid, "Class VI - VIII", cid, "2025-26", JSON.stringify(pagesMiddle), JSON.stringify(grade_scale), true]);
      console.log('created middle for',sid,r.rows[0].id);
    }
  }
  const r=await p.query('SELECT school_id, name, id FROM result_card_templates ORDER BY school_id, id');
  console.log(r.rows);
  await p.end();
})()
