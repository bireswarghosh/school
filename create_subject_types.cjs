const {Pool}=require('pg');
const p=new Pool({connectionString:'postgresql://postgres:123@localhost/appstrice_school'});
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
  console.log('subject_types table created');
  // Insert default types for each school if not exists
  const schools = await p.query("SELECT id FROM schools");
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
