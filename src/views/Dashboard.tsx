import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import { auth } from '../lib/firebase';
import { isPreviewMode } from '../lib/previewMode';
import { caseService, type Case } from '../services/caseService';
import { userService } from '../services/userService';
import CoachWhale from '../components/CoachWhale';
import { getClassName, getNextStep, getPossiblePointsBack, getScoreDisplay } from '../lib/appealHelpers';

function todayLabel() {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
}

function timestampMs(value: unknown): number {
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') return (value as { toDate: () => Date }).toDate().getTime();
  const parsed = new Date(value as string | number | Date).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function dayKey(value: unknown): string | null {
  const ms = timestampMs(value);
  if (!ms) return null;
  const date = new Date(ms);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function currentReviewStreak(cases: Case[]): number {
  const activeDays = new Set(cases.map((item) => dayKey(item.updatedAt ?? item.createdAt)).filter(Boolean) as string[]);
  if (!activeDays.size) return 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  if (!activeDays.has(dayKey(cursor)!)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (activeDays.has(dayKey(cursor)!)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

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
  const fallbackName = user?.displayName?.split(' ')[0] || (isPreviewMode() ? 'Preview' : user?.email?.split('@')[0]) || null;
  const [firstName, setFirstName] = useState<string | null>(fallbackName);
  const [latestCase, setLatestCase] = useState<Case | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [analysisAlerts, setAnalysisAlerts] = useState(true);
  const [possibleIssueAlerts, setPossibleIssueAlerts] = useState(true);
  const [guidanceVisible, setGuidanceVisible] = useState(() => localStorage.getItem('regrade.home.guide.dismissed') !== '1');
  const notifiedCaseId = useRef<string | null>(null);
  const points = latestCase ? getPossiblePointsBack(latestCase) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    void Promise.all([
      caseService.getUserCases(),
      user?.uid ? userService.getProfile(user.uid) : Promise.resolve(null),
    ])
      .then(([cases, profile]) => {
        setCases(cases);
        setLatestCase(cases[0] ?? null);
        setAnalysisAlerts(profile?.analysisAlerts !== false);
        setPossibleIssueAlerts(profile?.notificationPreferences?.possibleIssue !== false);
        const savedName = profile?.name?.trim().split(/\s+/)[0];
        if (savedName) setFirstName(savedName);
      })
      .catch(() => setLoadError('Your dashboard could not be loaded. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }, [loadAttempt, user?.uid]);

  useEffect(() => {
    if (!analysisAlerts || !possibleIssueAlerts || !latestCase?.analysis || !latestCase.id || points <= 0) return;
    if (notifiedCaseId.current === latestCase.id) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    notifiedCaseId.current = latestCase.id;
    new Notification('Regrade found something worth reviewing', {
      body: `There may be up to ${points} points worth checking.`,
      icon: '/favicon.png',
    });
  }, [analysisAlerts, latestCase, points, possibleIssueAlerts]);

  const dismissGuide = () => {
    localStorage.setItem('regrade.home.guide.dismissed', '1');
    setGuidanceVisible(false);
  };

  const stats = useMemo(() => {
    const reviewed = cases.filter((item) => Boolean(item.analysis));
    const improved = cases.filter((item) => item.status === 'Resolved' || (item.draftEmail && getPossiblePointsBack(item) > 0));
    const recovered = improved.reduce((total, item) => total + getPossiblePointsBack(item), 0);
    const pending = cases.filter((item) => !item.analysis || item.progress < 80).length;
    return {
      streak: currentReviewStreak(cases),
      reviewed: reviewed.length,
      improved: improved.length,
      recovered,
      aiComplete: reviewed.length,
      pending,
    };
  }, [cases]);

  const activity = useMemo(() => {
    const activeDays = new Set(cases.map((item) => dayKey(item.updatedAt ?? item.createdAt)).filter(Boolean) as string[]);
    return Array.from({ length: 28 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (27 - index));
      return { key: dayKey(date)!, active: activeDays.has(dayKey(date)!) };
    });
  }, [cases]);

  return (
    <div className="rg-home space-y-7 pb-5">
      <header className="rg-page-heading pt-2">
        <p className="rg-page-kicker">{todayLabel()}</p>
        <h1>{greeting}{firstName ? `, ${firstName}` : ''}.</h1>
        <p>Ready when you are.</p>
      </header>

      {loadError && (
        <div className="rg-notice flex items-center justify-between gap-4" role="alert">
          <p>{loadError}</p>
          <button type="button" className="rg-text-button shrink-0" onClick={() => setLoadAttempt((value) => value + 1)}>Retry</button>
        </div>
      )}

      <section className="rg-home-primary">
        <div className="min-w-0">
          <span className="rg-home-primary-icon" aria-hidden><ICONS.Search /></span>
          <p className="rg-home-label">Start here</p>
          <h2>Review an exam.</h2>
          <p>Add a marked paper, rubric, or teacher feedback. Regrade will separate evidence from uncertainty.</p>
        </div>
        <button type="button" onClick={onStartAppeal} className="rg-action-button">
          Review graded work <ICONS.ArrowRight aria-hidden />
        </button>
      </section>

      <section className="rg-insights" aria-labelledby="dashboard-insights-title">
        <div className="rg-section-heading">
          <div><p>Progress</p><h2 id="dashboard-insights-title">Your Regrade activity.</h2></div>
          <span className="rg-insights-caption">Based on analyzed exams</span>
        </div>
        <div className="rg-insights-grid">
          <article className="rg-insight-card rg-insight-streak">
            <div>
              <p className="rg-insight-value">{stats.streak}</p>
              <span>day streak</span>
            </div>
            <div className="rg-activity-grid" aria-label={`${stats.streak} day review streak`}>
              {activity.map((day) => <i key={day.key} className={day.active ? 'is-active' : ''} title={day.key} />)}
            </div>
          </article>
          <article className="rg-insight-card"><p className="rg-insight-value">{stats.reviewed}</p><span>Exams reviewed</span><small>Marked exams analyzed</small></article>
          <article className="rg-insight-card"><p className="rg-insight-value">{stats.improved}</p><span>Exams improved</span><small>Resolved or draft ready</small></article>
          <article className="rg-insight-card"><p className="rg-insight-value">{stats.recovered}</p><span>Marks identified</span><small>Potential points worth checking</small></article>
          <article className="rg-insight-card"><p className="rg-insight-value">{stats.aiComplete}</p><span>AI reviews complete</span><small>Evidence reads finished</small></article>
          <article className="rg-insight-card"><p className="rg-insight-value">{stats.pending}</p><span>Pending reviews</span><small>Waiting for analysis</small></article>
        </div>
      </section>

      {!loading && analysisAlerts && latestCase?.analysis && points > 0 && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => latestCase.id && onOpenAppeal?.(latestCase.id)}
          className="rg-notice rg-notice-accent w-full text-left"
        >
          <span className="rg-notice-icon"><ICONS.Bell aria-hidden /></span>
          <span className="min-w-0 flex-1">
            <strong>Possible grading issue found</strong>
            <small>Up to +{points} points may be worth checking.</small>
          </span>
          <ICONS.ChevronRight aria-hidden />
        </motion.button>
      )}

      <section className="space-y-3">
        <div className="rg-section-heading">
          <div><p>Recent work</p><h2>{latestCase ? 'Pick up where you left off.' : 'Your workspace is clear.'}</h2></div>
          {latestCase && <button type="button" onClick={onOpenStudy}>Open Review</button>}
        </div>

        {loading ? (
          <div className="rg-content-card p-5 space-y-3" aria-label="Loading recent work">
            <div className="rg-shimmer h-4 w-36 rounded" />
            <div className="rg-shimmer h-14 w-full rounded-xl" />
          </div>
        ) : latestCase ? (
          <button type="button" className="rg-exam-row" onClick={() => latestCase.id && onOpenAppeal?.(latestCase.id)}>
            <span className="rg-exam-score">{getScoreDisplay(latestCase)}</span>
            <span className="min-w-0 flex-1">
              <strong>{latestCase.title}</strong>
              <small>{getClassName(latestCase)} · Next: {getNextStep(latestCase)}</small>
            </span>
            <span className="rg-status-chip">{latestCase.progress}%</span>
            <ICONS.ChevronRight aria-hidden />
          </button>
        ) : (
          <div className="rg-content-card rg-empty-compact">
            <span><ICONS.FileText aria-hidden /></span>
            <div><strong>No exams yet</strong><p>Your first analyzed exam will appear here.</p></div>
            <button type="button" onClick={onStartAppeal}>Add one</button>
          </div>
        )}
      </section>

      <section className="rg-home-grid">
        <button type="button" onClick={onOpenChat} className="rg-home-tool">
          <CoachWhale size={54} animate={false} />
          <span><small>AI assistant</small><strong>Ask Mr Whale</strong><em>Discuss a mark or draft.</em></span>
          <ICONS.ChevronRight aria-hidden />
        </button>
        <button type="button" onClick={onOpenPlatforms} className="rg-home-tool">
          <span className="rg-tool-icon"><ICONS.Library aria-hidden /></span>
          <span><small>Connections</small><strong>School platforms</strong><em>Import recent graded work.</em></span>
          <ICONS.ChevronRight aria-hidden />
        </button>
      </section>

      {guidanceVisible && (
        <section className="rg-guidance-card">
          <button type="button" onClick={dismissGuide} aria-label="Dismiss guide"><ICONS.X aria-hidden /></button>
          <p>Make the first review stronger</p>
          <h2>Include the marks and the reason.</h2>
          <span>A graded copy plus the rubric or teacher feedback gives Regrade enough evidence to explain what happened.</span>
          <div>
            <button type="button" onClick={onStartAppeal}>Add a marked exam</button>
            {onOpenSampleVerdict && <button type="button" onClick={onOpenSampleVerdict}>See an example</button>}
          </div>
        </section>
      )}
    </div>
  );
}
