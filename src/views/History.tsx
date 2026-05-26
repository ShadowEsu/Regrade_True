import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import BrandSpinner from '../components/BrandSpinner';
import { caseService, Case } from '../services/caseService';

export default function History() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await caseService.getUserCases();
        setCases(data);
      } catch (err) {
        console.error("Failed to load appeal history:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="space-y-16 max-w-5xl mx-auto">
      <header className="flex items-end justify-between border-b border-primary/5 pb-8">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/30 block mb-2">My Appeals</span>
          <h2 className="text-5xl md:text-6xl text-primary font-semibold">Appeal History</h2>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          <div className="text-center py-20 opacity-20">
            <BrandSpinner size={40} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Loading your appeals...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-3xl border-dashed border-2 border-primary/5">
            <p className="text-on-surface-variant italic opacity-40 text-lg">No appeals yet. Start your first one from the Home tab.</p>
          </div>
        ) : (
          cases.map((appeal, idx) => (
            <motion.div 
              key={appeal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group flex flex-col md:flex-row items-start md:items-center gap-8 glass-panel p-8 rounded-[2rem] hover:bg-white transition-all cursor-pointer border border-primary/5"
            >
              <div className="bg-primary/5 p-6 rounded-2xl text-primary/40 group-hover:text-primary transition-colors">
                 <ICONS.FileText size={28} strokeWidth={1} />
              </div>
              
              <div className="flex-1 space-y-2">
                 <div className="flex items-center gap-3">
                   <span className="text-[10px] font-mono opacity-40 uppercase tracking-tighter">{appeal.ref}</span>
                   <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                     appeal.status === 'Resolved' ? 'bg-secondary/10 text-secondary' : 'bg-primary/5 text-primary/60'
                   }`}>{appeal.status}</span>
                 </div>
                 <h3 className="text-2xl text-primary font-semibold tracking-tight translate-y-[-2px]">{appeal.title}</h3>
                 <p className="text-xs text-on-surface-variant italic opacity-40">
                   {(() => {
                     const raw = appeal.createdAt;
                     const d =
                       typeof raw?.toDate === 'function'
                         ? raw.toDate()
                         : raw instanceof Date
                           ? raw
                           : null;
                     return d ? d.toLocaleDateString() : '';
                   })()}
                 </p>
              </div>

              <div className="text-right space-y-2 w-full md:w-auto">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-primary/30">Status</p>
                 <p className="text-xl text-primary italic font-medium whitespace-nowrap">
                   {appeal.status === 'Resolved' ? 'Resolved' : 'In Progress'}
                 </p>
                 <div className="flex justify-end gap-2 text-primary/40 group-hover:text-primary transition-all">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">View details</span>
                    <ICONS.ArrowRight size={14} />
                 </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="glass-panel p-12 rounded-[3rem] text-center bg-primary/5 border border-primary/5 border-dashed">
         <div className="flex justify-center mb-6 text-primary/20">
           <ICONS.Shield size={48} strokeWidth={0.5} />
         </div>
         <h4 className="text-2xl text-primary font-medium mb-4">Start a New Appeal</h4>
         <p className="text-sm text-on-surface-variant max-w-sm mx-auto italic mb-8 opacity-60">
            Have a new grade to dispute? Head to the Appeal tab and Regrade will walk you through it step by step.
         </p>
      </div>

    </div>
  );
}
