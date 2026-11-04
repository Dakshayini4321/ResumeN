import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { getDb } from './db.ts';

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, keylen: number, opts: crypto.ScryptOptions) => Promise<Buffer>;

/* ------------------------------------------------------------------
   Password hashing — scrypt (memory-hard), random 16-byte salt per password.
   Stored format: scrypt$N$r$p$salt(base64)$hash(base64)
   ------------------------------------------------------------------ */
const N = 2 ** 15;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 128 * N * R * 2;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password.normalize('NFKC'), salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, saltB64, hashB64] = stored.split('$');
  if (algo !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 128 * Number(n) * Number(r) * 2,
  });
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/** A valid hash of a random password: verified against when a username doesn't exist, so response timing doesn't reveal which usernames exist. */
let dummyHash: Promise<string> | null = null;
export const getDummyHash = () => (dummyHash ??= hashPassword(crypto.randomBytes(16).toString('hex')));

/* ------------------------------------------------------------------ */
export const newToken = () => crypto.randomBytes(32).toString('base64url');
export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

/** Readable random password (no ambiguous characters) for generated credentials. */
export function generatePassword(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#%*?';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

/* ------------------------------------------------------------------
   Validation
   ------------------------------------------------------------------ */
export const USERNAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,31}$/;
export const usernameError = (u: unknown) =>
  typeof u !== 'string' || !USERNAME_RE.test(u)
    ? 'Username must be 3–32 characters: letters, numbers, dots, dashes or underscores, starting with a letter or number.'
    : null;

export function passwordError(pw: unknown, username?: string): string | null {
  if (typeof pw !== 'string') return 'Password is required.';
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (pw.length > 128) return 'Password must be at most 128 characters.';
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(pw)).length;
  if (classes < 3) return 'Password must mix at least three of: lowercase, uppercase, numbers, symbols.';
  if (username && pw.toLowerCase().includes(username.toLowerCase())) return 'Password must not contain the username.';
  return null;
}

/** The Super Admin account is exempt from the strength rules (owner's decision); only a length check applies. */
export function adminPasswordError(pw: unknown): string | null {
  if (typeof pw !== 'string' || pw.length < 4) return 'Password must be at least 4 characters.';
  if (pw.length > 128) return 'Password must be at most 128 characters.';
  return null;
}

export const cleanText = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ------------------------------------------------------------------
   Login throttling — stored in the database so it holds across serverless instances and restarts.
   Per username: 5 failures / 15 min and 20 failures / 24 h. Per IP: 20 failures / 15 min.
   ------------------------------------------------------------------ */
const MIN = 60 * 1000;
const LIMITS = (ip: string, username: string) => {
  const u = username.toLowerCase().slice(0, 64);
  return [
    { key: `u:${u}`, max: 5, window: 15 * MIN },
    { key: `d:${u}`, max: 20, window: 24 * 60 * MIN },
    { key: `ip:${ip}`, max: 20, window: 15 * MIN },
  ];
};

/** Returns seconds to wait if the login attempt must be refused, else 0. */
export async function loginBlocked(ip: string, username: string): Promise<number> {
  const db = await getDb();
  const now = Date.now();
  let wait = 0;
  for (const l of LIMITS(ip, username)) {
    const row = await db.get<{ count: number; reset_at: number }>('SELECT count, reset_at FROM login_failures WHERE key = ?', [l.key]);
    if (row && row.reset_at > now && row.count >= l.max) wait = Math.max(wait, Math.ceil((row.reset_at - now) / 1000));
  }
  return wait;
}

export async function recordLoginFailure(ip: string, username: string) {
  const db = await getDb();
  const now = Date.now();
  for (const l of LIMITS(ip, username))
    await db.run(
      `INSERT INTO login_failures (key, count, reset_at) VALUES (?, 1, ?)
       ON CONFLICT (key) DO UPDATE SET
         count    = CASE WHEN login_failures.reset_at < ? THEN 1 ELSE login_failures.count + 1 END,
         reset_at = CASE WHEN login_failures.reset_at < ? THEN excluded.reset_at ELSE login_failures.reset_at END`,
      [l.key, now + l.window, now, now],
    );
  if (Math.random() < 0.05) await db.run('DELETE FROM login_failures WHERE reset_at < ?', [now]); // occasional cleanup
}

/** After a successful sign-in (or an admin reset), the short-window username counter starts over. The 24 h cap stays. */
export async function clearLoginFailures(username: string, includeDaily = false) {
  const db = await getDb();
  const u = username.toLowerCase();
  await db.run('DELETE FROM login_failures WHERE key = ? OR key = ?', [`u:${u}`, includeDaily ? `d:${u}` : `u:${u}`]);
}
