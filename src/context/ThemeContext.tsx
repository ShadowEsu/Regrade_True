import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { applyTheme, persistTheme, type ThemePreference } from '../lib/theme';

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: 'light' | 'dark';
  setPreference: (next: ThemePreference, options?: { persistRemote?: boolean }) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Regrade 2.0 ships its approved light experience first. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    persistTheme('light');
    applyTheme('light');
  }, []);

  const setPreference = useCallback(async () => {
    persistTheme('light');
    applyTheme('light');
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({ preference: 'light', resolved: 'light', setPreference }), [setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
