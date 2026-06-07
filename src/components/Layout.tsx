import React from 'react';
import { motion } from 'motion/react';
import { DEFAULT_AVATAR_SRC } from '../constants';
import { auth } from '../lib/firebase';
import { BRAND_ICON_SRC, BRAND_NAME } from '../branding';
import Logo from './Logo';
import { NAV_TAB_ICONS } from './BottomNavIcons';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Home' },
  { id: 'upload', label: 'Appeal' },
  { id: 'chat', label: 'Coach' },
  { id: 'history', label: 'History' },
  { id: 'profile', label: 'Profile' },
] as const;

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const user = auth.currentUser;
  const isChat = activeTab === 'chat';

  return (
    <div className="min-h-[100dvh] flex flex-col relative bg-canvas selection:bg-primary/15">
      <header
        className={`shrink-0 z-50 pt-[env(safe-area-inset-top)] ${
          isChat ? 'bg-gradient-to-b from-primary/[0.1] to-canvas/80 border-b border-primary/10' : 'rg-subnav'
        }`}
        style={isChat ? { backdropFilter: 'saturate(180%) blur(16px)' } : undefined}
      >
        <div className="max-w-lg mx-auto px-6 h-14 flex items-center justify-between gap-3">
          {isChat ? (
            <>
              <button
                type="button"
                onClick={() => onTabChange('dashboard')}
                className="w-8 h-8 rounded-lg overflow-hidden shrink-0"
                aria-label="Home"
              >
                <img src={BRAND_ICON_SRC} alt="" className="w-full h-full object-cover" draggable={false} />
              </button>
              <div className="text-center min-w-0">
                <span className="rg-serif text-lg text-ink font-semibold">{BRAND_NAME} Coach</span>
              </div>
              <button
                type="button"
                onClick={() => onTabChange('profile')}
                className="w-8 h-8 rounded-full border border-primary/20 overflow-hidden shrink-0"
                aria-label="Profile"
              >
                <img
                  src={user?.photoURL || DEFAULT_AVATAR_SRC}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onTabChange('dashboard')}
                className="flex items-center min-w-0"
                aria-label="Home"
              >
                <Logo size="xs" compact className="!text-left !p-0" />
              </button>
              <button
                type="button"
                onClick={() => onTabChange('profile')}
                className="w-8 h-8 rounded-full border border-hairline overflow-hidden shrink-0"
                aria-label="Profile"
              >
                <img
                  src={user?.photoURL || DEFAULT_AVATAR_SRC}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex flex-col flex-1 min-h-0 pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className={`flex flex-col flex-1 min-h-0 w-full ${
            isChat ? '' : 'max-w-lg mx-auto px-6 py-8'
          }`}
        >
          {children}
        </motion.div>
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 px-3 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
        aria-label="Main"
      >
        <div
          className="rg-bottom-nav max-w-lg mx-auto flex justify-between items-end gap-1 px-2 py-2"
          style={{ backdropFilter: 'saturate(180%) blur(20px)' }}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = NAV_TAB_ICONS[tab.id];
            const isCoach = tab.id === 'chat';

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center gap-1 flex-1 min-w-0 py-0.5"
              >
                <motion.div
                  layout
                  animate={{
                    scale: active ? 1 : 0.92,
                    y: active ? -2 : 0,
                  }}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                  className={`relative flex items-center justify-center ${
                    isCoach ? 'w-11 h-11' : 'w-10 h-10'
                  }`}
                >
                  {active && !isCoach && (
                    <motion.span
                      layoutId="nav-bubble"
                      className="absolute inset-0 rounded-2xl bg-primary/12 border border-primary/15"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {active && isCoach && (
                    <motion.span
                      layoutId="nav-bubble-coach"
                      className="absolute -inset-0.5 rounded-2xl bg-primary/10 border border-primary/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center">
                    <Icon active={active} className={isCoach ? 'w-7 h-7' : 'w-[22px] h-[22px]'} />
                  </span>
                </motion.div>
                <span
                  className={`text-[10px] tracking-wide transition-colors ${
                    active ? 'text-primary font-semibold' : 'text-ink-muted font-medium'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
