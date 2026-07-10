import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import { auth } from '../lib/firebase';
import { isPreviewMode } from '../lib/previewMode';
import { caseService, Case } from '../services/caseService';
import { userService } from '../services/userService';
import MarketingEyebrow from '../components/MarketingEyebrow';
import AnimatedPrimaryButton from '../components/AnimatedPrimaryButton';
import CoachWhale from '../components/CoachWhale';
import { COACH_CTA, COACH_GREETING } from '../branding';
import {
  getPossiblePointsBack,
  getClassName,
  getScoreDisplay,
  getNextStep,
} from '../lib/appealHelpers';

const STEPS = [
  { icon: ICONS.Upload, label: 'Upload', tint: 'text-primary' },
  { icon: ICONS.Search, label: 'Analyze', tint: 'text-violet-600' },
  { icon: ICONS.Send, label: 'Draft', tint: 'text-emerald-700' },
] as const;

const QUICK_STATS = [
  { stat: '60s', label: 'first draft', icon: ICONS.Zap },
  { stat: '12+', label: 'platforms', icon: ICONS.Library },
  { stat: 'Free', label: 'to start', icon: ICONS.Verified },
] as const;

const WHAT_IT_DOES = [
  {
    icon: ICONS.Search,
    title: 'Reads your rubric',
    body: 'Scores, deductions, and comments in one pass.',
    tint: 'bg-primary/10 text-primary',
  },
  {
    icon: ICONS.Lightbulb,
    title: 'Finds your angle',
    body: 'Partial credit, missing explanations, math errors.',
    tint: 'bg-amber-500/12 text-amber-800',
  },
  {
    icon: ICONS.Send,
    title: 'Writes the email',
    body: 'Polite, specific — yours to edit before sending.',
    tint: 'bg-emerald-500/10 text-emerald-800',
  },
] as const;

export default function Dashboard({
  onStartAppeal,
  onOpenChat,
  onOpenAppeal,
  onOpenSampleVerdict,
  onOpenPlatforms,
  onOpenStudy,
}: {
  onStartAppeal: () => void;
  onOpenChat: () => void;
  onOpenAppeal?: (caseId: string) => void;
  onOpenSampleVerdict?: () => void;
  onOpenPlatforms?: () => void;
  onOpenStudy: () => void;
}) {
  const user = auth.currentUser;
  const authFirstName =
    user?.displayName?.split(' ')[0] ||
    (isPreviewMode() ? null : user?.email?.split('@')[0]) ||
    null;
  const [profileFirstName, setProfileFirstName] = useState<string | null>(authFirstName);
  const firstName = profileFirstName || authFirstName;
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const [latestCase, setLatestCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisAlerts, setAnalysisAlerts] = useState(true);
  const notifiedCaseId = useRef<string | null>(null);
  const pts = latestCase ? getPossiblePointsBack(latestCase) : 0;

  useEffect(() => {
    async function fetchCases() {
      try {
        const [cases, profile] = await Promise.all([
          caseService.getUserCases(),
          user?.uid ? userService.getProfile(user.uid) : Promise.resolve(null),
        ]);
        if (cases.length > 0) setLatestCase(cases[0]);
        setAnalysisAlerts(profile?.analysisAlerts !== false);
        const savedFirstName = profile?.name?.trim().split(/\s+/)[0];
        if (savedFirstName) setProfileFirstName(savedFirstName);
      } catch (err) {
        console.error('Failed to load appeal records:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, [user?.uid]);

  useEffect(() => {
    if (!analysisAlerts || !latestCase?.analysis || !latestCase.id || pts <= 0) return;
    if (notifiedCaseId.current === latestCase.id) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    notifiedCaseId.current = latestCase.id;
    new Notification('Regrade found something worth reviewing', {
      body: `Mr Whale found up to +${pts} points to check before you decide what to do next.`,
      icon: '/favicon.ico',
    });
  }, [analysisAlerts, latestCase, pts]);

  return (
    <div className="space-y-8 pb-6">
      {/* Personal greeting and primary actions intentionally sit directly on the page. */}
      <section className="pt-3 sm:pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
          <div className="flex-1 space-y-6 min-w-0">
            <div className="space-y-2">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rg-serif text-[clamp(32px,8vw,46px)] text-ink font-bold leading-[1.06] tracking-tight"
              >
                {timeGreeting}{firstName ? <>, <span className="text-primary">{firstName}</span>.</> : '.'}
              </motion.h1>
              <p className="text-[15px] text-ink-muted leading-relaxed max-w-md">
                What would you like to review today?
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {STEPS.map((step, i) => (
                <React.Fragment key={step.label}>
                  <motion.span
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    className={`rg-dash-step-pill ${step.tint}`}
                  >
                    <step.icon className="w-3.5 h-3.5" strokeWidth={2} />
                    {step.label}
                  </motion.span>
                  {i < STEPS.length - 1 && (
                    <ICONS.ChevronRight className="w-3 h-3 text-primary/30 shrink-0" strokeWidth={2} />
                  )}
                </React.Fragment>
              ))}
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="rg-dash-step-pill text-primary bg-primary/8 border-primary/20"
              >
                <ICONS.Zap className="w-3.5 h-3.5" strokeWidth={2} />
                ~60 sec
              </motion.span>
            </div>

            <div className="flex flex-col gap-3 pt-1">
              <AnimatedPrimaryButton onClick={onStartAppeal} showPlus hero className="w-full">
                Review graded work
              </AnimatedPrimaryButton>
              <motion.button
                type="button"
                onClick={onOpenChat}
                whileTap={{ scale: 0.97 }}
                className="rg-dash-coach-chip group text-ink-muted hover:text-ink w-full justify-center"
              >
                <CoachWhale size={36} animate={false} />
                <span className="font-semibold text-ink">{COACH_CTA}</span>
                <ICONS.ArrowRight
                  className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                  strokeWidth={2}
                />
              </motion.button>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center justify-center gap-2 mx-auto sm:mx-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 320, damping: 22 }}
              className="z-10 max-w-[14rem] sm:max-w-[17rem] text-center"
            >
              <div className="rg-whale-speech rg-whale-speech-top">
                <p className="text-[12px] sm:text-[13px] font-semibold text-ink leading-snug">
                  {COACH_GREETING}
                </p>
              </div>
            </motion.div>
            <CoachWhale
              size={132}
              className="drop-shadow-[0_8px_24px_rgba(0,102,204,0.18)] sm:scale-110"
            />
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {QUICK_STATS.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.07 }}
            whileHover={{ y: -3, scale: 1.02 }}
            className="rg-glass-stat text-center px-2 py-3.5"
          >
            <item.icon className="w-4 h-4 text-primary mx-auto mb-1 opacity-70" strokeWidth={1.75} />
            <p className="rg-serif text-xl sm:text-2xl text-ink font-bold">{item.stat}</p>
            <p className="text-[10px] sm:text-[11px] font-semibold text-ink-muted mt-0.5">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {!loading && analysisAlerts && latestCase?.analysis && pts > 0 && (
        <motion.button
          type="button"
          onClick={() => latestCase.id && onOpenAppeal?.(latestCase.id)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full text-left rounded-[18px] border border-primary/20 bg-primary/[0.07] px-4 py-4 flex items-start gap-3 hover:border-primary/35 transition-colors"
        >
          <span className="w-9 h-9 shrink-0 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
            <ICONS.Bell className="w-4.5 h-4.5" strokeWidth={2.25} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-ink">We found up to +{pts} points worth a second look.</span>
            <span className="block text-[12px] text-ink-muted mt-0.5">Review the evidence before deciding whether to draft an appeal.</span>
          </span>
          <ICONS.ArrowRight className="w-4 h-4 text-primary mt-1 shrink-0" strokeWidth={2.25} />
        </motion.button>
      )}

      {loading ? (
        <div className="rg-glass-form-card p-6 space-y-3">
          <div className="h-3 w-28 rg-shimmer rounded" />
          <div className="h-20 w-full rg-shimmer rounded-xl" />
        </div>
      ) : latestCase ? (
        <section className="space-y-3">
          <MarketingEyebrow>pick up where you left off</MarketingEyebrow>
          <motion.button
            type="button"
            onClick={() => latestCase.id && onOpenAppeal?.(latestCase.id)}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="w-full text-left overflow-hidden rounded-[20px] rg-glass-card"
          >
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="rg-serif text-xl text-ink font-semibold truncate">{latestCase.title}</h2>
                  <p className="text-sm text-ink-muted mt-0.5">{getClassName(latestCase)}</p>
                </div>
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-white bg-primary px-2.5 py-1 rounded-full shadow-sm">
                  {latestCase.progress}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { k: 'Score', v: getScoreDisplay(latestCase), accent: false },
                  { k: 'Recoverable', v: pts > 0 ? `+${pts}` : '—', accent: true },
                  { k: 'Status', v: latestCase.status, accent: false },
                ].map((stat) => (
                  <div
                    key={stat.k}
                    className="rounded-xl rg-glass-chip px-2 py-2.5 text-center"
                  >
                    <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide">{stat.k}</p>
                    <p className={`text-sm font-semibold mt-0.5 capitalize ${stat.accent ? 'text-primary' : 'text-ink'}`}>
                      {stat.v}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-ink-muted flex items-center gap-1.5">
                <ICONS.ArrowRight className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                Next: <span className="text-ink font-medium">{getNextStep(latestCase)}</span>
              </p>
            </div>
          </motion.button>
        </section>
      ) : (
        <motion.button
          type="button"
          onClick={onStartAppeal}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="rg-dash-upload-zone w-full p-7 sm:p-8 space-y-4 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-400/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" aria-hidden />
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center shadow-[0_8px_24px_rgba(0,102,204,0.15)]"
          >
            <ICONS.Upload className="w-8 h-8 text-primary" strokeWidth={1.5} />
          </motion.div>
          <div className="relative space-y-2">
            <p className="rg-serif text-[clamp(20px,4.5vw,24px)] text-ink">
              One upload. Sixty seconds.
            </p>
            <p className="text-[14px] text-ink-muted max-w-xs mx-auto leading-relaxed">
              Snap a photo or PDF from Canvas, Gradescope, or any gradebook.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary mt-1 group-hover:gap-2.5 transition-all">
              Tap to start
              <ICONS.ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </span>
          </div>
        </motion.button>
      )}

      {/* What it does */}
      <section className="space-y-4">
        <div>
          <MarketingEyebrow>how it works</MarketingEyebrow>
          <h2 className="rg-serif text-[clamp(20px,4vw,24px)] text-ink mt-2">
            Three steps. Points back.
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {WHAT_IT_DOES.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 280, damping: 24 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rg-glass-card p-4 flex items-start gap-4 cursor-default"
            >
              <motion.div
                whileHover={{ rotate: [0, -6, 6, 0], scale: 1.08 }}
                transition={{ duration: 0.4 }}
                className={`shrink-0 p-3 rounded-2xl ${item.tint}`}
              >
                <item.icon className="w-5 h-5" strokeWidth={1.75} />
              </motion.div>
              <div>
                <p className="rg-serif text-[15px] font-semibold text-ink">{item.title}</p>
                <p className="text-[13px] text-muted mt-0.5 leading-relaxed">{item.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {latestCase?.analysis && (
        <section className="space-y-3">
          <MarketingEyebrow>latest read</MarketingEyebrow>
          <div className="rg-glass-form-card overflow-hidden divide-y divide-primary/8">
            <MetaRow label="Case strength" value={latestCase.analysis.case_analysis.overall_case_strength} icon={ICONS.TrendingUp} />
            <MetaRow label="Rubric scan" value="Complete ✓" icon={ICONS.Shield} />
            {pts > 0 && <MetaRow label="Points at stake" value={`+${pts}`} highlight icon={ICONS.Zap} />}
          </div>
        </section>
      )}

      <section className="rg-glass-form-card p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <MarketingEyebrow>your gradebook</MarketingEyebrow>
          <p className="rg-serif text-lg text-ink font-semibold mt-1">Connect a platform when you need it.</p>
          <p className="text-[13px] text-ink-muted leading-relaxed mt-1">
            Search Canvas, Moodle, Classroom, and more, or upload a graded file directly.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenPlatforms}
          className="rg-btn-secondary shrink-0 px-3.5 py-2.5 text-[13px]"
        >
          Search
        </button>
      </section>

      <section className="relative overflow-hidden rounded-[20px] border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.08] via-canvas to-primary/[0.06] p-5 flex items-center justify-between gap-4">
        <div className="absolute -bottom-10 -right-8 w-36 h-36 rounded-full bg-violet-400/15 blur-3xl" aria-hidden />
        <div className="relative min-w-0">
          <MarketingEyebrow>review room</MarketingEyebrow>
          <p className="rg-serif text-lg text-ink font-semibold mt-1">Turn marked exams into your review checklist.</p>
          <p className="text-[13px] text-ink-muted leading-relaxed mt-1">Find recurring patterns before your next exam.</p>
        </div>
        <button type="button" onClick={onOpenStudy} className="relative rg-btn-secondary shrink-0 px-3.5 py-2.5 text-[13px]">
          Review
        </button>
      </section>

      {onOpenSampleVerdict && (
        <button type="button" onClick={onOpenSampleVerdict} className="rg-text-link text-sm w-full justify-center">
          {latestCase ? 'Preview sample analysis' : 'See a sample analysis'}{' '}
          <span aria-hidden>›</span>
        </button>
      )}
    </div>
  );
}

function MetaRow({
  label,
  value,
  highlight,
  icon: Icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: typeof ICONS.Zap;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${highlight ? 'bg-primary/10 text-primary' : 'bg-parchment text-ink-muted'}`}>
            <Icon className="w-4 h-4" strokeWidth={1.75} />
          </span>
        )}
        <span className="text-sm text-ink-muted">{label}</span>
      </div>
      <span className={`text-sm font-semibold capitalize shrink-0 ${highlight ? 'text-primary' : 'text-ink'}`}>
        {value}
      </span>
    </div>
  );
}
