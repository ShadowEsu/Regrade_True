import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ICONS } from '../constants';
import type { Case } from '../services/caseService';
import {
  getPossiblePointsBack,
  getClassName,
  getScoreDisplay,
  getNextStep,
} from '../lib/appealHelpers';

function statusLabel(status: Case['status']) {
  if (status === 'Resolved') return 'Won';
  if (status === 'Draft Ready') return 'Draft ready';
  return 'In progress';
}

export default function AppealCard({
  appeal,
  onOpen,
  flat = false,
}: {
  appeal: Case;
  onOpen: (id: string) => void;
  flat?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const pts = getPossiblePointsBack(appeal);
  const confidence = appeal.analysis?.confidence?.overall_confidence;

  const wrapper = flat ? '' : 'rg-card overflow-hidden';

  return (
    <motion.div layout className={wrapper}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="rg-serif font-semibold text-ink truncate">{appeal.title}</h3>
              <p className="text-sm text-ink-muted">{getClassName(appeal)}</p>
            </div>
            <span className="shrink-0 text-xs font-medium text-primary">{statusLabel(appeal.status)}</span>
          </div>

          <div className="flex gap-4 text-sm">
            <span className="text-ink-muted">
              Score <span className="text-ink font-medium">{getScoreDisplay(appeal)}</span>
            </span>
            {pts > 0 && <span className="text-primary font-medium">+{pts} pts</span>}
          </div>

          <p className="text-xs text-ink-muted">
            Next: <span className="text-ink">{getNextStep(appeal)}</span>
          </p>
        </div>

        <ICONS.ChevronDown
          className={`w-4 h-4 text-ink-muted shrink-0 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
          strokeWidth={2}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-divider space-y-3">
              {confidence != null && (
                <div className="flex justify-between text-sm py-1">
                  <span className="rg-meta-k">Confidence</span>
                  <span className="rg-meta-v">{Math.round(confidence * 100)}%</span>
                </div>
              )}
              {appeal.analysis?.case_analysis?.strongest_appeal_points?.[0] && (
                <p className="text-sm text-ink-muted leading-relaxed border-l-2 border-l-primary pl-3">
                  {appeal.analysis.case_analysis.strongest_appeal_points[0]}
                </p>
              )}
              <button type="button" onClick={() => appeal.id && onOpen(appeal.id)} className="rg-btn-primary w-full text-sm py-2.5">
                Continue
                <ICONS.ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
