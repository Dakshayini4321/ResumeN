import express, { type NextFunction, type Request, type Response } from 'express';
import { allowPasswordChange, getDb, setSetting, type UserRow } from './db.ts';
import {
  createSession,
  csrfGuard,
  destroySession,
  ensureSuperAdmin,
  publicUser,
  removeInitialPasswordFile,
  requireAdmin,
  requireAuth,
  requirePasswordCurrent,
  revokeUserSessions,
  sessionUser,
  type AuthedRequest,
} from './auth.ts';
import {
  EMAIL_RE,
  adminPasswordError,
  cleanText,
  clearLoginFailures,
  getDummyHash,
  hashPassword,
  loginBlocked,
  passwordError,
  recordLoginFailure,
  usernameError,
  verifyPassword,
} from './security.ts';

/** Resolves once the database schema exists and the Super Admin has been created. */
export const ready: Promise<void> = getDb().then(() => ensureSuperAdmin());

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
export const PROD_HEADERS: Record<string, string> = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000',
};

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? true : process.env.TRUST_PROXY);
  else if (process.env.VERCEL) app.set('trust proxy', 1); // Vercel sets X-Forwarded-For to the real client IP

  app.use((_req, res, next) => {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
    if (process.env.NODE_ENV === 'production') for (const [k, v] of Object.entries(PROD_HEADERS)) res.setHeader(k, v);
    next();
  });
  app.use('/api', apiRouter());
  return app;
}

type Handler = (req: AuthedRequest, res: Response) => unknown;
/** Wraps async handlers so thrown errors become 500 responses instead of crashing. */
const h = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req as AuthedRequest, res)).catch(next);

const bad = (res: Response, error: string, status = 400) => res.status(status).json({ error });
const settingsFor = async () => ({ allowPasswordChange: await allowPasswordChange() });
const getUser = async (id: number) => (Number.isSafeInteger(id) ? (await getDb()).get<UserRow>('SELECT * FROM users WHERE id = ?', [id]) : undefined);
const findByUsername = async (username: string) => (await getDb()).get<UserRow>('SELECT * FROM users WHERE lower(username) = lower(?)', [username]);
const usernameTaken = async (username: string, exceptId = 0) =>
  !!(await (await getDb()).get('SELECT 1 FROM users WHERE lower(username) = lower(?) AND id <> ?', [username, exceptId]));

function apiRouter() {
  const api = express.Router();
  api.use(async (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store'); // never cache account data
    try {
      await ready;
      next();
    } catch (e) {
      next(e);
    }
  });
  api.use(express.json({ limit: '6mb' }));
  api.use(csrfGuard);

  /* ================================================================ auth */
  api.post(
    '/auth/login',
    h(async (req, res) => {
      const { username, password, portal } = req.body ?? {};
      if (typeof username !== 'string' || typeof password !== 'string' || !username || !password || username.length > 64 || password.length > 128)
        return bad(res, 'Enter your username and password.');
      const ip = req.ip ?? '';
      const wait = await loginBlocked(ip, username);
      if (wait) return bad(res, `Too many failed attempts. Try again in ${Math.ceil(wait / 60)} minute(s).`, 429);

      const user = await findByUsername(username.trim());
      const ok = await verifyPassword(password, user?.password_hash ?? (await getDummyHash()));
      if (!user || !ok) {
        await recordLoginFailure(ip, username);
        return bad(res, 'Invalid username or password.', 401);
      }
      if (!user.active) return bad(res, 'This account has been deactivated. Please contact your administrator.', 403);
      if (portal === 'admin' && user.role !== 'admin') return bad(res, 'This sign-in page is for administrators only.', 403);
      if (portal !== 'admin' && user.role === 'admin') return bad(res, 'Administrators sign in on the admin login page.', 403);

      await clearLoginFailures(username);
      await (await getDb()).run('UPDATE users SET last_login_at = ? WHERE id = ?', [Date.now(), user.id]);
      await createSession(req, res, user);
      res.json({ user: publicUser(user), settings: await settingsFor() });
    }),
  );

  api.post(
    '/auth/logout',
    h(async (req, res) => {
      const s = await sessionUser(req);
      await destroySession(res, s?.tokenHash);
      res.json({ ok: true });
    }),
  );

  api.get(
    '/auth/me',
    requireAuth,
    h(async (req, res) => res.json({ user: publicUser(req.user), settings: await settingsFor() })),
  );

  api.post(
    '/auth/change-password',
    requireAuth,
    h(async (req, res) => {
      const u = req.user;
      if (u.role !== 'admin' && !u.must_change_password && !(await allowPasswordChange()))
        return bad(res, 'Password changes are disabled by your administrator.', 403);
      const { currentPassword, newPassword } = req.body ?? {};
      if (typeof currentPassword !== 'string' || !(await verifyPassword(currentPassword, u.password_hash)))
        return bad(res, 'Your current password is incorrect.');
      const err = u.role === 'admin' ? adminPasswordError(newPassword) : passwordError(newPassword, u.username);
      if (err) return bad(res, err);
      if (await verifyPassword(newPassword, u.password_hash)) return bad(res, 'Choose a password different from your current one.');
      const now = Date.now();
      await (await getDb()).run(
        'UPDATE users SET password_hash = ?, must_change_password = 0, password_changed_at = ?, updated_at = ? WHERE id = ?',
        [await hashPassword(newPassword), now, now, u.id],
      );
      // Sign out every other device, and rotate this device's session.
      await revokeUserSessions(u.id);
      await createSession(req, res, u);
      if (u.role === 'admin') removeInitialPasswordFile();
      res.json({ user: publicUser((await getUser(u.id))!), settings: await settingsFor() });
    }),
  );

  /* ================================================================ resumes (owner-scoped) */
  const RESUME_ID = /^[\w-]{1,64}$/;
  const MAX_RESUMES = 200;
  const MAX_BODY = 4 * 1024 * 1024;

  const resumes = express.Router();
  resumes.use(requireAuth, requirePasswordCurrent);

  resumes.get(
    '/',
    h(async (req, res) => {
      const rows = await (await getDb()).all<{ body: string }>('SELECT body FROM resumes WHERE user_id = ? ORDER BY updated_at DESC', [req.user.id]);
      res.json({ resumes: rows.map((r) => JSON.parse(r.body)) });
    }),
  );

  resumes.put(
    '/:id',
    h(async (req, res) => {
      const id = req.params.id;
      const r = req.body;
      if (!RESUME_ID.test(id)) return bad(res, 'Invalid resume id.');
      if (!r || typeof r !== 'object' || r.id !== id || typeof r.data !== 'object' || !r.data?.personal || !Array.isArray(r.data?.sections))
        return bad(res, 'Invalid resume.');
      const name = cleanText(r.name, 120) || 'Untitled CV';
      const templateId = cleanText(r.templateId, 40) || 'classic';
      const now = Date.now();
      const createdAt = Number.isFinite(r.createdAt) ? Math.floor(Number(r.createdAt)) : now;
      const updatedAt = Number.isFinite(r.updatedAt) ? Math.floor(Math.min(Number(r.updatedAt), now + 60_000)) : now;
      const body = JSON.stringify({ ...r, id, name, templateId, createdAt, updatedAt });
      if (body.length > MAX_BODY) return bad(res, 'This resume is too large (try a smaller photo).', 413);

      const db = await getDb();
      const exists = await db.get('SELECT 1 FROM resumes WHERE user_id = ? AND id = ?', [req.user.id, id]);
      if (!exists) {
        const { n } = (await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM resumes WHERE user_id = ?', [req.user.id]))!;
        if (n >= MAX_RESUMES) return bad(res, `You can keep up to ${MAX_RESUMES} resumes.`, 409);
      }
      await db.run(
        `INSERT INTO resumes (user_id, id, name, template_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (user_id, id) DO UPDATE SET name = excluded.name, template_id = excluded.template_id, body = excluded.body, updated_at = excluded.updated_at`,
        [req.user.id, id, name, templateId, body, createdAt, updatedAt],
      );
      res.json({ ok: true, updatedAt });
    }),
  );

  resumes.delete(
    '/:id',
    h(async (req, res) => {
      await (await getDb()).run('DELETE FROM resumes WHERE user_id = ? AND id = ?', [req.user.id, req.params.id]);
      res.json({ ok: true });
    }),
  );
  api.use('/resumes', resumes);

  /* ================================================================ admin */
  const admin = express.Router();
  admin.use(requireAuth, requirePasswordCurrent, requireAdmin);

  const listUsers = async () =>
    (
      await (await getDb()).all<UserRow & { resume_count: number; session_count: number }>(
        `SELECT u.*, (SELECT COUNT(*) FROM resumes r WHERE r.user_id = u.id) AS resume_count,
                (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id AND s.expires_at > ?) AS session_count
         FROM users u ORDER BY CASE WHEN u.role = 'admin' THEN 0 ELSE 1 END, u.created_at DESC`,
        [Date.now()],
      )
    ).map((u) => ({ ...publicUser(u), resumeCount: Number(u.resume_count), signedIn: Number(u.session_count) > 0 }));

  admin.get(
    '/users',
    h(async (_req, res) => res.json({ users: await listUsers(), settings: await settingsFor() })),
  );

  admin.post(
    '/users',
    h(async (req, res) => {
      const { username, password, fullName, email, mustChangePassword, active } = req.body ?? {};
      const uErr = usernameError(username);
      if (uErr) return bad(res, uErr);
      if (await usernameTaken(username)) return bad(res, 'That username is already taken.', 409);
      const pErr = passwordError(password, username);
      if (pErr) return bad(res, pErr);
      const mail = cleanText(email, 160);
      if (mail && !EMAIL_RE.test(mail)) return bad(res, 'Enter a valid email address or leave it blank.');
      const now = Date.now();
      await (await getDb()).run(
        `INSERT INTO users (username, password_hash, role, full_name, email, active, must_change_password, created_at, updated_at, password_changed_at)
         VALUES (?, ?, 'user', ?, ?, ?, ?, ?, ?, ?)`,
        [username, await hashPassword(password), cleanText(fullName, 120), mail, active === false ? 0 : 1, mustChangePassword ? 1 : 0, now, now, now],
      );
      res.status(201).json({ user: publicUser((await findByUsername(username))!) });
    }),
  );

  admin.patch(
    '/users/:id',
    h(async (req, res) => {
      const target = await getUser(Number(req.params.id));
      if (!target) return bad(res, 'User not found.', 404);
      const { username, fullName, email, active } = req.body ?? {};
      const sets: string[] = [];
      const vals: (string | number)[] = [];
      if (username !== undefined && username !== target.username) {
        const uErr = usernameError(username);
        if (uErr) return bad(res, uErr);
        if (await usernameTaken(username, target.id)) return bad(res, 'That username is already taken.', 409);
        sets.push('username = ?');
        vals.push(username);
      }
      if (fullName !== undefined) {
        sets.push('full_name = ?');
        vals.push(cleanText(fullName, 120));
      }
      if (email !== undefined) {
        const mail = cleanText(email, 160);
        if (mail && !EMAIL_RE.test(mail)) return bad(res, 'Enter a valid email address or leave it blank.');
        sets.push('email = ?');
        vals.push(mail);
      }
      if (active !== undefined) {
        if (target.role === 'admin') return bad(res, 'The Super Admin account cannot be deactivated.', 403);
        sets.push('active = ?');
        vals.push(active ? 1 : 0);
      }
      if (!sets.length) return res.json({ user: publicUser(target) });
      sets.push('updated_at = ?');
      vals.push(Date.now());
      await (await getDb()).run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...vals, target.id]);
      if (active === false) await revokeUserSessions(target.id); // deactivated accounts are signed out immediately
      res.json({ user: publicUser((await getUser(target.id))!) });
    }),
  );

  admin.post(
    '/users/:id/reset-password',
    h(async (req, res) => {
      const target = await getUser(Number(req.params.id));
      if (!target) return bad(res, 'User not found.', 404);
      if (target.role === 'admin') return bad(res, 'Change your own password from “My account”.', 403);
      const { password, mustChangePassword } = req.body ?? {};
      const pErr = passwordError(password, target.username);
      if (pErr) return bad(res, pErr);
      const now = Date.now();
      await (await getDb()).run(
        'UPDATE users SET password_hash = ?, must_change_password = ?, password_changed_at = ?, updated_at = ? WHERE id = ?',
        [await hashPassword(password), mustChangePassword ? 1 : 0, now, now, target.id],
      );
      await revokeUserSessions(target.id); // old password's sessions end now
      await clearLoginFailures(target.username, true);
      res.json({ user: publicUser((await getUser(target.id))!) });
    }),
  );

  admin.post(
    '/users/:id/sign-out',
    h(async (req, res) => {
      const target = await getUser(Number(req.params.id));
      if (!target) return bad(res, 'User not found.', 404);
      if (target.role === 'admin') return bad(res, 'Use “Sign out” to end your own session.', 403);
      await revokeUserSessions(target.id);
      res.json({ ok: true });
    }),
  );

  admin.delete(
    '/users/:id',
    h(async (req, res) => {
      const target = await getUser(Number(req.params.id));
      if (!target) return bad(res, 'User not found.', 404);
      if (target.role === 'admin') return bad(res, 'The Super Admin account cannot be deleted.', 403);
      await (await getDb()).run('DELETE FROM users WHERE id = ?', [target.id]); // cascades to sessions + resumes
      res.json({ ok: true });
    }),
  );

  admin.put(
    '/settings',
    h(async (req, res) => {
      const { allowPasswordChange: allow } = req.body ?? {};
      if (typeof allow !== 'boolean') return bad(res, 'Invalid settings.');
      await setSetting('allow_password_change', allow ? '1' : '0');
      res.json({ settings: await settingsFor() });
    }),
  );
  api.use('/admin', admin);

  api.use((_req, res) => bad(res, 'Not found.', 404));
  api.use((err: Error & { type?: string; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    if (err.type === 'entity.too.large') return bad(res, 'Request too large.', 413);
    if (err.type === 'entity.parse.failed') return bad(res, 'Invalid request.');
    console.error(err);
    bad(res, 'Something went wrong.', 500);
  });
  return api;
}
