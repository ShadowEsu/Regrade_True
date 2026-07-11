import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ICONS } from '../constants';
import { caseService, Case } from '../services/caseService';
import AppealDraftPanel from '../components/AppealDraftPanel';
import AppealFlowShell from '../components/AppealFlowShell';
import { getPossiblePointsBack } from '../lib/appealHelpers';

const PLATFORM_NAMES: Record<string, string> = {
  gradescope: 'Gradescope',
  canvas: 'Canvas',
  moodle: 'Moodle',
  blackboard: 'Blackboard',
  brightspace: 'D2L Brightspace',
  google_classroom: 'Google Classroom',
  turnitin: 'Turnitin',
  paper: 'Marked paper',
  schoology: 'Schoology',
  teams: 'Microsoft Teams',
  mixed: 'Multiple platforms',
};

function strengthLabel(strength?: string) {
  if (strength === 'strong') return 'Strong case';
  if (strength === 'moderate') return 'Moderate case';
  if (strength === 'weak') return 'Limited case';
  return 'Under review';
}

export function strengthRating(strength?: string): number {
  if (strength === 'strong') return 5;
  if (strength === 'moderate') return 3;
  if (strength === 'weak') return 2;
  return 1;
}

function AppealStrengthMeter({ strength }: { strength?: string }) {
  const rating = strengthRating(strength);
  return (
    <div className="mt-2" aria-label={`Appeal strength ${rating} out of 5`}>
      <div className="flex items-center gap-1.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((level) => (
          <span
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors ${level <= rating ? 'bg-primary' : 'bg-ink/10'}`}
          />
        ))}
      </div>
      <p className="mt-1 text-[10px] font-medium text-ink-muted">{rating} / 5 appeal strength</p>
    </div>
  );
}

type AppealFinding = {
  id: string;
  title: string;
  points: number;
  summary: string;
  detail: string;
};

function buildFindings(analysis: NonNullable<Case['analysis']>): AppealFinding[] {
  const items: AppealFinding[] = [];

  for (const err of analysis.case_analysis.potential_calculation_errors ?? []) {
    items.push({
      id: `calc-${err.question_id}`,
      title: err.question_id,
      points: Math.abs(Number(err.discrepancy) || 0),
      summary: `Score may not match rubric items (${err.actual_score_shown} shown vs ${err.expected_score} expected).`,
      detail: err.explanation,
    });
  }

  for (const d of analysis.case_analysis.unexplained_deductions ?? []) {
    items.push({
      id: `ded-${d.question_id}`,
      title: d.question_id,
      points: Number(d.points_lost) || 0,
      summary: d.what_is_missing,
      detail: d.what_is_missing,
    });
  }

  return items.slice(0, 4);
}

const AppealFindingRow: React.FC<{ finding: AppealFinding }> = ({ finding }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rg-finding-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3.5 flex items-start gap-3"
        aria-expanded={open}
      >
        <div className="mt-0.5 p-1.5 rounded-lg bg-red-500/8 text-red-600 shrink-0">
          <ICONS.AlertCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[14px] font-semibold text-ink truncate">{finding.title}</p>
            {finding.points > 0 && (
              <span className="text-[11px] font-mono text-red-600 shrink-0">−{finding.points} pts</span>
            )}
          </div>
          <p className="text-[13px] text-ink-muted leading-snug mt-1 line-clamp-2">{finding.summary}</p>
        </div>
        <ICONS.ChevronDown
          className={`w-4 h-4 text-ink-muted shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 pl-[3.25rem] text-[13px] text-ink/80 leading-relaxed border-t border-hairline pt-3">
              {finding.detail}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function VerdictReport({
  caseId,
  onBack,
  onFinish,
}: {
  caseId: string | null;
  onBack?: () => void;
  onFinish: () => void;
}) {
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    if (!caseId) {
      setLoadFailed(true);
      return;
    }
    let cancelled = false;
    setLoadFailed(false);
    caseService
      .getCaseById(caseId)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setCurrentCase(data);
          setDraftReady(Boolean(data.draftEmail?.trim()));
        }
        else setLoadFailed(true);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const analysis = currentCase?.analysis;
  const pts = currentCase ? getPossiblePointsBack(currentCase) : 0;
  const platformLabel = analysis?.source_platform
    ? PLATFORM_NAMES[analysis.source_platform] ?? analysis.source_platform
    : null;
  const findings = analysis ? buildFindings(analysis) : [];

  return (
    <AppealFlowShell
      step="draft"
      title="Draft your appeal"
      subtitle="We've written a professor-safe email from your findings. Edit it before you send."
      onBack={onBack}
    >
      <div className="space-y-4">
        {analysis && (
          <div className="rg-card p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="rg-meta-k">{strengthLabel(analysis.case_analysis.overall_case_strength)}</p>
              <AppealStrengthMeter strength={analysis.case_analysis.overall_case_strength} />
              <p className="rg-meta-v mt-0.5 truncate">
                {analysis.assignment?.title || currentCase?.title || 'Your appeal'}
              </p>
              {platformLabel && (
                <p className="text-[12px] text-ink-muted mt-0.5">From {platformLabel}</p>
              )}
            </div>
            {pts > 0 && (
              <div className="text-right shrink-0">
                <p className="rg-meta-k">Recoverable</p>
                <p className="text-[20px] font-semibold text-primary leading-none mt-0.5">+{pts}</p>
              </div>
            )}
          </div>
        )}

        {analysis ? (
          <AppealDraftPanel
            caseId={caseId}
            analysis={analysis}
            initialDraft={currentCase?.draftEmail}
            autoGenerate
            onDraftChange={(draft) => setDraftReady(Boolean(draft.trim()))}
          />
        ) : loadFailed ? (
          <div className="rg-card p-6 text-center space-y-2">
            <p className="text-[14px] font-medium text-ink">We couldn&apos;t load this case.</p>
            <p className="text-[13px] text-ink-muted">
              It may have been deleted, or your connection dropped. Go back and try again.
            </p>
          </div>
        ) : (
          <div className="rg-card p-6 text-center text-ink-muted text-[14px]">Loading your case…</div>
        )}

        {findings.length > 0 && (
          <div className="space-y-2">
            <p className="rg-section-title">Key issues cited in your draft</p>
            <div className="space-y-2">
              {findings.map((f) => (
                <AppealFindingRow key={f.id} finding={f} />
              ))}
            </div>
          </div>
        )}

        {analysis && (
          <div className="pt-1 space-y-2">
            <button
              type="button"
              onClick={onFinish}
              disabled={!draftReady}
              className="rg-btn-primary w-full py-3 text-[14px] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ICONS.Check className="h-4 w-4" strokeWidth={2.25} />
              Finish draft
              <ICONS.ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
            <p className="text-center text-[12px] text-ink-muted">Next: keep the useful feedback for study. Regrade never sends this draft for you.</p>
          </div>
        )}

        <p className="text-[12px] text-ink-muted leading-relaxed px-1 pb-2">
          This is educational support, not legal advice. Review your school&apos;s grade-appeal policy before
          sending.
        </p>
      </div>
    </AppealFlowShell>
  );
}
