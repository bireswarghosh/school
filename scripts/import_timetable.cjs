const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:123@localhost/appstrice_school' });

(async () => {
  const client = await pool.connect();
  try {
    const subjs = await client.query('SELECT id, name FROM subjects');
    const subjectMap = {};
    subjs.rows.forEach(s => { subjectMap[s.name.toLowerCase()] = s.id });

    const rows = await client.query(`
      SELECT s.id, s.exam_id, s.name, s.date, s.time, s.room, e.name as exam_name, e.class, e.section, e.term
      FROM cbse_exam_subjects s
      JOIN cbse_exams e ON e.id = s.exam_id
      ORDER BY s.exam_id, s.date
    `);

    console.log('Exporting ' + rows.rows.length + ' schedule entries from cbse_exam_subjects...');

    const insertSQL = [];
    let skipped = 0;
    for (const r of rows.rows) {
      const subjId = subjectMap[r.name.toLowerCase()];
      if (!subjId) {
        console.log('  SKIP: no global subject match for "' + r.name + '"');
        skipped++;
        continue;
      }
      let dateStr = r.date;
      if (dateStr) {
        const d = new Date(dateStr);
        dateStr = d.toISOString().split('T')[0];
      }
      const esc = (v) => (v || '').replace(/'/g, "''");
      insertSQL.push(`(${r.exam_id}, ${subjId}, '${dateStr}', '09:00', '', '${esc(r.room)}', '${esc(r.exam_name)}', '${esc(r.name)}', '${esc(r.class)}', '${esc(r.section)}', '${esc(r.term)}')`);
    }

    if (insertSQL.length === 0) {
      console.log('No entries to insert');
    } else {
      const sql = `INSERT INTO cbse_exam_schedules (cbse_exam_id, subject_id, date, start_time, end_time, room, exam_name, subject_name, class, section, term) VALUES ${insertSQL.join(',')} RETURNING id`;
      const result = await client.query(sql);
      console.log('Inserted ' + result.rows.length + ' schedule entries successfully!');
      if (skipped) console.log('Skipped ' + skipped + ' entries (no matching global subject)');
    }
  } finally { client.release(); pool.end(); }
})().catch(e => console.error(e.message));
