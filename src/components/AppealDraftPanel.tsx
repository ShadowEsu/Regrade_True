import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ICONS } from '../constants';
import { caseService } from '../services/caseService';
import { generateAppealDraft } from '../lib/appealDraft';
import { sanitizeUserText } from '../lib/sanitize';
import CoachWhale from './CoachWhale';
import type { AnalysisResult } from '../types';

export default function AppealDraftPanel({
  caseId,
  analysis,
  initialDraft,
  onDraftChange,
  autoGenerate = false,
}: {
  caseId: string | null;
  analysis: AnalysisResult;
  initialDraft?: string;
  onDraftChange?: (draft: string) => void;
  /** Generate a draft on mount when none is saved yet */
  autoGenerate?: boolean;
}) {
  const [draft, setDraft] = useState(initialDraft ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const autoStarted = useRef(false);

  useEffect(() => {
    if (initialDraft?.trim()) {
      setDraft(initialDraft);
    }
  }, [initialDraft]);

  const updateDraft = useCallback(
    (value: string) => {
      setDraft(value);
      onDraftChange?.(value);
    },
    [onDraftChange],
  );

  const persistDraft = async (text: string) => {
    if (!caseId || !text.trim()) return;
    const cleaned = sanitizeUserText(text, 64_000);
    await caseService.updateCase(caseId, { draftEmail: cleaned, progress: 90, status: 'Draft Ready' });
  };

  const handleGenerate = useCallback(
    async (revise = false) => {
      setLoading(true);
      setError(null);
      try {
        const text = await generateAppealDraft(
          analysis,
          revise && draft.trim() ? { reviseFrom: draft } : undefined,
        );
        updateDraft(text);
        await persistDraft(text);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not generate draft. Try again.');
      } finally {
        setLoading(false);
      }
    },
    [analysis, draft, updateDraft, caseId],
  );

  useEffect(() => {
    if (!autoGenerate || autoStarted.current || initialDraft?.trim()) return;
    autoStarted.current = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const text = await generateAppealDraft(analysis);
        updateDraft(text);
        if (caseId && text.trim()) {
          const cleaned = sanitizeUserText(text, 64_000);
          await caseService.updateCase(caseId, {
            draftEmail: cleaned,
            progress: 90,
            status: 'Draft Ready',
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not generate draft. Try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [autoGenerate, initialDraft, analysis, caseId, updateDraft]);

  const handleCopy = async () => {
    if (!draft.trim()) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  const handleDownload = () => {
    if (!draft.trim()) return;
    const blob = new Blob([draft], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (analysis.assignment.title || 'letter')
      .replace(/[^\w\- ]+/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'letter';
    a.download = `appeal-draft-${safeTitle}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    if (!draft.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await persistDraft(draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save draft.');
    } finally {
      setLoading(false);
    }
  };

  const showDraft = loading || draft.trim().length > 0;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {loading && !draft.trim() ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rg-glass-card rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <CoachWhale size={44} animate />
              <div>
                <p className="text-[14px] font-medium text-ink">Writing your appeal email…</p>
                <p className="text-[12px] text-ink-muted mt-0.5">Using your strongest findings and rubric details</p>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <div className="rg-shimmer h-3 rounded-full w-full" />
              <div className="rg-shimmer h-3 rounded-full w-[92%]" />
              <div className="rg-shimmer h-3 rounded-full w-[78%]" />
            </div>
          </motion.div>
        ) : showDraft ? (
          <motion.div
            key="draft"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rg-glass-card rounded-2xl p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="rg-meta-k">Email draft</p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!draft.trim() || loading}
                  className="rg-btn-secondary px-3 py-1.5 text-[12px] disabled:opacity-40"
                >
                  {copied ? (
                    <>
                      <ICONS.Check className="w-3.5 h-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <ICONS.Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!draft.trim() || loading}
                  className="rg-btn-secondary px-3 py-1.5 text-[12px] disabled:opacity-40"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!draft.trim() || loading}
                  className="rg-btn-secondary px-2.5 py-1.5 text-[12px] disabled:opacity-40"
                  aria-label="Download draft"
                >
                  <ICONS.Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <textarea
              value={draft}
              onChange={(e) => updateDraft(e.target.value)}
              rows={14}
              disabled={loading}
              className="rg-glass-field w-full resize-y min-h-[220px] text-[14px] leading-relaxed font-normal disabled:opacity-60"
              placeholder="Your appeal email will appear here. Edit freely before sending."
            />
            <p className="text-[12px] text-ink-muted leading-relaxed">
              Personalize names and details, then copy into your email client or LMS message.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => void handleGenerate(!!draft.trim())}
        disabled={loading}
        className="rg-btn-secondary w-full py-2.5 text-[13px] disabled:opacity-60"
      >
        {loading ? (
          <>
            <ICONS.Loader2 className="w-3.5 h-3.5 animate-spin" />
            {draft.trim() ? 'Regenerating…' : 'Writing…'}
          </>
        ) : (
          <>
            <ICONS.RefreshCcw className="w-3.5 h-3.5" />
            {draft.trim() ? 'Regenerate draft' : 'Write appeal letter'}
          </>
        )}
      </button>

      {error && (
        <p className="text-[13px] text-red-600 font-medium px-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
