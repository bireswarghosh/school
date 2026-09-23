// Tables that are scoped per-school via a school_id column.
// The generic api-handler + db.ts helpers automatically add
// `school_id = ?` filtering for these tables.
export const TENANT_TABLES = new Set<string>([
  "classes", "sections", "subjects", "subject_types", "subject_groups", "departments", "designations", "staff", "students",
  "sessions", "student_categories", "student_houses", "disable_reasons", "student_promotions", "online_admissions", "online_admission_registrations",
  "alumni", "alumni_events", "alumni_attendance", "alumni_finance", "class_teachers", "timetable_entries", "lessons",
  "topics", "lesson_plans", "syllabus_statuses", "content_types", "content_items", "video_tutorials", "homework",
  "attendance_types", "student_attendance", "student_attendance_notes", "staff_attendance", "leave_types", "leave_requests", "qr_attendance",
  "exam_groups", "exams", "exam_subjects", "exam_marks", "marks_divisions", "marks_grades", "online_exams", "questions",
  "question_bank", "exam_attempts", "exam_answers", "exam_public_links", "online_exam_questions",
  "cbse_exams", "cbse_exam_subjects", "cbse_exam_students", "cbse_exam_marks", "cbse_terms", "cbse_assessments",
  "cbse_obs_params", "cbse_exam_grades", "cbse_student_attendance", "cbse_exam_schedules", "cbse_admit_cards",
  "cbse_templates", "cbse_settings", "cbse_observations",
  "icse_exams", "icse_exam_subjects", "icse_exam_students", "icse_exam_marks", "icse_terms", "icse_assessments",
  "icse_observation_params", "icse_exam_grades", "icse_exam_attendance", "icse_schedules", "icse_admit_cards",
  "icse_templates", "icse_settings", "icse_observations", "icse_reports", "icse_custom_marksheets", "books", "book_issues", "library_members",
  "pickup_points", "routes", "vehicles", "route_vehicles", "route_pickup_points", "student_transport_fees",
  "hostels", "room_types", "hostel_rooms", "item_categories", "items", "item_suppliers", "item_stores", "item_stocks",
  "item_issues", "item_sub_categories", "brands", "units", "product_variants", "purchase_orders", "purchase_order_items",
  "discounts", "inventory_adjustments", "stock_transfers", "fees_masters", "fees_groups", "fees_types", "fees_discounts",
  "fees_payments", "fees_carry_forward", "fees_reminders", "offline_payments", "income_heads", "incomes", "expense_heads",
  "fee_payment_log",
  "expenses", "payroll", "teachers_ratings", "disabled_staff", "staff_id_cards", "certificate_templates", "certificates",
  "student_id_cards", "front_events", "gallery_items", "news_items", "media_items", "cms_pages", "cms_menus", "banners",
  "notices", "email_templates", "sms_templates", "scheduled_logs", "events", "holiday_types", "course_categories", "courses",
  "course_enrollments", "course_payments", "course_settings", "course_questions", "course_certificate_templates",
  "live_classes", "live_class_sections", "live_meetings", "live_meeting_invitees", "custom_fields", "custom_field_values",
  "incidents", "incident_assignments", "student_timeline", "admission_enquiries", "visitor_book", "phone_call_logs", "postal_dispatches",
  "postal_receives", "complaints", "enquiry_types", "purpose_types", "complaint_types", "source_types", "reference_types",
  "admission_enquiry_followups",
  "subject_group_sections", "subject_group_subjects",
  "user_logs", "sidebar_menus", "system_fields", "system_updates", "backup_records", "online_admission_settings",
  "si_categories", "si_brands", "si_units", "si_stores", "si_vendors", "si_products", "si_books",
  "si_variations", "si_purchases", "si_stock", "si_sales", "si_ledger", "si_coupons",
  "si_vp_products", "si_vp_groups", "si_vp_components", "si_vp_variants", "si_vp_prices", "si_vp_price_history",
  "school_settings",
  "uploaded_files",
  "result_card_templates", "result_card_records",
  "student_cvs",
])

export function isTenantTable(table: string): boolean {
  return TENANT_TABLES.has(table)
}