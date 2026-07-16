import { describe, expect, it } from 'vitest';
import { getStoredTheme, resolveTheme } from './theme';

describe('release theme contract', () => {
  it('always resolves old preferences to the verified light theme', () => {
    expect(getStoredTheme()).toBe('light');
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('light');
    expect(resolveTheme('system')).toBe('light');
  });
});
