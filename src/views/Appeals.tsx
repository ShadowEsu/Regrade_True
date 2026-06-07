import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import BrandSpinner from '../components/BrandSpinner';
import AppealCard from '../components/AppealCard';
import MarketingEyebrow from '../components/MarketingEyebrow';
import { caseService, Case } from '../services/caseService';

export default function Appeals({
  onStartNew,
  onOpenAppeal,
}: {
  onStartNew: () => void;
  onOpenAppeal: (caseId: string) => void;
}) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setCases(await caseService.getUserCases());
      } catch (err) {
        console.error('Failed to load appeals:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <MarketingEyebrow>transparency</MarketingEyebrow>
          <h1 className="rg-display text-2xl">Replay any appeal.</h1>
          <p className="rg-lead text-base">
            {cases.length > 0
              ? `${cases.length} case${cases.length === 1 ? '' : 's'} in your log`
              : 'Every appeal, its rubric basis, and the points you won.'}
          </p>
        </div>
        <button type="button" onClick={onStartNew} className="rg-btn-primary text-sm px-4 py-2 shrink-0">
          New
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <BrandSpinner size={28} />
          <p className="rg-section-title">One moment…</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="rg-card p-8 text-center space-y-4">
          <MarketingEyebrow>get started</MarketingEyebrow>
          <p className="rg-display text-xl">No appeals in your log yet.</p>
          <p className="rg-lead text-base max-w-xs mx-auto">
            Upload graded work — we find rubric mismatches and draft the email.
          </p>
          <button type="button" onClick={onStartNew} className="rg-btn-primary">
            Start new appeal
          </button>
        </div>
      ) : (
        <div className="rg-card divide-y divide-divider overflow-hidden">
          {cases.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
            >
              <AppealCard appeal={c} onOpen={onOpenAppeal} flat />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
