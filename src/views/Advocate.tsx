import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
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
type AgentSession = { id: string; title: string; messages: ChatMessage[]; input: string };

/** Server AdvocateSchema caps history at 80 entries — stay under it client-side. */
const MAX_HISTORY_MESSAGES = 40;

function looksLikeInsight(text: string): boolean {
  return /\bkey insight\b/i.test(text);
}

function AiMessage({ text }: { text: string }) {
  const isInsight = looksLikeInsight(text);
  const reduceMotion = useReducedMotion();
  const [visibleText, setVisibleText] = useState(reduceMotion ? text : '');

  useEffect(() => {
    if (reduceMotion) {
      setVisibleText(text);
      return;
    }
    let cursor = 0;
    const step = Math.max(2, Math.ceil(text.length / 90));
    const timer = window.setInterval(() => {
      cursor = Math.min(text.length, cursor + step);
      setVisibleText(text.slice(0, cursor));
      if (cursor >= text.length) window.clearInterval(timer);
    }, 14);
    return () => window.clearInterval(timer);
  }, [text, reduceMotion]);

  if (isInsight) {
    return (
      <div className="flex gap-3 items-start">
        <SparkleAvatar size={38} />
        <div className="flex-1 min-w-0">
          <div className="rg-coach-ai-message rg-coach-ai-insight">
            <div className="flex items-center gap-2 mb-2">
              <ICONS.Lightbulb className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
              <span className="text-[12px] font-semibold text-primary">Key insight</span>
            </div>
            <ChatMarkdown text={visibleText} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start">
      <SparkleAvatar size={38} />
      <div className="flex-1 min-w-0">
        <div className="rg-coach-ai-message">
          <ChatMarkdown text={visibleText} />
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

function CoachEmptyState({ sessionTitle }: { sessionTitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center text-center px-6 py-8 sm:py-10 min-h-[min(42vh,320px)]"
    >
      <CoachWhale size={104} />
      <h1 className="rg-serif text-[clamp(24px,4vw,32px)] text-ink mt-5 tracking-tight leading-[1.1]">
        {sessionTitle}
      </h1>
      <p className="text-[13px] text-ink-muted mt-2 max-w-md leading-relaxed">
        {COACH_HEADING} {COACH_SUBHEADING}
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
  const [sessions, setSessions] = useState<AgentSession[]>([{ id: 'whale-1', title: 'Mr Whale', messages: [], input: '' }]);
  const [activeSessionId, setActiveSessionId] = useState('whale-1');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [caseContext, setCaseContext] = useState<string | undefined>();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? sessions[0];
  const messages = activeSession.messages;
  const input = activeSession.input;
  const isEmpty = messages.length === 0 && !loading;

  const updateActiveSession = (update: (session: AgentSession) => AgentSession) => {
    setSessions((previous) => previous.map((session) => session.id === activeSessionId ? update(session) : session));
  };

  const createAgent = () => {
    if (sessions.length >= 8) return;
    const number = sessions.length + 1;
    const session = { id: `whale-${Date.now()}`, title: `Mr Whale ${number}`, messages: [], input: '' };
    setSessions((previous) => [...previous, session]);
    setActiveSessionId(session.id);
    setEditingSessionId(session.id);
    setTitleDraft(session.title);
  };

  const beginRename = (session: AgentSession) => {
    setActiveSessionId(session.id);
    setEditingSessionId(session.id);
    setTitleDraft(session.title);
  };

  const finishRename = () => {
    if (!editingSessionId) return;
    const nextTitle = sanitizeUserText(titleDraft.trim(), 48);
    if (nextTitle) {
      setSessions((previous) => previous.map((session) =>
        session.id === editingSessionId ? { ...session, title: nextTitle } : session,
      ));
    }
    setEditingSessionId(null);
    setTitleDraft('');
  };

  const removeAgent = (sessionId: string) => {
    if (sessions.length === 1) return;
    const index = sessions.findIndex((session) => session.id === sessionId);
    const remaining = sessions.filter((session) => session.id !== sessionId);
    setSessions(remaining);
    if (sessionId === activeSessionId) {
      setActiveSessionId(remaining[Math.max(0, index - 1)].id);
    }
    if (sessionId === editingSessionId) {
      setEditingSessionId(null);
      setTitleDraft('');
    }
  };

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

    const sessionId = activeSession.id;
    const history = activeSession.messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
      role: m.role === 'ai' ? ('model' as const) : ('user' as const),
      text: m.text,
    }));
    setSessions((previous) => previous.map((session) => session.id === sessionId ? {
      ...session,
      messages: [...session.messages, { role: 'user', text: userMessage, sentAt: Date.now() }],
      input: '',
    } : session));
    setLoading(true);

    try {
      const scan = await scanContentForThreats(userMessage, 'chat');
      if (!scan.isSafe) {
        setSessions((previous) => previous.map((session) => session.id === sessionId ? {
          ...session,
          messages: [...session.messages, {
            role: 'ai',
            text:
              scan.recommendation ||
              'That message could not be sent. Please rephrase and try again.',
          }],
        } : session));
        setLoading(false);
        return;
      }

      const response = await chatWithAdvocate(userMessage, history, { caseContext });
      setSessions((previous) => previous.map((session) => session.id === sessionId ? {
        ...session,
        messages: [...session.messages, { role: 'ai', text: response || "I'm sorry, I couldn't process that request." }],
      } : session));
    } catch {
      setSessions((previous) => previous.map((session) => session.id === sessionId ? {
        ...session,
        messages: [...session.messages, { role: 'ai', text: 'Sorry, I ran into an error. Please try again.' }],
      } : session));
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

      <div className="rg-agent-workspace">
        <div className="rg-agent-workspace-inner">
          <div className="rg-agent-workspace-brand">
            <CoachWhale size={22} animate={false} />
            <div>
              <p>MR. WHALE</p>
              <span>Agent workspace</span>
            </div>
          </div>

          <div className="rg-agent-tabs" role="tablist" aria-label="Mr Whale agent sessions">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = session.id === editingSessionId;
              return (
                <div key={session.id} className={`rg-agent-tab ${isActive ? 'rg-agent-tab-active' : ''}`}>
                  {isEditing ? (
                    <input
                      autoFocus
                      value={titleDraft}
                      onChange={(event) => setTitleDraft(event.target.value)}
                      onBlur={finishRename}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') finishRename();
                        if (event.key === 'Escape') {
                          setEditingSessionId(null);
                          setTitleDraft('');
                        }
                      }}
                      aria-label="Rename agent"
                      className="rg-agent-tab-input"
                    />
                  ) : (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveSessionId(session.id)}
                      onDoubleClick={() => beginRename(session)}
                      className="rg-agent-tab-select"
                      title="Open agent — double-click to rename"
                    >
                      {session.title}
                    </button>
                  )}
                  {isActive && !isEditing && (
                    <button type="button" onClick={() => beginRename(session)} className="rg-agent-tab-action" aria-label={`Rename ${session.title}`} title="Rename agent">
                      <ICONS.Edit className="h-3 w-3" strokeWidth={2} />
                    </button>
                  )}
                  {sessions.length > 1 && !isEditing && (
                    <button type="button" onClick={() => removeAgent(session.id)} className="rg-agent-tab-action" aria-label={`Close ${session.title}`} title="Close agent">
                      <ICONS.X className="h-3 w-3" strokeWidth={2} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button type="button" onClick={createAgent} disabled={sessions.length >= 8} className="rg-agent-new" title="Create a new Mr Whale agent">
            <ICONS.Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            <span>New agent</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
          {isEmpty ? (
            <CoachEmptyState sessionTitle={activeSession.title} />
          ) : (
            <div className="py-5 space-y-5">
              {messages.map((m, i) =>
                m.role === 'ai' ? (
                  <div key={i}><AiMessage text={m.text} /></div>
                ) : (
                  <div
                    key={i}
                    className="flex flex-col items-end pl-10"
                  >
                    <div className="max-w-[88%] rounded-[var(--radius-card)] rounded-br-sm bg-primary text-white px-3 py-2.5 shadow-sm shadow-primary/20">
                      <p className="text-[13px] leading-[1.55] whitespace-pre-wrap">{m.text}</p>
                    </div>
                    <span className="text-[11px] text-muted mt-1.5 pr-1">
                      {formatTimeAgo(m.sentAt)}
                    </span>
                  </div>
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
            onChange={(value) => updateActiveSession((session) => ({ ...session, input: value }))}
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
