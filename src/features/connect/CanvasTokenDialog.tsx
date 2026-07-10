import { useState } from 'react';
import { CONNECT_STRINGS as S } from './strings';
import { looksLikeCanvasToken, normalizeCanvasBaseUrl } from './flows/urlGuards';

/**
 * Guided Canvas personal-access-token flow. The student sees exactly where in
 * Canvas the token lives, pastes it, and we hand it up. The token is passed to
 * the caller in memory only; storage and verification happen server-side.
 */
export default function CanvasTokenDialog({
  open,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  onSubmit: (input: { baseUrl: string; token: string }) => void;
  onCancel: () => void;
}) {
  const [urlValue, setUrlValue] = useState('');
  const [tokenValue, setTokenValue] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = () => {
    const baseUrl = normalizeCanvasBaseUrl(urlValue);
    const tokenOk = looksLikeCanvasToken(tokenValue);
    setUrlError(baseUrl ? null : S.canvasUrlInvalid);
    setTokenError(tokenOk ? null : S.canvasTokenInvalid);
    if (!baseUrl || !tokenOk) return;
    onSubmit({ baseUrl, token: tokenValue.trim() });
  };

  const steps = [S.canvasStep1, S.canvasStep2, S.canvasStep3, S.canvasStep4];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={S.canvasDialogTitle}
    >
      <div className="rg-glass-form-card w-full max-w-md p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <h2 className="text-[17px] font-semibold text-ink">{S.canvasDialogTitle}</h2>
        <p className="text-[13px] text-ink-muted leading-relaxed">{S.canvasIntro}</p>
        <p className="text-[12px] text-primary font-medium leading-relaxed">{S.canvasNeverPassword}</p>

        <ol className="space-y-2">
          {steps.map((step, i) => (
            <li key={step} className="flex items-start gap-2.5 text-[13px] text-ink leading-relaxed">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <div className="space-y-1.5">
          <label htmlFor="canvas-url" className="text-[12px] font-medium text-ink">
            {S.canvasUrlLabel}
          </label>
          <input
            id="canvas-url"
            type="url"
            inputMode="url"
            autoComplete="off"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder={S.canvasUrlPlaceholder}
            className="w-full h-11 px-3 rounded-xl border border-hairline bg-surface text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
          {urlError && <p className="text-[12px] text-red-600">{urlError}</p>}
          {normalizeCanvasBaseUrl(urlValue) && (
            <button
              type="button"
              onClick={() => {
                const base = normalizeCanvasBaseUrl(urlValue);
                if (base) window.open(`${base}/profile/settings`, '_blank', 'noopener');
              }}
              className="rg-btn-ghost text-[13px]"
            >
              {S.canvasOpenSettings}
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="canvas-token" className="text-[12px] font-medium text-ink">
            {S.canvasTokenLabel}
          </label>
          <input
            id="canvas-token"
            type="password"
            autoComplete="off"
            value={tokenValue}
            onChange={(e) => setTokenValue(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-hairline bg-surface text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
          {tokenError && <p className="text-[12px] text-red-600">{tokenError}</p>}
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel} className="rg-btn-secondary flex-1">
            {S.canvasCancelAction}
          </button>
          <button type="button" onClick={handleSubmit} className="rg-btn-primary flex-1">
            {S.canvasSaveAction}
          </button>
        </div>
      </div>
    </div>
  );
}
