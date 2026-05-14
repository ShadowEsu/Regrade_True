import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ICONS } from '../constants';
import { chatWithAdvocate } from '../lib/gemini';

export default function Advocate({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hey — I’m here to help you figure out your grade situation and how to push back the right way. I know how Canvas, Gradescope, Moodle, Turnitin, and the rest actually work, and I can walk you through appeals step by step. I’m not a lawyer and I can’t promise you’ll win, but I’m on your side. What’s going on — and if you know it, what does your school use for grades (Canvas, Moodle, etc.)?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      // Map our app roles to Gemini roles
      const history = messages.slice(1).map(m => ({
        role: m.role === 'ai' ? 'model' as const : 'user' as const,
        text: m.text
      }));

      const response = await chatWithAdvocate(userMessage, history);
      
      setMessages(prev => [...prev, { role: 'ai', text: response || "I'm sorry, I couldn't process that request." }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "Sorry, I ran into an error. Please try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto min-h-[min(88dvh,calc(100vh-7rem))] h-[min(88dvh,calc(100vh-7rem))] sm:rounded-[3rem] rounded-2xl overflow-hidden border-2 border-primary/15 bg-white/85 backdrop-blur-3xl shadow-2xl relative">
      <div className="absolute inset-0 paper-texture opacity-5 pointer-events-none" />
      
      {/* Header */}
      <header className="p-4 sm:p-8 border-b border-primary/10 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-b from-primary/[0.07] to-transparent relative z-10">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white hover:bg-primary/5 rounded-2xl transition-all text-primary shadow-sm border border-primary/10 shrink-0"
            aria-label="Back"
          >
            <ICONS.ChevronLeft size={20} />
          </button>
          <div className="min-w-0">
            <h2 className="font-serif text-xl sm:text-2xl text-primary font-light tracking-tight">Appeal assistant</h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <div className="w-1.5 h-1.5 bg-[#6cf8bb] rounded-full animate-pulse shrink-0" />
              <span className="text-[10px] sm:text-[11px] uppercase font-light tracking-[0.28em] text-primary/50">
                Chat · same as Home card
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
           {[ICONS.Shield, ICONS.Download].map((Icon, i) => (
             <button key={i} className="p-3 bg-white/50 text-primary/30 hover:text-primary transition-all rounded-xl border border-primary/5">
                <Icon size={18} />
             </button>
           ))}
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-10 relative z-10 scrollbar-hide">
        {messages.map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[92%] sm:max-w-[85%] p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] text-[15px] sm:text-lg font-serif italic font-light leading-relaxed ${
              m.role === 'ai' 
                ? 'bg-white/80 border border-primary/5 text-primary/80 shadow-[0_10px_30px_-10px_rgba(0,35,111,0.05)]' 
                : 'bg-primary text-white shadow-xl shadow-primary/20'
            }`}>
              {m.text}
            </div>
          </motion.div>
        ))}
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/80 border border-primary/5 p-6 rounded-2xl flex gap-2">
              <div className="w-2 h-2 bg-primary/20 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary/20 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-primary/20 rounded-full animate-bounce delay-200" />
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 sm:p-8 border-t border-primary/10 bg-white/90 relative z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="relative flex items-center max-w-2xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about rubrics, feedback, or appeal steps…"
            className="w-full bg-[#fdfcf7] border border-primary/10 rounded-[2rem] px-6 sm:px-10 py-4 sm:py-6 outline-none focus:ring-2 focus:ring-primary/15 transition-all pr-[3.75rem] text-[15px] sm:text-base font-serif italic font-light text-primary/85 placeholder:text-primary/30 min-h-[48px]"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 sm:right-3 p-3 sm:p-4 min-w-[44px] min-h-[44px] flex items-center justify-center bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all outline-none disabled:opacity-50 disabled:scale-100"
            aria-label="Send"
          >
            {loading ? <ICONS.RefreshCcw className="animate-spin" size={20} /> : <ICONS.Send size={20} />}
          </button>
        </div>
        <div className="flex justify-center items-center gap-4 mt-6">
           <div className="h-px w-8 bg-primary/10" />
           <p className="text-[10px] text-primary/35 font-light uppercase tracking-[0.32em] text-center px-2">
              Educational support only · follow your school&apos;s policy
           </p>
           <div className="h-px w-8 bg-primary/10" />
        </div>
      </form>
    </div>
  );
}
