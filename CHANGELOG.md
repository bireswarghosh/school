# Changelog

All notable changes to this project are documented here. Deploys to Vercel happen automatically on pushes to `main`.

Format based on [Keep a Changelog](https://keepachangelog.com/) — each entry maps to a GitHub commit/PR.

## [Unreleased]

### Added
- **Mobile (Flutter) API support**: `POST /api/auth/login` now returns the session as a `token` field in the JSON body (in addition to the web httpOnly cookie); the middleware (`src/proxy.ts`) and `/api/auth/me` accept `Authorization: Bearer <token>` — every one of the 239 existing API routes is now usable from a Flutter/React Native app with no cookie jar.
- **Razorpay online fee payment (student & parent)**: new `POST /api/my/fees/pay/order` (validates the active fee master, computes pending balance, creates a Razorpay Order + a `Pending` `fees_payments` row, idempotent per fee type; falls back to instant offline recording when the gateway is not configured) and `POST /api/my/fees/pay/verify` (verifies the Razorpay payment via the gateway, marks the row `Paid` with `payment_method='razorpay'` + `transaction_id`, returns the fresh fee ledger). Shared logic lives in `src/lib/fee-pay.ts`.
- Student Fee portal (`/portal/fees`): Pay button now opens the Razorpay Checkout sheet when keys are configured (order → checkout.js → verify), keeping the offline instant-record as fallback.
- REST API docs (`/admin/multi-branch/rest-api`): Student/Parent tabs document the new Razorpay fee-pay flow; the auth guide now covers Bearer-token mobile login (Flutter sample + cURL). Postman collections regenerated with the new endpoints.

### Fixed
- `src/proxy.ts` public whitelist: `/api/online-exam/public-link` was reachable only by prefix overmatch of the non-existent `/api/online-exam/public`; the real route is now explicitly public.
- `GET /api/my/student/homework?subjectId=` was silently ignored — the subject filter now actually filters.

### Changed
- Student Sales (POS) (`/admin/students-inventory/student-sales`): Recent Sales now has an **Actions** column — **Print** (hidden-iframe invoice), **Download PDF** (opens the public shareable invoice page), **Edit** (line-item modal: qty, unit price, discount, sale date, payment status with live totals), and **Delete** (confirm dialog).
- Student Sales (POS): WhatsApp share from the order-placed popup now also sends the **"View PDF receipt" link** — a new public (no-login) invoice page at `/api/students-inventory/sale/invoice?no=SL-...` rendered server-side from the sale rows (school header, itemised table, totals, status) with a Print / Save-as-PDF button.
- Student Sales (POS): student search now matches by name, roll no, admission no or class (partial match, fuzzy) against `/api/students?q=...` with live debounced results — click a row to select; no more exact admission-no lookup.
- Student Sales (POS): order-placed popup after checkout shows full order summary (school header, sale no, date, status, student, items with qty/rate/amount, totals) with buttons to **WhatsApp** (pre-fills student phone if available), **Download PDF** (Save as PDF via print dialog), and **Print** (clean standalone receipt via hidden iframe).
- Student Details (`/admin/student-information/student-details/[id]`): Download PDF and Print buttons in the page header. They render a clean standalone profile report (school header, photo, personal/contact/parent/guardian/address/bank details, note) via a hidden print iframe — Download lets you choose "Save as PDF" in the print dialog.
- Sales List (`/admin/students-inventory/sales-list`): invoice viewer with Print and Download PDF. Clicking the new invoice icon opens a modal showing school header, sale items (grouped by sale no), totals, and status; Print/Download render a clean standalone invoice via a hidden print iframe (Download lets you choose "Save as PDF" in the print dialog).
- Currency now defaults to the Indian Rupee symbol **₹** across the admin panel (Country of `useCurrency` fallback was `$`). All admin money amounts render ₹ from first paint; actual symbol still follows the system currency setting (INR is the seeded default).
- Working copy cleanup of `package-lock.json` (dependency lock refresh).

## [0.1.0] — 2026-08-26

### Added
- Initial Next.js 16 (Turbopack) app scaffold with PostgreSQL 18.4 (`pg` Pool) backend.
- Generic API route handler pattern (`lib/db.ts`, `lib/api-handler.ts`) with camelCase↔snake_case field mapping (`lib/field-mapping.ts`).
- SaaS multi-tenancy: shared DB with `school_id` row-level scoping, auto-scoped `db.query()`, `x-school-id` header injected via `src/proxy.ts`.
- Auth & roles: login endpoint, HMAC-signed session cookie, scrypt password hashes, seeded roles (super_admin, admin, teacher, staff, student, parent).
- Super admin portal at `/saas`, school dashboards at `/admin`.
- Front-office pages: Setup (5 tabs), Admission Enquiry, Visitor Book, Phone Call Log, Postal Dispatch/Receive, Complain.
- Schema SQL: `001_schema.sql`, `002_additional_tables.sql`, `003_seed.sql`, `004_front_office_fixes.sql`.
- Run SaaS migration/seed via `node scripts/run-saas-migration.cjs`.

### Changed
- `read DATABASE_URL from env with localhost fallback + SSL for Neon` — DB connection now reads `DATABASE_URL` env var, falls back to localhost, enables SSL for Neon hosting.
- `store uploads in Postgres (serverless-safe) instead of ephemeral disk` — document/image uploads persisted in Postgres so files survive Vercel's serverless/edge eviction.

### Fixed
- `image fix verified live on production` — confirmed image serving works on Vercel after moving uploads to Postgres.

## How to add an entry
When you finish a change, add it under `[Unreleased]` before committing, e.g.:

```
### Fixed
- Describe what broke and what you fixed.
```

<!-- Link references so older releases keep resolving -->
[0.1.0]: https://github.com/bireswarghosh/school/releases/tag/v0.1.0