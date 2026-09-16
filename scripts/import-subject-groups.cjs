const {Pool}=require('pg');
const p=new Pool({connectionString:'postgresql://postgres:123@localhost/appstrice_school'});
(async()=>{
  const fromId=1, toId=2;
  const groups = (await p.query('SELECT id, name, description FROM subject_groups WHERE school_id=$1 ORDER BY id', [fromId])).rows;
  console.log('source groups', groups.length);
  if(groups.length===0){console.log('no groups to copy'); await p.end(); return;}
  const client = await p.connect();
  try{
    await client.query('BEGIN');
    await client.query('DELETE FROM subject_group_sections WHERE school_id=$1', [toId]);
    await client.query('DELETE FROM subject_group_subjects WHERE school_id=$1', [toId]);
    const del = await client.query('DELETE FROM subject_groups WHERE school_id=$1', [toId]);
    console.log('deleted', del.rowCount, 'groups from target');

    const classCache = new Map();
    const classesTarget = (await client.query('SELECT id, name FROM classes WHERE school_id=$1', [toId])).rows;
    for(const c of classesTarget) classCache.set(c.name.trim().toLowerCase(), c.id);
    const sectionCache = new Map();
    const sectionsTarget = (await client.query('SELECT id, class_id, name FROM sections WHERE school_id=$1', [toId])).rows;
    for(const s of sectionsTarget) sectionCache.set(`${s.class_id}:${s.name.trim().toLowerCase()}`, s.id);
    const subjectCache = new Map();
    const subjectsTarget = (await client.query('SELECT id, name FROM subjects WHERE school_id=$1', [toId])).rows;
    for(const s of subjectsTarget) subjectCache.set(s.name.trim().toLowerCase(), s.id);

    async function ensureClass(className){
      const key = className.trim().toLowerCase();
      if(classCache.has(key)) return classCache.get(key);
      const res = await client.query('INSERT INTO classes (name, school_id) VALUES ($1,$2) RETURNING id', [className, toId]);
      const id=res.rows[0].id;
      classCache.set(key, id);
      console.log('created class',className,'->',id);
      return id;
    }
    async function ensureSection(className, sectionName){
      const classId = await ensureClass(className);
      const key=`${classId}:${sectionName.trim().toLowerCase()}`;
      if(sectionCache.has(key)) return sectionCache.get(key);
      const res=await client.query('INSERT INTO sections (class_id, name, school_id) VALUES ($1,$2,$3) RETURNING id', [classId, sectionName, toId]);
      const id=res.rows[0].id;
      sectionCache.set(key,id);
      console.log('created section',className,sectionName,'->',id);
      return id;
    }
    async function ensureSubject(subjectName){
      const key=subjectName.trim().toLowerCase();
      if(subjectCache.has(key)) return subjectCache.get(key);
      const res=await client.query('INSERT INTO subjects (name, school_id) VALUES ($1,$2) RETURNING id', [subjectName, toId]);
      const id=res.rows[0].id;
      subjectCache.set(key,id);
      console.log('created subject',subjectName,'->',id);
      return id;
    }

    for(const g of groups){
      const gRes = await client.query('INSERT INTO subject_groups (name, description, school_id) VALUES ($1,$2,$3) RETURNING id', [g.name, g.description, toId]);
      const newGroupId=gRes.rows[0].id;
      console.log('created group',g.name,'->',newGroupId);
      const secRels = (await client.query('SELECT section_id FROM subject_group_sections WHERE subject_group_id=$1 AND school_id=$2', [g.id, fromId])).rows;
      const subjRels = (await client.query('SELECT subject_id FROM subject_group_subjects WHERE subject_group_id=$1 AND school_id=$2', [g.id, fromId])).rows;
      for(const rel of secRels){
        const sec = (await client.query('SELECT class_id, name FROM sections WHERE id=$1', [rel.section_id])).rows[0];
        if(!sec){console.log('skip missing section',rel.section_id); continue;}
        let className='General';
        if(sec.class_id){
          const cls=(await client.query('SELECT name FROM classes WHERE id=$1', [sec.class_id])).rows[0];
          if(cls) className=cls.name;
        }
        const newSecId=await ensureSection(className, sec.name);
        await client.query('INSERT INTO subject_group_sections (subject_group_id, section_id, school_id) VALUES ($1,$2,$3)', [newGroupId, newSecId, toId]);
      }
      for(const rel of subjRels){
        const subj=(await client.query('SELECT name FROM subjects WHERE id=$1', [rel.subject_id])).rows[0];
        if(!subj) continue;
        const newSubId=await ensureSubject(subj.name);
        await client.query('INSERT INTO subject_group_subjects (subject_group_id, subject_id, school_id) VALUES ($1,$2,$3)', [newGroupId, newSubId, toId]);
      }
    }
    await client.query('COMMIT');
    console.log('done');
  }catch(e){
    await client.query('ROLLBACK');
    console.error(e);
  }finally{
    client.release();
    await p.end();
  }
})()
