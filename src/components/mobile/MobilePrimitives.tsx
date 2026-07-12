import type { PropsWithChildren, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { ICONS } from '../../constants';

export function Reveal({ children, delay = 0, className = '' }: PropsWithChildren<{ delay?: number; className?: string }>) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: '-30px' });
  const reduced = useReducedMotion();
  return <motion.div ref={ref} initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={visible ? { opacity: 1, y: 0 } : undefined} transition={{ duration: reduced ? .01 : .3, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }} className={className}>{children}</motion.div>;
}

export function SurfaceCard({ children, className = '', onClick, label }: PropsWithChildren<{ className?: string; onClick?: () => void; label?: string }>) {
  const reduced = useReducedMotion();
  if (!onClick) return <article className={`rg2-card ${className}`}>{children}</article>;
  return <motion.button type="button" aria-label={label} whileTap={reduced ? undefined : { scale: .985 }} onClick={onClick} className={`rg2-card rg2-card-button ${className}`}>{children}</motion.button>;
}

export function CountUpValue({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [shown, setShown] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || value <= 0) { setShown(value); return; }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 650);
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, value]);
  return <>{shown}{suffix}</>;
}

export function MetricCard({ value, label, detail, tone = 'blue', icon }: { value: number; label: string; detail?: string; tone?: 'blue' | 'green' | 'lavender' | 'yellow'; icon?: ReactNode }) {
  return <SurfaceCard className={`rg2-metric rg2-tone-${tone}`}><div className="rg2-metric-top"><strong><CountUpValue value={value} /></strong>{icon && <span>{icon}</span>}</div><p>{label}</p>{detail && <small>{detail}</small>}</SurfaceCard>;
}

export function StatusBadge({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: 'neutral' | 'blue' | 'green' | 'yellow' | 'red' }>) {
  return <span className={`rg2-status rg2-status-${tone}`}>{children}</span>;
}

export function SectionHeading({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  return <div className="rg2-section-head"><div>{eyebrow && <p>{eyebrow}</p>}<h2>{title}</h2></div>{action && <button type="button" onClick={onAction}>{action}</button>}</div>;
}

export function HorizontalScroller({ children, label }: PropsWithChildren<{ label: string }>) {
  return <div className="rg2-scroller" role="region" aria-label={label} tabIndex={0}>{children}</div>;
}

export function ActivityGrid({ active, expanded = false }: { active: Set<string>; expanded?: boolean }) {
  const days = Array.from({ length: expanded ? 56 : 28 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - ((expanded ? 55 : 27) - index));
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return { key, label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
  });
  return <div className={`rg2-activity-grid ${expanded ? 'is-expanded' : ''}`}>{days.map((day, index) => <motion.i key={day.key} title={day.label} aria-label={`${day.label}${active.has(day.key) ? ', reviewed' : ''}`} initial={{ opacity: 0, scale: .7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(index * .012, .35) }} className={active.has(day.key) ? 'is-active' : index === days.length - 1 ? 'is-today' : ''} />)}</div>;
}

export function ExpandablePanel({ open, children }: PropsWithChildren<{ open: boolean }>) {
  return <AnimatePresence initial={false}>{open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .24, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">{children}</motion.div>}</AnimatePresence>;
}

export function EmptyState({ icon = <ICONS.FileText />, title, body, action, onAction }: { icon?: ReactNode; title: string; body: string; action?: string; onAction?: () => void }) {
  return <SurfaceCard className="rg2-empty"><motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>{icon}</motion.span><h3>{title}</h3><p>{body}</p>{action && <button type="button" onClick={onAction}>{action}</button>}</SurfaceCard>;
}
