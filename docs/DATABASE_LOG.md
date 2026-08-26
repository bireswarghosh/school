# DATABASE LOG — Neon PostgreSQL

## Connection facts
- Provider: Neon (project `autumn-paper-34571344`, branch `production`, role `neondb_owner`, db `neondb`)
- Host: `ep-super-voice-azabstqs-pooler.c-3.ap-southeast-1.aws.neon.tech` (POOLED endpoint)
- Region: ap-southeast-1
- Secret handling: full string only in Windows user env vars (`NEON_DATABASE_URL`, `DATABASE_URL`). Masked everywhere else: `postgresql://neondb_owner:***@ep-super-voice-...`

## Test 1 — 2026-08-26 (node + pg direct)
- Command: node script, `SELECT version()`, information_schema table count, current_database/user
- Result: **CONNECTED OK**
  - VERSION: PostgreSQL 18.6 (3484359) on aarch64-unknown-linux-gnu
  - DATABASE: neondb | USER: neondb_owner
  - PUBLIC TABLES: **0**  ← DB IS EMPTY
  - LATENCY_MS: 3759 (cold start, pooled)
- Verdict: connection PASS; schema import REQUIRED before app can run.

## Import 1 — 2026-08-26 (user approved, DECISIONS.md D006)
- Source: `appstrice_school_20260822_164448.sql` (1,961,229 bytes, pg_dump 18.4 plain format, 18,460 lines)
- Method: psql NOT installed on machine → custom node script (pg + pg-copy-streams) in temp dir:
  - skips psql meta-commands (`\restrict` / `\unrestrict` etc.)
  - isolates `COPY ... FROM stdin;` blocks and streams data via pg-copy-streams
  - batches other statements, collects per-statement errors without aborting
- Result: **PASS — 0 errors**
  - TABLES CREATED: 191
  - STATEMENTS OK: 1819
  - COPY BLOCKS: 191 | ROWS COPIED: 2248
  - ERRORS: 0

## Verify 2 — 2026-08-26 (post-import)
| table | rows |
|---|---|
| users | 9 |
| students | 106 |
| classes | 14 |
| sections | 22 |
| subjects | 26 |
| exams | 15 |
| staff | 32 |
| fees_payments | 624 |
| schools | 2 |
- Login users present: `admin@appstrice.edu(admin)`, `teacher@appstrice.edu(teacher)`, `accountant@appstrice.edu(staff)`, `superadmin@smart-school.in(super_admin)`, `admin@smart-school.in(admin)`, `teacher@smart-school.in(teacher)`

## Incident: dirty pooled session (resolved)
- During import, dump's `SET search_path=''` (session-scoped) lingered on a PgBouncer server session → unqualified table names failed intermittently on reused sessions.
- Fix: terminated foreign backends; re-tested unqualified queries (`FROM users`, `FROM students`) → OK.
- Lesson logged: when importing pg_dump with `set_config('search_path','',false)` through a pooler, always reset sessions afterward.

## Pending
- [x] Import schema (DONE — this file, Import 1)
- [x] Post-import: table count + spot-check users/students/classes (DONE — Verify 2)
- [ ] App-level check: lib/db.ts Pool against DATABASE_URL (after opencode restart / next phase)
