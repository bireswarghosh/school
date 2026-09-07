const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_gO91MyoLsCkv@ep-super-voice-azabstqs-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });
async function main() {
  const sales214 = await pool.query('SELECT * FROM si_sales WHERE student_id = 214');
  const allSales = await pool.query('SELECT id, student_id, student_name, sale_no, total_amount, payment_status FROM si_sales LIMIT 10');
  const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'si_sales'");
  console.log('SALES FOR 214:', JSON.stringify(sales214.rows, null, 2));
  console.log('ALL SALES:', JSON.stringify(allSales.rows, null, 2));
  console.log('COLUMNS:', cols.rows.map(r => r.column_name));
  await pool.end();
}
main();
