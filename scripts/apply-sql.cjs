const { Pool } = require("pg")
const fs = require("fs")
const path = require("path")

const envFile = path.join(__dirname, "..", ".env")
const url = fs
  .readFileSync(envFile, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .find((l) => l.startsWith("DATABASE_URL="))
  .replace(/^DATABASE_URL=/, "")
  .replace(/^"(.*)"$/, "$1")

const sqlFile = process.argv[2] || path.join(__dirname, "..", "src", "lib", "sql", "056_fees_master_due_day.sql")
const sql = fs.readFileSync(sqlFile, "utf8")

;(async () => {
  const pool = new Pool({ connectionString: url })
  await pool.query(sql)
  console.log("Applied:", path.basename(sqlFile))
  await pool.end()
})().catch((e) => {
  console.error(e.message)
  process.exit(1)
})