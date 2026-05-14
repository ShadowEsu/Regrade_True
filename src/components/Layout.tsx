import React from 'react';
import { motion } from 'motion/react';
import { ICONS, DEFAULT_AVATAR_SRC } from '../constants';
import { auth } from '../lib/firebase';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const user = auth.currentUser;
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || '';

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: ICONS.Home },
    { id: 'upload', label: 'Appeal', icon: ICONS.Upload },
    { id: 'chat', label: 'Chat', icon: ICONS.MessageSquare },
    { id: 'history', label: 'History', icon: ICONS.History },
    { id: 'profile', label: 'Profile', icon: ICONS.User },
  ];

  return (
    <div className="min-h-screen flex flex-col relative paper-texture selection:bg-primary/10">
      <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-3xl institutional-border pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-14 md:min-h-24 py-2 md:py-0 flex items-center justify-between gap-2">
          <div 
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => onTabChange('dashboard')}
          >
            <Logo size="md" className="!text-left" />
          </div>

          <div className="flex items-center gap-12">
            <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`font-sans text-sm font-light uppercase tracking-[0.28em] transition-all relative py-2 ${
                    activeTab === tab.id ? 'text-primary' : 'text-on-surface-variant/50 hover:text-primary'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="nav-pill"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_10px_rgba(0,35,111,0.2)]"
                    />
                  )}
                </button>
              ))}
            </nav>
            
            <div 
              className="flex items-center gap-4 cursor-pointer group"
              onClick={() => onTabChange('profile')}
            >
              {firstName && (
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-light uppercase tracking-[0.28em] text-primary opacity-45 leading-none mb-1">
                    Signed in as
                  </p>
                  <p className="text-sm font-light text-primary uppercase tracking-wide">{firstName}</p>
                </div>
              )}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-primary/10 p-0.5 overflow-hidden bg-white shadow-xl transition-all group-hover:border-primary/40">
                <img
                  src={user?.photoURL || DEFAULT_AVATAR_SRC}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pb-28 md:pb-12">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-16"
        >
          {children}
        </motion.div>
      </main>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-primary/15 px-2 pt-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]"
        aria-label="Main"
      >
        <div className="flex justify-around items-stretch max-w-lg mx-auto gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 min-h-[3.25rem] min-w-0 py-2 px-1 rounded-2xl active:scale-[0.98] ${
                activeTab === tab.id ? 'text-primary bg-primary/[0.06]' : 'text-on-surface-variant/45'
              }`}
            >
              <tab.icon className="w-6 h-6 shrink-0" strokeWidth={activeTab === tab.id ? 2.35 : 1.85} />
              <span className="text-[10px] font-semibold uppercase tracking-wide leading-tight text-center">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
