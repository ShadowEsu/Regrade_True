import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import { caseService, Case } from '../services/caseService';
import AppealFlowShell from '../components/AppealFlowShell';
import { getPossiblePointsBack } from '../lib/appealHelpers';

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
    if (caseId) {
      caseService.getCaseById(caseId).then((data) => {
        if (data) setCurrentCase(data);
      });
    }
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
    (analysis?.case_analysis?.unexplained_deductions?.length ?? 0) > 0
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

  const evidenceChips =
    analysis?.case_analysis?.strongest_appeal_points?.slice(0, 3) ??
    analysis?.case_analysis?.unexplained_deductions?.map(
      (d) => `Q${d.question_id}: −${d.points_lost} pts unexplained`,
    ) ??
    [];

  return (
    <AppealFlowShell
      step="evidence"
      title="Here's what we found."
      subtitle="Rubric basis, points at stake, and your strongest angle."
      onBack={onBack}
    >
      <div className="space-y-4">
        {analysis && (
          <div className="rg-card p-4 flex items-center justify-between">
            <div>
              <p className="rg-meta-k">Current score</p>
              <p className="rg-meta-v mt-0.5">
                {analysis.assignment.total_score_display ||
                  `${analysis.assignment.total_score_earned}/${analysis.assignment.total_score_possible}`}
              </p>
            </div>
            {pts > 0 && (
              <div className="text-right">
                <p className="rg-meta-k">Recoverable</p>
                <p className="rg-meta-v text-primary mt-0.5">+{pts}</p>
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
              <div>
                <p className="rg-meta-k">{item.label}</p>
                <p className="text-[14px] font-medium text-ink mt-0.5 capitalize">
                  {item.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {evidenceChips.length > 0 && (
          <div>
            <p className="rg-section-title mb-2">Evidence</p>
            <div className="flex flex-wrap gap-2">
              {evidenceChips.map((chip, i) => (
                <span
                  key={i}
                  className="rg-pill text-[12px] px-3 py-1.5 leading-snug"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        )}

        {analysis?.case_analysis?.case_strength_reason && (
          <div className="rg-card p-4">
            <p className="rg-meta-k mb-1">AI summary</p>
            <p className="text-[14px] text-ink-80 leading-relaxed">
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
          <p className="text-center text-[12px] text-muted">
            Next: review your professor-safe message
          </p>
        </div>
      </div>
    </AppealFlowShell>
  );
}
