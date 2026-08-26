<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
<!-- BEGIN:project-context -->
# Smart School Project Context

## Architecture
- **Framework:** Next.js 16 (Turbopack), 329 routes compiled
- **Database:** PostgreSQL 18.4 via `pg` Pool (`postgresql://postgres:123@localhost/appstrice_school`)
- **Pattern:** Generic API route handler (`lib/db.ts` + `lib/api-handler.ts`) with camelCase↔snake_case field mapping (`lib/field-mapping.ts`)
- **Client:** `useApi<T>(endpoint)` hook in `lib/use-api.ts`
- **Theme:** Orange primary (`#ff7732`), Plus Jakarta Sans + Outfit, glass-panel cards, dark sidebar

## Field Mapping Convention
- Pages use **camelCase** field names in TypeScript types and form states
- Database uses **snake_case** column names (PostgreSQL convention)
- API routes use `lib/field-mapping.ts` `camelToSnake()` for POST/PUT bodies and `snakeToCamel()` for GET responses
- Custom field overrides in `fieldMap` object per route for non-standard mappings (e.g., `followUpDate`→`next_date`)

## SaaS Multi-Tenancy (Shared DB)
- **One shared PostgreSQL DB**, row-level tenant isolation via a `school_id` column on ~180 tables (see `lib/tenant-tables.ts`).
- `db.query()` **auto-scopes** simple single-table SQL using the `x-school-id` header injected by `src/proxy.ts` (Next 16 middleware = Proxy). System-level queries (no header / outside requests) are unscoped. Never hand-write a query on a tenant table without relying on this.
- To drop a school: delete its users + set school_id rows (no cascade via DB constraint).

## Auth & Roles
- Login: `POST /api/auth/login` (email + password + optional `schoolCode` for school staff; super admins omit the code). School code is random/custom per school (e.g. `DEFAULT`).
- Role-based: `users.role` (+ optional `roles` table with JSONB `permissions`). Seeded system roles: super_admin, admin, teacher, staff, student, parent.
- Session = HMAC-SHA256-signed cookie (`smart_school_session`), scrypt password hashes. `src/lib/session.ts` is edge-safe (used by `proxy.ts`); `src/lib/auth.ts` adds node-only hashing + request helpers.
- Public routes whitelisted in `proxy.ts`: `/login`, `/register`, `/saas/login`, `/api/auth/*`, and the public exam endpoints.
- **Super admin portal** = `/saas` (distinct URL). School dashboards = `/admin`. Unauthenticated → redirect to `/login` (or `/saas/login`).
- Create/update users carefully — `users.username` is globally UNIQUE; seed/logins key off `email`.

## Run SaaS migration/seed
`node scripts/run-saas-migration.cjs` (idempotent). Seed logins:
- Super admin: `superadmin@smart-school.in` / `Super@123` → `/saas/login`
- School admin: `admin@smart-school.in` / `Admin@123` (school code `DEFAULT`) → `/login`

## Frontend Status (All 7 pages fixed)
- **Setup:** 5 tabs (Enquiry/Purpose/Complaint/Source/Reference types), description field, all via separate API endpoints
- **Admission Enquiry:** Filters (class/source/date/status), follow-up tracking, assignment, source/class/reference dropdowns
- **Visitor Book:** Meeting with (Student/Staff) conditional dropdowns, ID card, person count, time tracking
- **Phone Call Log:** Incoming/Outgoing radio, call duration, follow-up date
- **Postal Dispatch/Receive:** Reference no, from/to title, document type, attach document
- **Complain:** Complaint type/source dropdowns, action taken, assignment

## Key Files
- `lib/db.ts` — PostgreSQL CRUD helpers (create/update uses JSON keys directly as column names)
- `lib/field-mapping.ts` — camelCase ↔ snake_case conversion with custom override support
- `lib/use-api.ts` — Client-side hook wrapping fetch with CRUD methods
- `lib/api-handler.ts` — Generic handler generator (GET/POST/PUT/DELETE), supports beforeCreate/afterCreate hooks
- `lib/sql/001_schema.sql` — Core ~90 tables
- `lib/sql/002_additional_tables.sql` — ~69 supplemental tables
- `lib/sql/003_seed.sql` — Demo seed data
- `lib/sql/004_front_office_fixes.sql` — Added missing columns to front-office tables

## Patterns
- **Schema changes:** ALTER TABLE ADD COLUMN IF NOT EXISTS (never drop columns)
- **API routes:** Import `camelToSnake`/`mapResponse` from `lib/field-mapping.ts`; define `fieldMap` for custom name overrides
- **Pages:** Use `useApi<T>(endpoint)` — Type `T` must include `id?: number`. Fields in camelCase; mapping done at API layer.
- **Build:** `npm run build` verifies zero TS errors
<!-- END:project-context -->
