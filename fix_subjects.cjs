const {Pool}=require('pg');
const url = "postgresql://neondb_owner:npg_gO91MyoLsCkv@ep-super-voice-azabstqs-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const p=new Pool({connectionString: url, ssl: {require:true}});
(async()=>{
  console.log('Altering subjects.type to varchar(100)');
  await p.query("ALTER TABLE subjects ALTER COLUMN type TYPE VARCHAR(100)");
  console.log('done');

  // Check if subject_groups for school 1 need Core Subjects etc.
  const r=await p.query("SELECT * FROM subject_groups WHERE school_id=1 AND name IN ('Core Subjects','Languages','Electives')");
  console.log('existing core groups', r.rows);
  if (r.rows.length === 0) {
    console.log('Inserting missing groups');
    for (const name of ['Core Subjects','Languages','Electives']) {
      await p.query("INSERT INTO subject_groups (name, school_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [name, 1]);
    }
    // For school 2 as well
    for (const name of ['Core Subjects','Languages','Electives']) {
      await p.query("INSERT INTO subject_groups (name, school_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [name, 2]);
    }
    console.log('inserted');
  }

  const r2=await p.query("SELECT id, name, school_id FROM subject_groups WHERE school_id=1 ORDER BY id");
  console.log(JSON.stringify(r2.rows,null,2));

  // Verify type length
  const r3=await p.query("SELECT column_name, character_maximum_length FROM information_schema.columns WHERE table_name='subjects' AND column_name='type'");
  console.log('type length', r3.rows[0]);

  await p.end();
})().catch(e=>{console.error(e); process.exit(1)})
