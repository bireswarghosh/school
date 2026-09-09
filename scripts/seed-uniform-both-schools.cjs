const {Pool}=require('pg');
const XLSX=require('xlsx');
const p=new Pool({connectionString:'postgresql://postgres:123@localhost/appstrice_school'});
async function seedForSchool(schoolId, schoolCode){
  const file='H:\\SCHOOL\\school_uniform_variable_products.xlsx';
  const wb=XLSX.readFile(file);
  const ws=wb.Sheets['Complete Variations'];
  const data=XLSX.utils.sheet_to_json(ws,{header:1,defval:null});
  const rows=data.slice(1);
  const groups={};
  for(const r of rows){
    const [product,attr,value,price,status]=r;
    if(!product||!value) continue;
    if(price==null||status==='Unavailable') continue;
    if(!groups[product]) groups[product]=[];
    groups[product].push({size:String(value),price:Number(price)});
  }
  // ensure category
  let cat=await p.query("SELECT id FROM si_categories WHERE school_id=$1 AND name=$2",[schoolId,'School Uniform']);
  let catId;
  if(cat.rows.length) catId=cat.rows[0].id;
  else {
    const ins=await p.query("INSERT INTO si_categories (school_id,name,description) VALUES ($1,$2,$3) RETURNING id",[schoolId,'School Uniform','Uniform variable products']);
    catId=ins.rows[0].id;
    console.log(`[${schoolCode}] Created category ${catId}`);
  }
  for(const productName of Object.keys(groups)){
    let prodRes=await p.query("SELECT id FROM si_products WHERE school_id=$1 AND name=$2 LIMIT 1",[schoolId,productName]);
    let productId;
    if(prodRes.rows.length){
      productId=prodRes.rows[0].id;
      // ensure category
      await p.query("UPDATE si_products SET category_id=$1 WHERE id=$2",[catId,productId]);
      // delete old variations to re-seed cleanly
      await p.query("DELETE FROM si_variations WHERE school_id=$1 AND product_id=$2",[schoolId,productId]);
      console.log(`[${schoolCode}] Reset ${productName} id=${productId}`);
    } else {
      const code=productName.replace(/[^A-Z0-9]/gi,'').substring(0,20).toUpperCase();
      const ins=await p.query("INSERT INTO si_products (school_id,name,code,description,category_id) VALUES ($1,$2,$3,$4,$5) RETURNING id",[schoolId,productName,code+schoolId, 'Auto-created from xlsx',catId]);
      productId=ins.rows[0].id;
      console.log(`[${schoolCode}] Created ${productName} id=${productId}`);
    }
    const vars=groups[productName];
    for(const v of vars){
      let color=null;
      if(productName.includes('Blue')) color='Blue';
      const sku=`${productName.replace(/\s+/g,'').substring(0,6).toUpperCase()}-${v.size}-${schoolId}`;
      await p.query(`INSERT INTO si_variations (school_id,product_id,variant_type,variant_value,additional_price,component_name,color,size,price,sku,quantity) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [schoolId,productId,productName,v.size,v.price,productName,color,v.size,v.price,sku,100]);
    }
    console.log(`[${schoolCode}] Inserted ${vars.length} vars for ${productName}`);
  }
}
(async()=>{
  const schools=await p.query("SELECT id, code FROM schools ORDER BY id");
  console.log('schools',schools.rows);
  for(const s of schools.rows){
    await seedForSchool(s.id,s.code);
  }
  const dist=await p.query("SELECT school_id, COUNT(*) FROM si_products GROUP BY school_id");
  console.log('dist products',dist.rows);
  const vdist=await p.query("SELECT school_id, COUNT(*) FROM si_variations GROUP BY school_id");
  console.log('dist variations',vdist.rows);
  await p.end();
})();
