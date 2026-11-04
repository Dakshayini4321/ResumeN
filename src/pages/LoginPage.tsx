import { useState, type FormEvent } from 'react';
import { FileText, KeyRound, Layers, Loader2, LogOut, ScanSearch, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ChangePasswordForm, FormError, PasswordInput } from '../components/account';
import { cx } from '../lib/utils';

type Portal = 'user' | 'admin';

function Brand({ dark }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cx('w-9 h-9 rounded-xl flex items-center justify-center font-bold', dark ? 'bg-white text-slate-900' : 'bg-brand-600 text-white')}>CV</div>
      <span className={cx('font-bold text-lg tracking-tight', dark ? 'text-white' : 'text-slate-900')}>CVForge</span>
    </div>
  );
}

/** Switch between the user and admin sign-in pages. */
function PortalSwitch({ portal, dark }: { portal: Portal; dark?: boolean }) {
  const tabs: [Portal, string, string, typeof UserRound][] = [
    ['user', 'User', '#/login', UserRound],
    ['admin', 'Admin', '#/admin/login', ShieldCheck],
  ];
  return (
    <div
      role="tablist"
      aria-label="Sign in as"
      className={cx('grid grid-cols-2 gap-1 rounded-xl p-1 mb-6', dark ? 'bg-white/10' : 'bg-slate-100')}
    >
      {tabs.map(([id, label, href, Icon]) => {
        const on = id === portal;
        return (
          <a
            key={id}
            href={href}
            role="tab"
            aria-selected={on}
            className={cx(
              'inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition',
              on
                ? dark
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-white text-slate-900 shadow-sm'
                : dark
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-500 hover:text-slate-800',
            )}
          >
            <Icon size={15} /> {label} sign in
          </a>
        );
      })}
    </div>
  );
}

function LoginForm({ portal }: { portal: Portal }) {
  const login = useAuthStore((s) => s.login);
  const notice = useAuthStore((s) => s.notice);
  const clearNotice = useAuthStore((s) => s.clearNotice);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const admin = portal === 'admin';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    clearNotice();
    try {
      const user = await login(username.trim(), password, portal);
      window.location.hash = user.role === 'admin' ? '#/admin' : '#/';
    } catch (err) {
      setError((err as Error).message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {notice && !error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
          {notice}
        </div>
      )}
      <FormError message={error} />
      <div>
        <label className="label" htmlFor="login-username">
          Username
        </label>
        <input
          id="login-username"
          className="input py-2.5"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="login-password">
          Password
        </label>
        <PasswordInput
          id="login-password"
          className="py-2.5"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        disabled={busy || !username.trim() || !password}
        className={cx('btn w-full py-2.5 text-white shadow-sm', admin ? 'bg-slate-900 hover:bg-slate-800' : 'bg-brand-600 hover:bg-brand-700')}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : admin ? <ShieldCheck size={16} /> : null}
        {admin ? 'Sign in to admin' : 'Sign in'}
      </button>
      <p className="text-xs text-slate-500 text-center">
        {admin ? 'Forgot the admin password? Run “npm run admin:reset” on the server.' : 'Accounts are created by your administrator. Forgot your password? Ask them to reset it.'}
      </p>
    </form>
  );
}

export function LoginPage({ portal }: { portal: Portal }) {
  if (portal === 'admin')
    return (
      <div className="relative min-h-full bg-slate-950 flex flex-col">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-brand-600/20 blur-3xl" />
        </div>
        <header className="relative px-4 sm:px-8 h-16 flex items-center">
          <Brand dark />
        </header>
        <main className="relative flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm">
            <PortalSwitch portal="admin" dark />
            <div className="text-center mb-6">
              <span className="inline-flex w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 items-center justify-center mb-4">
                <ShieldCheck size={24} />
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Admin console</h1>
              <p className="text-sm text-slate-400 mt-1">Restricted to the CVForge Super Admin.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-7">
              <LoginForm portal="admin" />
            </div>
          </div>
        </main>
      </div>
    );

  return (
    <div className="min-h-full grid lg:grid-cols-[1.05fr_1fr] bg-white">
      <aside className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 text-white p-12 relative overflow-hidden">
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-white/10 blur-2xl" />
        <Brand dark />
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Build a CV that gets you the interview.</h2>
          <p className="mt-4 text-white/75">Write your details once, then switch between professional templates instantly.</p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              [ScanSearch, '7 ATS-friendly templates recruiters’ systems can read'],
              [Sparkles, '3 modern professional designs with photo'],
              [Layers, 'Live preview, autosave, undo and redo'],
              [FileText, 'Clean A4 PDF and Word downloads'],
            ].map(([Icon, text]) => {
              const I = Icon as typeof ScanSearch;
              return (
                <li key={text as string} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <I size={16} />
                  </span>
                  {text as string}
                </li>
              );
            })}
          </ul>
        </div>
        <p className="relative text-xs text-white/50">Your CVs are private to your account.</p>
      </aside>
      <main className="flex flex-col min-h-full">
        <div className="lg:hidden px-5 h-16 flex items-center border-b border-slate-100">
          <Brand />
        </div>
        <div className="flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-sm">
            <PortalSwitch portal="user" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-slate-500 mt-1 mb-7">Sign in with the username and password from your administrator.</p>
            <LoginForm portal="user" />
          </div>
        </div>
      </main>
    </div>
  );
}

/** Shown after sign-in when the account still has a temporary / default password. Nothing else is reachable until it's changed (enforced by the server). */
export function ForcePasswordChange() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const admin = user?.role === 'admin';
  return (
    <div className={cx('min-h-full flex flex-col', admin ? 'bg-slate-950' : 'bg-slate-50')}>
      <header className="px-4 sm:px-8 h-16 flex items-center justify-between">
        <Brand dark={admin} />
        <button
          className={cx('inline-flex items-center gap-1.5 text-sm', admin ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')}
          onClick={() => logout().then(() => (window.location.hash = admin ? '#/admin/login' : '#/login'))}
        >
          <LogOut size={15} /> Sign out
        </button>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 sm:p-7">
          <span className="inline-flex w-11 h-11 rounded-xl bg-brand-50 text-brand-600 items-center justify-center mb-4">
            <KeyRound size={20} />
          </span>
          <h1 className="text-xl font-bold text-slate-900">Set a new password</h1>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            {admin
              ? 'You signed in with the one-time setup password. Choose your own password to open the admin console.'
              : 'Your administrator gave you a temporary password. Choose your own to continue.'}
          </p>
          <ChangePasswordForm onDone={() => (window.location.hash = admin ? '#/admin' : '#/')} submitLabel="Save and continue" />
        </div>
      </main>
    </div>
  );
}
