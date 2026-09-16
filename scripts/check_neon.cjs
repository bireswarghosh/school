const fs=require('fs');
const env = fs.readFileSync('.env','utf8').match(/DATABASE_URL="([^"]+)"/)[1];
console.log(env.slice(0,60));
const {Pool}=require('pg');
const p=new Pool({connectionString: env});
(async()=>{
  const r=await p.query('SELECT COUNT(*) c FROM result_card_templates');
  console.log('neon count', r.rows[0].c);
  const r2=await p.query('SELECT school_id, COUNT(*) c FROM result_card_templates GROUP BY school_id');
  console.log(r2.rows);
  await p.end();
})()
