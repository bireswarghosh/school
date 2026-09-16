const {Pool}=require('pg');
const p=new Pool({connectionString:'postgresql://postgres:123@localhost/appstrice_school'});
(async()=>{
  const fromId=1, toId=2;
  const teachers = (await p.query("SELECT name, surname, email, role, phone FROM staff WHERE school_id=$1 AND LOWER(role) LIKE '%teacher%'", [fromId])).rows;
  console.log('teachers to copy', teachers.length);
  const client=await p.connect();
  try{
    await client.query('BEGIN');
    for(const t of teachers){
      const exists = await client.query('SELECT id FROM staff WHERE school_id=$1 AND LOWER(name)=LOWER($2)', [toId, t.name]);
      if(exists.rows.length) {console.log('skip',t.name); continue;}
      const email = t.email ? t.email.replace('@','+t2@') : `${t.name.replace(/\s+/g,'.').toLowerCase()}@t2.local`;
      await client.query('INSERT INTO staff (name, surname, email, role, phone, school_id, status) VALUES ($1,$2,$3,$4,$5,$6,$7)', [t.name, t.surname||'', email, 'Teacher', t.phone||'', toId, 'Active']);
      console.log('created',t.name);
    }
    await client.query('COMMIT');
    console.log('done');
  }catch(e){await client.query('ROLLBACK'); console.error(e)} finally{client.release(); await p.end();}
})()
