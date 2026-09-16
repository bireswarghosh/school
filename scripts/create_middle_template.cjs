const {Pool}=require('pg');
const p=new Pool({connectionString:'postgresql://postgres:123@localhost/appstrice_school'});
(async()=>{
  const pages=[
    {
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
        {id:"f_term1Remark",label:"Term I Remark",type:"text",x:5,y:85,w:90,h:4,size:10,bind:"term1Remark"},
        {id:"f_term2Remark",label:"Term II Remark",type:"text",x:5,y:88,w:90,h:4,size:10,bind:"term2Remark"},
        {id:"f_finalResult",label:"Final Result",type:"text",x:5,y:91,w:40,h:3,size:11,bind:"finalResult"},
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
        {
          id:"personality",
          label:"Personality Development",
          x:5,y:55,w:45,h:12,fontSize:7, rowsKey:"personality",
          cols:[
            {id:"trait",label:"Personality",type:"text",width:40},
            {id:"term1",label:"Term I",type:"mark"},
            {id:"term2",label:"Term II",type:"mark"},
          ]
        },
        {
          id:"cocurricular",
          label:"Co-curricular",
          x:52,y:55,w:43,h:12,fontSize:7, rowsKey:"cocurricular",
          cols:[
            {id:"activity",label:"Co-curricular",type:"text",width:40},
            {id:"term1",label:"Term I",type:"mark"},
            {id:"term2",label:"Term II",type:"mark"},
          ]
        },
        {
          id:"regularity",
          label:"Regularity Record",
          x:5,y:68,w:45,h:8,fontSize:7, rowsKey:"regularity",
          cols:[
            {id:"item",label:"Regularity",type:"text",width:40},
            {id:"term1",label:"Term I",type:"text"},
            {id:"term2",label:"Term II",type:"text"},
          ]
        },
      ]
    }
  ];
  const grade_scale=[
    {min:0,max:60,label:"B",remark:"Satisfactory"},
    {min:61,max:70,label:"B",remark:"Satisfactory"},
    {min:71,max:80,label:"B+",remark:"Good"},
    {min:81,max:90,label:"A",remark:"Very Good"},
    {min:91,max:100,label:"A+",remark:"Excellent"},
  ];
  for(const schoolId of [1,2]){
    const classRes = await p.query("SELECT id FROM classes WHERE school_id=$1 AND name ILIKE '%VI%' ORDER BY id LIMIT 1", [schoolId]);
    const classId = classRes.rows[0]?.id || null;
    const exists = await p.query("SELECT id FROM result_card_templates WHERE school_id=$1 AND name=$2", [schoolId, "Class VI - VIII"]);
    if(exists.rows.length){
      await p.query("UPDATE result_card_templates SET pages=$1, grade_scale=$2, class_id=$3, session=$4, updated_at=NOW() WHERE id=$5", [JSON.stringify(pages), JSON.stringify(grade_scale), classId, "2025-26", exists.rows[0].id]);
      console.log(`updated Class VI-VIII for school ${schoolId} id ${exists.rows[0].id}`);
    } else {
      const r=await p.query("INSERT INTO result_card_templates (school_id, name, class_id, session, pages, grade_scale, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id", [schoolId, "Class VI - VIII", classId, "2025-26", JSON.stringify(pages), JSON.stringify(grade_scale), true]);
      console.log(`created Class VI-VIII for school ${schoolId} id ${r.rows[0].id}`);
    }
  }
  await p.end();
})()
