# Work Notes

## September 7, 2026 — Portal Attendance Calendar + Personal Notes

### Problem reported
`http://localhost:3001/portal/attendance` did not show the attendance calendar with personal notes — it only rendered a plain table.

### What was done
- Rewrote `src/app/portal/attendance/page.tsx` to show a full **month-view calendar** with personal notes for **student** and **parent** roles:
  - Color-coded day cells by attendance status (Present/Late/Absent/Half Day).
  - Pencil icon (`NotebookPen`) on each day → opens a modal to add/edit/remove a personal note.
  - Notes loaded via `GET /api/my/attendance-note?month=YYYY-MM`; saved via `PUT /api/my/attendance-note`.
  - Month navigation (prev/next/Today), summary chips, attendance percentage, low-attendance warning banner (uses `attendance.lowAttendanceLimit`).
- Kept the existing **teacher marking table** for teacher/staff/admin roles (class/section/date selectors + status dropdowns + Save via `POST /api/my/teacher/attendance`).
- Notes are stored in `student_attendance_notes` table (`student_id`, `date`, `note`), tenant-scoped via `school_id` — no schema change needed; table already applied by `scripts/apply-007-attendance-notes.cjs`.

### Verification
- `npm run build` passes (TypeScript clean).

### Notes / next steps
- The full standalone calendar page also exists at `/user/attendance` (page at `src/app/user/attendance/page.tsx`).
- Candidate follow-ups if desired:
  - Show personal notes for teacher role too (per selected student) on the portal page.
  - Student/parent API responses (`/api/my/student/attendance`, `/api/my/parent/kids/attendance`) only return `attendanceType` (name), not `attendanceTypeId` — calendar maps by name, so this is fine as-is.
  - Confirm visually on a real browser before closing.