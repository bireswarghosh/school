const { Pool } = require("pg");
const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost/appstrice_school",
  max: 1,
});
(async () => {
  const tables = ["cbse_exams", "cbse_exam_subjects", "cbse_exam_students", "cbse_student_attendance", "cbse_exam_marks"];
  for (const t of tables) {
    await pool.query(`SELECT setval('${t}_id_seq', COALESCE((SELECT MAX(id) FROM ${t}), 1))`);
    console.log(`Fixed ${t}_id_seq`);
  }
  await pool.end();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
