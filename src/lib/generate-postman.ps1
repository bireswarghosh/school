$baseUrl = "http://localhost:3000"
$collection = @{
  info = @{
    name = "Smart School API"
    description = "Complete API collection for Smart School management system. Set `base_url` variable to your server URL."
    schema = "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  }
  variable = @(
    @{ key = "base_url"; value = $baseUrl; type = "string" }
  )
  item = @()
}

# Helper: generate request item
function New-Request($method, $endpoint, $description, $body, $queryParams) {
  $url = @{
    raw = "{{base_url}}/api/$endpoint"
    host = @("{{base_url}}")
    path = @("api") + ($endpoint -split "/")
  }
  if ($queryParams) {
    $url.query = $queryParams | ForEach-Object {
      @{ key = $_; value = ""; description = "" }
    }
  }
  $item = @{
    name = "$method /api/$endpoint"
    request = @{
      method = $method
      header = @(@{ key = "Content-Type"; value = "application/json" })
      url = $url
      description = $description
    }
  }
  if ($body) {
    $item.request.body = @{
      mode = "raw"
      raw = $body
      options = @{ raw = @{ language = "json" } }
    }
  }
  return $item
}

# Helper: CRUD items for a module+entity
function New-CrudItems($moduleLabel, $endpoint, $tableName, $extraGetParams, $customBody, $customDesc) {
  $items = @()
  $desc = $customDesc
  
  if ($extraGetParams) {
    $qp = @("id") + $extraGetParams
    $items += New-Request "GET" $endpoint "List all $moduleLabel. Query: ?id=N or $($extraGetParams -join '&')" -queryParams $qp
  } else {
    $items += New-Request "GET" $endpoint "List all $moduleLabel. Optional: ?id=N" -queryParams @("id")
  }

  $bodyText = if ($customBody) { $customBody } else { "{\n  `"field1`": `"value`",\n  `"field2`": `"value`"\n}" }
  
  $items += New-Request "POST" $endpoint "Create a new $moduleLabel entry in $tableName table" $bodyText
  $items += New-Request "PUT" $endpoint "Update an existing $moduleLabel (requires `id` in body)" "{\n  `"id`": 1,\n  `"field1`": `"value`"\n}"
  $items += New-Request "DELETE" $endpoint "Delete a $moduleLabel by id" -queryParams @("id")

  return $items
}

# Module: Academics (7)
$academics = @{
  name = "Academics"
  item = @()
}
$academics.item += New-CrudItems "Classes" "academics/class" "classes"
$academics.item += New-CrudItems "Class Teachers" "academics/class-teacher" "class_teachers"
$academics.item += @(
  (New-Request "GET" "academics/promote-student" "List promotions. Query: ?from_class_id=&from_section_id=&session_id=" -queryParams @("from_class_id", "from_section_id", "session_id")),
  (New-Request "POST" "academics/promote-student" "Promote students" "{ `"from_class_id`": 1, `"to_class_id`": 2, `"session_id`": 1, `"student_ids`": [1,2,3] }"),
  (New-Request "PUT" "academics/promote-student" "Update promotion" "{ `"id`": 1, `"status`": `"promoted`" }")
)
$academics.item += New-CrudItems "Sections" "academics/section" "sections"
$academics.item += New-CrudItems "Subjects" "academics/subject" "subjects"
$academics.item += New-CrudItems "Subject Groups" "academics/subject-group" "subject_groups"
$academics.item += New-CrudItems "Timetables" "academics/timetable" "timetables"
$collection.item += $academics

# Module: Alumni (4)
$alumni = @{ name = "Alumni"; item = @() }
$alumni.item += New-CrudItems "Alumni" "alumni" "alumni"
$alumni.item += New-CrudItems "Alumni Attendance" "alumni/attendance" "alumni_attendance"
$alumni.item += New-CrudItems "Alumni Events" "alumni/event" "alumni_events"
$alumni.item += New-CrudItems "Alumni Finance" "alumni/finance" "alumni_finance"
$collection.item += $alumni

# Module: Annual Calendar (2)
$cal = @{ name = "Annual Calendar"; item = @() }
$cal.item += New-CrudItems "Calendar Events" "annual-calendar/event" "calendar_events"
$cal.item += New-CrudItems "Holiday Types" "annual-calendar/holiday-type" "holiday_types"
$collection.item += $cal

# Module: Attendance (5)
$att = @{ name = "Attendance"; item = @() }
$att.item += New-CrudItems "Leave Applications" "attendance/leave" "leave_applications" @("from_date", "to_date", "status") "{ `"staff_id`": 1, `"from_date`": `"2026-01-01`", `"to_date`": `"2026-01-05`", `"reason`": `"Sick leave`", `"status`": `"pending`" }"
$att.item += New-CrudItems "Leave Types" "attendance/leave-type" "leave_types"
$att.item += New-CrudItems "Staff Attendance" "attendance/staff" "staff_attendance" @("date", "staff_id") "{ `"staff_id`": 1, `"date`": `"2026-01-15`", `"status`": `"present`" }"
$att.item += New-CrudItems "Student Attendance" "attendance/student" "student_attendance" @("date", "class_id", "section_id") "{ `"student_id`": 1, `"date`": `"2026-01-15`", `"class_id`": 1, `"section_id`": 1, `"status`": `"present`" }"
$att.item += New-CrudItems "Attendance Types" "attendance/type" "attendance_types"
$collection.item += $att

# Module: Behaviour (2)
$beh = @{ name = "Behaviour"; item = @() }
$beh.item += New-CrudItems "Behaviour Assignments" "behaviour/assign" "behaviour_assignments" @("student_id", "incident_id") "{ `"student_id`": 1, `"incident_id`": 1, `"action_taken`": `"Warning`" }"
$beh.item += New-CrudItems "Behaviour Incidents" "behaviour/incident" "behaviour_incidents" @("student_id") "{ `"student_id`": 1, `"incident_type`": `"Bullying`", `"description`": `"Description`", `"action_taken`": `"Warning`" }"
$collection.item += $beh

# Module: Branch (1)
$br = @{ name = "Branch"; item = @() }
$br.item += New-CrudItems "Branches" "branch" "branches"
$collection.item += $br

# Module: CBSE (16)
$cbse = @{ name = "CBSE"; item = @() }
$cbse.item += New-CrudItems "Admit Cards" "cbse/admit-card" "cbse_admit_cards" @("exam_id") "{ `"exam_id`": 1, `"student_id`": 1, `"template_id`": 1 }"
$cbse.item += New-CrudItems "Assessments" "cbse/assessments" "cbse_assessments" @("class_id", "section_id", "subject_id", "exam_id") "{ `"exam_id`": 1, `"class_id`": 1, `"section_id`": 1, `"subject_id`": 1, `"assessment_type`": `"FA`", `"max_marks`": 20 }"
$cbse.item += New-CrudItems "Exams" "cbse/exam" "cbse_exams" @("class_id", "section_id") "{ `"name`": `"Term 1`", `"class_id`": 1, `"section_id`": 1, `"academic_year`": `"2025-26`" }"
$cbse.item += New-CrudItems "Exam Attendance" "cbse/exam-attendance" "cbse_exam_attendance" @("exam_id", "class_id", "section_id") "{ `"exam_id`": 1, `"student_id`": 1, `"status`": `"present`" }"
$cbse.item += New-CrudItems "Exam Grades" "cbse/exam-grades" "cbse_exam_grades" @("exam_id", "class_id") "{ `"exam_id`": 1, `"grade`": `"A`", `"min_marks`": 90, `"max_marks`": 100 }"
$cbse.item += New-CrudItems "Exam Marks" "cbse/exam-marks" "cbse_exam_marks" @("exam_id", "class_id", "section_id", "subject_id") "{ `"exam_id`": 1, `"student_id`": 1, `"subject_id`": 1, `"marks_obtained`": 85, `"max_marks`": 100 }"
$cbse.item += New-CrudItems "Exam Students" "cbse/exam-students" "cbse_exam_students" @("exam_id", "class_id", "section_id") "{ `"exam_id`": 1, `"student_id`": 1 }"
$cbse.item += New-CrudItems "Exam Subjects" "cbse/exam-subjects" "cbse_exam_subjects" @("exam_id", "class_id") "{ `"exam_id`": 1, `"subject_id`": 1, `"max_marks`": 100, `"passing_marks`": 35 }"
$cbse.item += New-CrudItems "Marksheets" "cbse/marksheet" "cbse_marksheets" @("exam_id", "class_id", "section_id", "student_id") "{ `"exam_id`": 1, `"student_id`": 1, `"template_id`": 1 }"
$cbse.item += New-CrudItems "Observations" "cbse/observation" "cbse_observations" @("class_id", "section_id", "subject_id") "{ `"student_id`": 1, `"subject_id`": 1, `"observation_param_id`": 1, `"score`": 4 }"
$cbse.item += New-CrudItems "Observation Params" "cbse/obs-params" "cbse_observation_params" @("observation_id") "{ `"observation_id`": 1, `"name`": `"Creativity`", `"max_score`": 5 }"
$cbse.item += New-CrudItems "Reports" "cbse/reports" "cbse_reports" @("exam_id", "class_id", "section_id") "{ `"exam_id`": 1, `"student_id`": 1, `"report_type`": `"consolidated`" }"
$cbse.item += New-CrudItems "Schedules" "cbse/schedule" "cbse_schedules" @("exam_id", "class_id") "{ `"exam_id`": 1, `"subject_id`": 1, `"date`": `"2026-03-15`", `"start_time`": `"09:00`", `"end_time`": `"12:00`" }"
$cbse.item += New-CrudItems "Settings" "cbse/settings" "cbse_settings" @("academic_year") "{ `"academic_year`": `"2025-26`", `"max_marks_fa`": 20, `"max_marks_sa`": 80 }"
$cbse.item += New-CrudItems "Templates" "cbse/template" "cbse_templates" @("type") "{ `"name`": `"Report Card v1`", `"type`": `"marksheet`", `"content`": `"HTML template`" }"
$cbse.item += New-CrudItems "Terms" "cbse/terms" "cbse_terms" @("academic_year") "{ `"name`": `"Term 1`", `"academic_year`": `"2025-26`", `"start_date`": `"2026-04-01`", `"end_date`": `"2026-09-30`" }"
$collection.item += $cbse

# Module: Certificate (4)
$cert = @{ name = "Certificate"; item = @() }
$cert.item += New-CrudItems "Staff ID Cards" "certificate/staff-id-card" "staff_id_cards"
$cert.item += New-CrudItems "Student Certificates" "certificate/student" "student_certificates"
$cert.item += New-CrudItems "Student ID Cards" "certificate/student-id-card" "student_id_cards"
$cert.item += New-CrudItems "Certificate Templates" "certificate/template" "certificate_templates"
$collection.item += $cert

# Module: Communicate (6)
$comm = @{ name = "Communicate"; item = @() }
$comm.item += New-CrudItems "Email Messages" "communicate/email" "email_messages" @() "{ `"to`": `"user@example.com`", `"subject`": `"Test`", `"body`": `"Message body`" }"
$comm.item += New-CrudItems "Email Templates" "communicate/email-template" "email_templates"
$comm.item += New-CrudItems "Notices" "communicate/notice" "notices"
$comm.item += New-CrudItems "Scheduled Messages" "communicate/scheduled" "scheduled_messages"
$comm.item += New-CrudItems "SMS Messages" "communicate/sms" "sms_messages"
$comm.item += New-CrudItems "SMS Templates" "communicate/sms-template" "sms_templates"
$collection.item += $comm

# Module: Download Center (3)
$dl = @{ name = "Download Center"; item = @() }
$dl.item += New-CrudItems "Download Contents" "download-center/content" "download_center_contents"
$dl.item += New-CrudItems "Content Types" "download-center/content-type" "download_center_content_types"
$dl.item += New-CrudItems "Videos" "download-center/video" "download_center_videos"
$collection.item += $dl

# Module: Examinations (6)
$exam = @{ name = "Examinations"; item = @() }
$exam.item += New-CrudItems "Exams" "examinations/exam" "exams" @("class_id", "section_id", "group_id") "{ `"name`": `"Mid Term`", `"class_id`": 1, `"section_id`": 1 }"
$exam.item += New-CrudItems "Exam Groups" "examinations/group" "exam_groups"
$exam.item += New-CrudItems "Exam Marks" "examinations/mark" "exam_marks" @("exam_id", "class_id", "section_id", "subject_id") "{ `"exam_id`": 1, `"student_id`": 1, `"subject_id`": 1, `"marks`": 85 }"
$exam.item += New-CrudItems "Marks Divisions" "examinations/marks-division" "marks_divisions"
$exam.item += New-CrudItems "Marks Grades" "examinations/marks-grade" "marks_grades"
$exam.item += New-CrudItems "Exam Subjects" "examinations/subject" "exam_subjects" @("exam_id", "class_id") "{ `"exam_id`": 1, `"subject_id`": 1 }"
$collection.item += $exam

# Module: Expenses (2)
$exp = @{ name = "Expenses"; item = @() }
$exp.item += New-CrudItems "Expenses" "expenses" "expenses" @("head_id", "date_from", "date_to") "{ `"head_id`": 1, `"amount`": 500, `"date`": `"2026-01-15`", `"description`": `"Office supplies`" }"
$exp.item += New-CrudItems "Expense Heads" "expenses/head" "expense_heads"
$collection.item += $exp

# Module: Fees (7)
$fees = @{ name = "Fees Collection"; item = @() }
$fees.item += New-CrudItems "Fees Carry Forward" "fees/fees-carry-forward" "fees_carry_forward" @("student_id", "academic_year") "{ `"student_id`": 1, `"from_academic_year`": `"2024-25`", `"to_academic_year`": `"2025-26`", `"amount`": 5000 }"
$fees.item += New-CrudItems "Fees Discount" "fees/fees-discount" "fees_discounts" @("student_id", "fees_type_id") "{ `"student_id`": 1, `"fees_type_id`": 1, `"discount_percent`": 10 }"
$fees.item += New-CrudItems "Fees Group" "fees/fees-group" "fees_groups" @("class_id", "section_id") "{ `"name`": `"Tuition Fee`", `"class_id`": 1, `"section_id`": 1 }"
$fees.item += New-CrudItems "Fees Master" "fees/fees-master" "fees_master" @("class_id", "section_id", "group_id") "{ `"fees_group_id`": 1, `"fees_type_id`": 1, `"amount`": 2000, `"class_id`": 1 }"
$fees.item += New-CrudItems "Fees Payment" "fees/fees-payment" "fees_payments" @("student_id", "fees_type_id", "date_from", "date_to") "{ `"student_id`": 1, `"fees_type_id`": 1, `"amount`": 2000, `"payment_date`": `"2026-01-15`", `"payment_mode`": `"cash`" }"
$fees.item += New-CrudItems "Fees Reminder" "fees/fees-reminder" "fees_reminders" @("student_id", "fees_type_id") "{ `"student_id`": 1, `"fees_type_id`": 1, `"reminder_date`": `"2026-02-01`", `"message`": `"Fee due`" }"
$fees.item += New-CrudItems "Fees Type" "fees/fees-type" "fees_types" @("group_id", "class_id") "{ `"name`": `"Tuition`", `"code`": `"TUI`" }"
$collection.item += $fees

# Module: Front CMS (7)
$fcms = @{ name = "Front CMS"; item = @() }
$fcms.item += New-CrudItems "Banners" "front-cms/banner" "cms_banners"
$fcms.item += New-CrudItems "CMS Events" "front-cms/event" "cms_events"
$fcms.item += New-CrudItems "Galleries" "front-cms/gallery" "cms_galleries"
$fcms.item += New-CrudItems "Media" "front-cms/media" "cms_media"
$fcms.item += New-CrudItems "CMS Menus" "front-cms/menu" "cms_menus"
$fcms.item += New-CrudItems "CMS News" "front-cms/news" "cms_news"
$fcms.item += New-CrudItems "CMS Pages" "front-cms/page" "cms_pages"
$collection.item += $fcms

# Module: Front Office (11)
$fo = @{ name = "Front Office"; item = @() }
$fo.item += New-CrudItems "Admission Enquiries" "front-office/admission-enquiry" "admission_enquiries" @("class_id", "source_id", "date_from", "date_to", "status") "{ `"name`": `"John`", `"phone`": `"1234567890`", `"class_id`": 1, `"source_id`": 1, `"follow_up_date`": `"2026-02-01`" }"
$fo.item += New-CrudItems "Complaints" "front-office/complain" "complaints" @("complaint_type_id", "source_id", "date_from", "date_to", "status") "{ `"name`": `"John`", `"complaint_type_id`": 1, `"source_id`": 1, `"description`": `"Issue details`" }"
$fo.item += New-CrudItems "Complaint Types" "front-office/complaint-type" "complaint_types"
$fo.item += New-CrudItems "Enquiry Types" "front-office/enquiry-type" "enquiry_types"
$fo.item += New-CrudItems "Phone Call Logs" "front-office/phone-call-log" "phone_call_logs" @("call_type", "date_from", "date_to") "{ `"name`": `"John`", `"phone`": `"1234567890`", `"call_type`": `"incoming`", `"call_duration`": `"5 min`", `"follow_up_date`": `"2026-02-01`" }"
$fo.item += New-CrudItems "Postal Dispatches" "front-office/postal-dispatch" "postal_dispatches" @("date_from", "date_to") "{ `"reference_no`": `"REF001`", `"to_title`": `"Principal`", `"document_type`": `"Letter`", `"date`": `"2026-01-15`" }"
$fo.item += New-CrudItems "Postal Receives" "front-office/postal-receive" "postal_receives" @("date_from", "date_to") "{ `"reference_no`": `"REF001`", `"from_title`": `"Board`", `"document_type`": `"Circular`", `"date`": `"2026-01-15`" }"
$fo.item += New-CrudItems "Purpose Types" "front-office/purpose-type" "purpose_types"
$fo.item += New-CrudItems "Reference Types" "front-office/reference-type" "reference_types"
$fo.item += New-CrudItems "Source Types" "front-office/source-type" "source_types"
$fo.item += New-CrudItems "Visitor Book" "front-office/visitor-book" "visitor_book" @("meeting_with", "date_from", "date_to") "{ `"name`": `"Visitor`", `"phone`": `"1234567890`", `"meeting_with`": `"student`", `"purpose`": `"Meeting`", `"person_count`": 2 }"
$collection.item += $fo

# Module: Homework (1)
$hw = @{ name = "Homework"; item = @() }
$hw.item += New-CrudItems "Homework" "homework" "homework" @("class_id", "section_id", "subject_id") "{ `"class_id`": 1, `"section_id`": 1, `"subject_id`": 1, `"title`": `"Math HW`", `"description`": `"Solve problems 1-10`", `"due_date`": `"2026-02-01`" }"
$collection.item += $hw

# Module: Hostel (3)
$hostel = @{ name = "Hostel"; item = @() }
$hostel.item += New-CrudItems "Hostels" "hostel" "hostels"
$hostel.item += New-CrudItems "Hostel Rooms" "hostel/room" "hostel_rooms"
$hostel.item += New-CrudItems "Room Types" "hostel/room-type" "hostel_room_types"
$collection.item += $hostel

# Module: Human Resource (6)
$hr = @{ name = "Human Resource"; item = @() }
$hr.item += New-CrudItems "Departments" "human-resource/department" "departments"
$hr.item += New-CrudItems "Designations" "human-resource/designation" "designations"
$hr.item += New-CrudItems "Disabled Staff" "human-resource/disabled-staff" "disabled_staff"
$hr.item += New-CrudItems "Payroll" "human-resource/payroll" "payroll" @("staff_id", "month", "year") "{ `"staff_id`": 1, `"month`": `"January`", `"year`": 2026, `"basic_salary`": 50000, `"allowances`": 10000 }"
$hr.item += New-CrudItems "Staff" "human-resource/staff" "staff"
$hr.item += New-CrudItems "Teachers Rating" "human-resource/teachers-rating" "teachers_ratings"
$collection.item += $hr

# Module: Income (2)
$inc = @{ name = "Income"; item = @() }
$inc.item += New-CrudItems "Income" "income" "income" @("head_id", "date_from", "date_to") "{ `"head_id`": 1, `"amount`": 10000, `"date`": `"2026-01-15`", `"description`": `"Donation`" }"
$inc.item += New-CrudItems "Income Heads" "income/head" "income_heads"
$collection.item += $inc

# Module: Inventory (16)
$inv = @{ name = "Inventory"; item = @() }
$inv.item += New-CrudItems "Adjustments" "inventory/adjustment" "inventory_adjustments" @("item_id", "store_id") "{ `"item_id`": 1, `"store_id`": 1, `"quantity`": 10, `"adjustment_type`": `"add`", `"reason`": `"Found in stock`" }"
$inv.item += New-CrudItems "Billing" "inventory/billing" "inventory_bills" @("supplier_id", "date_from", "date_to") "{ `"supplier_id`": 1, `"bill_no`": `"BILL001`", `"total_amount`": 5000, `"date`": `"2026-01-15`" }"
$inv.item += New-CrudItems "Brands" "inventory/brand" "inventory_brands"
$inv.item += New-CrudItems "Categories" "inventory/category" "inventory_categories"
$inv.item += New-CrudItems "Discounts" "inventory/discount" "inventory_discounts" @("item_id", "category_id") "{ `"item_id`": 1, `"category_id`": 1, `"discount_percent`": 10 }"
$inv.item += New-CrudItems "Issues" "inventory/issue" "inventory_issues" @("item_id", "staff_id", "date_from", "date_to") "{ `"item_id`": 1, `"staff_id`": 1, `"quantity`": 5, `"issue_date`": `"2026-01-15`" }"
$inv.item += New-CrudItems "Items" "inventory/item" "inventory_items" @("category_id", "sub_category_id", "brand_id", "store_id") "{ `"name`": `"Notebook`", `"category_id`": 1, `"unit_id`": 1, `"rate`": 50 }"
$inv.item += New-CrudItems "Purchase Orders" "inventory/purchase-order" "purchase_orders" @("supplier_id", "date_from", "date_to", "status") "{ `"supplier_id`": 1, `"order_date`": `"2026-01-15`", `"total_amount`": 5000, `"status`": `"pending`" }"
$inv.item += New-CrudItems "Reports" "inventory/report" "inventory_reports" @("item_id", "category_id", "store_id", "date_from", "date_to") "{ `"item_id`": 1, `"report_type`": `"stock`" }"
$inv.item += New-CrudItems "Stock" "inventory/stock" "inventory_stock" @("item_id", "store_id") "{ `"item_id`": 1, `"store_id`": 1, `"quantity`": 100 }"
$inv.item += New-CrudItems "Stores" "inventory/store" "inventory_stores"
$inv.item += New-CrudItems "Sub Categories" "inventory/sub-category" "inventory_sub_categories"
$inv.item += New-CrudItems "Suppliers" "inventory/supplier" "inventory_suppliers"
$inv.item += New-CrudItems "Transfers" "inventory/transfer" "inventory_transfers" @("from_store_id", "to_store_id", "date_from", "date_to") "{ `"item_id`": 1, `"from_store_id`": 1, `"to_store_id`": 2, `"quantity`": 10 }"
$inv.item += New-CrudItems "Units" "inventory/unit" "inventory_units"
$inv.item += New-CrudItems "Variants" "inventory/variant" "inventory_variants"
$collection.item += $inv

# Module: Lesson Plan (4)
$lp = @{ name = "Lesson Plan"; item = @() }
$lp.item += New-CrudItems "Lessons" "lesson-plan/lesson" "lesson_plan_lessons"
$lp.item += New-CrudItems "Plans" "lesson-plan/plan" "lesson_plans"
$lp.item += New-CrudItems "Syllabus Status" "lesson-plan/syllabus-status" "syllabus_statuses"
$lp.item += New-CrudItems "Topics" "lesson-plan/topic" "lesson_plan_topics"
$collection.item += $lp

# Module: Library (3)
$lib = @{ name = "Library"; item = @() }
$lib.item += New-CrudItems "Books" "library/book" "library_books" @("book_no", "isbn_no", "category_id") "{ `"book_title`": `"Math 101`", `"book_no`": `"BK001`", `"isbn_no`": `"978-3-16-148410-0`", `"category_id`": 1 }"
$lib.item += New-CrudItems "Issues" "library/issue" "library_issues" @("member_id", "book_id", "issue_date_from", "issue_date_to", "status") "{ `"book_id`": 1, `"member_id`": 1, `"issue_date`": `"2026-01-15`", `"due_date`": `"2026-02-15`" }"
$lib.item += New-CrudItems "Members" "library/members" "library_members" @("member_type", "member_id") "{ `"name`": `"John`", `"member_type`": `"student`", `"member_id`": 1 }"
$collection.item += $lib

# Module: Live Class (1)
$lc = @{ name = "Live Class"; item = @() }
$lc.item += New-CrudItems "Live Classes" "live-class" "live_classes" @("class_id", "section_id", "subject_id", "date") "{ `"title`": `"Algebra`", `"class_id`": 1, `"section_id`": 1, `"subject_id`": 1, `"date`": `"2026-01-15`", `"start_time`": `"09:00`", `"end_time`": `"10:00`", `"meeting_link`": `"https://meet.google.com/abc`" }"
$collection.item += $lc

# Module: Live Meeting (1)
$lm = @{ name = "Live Meeting"; item = @() }
$lm.item += New-CrudItems "Live Meetings" "live-meeting" "live_meetings" @("meeting_type", "date_from", "date_to") "{ `"title`": `"Staff Meeting`", `"meeting_type`": `"general`", `"date`": `"2026-01-15`", `"start_time`": `"10:00`", `"end_time`": `"11:00`", `"meeting_link`": `"https://meet.google.com/xyz`" }"
$collection.item += $lm

# Module: Online Course (10)
$oc = @{ name = "Online Course"; item = @() }
$oc.item += New-CrudItems "Online Courses" "online-course" "online_courses"
$oc.item += New-CrudItems "Course Categories" "online-course/category" "online_course_categories"
$oc.item += New-CrudItems "Certificate Templates" "online-course/certificate-template" "online_course_certificate_templates"
$oc.item += New-CrudItems "Course-Category Mapping" "online-course/course-category" "online_course_course_categories"
$oc.item += New-CrudItems "Enrollments" "online-course/enrollment" "online_course_enrollments"
$oc.item += New-CrudItems "Offline Payments" "online-course/offline-payment" "online_course_offline_payments"
$oc.item += New-CrudItems "Payments" "online-course/payment" "online_course_payments"
$oc.item += New-CrudItems "Questions" "online-course/question" "online_course_questions"
$oc.item += New-CrudItems "Question Banks" "online-course/question-bank" "online_course_question_banks"
$oc.item += New-CrudItems "Settings" "online-course/setting" "online_course_settings"
$collection.item += $oc

# Module: Online Exam (1)
$oe = @{ name = "Online Exam"; item = @() }
$oe.item += New-CrudItems "Online Exams" "online-exam" "online_exams"
$collection.item += $oe

# Module: QR Attendance (1)
$qr = @{ name = "QR Attendance"; item = @() }
$qr.item += New-CrudItems "QR Attendance" "qr-attendance" "qr_attendance"
$collection.item += $qr

# Module: Question Bank (1)
$qb = @{ name = "Question Bank"; item = @() }
$qb.item += New-CrudItems "Question Bank" "question-bank" "question_bank"
$collection.item += $qb

# Module: Staff (1)
$st = @{ name = "Staff"; item = @() }
$st.item += New-CrudItems "Staff" "staff" "staff"
$collection.item += $st

# Module: Student Information (6)
$si = @{ name = "Student Information"; item = @() }
$si.item += @(
  (New-Request "POST" "student-information/bulk-delete" "Bulk delete students" "{ `"student_ids`": [1, 2, 3] }")
)
$si.item += New-CrudItems "Disable Reasons" "student-information/disable-reason" "disable_reasons"
$si.item += New-CrudItems "Online Admissions" "student-information/online-admission" "online_admissions"
$si.item += New-CrudItems "Students" "student-information/student" "students" @("class_id", "section_id", "house_id", "category_id", "status") "{ `"first_name`": `"John`", `"last_name`": `"Doe`", `"class_id`": 1, `"section_id`": 1, `"admission_no`": `"ADM001`" }"
$si.item += New-CrudItems "Student Categories" "student-information/student-category" "student_categories"
$si.item += New-CrudItems "Student Houses" "student-information/student-house" "student_houses"
$collection.item += $si

# Module: Students (1)
$sts = @{ name = "Students"; item = @() }
$sts.item += New-CrudItems "Students (simple)" "students" "students"
$collection.item += $sts

# Module: System Setting (13)
$ss = @{ name = "System Setting"; item = @() }
$ss.item += New-CrudItems "System Settings" "system-setting" "system_settings"
$ss.item += New-CrudItems "Addons" "system-setting/addon" "addons"
$ss.item += New-CrudItems "Backups" "system-setting/backup" "backups"
$ss.item += New-CrudItems "Currencies" "system-setting/currency" "currencies"
$ss.item += New-CrudItems "Custom Fields" "system-setting/custom-field" "custom_fields"
$ss.item += New-CrudItems "Custom Field Values" "system-setting/custom-field-value" "custom_field_values"
$ss.item += New-CrudItems "File Types" "system-setting/file-type" "file_types"
$ss.item += New-CrudItems "Languages" "system-setting/language" "languages"
$ss.item += New-CrudItems "Modules" "system-setting/module" "modules"
$ss.item += New-CrudItems "Payment Gateways" "system-setting/payment-gateway" "payment_gateways"
$ss.item += New-CrudItems "Sessions" "system-setting/session" "sessions"
$ss.item += New-CrudItems "Sidebar Menus" "system-setting/sidebar-menu" "sidebar_menus"
$ss.item += New-CrudItems "Users" "system-setting/user" "users"
$collection.item += $ss

# Module: Transport (6)
$tr = @{ name = "Transport"; item = @() }
$tr.item += New-CrudItems "Assign Vehicles" "transport/assign-vehicle" "route_vehicles"
$tr.item += New-CrudItems "Pickup Points" "transport/pickup-point" "pickup_points"
$tr.item += New-CrudItems "Routes" "transport/route" "routes"
$tr.item += New-CrudItems "Route Pickup Points" "transport/route-pickup-point" "route_pickup_points"
$tr.item += New-CrudItems "Student Transport Fees" "transport/student-fees" "student_transport_fees"
$tr.item += New-CrudItems "Vehicles" "transport/vehicle" "vehicles"
$collection.item += $tr

$json = $collection | ConvertTo-Json -Depth 10
$json | Out-File -FilePath "C:\Users\appst\OneDrive\Desktop\smart-school\smart-school.postman_collection.json" -Encoding UTF8
Write-Host "Postman collection generated successfully!"
Write-Host "File: smart-school.postman_collection.json"
