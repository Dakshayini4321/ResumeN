import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  Ban,
  CheckCircle2,
  Copy,
  FileText,
  KeyRound,
  Loader2,
  LogOut,
  MoreHorizontal,
  PenLine,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Wand2,
} from 'lucide-react';
import { api, generatePassword, passwordProblem, type AdminUser, type AppSettings } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { FormError, PasswordInput, PasswordRules, UserMenu, initials } from '../components/account';
import { ConfirmDialog, Dropdown, MenuItem, Modal, Toast, Toggle } from '../components/ui';
import { cx, timeAgo } from '../lib/utils';

type Filter = 'all' | 'active' | 'inactive';

const fmtDate = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export function AdminDashboard() {
  const me = useAuthStore((s) => s.user);
  const setSettings = useAuthStore((s) => s.setSettings);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [settings, setLocalSettings] = useState<AppSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [toast, setToast] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [deactivating, setDeactivating] = useState<AdminUser | null>(null);
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await api<{ users: AdminUser[]; settings: AppSettings }>('GET', '/admin/users');
      setUsers(res.users);
      setLocalSettings(res.settings);
      setLoadError(null);
    } catch (e) {
      setLoadError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      setToast(success);
    } catch (e) {
      setToast((e as Error).message);
    }
    refresh();
  };

  const regular = users?.filter((u) => u.role === 'user') ?? [];
  const stats = [
    { label: 'Users', value: regular.length, icon: Users, tone: 'bg-brand-50 text-brand-600' },
    { label: 'Active', value: regular.filter((u) => u.active).length, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Deactivated', value: regular.filter((u) => !u.active).length, icon: Ban, tone: 'bg-rose-50 text-rose-600' },
    { label: 'CVs created', value: regular.reduce((n, u) => n + u.resumeCount, 0), icon: FileText, tone: 'bg-violet-50 text-violet-600' },
  ];

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users ?? []).filter(
      (u) =>
        (filter === 'all' || (filter === 'active' ? u.active : !u.active)) &&
        (!q || [u.username, u.fullName, u.email].some((v) => v.toLowerCase().includes(q))),
    );
  }, [users, query, filter]);

  const toggleAllowChange = (v: boolean) =>
    run(async () => {
      const res = await api<{ settings: AppSettings }>('PUT', '/admin/settings', { allowPasswordChange: v });
      setLocalSettings(res.settings);
      setSettings(res.settings);
    }, v ? 'Users can now change their passwords' : 'Password changes are now admin-only');

  const actions = (u: AdminUser) => (
    <Dropdown
      trigger={() => (
        <button className="btn-icon" aria-label={`Actions for ${u.username}`}>
          <MoreHorizontal size={18} />
        </button>
      )}
    >
      {(close) => (
        <>
          <MenuItem icon={<PenLine size={15} />} onClick={() => (close(), setEditing(u))}>
            Edit details
          </MenuItem>
          {u.role === 'user' && (
            <>
              <MenuItem icon={<KeyRound size={15} />} onClick={() => (close(), setResetting(u))}>
                Reset password
              </MenuItem>
              {u.signedIn && (
                <MenuItem
                  icon={<LogOut size={15} />}
                  onClick={() => (close(), run(() => api('POST', `/admin/users/${u.id}/sign-out`), `${u.username} signed out everywhere`))}
                >
                  Sign out everywhere
                </MenuItem>
              )}
              {u.active ? (
                <MenuItem icon={<Ban size={15} />} onClick={() => (close(), setDeactivating(u))}>
                  Deactivate
                </MenuItem>
              ) : (
                <MenuItem
                  icon={<CheckCircle2 size={15} />}
                  onClick={() => (close(), run(() => api('PATCH', `/admin/users/${u.id}`, { active: true }), `${u.username} activated`))}
                >
                  Activate
                </MenuItem>
              )}
              <div className="my-1 border-t border-slate-100" />
              <MenuItem icon={<Trash2 size={15} />} danger onClick={() => (close(), setDeleting(u))}>
                Delete user
              </MenuItem>
            </>
          )}
        </>
      )}
    </Dropdown>
  );

  return (
    <div className="min-h-full bg-slate-50">
      <header className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white text-slate-900 flex items-center justify-center font-bold">CV</div>
          <span className="font-bold text-lg tracking-tight">CVForge</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-300 px-2.5 py-1 text-xs font-medium">
            <ShieldCheck size={12} /> Admin
          </span>
          <div className="ml-auto">
            <UserMenu variant="dark" onToast={setToast} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">User management</h1>
            <p className="text-slate-500 mt-1">Create accounts, reset passwords and control who can use CVForge.</p>
          </div>
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <UserPlus size={16} /> New user
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="card p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
              <span className={cx('w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0', tone)}>
                <Icon size={20} />
              </span>
              <div className="min-w-0">
                <div className="text-2xl font-bold text-slate-900 leading-none">{users ? value : '–'}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1 truncate">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Users */}
          <section className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9" placeholder="Search name, username or email" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <div className="inline-flex rounded-lg bg-slate-100 p-1">
                  {(['all', 'active', 'inactive'] as Filter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cx(
                        'px-3 py-1 rounded-md text-sm font-medium capitalize',
                        filter === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800',
                      )}
                    >
                      {f === 'inactive' ? 'Deactivated' : f}
                    </button>
                  ))}
                </div>
                <button className="btn-icon w-9 h-9" onClick={refresh} title="Refresh" aria-label="Refresh">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {loadError && <div className="p-4"><FormError message={loadError} /></div>}
            {!users && !loadError && (
              <div className="p-10 flex justify-center text-slate-400">
                <Loader2 className="animate-spin" />
              </div>
            )}
            {users && shown.length === 0 && (
              <div className="p-10 text-center">
                <Users className="mx-auto text-slate-300" size={32} />
                <p className="mt-2 text-sm text-slate-500">{regular.length === 0 ? 'No users yet — create the first account.' : 'No users match your search.'}</p>
              </div>
            )}

            {users && shown.length > 0 && (
              <>
                {/* Desktop table */}
                <table className="hidden md:table w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50/80">
                      <th className="px-4 py-2.5 font-medium">User</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium text-center">CVs</th>
                      <th className="px-4 py-2.5 font-medium">Last sign-in</th>
                      <th className="px-4 py-2.5 font-medium">Created</th>
                      <th className="px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shown.map((u) => (
                      <tr key={u.id} className={cx('hover:bg-slate-50/60', !u.active && 'bg-slate-50/50')}>
                        <td className="px-4 py-3">
                          <UserCell u={u} isMe={u.id === me?.id} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusPills u={u} />
                        </td>
                        <td className="px-4 py-3 text-center text-slate-700">{u.resumeCount}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never'}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                        <td className="px-2 py-3 text-right">{actions(u)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Mobile cards */}
                <ul className="md:hidden divide-y divide-slate-100">
                  {shown.map((u) => (
                    <li key={u.id} className="p-4 flex gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <UserCell u={u} isMe={u.id === me?.id} />
                        <StatusPills u={u} />
                        <div className="text-xs text-slate-500">
                          {u.resumeCount} CV{u.resumeCount === 1 ? '' : 's'} · Last sign-in {u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'never'}
                        </div>
                      </div>
                      {actions(u)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* Settings */}
          <aside className="space-y-6">
            <section className="card p-5">
              <h2 className="font-semibold text-slate-900">Security settings</h2>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-800">Users can change their password</div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    When off, only you can set user passwords. Users still must replace a temporary password if you require it.
                  </p>
                </div>
                <Toggle checked={!!settings?.allowPasswordChange} onChange={toggleAllowChange} label="Users can change their password" />
              </div>
            </section>
            <section className="card p-5 text-sm text-slate-600 space-y-2.5">
              <h2 className="font-semibold text-slate-900">How access works</h2>
              <p>Users sign in at the main login page with the username and password you give them, and only ever see their own CVs.</p>
              <p>Deactivating, deleting or resetting a password signs that user out immediately on every device.</p>
              <p>Deleting a user permanently removes their CVs.</p>
            </section>
          </aside>
        </div>
      </main>

      <UserFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(username, password) => {
          setCreating(false);
          setCreated({ username, password: password! });
          refresh();
        }}
      />
      <UserFormModal
        open={!!editing}
        user={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setToast('User updated');
          refresh();
        }}
      />
      <ResetPasswordModal
        user={resetting}
        onClose={() => setResetting(null)}
        onDone={(password) => {
          const u = resetting!;
          setResetting(null);
          setCreated({ username: u.username, password });
          refresh();
        }}
      />
      <CredentialsModal creds={created} onClose={() => setCreated(null)} />
      <ConfirmDialog
        open={!!deactivating}
        title={`Deactivate ${deactivating?.username}?`}
        message="They will be signed out immediately and won’t be able to sign in until you activate the account again. Their CVs are kept."
        confirmLabel="Deactivate"
        onCancel={() => setDeactivating(null)}
        onConfirm={() => {
          const u = deactivating!;
          setDeactivating(null);
          run(() => api('PATCH', `/admin/users/${u.id}`, { active: false }), `${u.username} deactivated`);
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${deleting?.username}?`}
        message={`This permanently deletes the account and its ${deleting?.resumeCount ?? 0} CV(s). They will be signed out immediately. This can’t be undone.`}
        confirmLabel="Delete user"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          const u = deleting!;
          setDeleting(null);
          run(() => api('DELETE', `/admin/users/${u.id}`), `${u.username} deleted`);
        }}
      />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function UserCell({ u, isMe }: { u: AdminUser; isMe: boolean }) {
  const admin = u.role === 'admin';
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span
        className={cx(
          'w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
          admin ? 'bg-amber-500 text-white' : u.active ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500',
        )}
      >
        {initials(u.fullName || u.username)}
      </span>
      <div className="min-w-0">
        <div className="font-medium text-slate-900 truncate">
          {u.fullName || u.username}
          {isMe && <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>}
        </div>
        <div className="text-xs text-slate-500 truncate">
          @{u.username}
          {u.email && <> · {u.email}</>}
        </div>
      </div>
    </div>
  );
}

const Pill = ({ tone, children }: { tone: string; children: ReactNode }) => (
  <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', tone)}>{children}</span>
);

function StatusPills({ u }: { u: AdminUser }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {u.role === 'admin' ? (
        <Pill tone="bg-amber-50 text-amber-700">
          <ShieldCheck size={11} /> Super Admin
        </Pill>
      ) : u.active ? (
        <Pill tone="bg-emerald-50 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
        </Pill>
      ) : (
        <Pill tone="bg-rose-50 text-rose-700">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Deactivated
        </Pill>
      )}
      {u.mustChangePassword && <Pill tone="bg-sky-50 text-sky-700">Temp password</Pill>}
    </div>
  );
}

/* ------------------------------------------------------------------ create / edit */
function UserFormModal({
  open,
  user,
  onClose,
  onSaved,
}: {
  open: boolean;
  user?: AdminUser;
  onClose: () => void;
  onSaved: (username: string, password?: string) => void;
}) {
  const editing = !!user;
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mustChange, setMustChange] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUsername(user?.username ?? '');
    setFullName(user?.fullName ?? '');
    setEmail(user?.email ?? '');
    setPassword('');
    setMustChange(true);
    setError(null);
  }, [open, user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) {
      const p = passwordProblem(password, username);
      if (p) return setError(`Password: ${p.toLowerCase()}.`);
    }
    setBusy(true);
    setError(null);
    try {
      if (editing) await api('PATCH', `/admin/users/${user!.id}`, { username: username.trim(), fullName, email });
      else await api('POST', '/admin/users', { username: username.trim(), password, fullName, email, mustChangePassword: mustChange });
      onSaved(username.trim(), editing ? undefined : password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${user!.username}` : 'Create user'}
      subtitle={editing ? 'Update sign-in name and profile details.' : 'The user signs in with this username and password.'}
    >
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <div>
          <label className="label" htmlFor="uf-username">
            Username
          </label>
          <input
            id="uf-username"
            className="input"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. jane.doe"
            required
            autoFocus
          />
          <p className="mt-1 text-xs text-slate-400">3–32 characters: letters, numbers, . _ -</p>
        </div>
        {!editing && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label !mb-0" htmlFor="uf-password">
                Password
              </label>
              <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700" onClick={() => setPassword(generatePassword())}>
                <Wand2 size={12} /> Generate
              </button>
            </div>
            <PasswordInput id="uf-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <PasswordRules password={password} username={username} />
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="uf-name">
              Full name <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input id="uf-name" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} />
          </div>
          <div>
            <label className="label" htmlFor="uf-email">
              Email <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input id="uf-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} />
          </div>
        </div>
        {!editing && (
          <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" className="mt-0.5 accent-brand-600" checked={mustChange} onChange={(e) => setMustChange(e.target.checked)} />
            <span>
              Require a new password at first sign-in
              <span className="block text-xs text-slate-500">Recommended, so only the user knows their password.</span>
            </span>
          </label>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy || !username.trim() || (!editing && !password)}>
            {busy && <Loader2 size={16} className="animate-spin" />} {editing ? 'Save changes' : 'Create user'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ reset password */
function ResetPasswordModal({ user, onClose, onDone }: { user: AdminUser | null; onClose: () => void; onDone: (password: string) => void }) {
  const [password, setPassword] = useState('');
  const [mustChange, setMustChange] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user) {
      setPassword(generatePassword());
      setMustChange(true);
      setError(null);
    }
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const p = passwordProblem(password, user!.username);
    if (p) return setError(`Password: ${p.toLowerCase()}.`);
    setBusy(true);
    try {
      await api('POST', `/admin/users/${user!.id}/reset-password`, { password, mustChangePassword: mustChange });
      onDone(password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!user} onClose={onClose} title={`Reset password for ${user?.username}`} subtitle="They’ll be signed out everywhere and must use the new password.">
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label !mb-0" htmlFor="rp-password">
              New password
            </label>
            <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700" onClick={() => setPassword(generatePassword())}>
              <Wand2 size={12} /> Generate
            </button>
          </div>
          <PasswordInput id="rp-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <PasswordRules password={password} username={user?.username} />
        </div>
        <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" className="mt-0.5 accent-brand-600" checked={mustChange} onChange={(e) => setMustChange(e.target.checked)} />
          <span>Require them to choose a new password at next sign-in</span>
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy || !password}>
            {busy && <Loader2 size={16} className="animate-spin" />} Reset password
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ show credentials once */
function CredentialsModal({ creds, onClose }: { creds: { username: string; password: string } | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => setCopied(false), [creds]);
  const copy = async () => {
    if (!creds) return;
    try {
      await navigator.clipboard.writeText(`Username: ${creds.username}\nPassword: ${creds.password}\nSign in: ${location.origin}${location.pathname}#/login`);
      setCopied(true);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <Modal
      open={!!creds}
      onClose={onClose}
      title="Sign-in details ready"
      subtitle="Share these privately with the user. The password won’t be shown again."
      footer={
        <>
          <button className="btn-secondary" onClick={copy}>
            <Copy size={15} /> {copied ? 'Copied' : 'Copy details'}
          </button>
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <dl className="rounded-lg border border-slate-200 divide-y divide-slate-100 text-sm">
        <div className="flex justify-between gap-4 px-3 py-2.5">
          <dt className="text-slate-500">Username</dt>
          <dd className="font-mono font-medium text-slate-900">{creds?.username}</dd>
        </div>
        <div className="flex justify-between gap-4 px-3 py-2.5">
          <dt className="text-slate-500">Password</dt>
          <dd className="font-mono font-medium text-slate-900 break-all text-right">{creds?.password}</dd>
        </div>
      </dl>
    </Modal>
  );
}
