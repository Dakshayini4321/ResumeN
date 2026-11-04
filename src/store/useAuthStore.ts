import { create } from 'zustand';
import { api, setMustChangeHandler, setUnauthorizedHandler, type AppSettings, type AuthPayload, type User } from '../lib/api';
import { useResumeStore } from './useResumeStore';

type Status = 'loading' | 'anon' | 'authed';

interface AuthState {
  status: Status;
  user: User | null;
  settings: AppSettings;
  /** Shown on the login page after an involuntary sign-out (expired, deactivated, deleted). */
  notice: string | null;
  init: () => Promise<void>;
  login: (username: string, password: string, portal: 'user' | 'admin') => Promise<User>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  setSettings: (s: AppSettings) => void;
  clearNotice: () => void;
}

/** Wipes everything belonging to the previous user from memory. */
const clearUserData = () => useResumeStore.getState().reset();

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  settings: { allowPasswordChange: true },
  notice: null,

  init: async () => {
    try {
      const { user, settings } = await api<AuthPayload>('GET', '/auth/me', undefined, { quiet401: true });
      set({ status: 'authed', user, settings });
    } catch {
      set({ status: 'anon', user: null });
    }
  },

  login: async (username, password, portal) => {
    const { user, settings } = await api<AuthPayload>('POST', '/auth/login', { username, password, portal }, { quiet401: true });
    clearUserData();
    set({ status: 'authed', user, settings, notice: null });
    return user;
  },

  logout: async () => {
    await useResumeStore.getState().flush(); // don't lose the last few keystrokes
    try {
      await api('POST', '/auth/logout');
    } catch {
      /* already signed out */
    }
    clearUserData();
    set({ status: 'anon', user: null });
  },

  changePassword: async (currentPassword, newPassword) => {
    const { user, settings } = await api<AuthPayload>('POST', '/auth/change-password', { currentPassword, newPassword }, { quiet401: true });
    set({ user, settings });
  },

  setSettings: (settings) => set({ settings }),
  clearNotice: () => set({ notice: null }),
}));

setUnauthorizedHandler((message) => {
  if (useAuthStore.getState().status !== 'authed') return;
  clearUserData();
  useAuthStore.setState({ status: 'anon', user: null, notice: message });
});
setMustChangeHandler(() => {
  const u = useAuthStore.getState().user;
  if (u && !u.mustChangePassword) useAuthStore.setState({ user: { ...u, mustChangePassword: true } });
});

/* While signed in, re-check the session every minute so a deactivated/deleted account is locked out promptly. */
setInterval(() => {
  if (useAuthStore.getState().status !== 'authed' || document.hidden) return;
  api<AuthPayload>('GET', '/auth/me')
    .then(({ user, settings }) => useAuthStore.setState({ user, settings }))
    .catch(() => {});
}, 60_000);
