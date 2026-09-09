const XLSX = require('xlsx');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://postgres:123@localhost/appstrice_school' });

async function main(){
  const file = 'H:\\SCHOOL\\school_uniform_variable_products.xlsx';
  const wb = XLSX.readFile(file);
  console.log('Sheets:', wb.SheetNames);

  // Read Complete Variations sheet
  const ws = wb.Sheets['Complete Variations'];
  const data = XLSX.utils.sheet_to_json(ws, { header:1, defval: null });
  // data[0] is header: Product, Variation Attribute, Variation Value, Price, Status
  const header = data[0];
  console.log('Header', header);
  const rows = data.slice(1);
  console.log('Total rows', rows.length);

  // Group by product
  const groups = {};
  for(const r of rows){
    const [product, attr, value, price, status] = r;
    if(!product || !value) continue;
    if(price == null || status === 'Unavailable') continue; // skip unavailable
    if(!groups[product]) groups[product] = [];
    groups[product].push({ size: String(value), price: Number(price) });
  }
  console.log('Products found:', Object.keys(groups));
  for(const k of Object.keys(groups)){
    console.log(k, groups[k].length, groups[k].slice(0,3));
  }

  // Get school_id for DEFAULT
  const schoolRes = await pool.query("SELECT id FROM schools WHERE code='DEFAULT' LIMIT 1");
  const schoolId = schoolRes.rows[0]?.id || null;
  console.log('schoolId', schoolId);

  // For each product, ensure product exists in si_products, then insert variations into si_variations
  for(const productName of Object.keys(groups)){
    // Check if product exists
    let prodRes = await pool.query("SELECT id FROM si_products WHERE school_id=$1 AND name=$2 LIMIT 1", [schoolId, productName]);
    let productId;
    if(prodRes.rows.length){
      productId = prodRes.rows[0].id;
      console.log(`Product exists: ${productName} id=${productId}`);
    } else {
      // Create product with minimal fields
      const code = productName.replace(/[^A-Z0-9]/gi,'').substring(0,20).toUpperCase();
      const ins = await pool.query(
        `INSERT INTO si_products (school_id, name, code, description) VALUES ($1,$2,$3,$4) RETURNING id`,
        [schoolId, productName, code, `Auto-created from uniform variable products xlsx`]
      );
      productId = ins.rows[0].id;
      console.log(`Created product: ${productName} id=${productId}`);
    }

    const vars = groups[productName];
    // Clear existing variations for this product to avoid duplicates (optional)
    await pool.query("DELETE FROM si_variations WHERE school_id=$1 AND product_id=$2", [schoolId, productId]);

    for(const v of vars){
      // Determine color from product name if contains Blue etc.
      let color = null;
      if(productName.includes('Blue')) color='Blue';
      // component_name is productName
      const sku = `${productName.replace(/\s+/g,'').substring(0,6).toUpperCase()}-${v.size}`;
      await pool.query(
        `INSERT INTO si_variations (school_id, product_id, variant_type, variant_value, additional_price, component_name, color, size, price, sku, quantity) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [schoolId, productId, productName, v.size, v.price, productName, color, v.size, v.price, sku, 100]
      );
    }
    console.log(`Inserted ${vars.length} variations for ${productName}`);
  }

  // Also ensure Blazer etc. even with 1 variation shows
  const countRes = await pool.query("SELECT p.name, COUNT(v.id) as cnt FROM si_products p LEFT JOIN si_variations v ON v.product_id=p.id WHERE p.school_id=$1 AND p.name IN (SELECT name FROM si_products WHERE school_id=$1) GROUP BY p.name ORDER BY p.name", [schoolId]);
  console.log('Counts:');
  console.table(countRes.rows);

  await pool.end();
  console.log('Done');
}

main().catch(e=>{console.error(e); process.exit(1)});
