import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import { auth } from '../lib/firebase';
import { caseService, Case } from '../services/caseService';

export default function Dashboard({
  onStartAppeal,
  onOpenChat,
}: {
  onStartAppeal: () => void;
  onOpenChat: () => void;
}) {
  const user = auth.currentUser;
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Member';
  const [latestCase, setLatestCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCases() {
      try {
        const cases = await caseService.getUserCases();
        if (cases.length > 0) {
          setLatestCase(cases[0]);
        }
      } catch (err) {
        console.error("Failed to load appeal records:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  return (
    <div className="space-y-32 max-w-7xl mx-auto py-12">
      <section className="relative text-left">
        <div className="max-w-4xl mb-20 space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-px bg-primary/20 w-12" />
            <span className="text-[12px] sm:text-sm font-light tracking-[0.45em] text-primary opacity-45 uppercase">
              Your Dashboard
            </span>
          </div>

          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl text-primary font-light leading-[1.08] tracking-tight -ml-1"
          >
            Welcome, <span className="font-light italic text-primary/60">{firstName}</span>.
          </motion.h1>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-on-surface-variant font-medium text-xl md:text-2xl opacity-80">
            <div className="flex items-center gap-4 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[11px] font-light uppercase tracking-widest text-green-700">Signed In</span>
            </div>
            <p className="leading-relaxed font-serif max-w-xl text-primary/70">
              Ready to help you build a clear, professional grade appeal.
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartAppeal}
          className="w-full bg-primary text-white p-10 md:p-14 rounded-[3rem] shadow-2xl flex flex-col xl:flex-row items-center justify-between gap-10 group relative overflow-hidden transition-all border border-white/10"
        >
          <div className="absolute inset-0 paper-texture opacity-10 mix-blend-overlay pointer-events-none" />
          <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />

          <div className="flex items-center gap-10 relative z-10 text-left">
            <div className="p-6 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-xl shadow-xl group-hover:scale-110 transition-transform">
              <ICONS.Plus size={48} strokeWidth={2} className="text-white" />
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl md:text-5xl font-serif font-light tracking-tight leading-tight">Start New Appeal</h2>
              <p className="text-white/60 font-serif italic text-lg md:text-xl max-w-lg leading-relaxed">Upload your graded assignment and let Regrade analyze your case.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 relative z-10 bg-white text-primary px-10 py-5 rounded-full group-hover:bg-white/90 transition-all shadow-xl hover:scale-105">
            <span className="font-light uppercase tracking-[0.28em] text-xs">Get started</span>
            <ICONS.ArrowRight className="group-hover:translate-x-2 transition-transform w-5 h-5" />
          </div>
        </motion.button>
      </section>

      <div className="grid grid-cols-1 gap-10 lg:gap-12">
        <motion.div className="glass-panel rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-full border border-primary/10 bg-white shadow-xl">
          <div className="md:w-2/5 h-64 md:h-auto overflow-hidden relative">
            <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
              <ICONS.FileText size={80} className="text-primary/10" />
            </div>
          </div>
          <div className="md:w-3/5 p-12 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-light uppercase tracking-[0.22em] text-[#006c49] bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20">
                  {latestCase ? latestCase.status : 'No appeals yet'}
                </span>
                {latestCase && (
                  <span className="font-mono text-[11px] text-primary/40 uppercase tracking-widest">{latestCase.ref}</span>
                )}
              </div>
              <h3 className="font-serif text-4xl text-primary font-light leading-tight tracking-tight">
                {latestCase ? latestCase.title : 'No active appeal'}
              </h3>
              <p className="text-lg text-primary/60 font-serif italic leading-relaxed">
                {latestCase ? latestCase.description : 'Start your first appeal to get a detailed analysis of your grading.'}
              </p>
            </div>

            <div className="space-y-6 pt-8 border-t border-primary/5">
              <div className="flex items-center justify-between text-[11px] font-light uppercase tracking-[0.28em] text-primary/50">
                <span>Appeal Progress</span>
                <span className="text-primary">{latestCase ? `${latestCase.progress}% Complete` : '0%'}</span>
              </div>
              <div className="flex gap-4">
                {['Evidence', 'Analyzed', 'Submitted'].map((label, idx) => {
                  const isActive = latestCase && (
                    (idx === 0 && latestCase.evidenceLogged) ||
                    (idx === 1 && latestCase.progress >= 50) ||
                    (idx === 2 && latestCase.status === 'Resolved')
                  );
                  return (
                    <div key={label} className="flex-1 space-y-2">
                      <div className={`h-1.5 rounded-full transition-all duration-500 ${isActive ? 'bg-primary shadow-sm w-full' : 'bg-primary/10 w-1/2'}`} />
                      <p
                        className={`text-[10px] font-light uppercase tracking-widest ${isActive ? 'text-primary' : 'text-primary/30'}`}
                      >
                        {label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <section className="pb-20 max-w-2xl">
        <button
          type="button"
          onClick={onOpenChat}
          className="text-left w-full group glass-panel p-8 rounded-3xl hover:bg-primary/[0.06] transition-all border-2 border-primary/15 ring-1 ring-primary/5 min-h-[44px]"
        >
          <div className="flex items-center justify-between mb-4 text-primary group-hover:text-primary transition-colors">
            <span className="flex items-center gap-2">
              <ICONS.MessageSquare size={24} strokeWidth={1.75} />
              <span className="text-[10px] font-light uppercase tracking-[0.35em] text-secondary">Live</span>
            </span>
            <ICONS.ArrowRight size={20} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
          </div>
          <h4 className="font-serif text-2xl md:text-[1.65rem] text-primary font-light mb-2">Appeal assistant chat</h4>
          <p className="text-[13px] sm:text-sm text-on-surface-variant/70 font-light leading-relaxed tracking-tight">
            Ask how to read feedback, frame an appeal, or what to send your instructor. Same assistant as the{' '}
            <span className="text-primary/80">Chat</span> tab — open anytime.
          </p>
        </button>
      </section>
    </div>
  );
}
