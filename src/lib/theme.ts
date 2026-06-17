export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'regrade-theme';

export function getStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
}

export function applyTheme(resolved: 'light' | 'dark'): void {
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? '#070b12' : '#dce8ff');
  }
}

export function bootstrapTheme(): ThemePreference {
  const preference = getStoredTheme();
  applyTheme(resolveTheme(preference));
  return preference;
}

export function persistTheme(preference: ThemePreference): void {
  localStorage.setItem(THEME_STORAGE_KEY, preference);
  applyTheme(resolveTheme(preference));
}
