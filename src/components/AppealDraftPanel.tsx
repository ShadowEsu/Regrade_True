import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ICONS } from '../constants';
import { caseService } from '../services/caseService';
import { generateAppealDraft } from '../lib/appealDraft';
import type { AnalysisResult } from '../types';

export default function AppealDraftPanel({
  caseId,
  analysis,
  initialDraft,
  onDraftChange,
}: {
  caseId: string | null;
  analysis: AnalysisResult;
  initialDraft?: string;
  onDraftChange?: (draft: string) => void;
}) {
  const [draft, setDraft] = useState(initialDraft ?? '');
  const [open, setOpen] = useState(!!initialDraft);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialDraft) {
      setDraft(initialDraft);
      setOpen(true);
    }
  }, [initialDraft]);

  const updateDraft = (value: string) => {
    setDraft(value);
    onDraftChange?.(value);
  };

  const persistDraft = async (text: string) => {
    if (!caseId || !text.trim()) return;
    await caseService.updateCase(caseId, { draftEmail: text, progress: 90, status: 'Draft Ready' });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const text = await generateAppealDraft(analysis, draft.trim() ? { reviseFrom: draft } : undefined);
      updateDraft(text);
      setOpen(true);
      await persistDraft(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate draft. Try again.');
    } finally {
      setLoading(false);
    }
  };

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
    a.download = `appeal-draft-${analysis.assignment.title || 'letter'}.txt`;
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

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rg-btn-primary flex-1 py-3 text-[14px] group disabled:opacity-60"
        >
          {loading ? (
            <>
              <ICONS.Loader2 className="w-4 h-4 animate-spin" />
              {draft.trim() ? 'Revising draft…' : 'Writing appeal letter…'}
            </>
          ) : (
            <>
              {draft.trim() ? 'Regenerate draft' : 'Write appeal letter'}
              <ICONS.ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!draft.trim() || loading}
          className="rg-btn-secondary px-4 py-3 text-[13px] disabled:opacity-40"
          aria-label="Download draft"
        >
          <ICONS.Download className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <p className="text-[13px] text-red-600 font-medium px-1" role="alert">
          {error}
        </p>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rg-glass-card rounded-2xl p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="rg-meta-k">Email draft</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!draft.trim()}
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
              </div>
            </div>
            <textarea
              value={draft}
              onChange={(e) => updateDraft(e.target.value)}
              rows={12}
              className="rg-glass-field w-full resize-y min-h-[200px] text-[14px] leading-relaxed font-normal"
              placeholder="Your appeal email will appear here. Edit freely before sending."
            />
            <p className="text-[12px] text-ink-muted leading-relaxed">
              Review and personalize before sending. Mr Whale can help refine tone in the Coach tab.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
