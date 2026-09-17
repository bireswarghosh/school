const {Pool}=require('pg');
const url = "postgresql://neondb_owner:npg_gO91MyoLsCkv@ep-super-voice-azabstqs-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const p=new Pool({connectionString: url, ssl: {require:true}});
(async()=>{
  console.log('--- subject_types ---');
  try {
    const r=await p.query("SELECT * FROM subject_types ORDER BY school_id, id LIMIT 10");
    console.log(JSON.stringify(r.rows,null,2));
  } catch(e){ console.error('subject_types error', e.message); }

  console.log('--- subjects columns ---');
  try {
    const r=await p.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name='subjects' ORDER BY ordinal_position");
    console.log(JSON.stringify(r.rows,null,2));
  } catch(e){ console.error(e.message); }

  console.log('--- subject_groups ---');
  try {
    const r=await p.query("SELECT * FROM subject_groups LIMIT 10");
    console.log(JSON.stringify(r.rows,null,2));
  } catch(e){ console.error('subject_groups error', e.message); }

  console.log('--- subjects sample ---');
  try {
    const r=await p.query("SELECT id, name, code, type, group_id, school_id FROM subjects LIMIT 5");
    console.log(JSON.stringify(r.rows,null,2));
  } catch(e){ console.error(e.message); }

  console.log('--- constraints ---');
  try {
    const r=await p.query("SELECT conname, contype, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid='subjects'::regclass");
    console.log(JSON.stringify(r.rows,null,2));
  } catch(e){ console.error(e.message); }

  await p.end();
})().catch(e=>{console.error(e); process.exit(1)})
