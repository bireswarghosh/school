const {Pool}=require('pg');
const p=new Pool({connectionString:'postgresql://postgres:123@localhost/appstrice_school'});
(async()=>{
  const schoolRes = await p.query("SELECT id FROM schools WHERE code='DEFAULT' LIMIT 1");
  const schoolId = schoolRes.rows[0].id;
  let cat = await p.query("SELECT id FROM si_categories WHERE school_id=$1 AND name=$2",[schoolId,'School Uniform']);
  let catId;
  if(cat.rows.length){ catId=cat.rows[0].id; console.log('Category exists',catId); }
  else {
    const ins=await p.query("INSERT INTO si_categories (school_id, name, description) VALUES ($1,$2,$3) RETURNING id",[schoolId,'School Uniform','Uniform variable products - Boys/Girls components']);
    catId=ins.rows[0].id; console.log('Created category',catId);
  }
  const upd = await p.query("UPDATE si_products SET category_id=$1 WHERE school_id=$2 AND name IN ('Boys Half Pant Blue','Boys Half Shirt Blue','Girls Skirt Blue','Girls Half Shirt Blue','Boys & Girls Full Pant Blue','Boys & Girls Full Shirt Blue','Pullovers Boys & Girls','Cap Boys & Girls','Bag','Sports Track Pant','Sports T-Shirt','Belt','I Card Holder','I Card','Diary','Tie','Blazer') RETURNING name",[catId,schoolId]);
  console.log('Updated',upd.rowCount,'products to category School Uniform');
  await p.end();
})();
