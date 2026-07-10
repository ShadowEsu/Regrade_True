import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { userService } from '../services/userService';
import { ConnectScreen } from '../features/connect';
import { ICONS } from '../constants';
import Logo from './Logo';

type Step = 'role' | 'name' | 'institution' | 'connector' | 'complete';

const STEP_INDEX: Record<Exclude<Step, 'complete'>, number> = {
  role: 1,
  name: 2,
  institution: 3,
  connector: 4,
};

export default function WelcomeSurvey({ onComplete }: { onComplete: () => void }) {
  const user = auth.currentUser;
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<'student' | 'supervisor'>('student');
  const [name, setName] = useState(user?.displayName ?? '');
  const [institution, setInstitution] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = step === 'complete' ? 100 : (STEP_INDEX[step] / 4) * 100;

  useEffect(() => {
    if (step !== 'complete') return;
    const timer = window.setTimeout(onComplete, 1300);
    return () => window.clearTimeout(timer);
  }, [step, onComplete]);

  const saveDetails = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await userService.syncProfile(user.uid, {
        name: name.trim(),
        email: user.email ?? '',
        school: institution.trim(),
        accountRole: role,
      });
      setStep('connector');
    } catch {
      setError('We could not save that yet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await userService.completeOnboarding(user.uid, {
        name: name.trim(),
        school: institution.trim(),
      });
      setStep('complete');
    } catch {
      setError('We could not finish setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const content = step === 'role' ? (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <p className="rg-meta-k">Welcome to Regrade</p>
        <h1 className="rg-serif text-[clamp(28px,6vw,38px)] font-semibold leading-tight text-ink">How will you use Regrade?</h1>
      </div>
      <div className="grid gap-3">
        <motion.button
          type="button"
          onClick={() => setRole('student')}
          whileTap={{ scale: 0.985 }}
          animate={{ y: role === 'student' ? -2 : 0 }}
          className={`rg-survey-role-card ${role === 'student' ? 'rg-survey-role-card-active' : ''}`}
        >
          <span className="rg-survey-role-icon"><ICONS.BookOpen className="h-5 w-5" strokeWidth={1.9} /></span>
          <span><strong>Student</strong><small>Appeals, feedback, and exam review.</small></span>
          {role === 'student' && <ICONS.Check className="ml-auto h-4 w-4 text-primary" strokeWidth={2.5} />}
        </motion.button>
        <motion.button
          type="button"
          onClick={() => setRole('supervisor')}
          whileTap={{ scale: 0.985 }}
          animate={{ y: role === 'supervisor' ? -2 : 0 }}
          className={`rg-survey-role-card ${role === 'supervisor' ? 'rg-survey-role-card-active' : ''}`}
        >
          <span className="rg-survey-role-icon"><ICONS.User className="h-5 w-5" strokeWidth={1.9} /></span>
          <span><strong>Teacher or parent</strong><small>Support a learner who invites you.</small></span>
          {role === 'supervisor' && <ICONS.Check className="ml-auto h-4 w-4 text-primary" strokeWidth={2.5} />}
        </motion.button>
      </div>
      <button type="button" onClick={() => setStep('name')} className="rg-btn-cta w-full py-3.5 text-[15px]">Continue</button>
    </div>
  ) : step === 'name' ? (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <p className="rg-meta-k">About you</p>
        <h1 className="rg-serif text-[clamp(28px,6vw,38px)] font-semibold leading-tight text-ink">What should we call you?</h1>
      </div>
      <label className="rg-glass-field">
        <span className="rg-glass-field-label">Name</span>
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="w-full bg-transparent text-[15px] text-ink outline-none" />
      </label>
      <button type="button" disabled={!name.trim()} onClick={() => setStep('institution')} className="rg-btn-cta w-full py-3.5 text-[15px] disabled:opacity-45">Continue</button>
    </div>
  ) : step === 'institution' ? (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <p className="rg-meta-k">Your institution</p>
        <h1 className="rg-serif text-[clamp(28px,6vw,38px)] font-semibold leading-tight text-ink">School or university?</h1>
      </div>
      <label className="rg-glass-field">
        <span className="rg-glass-field-label">Institution <span className="normal-case tracking-normal text-ink-muted">(optional)</span></span>
        <input autoFocus value={institution} onChange={(event) => setInstitution(event.target.value)} placeholder="Where you study or teach" className="w-full bg-transparent text-[15px] text-ink outline-none" />
      </label>
      {error && <p className="text-[13px] text-red-700" role="alert">{error}</p>}
      <button type="button" disabled={saving} onClick={() => void saveDetails()} className="rg-btn-cta w-full py-3.5 text-[15px] disabled:opacity-45">{saving ? 'Saving…' : 'Continue'}</button>
    </div>
  ) : step === 'connector' ? (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <p className="rg-meta-k">Set up</p>
        <h1 className="rg-serif text-[clamp(28px,6vw,38px)] font-semibold leading-tight text-ink">Connect a platform.</h1>
        <p className="text-[13px] leading-relaxed text-ink-muted">You can always do this later.</p>
      </div>
      {role === 'student' ? (
        <ConnectScreen onManualUpload={() => void finish()} onConnected={() => void finish()} compact />
      ) : (
        <div className="rounded-lg border border-hairline bg-parchment px-4 py-4 text-[13px] leading-relaxed text-ink-muted">Invite a learner after setup to view only the information they choose to share.</div>
      )}
      {error && <p className="text-[13px] text-red-700" role="alert">{error}</p>}
      <button type="button" disabled={saving} onClick={() => void finish()} className="rg-btn-ghost w-full py-3 text-[14px]">{saving ? 'Finishing…' : 'Set up later'}</button>
    </div>
  ) : (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex min-h-[260px] flex-col items-center justify-center text-center">
      <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 360, damping: 20 }} className="rg-survey-complete-check"><ICONS.Check className="h-8 w-8" strokeWidth={2.5} /></motion.div>
      <h1 className="rg-serif mt-5 text-[30px] font-semibold text-ink">You&apos;re all set.</h1>
      <p className="mt-2 text-[13px] text-ink-muted">Opening your workspace…</p>
    </motion.div>
  );

  return (
    <main className="rg-app-bg flex min-h-screen items-center justify-center px-4 py-8">
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl rg-glass-form-card p-6 sm:p-8">
        {step !== 'complete' && (
          <>
            <div className="flex items-center justify-between gap-4">
              <Logo size="xs" compact className="!items-start" />
              <span className="text-[11px] font-medium text-ink-muted">{STEP_INDEX[step]} / 4</span>
            </div>
            <div className="rg-survey-progress mt-5" aria-label={`Setup ${STEP_INDEX[step]} of 4 complete`}><motion.span animate={{ width: `${progress}%` }} transition={{ duration: 0.35, ease: 'easeOut' }} /></div>
          </>
        )}
        <AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className={step === 'complete' ? '' : 'pt-7'}>{content}</motion.div></AnimatePresence>
      </motion.section>
    </main>
  );
}
