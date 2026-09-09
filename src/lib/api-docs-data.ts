// Shared REST API documentation data.
// Consumed by /admin/multi-branch/rest-api (school edition) and /saas/rest-api (super admin edition).

export type ParamDoc = {
  name: string
  required?: boolean
  example?: string
  desc?: string
}

export type EndpointDoc = {
  method: "GET" | "POST" | "PUT" | "DELETE"
  path: string // relative to /api
  summary: string
  desc?: string
  roles?: string[] // roles allowed by requireRole()
  params?: ParamDoc[]
  body?: unknown // sample JSON request body
  response?: unknown // sample JSON response
}

export type LoginSample = {
  role: string
  email: string
  password: string
  schoolCode?: string | null
  redirect: string
  note?: string
}

export type RoleSection = {
  id: string
  label: string
  tagline: string
  login: LoginSample
  endpoints: EndpointDoc[]
}

// ----------------------------------------------------------------
// Auth — how every role logs in
// ----------------------------------------------------------------

export const authType = {
  kind: "Cookie Session (httpOnly) + Mobile Bearer Token",
  cookieName: "smart_school_session",
  details: [
    "Authentication uses an HMAC-SHA256 signed session that expires after 7 days. There are no API keys.",
    "WEB: Call POST /api/auth/login once. The response sets Set-Cookie: smart_school_session=<token> (httpOnly, valid 7 days) and every subsequent request automatically carries the cookie.",
    "MOBILE (Flutter / Android / iOS): the same login response ALSO returns the session as a `token` field in the JSON body. Store it securely (flutter_secure_storage) and send it on every request as `Authorization: Bearer <token>`. No cookie jar needed.",
    "Every subsequent request — cookie OR Authorization header — is verified by the middleware (proxy), which injects x-user-id, x-school-id and x-role headers into the API route.",
    "All data queries are auto-scoped to your school via x-school-id, so one shared database safely serves many schools (multi-tenant).",
    "In Postman just run the Login request first — the cookie is saved into the collection's cookie jar and every other request in the same collection is authenticated. For a mobile-style test, copy the `token` field from the login JSON into the Authorization header.",
  ],
}

export const authEndpoints: EndpointDoc[] = [
  {
    method: "POST",
    path: "auth/login",
    summary: "Log in as any role and receive the session cookie",
    desc: "Email + password are always required. schoolCode is required for every school-level role (admin, teacher, staff, student, parent) and must be omitted for super admins. If the account has 2FA enabled, the response is { requiresTwoFactor: true, challengeToken } instead — complete with POST auth/2fa/verify.",
    body: {
      email: "admin@smart-school.in",
      password: "Admin@123",
      schoolCode: "DEFAULT",
    },
    response: {
      user: {
        id: 2,
        name: "Admin - Smart School",
        email: "admin@smart-school.in",
        role: "admin",
        permissions: [],
        schoolId: 1,
      },
      school: {
        id: 1,
        code: "DEFAULT",
        name: "Smart School Demo",
        status: "Active",
      },
      redirect: "/admin",
      token: "<smart_school_session token — use as Authorization: Bearer on mobile>",
    },
  },
  {
    method: "GET",
    path: "auth/me",
    summary: "Get the currently logged-in user, role and school",
    response: {
      authenticated: true,
      user: {
        id: 2,
        name: "Admin - Smart School",
        email: "admin@smart-school.in",
        role: "admin",
        permissions: [],
        schoolId: 1,
      },
      school: { id: 1, code: "DEFAULT", name: "Smart School Demo" },
    },
  },
  {
    method: "POST",
    path: "auth/logout",
    summary: "Clear the session cookie (log out)",
    body: {},
    response: { success: true },
  },
  {
    method: "POST",
    path: "auth/register",
    summary: "Public self-registration of a new school + its admin",
    desc: "Creates a new school row plus its first admin user (default password Admin@123). No authentication required.",
    body: {
      name: "Sunrise Public School",
      email: "principal@sunrise-school.in",
      mobile: "9876543210",
      address: "MG Road, Pune",
      tagline: "Learn Grow Shine",
      adminName: "Mrs. Kavita Rao",
    },
    response: {
      success: true,
      school: { id: 12, code: "SUNRISEPUBLIC", name: "Sunrise Public School" },
      adminEmail: "principal@sunrise-school.in",
      defaultPassword: "Admin@123",
      redirect: "/admin",
    },
  },
  {
    method: "POST",
    path: "auth/impersonate",
    summary: "Admin/super-admin temporarily signs in as another user",
    desc: "Verifies the acting user (admin or super_admin), then re-signs the session cookie in the target user's name while preserving the original actor in origUid. Only users with status='Active' can be impersonated. Use auth/impersonate/back to restore the original session.",
    body: { userId: 7 },
    response: {
      success: true,
      user: { id: 7, name: "Aarav Sharma", email: "student@yourschool.com", role: "student", schoolId: 1 },
      actingAs: { id: 7, role: "student" },
      redirect: "/portal",
    },
  },
  {
    method: "POST",
    path: "auth/impersonate/back",
    summary: "Restore the original admin session after impersonation",
    desc: "Only valid when the current session was created by impersonation (origUid present). Returns to the original actor's session.",
    body: {},
    response: { success: true, user: { id: 2, name: "Admin - Smart School", email: "admin@smart-school.in", role: "admin" } },
  },
  {
    method: "POST",
    path: "auth/2fa/verify",
    summary: "Complete login for 2FA-enabled accounts (step 2)",
    desc: "When auth/login returns requiresTwoFactor:true, call this with the challengeToken plus the 6-digit authenticator code (or a one-time backup code). Returns the normal session cookie + token on success.",
    body: { challengeToken: "<challengeToken from login>", code: "123456" },
    response: {
      user: { id: 2, name: "Admin - Smart School", email: "admin@smart-school.in", role: "admin", permissions: [], schoolId: 1 },
      redirect: "/admin",
      token: "<smart_school_session token>",
    },
  },
  {
    method: "GET",
    path: "auth/2fa/status",
    summary: "Check whether 2FA is enabled on my own account",
    response: { enabled: false },
  },
  {
    method: "POST",
    path: "auth/2fa/setup",
    summary: "Start 2FA setup — returns secret + QR code to scan",
    desc: "Stores a fresh TOTP secret (still disabled). Scan qrDataUrl with Google Authenticator/Authy, then confirm with auth/2fa/enable.",
    body: {},
    response: {
      secret: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP",
      otpauthUrl: "otpauth://totp/Smart%20School:admin@smart-school.in?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=Smart%20School&algorithm=SHA1&digits=6&period=30",
      qrDataUrl: "<data:image/png;base64,...>",
    },
  },
  {
    method: "POST",
    path: "auth/2fa/enable",
    summary: "Confirm setup with an authenticator code (enables 2FA + returns backup codes)",
    desc: "Backup codes are shown only once — each works a single time if the authenticator is lost.",
    body: { code: "123456" },
    response: { success: true, message: "Two-factor authentication enabled", backupCodes: ["A1B2C3-D4E5F6"] },
  },
  {
    method: "POST",
    path: "auth/2fa/disable",
    summary: "Turn off 2FA on my own account (password confirmation)",
    body: { password: "Admin@123" },
    response: { success: true, message: "Two-factor authentication disabled" },
  },
]

export const loginSamples: LoginSample[] = [
  {
    role: "School Admin",
    email: "admin@smart-school.in",
    password: "Admin@123",
    schoolCode: "DEFAULT",
    redirect: "/admin",
    note: "Full school administration panel access.",
  },
  {
    role: "Teacher",
    email: "teacher@yourschool.com",
    password: "<set-by-admin>",
    schoolCode: "DEFAULT",
    redirect: "/portal",
    note: "Teacher/staff accounts are created by the school admin under System Setting → Users.",
  },
  {
    role: "Student",
    email: "student@yourschool.com",
    password: "<set-by-admin>",
    schoolCode: "DEFAULT",
    redirect: "/portal",
    note: "The students.user_id column must link the login to the student record.",
  },
  {
    role: "Parent",
    email: "parent@yourschool.com",
    password: "<set-by-admin>",
    schoolCode: "DEFAULT",
    redirect: "/portal",
    note: "Parent logins see only children linked through student_guardians.parent_user_id.",
  },
]

// ----------------------------------------------------------------
// Common portal endpoints (any authenticated role)
// ----------------------------------------------------------------

const commonPortalEndpoints: EndpointDoc[] = [
  {
    method: "GET",
    path: "my",
    summary: "Discovery — list every endpoint available to the logged-in role",
    roles: ["student", "parent", "teacher", "staff", "admin"],
    response: {
      authenticated: true,
      userId: 7,
      schoolId: 1,
      role: "student",
      links: [
        "/api/my/dashboard",
        "/api/my/student/profile",
        "/api/my/student/details",
      ],
    },
  },
  {
    method: "GET",
    path: "my/dashboard",
    summary: "Role-aware dashboard counters",
    roles: ["student", "parent", "teacher", "staff", "admin"],
    response: {
      role: "student",
      name: "Aarav Sharma",
      className: "Class 10",
      summary: { homework: 12, attendanceToday: 1, results: 8 },
    },
  },
  {
    method: "GET",
    path: "my/profile",
    summary: "Logged-in account + linked student/staff/kids record",
    roles: ["*"],
    response: {
      user: { id: 7, name: "Aarav Sharma", email: "student@yourschool.com", role: "student" },
      schoolId: 1,
      linked: { role: "student", studentId: 15 },
    },
  },
  {
    method: "GET",
    path: "my/student/notices",
    summary: "Published notices",
    roles: ["student", "parent", "teacher", "staff", "admin"],
    response: {
      notices: [
        {
          id: 3,
          title: "Annual Day Rehearsal",
          noticeDate: "2026-08-20",
          publishDate: "2026-08-19",
          message: "Rehearsal starts at 2 PM in the main hall.",
        },
      ],
    },
  },
]

// ----------------------------------------------------------------
// STUDENT portal APIs
// ----------------------------------------------------------------

export const studentSection: RoleSection = {
  id: "student",
  label: "Student",
  tagline: "Self-service endpoints consumed by a student's own login (/portal).",
  login: loginSamples.find((l) => l.role === "Student")!,
  endpoints: [
    ...commonPortalEndpoints,
    {
      method: "GET",
      path: "my/student",
      summary: "My profile summary",
      roles: ["student"],
      response: {
        id: 15,
        admissionNo: "ADM2026-042",
        rollNo: "12",
        name: "Aarav Sharma",
        firstName: "Aarav",
        middleName: null,
        lastName: "Sharma",
        className: "Class 10",
        sectionName: "A",
        classId: 5,
        sectionId: 2,
        gender: "Male",
        dob: "2011-06-14",
        category: "General",
        bloodGroup: "O+",
        house: "Blue",
        email: "aarav@yourschool.com",
        mobile: "9876500011",
        admissionDate: "2024-04-01",
        status: "Active",
      },
    },
    {
      method: "GET",
      path: "my/student/profile",
      summary: "My profile enriched with class & section names",
      roles: ["student"],
      response: {
        id: 15,
        admissionNo: "ADM2026-042",
        rollNo: "12",
        name: "Aarav Sharma",
        class: "Class 10",
        section: "A",
        gender: "Male",
        dob: "2011-06-14",
        category: "General",
        bloodGroup: "O+",
        house: "Blue",
        email: "aarav@yourschool.com",
        mobile: "9876500011",
        status: "Active",
      },
    },
    {
      method: "GET",
      path: "my/student/details",
      summary: "Full 360° record — profile, parents, fees, exams, attendance",
      roles: ["student"],
      response: {
        id: 15,
        student: {
          admissionNo: "ADM2026-042",
          rollNo: "12",
          name: "Aarav Sharma",
          gender: "Male",
          dob: "2011-06-14",
          bloodGroup: "O+",
          mobile: "9876500011",
          category: "General",
          religion: "Hindu",
          house: "Blue",
          admissionDate: "2024-04-01",
          rte: false,
          status: "Active",
          studentPhoto: "/uploads/student/15.jpg",
        },
        academic: { classId: 5, sectionId: 2, className: "Class 10", sectionName: "A", session: "2025-26" },
        parent: {
          fatherName: "Rakesh Sharma",
          fatherPhone: "9876500022",
          motherName: "Sunita Sharma",
          guardianIs: "father",
          guardianPhone: "9876500022",
        },
        bank: { bankAccountNo: "50110023456", bankName: "HDFC", ifscCode: "HDFC0001234" },
        guardians: [{ name: "Rakesh Sharma", email: "rakesh@yourschool.com", role: "parent", parentType: "Father" }],
        attendance: { total: 148, summary: { Present: 140, Absent: 6, Late: 2 } },
        fees: {
          totalDue: 4500,
          dues: [
            { masterId: 8, feesType: "Tuition Fee", feesGroup: "Class Fee", amount: 12000, dueDate: "2026-04-10" },
            { masterId: 9, feesType: "Exam Fee", feesGroup: "Class Fee", amount: 1500, dueDate: "2026-08-30" },
          ],
        },
        exams: {
          total: 8,
          results: [
            { examId: 4, examName: "Half Yearly", subject: "Mathematics", theoryMarks: 78, practicalMarks: 18, absent: false },
          ],
        },
        homeworkCount: 12,
      },
    },
    {
      method: "GET",
      path: "my/student/homework",
      summary: "Homework for my class/section",
      roles: ["student"],
      response: {
        studentId: 15,
        homework: [
          {
            id: 21,
            classId: 5,
            sectionId: 2,
            subjectId: 3,
            subject: "Mathematics",
            className: "Class 10",
            sectionName: "A",
            homeworkDate: "2026-08-18",
            submissionDate: "2026-08-22",
            description: "Solve exercise 7.2, problems 1-10",
            document: null,
            createdAt: "2026-08-18T05:30:00.000Z",
          },
        ],
      },
    },
    {
      method: "GET",
      path: "my/student/timetable",
      summary: "My weekly timetable",
      roles: ["student"],
      response: {
        studentId: 15,
        timetable: [
          {
            id: 101,
            subject: "Mathematics",
            day: "Monday",
            period: 1,
            startTime: "08:00",
            endTime: "08:45",
            teacher: "Mrs. Anjali Deshmukh",
          },
        ],
      },
    },
    {
      method: "GET",
      path: "my/student/exams",
      summary: "My exam results (published marks)",
      roles: ["student"],
      params: [],
      response: {
        studentId: 15,
        results: [
          {
            id: 402,
            examId: 4,
            examName: "Half Yearly",
            published: true,
            subjectId: 3,
            subject: "Mathematics",
            theoryMarks: 78,
            practicalMarks: 18,
            absent: false,
            notes: null,
          },
        ],
      },
    },
    {
      method: "GET",
      path: "my/student/attendance",
      summary: "My monthly attendance with per-day records",
      roles: ["student"],
      params: [{ name: "month", required: false, example: "2026-08", desc: "YYYY-MM; defaults to current month" }],
      response: {
        studentId: 15,
        month: "2026-08",
        summary: { Present: 14, Absent: 1 },
        records: [
          {
            id: 900,
            date: "2026-08-20",
            inTime: "07:55",
            outTime: "14:10",
            attendanceType: "Present",
            recordedAt: "2026-08-20T03:00:00.000Z",
          },
        ],
      },
    },
    {
      method: "GET",
      path: "my/student/fees",
      summary: "My fee dues vs payments",
      roles: ["student"],
      response: {
        studentId: 15,
        summary: { totalDue: 4500, totalPaid: 9000, pendingCount: 2 },
        dues: [
          {
            masterId: 8,
            feesType: "Tuition Fee",
            feesGroup: "Class Fee",
            amount: 12000,
            paidAmount: 9000,
            balance: 3000,
            dueDate: "2026-04-10",
            paidOn: "2026-04-08",
          },
        ],
        payments: [
          {
            id: 55,
            feesTypeId: 2,
            amount: 9000,
            discountAmount: 0,
            fineAmount: 0,
            paidAmount: 9000,
            paymentMode: "Online",
            paymentDate: "2026-04-08",
            status: "Success",
            createdAt: "2026-04-08T06:12:00.000Z",
          },
        ],
      },
    },
    {
      method: "GET",
      path: "my/fees/gateways",
      summary: "Online payment gateways the school has enabled",
      roles: ["student", "parent"],
      response: {
        gateways: [
          { code: "razorpay", name: "Razorpay", mode: "card", testMode: false },
        ],
      },
    },
    {
      method: "POST",
      path: "my/fees/pay/order",
      summary: "Start an online fee payment — returns checkout data (supports masterId)",
      desc: "Student and parent logins. Validates the fee head against the student's active fee masters (prefers masterId to avoid duplicate fee types), computes the pending balance, and — when Razorpay is configured — creates a Razorpay Order and records a Pending fees_payments row (idempotent per head). Supports single (masterId/feesTypeId+amount), group (masterIds/feesTypeIds), or payAll. When Razorpay is NOT configured it records the fee as Paid immediately. Use gateway: razorpay/phonepe/cashfree/manual etc.",
      roles: ["student", "parent"],
      body: {
        studentId: 15,
        masterId: 8,
        feesTypeId: 3,
        amount: 3000,
        gateway: "razorpay",
      },
      response: {
        mode: "razorpay_order",
        paymentId: 61,
        studentId: 15,
        feesTypeId: 3,
        orderId: "order_PLc9k4SgwYg8mN",
        amount: 3000,
        amountPaise: 300000,
        currency: "INR",
        keyId: "rzp_live_xxxxxxxx",
        name: "Aarav Sharma",
        prefillEmail: "aarav@yourschool.com",
        description: "Tuition Fee payment",
      },
    },
    {
      method: "POST",
      path: "my/fees/pay/verify",
      summary: "Confirm the Razorpay payment and mark the fee as paid",
      desc: "Called after the Razorpay checkout succeeds (mobile SDK returns a payment id). Verifies the payment against Razorpay when configured, flips the Pending fees_payments row to Paid with payment_method=\"razorpay\" and transaction_id, and returns the fresh fee ledger.",
      roles: ["student", "parent"],
      body: {
        paymentId: 61,
        studentId: 15,
        razorpayPaymentId: "pay_LIc9k4SgwYg8mNx",
      },
      response: {
        success: true,
        payment: {
          id: 61,
          studentId: 15,
          feesTypeId: 3,
          amount: 3000,
          paidAmount: 3000,
          paymentMode: "Online",
          paymentMethod: "razorpay",
          transactionId: "pay_LIc9k4SgwYg8mNx",
          paymentDate: "2026-08-22",
          status: "Paid",
        },
        ledger: {
          studentId: 15,
          summary: { totalDue: 1500, totalPaid: 12000, pendingCount: 1 },
          dues: [],
          payments: [],
        },
      },
    },
    {
      method: "GET",
      path: "my/student/library",
      summary: "My issued library books",
      roles: ["student"],
      response: {
        studentId: 15,
        summary: { total: 3, currentlyIssued: 1 },
        books: [
          {
            id: 41,
            book: "Concepts of Physics",
            bookNumber: "BK-101",
            author: "HC Verma",
            memberId: "15",
            issueDate: "2026-08-05",
            returnDate: null,
            status: "Issued",
          },
        ],
      },
    },
    {
      method: "GET",
      path: "my/student/book-requests",
      summary: "Library book catalogue with my request status",
      roles: ["student"],
      response: {
        books: [
          { id: 12, bookName: "Concepts of Physics", bookNumber: "BK-101", isbn: "9788177091870", author: "HC Verma", subject: "Physics", quantity: 12, requestStatus: "Pending", requestId: 5 },
        ],
      },
    },
    {
      method: "POST",
      path: "my/student/book-requests",
      summary: "Request a library book (status Pending until librarian accepts)",
      roles: ["student"],
      body: { bookId: 12 },
      response: { success: true, message: "Book request submitted" },
    },
    {
      method: "GET",
      path: "my/student/hostel",
      summary: "Hostels + rooms available in my school",
      roles: ["student"],
      response: {
        hostels: [
          { id: 1, name: "Boys Hostel A", type: "Boys", address: "Campus", phone: "020-25551234", wardenName: "Mr. Kadam", wardenContact: "9876500099", totalRooms: 10, totalBeds: 40, rooms: [{ id: 3, hostelId: 1, roomNumber: "101", capacity: 4, rent: 2500, roomType: "Quad" }] },
        ],
      },
    },
    {
      method: "GET",
      path: "my/student/lesson-plans",
      summary: "Lesson plans for my class/section with syllabus progress",
      roles: ["student", "parent"],
      response: {
        studentId: 15,
        className: "Class 10",
        sectionName: "A",
        summary: { total: 8, completed: 3, inProgress: 2 },
        plans: [
          { id: 6, subject: "Mathematics", lesson: "Quadratic Equations", topic: "Roots", startDate: "2026-08-01", endDate: "2026-08-20", status: "Completed", percentage: 100, description: null },
        ],
      },
    },
    {
      method: "GET",
      path: "my/student/online-courses",
      summary: "Online courses catalogue with my enrollment flags",
      roles: ["student"],
      response: {
        courses: [
          { id: 2, title: "Spoken English", description: "8-week course", thumbnail: "/uploads/course/2.jpg", teacher: "Mrs. Fernandes", free: false, price: 499, discount: 0, category: "Language", enrolled: true, enrolledAt: "2026-08-10T06:00:00.000Z" },
        ],
      },
    },
    {
      method: "POST",
      path: "my/student/online-courses",
      summary: "Enroll myself in an online course",
      roles: ["student"],
      body: { courseId: 2 },
      response: { success: true, message: "Successfully enrolled" },
    },
    {
      method: "GET",
      path: "my/student/other-payments",
      summary: "Non-fee payments (stationery/book shop sales) for me / my kids",
      roles: ["student", "parent"],
      response: {
        sales: [
          { id: 9, saleNo: "SLE-0009", studentId: 15, studentName: "Aarav Sharma", productName: "Notebook Set", bookName: null, quantity: 2, unitPrice: 60, subtotal: 120, discountAmount: 0, totalAmount: 120, saleDate: "2026-08-18", paymentStatus: "Paid" },
        ],
      },
    },
    {
      method: "GET",
      path: "my/student/syllabus-status",
      summary: "Syllabus completion status per subject (student=self, parent=kid, teacher=taught classes)",
      roles: ["student", "parent", "teacher", "staff", "admin"],
      params: [
        { name: "student_id", required: false, example: "15", desc: "Parent: pick a child; defaults to first kid" },
        { name: "class_id", required: false, example: "5", desc: "Teacher/staff/admin only" },
        { name: "section_id", required: false, example: "2", desc: "Teacher/staff/admin only" },
      ],
      response: {
        classId: 5,
        sectionId: 2,
        className: "Class 10",
        sectionName: "A",
        summary: { total: 24, completed: 12, inProgress: 6, notStarted: 6, percentage: 63 },
        subjects: [
          { id: 3, name: "Mathematics", total: 6, completed: 4, inProgress: 1, notStarted: 1, percentage: 75 },
        ],
        items: [
          { id: 40, subject: "Mathematics", lesson: "Quadratic Equations", topic: "Roots", status: "Completed", percentage: 100 },
        ],
      },
    },
    {
      method: "GET",
      path: "my/student/teacher-reviews",
      summary: "Teachers of my class with my submitted review/rating",
      roles: ["student"],
      response: {
        teachers: [
          { teacherName: "Mrs. Anjali Deshmukh", subject: "Physics", time: "08:45", email: "anjali@yourschool.com", phone: "9876555544", myRating: 5, myComment: "Explains very clearly", reviewId: 2 },
        ],
      },
    },
    {
      method: "POST",
      path: "my/student/teacher-reviews",
      summary: "Submit/update a review for one of my teachers (rating 1-5)",
      roles: ["student"],
      body: { teacherName: "Mrs. Anjali Deshmukh", subject: "Physics", rating: 5, comments: "Explains very clearly" },
      response: { success: true, message: "Review submitted" },
    },
    {
      method: "GET",
      path: "my/student/transport",
      summary: "Transport routes with vehicles and pickup points",
      roles: ["student"],
      response: {
        routes: [
          { id: 4, title: "Route 4 - Kothrud", code: "R4", vehicles: [{ vehicleId: 3, vehicleNumber: "MH12AB1234", vehicleName: "Tata Starbus", capacity: 40, driverName: "Ram Singh", driverContact: "9876533322" }], pickupPoints: [{ pickupPointId: 7, pickupPointName: "Kothrud Depot", address: "Paud Road", pickupTime: "07:20", amount: 1200 }] },
        ],
      },
    },
    {
      method: "GET",
      path: "my/attendance-note",
      summary: "Attendance notes for a student (mine / my kid / any for staff)",
      roles: ["student", "parent", "teacher", "staff", "admin"],
      params: [
        { name: "month", required: false, example: "2026-08", desc: "YYYY-MM; defaults to current month" },
        { name: "date", required: false, example: "2026-08-20", desc: "Single-day lookup (overrides month)" },
        { name: "studentId", required: false, example: "15", desc: "Required for parent; ignored for student (self)" },
      ],
      response: {
        studentId: 15,
        month: "2026-08",
        notes: [{ id: 3, studentId: 15, date: "2026-08-20", note: "Came late due to medical appointment", createdBy: 9 }],
      },
    },
    {
      method: "PUT",
      path: "my/attendance-note",
      summary: "Add/update an attendance note for a date (empty note deletes it)",
      roles: ["student", "parent", "teacher", "staff", "admin"],
      body: { studentId: 15, date: "2026-08-20", note: "Came late due to medical appointment" },
      response: { id: 3, studentId: 15, date: "2026-08-20", note: "Came late due to medical appointment" },
    },
    {
      method: "GET",
      path: "my/exams",
      summary: "All exams with publish flags (exam list for results screens)",
      roles: ["student", "parent", "teacher", "staff", "admin"],
      response: {
        exams: [
          { id: 4, name: "Half Yearly", session: "2025-26", group: "Secondary", publishExam: true, publishResult: true },
        ],
      },
    },
    {
      method: "POST",
      path: "my/leave",
      summary: "Apply for leave (student applies for self)",
      roles: ["student", "parent", "teacher", "staff"],
      desc: "Parents must pass studentId to apply on behalf of a child; students and staff apply for themselves.",
      body: {
        leaveTypeId: 1,
        fromDate: "2026-09-01",
        toDate: "2026-09-02",
        reason: "Fever and cold",
      },
      response: {
        success: true,
        leave: { id: 9, fromDate: "2026-09-01", toDate: "2026-09-02", days: 2, status: "Pending", appliedOn: "2026-08-22" },
      },
    },
    {
      method: "GET",
      path: "my/leave",
      summary: "My applied leaves with status",
      roles: ["student", "parent", "teacher", "staff", "admin"],
      response: {
        leaves: [
          { id: 9, userId: 7, name: "Aarav Sharma", role: "student", leaveType: "Sick Leave", fromDate: "2026-09-01", toDate: "2026-09-02", days: 2, reason: "Fever and cold", status: "Pending", appliedAt: "2026-08-22T06:00:00.000Z" },
        ],
      },
    },
  ],
}

// ----------------------------------------------------------------
// PARENT portal APIs
// ----------------------------------------------------------------

export const parentSection: RoleSection = {
  id: "parent",
  label: "Parent",
  tagline: "Every endpoint is scoped to children linked to the parent login.",
  login: loginSamples.find((l) => l.role === "Parent")!,
  endpoints: [
    ...commonPortalEndpoints,
    {
      method: "GET",
      path: "my/parent/kids",
      summary: "List my children",
      roles: ["parent"],
      response: {
        kids: [
          {
            id: 15,
            admissionNo: "ADM2026-042",
            rollNo: "12",
            name: "Aarav Sharma",
            class: "Class 10",
            section: "A",
            gender: "Male",
            dob: "2011-06-14",
            status: "Active",
          },
        ],
      },
    },
    {
      method: "GET",
      path: "my/parent/kids/attendance",
      summary: "Monthly attendance of one child",
      roles: ["parent"],
      params: [
        { name: "studentId", required: true, example: "15", desc: "Kid id from /my/parent/kids" },
        { name: "month", required: false, example: "2026-08", desc: "YYYY-MM; defaults to current month" },
      ],
      response: {
        studentId: 15,
        student: { id: 15, name: "Aarav Sharma", class: "Class 10", section: "A" },
        month: "2026-08",
        records: [
          { id: 900, date: "2026-08-20", inTime: "07:55", outTime: "14:10", attendanceType: "Present", recordedAt: "2026-08-20T03:00:00.000Z" },
        ],
      },
    },
    {
      method: "GET",
      path: "my/parent/kids/fees",
      summary: "Fee dues + payment history of one child",
      roles: ["parent"],
      params: [{ name: "studentId", required: true, example: "15" }],
      response: {
        studentId: 15,
        summary: { totalDue: 4500, totalPaid: 9000, pendingCount: 2 },
        masters: [{ id: 8, feesType: "Tuition Fee", feesGroupId: 1, amount: 12000, dueDate: "2026-04-10", status: "Active" }],
        payments: [{ id: 55, feesTypeId: 2, paidAmount: 9000, paymentMode: "Online", paymentDate: "2026-04-08", status: "Success" }],
      },
    },
    {
      method: "GET",
      path: "my/fees/gateways",
      summary: "Online payment gateways the school has enabled",
      roles: ["student", "parent"],
      response: {
        gateways: [
          { code: "razorpay", name: "Razorpay", mode: "card", testMode: false },
        ],
      },
    },
    {
      method: "POST",
      path: "my/parent/kids/fees/pay",
      summary: "Record a direct fee payment for one of my children",
      desc: "Creates a fee payment row for a child (skips the Razorpay order/verify flow). paymentMode defaults to \"Online\" and may be a manual mode like Cash/Cheque.",
      roles: ["parent"],
      body: {
        studentId: 15,
        feesTypeId: 3,
        amount: 3000,
        paymentMode: "Cash",
      },
      response: {
        success: true,
        payment: { id: 59, studentId: 15, feesTypeId: 3, paidAmount: 3000, paymentMode: "Cash", paymentDate: "2026-08-22", status: "Paid" },
      },
    },
    {
      method: "POST",
      path: "my/fees/pay/order",
      summary: "Start an online fee payment for one of my children (supports masterId)",
      desc: "Parent must pass studentId of one of their linked kids. Validates by masterId (preferred) or feesTypeId, computes pending balance, creates Razorpay Order + Pending row when configured (idempotent per head), otherwise demo/manual. Supports masterId/masterIds, feesTypeId/feesTypeIds, payAll, amount (partial) and gateway code.",
      roles: ["student", "parent"],
      body: {
        studentId: 15,
        masterId: 8,
        feesTypeId: 3,
        amount: 3000,
        gateway: "razorpay",
      },
      response: {
        mode: "razorpay_order",
        paymentId: 61,
        studentId: 15,
        feesTypeId: 3,
        orderId: "order_PLc9k4SgwYg8mN",
        amount: 3000,
        amountPaise: 300000,
        currency: "INR",
        keyId: "rzp_live_xxxxxxxx",
        name: "Aarav Sharma",
        description: "Tuition Fee payment",
      },
    },
    {
      method: "POST",
      path: "my/fees/pay/verify",
      summary: "Confirm the Razorpay payment and mark the fee as paid",
      desc: "Call after the Razorpay checkout succeeds. Verifies the payment id against Razorpay (when configured), marks the Pending row Paid and returns the fresh ledger. studentId is required for parent logins.",
      roles: ["student", "parent"],
      body: {
        paymentId: 61,
        studentId: 15,
        razorpayPaymentId: "pay_LIc9k4SgwYg8mNx",
      },
      response: {
        success: true,
        payment: {
          id: 61,
          studentId: 15,
          feesTypeId: 3,
          amount: 3000,
          paidAmount: 3000,
          paymentMode: "Online",
          paymentMethod: "razorpay",
          transactionId: "pay_LIc9k4SgwYg8mNx",
          paymentDate: "2026-08-22",
          status: "Paid",
        },
        ledger: { studentId: 15, summary: { totalDue: 1500, totalPaid: 12000, pendingCount: 1 }, dues: [], payments: [] },
      },
    },
    {
      method: "GET",
      path: "my/parent/kids/homework",
      summary: "Homework of one child",
      roles: ["parent"],
      params: [{ name: "studentId", required: true, example: "15" }],
      response: {
        studentId: 15,
        homework: [
          { id: 21, subjectId: 3, subject: "Mathematics", homeworkDate: "2026-08-18", submissionDate: "2026-08-22", description: "Exercise 7.2", document: null, createdAt: "2026-08-18T05:30:00.000Z" },
        ],
      },
    },
    {
      method: "GET",
      path: "my/parent/kids/details",
      summary: "Full profile of one child — personal, academic, parents, bank, attendance",
      roles: ["parent"],
      params: [{ name: "studentId", required: true, example: "15" }],
      response: {
        id: 15,
        student: { admissionNo: "ADM2026-042", rollNo: "12", name: "Aarav Sharma", gender: "Male", dob: "2011-06-14", bloodGroup: "O+", mobile: "9876500011", category: "General", house: "Blue", admissionDate: "2024-04-01", rte: false, status: "Active", studentPhoto: "/uploads/student/15.jpg" },
        academic: { classId: 5, sectionId: 2, className: "Class 10", sectionName: "A", session: "2025-26" },
        parent: { fatherName: "Rakesh Sharma", fatherPhone: "9876500022", motherName: "Sunita Sharma", guardianIs: "father" },
        attendance: { total: 148, summary: { Present: 140, Absent: 6, Late: 2 } },
      },
    },
    {
      method: "GET",
      path: "my/parent/kids/timetable",
      summary: "Weekly timetable of one child",
      roles: ["parent"],
      params: [{ name: "studentId", required: true, example: "15" }],
      response: {
        studentId: 15,
        timetable: [
          { id: 101, subject: "Mathematics", day: "Monday", period: 1, startTime: "08:00", endTime: "08:45", teacher: "Mrs. Anjali Deshmukh" },
        ],
      },
    },
    {
      method: "GET",
      path: "my/parent/kids/library",
      summary: "Library books issued to one child",
      roles: ["parent"],
      params: [{ name: "studentId", required: true, example: "15" }],
      response: {
        studentId: 15,
        summary: { total: 2, currentlyIssued: 1 },
        books: [
          { id: 41, book: "Concepts of Physics", bookNumber: "BK-101", author: "HC Verma", issueDate: "2026-08-05", returnDate: null, status: "Issued" },
        ],
      },
    },
    {
      method: "GET",
      path: "my/parent/kids/exams",
      summary: "Exam results of one child",
      roles: ["parent"],
      params: [{ name: "studentId", required: true, example: "15" }],
      response: {
        studentId: 15,
        student: { id: 15, name: "Aarav Sharma", class: "Class 10", section: "A" },
        results: [
          { id: 402, examId: 4, examName: "Half Yearly", published: true, subjectId: 3, subject: "Mathematics", theoryMarks: 78, practicalMarks: 18, absent: false, notes: null },
        ],
      },
    },
    {
      method: "GET",
      path: "my/student/lesson-plans",
      summary: "Lesson plans of one child's class/section",
      roles: ["student", "parent"],
      response: {
        studentId: 15,
        className: "Class 10",
        sectionName: "A",
        summary: { total: 8, completed: 3, inProgress: 2 },
        plans: [
          { id: 6, subject: "Mathematics", lesson: "Quadratic Equations", topic: "Roots", startDate: "2026-08-01", endDate: "2026-08-20", status: "Completed", percentage: 100, description: null },
        ],
      },
    },
    {
      method: "GET",
      path: "my/student/other-payments",
      summary: "Non-fee payments (stationery/book shop sales) of all my kids",
      roles: ["student", "parent"],
      response: {
        sales: [
          { id: 9, saleNo: "SLE-0009", studentId: 15, studentName: "Aarav Sharma", productName: "Notebook Set", quantity: 2, unitPrice: 60, subtotal: 120, discountAmount: 0, totalAmount: 120, saleDate: "2026-08-18", paymentStatus: "Paid" },
        ],
      },
    },
    {
      method: "GET",
      path: "my/student/syllabus-status",
      summary: "Syllabus completion status of one child (pass student_id, defaults to first kid)",
      roles: ["student", "parent", "teacher", "staff", "admin"],
      params: [{ name: "student_id", required: false, example: "15", desc: "Pick a child; defaults to first linked kid" }],
      response: {
        classId: 5,
        sectionId: 2,
        className: "Class 10",
        sectionName: "A",
        studentId: 15,
        summary: { total: 24, completed: 12, inProgress: 6, notStarted: 6, percentage: 63 },
        subjects: [{ id: 3, name: "Mathematics", total: 6, completed: 4, inProgress: 1, notStarted: 1, percentage: 75 }],
      },
    },
    {
      method: "GET",
      path: "my/attendance-note",
      summary: "Attendance notes of one child (studentId required for parent logins)",
      roles: ["student", "parent", "teacher", "staff", "admin"],
      params: [
        { name: "studentId", required: true, example: "15", desc: "Kid id from /my/parent/kids" },
        { name: "month", required: false, example: "2026-08", desc: "YYYY-MM; defaults to current month" },
        { name: "date", required: false, example: "2026-08-20", desc: "Single-day lookup" },
      ],
      response: {
        studentId: 15,
        month: "2026-08",
        notes: [{ id: 3, studentId: 15, date: "2026-08-20", note: "Came late due to medical appointment", createdBy: 9 }],
      },
    },
    {
      method: "PUT",
      path: "my/attendance-note",
      summary: "Add/update an attendance note for one child (empty note deletes it)",
      roles: ["student", "parent", "teacher", "staff", "admin"],
      body: { studentId: 15, date: "2026-08-20", note: "Came late due to medical appointment" },
      response: { id: 3, studentId: 15, date: "2026-08-20", note: "Came late due to medical appointment" },
    },
    {
      method: "GET",
      path: "my/exams",
      summary: "All exams with publish flags",
      roles: ["student", "parent", "teacher", "staff", "admin"],
      response: {
        exams: [
          { id: 4, name: "Half Yearly", session: "2025-26", group: "Secondary", publishExam: true, publishResult: true },
        ],
      },
    },
    {
      method: "POST",
      path: "my/leave",
      summary: "Apply leave on behalf of a child (pass studentId)",
      roles: ["parent"],
      body: {
        studentId: 15,
        leaveTypeId: 1,
        fromDate: "2026-09-01",
        toDate: "2026-09-02",
        reason: "Family function out of town",
      },
      response: {
        success: true,
        leave: { id: 10, fromDate: "2026-09-01", toDate: "2026-09-02", days: 2, status: "Pending" },
      },
    },
    {
      method: "GET",
      path: "my/leave",
      summary: "Leaves I applied (mine + my children)",
      roles: ["parent"],
      response: {
        leaves: [
          { id: 10, userId: 7, name: "Aarav Sharma", role: "student", leaveType: "Casual Leave", fromDate: "2026-09-01", toDate: "2026-09-02", days: 2, reason: "Family function", status: "Pending", appliedAt: "2026-08-22T06:30:00.000Z" },
        ],
      },
    },
  ],
}

// ----------------------------------------------------------------
// TEACHER / STAFF portal APIs
// ----------------------------------------------------------------

export const teacherSection: RoleSection = {
  id: "teacher",
  label: "Teacher / Staff",
  tagline: "Class-management endpoints for teacher & staff logins (admins may call them too).",
  login: loginSamples.find((l) => l.role === "Teacher")!,
  endpoints: [
    ...commonPortalEndpoints,
    {
      method: "GET",
      path: "my/teacher",
      summary: "My staff profile",
      roles: ["teacher", "staff", "admin"],
      response: {
        id: 4,
        staffId: "EMP-004",
        name: "Mrs. Anjali Deshmukh",
        email: "anjali@yourschool.com",
        phone: "9876555544",
        department: "Science",
        designation: "Senior Teacher",
        status: "Active",
      },
    },
    {
      method: "GET",
      path: "my/teacher/classes",
      summary: "Classes/sections assigned to me + subjects I teach",
      roles: ["teacher", "staff", "admin"],
      response: {
        teacherId: 4,
        name: "Mrs. Anjali Deshmukh",
        classes: [
          { id: 1, classId: 5, className: "Class 10", sectionId: 2, sectionName: "A", teacher: "Mrs. Anjali Deshmukh" },
        ],
        subjects: ["Physics", "Chemistry"],
      },
    },
    {
      method: "GET",
      path: "my/teacher/students",
      summary: "Students of an assigned class/section",
      roles: ["teacher", "staff", "admin"],
      params: [
        { name: "classId", required: true, example: "5" },
        { name: "sectionId", required: true, example: "2" },
      ],
      response: {
        students: [
          { id: 15, admissionNo: "ADM2026-042", rollNo: "12", name: "Aarav Sharma", gender: "Male", dob: "2011-06-14", status: "Active" },
        ],
      },
    },
    {
      method: "GET",
      path: "my/teacher/attendance",
      summary: "Load attendance sheet for a class on a date",
      roles: ["teacher", "staff", "admin"],
      params: [
        { name: "classId", required: true, example: "5" },
        { name: "sectionId", required: true, example: "2" },
        { name: "date", required: false, example: "2026-08-22", desc: "Defaults to today" },
      ],
      response: {
        classId: 5,
        sectionId: 2,
        date: "2026-08-22",
        records: [
          { id: 15, rollNo: "12", name: "Aarav Sharma", attendanceId: null, attendanceTypeId: null, inTime: null, outTime: null, attendanceType: null },
        ],
      },
    },
    {
      method: "POST",
      path: "my/teacher/attendance",
      summary: "Save attendance for multiple students at once",
      roles: ["teacher", "staff", "admin"],
      body: {
        classId: 5,
        sectionId: 2,
        date: "2026-08-22",
        records: [
          { studentId: 15, attendanceTypeId: 1, inTime: "07:55", outTime: "14:10" },
          { studentId: 16, attendanceTypeId: 2 },
        ],
      },
      response: { success: true, date: "2026-08-22", saved: 2 },
    },
    {
      method: "GET",
      path: "my/teacher/homework",
      summary: "Homework of an assigned class/section",
      roles: ["teacher", "staff", "admin"],
      params: [
        { name: "classId", required: true, example: "5" },
        { name: "sectionId", required: true, example: "2" },
      ],
      response: {
        homework: [
          { id: 21, subjectId: 3, subject: "Physics", homeworkDate: "2026-08-18", submissionDate: "2026-08-22", description: "Chapter 4 numericals", document: null, createdAt: "2026-08-18T05:30:00.000Z" },
        ],
      },
    },
    {
      method: "GET",
      path: "my/student/syllabus-status",
      summary: "Syllabus completion status for classes I teach",
      roles: ["student", "parent", "teacher", "staff", "admin"],
      desc: "Teachers/staff see only class/sections they teach (timetable_entries). Omit class_id/section_id to use the first taught class.",
      params: [
        { name: "class_id", required: false, example: "5" },
        { name: "section_id", required: false, example: "2" },
      ],
      response: {
        classId: 5,
        sectionId: 2,
        className: "Class 10",
        sectionName: "A",
        summary: { total: 24, completed: 12, inProgress: 6, notStarted: 6, percentage: 63 },
        subjects: [{ id: 3, name: "Mathematics", total: 6, completed: 4, inProgress: 1, notStarted: 1, percentage: 75 }],
        classes: [{ classId: 5, className: "Class 10", sectionId: 2, sectionName: "A" }],
      },
    },
    {
      method: "GET",
      path: "my/attendance-note",
      summary: "Attendance note(s) of any student in my school",
      roles: ["student", "parent", "teacher", "staff", "admin"],
      params: [
        { name: "studentId", required: true, example: "15" },
        { name: "month", required: false, example: "2026-08", desc: "YYYY-MM; defaults to current month" },
        { name: "date", required: false, example: "2026-08-20", desc: "Single-day lookup" },
      ],
      response: { studentId: 15, month: "2026-08", notes: [{ id: 3, studentId: 15, date: "2026-08-20", note: "Came late due to medical appointment", createdBy: 9 }] },
    },
    {
      method: "PUT",
      path: "my/attendance-note",
      summary: "Add/update an attendance note for a student (empty note deletes it)",
      roles: ["student", "parent", "teacher", "staff", "admin"],
      body: { studentId: 15, date: "2026-08-20", note: "Excused — medical appointment" },
      response: { id: 3, studentId: 15, date: "2026-08-20", note: "Excused — medical appointment" },
    },
    {
      method: "GET",
      path: "my/exams",
      summary: "All exams with publish flags (for marks-entry screens)",
      roles: ["student", "parent", "teacher", "staff", "admin"],
      response: {
        exams: [
          { id: 4, name: "Half Yearly", session: "2025-26", group: "Secondary", publishExam: true, publishResult: true },
        ],
      },
    },
    {
      method: "POST",
      path: "my/leave",
      summary: "Apply for leave (staff applies for self)",
      roles: ["student", "parent", "teacher", "staff"],
      body: {
        leaveTypeId: 2,
        fromDate: "2026-09-10",
        toDate: "2026-09-12",
        reason: "Personal work",
      },
      response: {
        success: true,
        leave: { id: 11, fromDate: "2026-09-10", toDate: "2026-09-12", days: 3, status: "Pending" },
      },
    },
    {
      method: "GET",
      path: "my/leave",
      summary: "My applied leaves with status",
      roles: ["student", "parent", "teacher", "staff", "admin"],
      response: {
        leaves: [
          { id: 11, userId: 9, name: "Mrs. Anjali Deshmukh", role: "teacher", leaveType: "Casual Leave", fromDate: "2026-09-10", toDate: "2026-09-12", days: 3, reason: "Personal work", status: "Pending", appliedAt: "2026-08-22T06:45:00.000Z" },
        ],
      },
    },
    {
      method: "GET",
      path: "my/teacher/timetable",
      summary: "My weekly teaching timetable",
      roles: ["teacher", "staff", "admin"],
      response: {
        teacherId: 4,
        timetable: [
          { id: 101, classId: 5, className: "Class 10", sectionId: 2, sectionName: "A", subject: "Physics", day: "Monday", period: 2, startTime: "08:45", endTime: "09:30" },
        ],
      },
    },
    {
      method: "POST",
      path: "my/teacher/homework/create",
      summary: "Create homework for an assigned class/section",
      roles: ["teacher", "staff", "admin"],
      desc: "Teachers can only create homework for classes assigned via class_teachers (admins bypass the check).",
      body: {
        classId: 5,
        sectionId: 2,
        subjectId: 3,
        homeworkDate: "2026-08-22",
        submissionDate: "2026-08-26",
        description: "Chapter 5 exercise 5.3, Q1-Q8",
        document: null,
      },
      response: {
        success: true,
        homework: { id: 34, classId: 5, sectionId: 2, subjectId: 3, homeworkDate: "2026-08-22", submissionDate: "2026-08-26", description: "Chapter 5 exercise 5.3, Q1-Q8" },
      },
    },
    {
      method: "GET",
      path: "my/teacher/marks",
      summary: "Load marks sheet for an exam subject of an assigned class",
      roles: ["teacher", "staff", "admin"],
      desc: "subjectId is the exam_subjects.id (from the school admin Examinations → Exam Subjects API). Returns every student with any saved marks.",
      params: [
        { name: "examId", required: true, example: "4" },
        { name: "subjectId", required: true, example: "12" },
        { name: "classId", required: true, example: "5" },
        { name: "sectionId", required: true, example: "2" },
      ],
      response: {
        examId: 4,
        subjectId: 12,
        classId: 5,
        sectionId: 2,
        records: [
          { studentId: 15, rollNo: "12", name: "Aarav Sharma", markId: 402, theoryMarks: 78, practicalMarks: 18, absent: false, notes: null },
          { studentId: 16, rollNo: "13", name: "Isha Verma", markId: null, theoryMarks: null, practicalMarks: null, absent: false, notes: null },
        ],
      },
    },
    {
      method: "POST",
      path: "my/teacher/marks",
      summary: "Save/update exam marks for multiple students at once",
      roles: ["teacher", "staff", "admin"],
      desc: "Upserts per (exam, exam-subject, student). Requires class assignment.",
      body: {
        examId: 4,
        subjectId: 12,
        classId: 5,
        sectionId: 2,
        records: [
          { studentId: 15, theoryMarks: 78, practicalMarks: 18, absent: false },
          { studentId: 16, theoryMarks: 65, practicalMarks: 20, absent: false, notes: "Improved" },
          { studentId: 17, absent: true },
        ],
      },
      response: { success: true, saved: 3 },
    },
  ],
}

// ----------------------------------------------------------------
// SCHOOL ADMIN — full CRUD over every module (generic handler)
// ----------------------------------------------------------------

export type CrudModule = {
  label: string
  endpoints: { path: string; table: string; desc: string; params?: string[]; methods?: ("GET" | "POST" | "PUT" | "DELETE")[] }[]
}

export const crudDesc: Record<string, string> = {
  GET: "List all (or get one with ?id=N; ?search= keyword search)",
  POST: "Create new record",
  PUT: "Update existing record (id required in JSON body)",
  DELETE: "Delete by ?id=N query param",
}

export const schoolAdminModules: CrudModule[] = [
  {
    label: "Academics",
    endpoints: [
      { path: "academics/class", table: "classes", desc: "Manage classes (CRUD)" },
      { path: "academics/class-teacher", table: "class_teachers", desc: "Assign class teachers" },
      { path: "academics/promote-student", table: "students", desc: "Promote students to next class", params: ["from_class_id", "from_section_id", "session_id"] },
      { path: "academics/section", table: "sections", desc: "Manage sections" },
      { path: "academics/subject", table: "subjects", desc: "Manage subjects" },
      { path: "academics/subject-group", table: "subject_groups", desc: "Manage subject groups" },
      { path: "academics/timetable", table: "timetables", desc: "Manage timetables" },
    ],
  },
  {
    label: "Alumni",
    endpoints: [
      { path: "alumni", table: "alumni", desc: "Manage alumni records" },
      { path: "alumni/attendance", table: "alumni_attendance", desc: "Alumni attendance" },
      { path: "alumni/event", table: "alumni_events", desc: "Alumni events" },
      { path: "alumni/finance", table: "alumni_finance", desc: "Alumni finance/contributions" },
    ],
  },
  {
    label: "Annual Calendar",
    endpoints: [
      { path: "annual-calendar/event", table: "calendar_events", desc: "Calendar events" },
      { path: "annual-calendar/holiday-type", table: "holiday_types", desc: "Holiday types" },
    ],
  },
  {
    label: "Attendance",
    endpoints: [
      { path: "attendance/leave", table: "leave_applications", desc: "Leave applications", params: ["from_date", "to_date", "status"] },
      { path: "attendance/leave-type", table: "leave_types", desc: "Leave types" },
      { path: "attendance/staff", table: "staff_attendance", desc: "Staff attendance", params: ["date", "staff_id"] },
      { path: "attendance/student", table: "student_attendance", desc: "Student attendance", params: ["date", "class_id", "section_id"] },
      { path: "attendance/type", table: "attendance_types", desc: "Attendance types" },
    ],
  },
  {
    label: "Behaviour",
    endpoints: [
      { path: "behaviour/assign", table: "behaviour_assignments", desc: "Behaviour assignments", params: ["student_id", "incident_id"] },
      { path: "behaviour/incident", table: "behaviour_incidents", desc: "Behaviour incidents", params: ["student_id"] },
    ],
  },
  {
    label: "Branch",
    endpoints: [{ path: "branch", table: "branches", desc: "Manage branches" }],
  },
  {
    label: "CBSE",
    endpoints: [
      { path: "cbse/admit-card", table: "cbse_admit_cards", desc: "Admit cards", params: ["exam_id"] },
      { path: "cbse/assessments", table: "cbse_assessments", desc: "Assessments", params: ["class_id", "section_id", "subject_id", "exam_id"] },
      { path: "cbse/exam", table: "cbse_exams", desc: "CBSE exams", params: ["class_id", "section_id"] },
      { path: "cbse/exam-attendance", table: "cbse_exam_attendance", desc: "Exam attendance", params: ["exam_id", "class_id", "section_id"] },
      { path: "cbse/exam-grades", table: "cbse_exam_grades", desc: "Exam grades", params: ["exam_id", "class_id"] },
      { path: "cbse/exam-marks", table: "cbse_exam_marks", desc: "Exam marks", params: ["exam_id", "class_id", "section_id", "subject_id"] },
      { path: "cbse/exam-students", table: "cbse_exam_students", desc: "Exam students", params: ["exam_id", "class_id", "section_id"] },
      { path: "cbse/exam-subjects", table: "cbse_exam_subjects", desc: "Exam subjects", params: ["exam_id", "class_id"] },
      { path: "cbse/marksheet", table: "cbse_marksheets", desc: "Marksheets", params: ["exam_id", "class_id", "section_id", "student_id"] },
      { path: "cbse/observation", table: "cbse_observations", desc: "Observations", params: ["class_id", "section_id", "subject_id"] },
      { path: "cbse/obs-params", table: "cbse_observation_params", desc: "Observation params", params: ["observation_id"] },
      { path: "cbse/reports", table: "cbse_reports", desc: "CBSE reports", params: ["exam_id", "class_id", "section_id"] },
      { path: "cbse/schedule", table: "cbse_schedules", desc: "Exam schedules", params: ["exam_id", "class_id"] },
      { path: "cbse/settings", table: "cbse_settings", desc: "CBSE settings", params: ["academic_year"] },
      { path: "cbse/template", table: "cbse_templates", desc: "Templates", params: ["type"] },
      { path: "cbse/terms", table: "cbse_terms", desc: "CBSE terms", params: ["academic_year"] },
    ],
  },
  {
    label: "ICSC",
    endpoints: [
      { path: "icsc/admit-card", table: "icsc_admit_cards", desc: "Admit cards", params: ["exam_id"] },
      { path: "icsc/assessments", table: "icsc_assessments", desc: "Assessments", params: ["class_id", "section_id", "subject_id", "exam_id"] },
      { path: "icsc/exam", table: "icsc_exams", desc: "ICSC exams", params: ["class_id", "section_id"] },
      { path: "icsc/exam-attendance", table: "icsc_exam_attendance", desc: "Exam attendance", params: ["exam_id", "class_id", "section_id"] },
      { path: "icsc/exam-grades", table: "icsc_exam_grades", desc: "Exam grades", params: ["exam_id", "class_id"] },
      { path: "icsc/exam-marks", table: "icsc_exam_marks", desc: "Exam marks", params: ["exam_id", "class_id", "section_id", "subject_id"] },
      { path: "icsc/exam-students", table: "icsc_exam_students", desc: "Exam students", params: ["exam_id", "class_id", "section_id"] },
      { path: "icsc/exam-subjects", table: "icsc_exam_subjects", desc: "Exam subjects", params: ["exam_id", "class_id"] },
      { path: "icsc/marksheet", table: "icsc_marksheets", desc: "Marksheets", params: ["exam_id", "class_id", "section_id", "student_id"] },
      { path: "icsc/observation", table: "icsc_observations", desc: "Observations", params: ["class_id", "section_id", "subject_id"] },
      { path: "icsc/obs-params", table: "icsc_observation_params", desc: "Observation params", params: ["observation_id"] },
      { path: "icsc/reports", table: "icsc_reports", desc: "ICSC reports", params: ["exam_id", "class_id", "section_id"] },
      { path: "icsc/schedule", table: "icsc_schedules", desc: "Exam schedules", params: ["exam_id", "class_id"] },
      { path: "icsc/settings", table: "icsc_settings", desc: "ICSC settings", params: ["academic_year"] },
      { path: "icsc/template", table: "icsc_templates", desc: "Templates", params: ["type"] },
      { path: "icsc/terms", table: "icsc_terms", desc: "ICSC terms", params: ["academic_year"] },
      { path: "icsc/custom-marksheet", table: "icsc_custom_marksheets", desc: "ICSC custom marksheet (clone of CBSE custom_marksheet)", params: ["student_id", "session_id"], methods: ["GET", "POST"] },
      { path: "icsc/custom-marksheet-entry", table: "icsc_custom_marksheets", desc: "ICSC custom marksheet entry (clone of CBSE custom_marksheet_entry)", params: ["class_id", "section_id", "session_id"], methods: ["GET", "POST"] },
    ],
  },
  {
    label: "Certificate",
    endpoints: [
      { path: "certificate/staff-id-card", table: "staff_id_cards", desc: "Staff ID cards" },
      { path: "certificate/student", table: "student_certificates", desc: "Student certificates" },
      { path: "certificate/student-id-card", table: "student_id_cards", desc: "Student ID cards" },
      { path: "certificate/template", table: "certificate_templates", desc: "Certificate templates" },
    ],
  },
  {
    label: "Communicate",
    endpoints: [
      { path: "communicate/email", table: "email_messages", desc: "Email messages" },
      { path: "communicate/email-template", table: "email_templates", desc: "Email templates" },
      { path: "communicate/notice", table: "notices", desc: "Notices" },
      { path: "communicate/scheduled", table: "scheduled_messages", desc: "Scheduled messages" },
      { path: "communicate/sms", table: "sms_messages", desc: "SMS messages" },
      { path: "communicate/sms-template", table: "sms_templates", desc: "SMS templates" },
    ],
  },
  {
    label: "Download Center",
    endpoints: [
      { path: "download-center/content", table: "download_center_contents", desc: "Download contents" },
      { path: "download-center/content-type", table: "download_center_content_types", desc: "Content types" },
      { path: "download-center/video", table: "download_center_videos", desc: "Videos" },
    ],
  },
  {
    label: "Examinations",
    endpoints: [
      { path: "examinations/exam", table: "exams", desc: "Exams", params: ["class_id", "section_id", "group_id"] },
      { path: "examinations/group", table: "exam_groups", desc: "Exam groups" },
      { path: "examinations/mark", table: "exam_marks", desc: "Exam marks", params: ["exam_id", "class_id", "section_id", "subject_id"] },
      { path: "examinations/marks-division", table: "marks_divisions", desc: "Marks divisions" },
      { path: "examinations/marks-grade", table: "marks_grades", desc: "Marks grades" },
      { path: "examinations/subject", table: "exam_subjects", desc: "Exam subjects", params: ["exam_id", "class_id"] },
    ],
  },
  {
    label: "Expenses",
    endpoints: [
      { path: "expenses", table: "expenses", desc: "Expenses", params: ["head_id", "date_from", "date_to"] },
      { path: "expenses/head", table: "expense_heads", desc: "Expense heads" },
    ],
  },
  {
    label: "Fees Collection",
    endpoints: [
      { path: "fees/fees-assign", table: "fees_masters", desc: "Bulk-assign fee types to a class/section or specific students (GET lists assignments; POST assigns)", params: ["class_id", "section_id"], methods: ["GET", "POST"] },
      { path: "fees/fees-carry-forward", table: "fees_carry_forward", desc: "Carry forward fees", params: ["student_id", "academic_year"] },
      { path: "fees/fees-discount", table: "fees_discounts", desc: "Fee discounts", params: ["student_id", "fees_type_id"] },
      { path: "fees/fees-group", table: "fees_groups", desc: "Fee groups", params: ["class_id", "section_id"] },
      { path: "fees/fees-master", table: "fees_master", desc: "Fee master", params: ["class_id", "section_id", "group_id"] },
      { path: "fees/fees-payment", table: "fees_payments", desc: "Fee payments", params: ["student_id", "fees_type_id", "date_from", "date_to"] },
      { path: "fees/fees-reminder", table: "fees_reminders", desc: "Fee reminders", params: ["student_id", "fees_type_id"] },
      { path: "fees/fees-type", table: "fees_types", desc: "Fee types", params: ["group_id", "class_id"] },
    ],
  },
  {
    label: "Front CMS",
    endpoints: [
      { path: "front-cms/banner", table: "cms_banners", desc: "CMS banners" },
      { path: "front-cms/event", table: "cms_events", desc: "CMS events" },
      { path: "front-cms/gallery", table: "cms_galleries", desc: "CMS galleries" },
      { path: "front-cms/media", table: "cms_media", desc: "CMS media" },
      { path: "front-cms/menu", table: "cms_menus", desc: "CMS menus" },
      { path: "front-cms/news", table: "cms_news", desc: "CMS news" },
      { path: "front-cms/page", table: "cms_pages", desc: "CMS pages" },
    ],
  },
  {
    label: "Front Office",
    endpoints: [
      { path: "front-office/admission-enquiry", table: "admission_enquiries", desc: "Admission enquiries", params: ["class_id", "source_id", "date_from", "date_to", "status"] },
      { path: "front-office/admission-enquiry/followup", table: "admission_enquiry_followups", desc: "Follow-up entries per enquiry", params: ["enquiry_id"], methods: ["GET", "POST"] },
      { path: "front-office/complain", table: "complaints", desc: "Complaints", params: ["complaint_type_id", "source_id", "date_from", "date_to", "status"] },
      { path: "front-office/complaint-type", table: "complaint_types", desc: "Complaint types" },
      { path: "front-office/enquiry-type", table: "enquiry_types", desc: "Enquiry types" },
      { path: "front-office/phone-call-log", table: "phone_call_logs", desc: "Phone call logs", params: ["call_type", "date_from", "date_to"] },
      { path: "front-office/postal-dispatch", table: "postal_dispatches", desc: "Postal dispatch", params: ["date_from", "date_to"] },
      { path: "front-office/postal-receive", table: "postal_receives", desc: "Postal receive", params: ["date_from", "date_to"] },
      { path: "front-office/purpose-type", table: "purpose_types", desc: "Purpose types" },
      { path: "front-office/reference-type", table: "reference_types", desc: "Reference types" },
      { path: "front-office/source-type", table: "source_types", desc: "Source types" },
      { path: "front-office/visitor-book", table: "visitor_book", desc: "Visitor book", params: ["meeting_with", "date_from", "date_to"] },
    ],
  },
  {
    label: "Homework",
    endpoints: [{ path: "homework", table: "homework", desc: "Homework", params: ["class_id", "section_id", "subject_id"] }],
  },
  {
    label: "Hostel",
    endpoints: [
      { path: "hostel", table: "hostels", desc: "Hostels" },
      { path: "hostel/room", table: "hostel_rooms", desc: "Hostel rooms" },
      { path: "hostel/room-type", table: "hostel_room_types", desc: "Room types" },
    ],
  },
  {
    label: "Human Resource",
    endpoints: [
      { path: "human-resource/department", table: "departments", desc: "Departments" },
      { path: "human-resource/designation", table: "designations", desc: "Designations" },
      { path: "human-resource/disabled-staff", table: "disabled_staff", desc: "Disabled staff" },
      { path: "human-resource/payroll", table: "payroll", desc: "Payroll", params: ["staff_id", "month", "year"] },
      { path: "human-resource/staff", table: "staff", desc: "Staff management" },
      { path: "human-resource/staff-profile", table: "staff", desc: "Staff profile + portal login (email/password)", params: ["staff_id"], methods: ["GET", "POST", "PUT"] },
      { path: "human-resource/teachers-rating", table: "teachers_ratings", desc: "Teacher ratings" },
    ],
  },
  {
    label: "Income",
    endpoints: [
      { path: "income", table: "income", desc: "Income", params: ["head_id", "date_from", "date_to"] },
      { path: "income/head", table: "income_heads", desc: "Income heads" },
    ],
  },
  {
    label: "Lesson Plan",
    endpoints: [
      { path: "lesson-plan/lesson", table: "lesson_plan_lessons", desc: "Lessons" },
      { path: "lesson-plan/plan", table: "lesson_plans", desc: "Plans" },
      { path: "lesson-plan/syllabus-status", table: "syllabus_statuses", desc: "Syllabus status" },
      { path: "lesson-plan/topic", table: "lesson_plan_topics", desc: "Topics" },
    ],
  },
  {
    label: "Library",
    endpoints: [
      { path: "library/book", table: "library_books", desc: "Books", params: ["book_no", "isbn_no", "category_id"] },
      { path: "library/book-requests", table: "book_requests", desc: "Student book requests — GET list (?status=), PUT {id,status:Accepted|Rejected}; accepting auto-issues the book", params: ["status"], methods: ["GET", "PUT"] },
      { path: "library/issue", table: "library_issues", desc: "Book issues", params: ["member_id", "book_id", "issue_date_from", "issue_date_to", "status"] },
      { path: "library/members", table: "library_members", desc: "Library members", params: ["member_type", "member_id"] },
    ],
  },
  {
    label: "Live Class",
    endpoints: [{ path: "live-class", table: "live_classes", desc: "Live classes", params: ["class_id", "section_id", "subject_id", "date"] }],
  },
  {
    label: "Live Meeting",
    endpoints: [{ path: "live-meeting", table: "live_meetings", desc: "Live meetings", params: ["meeting_type", "date_from", "date_to"] }],
  },
  {
    label: "Online Course",
    endpoints: [
      { path: "online-course", table: "online_courses", desc: "Online courses" },
      { path: "online-course/category", table: "online_course_categories", desc: "Course categories" },
      { path: "online-course/certificate-template", table: "online_course_certificate_templates", desc: "Certificate templates" },
      { path: "online-course/course-category", table: "online_course_course_categories", desc: "Course-category mapping" },
      { path: "online-course/enrollment", table: "online_course_enrollments", desc: "Enrollments" },
      { path: "online-course/offline-payment", table: "online_course_offline_payments", desc: "Offline payments" },
      { path: "online-course/payment", table: "online_course_payments", desc: "Payments" },
      { path: "online-course/question", table: "online_course_questions", desc: "Questions" },
      { path: "online-course/question-bank", table: "online_course_question_banks", desc: "Question banks" },
      { path: "online-course/setting", table: "online_course_settings", desc: "Settings" },
    ],
  },
  { label: "Online Exam", endpoints: [{ path: "online-exam", table: "online_exams", desc: "Online exams" }, { path: "online-exam/public-link", table: "exam_public_links", desc: "Public access links for an online exam", params: ["exam_id"], methods: ["GET", "POST"] }] },
  { label: "QR Attendance", endpoints: [{ path: "qr-attendance", table: "qr_attendance", desc: "QR attendance" }] },
  { label: "Question Bank", endpoints: [{ path: "question-bank", table: "question_bank", desc: "Question bank" }] },
  { label: "Reference Lists", endpoints: [{ path: "classes", table: "classes", desc: "Class list (GET)", methods: ["GET"] }, { path: "sections", table: "sections", desc: "Section list by class (GET)", methods: ["GET"] }, { path: "staff", table: "staff", desc: "Staff list (GET)", methods: ["GET"] }, { path: "students", table: "students", desc: "Student list (GET)", methods: ["GET"] }, { path: "subjects", table: "subjects", desc: "Subject list (GET)", methods: ["GET"] }] },
  {
    label: "Student Information",
    endpoints: [
      { path: "student-information/bulk-delete", table: "students", desc: "Bulk delete disabled students (GET template + DELETE ?ids=...)", methods: ["GET", "DELETE"] },
      { path: "student-information/disable-reason", table: "disable_reasons", desc: "Disable reasons" },
      { path: "online-admission", table: "online_admissions", desc: "Online admission applications — GET list, PUT {id,status}; approving creates the student + portal login, DELETE ?id=N", params: ["status"], methods: ["GET", "PUT", "DELETE"] },
      { path: "student-information/online-admission", table: "online_admissions", desc: "Online admissions" },
      { path: "student-information/student", table: "students", desc: "Students", params: ["class_id", "section_id", "house_id", "category_id", "status"] },
      { path: "student-information/student/login", table: "users", desc: "Look up student/parent portal login (username/password)", params: ["student_id"], methods: ["GET"] },
      { path: "student-information/student-category", table: "student_categories", desc: "Student categories" },
      { path: "student-information/student-house", table: "student_houses", desc: "Student houses" },
      { path: "student-information/timeline", table: "student_timeline", desc: "Student timeline entries", params: ["student_id"] },
    ],
  },
  {
    label: "System Setting",
    endpoints: [
      { path: "system-setting", table: "system_settings", desc: "System settings" },
      { path: "system-setting/addon", table: "addons", desc: "Addons" },
      { path: "system-setting/backup", table: "backups", desc: "Backups", methods: ["GET", "POST", "DELETE"] },
      { path: "system-setting/backup/restore", table: "backup_records", desc: "Restore the database from a stored backup (POST only)", methods: ["POST"] },
      { path: "system-setting/currency", table: "currencies", desc: "Currencies" },
      { path: "system-setting/custom-field", table: "custom_fields", desc: "Custom fields" },
      { path: "system-setting/custom-field-value", table: "custom_field_values", desc: "Custom field values", methods: ["GET", "POST"] },
      { path: "system-setting/file-type", table: "file_types", desc: "File types" },
      { path: "system-setting/language", table: "languages", desc: "Languages" },
      { path: "system-setting/module", table: "modules", desc: "Modules" },
      { path: "system-setting/next-id", table: "id_generation_settings", desc: "Next auto-generated ID (e.g. admission number) for the admission form", methods: ["GET"] },
      { path: "system-setting/online-admission", table: "online_admission_settings", desc: "Online admission settings (GET/PUT)", methods: ["GET", "PUT"] },
      { path: "system-setting/parent-users", table: "users", desc: "Parent logins with linked children summary (GET)", methods: ["GET"] },
      { path: "system-setting/payment-gateway", table: "payment_gateways", desc: "Payment gateways" },
      { path: "system-setting/session", table: "sessions", desc: "Sessions (academic years)" },
      { path: "system-setting/session/current", table: "sessions", desc: "Current academic session (GET/POST)", methods: ["GET", "POST"] },
      { path: "system-setting/sidebar-menu", table: "sidebar_menus", desc: "Sidebar menu visibility" },
      { path: "system-setting/student-users", table: "users", desc: "Student logins with linked student record (GET)", methods: ["GET"] },
      { path: "system-setting/system-field", table: "system_fields", desc: "System fields (GET/PUT)", methods: ["GET", "PUT"] },
      { path: "system-setting/system-update", table: "system_updates", desc: "System update records (GET/POST)", methods: ["GET", "POST"] },
      { path: "system-setting/user", table: "users", desc: "Users (create staff/student/parent logins)" },
    ],
  },
  {
    label: "Transport",
    endpoints: [
      { path: "transport/assign-vehicle", table: "route_vehicles", desc: "Assign vehicles to routes" },
      { path: "transport/pickup-point", table: "pickup_points", desc: "Pickup points" },
      { path: "transport/route", table: "routes", desc: "Routes" },
      { path: "transport/route-pickup-point", table: "route_pickup_points", desc: "Route-pickup point mapping" },
      { path: "transport/student-fees", table: "student_transport_fees", desc: "Student transport fees" },
      { path: "transport/vehicle", table: "vehicles", desc: "Vehicles" },
    ],
  },
  {
    label: "Dashboards",
    endpoints: [
      { path: "admin/dashboard", table: "multi-table", desc: "Admin executive dashboard — KPI stats, today's attendance, fee collection/pending, upcoming exams, homework, transport, leaves, notices + computed AI insights (at-risk students, absence alerts, workload, fee projection) + per-class performance & overall exam score", methods: ["GET"] },
      { path: "admin/staff-inventory-dashboard", table: "multi-table", desc: "Staff inventory dashboard metrics", methods: ["GET"] },
      { path: "admin/students-inventory-dashboard", table: "multi-table", desc: "Students inventory dashboard metrics", methods: ["GET"] },
    ],
  },
  {
    label: "Reports",
    endpoints: [
      { path: "reports/class-subjects", table: "timetable_entries", desc: "Class–subject mapping report", params: ["class_id", "section_id"], methods: ["GET"] },
      { path: "reports/staff", table: "staff", desc: "Staff report (filters/search)", methods: ["GET"] },
      { path: "reports/students", table: "students", desc: "Student report (filters/search)", methods: ["GET"] },
    ],
  },
  {
    label: "AI Tools",
    endpoints: [
      { path: "ai/generate-icon", table: "uploaded_files", desc: "Generate colorful icon image via AI (Pollinations) from product/category name and store as WebP", methods: ["POST"] },
      { path: "ai/settings", table: "system_settings", desc: "AI provider settings & API key fields (GET/PUT)", methods: ["GET", "PUT"] },
      { path: "ai/settings/test", table: "system_settings", desc: "Test the AI provider connection (POST)", methods: ["POST"] },
      { path: "ai/generate-questions", table: "question_bank", desc: "Generate exam questions with AI (POST)", methods: ["POST"] },
      { path: "ai/student-insights", table: "students", desc: "AI-generated student performance insights (POST)", params: ["student_id"], methods: ["POST"] },
    ],
  },
  {
    label: "Billing & Subscription",
    endpoints: [
      { path: "billing", table: "subscriptions", desc: "School subscription, plan & invoice status (GET)", methods: ["GET"] },
    ],
  },
  {
    label: "Roles & Permissions",
    endpoints: [
      { path: "roles", table: "roles", desc: "Roles & JSONB permissions (CRUD)" },
    ],
  },
  {
    label: "School Settings",
    endpoints: [
      { path: "school-settings", table: "school_settings", desc: "School-level settings key/value store (GET/PUT)", methods: ["GET", "PUT"] },
    ],
  },
  {
    label: "Staff Inventory",
    endpoints: [
      { path: "staff-inventory/issue", table: "item_issues", desc: "Item issue/return records", params: ["staff_id", "item_id", "status"] },
      { path: "staff-inventory/item", table: "items", desc: "Inventory items", params: ["category_id"] },
      { path: "staff-inventory/item-category", table: "item_categories", desc: "Item categories" },
      { path: "staff-inventory/stock", table: "item_stocks", desc: "Stock entries", params: ["item_id", "store_id"] },
      { path: "staff-inventory/store", table: "item_stores", desc: "Stores/warehouses" },
      { path: "staff-inventory/supplier", table: "item_suppliers", desc: "Suppliers" },
    ],
  },
  {
    label: "Students Inventory",
    endpoints: [
      { path: "students-inventory/book", table: "si_books", desc: "Books (stationery) catalogue" },
      { path: "students-inventory/brand", table: "si_brands", desc: "Brands" },
      { path: "students-inventory/category", table: "si_categories", desc: "Product categories" },
      { path: "students-inventory/coupon", table: "si_coupons", desc: "Coupons/discount codes" },
      { path: "students-inventory/ledger", table: "si_ledger", desc: "Stock ledger" },
      { path: "students-inventory/product", table: "si_products", desc: "Products" },
      { path: "students-inventory/purchase", table: "si_purchases", desc: "Purchase orders" },
      { path: "students-inventory/sale", table: "si_sales", desc: "Sales/pos transactions" },
      { path: "students-inventory/sale/invoice", table: "si_sales", desc: "Public invoice view (shared link — no auth)", methods: ["GET"] },
      { path: "students-inventory/stock", table: "si_stock", desc: "Stock levels", params: ["store_id", "product_id"] },
      { path: "students-inventory/store", table: "si_stores", desc: "Stores" },
      { path: "students-inventory/unit", table: "si_units", desc: "Units of measure" },
      { path: "students-inventory/variation", table: "si_variations", desc: "Product variations" },
      { path: "students-inventory/vendor", table: "si_vendors", desc: "Vendors" },
    ],
  },
  {
    label: "AI Tools",
    endpoints: [
      { path: "ai/generate-icon", table: "uploaded_files", desc: "Generate colorful icon image via AI (Pollinations) from product/category name and store as WebP", methods: ["POST"] },
      { path: "ai/generate-questions", table: "question_bank", desc: "Generate exam questions with AI (POST)", methods: ["POST"] },
      { path: "ai/settings", table: "system_settings", desc: "AI provider settings & API key fields (GET/PUT)", methods: ["GET", "PUT"] },
      { path: "ai/settings/test", table: "system_settings", desc: "Test the AI provider connection (POST)", methods: ["POST"] },
      { path: "ai/student-insights", table: "students", desc: "AI-generated student performance insights (POST)", params: ["student_id"], methods: ["POST"] },
    ],
  },
  {
    label: "Upload & Files",
    endpoints: [
      { path: "upload", table: "uploaded_files", desc: "Upload a file — max 4 MB, stored in Postgres (BYTEA), raster images auto-converted to WebP", methods: ["POST"] },
      { path: "files/{name}", table: "uploaded_files", desc: "Serve an uploaded file by name (GET)", methods: ["GET"] },
    ],
  },
  {
    label: "Public Access (no auth)",
    endpoints: [
      { path: "settings/public", table: "school_settings", desc: "Public school branding/login settings (no session)", params: ["code"], methods: ["GET"] },
      { path: "students/lookup", table: "students", desc: "Public student lookup by admission_no", params: ["admission_no"], methods: ["GET"] },
      { path: "online-admission/public", table: "online_admissions", desc: "Public online admission form (load + submit)", params: ["code"], methods: ["GET", "POST"] },
      { path: "exam-public", table: "exam_public_links", desc: "Public exam door (load exam by token)", params: ["token"], methods: ["GET"] },
      { path: "exam-attempts", table: "exam_attempts", desc: "Public exam attempts — record & retrieve results", params: ["exam_id"], methods: ["GET", "POST"] },
      { path: "exam-questions", table: "online_exam_questions", desc: "Public exam question paper", params: ["exam_id"], methods: ["GET", "POST", "DELETE"] },
    ],
  },
]

export const schoolAdminCrudSamples: Record<string, { body?: unknown; response?: unknown }> = {
  "student-information/student": {
    body: {
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
    response: {
      id: 61,
      admission_no: "ADM2026-101",
      roll_no: "25",
      first_name: "Priya",
      last_name: "Patil",
      class_id: 5,
      section_id: 2,
      status: "Active",
      created_at: "2026-08-22T07:15:00.000Z",
    },
  },
  "system-setting/user": {
    body: {
      username: "anjali.deshmukh",
      name: "Mrs. Anjali Deshmukh",
      email: "anjali@yourschool.com",
      password: "Teacher@123",
      role: "teacher",
      status: "Active",
    },
    response: {
      id: 24,
      username: "anjali.deshmukh",
      name: "Mrs. Anjali Deshmukh",
      email: "anjali@yourschool.com",
      role: "teacher",
      status: "Active",
    },
  },
  "academics/class": {
    body: { name: "Class 11", sections: "A,B,C" },
    response: { id: 8, name: "Class 11" },
  },
  "homework": {
    body: {
      class_id: 5,
      section_id: 2,
      subject_id: 3,
      homework_date: "2026-08-22",
      submission_date: "2026-08-26",
      description: "Chapter 5 exercise 5.3, Q1-Q8",
      document: null,
    },
    response: { id: 33, class_id: 5, section_id: 2, subject_id: 3, description: "Chapter 5 exercise 5.3, Q1-Q8" },
  },
  "fees/fees-payment": {
    body: {
      student_id: 15,
      fees_type_id: 3,
      amount: 5000,
      paid_amount: 5000,
      discount_amount: 0,
      fine_amount: 0,
      payment_mode: "Cash",
      payment_date: "2026-08-22",
      note: "Term 2 fee",
      status: "Success",
    },
    response: { id: 58, student_id: 15, fees_type_id: 3, amount: 5000, payment_mode: "Cash", status: "Success" },
  },
  "attendance/student": {
    body: {
      student_id: 15,
      class_id: 5,
      section_id: 2,
      date: "2026-08-22",
      attendance_type_id: 1,
      in_time: "07:55",
      out_time: "14:10",
    },
    response: { id: 901, student_id: 15, date: "2026-08-22", attendance_type_id: 1 },
  },
  "front-office/admission-enquiry": {
    body: {
      name: "Rohan Mehta",
      phone: "9922334455",
      email: "rohan.m@example.com",
      class_id: 3,
      source_id: 2,
      reference_id: 1,
      enquiry_type_id: 1,
      follow_up_date: "2026-08-30",
      assigned: "Mrs. Anjali",
      note: "Interested in science stream",
      status: "Pending",
      date: "2026-08-22",
    },
    response: { id: 44, name: "Rohan Mehta", phone: "9922334455", class_id: 3, status: "Pending" },
  },
  "students-inventory/product": {
    body: { name: "BOYS HALF PANT BLUE", code: "HP-BLUE", category_id: 1, brand_id: 1, unit_id: 1, purchase_price: 300, selling_price: 350, min_stock: 10, icon: "Package", icon_image: "/api/files/ai-icon-123.webp", description: "School uniform half pant" },
    response: { id: 4, name: "BOYS HALF PANT BLUE", code: "HP-BLUE", category_id: 1, selling_price: 350, icon: "Package", icon_image: "/api/files/ai-icon-123.webp" },
  },
  "students-inventory/category": {
    body: { name: "Uniform", description: "School uniform category", icon: "Shirt", icon_image: "/api/files/cat-icon-456.webp" },
    response: { id: 1, name: "Uniform", icon: "Shirt", icon_image: "/api/files/cat-icon-456.webp" },
  },
  "students-inventory/variation": {
    body: { product_id: 4, component_name: "Boys Half Pant", color: "BLUE", size: "20", price: 350, sku: "BOYS-HALF-PANT-BLUE-20", quantity: 1, variant_type: "Boys Half Pant (BLUE)", variant_value: "20", additional_price: 350 },
    response: { id: 1, product_id: 4, component_name: "Boys Half Pant", color: "BLUE", size: "20", price: 350, sku: "BOYS-HALF-PANT-BLUE-20", quantity: 1 },
  },
  "ai/generate-icon": {
    body: { name: "Boys Half Pant Blue" },
    response: { success: true, url: "/api/files/ai-icon-789.webp", prompt: "flat vector icon of Boys Half Pant Blue, school uniform product icon, colorful, minimal" },
  },
}

// ----------------------------------------------------------------
// SUPER ADMIN — SaaS console APIs (only rendered in /saas panel)
// ----------------------------------------------------------------

export const superAdminLogin: LoginSample = {
  role: "Super Admin",
  email: "superadmin@smart-school.in",
  password: "Super@123",
  schoolCode: null,
  redirect: "/saas",
  note: "Omit schoolCode entirely — super admins are platform operators, not tied to any school.",
}

export const superAdminEndpoints: EndpointDoc[] = [
  {
    method: "GET",
    path: "saas/stats",
    summary: "Platform-wide dashboard counters",
    roles: ["super_admin"],
    response: {
      schools: 14,
      users: 4821,
      students: 38900,
      staff: 2140,
      activeSchools: 13,
      recentSchools: [
        { id: 14, name: "Sunrise Public School", code: "SUNRISEPUBLIC", plan: "Free", status: "Active", created_at: "2026-08-21T09:00:00.000Z" },
      ],
    },
  },
  {
    method: "GET",
    path: "saas/schools",
    summary: "List all tenant schools (with plan details)",
    roles: ["super_admin"],
    params: [{ name: "id", required: false, example: "12", desc: "Get a single school" }],
    response: [
      {
        id: 12,
        code: "SUNRISEPUBLIC",
        name: "Sunrise Public School",
        email: "principal@sunrise-school.in",
        phone: "9876543210",
        plan: "Standard",
        plan_id: 3,
        max_students: 1000,
        currency: "INR",
        timezone: "Asia/Kolkata",
        status: "Active",
        planDetails: { id: 3, code: "STD", name: "Standard", price: 999, billing_period: "monthly", max_students: 1000, max_staff: 60 },
        adminUser: { email: "principal@sunrise-school.in", password: "Admin@123" },
      },
    ],
  },
  {
    method: "POST",
    path: "saas/schools",
    summary: "Onboard a new school (+ its admin login) — super admin only",
    roles: ["super_admin"],
    desc: "Auto-generates a unique school code when omitted and creates the first admin user for the school (default password Admin@123 when not provided).",
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
    response: {
      id: 15,
      code: "SUNRISEPUB",
      name: "Sunrise Public School",
      plan: "Standard",
      adminUser: { email: "principal@sunrise-school.in", password: "StrongPass@1", id: 310 },
    },
  },
  {
    method: "PUT",
    path: "saas/schools",
    summary: "Update a school (plan, limits, status…)",
    roles: ["super_admin"],
    body: { id: 12, plan_id: 4, max_students: 2500, status: "Active" },
    response: { id: 12, plan: "Premium", plan_id: 4, max_students: 2500, status: "Active" },
  },
  {
    method: "DELETE",
    path: "saas/schools?id=12",
    summary: "Delete a school (DEFAULT school is protected)",
    roles: ["super_admin"],
    response: { success: true },
  },
  {
    method: "GET",
    path: "saas/plans",
    summary: "Subscription plans catalogue",
    roles: ["super_admin"],
    response: [
      { id: 1, code: "FREE", name: "Free", price: 0, billing_period: "monthly", max_students: 200, max_staff: 15, status: "Active" },
      { id: 3, code: "STD", name: "Standard", price: 999, billing_period: "monthly", max_students: 1000, max_staff: 60, status: "Active" },
    ],
  },
  {
    method: "POST",
    path: "saas/plans",
    summary: "Create a subscription plan",
    roles: ["super_admin"],
    body: { name: "Enterprise", code: "ENT", price: 4999, billing_period: "yearly", max_students: 10000, max_staff: 800 },
    response: { id: 5, name: "Enterprise", price: 4999 },
  },
  {
    method: "GET",
    path: "saas/invoices",
    summary: "Subscription invoices across schools",
    roles: ["super_admin"],
    response: [
      { id: 88, school_id: 12, number: "INV-2026-0088", amount: 999, status: "paid", due_date: "2026-09-01" },
    ],
  },
  {
    method: "POST",
    path: "saas/invoices/pay",
    summary: "Record/mark a manual invoice payment",
    roles: ["super_admin"],
    body: { invoiceId: 88, mode: "UPI", reference: "UTR123456789" },
    response: { success: true, invoice: { id: 88, status: "paid" } },
  },
  {
    method: "GET",
    path: "saas/invoices/pay/status",
    summary: "Invoice payment status (public checkout page helper)",
    roles: ["super_admin"],
    params: [{ name: "invoice", required: true, example: "88", desc: "Invoice id" }],
    response: {
      id: 88,
      invoiceNo: "INV-2026-0088",
      planName: "Standard",
      amount: 999,
      currency: "INR",
      status: "pending",
      dueDate: "2026-09-01",
      paidAt: null,
      schoolName: "Sunrise Public School",
      razorpayOrderId: null,
      razorpayConfigured: true,
    },
  },
  {
    method: "POST",
    path: "saas/invoices/pay/status",
    summary: "Mark an invoice paid (verifies Razorpay paymentId when configured)",
    roles: ["super_admin"],
    body: { invoice: 88, paymentId: "pay_LIc9k4SgwYg8mNx" },
    response: { success: true },
  },
  {
    method: "GET",
    path: "saas/users",
    summary: "All platform users (optionally filter ?schoolId=N)",
    roles: ["super_admin"],
    params: [{ name: "schoolId", required: false, example: "12" }],
    response: [
      { id: 2, username: "admin", name: "Admin - Smart School", email: "admin@smart-school.in", role: "admin", status: "Active", school_name: "Smart School Demo", school_code: "DEFAULT" },
    ],
  },
  {
    method: "GET",
    path: "saas/payment-settings",
    summary: "Global payment gateway settings for checkout",
    roles: ["super_admin"],
    response: {
      razorpayEnabled: true,
      razorpayKeyId: "rzp_live_xxx",
      upiEnabled: false,
      currency: "INR",
    },
  },
  {
    method: "POST",
    path: "saas/payment-settings",
    summary: "Update global gateway settings",
    roles: ["super_admin"],
    body: { razorpayEnabled: true, razorpayKeyId: "rzp_live_new", razorpayKeySecret: "••••••" },
    response: { success: true },
  },
]
