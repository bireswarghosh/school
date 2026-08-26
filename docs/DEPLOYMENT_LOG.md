# DEPLOYMENT LOG — GitHub → Vercel

Target: repo `bireswarghosh/school` → Vercel team `bireswarghoshs-projects` → production URL.

## Status: NOT STARTED (blocked on user inputs)

### Checklist
- [ ] GitHub PAT provided & `GITHUB_TOKEN` set (user env var) → GitHub MCP works
- [ ] `opencode mcp auth vercel` done (user, browser OAuth)
- [ ] `opencode mcp auth neon` done (user, browser OAuth)
- [ ] opencode restarted → MCPs + 7 agents loaded
- [ ] .gitignore hardened (logs, backups/, New folder/, zip, tsbuildinfo, .env*, cookies.txt)
- [ ] git init + identity verified (user.name/email = bireswarghosh account)
- [ ] Commit prepared → push (user approves; push is permission-denied for agent)
- [ ] Vercel: import repo `bireswarghosh/school`
- [ ] Vercel env var: `DATABASE_URL` = Neon pooled string (user adds in dashboard or via MCP)
- [ ] Build passes on Vercel
- [ ] Production URL smoke test (login page 200, API 200, image 200)

### Identity safety (per user rule)
Machine SSH key belongs to a DIFFERENT GitHub account. Before ANY push verify:
`git remote -v` → must be bireswarghosh/school · `git config user.name` · `git config user.email`
If mismatch → BLOCKED, ask user.
