# IMAGE FIX — Vercel deployment

## Known risk (from user + initial scan)
- `data/uploads/` holds runtime-uploaded images (jpeg/png) served from local filesystem.
- Vercel serverless filesystem is READ-ONLY and EPHEMERAL → these break in production.

## Inventory (image-agent to fill)
| # | Source | Referenced in | Breaks on Vercel? | Fix |
|---|--------|---------------|-------------------|-----|
| TBD | data/uploads/* | grep pending | YES (expected) | Vercel Blob / DB-backed |
| TBD | public/* | pending | NO (ships with repo) | keep |
| TBD | blob: URLs | pending | TBD | TBD |

## Fix log
(none yet)

## Verification
(none yet — each fixed image URL must return HTTP 200 on production)
