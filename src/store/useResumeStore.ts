import { create } from 'zustand';
import type { Resume } from '../types/resume';
import { createResume, normalizeResume } from '../lib/defaults';
import { uid } from '../lib/utils';
import { api, ApiError } from '../lib/api';

/** Pre-accounts versions kept resumes in localStorage; now they're only read once to offer an import. */
const LEGACY_KEY = 'cvforge:v1';
const HISTORY_LIMIT = 100;
const COALESCE_MS = 900;

type SaveStatus = 'saved' | 'saving' | 'error';
type LoadState = 'idle' | 'loading' | 'ready' | 'error';

interface History {
  past: Resume[];
  future: Resume[];
  lastKey: string | null;
  lastTime: number;
}

interface State {
  resumes: Resume[];
  activeId: string | null;
  history: History;
  saveStatus: SaveStatus;
  lastSavedAt: number;
  loadState: LoadState;

  // server sync
  /** Loads the signed-in user's resumes from the server. */
  load: () => Promise<void>;
  /** Forgets all resumes in memory (sign-out / account switch). */
  reset: () => void;
  /** Waits for pending autosaves to reach the server. */
  flush: () => Promise<void>;

  // resume management
  createResume: (name?: string, withSample?: boolean, templateId?: string) => string;
  duplicateResume: (id: string) => string | null;
  renameResume: (id: string, name: string) => void;
  deleteResume: (id: string) => void;
  importResume: (resume: Resume) => string;
  setActive: (id: string | null) => void;

  // editing (always targets the active resume)
  update: (recipe: (draft: Resume) => void, coalesceKey?: string) => void;
  undo: () => void;
  redo: () => void;
}

const emptyHistory = (): History => ({ past: [], future: [], lastKey: null, lastTime: 0 });

const clone = <T,>(v: T): T => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

export const useResumeStore = create<State>((set, get) => ({
  resumes: [],
  activeId: null,
  history: emptyHistory(),
  saveStatus: 'saved',
  lastSavedAt: Date.now(),
  loadState: 'idle',

  load: async () => {
    const gen = ++generation;
    clearTimeout(saveTimer);
    set({ loadState: 'loading' });
    try {
      const { resumes } = await api<{ resumes: Resume[] }>('GET', '/resumes');
      if (gen !== generation) return;
      const list = resumes.map((r) => normalizeResume(r));
      synced = new Map(list.map((r) => [r.id, r]));
      set({ resumes: list, loadState: 'ready', saveStatus: 'saved', history: emptyHistory() });
    } catch {
      if (gen === generation) set({ loadState: 'error' });
    }
  },

  reset: () => {
    generation++;
    clearTimeout(saveTimer);
    synced = new Map();
    set({ resumes: [], activeId: null, history: emptyHistory(), loadState: 'idle', saveStatus: 'saved' });
  },

  flush: async () => {
    if (get().loadState !== 'ready') return;
    clearTimeout(saveTimer);
    const { dirty, deleted } = pendingWork();
    if (dirty.length || deleted.length) {
      running = (running ?? Promise.resolve()).then(runSync).finally(() => (running = null));
    }
    await running;
  },

  createResume: (name = 'Untitled CV', withSample = false, templateId) => {
    const r = createResume(name, withSample, templateId);
    set((s) => ({ resumes: [r, ...s.resumes] }));
    return r.id;
  },

  duplicateResume: (id) => {
    const src = get().resumes.find((r) => r.id === id);
    if (!src) return null;
    const now = Date.now();
    const copy: Resume = { ...clone(src), id: uid(), name: `${src.name} (Copy)`, createdAt: now, updatedAt: now };
    set((s) => {
      const idx = s.resumes.findIndex((r) => r.id === id);
      const list = [...s.resumes];
      list.splice(idx + 1, 0, copy);
      return { resumes: list };
    });
    return copy.id;
  },

  renameResume: (id, name) =>
    set((s) => ({
      resumes: s.resumes.map((r) => (r.id === id ? { ...r, name: name.trim() || r.name, updatedAt: Date.now() } : r)),
    })),

  deleteResume: (id) =>
    set((s) => ({
      resumes: s.resumes.filter((r) => r.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
    })),

  importResume: (resume) => {
    const now = Date.now();
    const r: Resume = normalizeResume({ ...resume, id: uid(), createdAt: now, updatedAt: now });
    set((s) => ({ resumes: [r, ...s.resumes] }));
    return r.id;
  },

  setActive: (id) => set({ activeId: id, history: emptyHistory() }),

  update: (recipe, coalesceKey) => {
    const { resumes, activeId, history } = get();
    const idx = resumes.findIndex((r) => r.id === activeId);
    if (idx < 0) return;
    const current = resumes[idx];
    const next = clone(current);
    recipe(next);
    next.updatedAt = Date.now();

    const now = Date.now();
    const coalesce = !!coalesceKey && coalesceKey === history.lastKey && now - history.lastTime < COALESCE_MS;
    const past = coalesce ? history.past : [...history.past, current].slice(-HISTORY_LIMIT);

    const list = [...resumes];
    list[idx] = next;
    set({
      resumes: list,
      history: { past, future: [], lastKey: coalesceKey ?? null, lastTime: now },
    });
  },

  undo: () => {
    const { resumes, activeId, history } = get();
    const idx = resumes.findIndex((r) => r.id === activeId);
    if (idx < 0 || history.past.length === 0) return;
    const prev = history.past[history.past.length - 1];
    const list = [...resumes];
    const current = list[idx];
    list[idx] = { ...prev, updatedAt: Date.now() };
    set({
      resumes: list,
      history: { past: history.past.slice(0, -1), future: [current, ...history.future], lastKey: null, lastTime: 0 },
    });
  },

  redo: () => {
    const { resumes, activeId, history } = get();
    const idx = resumes.findIndex((r) => r.id === activeId);
    if (idx < 0 || history.future.length === 0) return;
    const [next, ...rest] = history.future;
    const list = [...resumes];
    const current = list[idx];
    list[idx] = { ...next, updatedAt: Date.now() };
    set({
      resumes: list,
      history: { past: [...history.past, current], future: rest, lastKey: null, lastTime: 0 },
    });
  },
}));

/* ---------- Autosave: debounced sync of changed resumes to the user's account on the server ---------- */
const SAVE_DEBOUNCE = 600;
const RETRY_MS = 5000;
/** Last version of each resume the server has (by reference). Anything else is dirty. */
let synced = new Map<string, Resume>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let running: Promise<void> | null = null;
let generation = 0;

const pendingWork = () => {
  const { resumes } = useResumeStore.getState();
  const dirty = resumes.filter((r) => synced.get(r.id) !== r);
  const ids = new Set(resumes.map((r) => r.id));
  const deleted = [...synced.keys()].filter((id) => !ids.has(id));
  return { dirty, deleted };
};

async function runSync(): Promise<void> {
  const gen = generation;
  const { dirty, deleted } = pendingWork();
  try {
    for (const r of dirty) {
      await api('PUT', `/resumes/${encodeURIComponent(r.id)}`, r);
      if (gen !== generation) return;
      synced.set(r.id, r);
    }
    for (const id of deleted) {
      await api('DELETE', `/resumes/${encodeURIComponent(id)}`);
      if (gen !== generation) return;
      synced.delete(id);
    }
    const left = pendingWork();
    if (left.dirty.length || left.deleted.length) return runSync();
    useResumeStore.setState({ saveStatus: 'saved', lastSavedAt: Date.now() });
  } catch (e) {
    if (gen !== generation) return;
    useResumeStore.setState({ saveStatus: 'error' });
    // signed out / forbidden: nothing to retry; otherwise (network, server hiccup) try again shortly
    if (!(e instanceof ApiError) || (e.status !== 401 && e.status !== 403 && e.status !== 413)) scheduleSync(RETRY_MS);
  }
}

function scheduleSync(delay = SAVE_DEBOUNCE) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    running = (running ?? Promise.resolve()).then(runSync).finally(() => (running = null));
  }, delay);
}

useResumeStore.subscribe((state, prev) => {
  if (state.loadState !== 'ready' || state.resumes === prev.resumes) return;
  if (state.saveStatus !== 'saving') useResumeStore.setState({ saveStatus: 'saving' });
  scheduleSync();
});

window.addEventListener('beforeunload', (e) => {
  const { dirty, deleted } = pendingWork();
  if (useResumeStore.getState().loadState !== 'ready' || (!dirty.length && !deleted.length)) return;
  // best effort: send small pending saves; ask the browser to warn about the rest
  for (const r of dirty) api('PUT', `/resumes/${encodeURIComponent(r.id)}`, r, { keepalive: true }).catch(() => {});
  e.preventDefault();
});

/* ---------- Resumes saved in this browser before accounts existed ---------- */
export function legacyLocalResumes(): Resume[] {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    const parsed = raw ? (JSON.parse(raw) as { resumes?: Resume[] }) : null;
    return Array.isArray(parsed?.resumes) ? parsed.resumes.filter((r) => r?.data?.personal).map(normalizeResume) : [];
  } catch {
    return [];
  }
}
export function clearLegacyLocalResumes() {
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

export const useActiveResume = (): Resume | undefined =>
  useResumeStore((s) => s.resumes.find((r) => r.id === s.activeId));
