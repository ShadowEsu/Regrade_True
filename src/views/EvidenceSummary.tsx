import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import { caseService, Case } from '../services/caseService';
import AppealFlowShell from '../components/AppealFlowShell';
import { getPossiblePointsBack } from '../lib/appealHelpers';

function formatScore(analysis: NonNullable<Case['analysis']>) {
  const a = analysis.assignment;
  if (a.total_score_display) return a.total_score_display;
  if (a.total_score_earned != null && a.total_score_possible != null) {
    return `${a.total_score_earned} / ${a.total_score_possible} pts`;
  }
  return '—';
}

function buildEvidenceBullets(analysis: NonNullable<Case['analysis']>): string[] {
  const fromAppeal = analysis.case_analysis.strongest_appeal_points?.slice(0, 3);
  if (fromAppeal?.length) return fromAppeal;

  return (
    analysis.case_analysis.unexplained_deductions?.slice(0, 3).map(
      (d) => `${d.question_id}: ${d.what_is_missing}`,
    ) ?? []
  );
}

export default function EvidenceSummary({
  caseId,
  onFinalize,
  onBack,
}: {
  caseId: string | null;
  onFinalize: () => void;
  onBack?: () => void;
}) {
  const [currentCase, setCurrentCase] = useState<Case | null>(null);

  useEffect(() => {
    if (!caseId) return;
    let cancelled = false;
    caseService
      .getCaseById(caseId)
      .then((data) => {
        if (!cancelled && data) setCurrentCase(data);
      })
      .catch(() => {
        /* summary view degrades gracefully without analysis data */
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const analysis = currentCase?.analysis;
  const pts = currentCase ? getPossiblePointsBack(currentCase) : 0;

  const insights = [
    analysis?.case_analysis?.recommended_appeal_angle
      ? {
          label: 'Strongest angle',
          value: analysis.case_analysis.recommended_appeal_angle.replace(/_/g, ' '),
          icon: ICONS.Zap,
          color: 'text-primary',
        }
      : null,
    (analysis?.case_analysis?.unexplained_deductions?.length ?? 0) > 0 ||
    (analysis?.case_analysis?.potential_calculation_errors?.length ?? 0) > 0
      ? {
          label: 'Possible issue',
          value: 'Partial credit or explanation missing',
          icon: ICONS.AlertCircle,
          color: 'text-[#d97706]',
        }
      : null,
    {
      label: 'Recommended tone',
      value: 'Respectful and specific',
      icon: ICONS.MessageSquare,
      color: 'text-primary',
    },
  ].filter(Boolean) as {
    label: string;
    value: string;
    icon: typeof ICONS.Zap;
    color: string;
  }[];

  const evidenceBullets = analysis ? buildEvidenceBullets(analysis) : [];

  return (
    <AppealFlowShell
      step="evidence"
      title="Here's what we found."
      subtitle="Rubric basis, points at stake, and your strongest angle."
      onBack={onBack}
    >
      <div className="space-y-4">
        {analysis && (
          <div className="rg-score-card p-4 flex items-center justify-between gap-4">
            <div>
              <p className="rg-meta-k">Current score</p>
              <p className="text-[22px] font-semibold text-ink tracking-tight mt-0.5 leading-none">
                {formatScore(analysis)}
              </p>
            </div>
            {pts > 0 && (
              <div className="text-right">
                <p className="rg-meta-k">Recoverable</p>
                <p className="text-[22px] font-semibold text-primary tracking-tight mt-0.5 leading-none">
                  +{pts}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          {insights.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rg-insight flex items-start gap-3"
            >
              <item.icon className={`w-4 h-4 mt-0.5 shrink-0 ${item.color}`} strokeWidth={2} />
              <div className="min-w-0">
                <p className="rg-meta-k">{item.label}</p>
                <p className="text-[14px] font-medium text-ink mt-0.5 capitalize">
                  {item.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {evidenceBullets.length > 0 && (
          <div className="space-y-2">
            <p className="rg-section-title">Evidence</p>
            <div className="space-y-2.5">
              {evidenceBullets.map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="rg-evidence-bubble"
                >
                  {text}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {analysis?.case_analysis?.case_strength_reason && (
          <div className="rg-summary-card p-4">
            <p className="rg-meta-k mb-1.5">AI summary</p>
            <p className="text-[14px] text-ink/80 leading-relaxed">
              {analysis.case_analysis.case_strength_reason}
            </p>
          </div>
        )}

        <div className="pt-2 space-y-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onFinalize}
            className="rg-btn-primary w-full py-3.5 text-[15px] group"
          >
            Continue to draft
            <ICONS.ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
          <p className="text-center text-[12px] text-ink-muted">
            Next: review your professor-safe message
          </p>
        </div>
      </div>
    </AppealFlowShell>
  );
}
