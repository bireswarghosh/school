const {Pool}=require('pg');
const p=new Pool({connectionString:'postgresql://postgres:123@localhost/appstrice_school'});
(async()=>{
  const r=await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%subject%' ORDER BY table_name");
  console.log(r.rows.map(x=>x.table_name).join('\n'));
  const r2=await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='subjects' ORDER BY ordinal_position");
  console.log('--- subjects columns ---');
  console.log(r2.rows.map(x=>`${x.column_name}:${x.data_type}`).join('\n'));
  const r3=await p.query("SELECT * FROM subjects LIMIT 3");
  console.log('--- subjects sample ---');
  console.log(JSON.stringify(r3.rows,null,2));
  await p.end();
})().catch(e=>{console.error(e); process.exit(1)})
