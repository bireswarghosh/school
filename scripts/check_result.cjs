const {Pool}=require('pg');
const p=new Pool({connectionString:'postgresql://postgres:123@localhost/appstrice_school'});
(async()=>{
  const r=await p.query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%result%'");
  console.log(r.rows);
  await p.end();
})()
