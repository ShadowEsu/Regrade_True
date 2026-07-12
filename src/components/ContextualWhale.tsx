import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ICONS } from '../constants';
import { chatWithAdvocate } from '../lib/gemini';
import { buildCaseContextForAdvocate } from '../lib/appealDraft';
import type { AnalysisResult } from '../types';
import CoachWhale from './CoachWhale';
import ChatMarkdown from './ChatMarkdown';

export default function ContextualWhale({ analysis, selectedQuestionId }: { analysis: AnalysisResult; selectedQuestionId?: string | null }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const question = analysis.questions.find((item) => item.question_id === selectedQuestionId) ?? analysis.questions[0];
  const context = useMemo(() => `${buildCaseContextForAdvocate(analysis)}\n\nCURRENT VIEW:\n${JSON.stringify({ selectedQuestionId: question?.question_id, question }, null, 2)}`.slice(0, 24_000), [analysis, question]);

  const ask = async (suggestion?: string) => {
    const message = (suggestion ?? input).trim();
    if (!message || loading) return;
    setLoading(true); setAnswer(null);
    try { setAnswer(await chatWithAdvocate(message, [], { caseContext: context })); setInput(''); }
    catch { setAnswer('Mr Whale could not reach the review service. Your exam and annotations are still safe.'); }
    finally { setLoading(false); }
  };

  return <section className="rg2-context-whale">
    <button type="button" className="rg2-context-whale-head" onClick={() => setOpen((value) => !value)} aria-expanded={open}><CoachWhale size={38} /><span><strong>Ask Mr Whale</strong><small>{question ? `Current context: ${question.question_id}` : 'Current exam context attached'}</small></span><ICONS.ChevronDown className={open ? 'rotate-180' : ''} /></button>
    <AnimatePresence initial={false}>{open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="rg2-context-whale-body">
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void ask(`Explain ${question?.question_id ?? 'this exam'} step by step.`)}>Explain this</button><button type="button" onClick={() => void ask('Give me one similar practice question without the answer.')}>Practice question</button><button type="button" onClick={() => void ask('What evidence here could support a respectful clarification request?')}>Appeal evidence</button></div>
      {answer && <div className="rg2-context-answer"><ChatMarkdown text={answer} /></div>}
      {loading && <p className="flex items-center gap-2 text-[12px] text-ink-muted"><ICONS.Loader2 className="h-4 w-4 animate-spin text-primary" />Checking the current exam evidence…</p>}
      <form onSubmit={(event) => { event.preventDefault(); void ask(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Ask about ${question?.question_id ?? 'this exam'}…`} /><button type="submit" disabled={!input.trim() || loading} aria-label="Send to Mr Whale"><ICONS.ArrowUp /></button></form>
    </div></motion.div>}</AnimatePresence>
  </section>;
}
