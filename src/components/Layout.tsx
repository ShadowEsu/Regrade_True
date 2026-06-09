import React from 'react';
import { motion } from 'motion/react';
import { BRAND_ICON_SRC, COACH_NAME } from '../branding';
import Logo from './Logo';
import { NAV_TAB_ICONS } from './BottomNavIcons';
import ProfileHeaderMenu from './ProfileHeaderMenu';
import type { ProfileSection } from '../views/Profile';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  profileSection: ProfileSection;
  onProfileSectionChange: (section: ProfileSection) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Home' },
  { id: 'upload', label: 'Appeal' },
  { id: 'chat', label: 'Mr Whale' },
  { id: 'history', label: 'History' },
  { id: 'profile', label: 'Profile' },
] as const;

export default function Layout({
  children,
  activeTab,
  onTabChange,
  profileSection,
  onProfileSectionChange,
}: LayoutProps) {
  const isChat = activeTab === 'chat';

  return (
    <div className="rg-app-bg selection:bg-primary/15">
      <header
        className={`shrink-0 z-50 overflow-visible pt-[env(safe-area-inset-top)] ${
          isChat ? 'bg-gradient-to-b from-primary/[0.1] to-canvas/80 border-b border-primary/10' : 'rg-subnav'
        }`}
        style={isChat ? { backdropFilter: 'saturate(180%) blur(16px)' } : undefined}
      >
        <div className="rg-app-shell h-16 sm:h-[4.25rem] flex items-center justify-between gap-3">
          {isChat ? (
            <>
              <button
                type="button"
                onClick={() => onTabChange('dashboard')}
                className="rg-header-icon-btn w-9 h-9 shrink-0"
                aria-label="Home"
              >
                <img
                  src={BRAND_ICON_SRC}
                  alt=""
                  className="w-7 h-7 rounded-lg object-cover"
                  draggable={false}
                />
              </button>
              <div className="text-center min-w-0">
                <span className="rg-serif text-lg text-ink font-semibold">{COACH_NAME}</span>
              </div>
              <ProfileHeaderMenu
                activeSection={profileSection}
                onSectionChange={onProfileSectionChange}
                onOpenProfile={() => onTabChange('profile')}
              />
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onTabChange('dashboard')}
                className="rg-header-logo-btn flex items-center min-w-0"
                aria-label="Home"
              >
                <Logo size="sm" compact className="!text-left !p-0" />
              </button>
              <ProfileHeaderMenu
                activeSection={profileSection}
                onSectionChange={onProfileSectionChange}
                onOpenProfile={() => onTabChange('profile')}
              />
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
            isChat ? 'w-full' : 'rg-app-shell py-6 sm:py-8 md:py-10'
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
          className="rg-bottom-nav rg-app-shell flex justify-between items-end gap-1 px-2 py-2"
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
                      className="absolute inset-0 rounded-2xl rg-glass rg-nav-active-glow border border-primary/20"
                      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    />
                  )}
                  {active && isCoach && (
                    <motion.span
                      layoutId="nav-bubble-coach"
                      className="absolute -inset-0.5 rounded-2xl rg-glass rg-nav-active-glow border border-primary/25"
                      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    />
                  )}
                  {active && (
                    <motion.span
                      className="absolute inset-0 rounded-2xl bg-primary/8"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center">
                    <Icon active={active} className={isCoach ? 'w-7 h-7' : 'w-[22px] h-[22px]'} />
                  </span>
                </motion.div>
                <motion.span
                  animate={{
                    color: active ? '#0066cc' : '#7a7a7a',
                    scale: active ? 1.04 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className={`text-[10px] tracking-wide ${active ? 'font-semibold' : 'font-medium'}`}
                >
                  {tab.label}
                </motion.span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
