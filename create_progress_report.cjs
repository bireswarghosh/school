const {Pool}=require('pg');
const url = "postgresql://neondb_owner:npg_gO91MyoLsCkv@ep-super-voice-azabstqs-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const p=new Pool({connectionString: url, ssl: {require:true}});
(async()=>{
  const name = "PROGRESS REPORT";
  const truncated = "PROGRESS REPOR";
  // Check existing
  const existing = await p.query("SELECT id, name FROM result_card_templates WHERE school_id=1 AND name ILIKE '%progress%'");
  console.log('existing progress templates', existing.rows);
  if (existing.rows.length === 0) {
    // Create for school 1
    const prog = await p.query(
      "INSERT INTO result_card_templates (school_id, name, session, pages, grade_scale, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name",
      [1, name, "2025-26", JSON.stringify([{ id: "progress-config", label: "Progress Config", config: { type: "progress" } }]), JSON.stringify([]), true]
    );
    console.log('created for school 1', prog.rows[0]);
    // Also for school 2
    const prog2 = await p.query(
      "INSERT INTO result_card_templates (school_id, name, session, pages, grade_scale, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name",
      [2, name, "2025-26", JSON.stringify([{ id: "progress-config", label: "Progress Config", config: { type: "progress" } }]), JSON.stringify([]), true]
    );
    console.log('created for school 2', prog2.rows[0]);
  } else {
    // Ensure name is correct - if user wants truncated, rename to full
    for (const r of existing.rows) {
      if (r.name === truncated) {
        await p.query("UPDATE result_card_templates SET name=$1 WHERE id=$2", [name, r.id]);
        console.log(`renamed ${r.id} from ${truncated} to ${name}`);
      }
    }
    console.log('already exists, no create needed');
  }
  const r=await p.query("SELECT id, name, session, is_active FROM result_card_templates WHERE school_id=1 AND name ILIKE '%progress%'");
  console.log('final', r.rows);
  await p.end();
})().catch(e=>{console.error(e); process.exit(1)})
