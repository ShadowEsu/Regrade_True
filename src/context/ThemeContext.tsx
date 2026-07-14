import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../lib/firebase';
import { applyTheme, getStoredTheme, persistTheme, resolveTheme, type ThemePreference } from '../lib/theme';
import { userService } from '../services/userService';

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: 'light' | 'dark';
  setPreference: (next: ThemePreference, options?: { persistRemote?: boolean }) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(getStoredTheme);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolveTheme(getStoredTheme()));

  useEffect(() => {
    const update = () => {
      const next = resolveTheme(preference);
      setResolved(next);
      applyTheme(next);
    };
    update();
    if (preference !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [preference]);

  const setPreference = useCallback(async (next: ThemePreference, options?: { persistRemote?: boolean }) => {
    setPreferenceState(next);
    persistTheme(next);
    if (options?.persistRemote === false) return;
    if (auth.currentUser) await userService.setThemePreference(auth.currentUser.uid, next);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({ preference, resolved, setPreference }), [preference, resolved, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
