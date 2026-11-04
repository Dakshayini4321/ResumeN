/** Thin client for the CVForge API. Auth is an HttpOnly session cookie the page can't read. */

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type UnauthorizedHandler = (message: string) => void;
let onUnauthorized: UnauthorizedHandler = () => {};
let onMustChange: () => void = () => {};
/** Called when any request finds the session gone (expired, signed out, account deactivated/deleted). */
export const setUnauthorizedHandler = (fn: UnauthorizedHandler) => (onUnauthorized = fn);
export const setMustChangeHandler = (fn: () => void) => (onMustChange = fn);

export async function api<T>(method: string, url: string, body?: unknown, opts: { keepalive?: boolean; quiet401?: boolean } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${url}`, {
      method,
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'cvforge', ...(body !== undefined && { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      keepalive: opts.keepalive,
    });
  } catch {
    throw new ApiError(0, 'Can’t reach the server. Check your connection and try again.');
  }
  let json: { error?: string; code?: string } & Record<string, unknown> = {};
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const err = new ApiError(res.status, json.error ?? `Request failed (${res.status})`, json.code);
    if (res.status === 401 && !opts.quiet401) onUnauthorized(err.message);
    if (err.code === 'MUST_CHANGE_PASSWORD') onMustChange();
    throw err;
  }
  return json as T;
}

/* ---------------- types shared with the server ---------------- */
export type Role = 'admin' | 'user';
export interface User {
  id: number;
  username: string;
  role: Role;
  fullName: string;
  email: string;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number | null;
}
export interface AdminUser extends User {
  resumeCount: number;
  signedIn: boolean;
}
export interface AppSettings {
  allowPasswordChange: boolean;
}
export interface AuthPayload {
  user: User;
  settings: AppSettings;
}

/** Client-side mirror of the server's password policy, for instant feedback (the server re-checks). */
export function passwordProblem(pw: string, username?: string): string | null {
  if (pw.length < 8) return 'At least 8 characters';
  if (pw.length > 128) return 'At most 128 characters';
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(pw)).length;
  if (classes < 3) return 'Mix at least three of: lowercase, uppercase, numbers, symbols';
  if (username && username.length >= 3 && pw.toLowerCase().includes(username.toLowerCase())) return 'Must not contain the username';
  return null;
}

export function generatePassword(length = 14): string {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#%*?'];
  const all = sets.join('');
  const rnd = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  const chars = sets.map((s) => s[rnd(s.length)]);
  while (chars.length < length) chars.push(all[rnd(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
