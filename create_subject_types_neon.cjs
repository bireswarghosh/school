const {Pool}=require('pg');
const url = "postgresql://neondb_owner:npg_gO91MyoLsCkv@ep-super-voice-azabstqs-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const p=new Pool({connectionString: url, ssl: {require:true}});
(async()=>{
  await p.query(`
    CREATE TABLE IF NOT EXISTS subject_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      school_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(name, school_id)
    );
  `);
  console.log('subject_types table created on Neon');
  const schools = await p.query("SELECT id FROM schools");
  console.log('schools', schools.rows.map(r=>r.id));
  const defaults = ["Theory", "Practical", "Both"];
  for (const s of schools.rows) {
    for (const name of defaults) {
      await p.query("INSERT INTO subject_types (name, school_id) VALUES ($1,$2) ON CONFLICT (name, school_id) DO NOTHING", [name, s.id]);
    }
  }
  console.log('defaults inserted');
  const r=await p.query("SELECT * FROM subject_types ORDER BY school_id, name LIMIT 20");
  console.log(JSON.stringify(r.rows,null,2));
  await p.end();
})().catch(e=>{console.error(e); process.exit(1)})
