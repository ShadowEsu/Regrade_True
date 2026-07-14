import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearPendingTutorialComplete,
  hasPendingTutorialComplete,
  markPendingTutorialComplete,
} from './tutorialCompletion';

describe('tutorialCompletion pending marker', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('remembers a pending completion for the account that finished', () => {
    markPendingTutorialComplete('uid-a');
    expect(hasPendingTutorialComplete('uid-a')).toBe(true);
  });

  it('does not apply one account\'s pending completion to another account', () => {
    markPendingTutorialComplete('uid-a');
    expect(hasPendingTutorialComplete('uid-b')).toBe(false);
  });

  it('clears only the marker that belongs to the given account', () => {
    markPendingTutorialComplete('uid-a');
    clearPendingTutorialComplete('uid-b');
    expect(hasPendingTutorialComplete('uid-a')).toBe(true);
    clearPendingTutorialComplete('uid-a');
    expect(hasPendingTutorialComplete('uid-a')).toBe(false);
  });

  it('degrades safely when storage is unavailable', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    expect(() => markPendingTutorialComplete('uid-a')).not.toThrow();
    expect(hasPendingTutorialComplete('uid-a')).toBe(false);
    expect(() => clearPendingTutorialComplete('uid-a')).not.toThrow();
    setItem.mockRestore();
    getItem.mockRestore();
  });
});
