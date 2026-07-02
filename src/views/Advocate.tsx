import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import { chatWithAdvocate } from '../lib/gemini';
import { buildCaseContextForAdvocate } from '../lib/appealDraft';
import { caseService } from '../services/caseService';
import { sanitizeUserText } from '../lib/sanitize';
import { scanContentForThreats } from '../lib/securityScanner';
import SparkleAvatar from '../components/SparkleAvatar';
import ThinkingIndicator from '../components/ThinkingIndicator';
import CoachComposer from '../components/CoachComposer';
import CoachWhale from '../components/CoachWhale';
import ChatMarkdown from '../components/ChatMarkdown';
import { COACH_HEADING, COACH_SUBHEADING } from '../branding';

type ChatMessage = { role: 'ai' | 'user'; text: string; sentAt?: number };

/** Server AdvocateSchema caps history at 80 entries — stay under it client-side. */
const MAX_HISTORY_MESSAGES = 40;

function looksLikeInsight(text: string): boolean {
  return /\bkey insight\b/i.test(text);
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
            <ChatMarkdown text={text} />
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
          <ChatMarkdown text={text} />
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

function CoachEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center text-center px-6 py-10 sm:py-14 min-h-[min(48vh,380px)]"
    >
      <CoachWhale size={156} className="sm:scale-105" />
      <h1 className="rg-serif text-[clamp(28px,5.5vw,40px)] text-ink mt-8 sm:mt-10 tracking-tight leading-[1.1]">
        {COACH_HEADING}
      </h1>
      <p className="text-[15px] text-ink-muted mt-3 max-w-md leading-relaxed">
        {COACH_SUBHEADING}
      </p>
    </motion.div>
  );
}

export default function Advocate({
  onBack,
  caseId,
}: {
  onBack?: () => void;
  caseId?: string | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [caseContext, setCaseContext] = useState<string | undefined>();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0 && !loading;

  useEffect(() => {
    if (!caseId) {
      setCaseContext(undefined);
      return;
    }
    let cancelled = false;
    caseService.getCaseById(caseId).then((c) => {
      if (!cancelled && c?.analysis) {
        setCaseContext(buildCaseContextForAdvocate(c.analysis));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  useEffect(() => {
    if (!isEmpty) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isEmpty]);

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

      const history = messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
        role: m.role === 'ai' ? ('model' as const) : ('user' as const),
        text: m.text,
      }));

      const response = await chatWithAdvocate(userMessage, history, { caseContext });
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
    }
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

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
          {isEmpty ? (
            <CoachEmptyState />
          ) : (
            <div className="py-5 space-y-5">
              {messages.map((m, i) =>
                m.role === 'ai' ? (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <AiMessage text={m.text} />
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

              {loading && <ThinkingIndicator label="Thinking…" />}
              <div ref={chatEndRef} className="h-2" />
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 sm:px-5 pb-4 pt-2">
        <div className="w-full max-w-3xl mx-auto">
          <CoachComposer
            value={input}
            onChange={setInput}
            onSend={(text) => void sendMessage(text)}
            loading={loading}
            showQuickRow={isEmpty}
          />
          <p className="text-[11px] text-ink-muted/80 mt-3 text-center leading-snug">
            Regrade may make mistakes — double-check rubrics before sending.
          </p>
        </div>
      </div>
    </div>
  );
}
