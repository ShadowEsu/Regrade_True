/** Local UI tour — no Firebase sign-in, no live AI/Firestore. Enable via `npm run dev:preview`. */
export function isPreviewMode(): boolean {
  return import.meta.env.VITE_PREVIEW_MODE === 'true';
}
