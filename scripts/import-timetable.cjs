const {Pool}=require('pg');
const p=new Pool({connectionString:'postgresql://postgres:123@localhost/appstrice_school'});
(async()=>{
  const fromId=1, toId=2;
  const entries = (await p.query('SELECT day, period, subject_name, teacher_name, class_id, section_id, start_time, end_time FROM timetable_entries WHERE school_id=$1', [fromId])).rows;
  console.log('source entries', entries.length);
  const client = await p.connect();
  try{
    await client.query('BEGIN');
    const del = await client.query('DELETE FROM timetable_entries WHERE school_id=$1', [toId]);
    console.log('deleted', del.rowCount);
    // build caches
    const classMap = new Map();
    const secMap = new Map(); // `${class_id}:${name.toLowerCase()}` -> id
    const classesT = (await client.query('SELECT id, name FROM classes WHERE school_id=$1', [toId])).rows;
    for(const c of classesT) classMap.set(c.name.trim().toLowerCase(), c.id);
    const secsT = (await client.query('SELECT id, class_id, name FROM sections WHERE school_id=$1', [toId])).rows;
    for(const s of secsT) secMap.set(`${s.class_id}:${s.name.trim().toLowerCase()}`, s.id);

    async function ensureClass(name){
      const key=name.trim().toLowerCase();
      if(classMap.has(key)) return classMap.get(key);
      const r=await client.query('INSERT INTO classes (name, school_id) VALUES ($1,$2) RETURNING id', [name, toId]);
      classMap.set(key, r.rows[0].id);
      console.log('created class',name);
      return r.rows[0].id;
    }
    async function ensureSection(className, secName){
      const cid=await ensureClass(className);
      const key=`${cid}:${secName.trim().toLowerCase()}`;
      if(secMap.has(key)) return secMap.get(key);
      const r=await client.query('INSERT INTO sections (class_id, name, school_id) VALUES ($1,$2,$3) RETURNING id', [cid, secName, toId]);
      secMap.set(key, r.rows[0].id);
      console.log('created section',className,secName);
      return r.rows[0].id;
    }

    for(const e of entries){
      let className='General', secName='A';
      if(e.class_id){
        const c=(await client.query('SELECT name FROM classes WHERE id=$1', [e.class_id])).rows[0];
        if(c) className=c.name;
      }
      if(e.section_id){
        const s=(await client.query('SELECT name, class_id FROM sections WHERE id=$1', [e.section_id])).rows[0];
        if(s){ secName=s.name; if(s.class_id){ const cc=(await client.query('SELECT name FROM classes WHERE id=$1', [s.class_id])).rows[0]; if(cc) className=cc.name; } }
      }
      const newCid=await ensureClass(className);
      const newSid=await ensureSection(className, secName);
      await client.query('INSERT INTO timetable_entries (day, period, subject_name, teacher_name, class_id, section_id, start_time, end_time, school_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [e.day, e.period, e.subject_name, e.teacher_name, newCid, newSid, e.start_time, e.end_time, toId]);
    }
    await client.query('COMMIT');
    console.log('done copied', entries.length);
  }catch(err){ await client.query('ROLLBACK'); console.error(err)} finally{ client.release(); await p.end();}
})()
