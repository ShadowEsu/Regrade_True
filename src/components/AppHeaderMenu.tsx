import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { auth } from '../lib/firebase';
import { DEFAULT_AVATAR_SRC, ICONS } from '../constants';
import type { ProfileSection } from '../views/Profile';

type MenuAction = {
  label: string;
  icon: typeof ICONS.History;
  run: () => void;
};

export default function AppHeaderMenu({
  onTabChange,
  onProfileSectionChange,
  onShowHelp,
}: {
  onTabChange: (tab: string) => void;
  onProfileSectionChange: (section: ProfileSection) => void;
  onShowHelp: () => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const profile = (section: ProfileSection) => {
    onProfileSectionChange(section);
    onTabChange('profile');
    setOpen(false);
  };
  const actions: MenuAction[] = [
    { label: 'History', icon: ICONS.History, run: () => { onTabChange('history'); setOpen(false); } },
    { label: 'Notifications', icon: ICONS.Bell, run: () => profile('ai') },
    { label: 'Connections', icon: ICONS.Library, run: () => profile('platform') },
    { label: 'Settings', icon: ICONS.Settings, run: () => profile('account') },
    { label: 'Help', icon: ICONS.HelpCircle, run: () => { onShowHelp(); setOpen(false); } },
  ];

  return <div ref={root} className="relative">
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={() => setOpen((value) => !value)}
      className="rg-profile-menu-trigger"
      aria-label="Open account menu"
      aria-expanded={open}
      aria-haspopup="menu"
      data-tour="profile"
    >
      <img src={user?.photoURL || DEFAULT_AVATAR_SRC} alt="" className="h-8 w-8 rounded-full border border-hairline object-cover" />
      <ICONS.ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
    </motion.button>
    <AnimatePresence>
      {open && <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        className="rg-profile-menu"
        role="menu"
      >
        <p className="rg-profile-menu-label px-3.5 pb-1 pt-2.5">Workspace</p>
        {actions.map(({ label, icon: Icon, run }) => <button key={label} type="button" role="menuitem" onClick={run} className="rg-profile-menu-item">
          <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          <span>{label}</span>
        </button>)}
        <div className="rg-profile-menu-divider" />
        <button type="button" role="menuitem" onClick={() => profile('you')} className="rg-profile-menu-item">
          <ICONS.User className="h-4 w-4" strokeWidth={1.8} />
          <span>My profile</span>
        </button>
      </motion.div>}
    </AnimatePresence>
  </div>;
}
