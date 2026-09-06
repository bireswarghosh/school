// Seeds the `payment_gateways` table with the well-known gateways and their demo
// (Test-mode) credentials. Idempotent — safe to run any number of times.
//
// Run: node scripts/seed-payment-gateways.cjs
const { readFileSync } = require("fs")
const path = require("path")

let DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  try {
    const env = readFileSync(path.join(__dirname, "..", ".env"), "utf8")
    const line = env.split("\n").find((l) => l.startsWith("DATABASE_URL="))
    if (line) DATABASE_URL = line.slice("DATABASE_URL=".length).trim().replace(/^"|"$/g, "")
  } catch {
    /* no .env */
  }
}
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set")
  process.exit(1)
}

const { Pool } = require("pg")
const pool = new Pool({ connectionString: DATABASE_URL })

const GATEWAYS = [
  {
    name: "Razorpay",
    api_key: "rzp_test_9i7Xo2qLt5wEbPn",
    secret_key: "rzp_test_secret_4k8mZ1cQv9rYtUa",
    mode: "Test",
    is_active: true,
  },
  {
    name: "PhonePe",
    api_key: "phonepe_test_merchant_demo",
    secret_key: "phonepe_test_mch_secret_demo",
    mode: "Test",
    is_active: true,
  },
  {
    name: "Cashfree Payments",
    api_key: "cashfree_test_client_demo",
    secret_key: "cashfree_test_client_secret_demo",
    mode: "Test",
    is_active: true,
  },
  {
    name: "CCAvenue",
    api_key: "ccavenue_test_merchant_demo",
    secret_key: "ccavenue_test_enc_key_demo",
    mode: "Test",
    is_active: true,
  },
  {
    name: "PayPal",
    api_key: "paypal_test_api_key",
    secret_key: "paypal_test_secret_key",
    mode: "Test",
    is_active: false,
  },
]

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_gateways (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      api_key TEXT,
      secret_key TEXT,
      mode VARCHAR(20) DEFAULT 'Test',
      is_active BOOLEAN DEFAULT false
    )`)
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS payment_gateways_name_key ON payment_gateways (name)`)

  for (const g of GATEWAYS) {
    const res = await pool.query(
      `INSERT INTO payment_gateways (name, api_key, secret_key, mode, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (name) DO UPDATE SET
         api_key = EXCLUDED.api_key,
         secret_key = EXCLUDED.secret_key,
         mode = EXCLUDED.mode,
         is_active = EXCLUDED.is_active
       RETURNING id, name, mode, is_active`,
      [g.name, g.api_key, g.secret_key, g.mode, g.is_active]
    )
    const r = res.rows[0]
    console.log(`  ✓ ${r.name} (${r.mode}) ${r.is_active ? "ACTIVE" : "inactive"} → id ${r.id}`)
  }
  const all = await pool.query(`SELECT id, name, is_active FROM payment_gateways ORDER BY id`)
  console.log(`\n${all.rowCount} gateway(s) total.`)
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})