import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { userService } from '../services/userService';
import { notificationService } from '../services/notificationService';
import { ConnectScreen } from '../features/connect';
import { ICONS } from '../constants';
import { BRAND_ICON_SRC } from '../branding';
import { userFacingError } from '../lib/userFacingError';
import CoachWhale from './CoachWhale';
import type { AccountRole } from '../services/userService';

type Step = 'intro' | 'role' | 'name' | 'institution' | 'connector' | 'notifications' | 'complete';

const ORDER: Exclude<Step, 'intro' | 'complete'>[] = ['role', 'name', 'institution', 'connector', 'notifications'];

const INTRO_SLIDES = [
  { eyebrow: 'Understand', title: 'See what the marks mean.', body: 'Regrade reads the score, rubric, and teacher feedback together.', icon: ICONS.Search },
  { eyebrow: 'Appeal', title: 'Use evidence, not guesses.', body: 'Possible grading issues become a respectful draft you control.', icon: ICONS.MessageSquare },
  { eyebrow: 'Improve', title: 'Learn from every exam.', body: 'Only analyzed exams shape your personal Review plan.', icon: ICONS.BookOpen },
] as const;

export default function WelcomeSurvey({ onComplete }: { onComplete: () => void }) {
  const user = auth.currentUser;
  const [step, setStep] = useState<Step>('intro');
  const [introIndex, setIntroIndex] = useState(0);
  const [role, setRole] = useState<AccountRole>('student');
  const [name, setName] = useState(user?.displayName ?? '');
  const [institution, setInstitution] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = step === 'complete' ? ORDER.length : step === 'intro' ? -1 : ORDER.indexOf(step);
  const canGoBack = step !== 'intro' && step !== 'complete';

  const goBack = () => {
    setError(null);
    if (step === 'role') setStep('intro');
    if (step === 'name') setStep('role');
    if (step === 'institution') setStep('name');
    if (step === 'connector') setStep('institution');
    if (step === 'notifications') setStep('connector');
  };

  useEffect(() => {
    if (step !== 'complete') return;
    const timer = window.setTimeout(onComplete, 1200);
    return () => window.clearTimeout(timer);
  }, [step, onComplete]);

  const saveDetails = async (schoolOverride?: string) => {
    if (!user || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await userService.saveOnboardingDetails(user.uid, {
        name: name.trim(),
        school: (schoolOverride ?? institution).trim(),
        accountRole: role,
      });
      setStep('connector');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Welcome survey save failed', err);
      setError(userFacingError(err, 'We could not save that yet. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const finish = async (requestNotifications = false) => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      if (requestNotifications) await notificationService.requestPermission();
      await userService.completeOnboarding(user.uid, {
        name: name.trim(),
        school: institution.trim(),
        accountRole: role,
      });
      setStep('complete');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Welcome survey finish failed', err);
      setError(userFacingError(err, 'We could not finish setup. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const intro = INTRO_SLIDES[introIndex];

  const content =
    step === 'intro' ? (
      <div className="rg-intro-slide">
        <div className="rg-intro-visual" aria-hidden>
          <span><intro.icon /></span>
          <i /><i /><i />
        </div>
        <div>
          <p className="rg-welcome-eyebrow">{intro.eyebrow}</p>
          <h1 className="rg-welcome-title">{intro.title}</h1>
          <p className="rg-welcome-hint">{intro.body}</p>
        </div>
        <div className="rg-intro-dots" aria-label={`Introduction ${introIndex + 1} of ${INTRO_SLIDES.length}`}>
          {INTRO_SLIDES.map((slide, index) => <span key={slide.title} data-active={index === introIndex} />)}
        </div>
        <button
          type="button"
          onClick={() => introIndex < INTRO_SLIDES.length - 1 ? setIntroIndex(introIndex + 1) : setStep('role')}
          className="rg-auth-cta w-full"
        >
          {introIndex < INTRO_SLIDES.length - 1 ? 'Continue' : 'Get started'}
        </button>
      </div>
    ) : step === 'role' ? (
      <div className="space-y-7">
        <div>
          <p className="rg-welcome-eyebrow">Choose your space</p>
          <h1 className="rg-welcome-title">How will you use Regrade?</h1>
          <p className="rg-welcome-hint">Pick the one that fits you best. You can change it later.</p>
        </div>
        <div className="grid gap-3">
          <motion.button
            type="button"
            onClick={() => setRole('student')}
            whileTap={{ scale: 0.985 }}
            animate={{ y: role === 'student' ? -1 : 0 }}
            className={`rg-survey-role-card ${role === 'student' ? 'rg-survey-role-card-active' : ''}`}
          >
            <span className="rg-survey-role-icon">
              <ICONS.BookOpen className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <span>
              <strong>Student</strong>
              <small>Appeals, feedback, and exam review.</small>
            </span>
            {role === 'student' && <ICONS.Check className="ml-auto h-4 w-4 text-primary" strokeWidth={2.5} />}
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setRole('parent')}
            whileTap={{ scale: 0.985 }}
            animate={{ y: role === 'parent' ? -1 : 0 }}
            className={`rg-survey-role-card ${role === 'parent' ? 'rg-survey-role-card-active' : ''}`}
          >
            <span className="rg-survey-role-icon">
              <ICONS.User className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <span>
              <strong>Parent or guardian</strong>
              <small>Support one or more children and approve sensitive actions.</small>
            </span>
            {role === 'parent' && <ICONS.Check className="ml-auto h-4 w-4 text-primary" strokeWidth={2.5} />}
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setRole('teacher')}
            whileTap={{ scale: 0.985 }}
            animate={{ y: role === 'teacher' ? -1 : 0 }}
            className={`rg-survey-role-card ${role === 'teacher' ? 'rg-survey-role-card-active' : ''}`}
          >
            <span className="rg-survey-role-icon"><ICONS.Landmark className="h-5 w-5" strokeWidth={1.9} /></span>
            <span>
              <strong>Teacher</strong>
              <small>Manage linked learners and help explain marked feedback.</small>
            </span>
            {role === 'teacher' && <ICONS.Check className="ml-auto h-4 w-4 text-primary" strokeWidth={2.5} />}
          </motion.button>
        </div>
        <button type="button" onClick={() => setStep('name')} className="rg-auth-cta w-full">
          Continue
        </button>
      </div>
    ) : step === 'name' ? (
      <div className="space-y-7">
        <div>
          <p className="rg-welcome-eyebrow">A quick introduction</p>
          <h1 className="rg-welcome-title">What should we call you?</h1>
          <p className="rg-welcome-hint">First name is fine. Mr Whale will use it when guiding you.</p>
        </div>
        <label className="rg-auth-field">
          <span>Name</span>
          <div className="rg-auth-field-input">
            <ICONS.User size={16} strokeWidth={2} />
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        </label>
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => setStep('institution')}
          className="rg-auth-cta w-full"
        >
          Continue
        </button>
      </div>
    ) : step === 'institution' ? (
      <div className="space-y-7">
        <div>
          <p className="rg-welcome-eyebrow">Your learning context</p>
          <h1 className="rg-welcome-title">{role === 'student' ? 'Where do you study?' : 'Which school are you supporting?'}</h1>
          <p className="rg-welcome-hint">Optional. It helps keep learner work and school context organized.</p>
        </div>
        <label className="rg-auth-field">
          <span>School or university</span>
          <div className="rg-auth-field-input">
            <ICONS.BookOpen size={16} strokeWidth={2} />
            <input
              autoFocus
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Skip if you'd rather not say"
            />
          </div>
        </label>
        {error && (
          <p className="text-[13px] text-red-700" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveDetails()}
          className="rg-auth-cta w-full"
        >
          {saving ? 'Saving your details…' : 'Save and continue'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setInstitution('');
            void saveDetails('');
          }}
          className="rg-welcome-skip"
        >
          Skip for now
        </button>
      </div>
    ) : step === 'connector' ? (
      <div className="space-y-6">
        <div>
          <p className="rg-welcome-eyebrow">Bring in your work</p>
          <h1 className="rg-welcome-title">Connect a platform.</h1>
          <p className="rg-welcome-hint">Optional. You can skip and connect one later from Profile.</p>
        </div>
        {role === 'student' ? (
          <ConnectScreen onManualUpload={() => setStep('notifications')} onConnected={() => setStep('notifications')} compact />
        ) : (
          <div className="rounded-2xl border border-hairline bg-parchment px-4 py-4 text-[13px] leading-relaxed text-ink-muted">
            Link learners after setup. Each learner must approve access before any private work appears.
          </div>
        )}
        {error && (
          <p className="text-[13px] text-red-700" role="alert">
            {error}
          </p>
        )}
        <button type="button" disabled={saving} onClick={() => setStep('notifications')} className="rg-btn-ghost w-full">
          Skip for now
        </button>
      </div>
    ) : step === 'notifications' ? (
      <div className="space-y-7">
        <div>
          <p className="rg-welcome-eyebrow">Stay in the loop</p>
          <h1 className="rg-welcome-title">Know when a review is ready.</h1>
          <p className="rg-welcome-hint">You can change this any time in Settings.</p>
        </div>
        <div className="rg-notification-primer" aria-hidden>
          <span><ICONS.Bell /></span>
          <i /><i /><i />
        </div>
        <ul className="rg-permission-benefits">
          <li><ICONS.Check /> Analysis finished</li>
          <li><ICONS.Check /> Possible grading issue found</li>
          <li><ICONS.Check /> New work imported by Auto Mode</li>
        </ul>
        {error && <p className="text-[13px] text-red-700" role="alert">{error}</p>}
        <div className="space-y-3">
          <button type="button" disabled={saving} onClick={() => void finish(true)} className="rg-auth-cta w-full">
            {saving ? 'Finishing…' : 'Allow notifications'}
          </button>
          <button type="button" disabled={saving} onClick={() => void finish(false)} className="rg-btn-ghost w-full">Maybe later</button>
        </div>
      </div>
    ) : (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-h-[260px] flex-col items-center justify-center text-center"
      >
        <motion.div
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 20 }}
          className="rg-survey-complete-check"
        >
          <ICONS.Check className="h-8 w-8" strokeWidth={2.5} />
        </motion.div>
        <h1 className="rg-welcome-title mt-5">You're all set.</h1>
        <p className="rg-welcome-hint">Opening your workspace…</p>
      </motion.div>
    );

  return (
    <main className="rg-welcome-shell">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="rg-welcome-card"
      >
        {step !== 'complete' && (
          <header className="rg-welcome-topbar">
            <div className="rg-welcome-brand">
              <img src={BRAND_ICON_SRC} alt="" aria-hidden draggable={false} />
              <span>Regrade</span>
            </div>
            {step !== 'intro' && <div className="rg-onboarding-whale" aria-hidden><CoachWhale size={42} /><span>Mr Whale</span></div>}
          </header>
        )}
        {step !== 'complete' && step !== 'intro' && (
          <div className="rg-welcome-progress-wrap">
            <div className="rg-welcome-progress-label">
              <button type="button" onClick={goBack} disabled={!canGoBack} className="rg-welcome-back" aria-label="Go back">
                <ICONS.ChevronLeft size={18} />
              </button>
              <span>Step {stepIndex + 1} of {ORDER.length}</span>
            </div>
            <div className="rg-welcome-dots" aria-label={`Setup progress: step ${stepIndex + 1} of ${ORDER.length}`}>
              {ORDER.map((id, i) => <span key={id} data-state={i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'upcoming'} />)}
            </div>
          </div>
        )}
        {/* Keyed remount keeps the slide-in without AnimatePresence:
            a hung exit animation must never be able to block onboarding. */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className={step === 'complete' ? '' : 'rg-welcome-body'}
        >
          {content}
        </motion.div>
      </motion.section>
    </main>
  );
}
