import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import { BRAND_NAME } from '../branding';
import { chatWithAdvocate } from '../lib/gemini';
import { sanitizeUserText } from '../lib/sanitize';
import { scanContentForThreats } from '../lib/securityScanner';
import SparkleAvatar from '../components/SparkleAvatar';
import ThinkingIndicator from '../components/ThinkingIndicator';

const WELCOME =
  'I found your strongest appeal angle: the rubric mentions method credit, but your feedback only marked the final answer.';

const FOLLOW_UP =
  'Want me to turn this into a professor-safe message? Your best move is to ask for a recheck, not argue the whole grade.';

const SUGGESTION_CHIPS = [
  'Draft appeal',
  'Show evidence',
  'Make it shorter',
  'Make it more polite',
  'What should I upload?',
];

type ChatMessage = { role: 'ai' | 'user'; text: string; sentAt?: number };

function looksLikeInsight(text: string): boolean {
  return (
    /\bO\s*\([^)]+\)/i.test(text) ||
    /rubric/i.test(text) ||
    /key insight/i.test(text) ||
    /complexity/i.test(text) ||
    /`[^`]+`/.test(text)
  );
}

function formatInsightText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`)|(\bO\s*\([^)]+\))/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-primary/10 text-ink font-mono text-[14px]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (/n²|n\^2|\^2/i.test(token)) {
      parts.push(
        <span key={match.index} className="text-[#dc2626] font-semibold">
          {token}
        </span>,
      );
    } else {
      parts.push(
        <span key={match.index} className="text-primary font-semibold">
          {token}
        </span>,
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : [text];
}

function AiMessage({ text }: { text: string }) {
  const isInsight = looksLikeInsight(text);

  if (isInsight) {
    return (
      <div className="flex gap-3 items-start">
        <SparkleAvatar size={38} />
        <div className="flex-1 min-w-0">
          <div className="rounded-[var(--radius-card)] border border-primary/20 bg-gradient-to-br from-primary/[0.12] to-canvas px-4 py-3.5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ICONS.Lightbulb className="w-4 h-4 text-primary" strokeWidth={2} />
              <span className="text-sm font-semibold text-primary">Key Insight</span>
            </div>
            <p className="text-[15px] leading-[1.65] text-ink">
              {formatInsightText(text)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start">
      <SparkleAvatar size={38} />
      <div className="flex-1 min-w-0">
        <div className="rounded-[var(--radius-card)] border border-primary/15 bg-canvas/90 px-4 py-3.5 border-l-[3px] border-l-primary shadow-sm">
          <p className="text-[15px] leading-[1.65] text-ink whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(ts?: number): string {
  if (!ts) return 'Just now';
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

function EvidencePreview() {
  return (
    <div className="ml-[50px] mt-1 mb-2 rg-card p-3 border-dashed border-primary/20 bg-primary/[0.04]">
      <p className="text-[11px] font-mono uppercase tracking-wider text-primary mb-1.5">Evidence preview</p>
      <div className="flex flex-wrap gap-1.5 justify-start">
        <span className="text-[11px] px-2 py-1 rounded-md bg-primary/10 text-primary">
          Rubric §2: method credit
        </span>
        <span className="text-[11px] px-2 py-1 rounded-md bg-amber-100 text-amber-900">
          −5 pts, no comment
        </span>
      </div>
    </div>
  );
}

function NextActionCard({ action }: { action: string }) {
  return (
    <div className="ml-[50px] flex items-center gap-2 text-[12px] text-primary font-medium">
      <ICONS.ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
      Next: {action}
    </div>
  );
}

export default function Advocate({ onBack }: { onBack?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: WELCOME },
    { role: 'ai', text: FOLLOW_UP },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (raw: string) => {
    if (!raw.trim() || loading) return;

    const userMessage = sanitizeUserText(raw.trim(), 32_000);
    if (!userMessage) return;

    setMessages((prev) => [...prev, { role: 'user', text: userMessage, sentAt: Date.now() }]);
    setInput('');
    setLoading(true);

    try {
      const scan = await scanContentForThreats(userMessage, 'chat');
      if (!scan.isSafe) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text:
              scan.recommendation ||
              'That message could not be sent. Please rephrase and try again.',
          },
        ]);
        setLoading(false);
        return;
      }

      const history = messages.slice(1).map((m) => ({
        role: m.role === 'ai' ? ('model' as const) : ('user' as const),
        text: m.text,
      }));

      const response = await chatWithAdvocate(userMessage, history);
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: response || "I'm sorry, I couldn't process that request." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Sorry, I ran into an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full rg-chat-surface">
      {onBack && (
        <div className="shrink-0 px-4 py-2 border-b border-primary/10 bg-canvas/60 backdrop-blur-sm">
          <button type="button" onClick={onBack} className="rg-text-link text-sm">
            <ICONS.ChevronLeft size={18} strokeWidth={2} />
            Back to appeal
          </button>
        </div>
      )}

      <div className="shrink-0 px-4 py-4 border-b border-primary/10 bg-gradient-to-r from-primary/[0.08] to-transparent">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <SparkleAvatar size={44} />
          <div className="min-w-0">
            <p className="rg-serif text-lg text-ink font-semibold">{BRAND_NAME} Coach</p>
            <p className="text-[12px] text-primary font-mono uppercase tracking-wider">
              Rubric-aware · always on
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-5 py-5 space-y-5">
          {messages.map((m, i) =>
            m.role === 'ai' ? (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <AiMessage text={m.text} />
                {i === 0 && <EvidencePreview />}
                {i === 1 && <NextActionCard action="Draft a respectful email" />}
              </motion.div>
            ) : (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-end pl-10"
              >
                <div className="max-w-[88%] rounded-[var(--radius-card)] rounded-br-sm bg-primary text-white px-4 py-3 shadow-md shadow-primary/20">
                  <p className="text-[15px] leading-[1.6] whitespace-pre-wrap">{m.text}</p>
                </div>
                <span className="text-[11px] text-muted mt-1.5 pr-1">
                  {formatTimeAgo(m.sentAt)}
                </span>
              </motion.div>
            ),
          )}

          {loading && <ThinkingIndicator label="Coach is thinking" />}
          <div ref={chatEndRef} className="h-2" />
        </div>
      </div>

      <div className="shrink-0 border-t border-primary/15 bg-canvas/90 backdrop-blur-md px-4 py-3">
        <div className="w-full max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-0.5 scrollbar-none">
            {SUGGESTION_CHIPS.map((chip) => (
              <motion.button
                key={chip}
                type="button"
                onClick={() => sendMessage(chip)}
                disabled={loading}
                whileTap={{ scale: 0.95 }}
                className="shrink-0 px-4 py-2 rounded-[var(--radius-pill)] border border-primary/20 bg-primary/[0.06] text-[13px] font-medium text-primary hover:bg-primary/12 transition-colors disabled:opacity-50"
              >
                {chip}
              </motion.button>
            ))}
          </div>

          <form onSubmit={handleSend}>
            <div className="relative flex items-center rounded-[var(--radius-pill)] bg-canvas border-2 border-primary/20 focus-within:border-primary/50 transition-colors shadow-sm">
              <button
                type="button"
                className="pl-4 pr-1 py-3 text-primary/60 hover:text-primary transition-colors"
                aria-label="Add attachment"
              >
                <ICONS.PlusCircle className="w-5 h-5" strokeWidth={1.75} />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message AI Coach..."
                className="flex-1 bg-transparent py-3.5 pr-14 text-[15px] text-ink placeholder:text-muted outline-none min-h-[48px]"
                autoComplete="off"
              />
              <motion.button
                type="submit"
                disabled={loading || !input.trim()}
                whileTap={{ scale: 0.92 }}
                className="absolute right-1.5 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-primary text-white disabled:opacity-30 hover:bg-primary-focus transition-colors"
                aria-label="Send"
              >
                {loading ? (
                  <ICONS.RefreshCcw className="animate-spin w-[18px] h-[18px]" />
                ) : (
                  <ICONS.ArrowUp className="w-[18px] h-[18px]" strokeWidth={2.5} />
                )}
              </motion.button>
            </div>
          </form>

          <p className="flex items-start gap-1.5 text-[11px] text-muted mt-2.5 leading-snug">
            <ICONS.AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
            Regrade reasons carefully, but may occasionally make errors. Verify grading rubrics.
          </p>
        </div>
      </div>
    </div>
  );
}
