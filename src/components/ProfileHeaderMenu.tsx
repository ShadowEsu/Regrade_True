import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DEFAULT_AVATAR_SRC, ICONS } from '../constants';
import { auth, signOut } from '../lib/firebase';
import { isPreviewMode } from '../lib/previewMode';
import type { ProfileSection } from '../views/Profile';

const SECTIONS: { id: ProfileSection; label: string }[] = [
  { id: 'you', label: 'My profile' },
  { id: 'platform', label: 'Connections' },
  { id: 'subscription', label: 'Plan & usage' },
  { id: 'ai', label: 'Mr Whale & alerts' },
  { id: 'account', label: 'Settings & account' },
];

export default function ProfileHeaderMenu({
  activeSection,
  onSectionChange,
  onOpenProfile,
}: {
  activeSection: ProfileSection;
  onSectionChange: (section: ProfileSection) => void;
  onOpenProfile: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const user = auth.currentUser;
  const activeLabel = SECTIONS.find((s) => s.id === activeSection)?.label ?? 'Profile';

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const pickSection = (id: ProfileSection) => {
    onOpenProfile();
    onSectionChange(id);
    setOpen(false);
  };

  const handleSignOut = () => {
    setOpen(false);
    void signOut(auth);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.96 }}
        className={`rg-profile-menu-trigger ${open ? 'rg-profile-menu-trigger-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Profile menu"
        data-tour="profile"
      >
        <img
          src={user?.photoURL || DEFAULT_AVATAR_SRC}
          alt=""
          className="w-8 h-8 rounded-full object-cover border border-white/85"
        />
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ICONS.ChevronDown className="w-3.5 h-3.5 text-ink-muted" strokeWidth={2.5} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="rg-profile-menu"
            role="menu"
          >
            <p className="rg-profile-menu-label px-3.5 pt-2.5 pb-1">{activeLabel}</p>
            {SECTIONS.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => pickSection(item.id)}
                  className={`rg-profile-menu-item ${active ? 'rg-profile-menu-item-active' : ''}`}
                >
                  <span>{item.label}</span>
                  {active && <ICONS.Check className="w-4 h-4 text-primary shrink-0" strokeWidth={2.5} />}
                </button>
              );
            })}
            {!isPreviewMode() && (
              <>
                <div className="rg-profile-menu-divider" role="separator" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="rg-profile-menu-item rg-profile-menu-item-danger"
                >
                  <ICONS.LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  <span>Sign out</span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
