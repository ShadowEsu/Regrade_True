/** Local UI tour — no Firebase sign-in, no live AI/Firestore. Enable via `npm run dev:preview`. */
export function isPreviewMode(): boolean {
  return import.meta.env.VITE_PREVIEW_MODE === 'true';
}

/** In preview, open sign-in UI at http://localhost:3000/app?signin */
export function isPreviewSignInView(): boolean {
  if (!isPreviewMode() || typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('signin');
}

export function isPreviewOnboardingView(): boolean {
  return isPreviewMode() && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('onboarding');
}

export function isPreviewSupervisorView(): boolean {
  return isPreviewMode() && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('supervisor');
}

export function openPreviewSignInView(): void {
  const url = new URL(window.location.href);
  url.searchParams.set('signin', '1');
  window.location.assign(url.toString());
}

export function closePreviewSignInView(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('signin');
  window.location.assign(url.toString());
}
