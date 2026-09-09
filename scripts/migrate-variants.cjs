const { Pool } = require('pg');
const p = new Pool({connectionString:'postgresql://postgres:123@localhost/appstrice_school'});
const sql = `
    ALTER TABLE si_variations ADD COLUMN IF NOT EXISTS component_name VARCHAR(200);
    ALTER TABLE si_variations ADD COLUMN IF NOT EXISTS color VARCHAR(60);
    ALTER TABLE si_variations ADD COLUMN IF NOT EXISTS size VARCHAR(60);
    ALTER TABLE si_variations ADD COLUMN IF NOT EXISTS price NUMERIC(12,2);
    ALTER TABLE si_variations ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
    ALTER TABLE si_variations ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
    ALTER TABLE si_variations ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;
  `;
p.query(sql).then(async()=>{
  console.log('migration done');
  const cols = await p.query("SELECT column_name FROM information_schema.columns WHERE table_name='si_variations' ORDER BY ordinal_position");
  console.log(cols.rows.map(r=>r.column_name).join(','));
  await p.end();
}).catch(e=>{console.error(e); p.end()});
