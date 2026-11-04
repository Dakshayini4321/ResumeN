# CVForge — Professional CV Builder

Multi-user CV builder: React + TypeScript + Tailwind (Vite) front end, Node + Express API with a SQLite database.
Enter content once and render it in 10 templates (7 ATS-friendly, 3 professional), with live preview, autosave,
undo/redo and PDF / DOCX / print export. One Super Admin manages all user accounts.

Requires **Node.js 22.18+** (uses the built-in `node:sqlite` and native TypeScript support — no native modules to compile).

```bash
npm install
npm run dev          # app on http://localhost:5173 (API on :8787, proxied under /api)
npm run build        # typecheck + production build in dist/
npm start            # production: serves dist/ and the API on PORT (default 8787)
npm run admin:reset  # server-side recovery: new one-time Super Admin password
```

## Deploying to Vercel
Vercel's functions can't keep a database file, so the hosted app uses **PostgreSQL** (locally it keeps using SQLite).

1. Import this GitHub repository in Vercel (**Add New → Project**). Keep the detected settings; `npm run build`
   produces Vercel's build output (static site + the `/api` function) by itself.
2. In the project, open **Storage → Create Database → Neon (Postgres)** and connect it to the project. This adds
   `DATABASE_URL` automatically. (Any Postgres works: set `DATABASE_URL` yourself.)
3. Add environment variables (**Settings → Environment Variables**):
   - `ADMIN_INITIAL_PASSWORD` — the Super Admin's password on first start (e.g. your chosen password)
   - `ADMIN_USERNAME` — optional, defaults to `admin`
4. Deploy (or **Redeploy** after adding the variables). Tables and the Super Admin are created automatically on the
   first request. Sign in at `https://<your-app>.vercel.app/#/admin/login`.

`ADMIN_INITIAL_PASSWORD` is only used when no admin exists yet; afterwards change the password from the account menu.
To recover a lost admin password: `DATABASE_URL=<neon url> npm run admin:reset` from your machine.

## First run — Super Admin setup
No credentials are hardcoded. On first start the server creates the single Super Admin (username `admin`, or
`ADMIN_USERNAME`):
- with `ADMIN_INITIAL_PASSWORD` set, that password is used as chosen (recommended for hosting);
- otherwise with a **random one-time password**, printed in the server log and written to
  `server/data/INITIAL_ADMIN_PASSWORD.txt`, which must be changed at first sign-in (the file is then deleted).

Sign in at **`/#/admin/login`**.

Users sign in at `/#/login` with the username and password the admin gives them.

## Security model (all enforced on the server)
| Concern | Implementation |
|---|---|
| Passwords | scrypt (N=2^15, r=8, p=1, 16-byte random salt), constant-time compare; user policy: 8–128 chars, 3 of 4 character classes, must not contain the username. The Super Admin is exempt by owner's choice (4+ chars only) — use a strong admin password before exposing the app beyond your machine |
| Sessions | 256-bit random token in an `HttpOnly`, `SameSite=Strict` cookie (`Secure` in production); only its SHA-256 is stored. Idle timeout 2 h (admin) / 24 h (user), absolute 7 days. Rotated on password change |
| Access control | `requireAuth` → `requirePasswordCurrent` → `requireAdmin` middleware; every resume query is scoped `WHERE user_id = <session user>` (primary key is `(user_id, id)`) |
| Account state | Deactivating, deleting or resetting a password deletes the user's sessions immediately; every request re-checks `active` |
| CSRF | SameSite=Strict + required `X-Requested-With` header + Origin check on writes |
| Brute force | Stored in the database (holds across serverless instances): per username 5 failures / 15 min and 20 / 24 h, per IP 20 / 15 min; same error and timing for unknown users |
| Headers | CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS (production), `Cache-Control: no-store` on the API |
| Separation | Admin login page only accepts the admin; the user login page only accepts users. Admin APIs return 403 to users; the Super Admin can't be deactivated or deleted |
| Self-service | Users can change their password (needs the current one) when the admin setting allows it; a temporary password must always be replaced |

Behind a reverse proxy, set `TRUST_PROXY=1` (so rate limits see real client IPs) and serve over HTTPS.

## Architecture
| Layer | Location | Notes |
|---|---|---|
| API server | `server/app.ts` (routes), `auth.ts`, `security.ts`, `db.ts`; entries `index.ts` (Node) and `vercel.ts` (Vercel) | Express routes `/api/auth/*`, `/api/resumes/*`, `/api/admin/*`. Postgres when `DATABASE_URL` is set, else SQLite at `server/data/cvforge.db` (`CVFORGE_DATA_DIR` / `CVFORGE_DB`) |
| Auth (client) | `src/store/useAuthStore.ts`, `src/lib/api.ts` | Session check on load, 60 s heartbeat, automatic sign-out on any 401 |
| Data model | `src/types/resume.ts` | One `Resume` → `ResumeData` structure used by every template and exporter |
| Store | `src/store/useResumeStore.ts` | Zustand: resume list, undo/redo, debounced autosave of changed resumes to the server (retries on network errors) |
| Pages | `src/pages/LoginPage.tsx`, `AdminDashboard.tsx`, `Dashboard.tsx`, `EditorPage.tsx` | Hash routes: `#/login`, `#/admin/login`, `#/admin`, `#/`, `#/edit/:id` |
| Templates | `src/templates/ats/*`, `src/templates/professional/*` | Pure components of `TemplateCtx`; shared building blocks in `templates/shared.tsx` |
| Export | `src/lib/print.ts`, `src/lib/exportDocx.ts` | PDF/print via the browser print engine (selectable text); DOCX via `docx` (lazy-loaded) |

### Adding a template
1. Create `src/templates/<category>/MyTemplate.tsx` rendering from `ctx` using `visibleSections`, `CvSection`, `contactItems`.
2. Register it in `TEMPLATES` in `registry.tsx`. It automatically appears in the gallery, thumbnails, preview and print.

## Templates
7 ATS (single column, no photo): Classic, Modern, Executive, Minimal, Compact, Technical, Harvard.
3 professional (optional photo — circle / rounded / square): Elegant, Horizon, Prestige.

## Print & ATS rules the templates follow
- `@page { margin: 0 }` (no browser URL/date headers); per-page spacing comes from `.cv-flow` padding with `box-decoration-break: clone`.
- Sidebar/edge colours use `Page`'s `bg` layer, which is `position: fixed` in print so it repeats on every page.
- Bullets use native list markers; never put text inside positioned elements or use CSS `order` — Chrome writes PDF text in paint order.
- Keep letter-spacing ≤ 0.1em and avoid `font-variant: small-caps`, both break PDF text extraction.
- Empty entries/sections are filtered in `templates/shared.tsx` (`isEmptyItem`, `visibleSections`).

## Testing
In development only, `#/render/<templateId>?photo=1&shape=circle` renders a long stress-test CV (`src/lib/fixtures.ts`) in any template
without signing in — handy for `chrome --headless=new --print-to-pdf=out.pdf "http://localhost:5173/#/render/prestige?photo=1"`.

## Notes
- **PDF**: “Download PDF” opens the print dialog with the filename pre-set — choose *Save as PDF*. This produces real text (ATS-parsable), not an image.
- **DOCX**: always exported as a clean single-column ATS layout using the current template's font and accent color.
- **Backups**: copy `server/data/` (stop the server first, or use SQLite's backup tools). Users can also *Export data (JSON)*.
- CVs saved in a browser by the earlier, pre-accounts version are offered for one-time import on the dashboard.
