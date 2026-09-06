const { Pool } = require("pg");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DEFAULT_STUDENT_PASSWORD = "Stud@123";
const DEFAULT_PARENT_PASSWORD = "Parent@1";

function resolveConnectionString() {
  const envFile = path.join(__dirname, "..", ".env");
  try {
    const envText = fs.readFileSync(envFile, "utf8");
    const m = envText.match(/^DATABASE_URL\s*=\s*["']?(.+?)["']?\s*$/m);
    if (m) return m[1].trim();
  } catch (e) {
    // fall through
  }
  return "postgresql://postgres:123@localhost/appstrice_school";
}

const pool = new Pool({ connectionString: resolveConnectionString(), max: 4 });

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function usernameFromAdmissionNo(admissionNo) {
  return String(admissionNo || "").replace(/[-._\s]+/g, "").trim();
}

function parentUsernameFromAdmissionNo(admissionNo) {
  return `${usernameFromAdmissionNo(admissionNo)}P`;
}

async function uniqueUsername(preferred, excludeId) {
  const base = usernameFromAdmissionNo(preferred) || "user";
  for (let i = 1; i < 1000; i++) {
    const candidate = i === 1 ? base : `${base}${i}`;
    const res = excludeId
      ? await pool.query(`SELECT id FROM users WHERE lower(username) = lower($1) AND id <> $2`, [candidate, excludeId])
      : await pool.query(`SELECT id FROM users WHERE lower(username) = lower($1)`, [candidate]);
    if (res.rows.length === 0) return candidate;
  }
  return `${base}${Date.now()}`;
}

async function findRoleId(role, schoolId) {
  const scoped = await pool.query(`SELECT id FROM roles WHERE name = $1 AND school_id = $2`, [role, schoolId]);
  if (scoped.rows[0]) return Number(scoped.rows[0].id);
  const system = await pool.query(`SELECT id FROM roles WHERE name = $1 AND school_id IS NULL`, [role]);
  return system.rows[0] ? Number(system.rows[0].id) : null;
}

async function uniqueEmail(preferred) {
  const base = String(preferred || "").trim().toLowerCase();
  const at = base.indexOf("@");
  const local = at > 0 ? base.slice(0, at) : "";
  const domain = at > 0 ? base.slice(at + 1) : "";
  if (!local || !domain) return null;
  for (let i = 0; i < 500; i++) {
    const candidate = i === 0 ? base : `${local}${i}@${domain}`;
    const found = await pool.query(`SELECT id FROM users WHERE lower(email) = lower($1)`, [candidate]);
    if (found.rows.length === 0) return candidate;
  }
  return null;
}

function hasValidEmail(v) {
  return typeof v === "string" && v.includes("@") && v.trim().length > 3;
}

async function provisionStudent(student, schoolCode, report, created) {
  const admissionBase = usernameFromAdmissionNo(student.admission_no);
  if (!admissionBase) return;

  const studentRoleId = await findRoleId("student", student.school_id);
  const parentRoleId = await findRoleId("parent", student.school_id);
  const code = String(schoolCode || "school").toLowerCase().replace(/[^a-z0-9]/g, "") || "school";
  const synthDomain = `${code}.school`;
  const sId = Number(student.id);

  // ---- student user ----
  if (student.user_id) {
    const uid = Number(student.user_id);
    const existing = (await pool.query(`SELECT username FROM users WHERE id = $1`, [uid])).rows[0];
    const final = await uniqueUsername(admissionBase, uid);
    if (existing && String(existing.username || "").trim() !== final) {
      await pool.query(`UPDATE users SET username = $1 WHERE id = $2`, [final, uid]);
      report.push(`student  id=${sId} (adm ${student.admission_no}): username ${existing.username} -> ${final}`);
    }
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hashPassword(DEFAULT_STUDENT_PASSWORD), uid]);
    report.push(`student  id=${sId}: password reset to ${DEFAULT_STUDENT_PASSWORD}`);
  } else {
    const username = await uniqueUsername(admissionBase);
    const rawEmail = hasValidEmail(student.email) ? student.email : `${admissionBase}@${synthDomain}`;
    const email = await uniqueEmail(rawEmail);
    const name = String(student.name || [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ") || "Student").trim();
    const ins = await pool.query(
      `INSERT INTO users (username, name, email, password_hash, role, role_id, school_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Active') RETURNING id`,
      [username, name, email, hashPassword(DEFAULT_STUDENT_PASSWORD), "student", studentRoleId, student.school_id]
    );
    await pool.query(`UPDATE students SET user_id = $1 WHERE id = $2`, [Number(ins.rows[0].id), sId]);
    report.push(`student  id=${sId} (adm ${student.admission_no}): CREATED login ${username} / ${DEFAULT_STUDENT_PASSWORD} (${email})`);
    created.students += 1;
  }

  // ---- parent user ----
  const guard = await pool.query(
    `SELECT parent_user_id FROM student_guardians WHERE student_id = $1 ORDER BY id LIMIT 1`,
    [sId]
  );
  const pBase = parentUsernameFromAdmissionNo(student.admission_no);
  if (guard.rows[0]) {
    const pid = Number(guard.rows[0].parent_user_id);
    const existing = (await pool.query(`SELECT username FROM users WHERE id = $1`, [pid])).rows[0];
    const final = await uniqueUsername(pBase, pid);
    if (existing && String(existing.username || "").trim() !== final) {
      await pool.query(`UPDATE users SET username = $1 WHERE id = $2`, [final, pid]);
      report.push(`parent   for student ${sId} (adm ${student.admission_no}): username ${existing.username} -> ${final}`);
    }
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hashPassword(DEFAULT_PARENT_PASSWORD), pid]);
    report.push(`parent   for student ${sId}: password reset to ${DEFAULT_PARENT_PASSWORD}`);
  } else {
    const username = await uniqueUsername(pBase);
    const rawEmail = hasValidEmail(student.guardian_email)
      ? student.guardian_email
      : `${pBase.toLowerCase()}@${synthDomain}`;
    const email = await uniqueEmail(rawEmail);
    const name = String(student.guardian_name || student.father_name || student.mother_name || "Parent").trim() || "Parent";
    const ins = await pool.query(
      `INSERT INTO users (username, name, email, password_hash, role, role_id, school_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Active') RETURNING id`,
      [username, name, email, hashPassword(DEFAULT_PARENT_PASSWORD), "parent", parentRoleId, student.school_id]
    );
    await pool.query(
      `INSERT INTO student_guardians (student_id, parent_user_id, parent_type, school_id) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
      [sId, Number(ins.rows[0].id), String(student.guardian_is || "Guardian").slice(0, 50), student.school_id]
    );
    report.push(`parent   for student ${sId} (adm ${student.admission_no}): CREATED login ${username} / ${DEFAULT_PARENT_PASSWORD} (${email})`);
    created.parents += 1;
  }
}

async function main() {
  const schools = await pool.query(`SELECT id, code FROM schools ORDER BY id`);
  const schoolsByCode = new Map();
  for (const sch of schools.rows) schoolsByCode.set(Number(sch.id), sch.code);

  const students = await pool.query(`SELECT * FROM students WHERE admission_no IS NOT NULL ORDER BY id`);

  const report = [];
  const created = { students: 0, parents: 0 };

  for (const s of students.rows) {
    const code = schoolsByCode.get(Number(s.school_id));
    await provisionStudent(s, code, report, created);
  }

  // Users with role student/parent that are NOT linked to any student:
  // reset their password too so every portal account follows the rule.
  const orphans = await pool.query(
    `SELECT u.id, u.username, u.role FROM users u
     WHERE u.role IN ('student','parent')
       AND NOT EXISTS (SELECT 1 FROM students st WHERE st.user_id = u.id)
       AND NOT EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.parent_user_id = u.id)`
  );
  for (const o of orphans.rows) {
    const pwd = o.role === "student" ? DEFAULT_STUDENT_PASSWORD : DEFAULT_PARENT_PASSWORD;
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hashPassword(pwd), Number(o.id)]);
    report.push(`${o.role} (unlinked) id=${o.id} ${o.username}: password reset to ${pwd}`);
  }

  // Repair portal users that were created with a NULL/empty email
  const noEmail = await pool.query(
    `SELECT u.id, u.username, u.role, u.school_id, sc.code FROM users u
     LEFT JOIN schools sc ON sc.id = u.school_id
     WHERE u.role IN ('student','parent') AND (u.email IS NULL OR u.email = '')`
  );
  let emailFixed = 0;
  for (const u of noEmail.rows) {
    const code = String(u.code || "school").toLowerCase().replace(/[^a-z0-9]/g, "") || "school";
    const base = usernameFromAdmissionNo(u.username) || (u.role === "parent" ? "parent" : "student");
    const candidate = `${base}@${code}.school`;
    const email = await uniqueEmail(candidate);
    if (email) {
      await pool.query(`UPDATE users SET email = $1 WHERE id = $2`, [email, Number(u.id)]);
      emailFixed += 1;
      report.push(`${u.role} id=${u.id} ${u.username}: email fixed to ${email}`);
    }
  }

  console.log(`Password rule check: ${DEFAULT_STUDENT_PASSWORD} / ${DEFAULT_PARENT_PASSWORD} (8 chars, upper+lower+number+symbol)`);
  console.log("---");
  console.log(report.join("\n") || "Nothing to do");
  console.log(`\nDone. Students processed: ${students.rowCount}, logins created: ${created.students} student + ${created.parents} parent.`);
  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error("Backfill failed:", e.message);
  process.exit(1);
});