import { isPreviewMode, isPreviewSignInView, openPreviewSignInView, closePreviewSignInView } from '../lib/previewMode';

export default function PreviewBanner() {
  if (!isPreviewMode()) return null;

  const onSignInPage = isPreviewSignInView();

  return (
    <div
      role="status"
      className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 text-center text-[11px] sm:text-xs text-amber-950/90 tracking-wide"
    >
      <span className="font-semibold uppercase tracking-[0.2em] text-amber-800/90">Preview mode</span>
      {' — '}
      {onSignInPage
        ? 'Sign-in UI only — buttons are disabled until Firebase is connected.'
        : 'New user view: no history yet. Analysis and saves are simulated locally.'}{' '}
      {onSignInPage ? (
        <button
          type="button"
          onClick={closePreviewSignInView}
          className="underline font-semibold text-amber-900 hover:text-amber-950"
        >
          Back to app
        </button>
      ) : (
        <button
          type="button"
          onClick={openPreviewSignInView}
          className="underline font-semibold text-amber-900 hover:text-amber-950"
        >
          View sign-in page
        </button>
      )}
    </div>
  );
}
