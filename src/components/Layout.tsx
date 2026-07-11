import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BRAND_ICON_SRC, COACH_NAME, COACH_NAV_LABEL } from '../branding';
import Logo from './Logo';
import { NAV_TAB_ICONS } from './BottomNavIcons';
import ProfileHeaderMenu from './ProfileHeaderMenu';
import ThemeQuickToggle from './ThemeQuickToggle';
import NotificationQuickToggle from './NotificationQuickToggle';
import type { ProfileSection } from '../views/Profile';
import { caseService } from '../services/caseService';
import { automationService } from '../services/automationService';

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
  { id: 'chat', label: COACH_NAV_LABEL },
  { id: 'study', label: 'Review' },
  { id: 'history', label: 'History' },
] as const;

export default function Layout({
  children,
  activeTab,
  onTabChange,
  profileSection,
  onProfileSectionChange,
}: LayoutProps) {
  const isChat = activeTab === 'chat';
  const [unread, setUnread] = useState<Record<string, number>>({ chat: 0, study: 0, history: 0 });
  const refreshUnread = useCallback(async () => {
    try {
      const cases = await caseService.getUserCases();
      const valueOf = (raw: unknown) => {
        if (raw && typeof (raw as { toDate?: () => Date }).toDate === 'function') return (raw as { toDate: () => Date }).toDate().getTime();
        const parsed = new Date(raw as string).getTime();
        return Number.isFinite(parsed) ? parsed : 0;
      };
      const historySeen = Number(localStorage.getItem('regrade.seen.history') ?? 0);
      const reviewSeen = Number(localStorage.getItem('regrade.seen.review') ?? 0);
      setUnread({
        chat: Number(localStorage.getItem('regrade.unread.coach') ?? 0),
        history: cases.filter((item) => valueOf(item.updatedAt) > historySeen).length,
        study: cases.filter((item) => item.analysis?.assignment.assignment_type === 'exam' && valueOf(item.updatedAt) > reviewSeen).length,
      });
    } catch { setUnread((current) => current); }
  }, []);

  useEffect(() => { void refreshUnread(); }, [activeTab, refreshUnread]);
  useEffect(() => { void automationService.runGradeDetection(); }, []);

  const selectTab = (tab: string) => {
    const now = Date.now().toString();
    if (tab === 'history') localStorage.setItem('regrade.seen.history', now);
    if (tab === 'study') localStorage.setItem('regrade.seen.review', now);
    if (tab === 'chat') localStorage.setItem('regrade.unread.coach', '0');
    setUnread((current) => ({ ...current, [tab]: 0 }));
    onTabChange(tab);
  };

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
                onClick={() => selectTab('dashboard')}
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
              <div className="flex items-center gap-1 shrink-0">
                <NotificationQuickToggle />
                <ThemeQuickToggle />
                <ProfileHeaderMenu
                  activeSection={profileSection}
                  onSectionChange={onProfileSectionChange}
                  onOpenProfile={() => onTabChange('profile')}
                />
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => selectTab('dashboard')}
                className="rg-header-logo-btn flex items-center min-w-0"
                aria-label="Home"
              >
                <Logo size="sm" compact className="!text-left !p-0" />
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <NotificationQuickToggle />
                <ThemeQuickToggle />
                <ProfileHeaderMenu
                  activeSection={profileSection}
                  onSectionChange={onProfileSectionChange}
                  onOpenProfile={() => onTabChange('profile')}
                />
              </div>
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
          data-tour="content"
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
                onClick={() => selectTab(tab.id)}
                className="relative flex flex-col items-center gap-1 flex-1 min-w-0 py-0.5"
                data-tour={tab.id === 'upload' ? 'appeal' : tab.id === 'chat' ? 'coach' : tab.id}
              >
                <div
                  className={`relative flex items-center justify-center ${
                    isCoach
                      ? 'w-12 h-12 -mt-3 rounded-full bg-canvas shadow-lg shadow-primary/15 border border-primary/15'
                      : 'w-10 h-10'
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
                  <span className="relative z-10 flex items-center justify-center">
                    <Icon active={active} className={isCoach ? 'w-7 h-7' : 'w-[22px] h-[22px]'} />
                    {!active && (unread[tab.id] ?? 0) > 0 && <span className="absolute -right-2 -top-2 min-w-4 h-4 rounded-full bg-red-600 px-1 text-[9px] font-bold leading-4 text-white shadow-sm" aria-label={`${unread[tab.id]} unread`}>{Math.min(99, unread[tab.id])}</span>}
                  </span>
                </div>
                <span
                  className={`text-[10px] tracking-wide ${active ? 'font-semibold text-primary' : 'font-medium text-ink-muted'}`}
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
