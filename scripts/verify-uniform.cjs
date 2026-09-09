const {Pool}=require('pg');
const p=new Pool({connectionString:'postgresql://postgres:123@localhost/appstrice_school'});
p.query(`SELECT p.name, COUNT(v.id) as vars FROM si_products p LEFT JOIN si_variations v ON v.product_id=p.id WHERE p.school_id=1 GROUP BY p.name HAVING COUNT(v.id)>0 ORDER BY p.name`).then(r=>{
  console.table(r.rows);
  return p.query(`SELECT p.name, v.size, v.price, v.sku FROM si_products p JOIN si_variations v ON v.product_id=p.id WHERE p.name='Boys Half Pant Blue' ORDER BY v.size`);
}).then(r=>{
  console.log('Boys Half Pant Blue samples');
  console.table(r.rows);
  p.end();
});
