import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import BrandSpinner from '../components/BrandSpinner';
import AppealCard from '../components/AppealCard';
import { EmptyState, PageHeader, PrimaryButton, StepProgress, SurfaceCard } from '../components/mobile/MobilePrimitives';
import { caseService, Case } from '../services/caseService';

const STEPS = ['Upload', 'Analyze', 'Annotate', 'Evidence', 'Draft'];

export default function Appeals({
  onStartNew,
  onOpenAppeal,
}: {
  onStartNew: () => void;
  onOpenAppeal: (caseId: string) => void;
}) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        setCases(await caseService.getUserCases());
      } catch {
        setLoadError('Your saved appeals could not be loaded. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [loadAttempt]);

  return (
    <div className="rg3-screen rg3-appeals-screen">
      <PageHeader eyebrow="Appeal" title="Review a grade." subtitle="Evidence first. You stay in control." />
      <StepProgress steps={STEPS} active={0} />
      <SurfaceCard className="rg3-appeal-hero">
        <motion.div className="rg3-appeal-orbit" animate={{ y: [0, -5, 0] }} transition={{ duration: 3.5, repeat: Infinity }}><ICONS.Search /></motion.div>
        <span className="rg3-eyebrow">New appeal</span>
        <h2>Find what the marking may have missed.</h2>
        <p>Add a marked paper, rubric, or teacher feedback. Regrade separates evidence from uncertainty.</p>
        <div className="rg3-source-grid"><div><ICONS.Upload /><strong>Upload</strong><small>PDF or photo</small></div><div><ICONS.Search /><strong>Analyze</strong><small>Rubric-aware</small></div><div><ICONS.Send /><strong>Draft</strong><small>Your approval</small></div></div>
        <PrimaryButton onClick={onStartNew}>Start an appeal <ICONS.ArrowRight /></PrimaryButton>
      </SurfaceCard>

      {loading ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <BrandSpinner size={28} />
          <p className="rg-section-title">One moment…</p>
        </div>
      ) : loadError ? (
        <section className="rg2-card p-6 text-center space-y-4" role="alert">
          <p className="text-sm text-ink-muted">{loadError}</p>
          <button type="button" className="rg-action-button mx-auto" onClick={() => setLoadAttempt((value) => value + 1)}>Retry</button>
        </section>
      ) : cases.length > 0 ? (
        <section className="space-y-4"><div className="rg3-section-title"><div><span>Saved</span><h2>Your appeals</h2></div><small>{cases.length} total</small></div>
          <div className="space-y-3">
            {cases.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rg2-card overflow-hidden"
              >
                <AppealCard appeal={c} onOpen={onOpenAppeal} flat />
              </motion.div>
            ))}
          </div>
        </section>
      ) : <EmptyState icon={<ICONS.FileText />} title="No appeals yet" body="Your evidence-backed drafts and outcomes will appear here." action="Start your first appeal" onAction={onStartNew} />}
    </div>
  );
}
