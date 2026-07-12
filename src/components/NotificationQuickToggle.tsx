import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ICONS } from '../constants';
import { auth } from '../lib/firebase';
import { caseService, type Case } from '../services/caseService';
import { userService } from '../services/userService';
import { getPossiblePointsBack } from '../lib/appealHelpers';

export default function NotificationQuickToggle() {
  const [enabled, setEnabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    void Promise.all([userService.getProfile(user.uid), caseService.getUserCases()]).then(([profile, items]) => {
      setEnabled(profile?.analysisAlerts !== false);
      setCases(items.slice(0, 3));
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const notices = useMemo(() => cases.map((item) => ({
    id: item.id ?? item.title,
    title: item.analysis && getPossiblePointsBack(item) > 0 ? 'Possible grading issue' : 'Review ready',
    body: item.title,
  })), [cases]);

  const toggle = async () => {
    const user = auth.currentUser;
    if (!user || saving) return;
    const next = !enabled;
    if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') await Notification.requestPermission();
    setSaving(true);
    setEnabled(next);
    try { await userService.setAnalysisAlerts(user.uid, next); }
    catch { setEnabled(!next); }
    finally { setSaving(false); }
  };

  return (
    <div ref={rootRef} className="rg-notification-control">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        title="Notifications"
        onClick={() => setOpen((value) => !value)}
        data-tour="notifications"
        className="rg-header-icon-btn relative h-9 w-9 shrink-0 text-ink-muted"
      >
        <ICONS.Bell className="h-[18px] w-[18px]" strokeWidth={2} />
        {enabled && notices.length > 0 && <span className="rg-notification-badge" aria-label={`${notices.length} notifications`}>{notices.length}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: -5, scale: .98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: .98 }}
            transition={{ duration: .17 }}
            className="rg-notification-popover"
            aria-label="Recent notifications"
          >
            <header><div><p>Notifications</p><span>{enabled ? 'Alerts are on' : 'Alerts are off'}</span></div><button type="button" role="switch" aria-checked={enabled} disabled={saving} onClick={() => void toggle()}><i /></button></header>
            <div>
              {notices.length ? notices.map((notice) => (
                <article key={notice.id}><span><ICONS.Search /></span><div><strong>{notice.title}</strong><p>{notice.body}</p></div></article>
              )) : <div className="rg-notification-empty"><ICONS.Check /><strong>All caught up</strong><p>Completed reviews and Auto Mode imports will appear here.</p></div>}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
