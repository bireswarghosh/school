# IMAGE FIX — Vercel deployment (FIXED ✅)

## Why images broke on Vercel (the explanation)

### Local dev (worked)
```
Browser → POST /api/upload → Node server writes file to disk:
          D:\...\data\uploads\abc123.png   ← PERMANENT disk
Browser → GET /api/files/abc123.png → Node reads the same disk → 200 OK
```
One machine, one persistent filesystem. Upload and download hit the **same disk**.

### Vercel production (broken)
Vercel runs your app as **serverless functions**: short-lived containers that
spin up per-request and vanish after. Two fatal properties:

1. **Read-only filesystem** — the only writable path is `/tmp`, not the project dir.
   `writeFile(process.cwd() + "/data/uploads")` → **EROFS: read-only file system**.
2. **Ephemeral + non-shared** — even if a write to `/tmp` succeeded, the next
   request usually lands on a *different* container. Container A saved the file;
   container B has never seen it. And every container is destroyed after use,
   so nothing survives anyway.

> Student analogy: writing notes on a whiteboard, but every visitor gets a
> random room, the board is wiped after each visitor, and you can't even bring
> a marker (read-only). The next visitor will never find your note.

So on Vercel: uploads fail outright, and any old DB record pointing to
`/api/files/<name>` would 404 forever.

## The fix (implemented)

**Store file bytes inside PostgreSQL instead of the filesystem.**
Neon Postgres is persistent, shared by all serverless instances, already part
of our stack, and needs no new service/token/dashboard clicks.

| File | Change |
|---|---|
| `lib/sql/005_uploaded_files.sql` | NEW table `uploaded_files` (id, name UNIQUE, mime, size, data BYTEA, school_id, created_at) |
| `src/app/api/upload/route.ts` | Was: `fs.writeFile(data/uploads)`. Now: `INSERT INTO uploaded_files (... data BYTEA)` |
| `src/app/api/files/[name]/route.ts` | Was: `createReadStream(disk)`. Now: `SELECT data FROM uploaded_files WHERE name=$1` → returns bytes with stored mime + immutable cache |
| `src/lib/tenant-tables.ts` | Registered `uploaded_files` → auto school_id scoping (school A can never read school B's files) |
| `src/lib/db.ts` | `DbParam` type now accepts `Uint8Array` for BYTEA params |

- URL shape unchanged (`/api/files/<stored>`), so **zero frontend changes**.
- Max size lowered 15 MB → **4 MB** (Vercel request-body limit ≈ 4.5 MB).
- Works identically in local dev and production — single code path.
- Migration applied to Neon (idempotent, safe to re-run):
  `node scripts/run-saas-migration.cjs` or execute `005_uploaded_files.sql`.

## Trade-offs / notes
- DB storage suits school-scale files (photos, PDFs ≤4 MB). For heavy media,
  Vercel Blob or S3 would be the next step — swap only these two route files.
- Old disk-based uploads: none existed in Neon (verified 0 `/api/files/%`
  references across all document/photo columns), so no data migration needed.

## Verification
- [x] `npx tsc --noEmit` → 0 errors
- [x] `npm run build` → compiled successfully
- [x] Migration applied on Neon (`uploaded_files` created)
- [x] Live production round-trip (deploy `1243687`): browser login → canvas PNG →
  `POST /api/upload` → 200 `/api/files/1787748500636-wruikh.png` →
  `GET` → 200, `image/png`, 1936 bytes (exact match), correct PNG magic bytes,
  `Cache-Control: immutable`, decoded by `<img>` ✅ · DB row confirmed with `school_id=1`
