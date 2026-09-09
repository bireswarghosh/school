const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost/appstrice_school",
  max: 4,
});

async function main() {
  // Apply the new migration
  const file = path.join(__dirname, "..", "src", "lib", "sql", "059_variable_product_variations.sql");
  const sql = fs.readFileSync(file, "utf8");
  await pool.query(sql);
  console.log("[1] Applied", path.basename(file));
  
  await pool.end();
  console.log("\n✓ Migration complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});