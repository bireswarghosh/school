const { Pool } = require("pg");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost/appstrice_school",
  max: 4,
});

const SQL_FILES = [
  path.join(__dirname, "..", "src", "lib", "sql", "030_saas_schema.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "031_saas_plans.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "032_followup_log.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "033_visitor_class_section.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "034_subscriptions_invoices.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "035_payment_settings.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "036_postal_attachments.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "037_student_timeline_behaviour.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "038_student_import_fields.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "039_system_fields.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "040_backup_records.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "041_online_admission_fields.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "042_online_admission_student.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "043_online_admission_settings.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "044_class_section_mapping.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "045_subject_group_relations.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "046_student_import_fixes.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "047_student_photos.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "048_students_inventory.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "049_students_inventory_book_class.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "050_students_inventory_booklist.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "051_fees_masters_sort.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "052_pos_book_sales.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "053_my_api_user_links.sql"),
  path.join(__dirname, "..", "src", "lib", "sql", "054_school_settings.sql"),
];

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

const TENANT_TABLES = [
  "classes","sections","subjects","subject_groups","departments","designations","staff","students",
  "sessions","student_categories","student_houses","disable_reasons","student_promotions","online_admissions",
  "alumni","alumni_events","alumni_attendance","alumni_finance","class_teachers","timetable_entries","lessons",
  "topics","lesson_plans","syllabus_statuses","content_types","content_items","video_tutorials","homework",
  "attendance_types","student_attendance","staff_attendance","leave_types","leave_requests","qr_attendance",
  "exam_groups","exams","exam_subjects","exam_marks","marks_divisions","marks_grades","online_exams","questions",
  "question_bank","exam_attempts","exam_answers","exam_public_links","online_exam_questions",
  "cbse_exams","cbse_exam_subjects","cbse_exam_students","cbse_exam_marks","cbse_terms","cbse_assessments",
  "cbse_obs_params","cbse_exam_grades","cbse_student_attendance","cbse_exam_schedules","cbse_admit_cards",
  "cbse_templates","cbse_settings","cbse_observations","books","book_issues","library_members",
  "pickup_points","routes","vehicles","route_vehicles","route_pickup_points","student_transport_fees",
  "hostels","room_types","hostel_rooms","item_categories","items","item_suppliers","item_stores","item_stocks",
  "item_issues","item_sub_categories","brands","units","product_variants","purchase_orders","purchase_order_items",
  "discounts","inventory_adjustments","stock_transfers","fees_masters","fees_groups","fees_types","fees_discounts",
  "fees_payments","fees_carry_forward","fees_reminders","offline_payments","income_heads","incomes","expense_heads",
  "expenses","payroll","teachers_ratings","disabled_staff","staff_id_cards","certificate_templates","certificates",
  "student_id_cards","front_events","gallery_items","news_items","media_items","cms_pages","cms_menus","banners",
  "notices","email_templates","sms_templates","scheduled_logs","events","holiday_types","course_categories","courses",
  "course_enrollments","course_payments","course_settings","course_questions","course_certificate_templates",
  "live_classes","live_class_sections","live_meetings","live_meeting_invitees","custom_fields","custom_field_values",
  "incidents","incident_assignments","student_timeline","admission_enquiries","visitor_book","phone_call_logs","postal_dispatches",
  "postal_receives","complaints","enquiry_types","purpose_types","complaint_types","source_types","reference_types",
  "admission_enquiry_followups",
  "user_logs","sidebar_menus","system_fields","backup_records","online_admission_settings",
  "subject_group_sections","subject_group_subjects",
  "si_categories","si_brands","si_units","si_stores","si_vendors","si_products","si_books",
  "si_variations","si_purchases","si_stock","si_sales","si_ledger","si_coupons",
  "student_guardians",
];

async function main() {
  // 1. Run schema migrations
  for (const file of SQL_FILES) {
    const sql = fs.readFileSync(file, "utf8");
    await pool.query(sql);
    console.log("[1] Applied", path.basename(file));
  }

  // 2. Ensure default school exists
  const schoolRes = await pool.query(`SELECT id FROM schools WHERE code = 'DEFAULT'`);
  let defaultSchoolId;
  if (schoolRes.rows.length === 0) {
    const ins = await pool.query(
      `INSERT INTO schools (code, name, email, status, plan) VALUES ('DEFAULT', 'Smart School', 'admin@smart-school.in', 'Active', 'Free') RETURNING id`
    );
    defaultSchoolId = ins.rows[0].id;
    console.log("[2] Created default school (DEFAULT)");
  } else {
    defaultSchoolId = schoolRes.rows[0].id;
    console.log("[2] Default school already exists (id", defaultSchoolId + ")");
  }

  // 3. Backfill school_id = default for existing tenant rows
  for (const table of TENANT_TABLES) {
    const exists = await pool.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name='school_id'`,
      [table]
    );
    if (exists.rows.length > 0) {
      await pool.query(`UPDATE ${table} SET school_id = $1 WHERE school_id IS NULL`, [defaultSchoolId]);
    }
  }
  console.log("[3] Backfilled school_id for existing data");

  // 4. Seed system roles
  const roles = [
    { name: "super_admin", label: "Super Admin", perms: ["*"] },
    { name: "admin", label: "School Admin", perms: ["*"] },
    { name: "teacher", label: "Teacher", perms: ["dashboard", "student_view", "my_class", "homework", "attendance_mark", "lesson_plan", "exam_view", "marks_entry"] },
    { name: "staff", label: "Staff", perms: ["dashboard", "front_office", "student_view"] },
    { name: "student", label: "Student", perms: ["dashboard", "online_exam", "homework_view"] },
    { name: "parent", label: "Parent", perms: ["dashboard", "student_view", "fees_view"] },
  ];
  for (const r of roles) {
    const found = await pool.query(`SELECT id FROM roles WHERE name=$1 AND school_id IS NULL`, [r.name]);
    if (found.rows.length === 0) {
      await pool.query(
        `INSERT INTO roles (name, label, permissions, is_system, school_id) VALUES ($1,$2,$3,true,NULL)`,
        [r.name, r.label, JSON.stringify(r.perms)]
      );
      console.log("    role:", r.name);
    }
  }
  console.log("[4] System roles seeded");

  // 5. Super admin user
  const superRole = await pool.query(`SELECT id FROM roles WHERE name='super_admin' AND school_id IS NULL`);
  await upsertUser({
    username: "superadmin",
    name: "Super Admin",
    email: "superadmin@smart-school.in",
    password: "Super@123",
    role: "super_admin",
    roleId: superRole.rows[0]?.id,
    schoolId: null,
  });

  // 6. Default school admin
  const adminRole = await pool.query(`SELECT id FROM roles WHERE name='admin' AND school_id IS NULL`);
  await upsertUser({
    username: "admin",
    name: "School Admin",
    email: "admin@smart-school.in",
    password: "Admin@123",
    role: "admin",
    roleId: adminRole.rows[0]?.id,
    schoolId: defaultSchoolId,
  });

  console.log("[5][6] Seed users created");

  // 7. Demo portal users (student / parent / teacher) + record linking
  const demoRoles = {
    teacher: (await pool.query(`SELECT id FROM roles WHERE name='teacher' AND school_id IS NULL`)).rows[0]?.id,
    student: (await pool.query(`SELECT id FROM roles WHERE name='student' AND school_id IS NULL`)).rows[0]?.id,
    parent: (await pool.query(`SELECT id FROM roles WHERE name='parent' AND school_id IS NULL`)).rows[0]?.id,
  };

  await upsertUser({
    username: "demo_teacher",
    name: "Mrs. Anjali Deshmukh",
    email: "teacher@smart-school.in",
    password: "Teacher@123",
    role: "teacher",
    roleId: demoRoles.teacher,
    schoolId: defaultSchoolId,
  });
  await upsertUser({
    username: "demo_student",
    name: "Aarav Gupta",
    email: "student@smart-school.in",
    password: "Student@123",
    role: "student",
    roleId: demoRoles.student,
    schoolId: defaultSchoolId,
  });
  await upsertUser({
    username: "demo_parent",
    name: "Mr. Gupta",
    email: "parent@smart-school.in",
    password: "Parent@123",
    role: "parent",
    roleId: demoRoles.parent,
    schoolId: defaultSchoolId,
  });

  // 8. Demo portal data for the default school (self-contained, idempotent)
  const demoUserIds = {};
  for (const key of ["teacher", "student", "parent"]) {
    const row = await pool.query(`SELECT id FROM users WHERE email=$1`, [`${key}@smart-school.in`]);
    demoUserIds[key] = row.rows[0]?.id;
  }

  const classRow = await pool.query(
    `SELECT id, name FROM classes WHERE school_id=$1 ORDER BY order_number NULLS LAST, id LIMIT 1`,
    [defaultSchoolId]
  );
  const demoClassId = classRow.rows[0]?.id;

  if (!demoClassId) {
    console.warn("[8] Default school has no classes - skipping portal demo data");
  } else {
    // Section
    let sec = await pool.query(`SELECT id FROM sections WHERE class_id=$1 AND name='A' AND school_id=$2`, [demoClassId, defaultSchoolId]);
    if (sec.rows.length === 0) {
      sec = await pool.query(`INSERT INTO sections (class_id, name, school_id) VALUES ($1,'A',$2) RETURNING id`, [demoClassId, defaultSchoolId]);
    }
    const sectionId = sec.rows[0].id;

    // Demo teacher staff record
    await pool.query(
      `INSERT INTO staff (staff_id, name, email, phone, department_id, designation_id, role, status, school_id, user_id)
       VALUES ('DEMO-T01','Mrs. Anjali Deshmukh','teacher@smart-school.in','9876543290',2,1,'Teacher','Active',$1,$2)
       ON CONFLICT (staff_id) DO UPDATE SET user_id=EXCLUDED.user_id, name=EXCLUDED.name, school_id=EXCLUDED.school_id`,
      [defaultSchoolId, demoUserIds.teacher]
    );

    // Class teacher link
    await pool.query(
      `INSERT INTO class_teachers (class_id, section_id, teacher_name, school_id) VALUES ($1,$2,'Mrs. Anjali Deshmukh',$3)
       ON CONFLICT DO NOTHING`,
      [demoClassId, sectionId, defaultSchoolId]
    );

    // Timetable (Mon-Sat, 7 periods)
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const subjNames = ["Mathematics", "Science", "English", "Hindi", "Social Studies", "Computer Science"];
    const periods = [["09:00", "09:45"], ["09:45", "10:30"], ["10:30", "11:15"], ["11:30", "12:15"], ["12:15", "13:00"], ["13:30", "14:15"], ["14:15", "15:00"]];
    for (let d = 0; d < days.length; d++) {
      for (let p = 0; p < periods.length; p++) {
        const ex = await pool.query(
          `SELECT id FROM timetable_entries WHERE class_id=$1 AND section_id=$2 AND day=$3 AND period=$4`,
          [demoClassId, sectionId, days[d], p + 1]
        );
        if (ex.rows.length > 0) continue;
        await pool.query(
          `INSERT INTO timetable_entries (class_id, section_id, teacher_name, subject_name, day, period, start_time, end_time, school_id)
           VALUES ($1,$2,'Mrs. Anjali Deshmukh',$3,$4,$5,$6,$7,$8)`,
          [demoClassId, sectionId, subjNames[(d * 3 + p) % subjNames.length], days[d], p + 1, periods[p][0], periods[p][1], defaultSchoolId]
        );
      }
    }

    // Demo student
    let stu = await pool.query(`SELECT id FROM students WHERE email='aarav.gupta@student.edu'`);
    if (stu.rows.length === 0) {
      stu = await pool.query(
        `INSERT INTO students (admission_no, name, first_name, last_name, class_id, section_id, roll_no, email, phone, status, school_id, user_id, gender)
         VALUES ('DEMO-001','Aarav Gupta','Aarav','Gupta',$1,$2,1,'aarav.gupta@student.edu','9876500001','Active',$3,$4,'Male') RETURNING id`,
        [demoClassId, sectionId, defaultSchoolId, demoUserIds.student]
      );
    } else {
      await pool.query(
        `UPDATE students SET class_id=$1, section_id=$2, school_id=$3, user_id=$4 WHERE id=$5`,
        [demoClassId, sectionId, defaultSchoolId, demoUserIds.student, stu.rows[0].id]
      );
    }
    const studentId = stu.rows[0].id;

    // Parent link
    const guard = await pool.query(
      `SELECT id FROM student_guardians WHERE student_id=$1 AND parent_user_id=$2`,
      [studentId, demoUserIds.parent]
    );
    if (guard.rows.length === 0) {
      await pool.query(
        `INSERT INTO student_guardians (student_id, parent_user_id, parent_type, school_id) VALUES ($1,$2,'Father',$3)`,
        [studentId, demoUserIds.parent, defaultSchoolId]
      );
    }

    // Fees group / types / masters
    let fg = await pool.query(`SELECT id FROM fees_groups WHERE school_id=$1 AND name='Term Fees'`, [defaultSchoolId]);
    if (fg.rows.length === 0) {
      fg = await pool.query(`INSERT INTO fees_groups (name, description, status, school_id) VALUES ('Term Fees','Demo term fees','Active',$1) RETURNING id`, [defaultSchoolId]);
    }
    const feeGroupId = fg.rows[0].id;
    const feeItems = [["Tuition Fee", "2500.00", "2026-03-31"], ["Exam Fee", "800.00", "2026-04-30"], ["Transport Fee", "1500.00", "2026-05-31"]];
    const feeTypeIds = [];
    for (const [name, amount, due] of feeItems) {
      let ft = await pool.query(`SELECT id FROM fees_types WHERE school_id=$1 AND name=$2 AND fees_group_id=$3`, [defaultSchoolId, name, feeGroupId]);
      if (ft.rows.length === 0) {
        ft = await pool.query(
          `INSERT INTO fees_types (name, fees_group_id, amount, status, school_id, class_id, fees_code)
           VALUES ($1,$2,$3,'Active',$4,$5,$6) RETURNING id`,
          [name, feeGroupId, amount, defaultSchoolId, demoClassId, "DEMO-" + name.split(" ")[0].toUpperCase()]
        );
      }
      feeTypeIds.push(ft.rows[0].id);
      const m = await pool.query(`SELECT id FROM fees_masters WHERE class_id=$1 AND fees_type_id=$2`, [demoClassId, ft.rows[0].id]);
      if (m.rows.length === 0) {
        await pool.query(
          `INSERT INTO fees_masters (class_id, fees_group_id, fees_type_id, amount, due_date, status, fine_type, fine_value, per_day, school_id, sort_order)
           VALUES ($1,$2,$3,$4,$5,'Active','Fix Amount',100.00,false,$6,0)`,
          [demoClassId, feeGroupId, ft.rows[0].id, amount, due, defaultSchoolId]
        );
      }
    }

    // Exam group / exam / subjects / marks
    let eg = await pool.query(`SELECT id FROM exam_groups WHERE school_id=$1 AND name='Term Exams'`, [defaultSchoolId]);
    if (eg.rows.length === 0) {
      eg = await pool.query(`INSERT INTO exam_groups (name, exam_type, description, school_id) VALUES ('Term Exams','Term','Demo term exams',$1) RETURNING id`, [defaultSchoolId]);
    }
    let ex = await pool.query(`SELECT id FROM exams WHERE group_id=$1 AND name='Mid-Term Examination'`, [eg.rows[0].id]);
    if (ex.rows.length === 0) {
      ex = await pool.query(
        `INSERT INTO exams (group_id, name, session, publish_exam, publish_result, admit_card_roll_no, passing_percentage, description, school_id)
         VALUES ($1,'Mid-Term Examination','2026-27',true,true,false,33,'Mid-term demo exam',$2) RETURNING id`,
        [eg.rows[0].id, defaultSchoolId]
      );
    }
    const examId = ex.rows[0].id;
    const examSubs = ["Mathematics", "English", "Science"];
    const examSubIds = {};
    const marksMap = { "Mathematics": 86, "English": 74, "Science": 91 };
    for (const name of examSubs) {
      let es = await pool.query(`SELECT id FROM exam_subjects WHERE exam_id=$1 AND name=$2`, [examId, name]);
      if (es.rows.length === 0) {
        es = await pool.query(`INSERT INTO exam_subjects (exam_id, name, theory_max, theory_pass, school_id) VALUES ($1,$2,100,33,$3) RETURNING id`, [examId, name, defaultSchoolId]);
      }
      examSubIds[name] = es.rows[0].id;
      const em = await pool.query(`SELECT id FROM exam_marks WHERE exam_id=$1 AND student_id=$2 AND subject_id=$3`, [examId, studentId, es.rows[0].id]);
      if (em.rows.length === 0) {
        await pool.query(
          `INSERT INTO exam_marks (exam_id, subject_id, student_id, theory_marks, practical_marks, absent, notes, school_id)
           VALUES ($1,$2,$3,$4,0,false,'Demo mark',$5)`,
          [examId, es.rows[0].id, studentId, marksMap[name], defaultSchoolId]
        );
      }
    }

    console.log(`[8] Demo portal data created for "${classRow.rows[0].name}" (school ${defaultSchoolId})`);
  }

  console.log("\n✓ SaaS migration complete.");
  console.log("   Super admin login:  superadmin@smart-school.in / Super@123   (URL: /saas/login)");
  console.log("   School admin login: admin@smart-school.in / Admin@123   (URL: /login  school code: DEFAULT)");
  console.log("   Student portal:     student@smart-school.in / Student@123   (URL: /login  school code: DEFAULT)");
  console.log("   Parent portal:      parent@smart-school.in / Parent@123   (URL: /login  school code: DEFAULT)");
  console.log("   Teacher portal:     teacher@smart-school.in / Teacher@123   (URL: /login  school code: DEFAULT)");
  await pool.end();
  process.exit(0);
}

async function upsertUser(u) {
  const existing = await pool.query(`SELECT id, username, email FROM users WHERE email=$1 OR username=$1`, [u.email]);
  if (existing.rows.length > 0) {
    // ensure username is unique across the table before updating
    const clash = await pool.query(`SELECT id FROM users WHERE username=$1 AND id <> $2`, [u.username, existing.rows[0].id]);
    const finalUsername = clash.rows.length > 0 ? `${u.username}_${existing.rows[0].id}` : u.username;
    await pool.query(
      `UPDATE users SET username=$1, name=$2, role=$3, role_id=$4, school_id=$5, status='Active' WHERE id=$6`,
      [finalUsername, u.name, u.role, u.roleId, u.schoolId, existing.rows[0].id]
    );
    return;
  }
  try {
    await pool.query(
      `INSERT INTO users (username, name, email, password_hash, role, role_id, school_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Active')`,
      [u.username, u.name, u.email, hashPassword(u.password), u.role, u.roleId, u.schoolId]
    );
  } catch (e) {
    if (e.code === "23505") {
      await pool.query(
        `UPDATE users SET name=$1, role=$2, role_id=$3, school_id=$4, status='Active' WHERE email=$5`,
        [u.name, u.role, u.roleId, u.schoolId, u.email]
      );
    } else {
      throw e;
    }
  }
}

main().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});