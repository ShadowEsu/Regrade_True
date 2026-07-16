export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'regrade-theme';

export function getStoredTheme(): ThemePreference {
  // Regrade's beta ships with one verified visual mode. Keep the wider type for
  // backwards-compatible profile reads, but never activate an old dark/system
  // preference in the release client.
  return 'light';
}

export function resolveTheme(_preference: ThemePreference): 'light' {
  return 'light';
}

export function applyTheme(_resolved: 'light' | 'dark'): void {
  document.documentElement.dataset.theme = 'light';
  document.documentElement.style.colorScheme = 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', '#dce8ff');
  }
}

export function bootstrapTheme(): ThemePreference {
  const preference = getStoredTheme();
  applyTheme(resolveTheme(preference));
  return preference;
}

export function persistTheme(preference: ThemePreference): void {
  localStorage.setItem(THEME_STORAGE_KEY, 'light');
  applyTheme(resolveTheme(preference));
}
