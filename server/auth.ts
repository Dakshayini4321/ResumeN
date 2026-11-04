import fs from 'node:fs';
import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import { dataDir, getDb, type UserRow } from './db.ts';
import { generatePassword, hashPassword, newToken, sha256 } from './security.ts';

export const COOKIE = 'cvf_sid';
const DAY = 24 * 60 * 60 * 1000;
const ABSOLUTE_TTL = 7 * DAY; // a session never lives longer than this
const IDLE_TTL = { admin: 2 * 60 * 60 * 1000, user: 24 * 60 * 60 * 1000 }; // sign out after inactivity

export interface AuthedRequest extends Request {
  user: UserRow;
  tokenHash: string;
}

const secureCookies = () => process.env.COOKIE_SECURE === '1' || process.env.NODE_ENV === 'production';

/* ------------------------------------------------------------------ sessions */
export async function createSession(req: Request, res: Response, user: UserRow) {
  const db = await getDb();
  const token = newToken();
  const now = Date.now();
  await db.run(
    'INSERT INTO sessions (token_hash, user_id, created_at, last_seen_at, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [sha256(token), user.id, now, now, now + ABSOLUTE_TTL, String(req.headers['user-agent'] ?? '').slice(0, 200), req.ip ?? ''],
  );
  if (Math.random() < 0.05) await db.run('DELETE FROM sessions WHERE expires_at < ?', [now]); // occasional cleanup
  res.cookie(COOKIE, token, {
    httpOnly: true, // not readable by page scripts
    sameSite: 'strict', // never sent on cross-site requests
    secure: secureCookies(),
    path: '/',
    maxAge: ABSOLUTE_TTL,
  });
}

export async function destroySession(res: Response, tokenHash?: string) {
  if (tokenHash) await (await getDb()).run('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'strict', secure: secureCookies(), path: '/' });
}

/** Ends every session of a user (deactivation, deletion, password reset/change). */
export async function revokeUserSessions(userId: number) {
  await (await getDb()).run('DELETE FROM sessions WHERE user_id = ?', [userId]);
}

const readCookie = (req: Request, name: string) => {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
};

/** Resolves the session cookie to an active user, or null. Expired / orphaned sessions are deleted. */
export async function sessionUser(req: Request): Promise<{ user: UserRow; tokenHash: string } | null> {
  const token = readCookie(req, COOKIE);
  if (!token || token.length > 100) return null;
  const db = await getDb();
  const tokenHash = sha256(token);
  const row = await db.get<UserRow & { last_seen_at: number; expires_at: number }>(
    `SELECT s.last_seen_at, s.expires_at, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
    [tokenHash],
  );
  if (!row) return null;
  const now = Date.now();
  const { last_seen_at, expires_at, ...user } = row;
  if (!user.active || expires_at < now || now - last_seen_at > IDLE_TTL[user.role]) {
    await db.run('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
    return null;
  }
  if (now - last_seen_at > 60_000) await db.run('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?', [now, tokenHash]);
  return { user, tokenHash };
}

/* ------------------------------------------------------------------ middleware */
/** Every API request must be authenticated, from an active account. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  sessionUser(req)
    .then(async (s) => {
      if (!s) {
        await destroySession(res);
        return res.status(401).json({ error: 'Your session has ended. Please sign in again.' });
      }
      (req as AuthedRequest).user = s.user;
      (req as AuthedRequest).tokenHash = s.tokenHash;
      next();
    })
    .catch(next);
}

/** Users who must change their password can do nothing else until they have. */
export function requirePasswordCurrent(req: Request, res: Response, next: NextFunction) {
  if ((req as AuthedRequest).user.must_change_password)
    return res.status(403).json({ error: 'You must change your password before continuing.', code: 'MUST_CHANGE_PASSWORD' });
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req as AuthedRequest).user.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
  next();
}

/**
 * CSRF defence in depth (on top of SameSite=Strict cookies): state-changing requests must carry a
 * custom header — which cross-site pages cannot send without a CORS preflight we never approve —
 * and, when the browser sends an Origin header, it must be this server's origin.
 */
export function csrfGuard(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Requested-With') !== 'cvforge') return res.status(403).json({ error: 'Request blocked.' });
  const origin = req.get('Origin');
  if (origin) {
    const host = req.get('X-Forwarded-Host') ?? req.get('Host');
    try {
      if (new URL(origin).host !== host) return res.status(403).json({ error: 'Request blocked.' });
    } catch {
      return res.status(403).json({ error: 'Request blocked.' });
    }
  }
  next();
}

/* ------------------------------------------------------------------ public user shape */
export const publicUser = (u: UserRow) => ({
  id: u.id,
  username: u.username,
  role: u.role,
  fullName: u.full_name,
  email: u.email,
  active: !!u.active,
  mustChangePassword: !!u.must_change_password,
  createdAt: u.created_at,
  updatedAt: u.updated_at,
  lastLoginAt: u.last_login_at,
});

/* ------------------------------------------------------------------ initial setup */
export const initialPwFile = () => path.join(dataDir(), 'INITIAL_ADMIN_PASSWORD.txt');

/**
 * First run: creates the single Super Admin. Nothing is hardcoded:
 *  - ADMIN_INITIAL_PASSWORD set (recommended for hosted deployments such as Vercel): that password is used as chosen.
 *  - otherwise a random one-time password is generated, printed to the server log (and written to
 *    data/INITIAL_ADMIN_PASSWORD.txt when the filesystem is writable); it must be changed at first sign-in.
 */
export async function ensureSuperAdmin() {
  const db = await getDb();
  await db.exclusive(async (tx) => {
    if (await tx.get("SELECT id FROM users WHERE role = 'admin'")) return;
    const username = process.env.ADMIN_USERNAME?.trim() || 'admin';
    const chosen = process.env.ADMIN_INITIAL_PASSWORD;
    const password = chosen || generatePassword(18);
    const now = Date.now();
    await tx.run(
      `INSERT INTO users (username, password_hash, role, full_name, active, must_change_password, created_at, updated_at, password_changed_at)
       VALUES (?, ?, 'admin', 'Super Admin', 1, ?, ?, ?, ?)`,
      [username, await hashPassword(password), chosen ? 0 : 1, now, now, now],
    );
    if (!chosen) {
      try {
        fs.mkdirSync(dataDir(), { recursive: true });
        fs.writeFileSync(
          initialPwFile(),
          `CVForge initial Super Admin credentials (one-time)\n\nAdmin login page: /#/admin/login\nUsername: ${username}\nPassword: ${password}\n\nYou will be asked to choose a new password at first sign-in; this file is deleted automatically when you do.\n`,
          { mode: 0o600 },
        );
      } catch {
        /* read-only filesystem (serverless): the server log below is the only copy */
      }
    }
    const line = '='.repeat(64);
    console.log(`\n${line}\n  CVForge - Super Admin account created (first run)\n  Username: ${username}`);
    console.log(chosen ? '  Password: (value of ADMIN_INITIAL_PASSWORD)' : `  One-time password: ${password}\n  (must be changed at first sign-in)`);
    console.log(`  Sign in at /#/admin/login\n${line}\n`);
  });
}

export function removeInitialPasswordFile() {
  try {
    fs.rmSync(initialPwFile(), { force: true });
  } catch {
    /* ignore */
  }
}
