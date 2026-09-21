const { Pool } = require("pg");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function getConnectionString() {
  try {
    const env = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
    const m = env.match(/DATABASE_URL\s*=\s*"([^"]+)"/) || env.match(/DATABASE_URL\s*=\s*([^\r\n]+)/);
    if (m && m[1]) return m[1].replace(/^"|"$/g, "").trim();
  } catch {}
  return process.env.DATABASE_URL || "postgresql://postgres:123@localhost/appstrice_school";
}

const pool = new Pool({
  connectionString: getConnectionString(),
  max: 4,
  ssl: getConnectionString().includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function formatDobPassword(dob) {
  if (dob instanceof Date) {
    if (isNaN(dob.getTime())) return "";
    return `${String(dob.getDate()).padStart(2, "0")}${String(dob.getMonth() + 1).padStart(2, "0")}${String(dob.getFullYear()).padStart(4, "0")}`;
  }
  const raw = String(dob || "").trim();
  if (!raw) return "";
  let d = "", m = "", y = "";
  let iso = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) { y = iso[1]; m = iso[2]; d = iso[3]; }
  else {
    const dmy = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmy) { d = dmy[1]; m = dmy[2]; y = dmy[3]; }
  }
  if (!y) {
    const t = new Date(raw);
    if (!isNaN(t.getTime())) { d = String(t.getDate()); m = String(t.getMonth() + 1); y = String(t.getFullYear()); }
  }
  if (!y) return "";
  return `${d.padStart(2, "0")}${m.padStart(2, "0")}${y.padStart(4, "0")}`;
}

function studentPasswordFrom(firstName, dob) {
  const name = String(firstName || "").trim();
  const dobPart = formatDobPassword(dob);
  if (!name || !dobPart) return "";
  const first = name.charAt(0).toUpperCase();
  const second = name.length > 1 ? name.charAt(1).toLowerCase() : "x";
  return `${first}${second}${dobPart}`;
}

async function main() {
  const students = (await pool.query(`
    SELECT s.id, s.first_name, s.dob, s.admission_no, s.user_id
    FROM students s
    WHERE s.first_name IS NOT NULL AND s.first_name <> '' AND s.dob IS NOT NULL
    ORDER BY s.id
  `)).rows;

  let updated = 0;
  let skippedNoUser = 0;
  let skippedNoPw = 0;
  const sample = [];

  for (const s of students) {
    const password = studentPasswordFrom(s.first_name, s.dob);
    if (!password) { skippedNoPw++; continue; }

    let userId = s.user_id ? Number(s.user_id) : null;
    if (!userId) {
      const base = String(s.admission_no || "").replace(/[-._\s]+/g, "").trim();
      if (base) {
        const u = (await pool.query(
          `SELECT id FROM users WHERE lower(username) = lower($1) AND role = 'student' LIMIT 1`,
          [base]
        )).rows[0];
        if (u) {
          userId = Number(u.id);
          await pool.query(`UPDATE students SET user_id = $1 WHERE id = $2`, [userId, s.id]);
        }
      }
    }
    if (!userId) { skippedNoUser++; continue; }

    const hash = hashPassword(password);
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2 AND role = 'student'`, [hash, userId]);
    updated++;
    if (sample.length < 3) sample.push({ id: s.id, name: s.first_name, dob: s.dob, username: s.admission_no, password });
  }

  console.log(JSON.stringify({
    total_students: students.length,
    updated,
    skipped_no_user: skippedNoUser,
    skipped_no_password: skippedNoPw,
    sample,
  }, null, 2));

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});