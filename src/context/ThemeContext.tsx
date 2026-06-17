import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  applyTheme,
  getStoredTheme,
  persistTheme,
  resolveTheme,
  type ThemePreference,
} from '../lib/theme';
import { userService } from '../services/userService';

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: 'light' | 'dark';
  setPreference: (next: ThemePreference, options?: { persistRemote?: boolean }) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => getStoredTheme());

  const resolved = useMemo(() => resolveTheme(preference), [preference]);

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(resolveTheme('system'));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [preference]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      void userService.getProfile(user.uid).then((profile) => {
        if (profile?.theme) {
          setPreferenceState(profile.theme);
          persistTheme(profile.theme);
        }
      });
    });
    return unsub;
  }, []);

  const setPreference = useCallback(
    async (next: ThemePreference, options?: { persistRemote?: boolean }) => {
      setPreferenceState(next);
      persistTheme(next);
      if (options?.persistRemote === false) return;
      const user = auth.currentUser;
      if (!user) return;
      try {
        await userService.setThemePreference(user.uid, next);
      } catch (err) {
        console.error('Failed to save theme preference:', err);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
