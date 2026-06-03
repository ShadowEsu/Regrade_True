import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import { chatWithAdvocate } from '../lib/gemini';
import { sanitizeUserText } from '../lib/sanitize';
import { scanContentForThreats } from '../lib/securityScanner';
import Logo from '../components/Logo';

const WELCOME =
  "Hey — I'm here to help you figure out your grade situation and how to push back the right way. I know how Canvas, Gradescope, Moodle, Turnitin, and the rest actually work, and I can walk you through appeals step by step. I'm not a lawyer and I can't promise you'll win, but I'm on your side. What's going on — and if you know it, what does your school use for grades (Canvas, Moodle, etc.)?";

function AssistantAvatar() {
  return (
    <div
      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#00236f] flex items-center justify-center shrink-0"
      aria-hidden
    >
      <ICONS.MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
    </div>
  );
}

export default function Advocate({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState([{ role: 'ai' as const, text: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = sanitizeUserText(input.trim(), 32_000);
    if (!userMessage) return;

    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
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

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#f7f7f8]">
      {/* Full-screen top bar */}
      <header className="shrink-0 flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 border-b border-black/[0.06] bg-white pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 rounded-xl text-sm font-semibold text-[#00236f] hover:bg-black/[0.04] transition-colors shrink-0"
          aria-label="Back to Home"
        >
          <ICONS.ChevronLeft size={22} strokeWidth={2} />
          <span className="hidden sm:inline">Home</span>
        </button>

        <div className="flex-1 flex justify-center min-w-0 pointer-events-none">
          <Logo size="sm" compact className="!items-center opacity-95" />
        </div>

        <div className="w-[44px] sm:w-[72px] shrink-0 flex justify-end">
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#19a37b]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#19a37b] animate-pulse" />
            <span className="hidden sm:inline">Live</span>
          </span>
        </div>
      </header>

      {/* Messages — full width, centered column */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-7 sm:space-y-8">
          {messages.map((m, i) =>
            m.role === 'ai' ? (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 sm:gap-4 items-start"
              >
                <AssistantAvatar />
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-[16px] sm:text-[17px] leading-[1.7] text-[#0d0d0d] whitespace-pre-wrap">
                    {m.text}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end pl-12 sm:pl-16"
              >
                <div className="max-w-[88%] rounded-[1.25rem] rounded-br-md bg-[#00236f] text-white px-4 sm:px-5 py-3 sm:py-3.5">
                  <p className="text-[16px] sm:text-[17px] leading-[1.65] whitespace-pre-wrap">{m.text}</p>
                </div>
              </motion.div>
            ),
          )}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-start">
              <AssistantAvatar />
              <div className="flex gap-1.5 pt-3">
                <span className="w-2 h-2 rounded-full bg-[#0d0d0d]/20 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#0d0d0d]/20 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-[#0d0d0d]/20 animate-bounce [animation-delay:300ms]" />
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} className="h-4" />
        </div>
      </div>

      {/* Composer — edge to edge */}
      <form
        onSubmit={handleSend}
        className="shrink-0 bg-[#f7f7f8] border-t border-black/[0.06] px-4 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="w-full max-w-3xl mx-auto">
          <div className="relative flex items-center rounded-[1.75rem] bg-white border border-black/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-[#00236f]/15">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message appeal assistant…"
              className="flex-1 bg-transparent rounded-[1.75rem] pl-5 pr-14 py-4 sm:py-[1.125rem] text-base text-[#0d0d0d] placeholder:text-[#8e8ea0] outline-none min-h-[52px]"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#00236f] text-white disabled:opacity-30 hover:bg-[#001a57] active:scale-[0.98] transition-all"
              aria-label="Send"
            >
              {loading ? (
                <ICONS.RefreshCcw className="animate-spin" size={20} />
              ) : (
                <ICONS.Send size={20} />
              )}
            </button>
          </div>
          <p className="text-center text-[11px] text-[#8e8ea0] mt-3">
            Educational support only · not legal advice
          </p>
        </div>
      </form>
    </div>
  );
}
