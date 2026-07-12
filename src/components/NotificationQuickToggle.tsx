import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ICONS } from '../constants';
import { auth } from '../lib/firebase';
import { userService } from '../services/userService';
import { notificationService, type NotificationType, type RegradeNotification } from '../services/notificationService';

type Filter = 'all' | 'unread' | NotificationType;
const filters: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' }, { id: 'unread', label: 'Unread' }, { id: 'import', label: 'Imports' },
  { id: 'review', label: 'Reviews' }, { id: 'appeal', label: 'Appeals' }, { id: 'system', label: 'System' },
];

function timeMs(raw: unknown) {
  if (raw && typeof (raw as { toDate?: () => Date }).toDate === 'function') return (raw as { toDate: () => Date }).toDate().getTime();
  const time = new Date(String(raw ?? 0)).getTime();
  return Number.isFinite(time) ? time : 0;
}

function iconFor(type: NotificationType) {
  if (type === 'import') return ICONS.Download;
  if (type === 'appeal') return ICONS.Send;
  if (type === 'parent') return ICONS.User;
  if (type === 'subscription') return ICONS.Verified;
  if (type === 'system') return ICONS.Shield;
  return ICONS.Search;
}

export default function NotificationQuickToggle() {
  const [enabled, setEnabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notices, setNotices] = useState<RegradeNotification[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setError(false);
    try {
      const [profile, items] = await Promise.all([userService.getProfile(user.uid), notificationService.list()]);
      setEnabled(profile?.analysisAlerts !== false);
      setNotices(items);
    } catch { setError(true); }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const unread = notices.filter((item) => !item.readAt).length;
  const visible = useMemo(() => notices.filter((item) => filter === 'all' || filter === 'unread' ? (filter === 'all' || !item.readAt) : item.type === filter), [filter, notices]);

  const toggle = async () => {
    const user = auth.currentUser;
    if (!user || saving) return;
    const next = !enabled;
    if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') await notificationService.requestPermission();
    setSaving(true); setEnabled(next);
    try { await userService.setAnalysisAlerts(user.uid, next); }
    catch { setEnabled(!next); }
    finally { setSaving(false); }
  };

  const openNotice = async (notice: RegradeNotification) => {
    if (!notice.readAt) { await notificationService.markRead(notice.id).catch(() => undefined); setNotices((items) => items.map((item) => item.id === notice.id ? { ...item, readAt: new Date().toISOString() } : item)); }
    window.location.assign(notice.url);
  };

  const archive = async (notice: RegradeNotification) => {
    const previous = notices;
    setNotices((items) => items.filter((item) => item.id !== notice.id));
    try { await notificationService.archive(notice.id); }
    catch { setNotices(previous); }
  };

  return <div ref={rootRef} className="rg-notification-control">
    <motion.button type="button" aria-label="Notifications" aria-expanded={open} onClick={() => setOpen((value) => !value)} data-tour="notifications" className="rg-header-icon-btn relative h-9 w-9 shrink-0 text-ink-muted" animate={unread ? { rotate: [0, -5, 5, -3, 3, 0] } : undefined} transition={{ duration: .5 }}><ICONS.Bell className="h-[18px] w-[18px]" strokeWidth={2} />{unread > 0 && <span className="rg-notification-badge" aria-label={`${unread} unread notifications`}>{Math.min(99, unread)}</span>}</motion.button>
    <AnimatePresence>{open && <motion.section initial={{ opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: .98 }} transition={{ duration: .18 }} className="rg-notification-popover rg2-notification-center" aria-label="Notification center">
      <header><div><p>Notifications</p><span>{unread ? `${unread} unread` : 'All caught up'}</span></div><button type="button" role="switch" aria-label="Notification alerts" aria-checked={enabled} disabled={saving} onClick={() => void toggle()}><i /></button></header>
      <div className="rg2-notification-filters">{filters.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={filter === item.id ? 'is-active' : ''}>{item.label}</button>)}</div>
      <div className="rg2-notification-list">
        {error ? <div className="rg-notification-empty"><ICONS.AlertCircle /><strong>Couldn&apos;t load updates</strong><p>Your notifications were not changed.</p><button type="button" onClick={() => void load()}>Retry</button></div> : visible.length ? visible.map((notice) => { const Icon = iconFor(notice.type); return <motion.article layout key={notice.id} className={!notice.readAt ? 'is-unread' : ''}><button type="button" onClick={() => void openNotice(notice)}><span><Icon /></span><div><strong>{notice.title}</strong><p>{notice.body}</p><small>{timeMs(notice.createdAt) ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(timeMs(notice.createdAt)) : 'Just now'}</small></div></button><button type="button" className="rg2-archive" aria-label={`Archive ${notice.title}`} onClick={() => void archive(notice)}><ICONS.X /></button></motion.article>; }) : <div className="rg-notification-empty"><motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity }}><ICONS.Check /></motion.div><strong>All caught up</strong><p>Real imports, reviews, appeals, and account updates will appear here.</p></div>}
      </div>
    </motion.section>}</AnimatePresence>
  </div>;
}
