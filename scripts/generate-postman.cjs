// Generates Postman collections with realistic sample data:
//   public/smart-school.postman_collection.json      -> school edition (Auth + portal roles + school admin CRUD)
//   public/smart-school-saas.postman_collection.json -> full edition (same + Super Admin SaaS APIs)
// Run: node scripts/generate-postman.cjs

const fs = require("fs")
const path = require("path")

const BASE = process.env.BASE_URL || "http://localhost:3001"
const SCHEMA = "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"

function req(method, endpoint, desc, opts = {}) {
  const { body, queryParams } = opts
  const pathSegs = endpoint.split("?")[0].split("/")
  const url = {
    raw: `{{base_url}}/api/${endpoint}`,
    host: ["{{base_url}}"],
    path: ["api", ...pathSegs],
  }
  if (queryParams && queryParams.length) {
    url.query = queryParams.map((q) => {
      if (typeof q === "string") return { key: q, value: "", description: "" }
      return { key: q.key, value: q.value || "", description: q.desc || "" }
    })
  }
  const item = {
    name: `${method} /api/${endpoint}${opts.name ? ` (${opts.name})` : ""}`,
    request: {
      method,
      header: [{ key: "Content-Type", value: "application/json" }],
      url,
      description: desc,
    },
  }
  if (body !== undefined) {
    item.request.body = {
      mode: "raw",
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: "json" } },
    }
  }
  return item
}

const folder = (name, description, items) => ({ name, description, item: items })

// ----------------------------------------------------------------
// Auth folder
// ----------------------------------------------------------------
const loginReq = (role, body, note) =>
  req("POST", "auth/login", `Login as ${role}. The response sets the httpOnly smart_school_session cookie (web) and also returns the session as the \`token\` field in the JSON body — send \`Authorization: Bearer <token>\` from a mobile/Flutter app.${note ? " " + note : ""}`, {
    name: role,
    body,
  })

const loginItems = [
  loginReq("School Admin", { email: "admin@smart-school.in", password: "Admin@123", schoolCode: "DEFAULT" }, "Redirects to /admin."),
  loginReq("Teacher", { email: "teacher@yourschool.com", password: "<set-by-admin>", schoolCode: "DEFAULT" }, "Redirects to /portal."),
  loginReq("Student", { email: "student@yourschool.com", password: "<set-by-admin>", schoolCode: "DEFAULT" }, "Requires students.user_id linked to the login."),
  loginReq("Parent", { email: "parent@yourschool.com", password: "<set-by-admin>", schoolCode: "DEFAULT" }, "Sees only kids linked via student_guardians."),
]

function buildAuthItems(includeSuperAdmin) {
  return [
    folder("Login (pick your role)", "Run ONE of these first. Postman saves the session cookie automatically.", includeSuperAdmin ? [...loginItems, loginReq("Super Admin", { email: "superadmin@smart-school.in", password: "Super@123" }, "Omit schoolCode entirely - redirects to /saas.")] : loginItems),
    req("GET", "auth/me", "Current user, role, permissions and school."),
    req("POST", "auth/logout", "Clear the session cookie.", { body: {} }),
    req(
      "POST",
      "auth/register",
      "Public self-registration of a new school + its admin (default password Admin@123). No auth required.",
      {
        body: {
          name: "Sunrise Public School",
          email: "principal@sunrise-school.in",
          mobile: "9876543210",
          address: "MG Road, Pune",
          tagline: "Learn Grow Shine",
          adminName: "Mrs. Kavita Rao",
        },
      }
    ),
  ]
}

// ----------------------------------------------------------------
// Portal role folders (/api/my/*)
// ----------------------------------------------------------------
const commonMy = [
  req("GET", "my", "Discovery — every endpoint available to the logged-in role."),
  req("GET", "my/dashboard", "Role-aware dashboard counters."),
  req("GET", "my/profile", "Account + linked student/staff/kids record."),
  req("GET", "my/student/notices", "Published notices."),
]

const studentFolder = folder(
  "1. Student Portal",
  "Endpoints for a STUDENT login. All are read-only and scoped to the logged-in student.",
  [
    ...commonMy,
    req("GET", "my/student", "My profile summary."),
    req("GET", "my/student/profile", "My profile enriched with class & section names."),
    req("GET", "my/student/details", "Full record — profile, parents, bank, fees, exams, attendance summary."),
    req("GET", "my/student/homework", "Homework for my class/section."),
    req("GET", "my/student/timetable", "My weekly timetable."),
    req("GET", "my/student/exams", "My published exam results."),
    req("GET", "my/student/attendance", "My monthly attendance.", {
      queryParams: [{ key: "month", value: "2026-08", desc: "YYYY-MM, defaults to current month" }],
    }),
    req("GET", "my/student/fees", "My fee dues vs payments."),
    req("POST", "my/fees/pay/order", "Start online (Razorpay) fee payment — returns orderId/keyId for the checkout SDK.", {
      body: { studentId: 15, feesTypeId: 3, amount: 3000 },
      name: "Razorpay order",
    }),
    req("POST", "my/fees/pay/verify", "Verify the Razorpay payment and mark the fee as paid (returns fresh ledger).", {
      body: { paymentId: 61, studentId: 15, razorpayPaymentId: "pay_LIc9k4SgwYg8mNx" },
      name: "Razorpay verify",
    }),
    req("GET", "my/student/library", "My issued library books."),
    req("GET", "my/student/book-requests", "Library book catalogue with my request status."),
    req("POST", "my/student/book-requests", "Request a library book (Pending until librarian accepts).", {
      body: { bookId: 12 },
    }),
    req("GET", "my/student/hostel", "Hostels + rooms available in my school."),
    req("GET", "my/student/lesson-plans", "Lesson plans for my class/section with syllabus progress."),
    req("GET", "my/student/online-courses", "Online courses catalogue with my enrollment flags."),
    req("POST", "my/student/online-courses", "Enroll myself in an online course.", {
      body: { courseId: 2 },
    }),
    req("GET", "my/student/other-payments", "Non-fee payments (stationery/book shop sales)."),
    req("GET", "my/student/syllabus-status", "Syllabus completion status per subject (student = self).", {
      queryParams: [{ key: "student_id", value: "", desc: "Optional" }],
    }),
    req("GET", "my/student/teacher-reviews", "Teachers of my class with my submitted review/rating."),
    req("POST", "my/student/teacher-reviews", "Submit/update a review for one of my teachers (rating 1-5).", {
      body: { teacherName: "Mrs. Anjali Deshmukh", subject: "Physics", rating: 5, comments: "Explains very clearly" },
    }),
    req("GET", "my/student/transport", "Transport routes with vehicles and pickup points."),
    req("GET", "my/attendance-note", "My attendance notes for a month (or single date).", {
      queryParams: [
        { key: "month", value: "2026-08", desc: "YYYY-MM, defaults to current month" },
        { key: "date", value: "", desc: "Single-day lookup" },
      ],
    }),
    req("PUT", "my/attendance-note", "Add/update an attendance note for a date (empty note deletes it).", {
      body: { date: "2026-08-20", note: "Came late due to medical appointment" },
    }),
    req("GET", "my/fees/gateways", "Online payment gateways the school has enabled."),
    req("GET", "my/exams", "All exams with publish flags."),
    req("GET", "my/leave", "My applied leaves with status."),
    req("POST", "my/leave", "Apply for leave (student = self).", {
      body: { leaveTypeId: 1, fromDate: "2026-09-01", toDate: "2026-09-02", reason: "Fever and cold" },
    }),
  ]
)

const parentFolder = folder(
  "2. Parent Portal",
  "Endpoints for a PARENT login. Every child-scoped call requires studentId from /api/my/parent/kids.",
  [
    ...commonMy,
    req("GET", "my/parent/kids", "List my children."),
    req("GET", "my/parent/kids/attendance", "Monthly attendance of one child.", {
      queryParams: [
        { key: "studentId", value: "15", desc: "Required - kid id" },
        { key: "month", value: "2026-08", desc: "YYYY-MM" },
      ],
    }),
    req("GET", "my/parent/kids/fees", "Fee dues + payment history of one child.", {
      queryParams: [{ key: "studentId", value: "15", desc: "Required - kid id" }],
    }),
    req("POST", "my/fees/pay/order", "Start online (Razorpay) fee payment for one kid — returns orderId/keyId for the checkout SDK.", {
      body: { studentId: 15, feesTypeId: 3, amount: 3000 },
      name: "Razorpay order",
    }),
    req("POST", "my/fees/pay/verify", "Verify the Razorpay payment and mark the fee as paid (returns fresh ledger).", {
      body: { paymentId: 61, studentId: 15, razorpayPaymentId: "pay_LIc9k4SgwYg8mNx" },
      name: "Razorpay verify",
    }),
    req("GET", "my/parent/kids/homework", "Homework of one child.", {
      queryParams: [{ key: "studentId", value: "15", desc: "Required - kid id" }],
    }),
    req("GET", "my/parent/kids/exams", "Exam results of one child.", {
      queryParams: [{ key: "studentId", value: "15", desc: "Required - kid id" }],
    }),
    req("GET", "my/parent/kids/details", "Full profile of one child (personal, academic, parents, attendance).", {
      queryParams: [{ key: "studentId", value: "15", desc: "Required - kid id" }],
    }),
    req("GET", "my/parent/kids/timetable", "Weekly timetable of one child.", {
      queryParams: [{ key: "studentId", value: "15", desc: "Required - kid id" }],
    }),
    req("GET", "my/parent/kids/library", "Library books issued to one child.", {
      queryParams: [{ key: "studentId", value: "15", desc: "Required - kid id" }],
    }),
    req("POST", "my/parent/kids/fees/pay", "Record a direct fee payment for one of my children.", {
      body: { studentId: 15, feesTypeId: 3, amount: 3000, paymentMode: "Cash" },
    }),
    req("GET", "my/fees/gateways", "Online payment gateways the school has enabled."),
    req("GET", "my/student/lesson-plans", "Lesson plans of one child's class/section."),
    req("GET", "my/student/other-payments", "Non-fee payments (stationery/book shop sales) of all my kids."),
    req("GET", "my/student/syllabus-status", "Syllabus completion status of one child.", {
      queryParams: [{ key: "student_id", value: "15", desc: "Optional - defaults to first kid" }],
    }),
    req("GET", "my/attendance-note", "Attendance notes of one child.", {
      queryParams: [
        { key: "studentId", value: "15", desc: "Required - kid id" },
        { key: "month", value: "2026-08", desc: "YYYY-MM" },
      ],
    }),
    req("PUT", "my/attendance-note", "Add/update an attendance note for one child.", {
      body: { studentId: 15, date: "2026-08-20", note: "Came late due to medical appointment" },
    }),
    req("GET", "my/student/notices", "Published notices (shared endpoint, all roles)."),
    req("GET", "my/exams", "All exams with publish flags."),
    req("GET", "my/leave", "Leaves I applied (mine + my children)."),
    req("POST", "my/leave", "Apply leave on behalf of a child (pass studentId).", {
      body: { studentId: 15, leaveTypeId: 1, fromDate: "2026-09-01", toDate: "2026-09-02", reason: "Family function out of town" },
    }),
  ]
)

const teacherFolder = folder(
  "3. Teacher / Staff Portal",
  "Endpoints for TEACHER / STAFF logins (admins may call them too). Class endpoints require the teacher to be assigned via class_teachers.",
  [
    ...commonMy,
    req("GET", "my/teacher", "My staff profile."),
    req("GET", "my/teacher/classes", "Classes/sections assigned to me + subjects I teach."),
    req("GET", "my/teacher/students", "Students of an assigned class/section.", {
      queryParams: [
        { key: "classId", value: "5", desc: "Required" },
        { key: "sectionId", value: "2", desc: "Required" },
      ],
    }),
    req("GET", "my/teacher/attendance", "Load attendance sheet for a class on a date.", {
      queryParams: [
        { key: "classId", value: "5", desc: "Required" },
        { key: "sectionId", value: "2", desc: "Required" },
        { key: "date", value: "2026-08-22", desc: "Defaults to today" },
      ],
    }),
    req("POST", "my/teacher/attendance", "Save attendance for multiple students at once (upsert per student/day).", {
      body: {
        classId: 5,
        sectionId: 2,
        date: "2026-08-22",
        records: [
          { studentId: 15, attendanceTypeId: 1, inTime: "07:55", outTime: "14:10" },
          { studentId: 16, attendanceTypeId: 2 },
        ],
      },
    }),
    req("GET", "my/teacher/homework", "Homework of an assigned class/section.", {
      queryParams: [
        { key: "classId", value: "5", desc: "Required" },
        { key: "sectionId", value: "2", desc: "Required" },
      ],
    }),
    req("POST", "my/teacher/homework/create", "Create homework for an assigned class/section (admins bypass assignment check).", {
      body: {
        classId: 5,
        sectionId: 2,
        subjectId: 3,
        homeworkDate: "2026-08-22",
        submissionDate: "2026-08-26",
        description: "Chapter 5 exercise 5.3, Q1-Q8",
        document: null,
      },
    }),
    req("GET", "my/teacher/marks", "Load marks sheet for an exam subject of an assigned class (subjectId = exam_subjects.id).", {
      queryParams: [
        { key: "examId", value: "4", desc: "Required" },
        { key: "subjectId", value: "12", desc: "Required - exam_subjects.id" },
        { key: "classId", value: "5", desc: "Required" },
        { key: "sectionId", value: "2", desc: "Required" },
      ],
    }),
    req("POST", "my/teacher/marks", "Save/update exam marks for multiple students at once (upsert).", {
      body: {
        examId: 4,
        subjectId: 12,
        classId: 5,
        sectionId: 2,
        records: [
          { studentId: 15, theoryMarks: 78, practicalMarks: 18, absent: false },
          { studentId: 16, theoryMarks: 65, practicalMarks: 20, absent: false },
          { studentId: 17, absent: true },
        ],
      },
    }),
    req("GET", "my/teacher/timetable", "My weekly teaching timetable."),
    req("GET", "my/student/syllabus-status", "Syllabus completion status for classes I teach.", {
      queryParams: [
        { key: "class_id", value: "5", desc: "Optional - defaults to first taught class" },
        { key: "section_id", value: "2", desc: "Optional" },
      ],
    }),
    req("GET", "my/attendance-note", "Attendance note(s) of any student in my school.", {
      queryParams: [
        { key: "studentId", value: "15", desc: "Required" },
        { key: "month", value: "2026-08", desc: "YYYY-MM" },
      ],
    }),
    req("PUT", "my/attendance-note", "Add/update an attendance note for a student.", {
      body: { studentId: 15, date: "2026-08-20", note: "Excused — medical appointment" },
    }),
    req("GET", "my/student/notices", "Published notices (shared endpoint, all roles)."),
    req("GET", "my/exams", "All exams with publish flags."),
    req("GET", "my/leave", "My applied leaves with status."),
    req("POST", "my/leave", "Apply for leave (staff = self).", {
      body: { leaveTypeId: 2, fromDate: "2026-09-10", toDate: "2026-09-12", reason: "Personal work" },
    }),
  ]
)

// ----------------------------------------------------------------
// School Admin CRUD modules (generic /api/{module} handler)
// ----------------------------------------------------------------
function crud(endpoint, label, tableName, opts = {}) {
  const { extraQuery = [], customBody, customDesc, putBody } = opts
  const items = []
  const listDesc = customDesc
    ? `List ${label}. ${customDesc}`
    : `List all ${label}. Optional: ?id=N${extraQuery.length ? ` or filter by ${extraQuery.join(", ")}` : ""}`
  items.push(req("GET", endpoint, listDesc, { queryParams: ["id", ...extraQuery] }))
  items.push(
    req("POST", endpoint, `Create a new ${label} (table: ${tableName}).`, {
      body: customBody || { field1: "value", field2: "value" },
    })
  )
  items.push(
    req("PUT", endpoint, `Update an existing ${label} (id required in body).`, {
      body: putBody || { id: 1, ...(customBody ? { name: customBody.name || "updated" } : { field1: "value" }) },
    })
  )
  items.push(req("DELETE", endpoint, `Delete a ${label} by id.`, { queryParams: ["id"] }))
  return items
}

function crudSub(endpoint, label, tableName, methods, opts = {}) {
  const all = crud(endpoint, label, tableName, opts)
  return all.filter((it) => methods.includes(it.request.method))
}

const adminModules = [
  ["Academics", [
    ...crud("academics/class", "Classes", "classes", { customBody: { name: "Class 11" } }),
    ...crud("academics/class-teacher", "Class Teachers", "class_teachers", { customBody: { class_id: 5, section_id: 2, teacher_name: "Mrs. Anjali Deshmukh" } }),
    [
      req("GET", "academics/promote-student", "List promotions.", { queryParams: ["from_class_id", "from_section_id", "session_id"] }),
      req("POST", "academics/promote-student", "Promote students to the next class/session.", {
        body: { from_class_id: 5, from_section_id: 2, to_class_id: 6, session_id: 2, student_ids: [15, 16] },
      }),
    ],
    ...crud("academics/section", "Sections", "sections", { customBody: { name: "A" } }),
    ...crud("academics/subject", "Subjects", "subjects", { customBody: { name: "Physics", code: "PHY" } }),
    ...crud("academics/subject-group", "Subject Groups", "subject_groups"),
    ...crud("academics/timetable", "Timetables", "timetables"),
  ]],
  ["Alumni", [
    ...crud("alumni", "Alumni", "alumni"),
    ...crud("alumni/event", "Alumni Events", "alumni_events"),
    ...crud("alumni/attendance", "Alumni Attendance", "alumni_attendance"),
    ...crud("alumni/finance", "Alumni Finance", "alumni_finance"),
  ]],
  ["Annual Calendar", [
    ...crud("annual-calendar/event", "Calendar Events", "calendar_events", { customBody: { title: "Sports Day", date: "2026-12-18", type: "event" } }),
    ...crud("annual-calendar/holiday-type", "Holiday Types", "holiday_types"),
  ]],
  ["Attendance", [
    ...crud("attendance/leave", "Leave Applications", "leave_applications", {
      extraQuery: ["from_date", "to_date", "status"],
      customBody: { staff_id: 4, from_date: "2026-09-01", to_date: "2026-09-03", reason: "Family function", status: "pending" },
    }),
    ...crud("attendance/leave-type", "Leave Types", "leave_types"),
    ...crud("attendance/staff", "Staff Attendance", "staff_attendance", {
      extraQuery: ["date", "staff_id"],
      customBody: { staff_id: 4, date: "2026-08-22", status: "present" },
    }),
    ...crud("attendance/student", "Student Attendance", "student_attendance", {
      extraQuery: ["date", "class_id", "section_id"],
      customBody: { student_id: 15, class_id: 5, section_id: 2, date: "2026-08-22", attendance_type_id: 1, in_time: "07:55", out_time: "14:10" },
    }),
    ...crud("attendance/type", "Attendance Types", "attendance_types"),
  ]],
  ["Behaviour", [
    ...crud("behaviour/incident", "Behaviour Incidents", "behaviour_incidents", {
      extraQuery: ["student_id"],
      customBody: { student_id: 15, incident_type: "Bullying", description: "Pushed a classmate", action_taken: "Warning", point: 2 },
    }),
    ...crud("behaviour/assign", "Behaviour Assignments", "behaviour_assignments", {
      extraQuery: ["student_id", "incident_id"],
      customBody: { student_id: 15, incident_id: 3, assigned_by: "Class Teacher" },
    }),
  ]],
  ["Branch", crud("branch", "Branches", "branches")],
  ["CBSE", [
    ...crud("cbse/exam", "CBSE Exams", "cbse_exams", { extraQuery: ["class_id", "section_id"], customBody: { name: "Term 1", class_id: 5, academic_year: "2025-26" } }),
    ...crud("cbse/exam-subjects", "CBSE Exam Subjects", "cbse_exam_subjects", { extraQuery: ["exam_id"], customBody: { exam_id: 2, subject_id: 3, max_marks: 80, passing_marks: 27 } }),
    ...crud("cbse/exam-marks", "CBSE Exam Marks", "cbse_exam_marks", { extraQuery: ["exam_id", "class_id", "subject_id"], customBody: { exam_id: 2, student_id: 15, subject_id: 3, marks_obtained: 68 } }),
    ...crud("cbse/exam-grades", "CBSE Exam Grades", "cbse_exam_grades", { extraQuery: ["exam_id"], customBody: { exam_id: 2, grade: "A1", min_marks: 91, max_marks: 100 } }),
    ...crud("cbse/exam-students", "CBSE Exam Students", "cbse_exam_students", { extraQuery: ["exam_id"], customBody: { exam_id: 2, student_id: 15 } }),
    ...crud("cbse/exam-attendance", "CBSE Exam Attendance", "cbse_exam_attendance", { customBody: { exam_id: 2, student_id: 15, status: "present" } }),
    ...crud("cbse/schedule", "CBSE Exam Schedules", "cbse_schedules", { customBody: { exam_id: 2, subject_id: 3, date: "2026-09-14", start_time: "09:00", end_time: "12:00" } }),
    ...crud("cbse/admit-card", "CBSE Admit Cards", "cbse_admit_cards", { customBody: { exam_id: 2, student_id: 15, template_id: 1 } }),
    ...crud("cbse/marksheet", "CBSE Marksheets", "cbse_marksheets", { customBody: { exam_id: 2, student_id: 15, template_id: 1 } }),
    ...crud("cbse/terms", "CBSE Terms", "cbse_terms", { customBody: { name: "Term 1", academic_year: "2025-26", start_date: "2026-04-01", end_date: "2026-09-30" } }),
    ...crud("cbse/settings", "CBSE Settings", "cbse_settings", { customBody: { academic_year: "2025-26", max_marks_fa: 20, max_marks_sa: 80 } }),
    ...crud("cbse/assessments", "CBSE Assessments", "cbse_assessments", { extraQuery: ["class_id", "section_id", "subject_id", "exam_id"] }),
    ...crud("cbse/observation", "CBSE Observations", "cbse_observations", { extraQuery: ["class_id", "section_id", "subject_id"] }),
    ...crud("cbse/obs-params", "CBSE Observation Params", "cbse_observation_params", { extraQuery: ["observation_id"] }),
    ...crud("cbse/reports", "CBSE Reports", "cbse_reports", { extraQuery: ["exam_id", "class_id", "section_id"] }),
    ...crud("cbse/template", "CBSE Templates", "cbse_templates", { extraQuery: ["type"] }),
  ]],
  ["Certificate", [
    ...crud("certificate/student-id-card", "Student ID Cards", "student_id_cards"),
    ...crud("certificate/staff-id-card", "Staff ID Cards", "staff_id_cards"),
    ...crud("certificate/student", "Student Certificates", "student_certificates"),
    ...crud("certificate/template", "Certificate Templates", "certificate_templates"),
  ]],
  ["Communicate", [
    ...crud("communicate/notice", "Notices", "notices", {
      customBody: { title: "PTM on Saturday", notice_date: "2026-08-29", publish_date: "2026-08-22", message: "Parents to visit between 9 AM and 12 PM.", message_to: "Parents" },
    }),
    ...crud("communicate/email", "Email Messages", "email_messages", { customBody: { subject: "Fee reminder", message: "Dear parent, fees are due." } }),
    ...crud("communicate/sms", "SMS Messages", "sms_messages", { customBody: { message: "School closed tomorrow." } }),
    ...crud("communicate/email-template", "Email Templates", "email_templates"),
    ...crud("communicate/sms-template", "SMS Templates", "sms_templates"),
    ...crud("communicate/scheduled", "Scheduled Messages", "scheduled_messages"),
  ]],
  ["Download Center", [
    ...crud("download-center/content", "Download Contents", "download_center_contents"),
    ...crud("download-center/content-type", "Content Types", "download_center_content_types"),
    ...crud("download-center/video", "Videos", "download_center_videos"),
  ]],
  ["Examinations", [
    ...crud("examinations/group", "Exam Groups", "exam_groups", { customBody: { name: "Primary Group" } }),
    ...crud("examinations/exam", "Exams", "exams", { extraQuery: ["class_id"], customBody: { name: "Half Yearly", class_id: 5, group_id: 1 } }),
    ...crud("examinations/subject", "Exam Subjects", "exam_subjects", { extraQuery: ["exam_id"], customBody: { exam_id: 4, subject_id: 3, max_marks: 100, passing_marks: 35 } }),
    ...crud("examinations/mark", "Exam Marks", "exam_marks", { extraQuery: ["exam_id", "student_id"], customBody: { exam_id: 4, student_id: 15, subject_id: 3, theory_marks: 78, practical_marks: 18 } }),
    ...crud("examinations/marks-grade", "Marks Grades", "marks_grades", { customBody: { name: "A", percent_from: 90, percent_to: 100 } }),
    ...crud("examinations/marks-division", "Marks Divisions", "marks_divisions"),
  ]],
  ["Expenses", [
    ...crud("expenses/head", "Expense Heads", "expense_heads", { customBody: { name: "Utilities" } }),
    ...crud("expenses", "Expenses", "expenses", {
      extraQuery: ["head_id", "date_from", "date_to"],
      customBody: { head_id: 1, amount: 4500, date: "2026-08-22", description: "August electricity bill" },
    }),
  ]],
  ["Fees Collection", [
    ...crudSub("fees/fees-assign", "Fees Assignments", "fees_masters", ["GET", "POST"], {
      extraQuery: ["class_id", "section_id"],
      customDesc: "GET lists assignments; POST bulk-assigns fee types to a class/section or specific students.",
      customBody: { class_id: 5, section_id: 2, fees_type_ids: [1, 3] },
    }),
    ...crud("fees/fees-type", "Fees Types", "fees_types", { customBody: { name: "Tuition Fee", code: "TUI" } }),
    ...crud("fees/fees-group", "Fees Groups", "fees_groups", { customBody: { name: "Class Fee" } }),
    ...crud("fees/fees-master", "Fees Master", "fees_master", { customBody: { class_id: 5, fees_group_id: 1, fees_type_id: 1, amount: 12000, due_date: "2026-04-10" } }),
    ...crud("fees/fees-discount", "Fees Discounts", "fees_discounts", { customBody: { student_id: 15, fees_type_id: 1, discount_type: "percent", amount: 10 } }),
    ...crud("fees/fees-payment", "Fees Payments", "fees_payments", {
      extraQuery: ["student_id", "date_from", "date_to"],
      customBody: { student_id: 15, fees_type_id: 3, amount: 5000, paid_amount: 5000, discount_amount: 0, fine_amount: 0, payment_mode: "Cash", payment_date: "2026-08-22", note: "Term 2 fee", status: "Success" },
    }),
    ...crud("fees/fees-reminder", "Fees Reminders", "fees_reminders", { customBody: { student_id: 15, fees_type_id: 1, reminder_date: "2026-09-01", message: "Please clear dues." } }),
    ...crud("fees/fees-carry-forward", "Fees Carry Forward", "fees_carry_forward", { customBody: { student_id: 15, from_academic_year: "2024-25", to_academic_year: "2025-26", amount: 2500 } }),
  ]],
  ["Front CMS", [
    ...crud("front-cms/page", "CMS Pages", "cms_pages"),
    ...crud("front-cms/menu", "CMS Menus", "cms_menus"),
    ...crud("front-cms/banner", "CMS Banners", "cms_banners"),
    ...crud("front-cms/gallery", "CMS Galleries", "cms_galleries"),
    ...crud("front-cms/media", "CMS Media", "cms_media"),
    ...crud("front-cms/news", "CMS News", "cms_news"),
    ...crud("front-cms/event", "CMS Events", "cms_events"),
  ]],
  ["Front Office", [
    ...crud("front-office/source-type", "Source Types", "source_types", { customBody: { source: "Newspaper Ad" } }),
    ...crud("front-office/reference-type", "Reference Types", "reference_types", { customBody: { reference: "Walk-in" } }),
    ...crud("front-office/purpose-type", "Purpose Types", "purpose_types"),
    ...crud("front-office/enquiry-type", "Enquiry Types", "enquiry_types"),
    ...crud("front-office/complaint-type", "Complaint Types", "complaint_types"),
    ...crud("front-office/admission-enquiry", "Admission Enquiries", "admission_enquiries", {
      extraQuery: ["class_id", "source_id", "status"],
      customBody: { name: "Rohan Mehta", phone: "9922334455", email: "rohan.m@example.com", class_id: 3, source_id: 2, follow_up_date: "2026-08-30", assigned: "Mrs. Anjali", note: "Interested in science stream", status: "Pending" },
    }),
    ...crudSub("front-office/admission-enquiry/followup", "Enquiry Follow-ups", "admission_enquiry_followups", ["GET", "POST"], {
      extraQuery: ["enquiry_id"],
      customDesc: "GET lists follow-ups of an enquiry; POST adds one.",
      customBody: { enquiry_id: 44, follow_up_date: "2026-08-30", note: "Called — visiting campus on Saturday", response: "Positive" },
    }),
    ...crud("front-office/visitor-book", "Visitor Book", "visitor_book", {
      extraQuery: ["meeting_with"],
      customBody: { purpose_id: 1, name: "Mr. Verma", phone: "9876500011", id_card: "Aadhaar", id_number: "1234-5678-9012", person_to_meet: "Aarav Sharma", meeting_with: "student", student_id: 15, person_count: 2, date: "2026-08-22", in_time: "10:30", out_time: "11:05" },
    }),
    ...crud("front-office/phone-call-log", "Phone Call Logs", "phone_call_logs", {
      extraQuery: ["call_type"],
      customBody: { name: "Mrs. Kapoor", phone: "9811122233", call_type: "Incoming", call_duration: "5 min", date: "2026-08-22", follow_up_date: "2026-08-25", description: "Asked about transport route 4" },
    }),
    ...crud("front-office/postal-dispatch", "Postal Dispatch", "postal_dispatches", {
      customBody: { reference_no: "DSP-001", to_title: "CBSE Regional Office", address: "Delhi", document_type: "Letter", dispatch_date: "2026-08-22" },
    }),
    ...crud("front-office/postal-receive", "Postal Receive", "postal_receives", {
      customBody: { reference_no: "RCV-001", from_title: "Education Board", address: "Pune", document_type: "Circular", received_date: "2026-08-21" },
    }),
    ...crud("front-office/complain", "Complaints", "complaints", {
      extraQuery: ["complaint_type_id", "source_id", "status"],
      customBody: { complain_type_id: 1, source_id: 2, name: "Mrs. Sharma", phone: "9998887771", date: "2026-08-20", description: "Bus arrived late", action_taken: "Driver warned", assigned: "Transport Incharge" },
    }),
  ]],
  ["Homework", crud("homework", "Homework", "homework", {
    extraQuery: ["class_id", "section_id", "subject_id"],
    customBody: { class_id: 5, section_id: 2, subject_id: 3, homework_date: "2026-08-22", submission_date: "2026-08-26", description: "Chapter 5 exercise 5.3, Q1-Q8", marks: 10 },
  })],
  ["Hostel", [
    ...crud("hostel", "Hostels", "hostels", { customBody: { name: "Boys Hostel A", type: "Boys", address: "Campus", intake: 120 } }),
    ...crud("hostel/room-type", "Room Types", "hostel_room_types"),
    ...crud("hostel/room", "Hostel Rooms", "hostel_rooms"),
  ]],
  ["Human Resource", [
    ...crud("human-resource/department", "Departments", "departments", { customBody: { name: "Science" } }),
    ...crud("human-resource/designation", "Designations", "designations", { customBody: { name: "Senior Teacher" } }),
    ...crud("human-resource/staff", "Staff", "staff", {
      customBody: { staff_id: "EMP-010", name: "Mrs. Anjali Deshmukh", gender: "Female", dob: "1988-03-12", email: "anjali@yourschool.com", phone: "9876555544", department_id: 2, designation_id: 3, date_of_joining: "2022-06-01", status: "Active" },
    }),
    ...crudSub("human-resource/staff-profile", "Staff Profile + Portal Login", "staff", ["GET", "POST", "PUT"], {
      extraQuery: ["staff_id"],
      customDesc: "GET loads profile + login; POST creates portal login; PUT updates it.",
      customBody: { staff_id: 4, email: "anjali@yourschool.com", password: "Teacher@123" },
    }),
    ...crud("human-resource/payroll", "Payroll", "payroll", { extraQuery: ["staff_id", "month", "year"], customBody: { staff_id: 4, month: "August", year: 2026, basic_salary: 45000, allowances: 8000, deduction: 2000, status: "generated" } }),
    ...crud("human-resource/teachers-rating", "Teachers Rating", "teachers_ratings"),
    ...crud("human-resource/disabled-staff", "Disabled Staff", "disabled_staff"),
  ]],
  ["Income", [
    ...crud("income/head", "Income Heads", "income_heads", { customBody: { name: "Donations" } }),
    ...crud("income", "Income", "income", { extraQuery: ["head_id", "date_from", "date_to"], customBody: { head_id: 1, amount: 25000, date: "2026-08-15", description: "Alumni donation" } }),
  ]],
  ["Lesson Plan", [
    ...crud("lesson-plan/lesson", "Lessons", "lesson_plan_lessons"),
    ...crud("lesson-plan/topic", "Topics", "lesson_plan_topics"),
    ...crud("lesson-plan/plan", "Plans", "lesson_plans"),
    ...crud("lesson-plan/syllabus-status", "Syllabus Status", "syllabus_statuses"),
  ]],
  ["Library", [
    ...crud("library/book", "Books", "library_books", {
      extraQuery: ["book_no", "isbn_no"],
      customBody: { book_title: "Concepts of Physics", book_no: "BK-101", isbn_no: "9788177091870", subject: "Physics", publisher: "BC Publications", author: "HC Verma", qty: 12, book_price: 350, rack_no: "R4", category_id: 2 },
    }),
    ...crud("library/members", "Library Members", "library_members", { customBody: { member_type: "student", member_id: 15, library_card_no: "LIB-015" } }),
    ...crud("library/issue", "Book Issues", "library_issues", { extraQuery: ["status"], customBody: { book_id: 3, member_id: 1, issue_date: "2026-08-22", due_return_date: "2026-09-05", status: "Issued" } }),
    ...crudSub("library/book-requests", "Book Requests", "book_requests", ["GET", "PUT"], {
      extraQuery: ["status"],
      customDesc: "PUT {id,status:Accepted|Rejected} — accepting auto-issues the book to the student.",
      putBody: { id: 5, status: "Accepted" },
    }),
  ]],
  ["Live Class", crud("live-class", "Live Classes", "live_classes", {
    extraQuery: ["class_id", "date"],
    customBody: { title: "Physics - Ch 4", class_id: 5, section_id: 2, subject_id: 3, date: "2026-08-25", time: "10:00", duration_minutes: 45, meeting_link: "https://meet.google.com/abc-defg-hij" },
  })],
  ["Live Meeting", crud("live-meeting", "Live Meetings", "live_meetings", {
    customBody: { title: "Staff Meeting", meeting_type: "general", date: "2026-08-28", time: "16:00", meeting_link: "https://meet.google.com/xyz-pqrs-tuv" },
  })],
  ["Online Course", [
    ...crud("online-course/category", "Course Categories", "online_course_categories"),
    ...crud("online-course", "Online Courses", "online_courses"),
    ...crud("online-course/enrollment", "Enrollments", "online_course_enrollments"),
    ...crud("online-course/payment", "Payments", "online_course_payments"),
    ...crud("online-course/offline-payment", "Offline Payments", "online_course_offline_payments"),
    ...crud("online-course/question-bank", "Question Banks", "online_course_question_banks"),
    ...crud("online-course/question", "Questions", "online_course_questions"),
    ...crud("online-course/certificate-template", "Certificate Templates", "online_course_certificate_templates"),
    ...crud("online-course/course-category", "Course-Category Mapping", "online_course_course_categories"),
    ...crud("online-course/setting", "Settings", "online_course_settings"),
  ]],
  ["Online Exam", [
    ...crud("online-exam", "Online Exams", "online_exams"),
    ...crudSub("online-exam/public-link", "Public Exam Links", "exam_public_links", ["GET", "POST"], {
      extraQuery: ["exam_id"],
      customDesc: "POST creates a public access link (token) for an exam; GET lists them.",
      customBody: { exam_id: 2 },
    }),
  ]],
  ["QR Attendance", crud("qr-attendance", "QR Attendance", "qr_attendance")],
  ["Question Bank", crud("question-bank", "Question Bank", "question_bank")],
  ["Student Information", [
    ...crudSub("student-information/bulk-delete", "Disabled Students Bulk Delete", "students", ["GET", "DELETE"], {
      extraQuery: ["ids"],
      customDesc: "GET lists disabled students (template); DELETE ?ids=1,2,3 removes them.",
    }),
    ...crud("student-information/student", "Students", "students", {
      extraQuery: ["class_id", "section_id", "status"],
      customBody: {
        admission_no: "ADM2026-101",
        roll_no: "25",
        first_name: "Priya",
        last_name: "Patil",
        gender: "Female",
        dob: "2012-02-11",
        category: "General",
        religion: "Hindu",
        caste: "Open",
        mobile: "9812345678",
        email: "priya.p@example.com",
        class_id: 5,
        section_id: 2,
        admission_date: "2026-04-10",
        father_name: "Vikas Patil",
        father_phone: "9812345679",
        mother_name: "Meera Patil",
        guardian_is: "father",
        address: "12 Shivaji Nagar, Pune",
        blood_group: "B+",
        house: "Green",
        session: "2025-26",
        status: "Active",
      },
    }),
    ...crud("student-information/student-category", "Student Categories", "student_categories"),
    ...crud("student-information/student-house", "Student Houses", "student_houses"),
    ...crud("student-information/disable-reason", "Disable Reasons", "disable_reasons"),
    ...crud("student-information/online-admission", "Online Admissions", "online_admissions"),
    ...crud("student-information/timeline", "Student Timeline", "student_timeline", { extraQuery: ["student_id"] }),
    req("GET", "student-information/student/login", "Look up a student's portal login (username/password).", {
      queryParams: [{ key: "student_id", value: "15", desc: "Required" }],
    }),
  ]],
  ["Online Admission Queue", [
    req("GET", "online-admission", "List online admission applications (with school code/name)."),
    req("PUT", "online-admission", "Change application status. Approving creates the student record + portal login.", {
      body: { id: 3, status: "Approved" },
    }),
    req("DELETE", "online-admission", "Delete an application.", { queryParams: [{ key: "id", value: "3" }] }),
  ]],
  ["Students", [req("GET", "students", "List students (simple). Optional: ?id=N", { queryParams: ["id"] })]],
  ["Reference Lists (GET only)", [
    req("GET", "classes", "Class list."),
    req("GET", "sections", "Section list by class.", { queryParams: [{ key: "class_id", value: "5", desc: "Optional" }] }),
    req("GET", "subjects", "Subject list."),
    req("GET", "staff", "Staff list."),
  ]],
  ["System Setting", [
    ...crud("system-setting/user", "Users (logins)", "users", {
      customBody: {
        username: "anjali.deshmukh",
        name: "Mrs. Anjali Deshmukh",
        email: "anjali@yourschool.com",
        password: "Teacher@123",
        role: "teacher",
        status: "Active",
      },
    }),
    req("GET", "system-setting/student-users", "Student logins with linked student record."),
    req("GET", "system-setting/parent-users", "Parent logins with linked children summary."),
    ...crud("system-setting/session", "Sessions (academic years)", "sessions"),
    ...crudSub("system-setting/session/current", "Current Session", "sessions", ["GET", "POST"], {
      customDesc: "GET returns the active session; POST sets one active.",
      customBody: { id: 2 },
    }),
    ...crud("system-setting/language", "Languages", "languages"),
    ...crud("system-setting/currency", "Currencies", "currencies"),
    ...crud("system-setting/module", "Modules", "modules"),
    ...crud("system-setting/payment-gateway", "Payment Gateways", "payment_gateways"),
    ...crud("system-setting/file-type", "File Types", "file_types"),
    ...crud("system-setting/custom-field", "Custom Fields", "custom_fields"),
    ...crudSub("system-setting/custom-field-value", "Custom Field Values", "custom_field_values", ["GET", "POST"], {}),
    ...crud("system-setting/sidebar-menu", "Sidebar Menus", "sidebar_menus"),
    ...crud("system-setting/addon", "Addons", "addons"),
    ...crudSub("system-setting/backup", "Backups", "backups", ["GET", "POST", "DELETE"], {
      customDesc: "POST creates a backup; DELETE ?id=N removes one.",
    }),
    req("POST", "system-setting/backup/restore", "Restore the database from a stored backup.", { body: { id: 3 } }),
    req("GET", "system-setting/next-id", "Next auto-generated ID (e.g. admission number) for the admission form.", {
      queryParams: [{ key: "entity", value: "student", desc: "" }],
    }),
    ...crudSub("system-setting/online-admission", "Online Admission Settings", "online_admission_settings", ["GET", "PUT"], {
      putBody: { enable: true, start_date: "2026-04-01", end_date: "2026-06-30" },
    }),
    ...crudSub("system-setting/system-field", "System Fields", "system_fields", ["GET", "PUT"], {
      putBody: { id: 1, visible: true },
    }),
    ...crudSub("system-setting/system-update", "System Updates", "system_updates", ["GET", "POST"], {}),
    ...crud("system-setting", "System Settings", "system_settings"),
  ]],
  ["Transport", [
    ...crud("transport/vehicle", "Vehicles", "vehicles", { customBody: { vehicle_no: "MH12AB1234", model: "Tata Starbus", year: "2022", driver_name: "Ram Singh", driver_license: "DL-0120190031234", note: "Route 4" } }),
    ...crud("transport/route", "Routes", "routes", { customBody: { name: "Route 4 - Kothrud", fare: 1200 } }),
    ...crud("transport/pickup-point", "Pickup Points", "pickup_points"),
    ...crud("transport/assign-vehicle", "Assign Vehicles", "route_vehicles"),
    ...crud("transport/route-pickup-point", "Route Pickup Points", "route_pickup_points"),
    ...crud("transport/student-fees", "Student Transport Fees", "student_transport_fees"),
  ]],
  ["Dashboards (GET only)", [
    req("GET", "admin/dashboard", "Admin dashboard metrics (counts, recent activity, fee summary)."),
    req("GET", "admin/staff-inventory-dashboard", "Staff inventory dashboard metrics."),
    req("GET", "admin/students-inventory-dashboard", "Students inventory dashboard metrics."),
  ]],
  ["Reports (GET only)", [
    req("GET", "reports/class-subjects", "Class–subject mapping report.", {
      queryParams: [
        { key: "class_id", value: "5", desc: "" },
        { key: "section_id", value: "2", desc: "" },
      ],
    }),
    req("GET", "reports/staff", "Staff report (filters/search)."),
    req("GET", "reports/students", "Student report (filters/search)."),
  ]],
  ["AI Tools", [
    ...crudSub("ai/settings", "AI Provider Settings", "system_settings", ["GET", "PUT"], {
      putBody: { provider: "openai", apiKey: "sk-...", model: "gpt-4o-mini" },
    }),
    req("POST", "ai/settings/test", "Test the AI provider connection."),
    req("POST", "ai/generate-questions", "Generate exam questions with AI.", {
      body: { subject: "Physics", topic: "Motion", count: 5, difficulty: "medium" },
    }),
    req("POST", "ai/student-insights", "AI-generated student performance insights.", {
      body: { studentId: 15 },
    }),
  ]],
  ["Billing & Subscription", [
    req("GET", "billing", "School subscription, plan & invoice status."),
  ]],
  ["Roles & Permissions", crud("roles", "Roles", "roles")],
  ["School Settings", [
    ...crudSub("school-settings", "School Settings", "school_settings", ["GET", "PUT"], {
      putBody: { theme_color: "#ff7732", enable_dark_mode: true },
    }),
  ]],
  ["Staff Inventory", [
    ...crud("staff-inventory/store", "Stores/Warehouses", "item_stores"),
    ...crud("staff-inventory/item-category", "Item Categories", "item_categories"),
    ...crud("staff-inventory/item", "Inventory Items", "items", { extraQuery: ["category_id"] }),
    ...crud("staff-inventory/supplier", "Suppliers", "item_suppliers"),
    ...crud("staff-inventory/stock", "Stock Entries", "item_stocks", { extraQuery: ["item_id", "store_id"] }),
    ...crud("staff-inventory/issue", "Item Issue/Return", "item_issues", { extraQuery: ["staff_id", "item_id", "status"] }),
  ]],
  ["Students Inventory (Shop)", [
    ...crud("students-inventory/store", "Stores", "si_stores"),
    ...crud("students-inventory/category", "Product Categories", "si_categories"),
    ...crud("students-inventory/brand", "Brands", "si_brands"),
    ...crud("students-inventory/unit", "Units of Measure", "si_units"),
    ...crud("students-inventory/product", "Products", "si_products"),
    ...crud("students-inventory/variation", "Product Variations", "si_variations"),
    ...crud("students-inventory/book", "Books (Stationery)", "si_books"),
    ...crud("students-inventory/vendor", "Vendors", "si_vendors"),
    ...crud("students-inventory/purchase", "Purchase Orders", "si_purchases"),
    ...crud("students-inventory/stock", "Stock Levels", "si_stock", { extraQuery: ["store_id", "product_id"] }),
    ...crud("students-inventory/sale", "Sales/POS Transactions", "si_sales"),
    ...crud("students-inventory/coupon", "Coupons", "si_coupons"),
    ...crud("students-inventory/ledger", "Stock Ledger", "si_ledger"),
    req("GET", "students-inventory/sale/invoice", "Public invoice view (shared link — no auth).", {
      queryParams: [{ key: "no", value: "SLE-0009", desc: "Sale number" }],
    }),
  ]],
  ["Upload & Files", [
    req("POST", "upload", "Upload a file — multipart/form-data, max 4 MB, stored in Postgres; raster images auto-converted to WebP."),
    req("GET", "files/{name}", "Serve an uploaded file by name."),
  ]],
  ["Public Access (no auth)", [
    req("GET", "settings/public", "Public school branding/login settings.", {
      queryParams: [{ key: "code", value: "DEFAULT", desc: "School code" }],
    }),
    req("GET", "students/lookup", "Public student lookup by admission number.", {
      queryParams: [{ key: "admission_no", value: "ADM2026-042", desc: "Required" }],
    }),
    req("GET", "online-admission/public", "Load the public online admission form (fields, classes, settings).", {
      queryParams: [{ key: "code", value: "DEFAULT", desc: "School code" }],
    }),
    req("POST", "online-admission/public", "Submit the public online admission form.", {
      body: { code: "DEFAULT", first_name: "Rohan", last_name: "Mehta", date_of_birth: "2012-05-04", gender: "Male", class_id: 3, mobile_number: "9922334455", email: "rohan.m@example.com", father_name: "Amit Mehta", current_address: "12 MG Road, Pune" },
    }),
    req("GET", "exam-public", "Public exam door — load an exam by token.", {
      queryParams: [{ key: "token", value: "abc123", desc: "Public link token" }],
    }),
    req("GET", "exam-questions", "Public exam question paper.", {
      queryParams: [{ key: "exam_id", value: "2", desc: "Required" }],
    }),
    req("POST", "exam-attempts", "Record a public exam attempt/result.", {
      body: { exam_id: 2, student_name: "Rohan Mehta", answers: { "1": "A", "2": "C" } },
    }),
    req("GET", "exam-attempts", "Retrieve attempts of a public exam.", {
      queryParams: [{ key: "exam_id", value: "2", desc: "Required" }],
    }),
  ]],
]

const schoolAdminFolder = folder(
  "4. School Admin CRUD",
  "Full CRUD over every module. GET ?id=N | POST create | PUT update (id in body) | DELETE ?id=N. All queries auto-scope to your school.",
  adminModules.map(([name, items]) => folder(name, "", items))
)

// ----------------------------------------------------------------
// Super Admin folder (SaaS console)
// ----------------------------------------------------------------
const superAdminFolder = folder(
  "5. Super Admin (SaaS)",
  "Platform-level APIs under /api/saas/*. Every call requires a SUPER ADMIN session (login without schoolCode). School logins get 403 Forbidden.",
  [
    req("GET", "saas/stats", "Platform-wide counters + recent schools."),
    req("GET", "saas/schools", "List all tenant schools (with plan details). ?id=N for a single school.", {
      queryParams: [{ key: "id", value: "", desc: "Optional - single school" }],
    }),
    req(
      "POST",
      "saas/schools",
      "Onboard a new school + its admin login. Auto-generates unique code when omitted; default admin password Admin@123.",
      {
        body: {
          name: "Sunrise Public School",
          email: "principal@sunrise-school.in",
          phone: "9876543210",
          address: "MG Road, Pune",
          currency: "INR",
          timezone: "Asia/Kolkata",
          planId: 3,
          maxStudents: 1000,
          adminEmail: "principal@sunrise-school.in",
          adminPassword: "StrongPass@1",
        },
      }
    ),
    req("PUT", "saas/schools", "Update a school (plan, limits, status...).", {
      body: { id: 12, plan_id: 4, max_students: 2500, status: "Active" },
    }),
    req("DELETE", "saas/schools", "Delete a school (DEFAULT is protected).", { queryParams: [{ key: "id", value: "12" }] }),
    req("GET", "saas/plans", "Subscription plans catalogue.", {}),
    req("POST", "saas/plans", "Create a subscription plan.", {
      body: { name: "Enterprise", code: "ENT", price: 4999, billing_period: "yearly", max_students: 10000, max_staff: 800 },
    }),
    req("PUT", "saas/plans", "Update a plan.", { body: { id: 3, price: 1199, status: "Active" } }),
    req("DELETE", "saas/plans", "Delete a plan.", { queryParams: [{ key: "id", value: "5" }] }),
    req("GET", "saas/invoices", "Subscription invoices across schools."),
    req("POST", "saas/invoices/pay", "Record/mark a manual invoice payment.", {
      body: { invoiceId: 88, mode: "UPI", reference: "UTR123456789" },
    }),
    req("GET", "saas/invoices/pay/status", "Invoice payment status (checkout page helper).", {
      queryParams: [{ key: "invoice", value: "88", desc: "Required - invoice id" }],
    }),
    req("POST", "saas/invoices/pay/status", "Mark an invoice paid (verifies Razorpay paymentId when configured).", {
      body: { invoice: 88, paymentId: "pay_LIc9k4SgwYg8mNx" },
    }),
    req("GET", "saas/users", "All platform users.", { queryParams: [{ key: "schoolId", value: "12", desc: "Optional filter" }] }),
    req("GET", "saas/payment-settings", "Global payment gateway settings."),
    req("POST", "saas/payment-settings", "Update global gateway settings.", {
      body: { razorpayEnabled: true, razorpayKeyId: "rzp_live_xxxx", razorpayKeySecret: "secret" },
    }),
  ]
)

// ----------------------------------------------------------------
// Build collections
// ----------------------------------------------------------------
function collection(name, description, folders) {
  return {
    info: { name, description, schema: SCHEMA },
    variable: [{ key: "base_url", type: "string", value: BASE }],
    item: folders,
  }
}

const outDir = path.join(__dirname, "..", "public")
fs.mkdirSync(outDir, { recursive: true })

const schoolCollection = collection(
  "Smart School API (School)",
  "Smart School REST API for school-level users. Start with 0. Auth & Login -> run the Login request for your role; Postman stores the smart_school_session cookie automatically. Set base_url to your server URL.",
  [...buildAuthItems(false), studentFolder, parentFolder, teacherFolder, schoolAdminFolder]
)

const saasCollection = collection(
  "Smart School API (Full + Super Admin)",
  "Complete Smart School REST API including Super Admin SaaS console APIs under /api/saas/* (super_admin session required). Set base_url to your server URL.",
  [...buildAuthItems(true), studentFolder, parentFolder, teacherFolder, schoolAdminFolder, superAdminFolder]
)

for (const [file, data] of [
  ["smart-school.postman_collection.json", schoolCollection],
  ["smart-school-saas.postman_collection.json", saasCollection],
]) {
  const p = path.join(outDir, file)
  fs.writeFileSync(p, JSON.stringify(data, null, 2))
  JSON.parse(fs.readFileSync(p, "utf8"))
  console.log(`Wrote ${p}`)
}
