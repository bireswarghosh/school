/**
 * Import Designations + Staff from stjonas_org (MySQL) into appstrice_school (Postgres)
 * for school_id = 1 (Smart School / DEFAULT)
 *
 * Run: node scripts/import-stjonas.mjs
 * Idempotent: re-running will not duplicate (checks by name / staff_id / email)
 */
import mysql from 'mysql2/promise';
import { Pool } from 'pg';

const SCHOOL_ID = 1;
const MYSQL_DB = 'stjonas_org';
const PG_URL = process.env.DATABASE_URL || 'postgresql://postgres:123@localhost/appstrice_school';

const pgPool = new Pool({ connectionString: PG_URL });

function cleanStr(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}
function emptyToNull(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}
function dateOrNull(v) {
  if (!v) return null;
  // mysql2 returns Date or string depending on config; handle both
  if (v instanceof Date) {
    // Use local date components to avoid UTC shift - take YYYY-MM-DD from UTC+IST? We use ISO split on original intention.
    // The old DB stores DATE without time; mysql driver shifts by timezone (IST = +5:30). We reverse by using the date part as stored.
    // Better to use YYYY-MM-DD via toISOString and adjust: but we stored as 1992-04-12T18:30:00.000Z which should be 1992-04-13 locally.
    // Correct by adding 5:30 hours or just format via UTC+5:30.
    // Simplify: if the time is 18:30 UTC, the intended date is next day. So we add one day when hour is 18.
    // Instead, just format using locale IST: date as YYYY-MM-DD in Asia/Kolkata.
    // We can convert by using the raw SQL date string if available; fallback to this.
    const d = v;
    // Use d.toLocaleDateString in IST via manual offset
    // MySQL DATE '1992-04-13' becomes Date '1992-04-12T18:30:00.000Z' in JS (IST midnight = UTC previous day 18:30)
    // So convert by adding 5h30m
    const ist = new Date(d.getTime() + (5*60+30)*60*1000);
    const yyyy = ist.getUTCFullYear();
    const mm = String(ist.getUTCMonth()+1).padStart(2,'0');
    const dd = String(ist.getUTCDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const s = String(v).trim();
  if (!s || s === '0000-00-00' || s === '0000-00-00 00:00:00') return null;
  // if it's already YYYY-MM-DD or with time
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0,10);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) return s.slice(0,10);
  // try parse
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0,10);
}

async function main() {
  console.log(`Connecting to MySQL ${MYSQL_DB} and Postgres (school_id=${SCHOOL_ID}) ...`);
  const mysqlConn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: MYSQL_DB, dateStrings: false });

  // --- 1. DESIGNATIONS ---
  // old: staff_designation (id, designation)
  const [oldDesigs] = await mysqlConn.query('SELECT id, designation, is_active FROM staff_designation ORDER BY id');
  console.log(`Old designations: ${oldDesigs.length}`);

  const { rows: existingDesigs } = await pgPool.query('SELECT id, name FROM designations WHERE school_id = $1', [SCHOOL_ID]);
  const nameToId = new Map();
  for (const r of existingDesigs) {
    nameToId.set(r.name.trim().toLowerCase(), r.id);
  }
  console.log(`Existing PG designations for school ${SCHOOL_ID}: ${existingDesigs.length}`);
  console.log(existingDesigs.map(r=>`${r.id}:${r.name}`).join(', '));

  const oldIdToNewId = new Map();
  let newDesigCount = 0;
  for (const od of oldDesigs) {
    const cleanName = cleanStr(od.designation);
    if (!cleanName) continue;
    const key = cleanName.toLowerCase();
    if (nameToId.has(key)) {
      const nid = nameToId.get(key);
      oldIdToNewId.set(od.id, nid);
      console.log(`  reuse designation "${cleanName}" old=${od.id} -> pg=${nid}`);
    } else {
      const res = await pgPool.query('INSERT INTO designations (name, school_id, department_id) VALUES ($1,$2,$3) RETURNING id', [cleanName, SCHOOL_ID, null]);
      const nid = res.rows[0].id;
      nameToId.set(key, nid);
      oldIdToNewId.set(od.id, nid);
      newDesigCount++;
      console.log(`  created designation "${cleanName}" old=${od.id} -> pg=${nid}`);
    }
  }
  console.log(`Designations: ${newDesigCount} created, ${oldDesigs.length - newDesigCount} reused`);
  console.log('Mapping old->new:', Object.fromEntries(oldIdToNewId));

  // --- 2. STAFF ---
  // Fetch staff with formatted dates to avoid timezone shift (use MySQL DATE_FORMAT)
  const [oldStaff] = await mysqlConn.query(`
    SELECT s.*, 
      DATE_FORMAT(s.dob, '%Y-%m-%d') as dob_str,
      DATE_FORMAT(s.date_of_joining, '%Y-%m-%d') as doj_str,
      DATE_FORMAT(s.date_of_leaving, '%Y-%m-%d') as dol_str,
      r.name as role_name
    FROM staff s
    LEFT JOIN staff_roles sr ON sr.staff_id = s.id
    LEFT JOIN roles r ON r.id = sr.role_id
    ORDER BY s.id
  `);
  console.log(`\nOld staff rows: ${oldStaff.length}`);

  const { rows: existingStaff } = await pgPool.query('SELECT id, staff_id, email FROM staff WHERE school_id = $1', [SCHOOL_ID]);
  const existingStaffIds = new Set(existingStaff.map(r=> (r.staff_id||'').trim().toLowerCase()));
  const existingEmails = new Set(existingStaff.map(r=> (r.email||'').trim().toLowerCase()).filter(Boolean));
  console.log(`Existing PG staff for school ${SCHOOL_ID}: ${existingStaff.length}`);

  let inserted = 0, skipped = 0, failed = 0;

  for (const os of oldStaff) {
    const employeeId = cleanStr(os.employee_id);
    const name = cleanStr(os.name);
    const surname = cleanStr(os.surname);
    const fullName = surname ? `${name} ${surname}`.trim() : name;
    // skip if empty employeeId and no email? but all have employee_id
    if (!employeeId) {
      console.log(`  skip id=${os.id} no employee_id`);
      skipped++;
      continue;
    }
    const keyId = employeeId.toLowerCase();
    const emailKey = cleanStr(os.email).toLowerCase();
    // duplicate check by staff_id or email (if email non-empty and already exists and that email's staff_id differs)
    // We check staff_id duplicate first
    if (existingStaffIds.has(keyId)) {
      console.log(`  skip duplicate staff_id=${employeeId} (${fullName}) already exists`);
      skipped++;
      // optionally map designation mismatch? skip for idempotency
      continue;
    }
    // If email duplicate but staff_id new, we still allow but warn; check if email already taken
    // We will suffix or allow duplicate? Postgres has no unique on email for staff, so allow, but log
    if (emailKey && existingEmails.has(emailKey)) {
      console.log(`  note: email ${emailKey} already exists but staff_id ${employeeId} is new - will insert anyway (duplicate email allowed in staff table)`);
    }

    // Designation mapping
    let designationId = null;
    if (os.designation && oldIdToNewId.has(os.designation)) {
      designationId = oldIdToNewId.get(os.designation);
    } else if (os.designation) {
      // fallback: try to find by name if mapping missing (should not happen)
      console.log(`  warn: no designation mapping for old designation=${os.designation} staff=${employeeId}`);
    }

    // Build PG staff record
    // Use dob_str/doj_str/dol_str to avoid timezone issue
    const dob = os.dob_str && os.dob_str !== '0000-00-00' ? os.dob_str : null;
    // dob can be '0000-00-00' for empty? check sample: older had 2019-12-31 etc.
    // but mysql returns NULL for empty? our query gives null if column is 0000-00-00? We handle.
    const doj = os.doj_str && os.doj_str !== '0000-00-00' ? os.doj_str : null;
    const dol = os.dol_str && os.dol_str !== '0000-00-00' ? os.dol_str : null;

    // Normalize dob edge: if dob is '0000-00-00' or null -> null
    const finalDob = dob && dob !== '0000-00-00' ? dob : null;
    const finalDoj = doj && doj !== '0000-00-00' ? doj : null;
    const finalDol = dol && dol !== '0000-00-00' ? dol : null;

    // Role mapping: use role_name from join, fallback to designation name
    let role = cleanStr(os.role_name) || '';
    // Normalize role values to match PG conventions? Keep as is: Teacher, Admin, Super Admin
    // PG staff.role examples: Teacher, Principal etc. Keep mapping simple.
    if (!role) {
      // fallback to designation name
      const desigName = oldDesigs.find(d=>d.id===os.designation)?.designation || '';
      // map Manager/Secretary etc to role? Use as is
      role = cleanStr(desigName) || 'Teacher';
    }
    // is_active 1 -> Active else Inactive
    const status = os.is_active == 1 ? 'Active' : 'Inactive';

    const record = {
      staff_id: employeeId,
      name: name || fullName,
      surname: surname,
      email: emptyToNull(os.email),
      phone: emptyToNull(os.contact_no) || null, // phone mirrors contact_no
      department_id: null, // old department is empty for all
      designation_id: designationId,
      role: role,
      status: status,
      school_id: SCHOOL_ID,
      user_id: null, // not linking to users yet
      father_name: emptyToNull(os.father_name),
      mother_name: emptyToNull(os.mother_name),
      gender: emptyToNull(os.gender),
      dob: finalDob,
      marital_status: emptyToNull(os.marital_status),
      contact_no: emptyToNull(os.contact_no),
      emergency_contact_no: emptyToNull(os.emergency_contact_no),
      date_of_joining: finalDoj,
      date_of_leaving: finalDol,
      local_address: emptyToNull(os.local_address),
      permanent_address: emptyToNull(os.permanent_address),
      qualification: emptyToNull(os.qualification),
      work_exp: emptyToNull(os.work_exp),
      note: emptyToNull(os.note),
      image: emptyToNull(os.image),
      epf_no: emptyToNull(os.epf_no),
      contract_type: emptyToNull(os.contract_type),
      basic_salary: os.basic_salary && Number(os.basic_salary) !== 0 ? parseInt(os.basic_salary,10) : null,
      shift: emptyToNull(os.shift),
      location: emptyToNull(os.location),
      account_title: emptyToNull(os.account_title),
      bank_account_no: emptyToNull(os.bank_account_no),
      bank_name: emptyToNull(os.bank_name),
      ifsc_code: emptyToNull(os.ifsc_code),
      bank_branch: emptyToNull(os.bank_branch),
      facebook: emptyToNull(os.facebook),
      twitter: emptyToNull(os.twitter),
      linkedin: emptyToNull(os.linkedin),
      instagram: emptyToNull(os.instagram),
      resume: emptyToNull(os.resume),
      joining_letter: emptyToNull(os.joining_letter),
      resignation_letter: emptyToNull(os.resignation_letter),
      other_document_file: emptyToNull(os.other_document_file),
      other_document_name: emptyToNull(os.other_document_name),
      // leaves_data default {}
    };

    // Ensure basic_salary null if NaN
    if (record.basic_salary !== null && isNaN(record.basic_salary)) record.basic_salary = null;

    // Build dynamic insert
    const cols = Object.keys(record);
    const vals = Object.values(record);
    const placeholders = cols.map((_,i)=>`$${i+1}`).join(', ');
    try {
      await pgPool.query(`INSERT INTO staff (${cols.join(', ')}) VALUES (${placeholders})`, vals);
      inserted++;
      existingStaffIds.add(keyId);
      if (emailKey) existingEmails.add(emailKey);
      console.log(`  Inserted ${employeeId} (${fullName}) desig=${designationId} role=${role}`);
    } catch (e) {
      console.error(`  FAILED ${employeeId} (${fullName}): ${e.message}`);
      // show detail
      // console.error(e);
      failed++;
    }
  }

  console.log(`\n=== Staff import summary ===`);
  console.log(`Inserted: ${inserted}, Skipped (duplicates): ${skipped}, Failed: ${failed}`);

  // Final counts
  const { rows: finalDesigs } = await pgPool.query('SELECT id, name FROM designations WHERE school_id=$1 ORDER BY id', [SCHOOL_ID]);
  console.log(`\nFinal designations for school ${SCHOOL_ID} (${finalDesigs.length}):`);
  console.log(finalDesigs.map(r=>`${r.id}:${r.name}`).join(', '));

  const { rows: finalStaff } = await pgPool.query('SELECT staff_id, name, surname, email, designation_id, role, status FROM staff WHERE school_id=$1 ORDER BY staff_id', [SCHOOL_ID]);
  console.log(`\nFinal staff for school ${SCHOOL_ID} (${finalStaff.length}):`);
  for (const s of finalStaff) {
    console.log(`  ${s.staff_id} | ${s.name} ${s.surname} | ${s.email} | desig=${s.designation_id} | ${s.role} | ${s.status}`);
  }

  await mysqlConn.end();
  await pgPool.end();
  console.log('\nDone.');
}

main().catch(e=>{ console.error(e); process.exit(1) });
