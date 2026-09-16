const fs=require('fs');
const {Pool}=require('pg');
const p=new Pool({connectionString:'postgresql://postgres:123@localhost/appstrice_school'});
(async()=>{
  const sql=fs.readFileSync('src/lib/sql/065_result_card.sql','utf8');
  try{
    await p.query(sql);
    console.log('migration done');
    const r=await p.query("SELECT table_name FROM information_schema.tables WHERE table_name='result_card_templates'");
    console.log(r.rows);
  }catch(e){console.error(e)}
  await p.end();
})()
