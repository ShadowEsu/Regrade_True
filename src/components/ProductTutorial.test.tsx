import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hasPendingTutorialComplete } from '../lib/tutorialCompletion';

const mocks = vi.hoisted(() => ({
  currentUser: null as { uid: string } | null,
  completeTutorial: vi.fn<(uid: string) => Promise<{ tutorialComplete: true }>>(),
}));

vi.mock('../lib/firebase', () => ({
  auth: {
    get currentUser() {
      return mocks.currentUser;
    },
  },
}));

vi.mock('../services/userService', () => ({
  userService: {
    completeTutorial: (uid: string) => mocks.completeTutorial(uid),
  },
}));

import ProductTutorial from './ProductTutorial';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function renderLastStep(onComplete: () => void) {
  return render(
    <ProductTutorial
      role="student"
      index={9}
      onNext={() => {}}
      onTabChange={() => {}}
      onProfileSectionChange={() => {}}
      onComplete={onComplete}
    />,
  );
}

describe('ProductTutorial final step', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    window.localStorage.clear();
    mocks.currentUser = null;
    mocks.completeTutorial.mockReset();
  });

  it('closes after the server confirms completion', async () => {
    mocks.currentUser = { uid: 'uid-ok' };
    mocks.completeTutorial.mockResolvedValue({ tutorialComplete: true });
    const onComplete = vi.fn();
    renderLastStep(onComplete);

    fireEvent.click(screen.getByTestId('tutorial-next'));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(mocks.completeTutorial).toHaveBeenCalledWith('uid-ok');
    expect(hasPendingTutorialComplete('uid-ok')).toBe(false);
  });

  it('still closes when the server write fails and remembers the completion locally', async () => {
    mocks.currentUser = { uid: 'uid-offline' };
    mocks.completeTutorial.mockRejectedValue(new Error('You appear to be offline.'));
    const onComplete = vi.fn();
    renderLastStep(onComplete);

    fireEvent.click(screen.getByTestId('tutorial-next'));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(hasPendingTutorialComplete('uid-offline')).toBe(true);
  });

  it('closes immediately for a signed-out walkthrough replay', async () => {
    const onComplete = vi.fn();
    renderLastStep(onComplete);

    fireEvent.click(screen.getByTestId('tutorial-next'));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(mocks.completeTutorial).not.toHaveBeenCalled();
  });
});
