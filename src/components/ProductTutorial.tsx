import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { auth } from '../lib/firebase';
import { userService } from '../services/userService';
import type { ProfileSection } from '../views/Profile';

type Role = 'student' | 'supervisor';
type TourTarget = 'dashboard' | 'appeal' | 'coach' | 'study' | 'history' | 'profile' | 'notifications';
type Tab = 'dashboard' | 'upload' | 'chat' | 'study' | 'history' | 'profile';
type TourStep = { label: string; title: string; body: string; target: TourTarget; tab: Tab; section?: ProfileSection };

const studentSteps: TourStep[] = [
  { label: 'Home', title: 'Your starting point', body: 'Home is where you begin an appeal, ask Mr Whale, connect a platform, or open your Review room.', target: 'dashboard', tab: 'dashboard' },
  { label: 'Appeal', title: 'Review marked work', body: 'Upload a marked exam, rubric, teacher feedback, PDF, or a clear photo. Regrade starts with visible evidence.', target: 'appeal', tab: 'upload' },
  { label: 'Evidence', title: 'Check the evidence first', body: 'Scores, rubric rows, and comments stay separate, so you can decide whether to ask a clarification or prepare an appeal.', target: 'appeal', tab: 'upload' },
  { label: 'Connections', title: 'Connect a platform when useful', body: 'Your profile menu is where you search Canvas, Google Classroom, Moodle, and more. Direct upload always works too.', target: 'profile', tab: 'profile', section: 'platform' },
  { label: 'Coach', title: 'Ask Mr Whale', body: 'Use Coach to understand feedback, practise a missed skill, or phrase a respectful question.', target: 'coach', tab: 'chat' },
  { label: 'Review', title: 'Review marked exams', body: 'Review turns analyzed exam evidence into a check-off plan. It does not mix in ordinary homework.', target: 'study', tab: 'study' },
  { label: 'History', title: 'Return to past work', body: 'History keeps analyses and drafts together so you can revisit them when you need to.', target: 'history', tab: 'history' },
  { label: 'Alerts', title: 'Control notifications', body: 'Use the bell beside the theme control to turn review alerts on or off. Profile contains additional alert details.', target: 'notifications', tab: 'dashboard' },
  { label: 'Settings', title: 'Manage your account', body: 'Settings & account contains your privacy choices, account information, and account deletion controls.', target: 'profile', tab: 'profile', section: 'account' },
  { label: 'Ready', title: 'You are ready to begin', body: 'Start with a marked exam whenever you are ready. Regrade helps you understand the grade, learn from it, and make a respectful appeal when evidence supports one.', target: 'dashboard', tab: 'dashboard' },
];

const supervisorSteps: TourStep[] = [
  { label: 'Home', title: 'Your supervisor workspace', body: 'Home is where you support a learner while keeping the learner in control.', target: 'dashboard', tab: 'dashboard' },
  { label: 'Learner', title: 'Invite a learner from Review', body: 'Review is the consent-first workspace. A learner chooses whether to connect and what they share.', target: 'study', tab: 'study' },
  { label: 'Consent', title: 'Learner consent comes first', body: 'Nothing is visible until the learner accepts. They can remove access at any time.', target: 'study', tab: 'study' },
  { label: 'Appeal', title: 'Support an appeal review', body: 'Use Appeal to help prepare a clarification or draft for the learner to review. Regrade never sends it automatically.', target: 'appeal', tab: 'upload' },
  { label: 'Coach', title: 'Ask Mr Whale about evidence', body: 'Coach can explain feedback and suggest a respectful next step. It does not promise or force a grade change.', target: 'coach', tab: 'chat' },
  { label: 'History', title: 'Keep approved work organized', body: 'History is for your own work and any learner work explicitly shared with you.', target: 'history', tab: 'history' },
  { label: 'Connections', title: 'Manage your own connections', body: 'Connections are in the profile menu. A learner school account is never connected to you automatically.', target: 'profile', tab: 'profile', section: 'platform' },
  { label: 'Alerts', title: 'Choose your notifications', body: 'Use the bell beside the theme control to turn your review alerts on or off. Learner notifications remain attached to the learner account.', target: 'notifications', tab: 'dashboard' },
  { label: 'Settings', title: 'Account and privacy controls', body: 'Settings & account is where you manage your profile and account controls.', target: 'profile', tab: 'profile', section: 'account' },
  { label: 'Ready', title: 'Ready to support a learner', body: 'Invite the learner when they are ready, then let them decide what to share and which action to take.', target: 'study', tab: 'study' },
];

type TargetBox = { top: number; left: number; width: number; height: number };
type CardPlacement = { top: number; left: number; arrow: 'up' | 'down' | null };

const CARD_WIDTH = 288;
const CARD_HEIGHT = 210;
const VIEWPORT_GUTTER = 12;

function getCardPlacement(box: TargetBox | null, cardHeight = CARD_HEIGHT): CardPlacement {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // The first step deliberately introduces the page rather than a specific control.
  if (!box) {
    return {
      top: Math.min(82, viewportHeight - cardHeight - VIEWPORT_GUTTER),
      left: Math.max(VIEWPORT_GUTTER, (viewportWidth - CARD_WIDTH) / 2),
      arrow: null,
    };
  }

  const left = Math.max(
    VIEWPORT_GUTTER,
    Math.min(box.left + box.width / 2 - CARD_WIDTH / 2, viewportWidth - CARD_WIDTH - VIEWPORT_GUTTER),
  );
  const placeBelow = box.top + box.height / 2 < viewportHeight / 2;
  const rawTop = placeBelow ? box.top + box.height + 14 : box.top - cardHeight - 14;

  return {
    top: Math.max(VIEWPORT_GUTTER, Math.min(rawTop, viewportHeight - cardHeight - VIEWPORT_GUTTER)),
    left,
    arrow: placeBelow ? 'up' : 'down',
  };
}

export default function ProductTutorial({ role, index: requestedIndex, onNext, onTabChange, onProfileSectionChange, onComplete }: {
  role: Role;
  index: number;
  onNext: () => void;
  onTabChange: (tab: Tab) => void;
  onProfileSectionChange: (section: ProfileSection) => void;
  onComplete: () => void;
}) {
  const steps = role === 'supervisor' ? supervisorSteps : studentSteps;
  const index = Math.min(Math.max(requestedIndex, 0), steps.length - 1);
  const [targetBox, setTargetBox] = useState<TargetBox | null>(null);
  const [cardPlacement, setCardPlacement] = useState<CardPlacement>(() => getCardPlacement(null));
  const [cardHeight, setCardHeight] = useState(CARD_HEIGHT);
  const cardRef = useRef<HTMLElement | null>(null);
  const [finishing, setFinishing] = useState(false);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  useEffect(() => {
    onTabChange(step.tab);
    if (step.section) onProfileSectionChange(step.section);

    const locate = () => {
      const element = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (!element) {
        setTargetBox(null);
        setCardPlacement(getCardPlacement(null, cardHeight));
        return;
      }
      const rect = element.getBoundingClientRect();
      const nextBox = { top: rect.top - 5, left: rect.left - 5, width: rect.width + 10, height: rect.height + 10 };
      setTargetBox(nextBox);
      setCardPlacement(getCardPlacement(nextBox, cardHeight));
    };
    const timers = [120, 320, 620].map((delay) => window.setTimeout(locate, delay));
    window.addEventListener('resize', locate);
    return () => { timers.forEach(window.clearTimeout); window.removeEventListener('resize', locate); };
    // The walkthrough intentionally changes the page only when its step changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, cardHeight]);

  useLayoutEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    const updateCardHeight = () => setCardHeight(Math.ceil(element.getBoundingClientRect().height));
    updateCardHeight();
    const observer = new ResizeObserver(updateCardHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [index]);

  const finishTutorial = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setFinishing(true);
    try {
      await userService.completeTutorial(user.uid);
      onComplete();
    } catch {
      setFinishing(false);
    }
  };

  // Keep the normal path synchronous. It makes the state transition reliable on
  // mobile browsers and avoids a promise-returning click handler for steps 1–9.
  const advance = () => {
    if (!isLast) {
      onNext();
      return;
    }
    void finishTutorial();
  };

  return <div className="fixed inset-0 z-[100] pointer-events-auto" aria-live="polite">
    {targetBox && <div
      aria-hidden
      className="pointer-events-none fixed rounded-2xl border-2 border-primary bg-primary/5 shadow-[0_0_0_4px_rgba(255,255,255,0.9),0_0_0_7px_rgba(37,99,235,0.25)]"
      style={targetBox}
    />}
    <section
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      style={{ top: cardPlacement.top, left: cardPlacement.left }}
      className="pointer-events-auto fixed z-[102] w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-hairline bg-canvas p-3.5 shadow-lg shadow-ink/12"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="rg-meta-k text-primary">{index + 1} of {steps.length} · {step.label}</p>
        <div className="flex max-w-[6.5rem] flex-1 gap-0.5" aria-hidden>{steps.map((_, dot) => <span key={dot} className={`h-1 flex-1 rounded-full ${dot <= index ? 'bg-primary' : 'bg-ink/10'}`} />)}</div>
      </div>
      <h2 id="tutorial-title" className="rg-serif mt-1.5 text-base font-semibold leading-tight text-ink">{step.title}</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{step.body}</p>
      <button data-testid="tutorial-next" type="button" onClick={advance} disabled={finishing} className="rg-btn-cta mt-2.5 w-full py-2 text-[12px] disabled:opacity-45">
        {finishing ? 'Saving…' : isLast ? 'Start using Regrade' : 'Next'}
      </button>
    </section>
  </div>;
}
