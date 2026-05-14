import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import { caseService, Case } from '../services/caseService';

export default function EvidenceSummary({ caseId, onFinalize }: { caseId: string | null, onFinalize: () => void }) {
  const [tone, setTone] = useState(50);
  const [isSignOpen, setIsSignOpen] = useState(false);
  const [currentCase, setCurrentCase] = useState<Case | null>(null);

  useEffect(() => {
    if (caseId) {
      caseService.getCaseById(caseId).then(data => {
        if (data) setCurrentCase(data);
      });
    }
  }, [caseId]);

  return (
    <div className="space-y-24 max-w-7xl mx-auto">
      {/* Evidence Bento Section */}
      <section className="space-y-10">
        <div className="flex items-center gap-6">
          <div className="flex-1 h-px bg-primary/10" />
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/40 block mb-3">Analysis Summary</span>
            <h2 className="font-serif text-5xl md:text-6xl text-primary font-light tracking-tight">Your Case</h2>
          </div>
          <div className="flex-1 h-px bg-primary/10" />
        </div>

        {currentCase?.analysis && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-[2.5rem] p-10 md:p-12 border border-primary/10 bg-white space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary/40 mb-2">From your materials</p>
                <h3 className="font-serif text-3xl md:text-4xl text-primary font-light tracking-tight">
                  {currentCase.analysis.assignment.title || currentCase.title || 'Your submission'}
                </h3>
                {currentCase.analysis.assignment.subject && (
                  <p className="text-sm text-primary/50 font-serif italic mt-1">{currentCase.analysis.assignment.subject}</p>
                )}
              </div>
              <div className="text-left md:text-right space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Score (as read by AI)</p>
                <p className="font-serif text-2xl text-primary font-medium">
                  {currentCase.analysis.assignment.total_score_display ||
                    (currentCase.analysis.assignment.total_score_earned != null &&
                    currentCase.analysis.assignment.total_score_possible != null
                      ? `${currentCase.analysis.assignment.total_score_earned} / ${currentCase.analysis.assignment.total_score_possible}`
                      : 'See question breakdown')}
                </p>
                <p className="text-xs text-on-surface-variant">
                  Case strength:{' '}
                  <span className="font-bold text-primary uppercase tracking-wide">
                    {currentCase.analysis.case_analysis.overall_case_strength}
                  </span>
                  {typeof currentCase.analysis.confidence?.overall_confidence === 'number' && (
                    <span className="text-primary/50">
                      {' '}
                      · Confidence {Math.round(currentCase.analysis.confidence.overall_confidence * 100)}%
                    </span>
                  )}
                </p>
              </div>
            </div>

            {currentCase.analysis.case_analysis?.case_strength_reason && (
              <p className="text-sm text-primary/70 font-serif italic leading-relaxed border-l-4 border-secondary/40 pl-4">
                {currentCase.analysis.case_analysis.case_strength_reason}
              </p>
            )}

            {currentCase.analysis.questions?.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-primary/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-primary/[0.04] text-[10px] font-bold uppercase tracking-widest text-primary/50">
                    <tr>
                      <th className="px-4 py-3">Question</th>
                      <th className="px-4 py-3">Points</th>
                      <th className="px-4 py-3 hidden sm:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5 font-serif text-primary/80">
                    {currentCase.analysis.questions.slice(0, 12).map((q) => (
                      <tr key={q.question_id}>
                        <td className="px-4 py-3 font-medium">{q.question_id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {q.points_earned != null && q.points_possible != null
                            ? `${q.points_earned} / ${q.points_possible}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-primary/60 hidden sm:table-cell max-w-md truncate">
                          {q.question_description || (q.deductions_with_no_comment ? 'Deductions without clear comment' : '')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {[
            {
              icon: ICONS.Check,
              title: 'Rubric Alignment',
              val: 'KEY FINDING',
              desc: currentCase?.analysis?.case_analysis?.strongest_appeal_points?.[0]
                ? String(currentCase.analysis.case_analysis.strongest_appeal_points[0])
                : 'The rubric criteria and how your work was graded may not fully align. Review the table above and your letter draft.',
              color: 'text-primary bg-primary/5'
            },
            {
              icon: ICONS.Library,
              title: 'Grading Consistency',
              val: 'REVIEWED',
              desc: currentCase?.analysis?.case_analysis?.fairness_review?.summary_if_marking_questionable
                ? String(currentCase.analysis.case_analysis.fairness_review.summary_if_marking_questionable)
                : 'We checked whether the grading is consistent with the stated rubric and any course policies that apply.',
              color: 'text-secondary bg-secondary/5'
            },
            {
              icon: ICONS.FileText,
              title: 'Missing Feedback',
              val: 'FLAGGED',
              desc:
                (currentCase?.analysis?.case_analysis?.unexplained_deductions?.length ?? 0) > 0
                  ? `${currentCase?.analysis?.case_analysis?.unexplained_deductions?.length} area(s) with points off but unclear explanation.`
                  : 'Points were deducted without a written explanation. You have the right to ask why marks were taken.',
              color: 'text-[#735c00] bg-[#735c00]/5'
            }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -12, scale: 1.02 }}
              className="glass-panel p-12 rounded-[3.5rem] flex flex-col gap-10 transition-all duration-500 hover:shadow-huge bg-white border-2 border-primary/5"
            >
              <div className="flex justify-between items-start">
                <div className={`p-4 rounded-2xl ${item.color} shadow-sm`}>
                  <item.icon size={24} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-primary/40 uppercase font-mono italic">{item.val}</span>
              </div>
              <div className="space-y-3">
                <h3 className="font-serif text-2xl text-primary font-medium tracking-tight uppercase">{item.title}</h3>
                <p className="text-sm text-primary/60 font-serif italic leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-24">
          <div className="glass-panel p-12 rounded-[3.5rem] space-y-12 bg-primary/[0.02] border-2 border-primary/5 shadow-huge">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary leading-none">Letter Tone</h4>
            
            <div className="space-y-12 relative px-2">
              <div className="h-[4px] bg-primary/10 rounded-full w-full relative">
                 <motion.div 
                   animate={{ left: `${tone}%` }}
                   className="absolute -top-[6px] -ml-2 w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_rgba(0,35,111,0.6)] cursor-pointer border-2 border-white"
                 />
                 <input 
                   type="range" 
                   min="0" max="100" 
                   value={tone}
                   onChange={(e) => setTone(parseInt(e.target.value))}
                   className="absolute inset-0 opacity-0 cursor-pointer"
                 />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-primary/30 uppercase tracking-widest italic">
                <span>Analytical</span>
                <span>Assertive</span>
              </div>
            </div>
            
            <p className="text-lg text-primary/50 font-serif italic leading-relaxed">
              {tone < 33 ? 'Calm and analytical — best for straightforward rubric errors.' : tone < 66 ? 'Balanced — professional and firm without being aggressive.' : 'Assertive — clearly pushes back on the grading decision.'}
            </p>
          </div>

          <div className="space-y-12 pl-12">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/30 leading-none">Review Pipeline Milestone</h4>
            <div className="space-y-16 relative">
              <div className="absolute left-[-32px] top-4 bottom-4 w-[2px] bg-primary/5" />
              {[
                { step: 1, title: 'Review the Analysis', desc: 'Check the findings and confirm they match what happened.', active: true },
                { step: 2, title: 'Review the Letter', desc: 'Read your draft and adjust the tone if needed.', active: false },
                { step: 3, title: 'Submit Your Appeal', desc: 'Send the letter to your professor or review committee.', active: false },
              ].map((s, idx) => (
                <div key={idx} className="relative group">
                  <div className={`absolute -left-[43px] top-1 w-6 h-6 rounded-xl border-2 bg-white transition-all shadow-huge ${
                    s.active ? 'bg-primary border-primary scale-110' : 'border-primary/10'
                  }`} />
                  <p className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-2 leading-none ${s.active ? 'text-primary' : 'text-primary/20'}`}>
                    PHASE {s.step}: {s.title}
                  </p>
                  <p className="text-lg text-primary/40 font-serif italic leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Paper Editor */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#fdfcf7] shadow-huge rounded-sm p-16 md:p-32 min-h-[1200px] w-full border border-primary/5 flex flex-col relative transition-all"
          >
            <div className="absolute inset-0 paper-texture opacity-40 pointer-events-none" />
            
            <header className="border-b-2 border-primary/10 pb-16 mb-16 flex justify-between items-start relative z-10">
              <div className="space-y-4">
                {[
                  { label: 'TO:', val: 'Professor / Academic Review Committee' },
                  { label: 'FROM:', val: 'Student (You)' },
                  { label: 'DATE:', val: currentCase?.createdAt?.toDate ? currentCase.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString() },
                  { label: 'RE:', val: currentCase?.title || 'Grade Appeal' }
                ].map((row, i) => (
                  <div key={i} className="flex gap-6">
                     <p className="font-bold text-primary/30 uppercase tracking-[0.3em] text-[10px] min-w-[70px] mt-[1px]">{row.label}</p>
                     <p className={`text-lg font-serif ${row.label === 'CASE:' ? 'font-bold text-primary italic' : 'text-primary/80 font-medium'}`}>{row.val}</p>
                  </div>
                ))}
              </div>
              <div className="p-5 bg-primary/5 rounded-[2rem] text-primary/20 hover:text-primary transition-all cursor-pointer border-2 border-primary/5 active:scale-95">
                <ICONS.Edit size={24} />
              </div>
            </header>

            <div className="flex-grow font-serif text-xl text-primary/80 space-y-8 leading-relaxed text-justify relative z-10">
              <p className="text-2xl font-medium italic mb-10 text-primary tracking-tight">Dear Professor / Review Committee,</p>

              <p>
                I am writing to formally request a reconsideration of the grade I received on{' '}
                <span className="bg-primary/5 border-b border-primary/20 px-1 mx-1 inline-block pb-0.5">
                  {currentCase?.title || 'my recent assignment'}
                </span>.
                After carefully reviewing my work against the rubric and the feedback provided, I believe there are specific areas where the grading may not accurately reflect my performance.
              </p>

              <p>
                {currentCase?.analysis?.case_analysis?.strongest_appeal_points?.[0]
                  ? `Specifically, ${currentCase.analysis.case_analysis.strongest_appeal_points[0]}`
                  : 'In particular, I noticed that certain deductions were made without a written explanation tied to a specific rubric criterion, which makes it difficult to understand what was expected and how to improve.'}
              </p>

              <p>
                {currentCase?.analysis?.case_analysis?.strongest_appeal_points?.[1]
                  ? currentCase.analysis.case_analysis.strongest_appeal_points[1]
                  : 'I have reviewed the grading rubric in detail and believe that my submission met the stated criteria for the points in question. I am happy to discuss this further and provide any additional context that would be helpful.'}
              </p>

              <p className="pt-8 text-xl">
                I appreciate your time and I am open to a conversation about this. I am not disputing the grading lightly — I simply want to make sure the evaluation reflects my actual work.
              </p>

              <div className="pt-16 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/30 ml-1">Signed</p>
                <p className="font-serif italic text-4xl font-light text-primary/95">Your Name</p>
              </div>
            </div>

            <footer className="mt-16 pt-8 border-t border-primary/5 flex justify-between items-center opacity-30 relative z-10">
              <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-primary">Generated by Regrade</p>
              <p className="text-[9px] text-primary/40 font-mono">{new Date().toLocaleDateString()}</p>
            </footer>
          </motion.div>
        </div>
      </div>

      {/* Persistent Action Bar */}
      <div className="sticky bottom-16 left-0 right-0 z-50 flex justify-center px-4">
        <motion.div 
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-panel max-w-5xl w-full rounded-[3rem] py-8 px-16 flex flex-col md:flex-row justify-between items-center gap-10 shadow-huge bg-[#001438] text-white border-2 border-white/10"
        >
          <div className="flex items-center gap-10">
             <div className="flex flex-col">
               <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 leading-none mb-1">Status</span>
               <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#6cf8bb]">Appeal Letter Ready</span>
             </div>
             <div className="h-12 w-px bg-white/10 hidden md:block" />
          </div>
          <div className="flex gap-4 sm:gap-6 w-full md:w-auto">
             <button type="button" className="flex-1 md:flex-none flex items-center justify-center gap-3 min-h-[3.25rem] px-6 sm:px-10 py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all text-[11px] font-bold uppercase tracking-[0.25em] text-white/70">
               <ICONS.Download size={22} /> Download PDF
             </button>
             <button 
               type="button"
               onClick={onFinalize}
               className="flex-1 md:flex-none flex items-center justify-center gap-3 min-h-[3.25rem] px-8 sm:px-12 py-4 rounded-2xl bg-primary text-white hover:shadow-[0_0_30px_rgba(0,35,111,0.5)] transition-all text-[11px] font-bold uppercase tracking-[0.25em] shadow-xl border border-white/20 active:scale-[0.98]"
             >
               View Full Report <ICONS.ArrowRight size={22} />
             </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
