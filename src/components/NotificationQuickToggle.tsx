import { useEffect, useState } from 'react';
import { ICONS } from '../constants';
import { auth } from '../lib/firebase';
import { userService } from '../services/userService';

/** A compact, persistent control for the same review-alert preference in Profile. */
export default function NotificationQuickToggle() {
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    void userService.getProfile(user.uid).then((profile) => setEnabled(profile?.analysisAlerts !== false));
  }, []);

  const toggle = async () => {
    const user = auth.currentUser;
    if (!user || saving) return;
    const next = !enabled;
    if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    setSaving(true);
    setEnabled(next);
    try {
      await userService.setAnalysisAlerts(user.uid, next);
    } catch {
      setEnabled(!next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? 'Turn review alerts off' : 'Turn review alerts on'}
      title={enabled ? 'Review alerts on' : 'Review alerts off'}
      disabled={saving}
      onClick={() => void toggle()}
      data-tour="notifications"
      className={`rg-header-icon-btn relative w-9 h-9 shrink-0 ${enabled ? 'text-primary' : 'text-ink-muted'} disabled:opacity-50`}
    >
      <ICONS.Bell className="w-[18px] h-[18px]" strokeWidth={2} />
      <span aria-hidden className={`absolute right-1 top-1 h-2 w-2 rounded-full border border-canvas ${enabled ? 'bg-emerald-500' : 'bg-ink-muted/45'}`} />
    </button>
  );
}
