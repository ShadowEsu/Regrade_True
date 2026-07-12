import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { NAV_TAB_ICONS } from './BottomNavIcons';
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
  { id: 'study', label: 'Review' },
  { id: 'upload', label: 'Appeal' },
  { id: 'history', label: 'History' },
  { id: 'profile', label: 'Profile' },
] as const;

export default function Layout({
  children,
  activeTab,
  onTabChange,
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
  useEffect(() => {
    void automationService.runGradeDetection().catch(() => {
      localStorage.setItem('regrade.automation.lastFailure', String(Date.now()));
    });
  }, []);

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
      <main className="flex flex-col flex-1 min-h-0 pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={`flex flex-col flex-1 min-h-0 w-full ${
            isChat ? 'w-full' : 'rg-app-shell py-4 sm:py-5'
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
          className="rg-bottom-nav rg-app-shell flex justify-between items-center gap-1 px-2 py-2"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = NAV_TAB_ICONS[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className="rg-nav-item relative flex flex-col items-center gap-1 flex-1 min-w-0 py-0.5"
                data-tour={tab.id === 'upload' ? 'appeal' : tab.id}
              >
                <div
                  className="relative flex h-10 w-10 items-center justify-center"
                >
                  {active && (
                    <motion.span
                      layoutId="nav-bubble"
                      className="rg-nav-selection absolute inset-0 rounded-2xl"
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center">
                    <Icon active={active} className="h-[21px] w-[21px]" />
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
