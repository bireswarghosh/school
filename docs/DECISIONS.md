# DECISIONS LOG — school project (GitHub → Vercel + Neon)

> Format: Decision / Problem / Evidence / Options / Chosen Solution / Why / Files Changed / Not Changed / Verification / Result
> This file is the audit trail. It is meant to be reviewed by another AI (Claude / Antigravity).

---

## D001 — Project extraction location
- **Decision:** Extracted `New folder (2).zip` into the working dir root `D:\ALL PROJECT\school project\` (repo root = this folder).
- **Problem:** Project arrived as a zip with a nested `New folder (2)/` wrapper; GitHub repo `bireswarghosh/school` must have clean root.
- **Evidence:** Zip had 1410 entries; after extraction working dir has package.json, src/ (659 files), public/, scripts/.
- **Options:** (a) keep nested folder as repo root, (b) flatten into working dir.
- **Chosen Solution:** (b) flatten.
- **Why:** Working dir is the session root; cleaner git repo; matches package.json at root.
- **Files Changed:** none modified; files moved out of zip only.
- **Not Changed:** `New folder (2).zip` kept as-is (user's original). Empty wrapper folder `New folder/` (turbopack cache junk) left in place — flagged for gitignore.
- **Verification:** directory listing shows 44 entries incl. package.json, src/, next.config.js.
- **Result:** PASS

## D002 — Database = Neon PostgreSQL (user-provided)
- **Decision:** Use Neon Postgres instance supplied by user; connection string stored as Windows user env var, NOT committed.
- **Problem:** App needs a cloud Postgres for Vercel (serverless can't reach user's local DB reliably).
- **Evidence:** User provided pooled Neon connection string; project uses `pg` (package.json) and lib/db.ts Pool.
- **Options:** Neon (chosen), Vercel Postgres/marketplace (user already has Neon), Supabase.
- **Chosen Solution:** Neon pooled connection string.
- **Why:** User's explicit choice; pooling endpoint suits serverless.
- **Files Changed:** none in repo; Windows env vars `NEON_DATABASE_URL`, `DATABASE_URL` set via `setx`.
- **Not Changed:** `.env*` files (gitignored anyway).
- **Verification:** node+pg test → CONNECTED OK, PostgreSQL 18.6, db=neondb, user=neondb_owner, 0 public tables (EMPTY DB), ~3.7s first-connect latency.
- **Result:** PASS (connection) — ⚠ DB is empty; schema import pending (see D005).

## D003 — MCP server setup (GitHub / Vercel / Neon)
- **Decision:** Replace broken/deprecated MCP entries in global opencode config.
  - `github`: old local npm package (`@modelcontextprotocol/server-github`, archived) → **official remote** `https://api.githubcopilot.com/mcp/` with PAT header `{env:GITHUB_TOKEN}`.
  - `vercel`: **new remote** `https://mcp.vercel.com` (OAuth auto-flow, no key needed).
  - `neon`: **new remote** `https://mcp.neon.tech/mcp` (OAuth auto-flow).
  - `postgres`: was pointing to `localhost:5432/app` (failing every session) → now points to **Neon** connection string.
- **Problem:** GitHub MCP deprecated + token missing; Vercel MCP absent; postgres MCP pointed at a dead local DB (observed `MCP error -32603`).
- **Evidence:** config before/after; live postgres query failure in session.
- **Options:** local docker servers (no Docker guaranteed), npx local servers (deprecated/needs keys), remote official servers (chosen).
- **Chosen Solution:** Remote official endpoints; PAT via env for GitHub.
- **Why:** Official, maintained, no Docker dependency; OAuth handled by opencode (`opencode mcp auth <name>`).
- **Files Changed:** `C:\Users\LENOVO\.config\opencode\opencode.jsonc` (mcp.github, mcp.vercel, mcp.neon, mcp.postgres).
- **Not Changed:** all other MCP entries untouched.
- **Verification:** PENDING — requires opencode restart + `opencode mcp auth vercel` + `opencode mcp auth neon` + `GITHUB_TOKEN` env set by user.
- **Result:** PARTIAL (blocked on user inputs: GitHub PAT, OAuth logins)

## D004 — Git push safety rule
- **Decision:** No push to GitHub without identity verification. Remote must be `https://github.com/bireswarghosh/school.git`.
- **Problem:** Machine has an SSH key bound to a DIFFERENT GitHub account; pushing would go to the wrong account.
- **Evidence:** User statement (repeated twice, emphatic).
- **Options:** (a) trust default git config, (b) verify remote+identity before every push, (c) disable push entirely.
- **Chosen Solution:** (b) + existing permission rule `git push*` = deny (agent prepares commits; user pushes or approves).
- **Why:** User explicitly forbade wrong-account push.
- **Files Changed:** none.
- **Verification:** before any push: `git remote -v` + `git config user.name/user.email` + `ssh -T git@github.com` identity check.
- **Result:** RULE ACTIVE

## D005 — Multi-agent system (7 agents)
- **Decision:** Created 7 project-level subagents in `.opencode/agent/`.
- **Roster:** architect (big-pickle, no-edit) / implementer (deepseek-v4-flash) / db-agent (deepseek) / deploy-agent (deepseek) / image-agent (mimo-v2-5) / reviewer (big-pickle, no-edit) / verifier (deepseek).
- **Why:** User requested 5–7 separate "brains" with separated duties: plan → implement → verify → review, multi-model.
- **Files Changed:** `.opencode/agent/{architect,implementer,db-agent,deploy-agent,image-agent,reviewer,verifier}.md`.
- **Verification:** PENDING — requires opencode restart to load.
- **Result:** CREATED

## D006 — Schema import into Neon
- **Status:** DONE (2026-08-26, user approved "Root dump import করো")
- **Problem:** Neon DB had 0 tables.
- **Chosen:** root dump `appstrice_school_20260822_164448.sql` (newest, data included).
- **Method:** psql absent → custom node importer (pg + pg-copy-streams), handles COPY FROM stdin + psql meta-commands.
- **Verification:** 191 tables, 1819 statements, 2248 rows, **0 errors**; spot-check users=9, students=106, classes=14, fees_payments=624; unqualified-query test OK after session cleanup.
- **Result:** PASS — full log in `docs/DATABASE_LOG.md`.

## D007 — PENDING: image strategy for Vercel
- **Status:** OPEN — analysis not yet done.
- **Known risk:** `data/uploads/*.jpeg|png` served from local FS; Vercel FS is read-only/ephemeral. Full inventory + fix tracked in `docs/IMAGE_FIX.md` (to be produced by image-agent).
