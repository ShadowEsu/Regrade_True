import { isPreviewMode } from '../lib/previewMode';

export default function PreviewBanner() {
  if (!isPreviewMode()) return null;

  return (
    <div
      role="status"
      className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 text-center text-[11px] sm:text-xs text-amber-950/90 tracking-wide"
    >
      <span className="font-semibold uppercase tracking-[0.2em] text-amber-800/90">Preview mode</span>
      {' — '}
      Browsing the app without sign-in. Analysis and cloud save are simulated. Add Firebase + API keys for
      the real flow.
    </div>
  );
}
