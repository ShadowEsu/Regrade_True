import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import { auth } from '../lib/firebase';
import { caseService, type Case } from '../services/caseService';
import { userService } from '../services/userService';
import { listConnections } from '../features/connect/store';
import CoachWhale from '../components/CoachWhale';
import { getClassName, getPossiblePointsBack, getScoreDisplay } from '../lib/appealHelpers';
import {
  ActivityGrid,
  ExpandablePanel,
  HorizontalScroller,
  MetricCard,
  Reveal,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
} from '../components/mobile/MobilePrimitives';

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
  const active = new Set(cases.map((item) => dayKey(item.updatedAt ?? item.createdAt)).filter(Boolean) as string[]);
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  if (!active.has(dayKey(cursor)!)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (active.has(dayKey(cursor)!)) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

function timeLabel(raw: unknown) {
  const time = timestampMs(raw);
  if (!time) return 'Recently';
  const today = new Date();
  const date = new Date(time);
  if (today.toDateString() === date.toDateString()) return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

export default function Dashboard({
  onStartAppeal,
  onOpenChat,
  onOpenAppeal,
  onOpenPlatforms,
  onOpenStudy,
  onOpenProfile,
}: {
  onStartAppeal: () => void;
  onOpenChat: () => void;
  onOpenAppeal?: (caseId: string) => void;
  onOpenPlatforms?: () => void;
  onOpenStudy: () => void;
  onOpenProfile: () => void;
}) {
  const user = auth.currentUser;
  const fallbackName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || null;
  const [firstName, setFirstName] = useState<string | null>(fallbackName);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [streakOpen, setStreakOpen] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);
  const [autoMode, setAutoMode] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    void Promise.all([
      caseService.getUserCases(),
      user?.uid ? userService.getProfile(user.uid) : Promise.resolve(null),
      listConnections().catch(() => []),
    ]).then(([items, profile, connections]) => {
      setCases(items);
      setConnectionCount(connections.length);
      setAutoMode(profile?.automaticGradeDetection === true);
      const savedName = profile?.name?.trim().split(/\s+/)[0];
      if (savedName) setFirstName(savedName);
    }).catch(() => setLoadError('Your dashboard could not be loaded. Check your connection and try again.')).finally(() => setLoading(false));
  }, [loadAttempt, user?.uid]);

  const stats = useMemo(() => {
    const reviewed = cases.filter((item) => Boolean(item.analysis));
    const improved = cases.filter((item) => item.status === 'Resolved');
    const identified = reviewed.reduce((sum, item) => sum + getPossiblePointsBack(item), 0);
    return {
      streak: currentReviewStreak(cases),
      reviewed: reviewed.length,
      improved: improved.length,
      identified,
      complete: reviewed.length,
      pending: cases.filter((item) => !item.analysis || item.progress < 80).length,
    };
  }, [cases]);

  const activeDays = useMemo(() => new Set(cases.map((item) => dayKey(item.updatedAt ?? item.createdAt)).filter(Boolean) as string[]), [cases]);
  const attention = useMemo(() => cases.filter((item) => !item.analysis || getPossiblePointsBack(item) > 0).slice(0, 5), [cases]);
  const recent = cases.slice(0, 8);
  const activity = cases.slice(0, 4);

  return (
    <div className="rg2-home">
      <Reveal className="rg2-home-hello rg2-span-full">
        <div>
          <h1>{greeting}{firstName ? `, ${firstName}` : ''}</h1>
          <p>Let&apos;s get those points back.</p>
        </div>
        <button type="button" onClick={onOpenChat} className="rg3-whale-ask" aria-label="Ask Mr Whale"><CoachWhale size={44} /><span>Ask Mr Whale</span></button>
      </Reveal>

      {loadError && <div className="rg-notice rg2-span-full" role="alert"><p className="flex-1">{loadError}</p><button type="button" className="rg-text-button" onClick={() => setLoadAttempt((value) => value + 1)}>Retry</button></div>}

      <Reveal className="rg2-span-half">
        <SurfaceCard className="rg2-streak">
          <button type="button" onClick={() => setStreakOpen((open) => !open)} aria-expanded={streakOpen}>
            <div className="rg2-streak-head">
              <div><small>Your review streak</small><div className="rg2-streak-value">{stats.streak}<span>{stats.streak === 1 ? 'day' : 'days'}</span></div></div>
              <motion.span className="rg2-streak-flame" animate={stats.streak > 0 ? { scale: [1, 1.07, 1] } : undefined} transition={{ duration: 2.4, repeat: Infinity }}><ICONS.Zap aria-hidden /></motion.span>
            </div>
            <ActivityGrid active={activeDays} />
            <ExpandablePanel open={streakOpen}><div className="rg2-streak-detail"><ActivityGrid active={activeDays} expanded /><p className="mt-4">Every completed exam review adds a day to this calendar.</p></div></ExpandablePanel>
          </button>
        </SurfaceCard>
      </Reveal>

      <Reveal className="rg2-span-half" delay={.03}>
        <SectionHeading eyebrow="Focus" title="Needs your attention" action={attention.length ? `${attention.length} open` : undefined} />
        <div className="mt-3">
          {loading ? <div className="rg2-card h-44 rg-shimmer" aria-label="Loading attention cards" /> : attention.length ? (
            <HorizontalScroller label="Exams needing attention">
              {attention.map((item) => {
                const points = getPossiblePointsBack(item);
                return <SurfaceCard key={item.id ?? item.ref} className={`rg2-attention ${points ? '' : 'is-pending'}`} onClick={() => item.id && onOpenAppeal?.(item.id)} label={`Open ${item.title}`}>
                  <div className="rg2-attention-top"><StatusBadge tone={points ? 'yellow' : 'blue'}>{item.analysis ? 'Evidence to review' : 'Analysis pending'}</StatusBadge><span className="text-[10px] text-ink-muted">{timeLabel(item.updatedAt)}</span></div>
                  <h3>{item.analysis?.assignment.title ?? item.title}</h3><p>{getClassName(item)}</p>
                  <footer><span>{points > 0 ? `+${points} possible point${points === 1 ? '' : 's'}` : `${item.progress}% complete`}</span><b>Continue review <ICONS.ArrowRight className="ml-2 h-3 w-3" /></b></footer>
                </SurfaceCard>;
              })}
            </HorizontalScroller>
          ) : <SurfaceCard className="rg2-attention is-pending" onClick={onStartAppeal} label="Add a marked exam"><div className="rg2-attention-top"><StatusBadge tone="green">All clear</StatusBadge></div><h3>Add your first marked exam</h3><p>Upload a PDF or connect a school platform.</p><footer><span>No open reviews</span><b>Get started <ICONS.ArrowRight className="ml-2 h-3 w-3" /></b></footer></SurfaceCard>}
        </div>
      </Reveal>

      <Reveal delay={.05} className="rg2-span-main">
        <SectionHeading eyebrow="Progress" title="Your progress" />
        <div className="rg2-metrics mt-3">
          <MetricCard value={stats.reviewed} label="Exams reviewed" detail="Evidence reads finished" icon={<ICONS.BookOpen />} />
          <MetricCard value={stats.improved} label="Exams improved" detail="Confirmed outcomes" tone="lavender" icon={<ICONS.TrendingUp />} />
          <MetricCard value={stats.identified} label="Points identified" detail="Possible, not guaranteed" tone="green" icon={<ICONS.CheckCircle2 />} />
          <MetricCard value={stats.pending} label="Pending reviews" detail={`${stats.complete} AI reviews complete`} tone="yellow" icon={<ICONS.Activity />} />
        </div>
      </Reveal>

      <Reveal delay={.08} className="rg2-span-side">
        <SectionHeading eyebrow="Account" title="Connections" />
        <div className="mt-3 grid gap-2">
          <SurfaceCard className="rg2-system-card" onClick={onOpenPlatforms} label="Open connected platforms"><span><ICONS.Library /></span><div className="min-w-0 flex-1"><strong>School platforms</strong><small>{connectionCount ? `${connectionCount} connected` : 'None connected'}</small></div><StatusBadge tone={connectionCount ? 'green' : 'neutral'}>{connectionCount || 'Set up'}</StatusBadge></SurfaceCard>
          <SurfaceCard className="rg2-system-card" onClick={onOpenPlatforms} label="Open Auto Mode settings"><span><ICONS.Zap /></span><div className="min-w-0 flex-1"><strong>Auto Mode</strong><small>{autoMode ? 'Watching configured import sources.' : 'Off until you choose to enable it.'}</small></div><StatusBadge tone={autoMode ? 'blue' : 'neutral'}>{autoMode ? 'On' : 'Off'}</StatusBadge></SurfaceCard>
        </div>
      </Reveal>

      <Reveal className="rg2-span-full" delay={.1}>
        <SectionHeading eyebrow="Library" title="Recent work" action={recent.length ? 'Open Review' : undefined} onAction={onOpenStudy} />
        <div className="mt-3">
          {recent.length ? <HorizontalScroller label="Recent exams">{recent.map((item) => <SurfaceCard key={item.id ?? item.ref} className="rg2-exam-card" onClick={() => item.id && onOpenAppeal?.(item.id)} label={`Open ${item.title}`}><span className="rg2-exam-thumb">{item.pageImageUrls?.[0] ? <img src={item.pageImageUrls[0]} alt="" /> : <ICONS.FileText />}</span><div><strong>{item.analysis?.assignment.title ?? item.title}</strong><small>{getClassName(item)}</small></div><footer><span>{getPossiblePointsBack(item) ? `+${getPossiblePointsBack(item)} pts to check` : getScoreDisplay(item)}</span><StatusBadge tone={item.analysis ? 'green' : 'blue'}>{item.analysis ? 'Reviewed' : 'Pending'}</StatusBadge></footer></SurfaceCard>)}</HorizontalScroller> : <SurfaceCard className="rg2-system-card" onClick={onStartAppeal} label="Add an exam"><span><ICONS.FileText /></span><div className="flex-1"><strong>No exams yet</strong><small>Your analyzed work will appear here.</small></div><ICONS.ArrowRight className="h-4 w-4 text-primary" /></SurfaceCard>}
        </div>
      </Reveal>

      <Reveal delay={.12} className="rg2-span-main">
        <SectionHeading eyebrow="Timeline" title="Recent AI activity" />
        <SurfaceCard className="rg2-activity-list mt-3">
          {activity.length ? activity.map((item) => <button type="button" key={item.id ?? item.ref} className="rg2-activity-row w-full text-left" onClick={() => item.id && onOpenAppeal?.(item.id)}><time>{timeLabel(item.updatedAt)}</time><i /><span><strong>{item.analysis ? 'AI review completed' : 'Exam imported'}</strong><small>{item.analysis?.assignment.title ?? item.title}</small></span></button>) : <div className="p-5 text-center text-[12px] text-ink-muted">Your real import and review activity will appear here.</div>}
        </SurfaceCard>
      </Reveal>

      <Reveal delay={.14} className="rg2-span-side">
        <SurfaceCard className="rg2-whale-card" onClick={onOpenChat} label="Ask Mr Whale"><div><h3>Mr Whale is here</h3><p>Ask about a marked question, evidence for an appeal, or what to practise next.</p></div><CoachWhale size={68} /></SurfaceCard>
      </Reveal>
    </div>
  );
}
