import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ICONS } from '../constants';
import CoachWhale from './CoachWhale';

const QUICK_PROMPTS = [
  { label: 'Draft appeal', hint: 'Professor-safe email' },
  { label: 'Show evidence', hint: 'Rubric mismatches' },
  { label: 'Make it shorter', hint: 'Tighten the draft' },
  { label: 'Make it more polite', hint: 'Softer tone' },
  { label: 'What should I upload?', hint: 'File checklist' },
] as const;

export default function CoachComposer({
  value,
  onChange,
  onSend,
  loading,
  showQuickRow = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: (text: string) => void;
  loading: boolean;
  showQuickRow?: boolean;
}) {
  const [promptsOpen, setPromptsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  useEffect(() => {
    if (!promptsOpen) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setPromptsOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [promptsOpen]);

  const submit = () => {
    if (!value.trim() || loading) return;
    onSend(value);
    setPromptsOpen(false);
  };

  const pickPrompt = (label: string) => {
    setPromptsOpen(false);
    onSend(label);
  };

  return (
    <div ref={rootRef} className="space-y-3">
      {showQuickRow && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none -mx-1 px-1">
          {QUICK_PROMPTS.slice(0, 3).map((p) => (
            <motion.button
              key={p.label}
              type="button"
              disabled={loading}
              onClick={() => pickPrompt(p.label)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="shrink-0 rg-glass-chip px-4 py-2.5 text-left min-w-[140px] disabled:opacity-50"
            >
              <p className="text-[14px] font-medium text-ink leading-tight">{p.label}</p>
              <p className="text-[12px] text-ink-muted mt-0.5">{p.hint}</p>
            </motion.button>
          ))}
        </div>
      )}

      <div className="relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="rg-coach-composer"
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask about your appeal, rubric, or draft email…"
            rows={1}
            disabled={loading}
            className="rg-coach-composer-input"
            autoComplete="off"
          />

          <div className="rg-coach-composer-toolbar">
            <div className="flex items-center gap-0.5">
              <motion.button
                type="button"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                className="rg-coach-composer-icon-btn"
                aria-label="Add attachment"
              >
                <ICONS.Plus className="w-[18px] h-[18px]" strokeWidth={1.75} />
              </motion.button>

              <div className="mx-0.5 shrink-0" aria-hidden>
                <CoachWhale size={40} animate={false} />
              </div>

              <motion.button
                type="button"
                onClick={() => setPromptsOpen((o) => !o)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className={`rg-coach-composer-prompt-btn ${promptsOpen ? 'rg-coach-composer-prompt-btn-active' : ''}`}
                aria-expanded={promptsOpen}
                aria-haspopup="listbox"
              >
                <span>Prompts</span>
                <motion.span animate={{ rotate: promptsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ICONS.ChevronDown className="w-3.5 h-3.5 opacity-60" strokeWidth={2.5} />
                </motion.span>
              </motion.button>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !value.trim()}
              whileHover={{ scale: loading || !value.trim() ? 1 : 1.06 }}
              whileTap={{ scale: 0.9 }}
              className="rg-coach-composer-send"
              aria-label="Send"
            >
              {loading ? (
                <ICONS.RefreshCcw className="w-[17px] h-[17px] animate-spin" />
              ) : (
                <ICONS.ArrowUp className="w-[17px] h-[17px]" strokeWidth={2.5} />
              )}
            </motion.button>
          </div>
        </form>

        <AnimatePresence>
          {promptsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="rg-coach-prompt-menu"
              role="listbox"
            >
              {QUICK_PROMPTS.map((p, i) => (
                <motion.button
                  key={p.label}
                  type="button"
                  role="option"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => pickPrompt(p.label)}
                  className="rg-coach-prompt-item"
                >
                  <span className="text-[14px] font-medium text-ink">{p.label}</span>
                  <span className="text-[12px] text-ink-muted">{p.hint}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
