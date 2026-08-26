// Master registry of admin reports, mirroring the reference PHP app
// (/admin/systemfield-style grouping at http://localhost/smart_school_src/report).
// The Reports index page renders these groups; each item maps to a page
// at /admin/reports/<slug>.

export type ReportItem = {
  label: string
  slug: string
  desc: string
  endpoint: string
  // When true the report page shows a placeholder "coming soon" state
  stub?: boolean
}

export type ReportGroup = {
  label: string
  slug: string
  icon: string
  items: ReportItem[]
}

export const REPORT_GROUPS: ReportGroup[] = [
  {
    label: "Student Information",
    slug: "student-information",
    icon: "Users",
    items: [
      { label: "Student Report", slug: "student-report", desc: "All students with class/section", endpoint: "/api/students" },
      { label: "Class Section Report", slug: "class-section-report", desc: "Students grouped by class & section", endpoint: "/api/students" },
      { label: "Guardian Report", slug: "guardian-report", desc: "Student guardian & parent contact details", endpoint: "/api/students" },
      { label: "Student History", slug: "student-history", desc: "Admission history of students", endpoint: "/api/students" },
      { label: "Student Login Credential", slug: "student-login-credential", desc: "Student login credentials", endpoint: "/api/students" },
      { label: "Parent Login Credential", slug: "parent-login-credential", desc: "Parent login credentials", endpoint: "/api/students" },
      { label: "Class Subject Report", slug: "class-subject-report", desc: "Subjects mapped per class", endpoint: "/api/academics/subject" },
      { label: "Admission Report", slug: "admission-report", desc: "Admissions within a date range", endpoint: "/api/students" },
      { label: "Sibling Report", slug: "sibling-report", desc: "Students sharing guardian details", endpoint: "/api/students" },
      { label: "Student Profile", slug: "student-profile", desc: "Full student profile summary", endpoint: "/api/students" },
      { label: "Student Gender Ratio Report", slug: "student-gender-ratio", desc: "Boys vs girls ratio", endpoint: "/api/students" },
      { label: "Student Teacher Ratio Report", slug: "student-teacher-ratio", desc: "Students per staff member", endpoint: "/api/students" },
      { label: "Online Admission Report", slug: "online-admission-report", desc: "Online admission applications", endpoint: "/api/online-admission" },
    ],
  },
  {
    label: "Attendance",
    slug: "attendance",
    icon: "CalendarCheck",
    items: [
      { label: "Attendance Report", slug: "attendance-report", desc: "Class-wise attendance summary", endpoint: "/api/attendance/student" },
      { label: "Student Attendance Type Report", slug: "student-attendance-type-report", desc: "Attendance by attendance type", endpoint: "/api/attendance/student" },
      { label: "Daily Attendance Report", slug: "daily-attendance-report", desc: "Daily present/absent register", endpoint: "/api/attendance/student" },
      { label: "Student Day Wise Attendance Report", slug: "student-daywise-attendance", desc: "Per-student daily attendance", endpoint: "/api/attendance/student" },
      { label: "Staff Day Wise Attendance Report", slug: "staff-daywise-attendance", desc: "Per-staff daily attendance", endpoint: "/api/attendance/staff" },
      { label: "Staff Attendance Report", slug: "staff-attendance-report", desc: "Staff attendance summary", endpoint: "/api/attendance/staff" },
      { label: "Period Attendance Report", slug: "period-attendance-report", desc: "Attendance by month period", endpoint: "/api/attendance/student" },
      { label: "Student Period Attendance", slug: "student-period-attendance", desc: "Per-student month attendance", endpoint: "/api/attendance/student" },
      { label: "Biometric Attendance Log", slug: "biometric-attendance-log", desc: "Biometric punch-in log", endpoint: "/api/attendance/staff", stub: true },
    ],
  },
  {
    label: "Finance",
    slug: "finance",
    icon: "Wallet",
    items: [
      { label: "Balance Fees Statement", slug: "balance-fees-statement", desc: "Outstanding fees per student", endpoint: "/api/fees/fees-payment" },
      { label: "Daily Collection Report", slug: "daily-collection-report", desc: "Fees collected on a day", endpoint: "/api/fees/fees-payment" },
      { label: "Fees Statement", slug: "fees-statement", desc: "Full fees statement per student", endpoint: "/api/fees/fees-payment" },
      { label: "Balance Fees Report", slug: "balance-fees-report", desc: "Students with balance fees", endpoint: "/api/fees/fees-payment" },
      { label: "Fees Collection Report", slug: "fees-collection-report", desc: "Collections grouped by fee type", endpoint: "/api/fees/fees-payment" },
      { label: "Online Fees Collection Report", slug: "online-fees-collection-report", desc: "Online gateway collections", endpoint: "/api/fees/fees-payment" },
      { label: "Balance Fees Report With Remark", slug: "balance-fees-report-remark", desc: "Balance fees with remarks", endpoint: "/api/fees/fees-payment" },
      { label: "Income Report", slug: "income-report", desc: "Income within a date range", endpoint: "/api/income" },
      { label: "Expense Report", slug: "expense-report", desc: "Expense within a date range", endpoint: "/api/expenses" },
      { label: "Payroll Report", slug: "payroll-report", desc: "Staff salary payments", endpoint: "/api/human-resource/payroll" },
      { label: "Income Group Report", slug: "income-group-report", desc: "Income grouped by head", endpoint: "/api/income" },
      { label: "Expense Group Report", slug: "expense-group-report", desc: "Expense grouped by head", endpoint: "/api/expenses" },
      { label: "Online Admission Fees Collection Report", slug: "online-admission-fees-report", desc: "Fees from online admissions", endpoint: "/api/online-admission" },
      { label: "Income Expense Balance Report", slug: "income-expense-balance-report", desc: "Income vs expense summary", endpoint: "/api/income" },
    ],
  },
  {
    label: "Human Resource",
    slug: "human-resource",
    icon: "Contact",
    items: [
      { label: "Staff Report", slug: "staff-report", desc: "All staff details", endpoint: "/api/staff" },
      { label: "Payroll Report", slug: "hr-payroll-report", desc: "Staff salary details", endpoint: "/api/human-resource/payroll" },
      { label: "Leave Request Report", slug: "leave-request-report", desc: "All leave requests", endpoint: "/api/attendance/leave" },
      { label: "My Leave Request Report", slug: "my-leave-request-report", desc: "My leave requests", endpoint: "/api/attendance/leave" },
    ],
  },
  {
    label: "Examinations",
    slug: "examinations",
    icon: "GraduationCap",
    items: [
      { label: "Rank Report", slug: "rank-report", desc: "Students ranked by exam marks", endpoint: "/api/examinations/mark" },
      { label: "Marks Report", slug: "marks-report", desc: "Exam marks per subject", endpoint: "/api/examinations/mark" },
    ],
  },
  {
    label: "Online Examinations",
    slug: "online-examinations",
    icon: "Laptop",
    items: [
      { label: "Result Report", slug: "online-exam-result-report", desc: "Online exam scores", endpoint: "/api/exam-attempts" },
      { label: "Exams Report", slug: "online-exams-report", desc: "Online exams list", endpoint: "/api/online-exam" },
      { label: "Student Exams Attempt Report", slug: "online-exam-attempt-report", desc: "Attempts per student", endpoint: "/api/exam-attempts" },
      { label: "Exams Rank Report", slug: "online-exam-rank-report", desc: "Students ranked in online exams", endpoint: "/api/exam-attempts" },
    ],
  },
  {
    label: "Library",
    slug: "library",
    icon: "BookOpen",
    items: [
      { label: "Book Issue Report", slug: "book-issue-report", desc: "Books issued to members", endpoint: "/api/library/issue" },
      { label: "Book Due Report", slug: "book-due-report", desc: "Overdue / due books", endpoint: "/api/library/issue" },
      { label: "Book Inventory Report", slug: "book-inventory-report", desc: "Books available in library", endpoint: "/api/library/book" },
      { label: "Issue Return Report", slug: "book-issue-return-report", desc: "Issued vs returned books", endpoint: "/api/library/issue" },
    ],
  },
  {
    label: "Lesson Plan",
    slug: "lesson-plan",
    icon: "NotebookPen",
    items: [
      { label: "Syllabus Status Report", slug: "syllabus-status-report", desc: "Syllabus completion status", endpoint: "/api/lesson-plan/syllabus-status" },
      { label: "Subject Lesson Plan Report", slug: "subject-lesson-plan-report", desc: "Lesson plans per subject", endpoint: "/api/lesson-plan/plan" },
    ],
  },
  {
    label: "Alumni",
    slug: "alumni",
    icon: "GraduationCap",
    items: [
      { label: "Alumni Report", slug: "alumni-report", desc: "Registered alumni", endpoint: "/api/alumni" },
    ],
  },
]

export const REPORT_FLAT: (ReportItem & { group: ReportGroup })[] = REPORT_GROUPS.flatMap((g) =>
  g.items.map((it) => ({ ...it, group: g }))
)

export function reportPath(slug: string) {
  return `/admin/reports/${slug}`
}
