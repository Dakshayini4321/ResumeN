import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useActiveResume, useResumeStore } from './store/useResumeStore';
import { useAuthStore } from './store/useAuthStore';
import { Dashboard } from './pages/Dashboard';
import { EditorPage } from './pages/EditorPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ForcePasswordChange, LoginPage } from './pages/LoginPage';
import { ResumeRenderer } from './templates/registry';
import { exampleResume, longSampleResume } from './lib/fixtures';
import type { PhotoShape } from './types/resume';
import { cvFilename, setPrintTitle } from './lib/print';

type Route =
  | { kind: 'login' }
  | { kind: 'admin-login' }
  | { kind: 'admin' }
  | { kind: 'dashboard' }
  | { kind: 'edit'; id: string }
  | { kind: 'render'; template: string; photo: boolean; shape: string; sample: boolean };

const parseHash = (): Route => {
  const h = window.location.hash;
  if (/^#\/login\b/.test(h)) return { kind: 'login' };
  if (/^#\/admin\/login\b/.test(h)) return { kind: 'admin-login' };
  if (/^#\/admin\b/.test(h)) return { kind: 'admin' };
  const edit = /^#\/edit\/([\w-]+)/.exec(h);
  if (edit) return { kind: 'edit', id: edit[1] };
  // Test-only route (identical sample data in any template, for automated PDF checks) — development builds only.
  const render = import.meta.env.DEV ? /^#\/render\/([\w-]+)(?:\?(.*))?$/.exec(h) : null;
  if (render) {
    const q = new URLSearchParams(render[2] ?? '');
    return { kind: 'render', template: render[1], photo: q.get('photo') === '1', shape: q.get('shape') ?? '', sample: q.get('data') === 'sample' };
  }
  return { kind: 'dashboard' };
};

const go = (hash: string) => {
  if (window.location.hash !== hash) window.location.hash = hash;
};

function FullScreen({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full flex items-center justify-center p-6 text-slate-500">{children}</div>;
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const init = useAuthStore((s) => s.init);
  const loadState = useResumeStore((s) => s.loadState);
  const resumes = useResumeStore((s) => s.resumes);
  const loadResumes = useResumeStore((s) => s.load);
  const setActive = useResumeStore((s) => s.setActive);
  const active = useActiveResume();

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (route.kind !== 'render') init();
    document.body.classList.toggle('render-route', route.kind === 'render');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.kind === 'render']);

  const ready = status === 'authed' && !!user && !user.mustChangePassword;
  const builderRoute = route.kind === 'dashboard' || route.kind === 'edit';

  // Signed-in users never sit on a login page.
  useEffect(() => {
    if (status === 'authed' && user && (route.kind === 'login' || route.kind === 'admin-login')) go(user.role === 'admin' ? '#/admin' : '#/');
  }, [status, user, route.kind]);

  // Load this user's resumes from the server when they open the builder.
  useEffect(() => {
    if (ready && builderRoute && loadState === 'idle') loadResumes();
  }, [ready, builderRoute, loadState, loadResumes]);

  // route -> active resume
  useEffect(() => {
    if (route.kind === 'edit') {
      if (loadState !== 'ready') return;
      if (resumes.some((r) => r.id === route.id)) setActive(route.id);
      else {
        setActive(null);
        go('#/');
      }
    } else setActive(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, loadState]);

  const open = useCallback((id: string) => go(`#/edit/${id}`), []);
  const back = useCallback(() => go('#/'), []);

  const fixture = useMemo(() => {
    if (route.kind !== 'render') return null;
    const r = route.sample ? exampleResume(route.template, route.photo) : longSampleResume(route.template, route.photo);
    if (route.shape) r.settings.photoShape = route.shape as PhotoShape;
    return r;
  }, [route]);

  // Whatever starts a print (our buttons, Ctrl+P, the browser menu), the PDF title / file name is the CV's own name.
  const printSource = fixture ?? active;
  useEffect(() => {
    if (!printSource) return;
    const name = cvFilename(printSource);
    if (fixture) {
      setPrintTitle(name);
      return () => setPrintTitle(null);
    }
    const before = () => setPrintTitle(name);
    const after = () => setPrintTitle(null);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, [printSource, fixture]);

  if (fixture) {
    return (
      <div id="print-root" className="bg-slate-200 print:bg-white">
        <ResumeRenderer resume={fixture} />
      </div>
    );
  }

  let page: React.ReactNode;
  if (status === 'loading')
    page = (
      <FullScreen>
        <Loader2 className="animate-spin" />
      </FullScreen>
    );
  else if (status === 'anon' || !user) page = <LoginPage portal={route.kind === 'admin' || route.kind === 'admin-login' ? 'admin' : 'user'} />;
  else if (user.mustChangePassword) page = <ForcePasswordChange />;
  else if (route.kind === 'login' || route.kind === 'admin-login') page = null; // redirecting
  else if (route.kind === 'admin') {
    page =
      user.role === 'admin' ? (
        <AdminDashboard />
      ) : (
        <FullScreen>
          <div className="text-center max-w-sm">
            <ShieldAlert className="mx-auto text-rose-500" size={36} />
            <h1 className="mt-3 text-xl font-semibold text-slate-900">Access denied</h1>
            <p className="mt-1 text-sm">The admin console is only available to administrators.</p>
            <a href="#/" className="btn-primary mt-5">
              Back to my CVs
            </a>
          </div>
        </FullScreen>
      );
  } else if (loadState === 'error')
    page = (
      <FullScreen>
        <div className="text-center">
          <p>Couldn’t load your CVs.</p>
          <button className="btn-primary mt-4" onClick={() => loadResumes()}>
            Try again
          </button>
        </div>
      </FullScreen>
    );
  else if (loadState !== 'ready')
    page = (
      <FullScreen>
        <Loader2 className="animate-spin" />
      </FullScreen>
    );
  else page = route.kind === 'edit' && active ? <EditorPage resume={active} onBack={back} /> : <Dashboard onOpen={open} />;

  return (
    <>
      <div className="h-full">{page}</div>
      {/* Hidden full-size render used for Print / PDF */}
      <div id="print-root">{ready && active && <ResumeRenderer resume={active} />}</div>
    </>
  );
}
