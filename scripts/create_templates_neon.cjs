const fs=require('fs');
const env = fs.readFileSync('.env','utf8').match(/DATABASE_URL="([^"]+)"/)[1];
const {Pool}=require('pg');
const p=new Pool({connectionString: env});
(async()=>{
  // run migration first
  const sql=fs.readFileSync('src/lib/sql/065_result_card.sql','utf8');
  await p.query(sql);
  console.log('migration done');
  const schoolId=1;
  const classRes = await p.query("SELECT id, name FROM classes WHERE school_id=$1 AND name IN ('Class- I','Class- II','Class- III','Class- IV','Class- V') ORDER BY id", [schoolId]);
  console.log('classes I-V', classRes.rows);
  const primaryClassId = classRes.rows[0]?.id || null;
  const pagesPrimary = JSON.parse(fs.readFileSync('scripts/create_primary_template.cjs','utf8').match(/const pages = (\[[\s\S]*?\] );/)[1].replace(/'/g,'"'));
})()
