const { Pool } = require("pg")
const fs = require("fs")
const path = require("path")

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:123@localhost/appstrice_school",
  max: 2,
})

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "..", "lib", "sql", "007_attendance_notes.sql"), "utf8")
  await pool.query(sql)
  console.log("applied 007_attendance_notes.sql")
  const r = await pool.query("select column_name, data_type from information_schema.columns where table_name='student_attendance_notes' order by ordinal_position")
  console.log(JSON.stringify(r.rows))
  await pool.end()
}

main().catch((e) => {
  console.error("ERR", e.message)
  process.exit(1)
})