import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { Check, ChevronDown, Eye, EyeOff, KeyRound, LayoutDashboard, LogOut, Loader2, ShieldCheck, X } from 'lucide-react';
import { passwordProblem } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { cx } from '../lib/utils';
import { Dropdown, MenuItem, Modal } from './ui';

export function PasswordInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? 'text' : 'password'} className={cx('input pr-10', className)} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

/** Live checklist that mirrors the server's password policy. */
export function PasswordRules({ password, username }: { password: string; username?: string }) {
  const rules: [string, boolean][] = [
    ['8+ characters', password.length >= 8],
    ['3 of: a–z, A–Z, 0–9, symbol', [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length >= 3],
  ];
  if (username && username.length >= 3) rules.push(['Doesn’t contain the username', !!password && !password.toLowerCase().includes(username.toLowerCase())]);
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {rules.map(([label, ok]) => (
        <li key={label} className={cx('inline-flex items-center gap-1 text-xs', ok ? 'text-emerald-600' : 'text-slate-400')}>
          {ok ? <Check size={12} /> : <X size={12} />} {label}
        </li>
      ))}
    </ul>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
      {message}
    </div>
  );
}

/** Change-password form used both for the forced first-login change and from the account menu. */
export function ChangePasswordForm({ onDone, submitLabel = 'Update password' }: { onDone: () => void; submitLabel?: string }) {
  const user = useAuthStore((s) => s.user);
  const changePassword = useAuthStore((s) => s.changePassword);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isAdmin = user?.role === 'admin';
  // The Super Admin is exempt from the strength rules (length only) — mirrors the server.
  const problem = isAdmin ? (next.length < 4 ? 'At least 4 characters' : null) : passwordProblem(next, user?.username);
  const mismatch = confirm.length > 0 && confirm !== next;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (problem) return setError(`New password: ${problem.toLowerCase()}.`);
    if (next !== confirm) return setError('The new passwords don’t match.');
    setBusy(true);
    setError(null);
    try {
      await changePassword(current, next);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormError message={error} />
      <div>
        <label className="label" htmlFor="cp-current">
          Current password
        </label>
        <PasswordInput id="cp-current" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="cp-new">
          New password
        </label>
        <PasswordInput id="cp-new" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
        {isAdmin ? <p className="mt-1.5 text-xs text-slate-400">At least 4 characters.</p> : <PasswordRules password={next} username={user?.username} />}
      </div>
      <div>
        <label className="label" htmlFor="cp-confirm">
          Confirm new password
        </label>
        <PasswordInput id="cp-confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        {mismatch && <p className="mt-1.5 text-xs text-rose-600">Passwords don’t match</p>}
      </div>
      <button type="submit" className="btn-primary w-full py-2.5" disabled={busy || !current || !next || !confirm}>
        {busy && <Loader2 size={16} className="animate-spin" />} {submitLabel}
      </button>
      <p className="text-xs text-slate-500 text-center">You’ll stay signed in here; other devices will be signed out.</p>
    </form>
  );
}

export function ChangePasswordModal({ open, onClose, onChanged }: { open: boolean; onClose: () => void; onChanged: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Change password" subtitle="Choose a strong password you don’t use elsewhere.">
      {open && <ChangePasswordForm onDone={onChanged} />}
    </Modal>
  );
}

export const initials = (name: string) =>
  name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('') || '?';

/** Avatar menu: who's signed in, change password (if allowed), admin link, sign out. */
export function UserMenu({ onToast, variant = 'light' }: { onToast?: (m: string) => void; variant?: 'light' | 'dark' }) {
  const user = useAuthStore((s) => s.user);
  const allowChange = useAuthStore((s) => s.settings.allowPasswordChange);
  const logout = useAuthStore((s) => s.logout);
  const [changing, setChanging] = useState(false);
  if (!user) return null;
  const isAdmin = user.role === 'admin';
  const display = user.fullName || user.username;
  return (
    <>
      <Dropdown
        trigger={(open) => (
          <button
            className={cx(
              'flex items-center gap-2 rounded-full pl-1 pr-2 py-1 transition',
              variant === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-700',
            )}
            aria-label="Account menu"
          >
            <span
              className={cx(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold',
                isAdmin ? 'bg-amber-500 text-white' : 'bg-brand-100 text-brand-700',
              )}
            >
              {initials(display)}
            </span>
            <span className="hidden md:block text-sm font-medium max-w-[140px] truncate">{display}</span>
            <ChevronDown size={14} className={cx('transition-transform opacity-60', open && 'rotate-180')} />
          </button>
        )}
      >
        {(close) => (
          <>
            <div className="px-3 py-2.5 border-b border-slate-100 mb-1 min-w-[220px]">
              <div className="text-sm font-semibold text-slate-900 truncate">{display}</div>
              <div className="text-xs text-slate-500 truncate">@{user.username}</div>
              {isAdmin && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-medium">
                  <ShieldCheck size={11} /> Super Admin
                </span>
              )}
            </div>
            {isAdmin && (
              <>
                <MenuItem icon={<ShieldCheck size={15} />} onClick={() => (close(), (window.location.hash = '#/admin'))}>
                  Admin dashboard
                </MenuItem>
                <MenuItem icon={<LayoutDashboard size={15} />} onClick={() => (close(), (window.location.hash = '#/'))}>
                  My CVs
                </MenuItem>
              </>
            )}
            {(isAdmin || allowChange) && (
              <MenuItem icon={<KeyRound size={15} />} onClick={() => (close(), setChanging(true))}>
                Change password
              </MenuItem>
            )}
            <div className="my-1 border-t border-slate-100" />
            <MenuItem
              icon={<LogOut size={15} />}
              onClick={() => {
                close();
                logout().then(() => (window.location.hash = isAdmin ? '#/admin/login' : '#/login'));
              }}
            >
              Sign out
            </MenuItem>
          </>
        )}
      </Dropdown>
      <ChangePasswordModal
        open={changing}
        onClose={() => setChanging(false)}
        onChanged={() => {
          setChanging(false);
          onToast?.('Password updated');
        }}
      />
    </>
  );
}
