const {Pool}=require('pg');
const url = "postgresql://neondb_owner:npg_gO91MyoLsCkv@ep-super-voice-azabstqs-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const p=new Pool({connectionString: url, ssl: {require:true}});
(async()=>{
  const r=await p.query("SELECT id, name, session, is_active, pages::text as pages_text FROM result_card_templates WHERE school_id=1 ORDER BY id");
  console.log(r.rows.map(x=> `${x.id}: ${x.name} | ${x.session} | active=${x.is_active} | pages=${x.pages_text ? x.pages_text.substring(0,120) : 'null'}`).join('\n'));
  await p.end();
})().catch(e=>{console.error(e); process.exit(1)})
