import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'dompurify';
import { ICONS, DEFAULT_AVATAR_SRC } from '../constants';
import { auth, loginWithGoogle, signOut } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { userService, UserProfile } from '../services/userService';
import { scanContentForThreats } from '../lib/securityScanner';
import {
  AI_TRADEMARK_FOOTER,
  APP_EULA_URL,
  APP_MIN_AGE,
  APP_PRIVACY_URL,
  APP_SUPPORT_EMAIL,
  APP_TERMS_URL,
  APP_VERSION,
} from '../version';
import { isPreviewMode } from '../lib/previewMode';
import { accountService } from '../services/accountService';
import BrandSpinner from '../components/BrandSpinner';
import ContinueWithGoogleButton from '../components/ContinueWithGoogleButton';
import { ConnectScreen } from '../features/connect';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
import MarketingEyebrow from '../components/MarketingEyebrow';
import ThemePicker from '../components/ThemePicker';
import { useTheme } from '../context/ThemeContext';
import type { ThemePreference } from '../lib/theme';
import { PLAN_CATALOG, subscriptionService, type SubscriptionSnapshot } from '../services/subscriptionService';

interface ProfileProps {
  onShowAbout?: () => void;
}

type ProfileForm = {
  name: string;
  email: string;
  school: string;
  university: string;
  major: string;
  gradeLevel: string;
  gpa: string;
  appealGoal: string;
  appealTone: string[];
  appealFocus: string[];
};

/** How Regrade should sound — stored as lowercase ids, shown as labels. */
const TONE_CHIPS = [
  { id: 'polite', label: 'Polite' },
  { id: 'confident', label: 'Confident' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'formal', label: 'Formal' },
  { id: 'short', label: 'Short' },
  { id: 'detailed', label: 'Detailed' },
  { id: 'evidence_first', label: 'Evidence-first' },
] as const;

const FOCUS_CHIPS = [
  { id: 'rubric_mismatch', label: 'Rubric mismatch' },
  { id: 'calculation_errors', label: 'Calculation errors' },
  { id: 'missing_feedback', label: 'Missing feedback' },
  { id: 'partial_credit', label: 'Partial credit' },
  { id: 'unclear_deduction', label: 'Unclear deduction' },
  { id: 'tone_check', label: 'Tone check' },
  { id: 'stronger_evidence', label: 'Stronger evidence' },
] as const;

function toggleChip(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export type ProfileSection = 'you' | 'platform' | 'subscription' | 'ai' | 'account';

const EMPTY_FORM: ProfileForm = {
  name: '',
  email: '',
  school: '',
  university: '',
  major: '',
  gradeLevel: '',
  gpa: '',
  appealGoal: '',
  appealTone: [],
  appealFocus: [],
};

const SECTION_LABELS: Record<ProfileSection, string> = {
  you: 'My Profile',
  platform: 'Connections',
  subscription: 'Plan & usage',
  ai: 'Mr Whale & Alerts',
  account: 'Settings & Account',
};

function profileToForm(data: UserProfile, user: User): ProfileForm {
  return {
    name: data.name || user.displayName || '',
    email: data.email || user.email || '',
    school: data.school || '',
    university: data.university || '',
    major: data.major || '',
    gradeLevel: data.gradeLevel || '',
    gpa: data.gpa || '',
    appealGoal: data.appealGoal || '',
    appealTone: Array.isArray(data.appealTone) ? data.appealTone : [],
    appealFocus: Array.isArray(data.appealFocus) ? data.appealFocus : [],
  };
}

const Profile: React.FC<ProfileProps & { section?: ProfileSection; onSectionChange?: (s: ProfileSection) => void; onStartUpload?: () => void; onReplayTutorial?: () => void }> = ({
  onShowAbout,
  section: sectionProp,
  onSectionChange,
  onStartUpload,
  onReplayTutorial,
}) => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [analysisAlerts, setAnalysisAlerts] = useState(true);
  const [autoMode, setAutoMode] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);
  const [alertsSaving, setAlertsSaving] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => (
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  ));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Profile saved');
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [localSection, setLocalSection] = useState<ProfileSection>('you');
  const activeTab = sectionProp ?? localSection;
  const setActiveTab = (s: ProfileSection) => {
    if (onSectionChange) onSectionChange(s);
    else setLocalSection(s);
  };
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { preference: themePreference, resolved: themeResolved, setPreference: setThemePreference } = useTheme();
  const [themeSaving, setThemeSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const data = await userService.getProfile(u.uid);
          if (data) {
            setForm(profileToForm(data, u));
            setAnalysisAlerts(data.analysisAlerts !== false);
            setAutoMode(data.autoMode === true);
          } else {
            setForm({
              ...EMPTY_FORM,
              name: u.displayName || '',
              email: u.email || '',
            });
          }
        } catch (err) {
          console.error('Failed to fetch profile:', err);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    void subscriptionService.getStatus().then(setSubscription).catch(() => setSubscription(null));
  }, [user]);

  const updateAutoMode = async () => {
    if (!user || !subscription?.limits.autoMode) {
      setActiveTab('subscription');
      return;
    }
    const next = !autoMode;
    setAutoMode(next);
    try {
      await userService.setAutoMode(user.uid, next);
      if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      }
    } catch {
      setAutoMode(!next);
    }
  };

  const startPlan = async (plan: 'student' | 'pro') => {
    setBillingBusy(true);
    setBillingError(null);
    try { await subscriptionService.startCheckout(plan); }
    catch (error) { setBillingError(error instanceof Error ? error.message : 'Checkout is unavailable.'); }
    finally { setBillingBusy(false); }
  };

  const handleAnalysisAlertsChange = async () => {
    if (!user || alertsSaving) return;
    const next = !analysisAlerts;
    if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
    setAlertsSaving(true);
    setAnalysisAlerts(next);
    try {
      await userService.setAnalysisAlerts(user.uid, next);
    } catch (err) {
      console.error('Failed to save recovery alert preference:', err);
      setAnalysisAlerts(!next);
    } finally {
      setAlertsSaving(false);
    }
  };

  const sendTestNotification = () => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    new Notification('Regrade alerts are on', {
      body: 'Mr Whale will alert you when a completed review finds evidence worth checking.',
      icon: '/favicon.ico',
    });
  };

  const handleThemeChange = async (next: ThemePreference) => {
    if (next === themePreference || themeSaving) return;
    setThemeSaving(true);
    try {
      await setThemePreference(next);
      setToastMessage('Appearance updated');
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2200);
    } catch (err) {
      console.error('Failed to save theme preference:', err);
    } finally {
      setThemeSaving(false);
    }
  };

  const sanitizeInput = (val: string) => DOMPurify.sanitize(val.trim());

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSecurityError(null);

    const fullContent = [
      form.name,
      form.school,
      form.university,
      form.major,
      form.gradeLevel,
      form.gpa,
      form.appealGoal,
    ].join(' ');

    const scanResult = await scanContentForThreats(fullContent, 'profile');
    if (!scanResult.isSafe) {
      setSecurityError(
        scanResult.recommendation || "Your input contains content that can't be saved. Please review and try again.",
      );
      setSaving(false);
      return;
    }

    const knownTone = new Set<string>(TONE_CHIPS.map((c) => c.id));
    const knownFocus = new Set<string>(FOCUS_CHIPS.map((c) => c.id));
    const payload: Partial<UserProfile> = {
      name: sanitizeInput(form.name),
      school: sanitizeInput(form.school),
      university: sanitizeInput(form.university),
      major: sanitizeInput(form.major),
      gradeLevel: sanitizeInput(form.gradeLevel),
      gpa: sanitizeInput(form.gpa),
      appealGoal: sanitizeInput(form.appealGoal),
      appealTone: form.appealTone.filter((id) => knownTone.has(id)),
      appealFocus: form.appealFocus.filter((id) => knownFocus.has(id)),
      email: form.email,
    };

    try {
      await userService.syncProfile(user.uid, payload);
      setForm((prev) => ({
        ...prev,
        name: payload.name ?? prev.name,
        school: payload.school ?? prev.school,
        university: payload.university ?? prev.university,
        major: payload.major ?? prev.major,
        gradeLevel: payload.gradeLevel ?? prev.gradeLevel,
        gpa: payload.gpa ?? prev.gpa,
        appealGoal: payload.appealGoal ?? prev.appealGoal,
        appealTone: payload.appealTone ?? prev.appealTone,
        appealFocus: payload.appealFocus ?? prev.appealFocus,
      }));
      setToastMessage('Appeal profile saved');
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2800);
    } catch (err) {
      console.error('Profile save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      await accountService.deleteAccount();
      setShowDeleteDialog(false);
      setForm(EMPTY_FORM);
      if (isPreviewMode()) {
        setToastMessage('Account deleted (preview simulation)');
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 2800);
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete account. Try again or email support.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const inputClass = 'rg-glass-field-input';
  const textareaClass = `${inputClass} min-h-[72px] resize-y leading-relaxed`;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <BrandSpinner size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16 space-y-6">
        <div className="rg-card p-8 space-y-5">
          <ICONS.Shield size={40} className="mx-auto text-primary/25" />
          <h2 className="rg-serif text-2xl text-ink font-semibold">Sign in for your profile</h2>
          <p className="text-[14px] text-muted">Save your school, platform, and appeal preferences.</p>
          <ContinueWithGoogleButton onClick={() => void loginWithGoogle()} />
        </div>
      </div>
    );
  }

  /** Appeal-profile readiness: each unit makes drafts measurably better. */
  const completionUnits: boolean[] = [
    Boolean(form.name),
    Boolean(form.school || form.university),
    Boolean(form.major),
    Boolean(form.gradeLevel),
    Boolean(form.gpa),
    form.appealTone.length > 0,
    form.appealFocus.length > 0,
    Boolean(form.appealGoal),
  ];
  const completionPct = Math.round(
    (completionUnits.filter(Boolean).length / completionUnits.length) * 100,
  );
  const completionHint =
    completionPct >= 100
      ? 'Fully tuned — your drafts use everything here.'
      : !form.appealTone.length
        ? 'Pick a tone so drafts sound like you.'
        : !(form.school || form.university)
          ? 'Add your school for better context in drafts.'
          : 'Add your school, tone, and grading style for better drafts.';

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-[22px] rg-glass-hero px-5 py-7 sm:py-8 text-center">
        <div className="absolute -top-12 -right-8 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-violet-400/10 blur-3xl pointer-events-none" aria-hidden />
        <div className="relative space-y-4">
          <MarketingEyebrow>appeal profile</MarketingEyebrow>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="relative"
            >
              <div className="absolute -inset-1 rounded-[18px] bg-gradient-to-br from-primary/30 to-violet-400/20 blur-sm" aria-hidden />
              <img
                src={user.photoURL || DEFAULT_AVATAR_SRC}
                alt=""
                className="relative w-[84px] h-[84px] rounded-2xl border-2 border-white/80 object-cover rg-glass shadow-md"
              />
            </motion.div>
            <div>
              <h1 className="rg-serif text-[clamp(24px,5vw,30px)] text-ink font-semibold">{form.name || 'Student'}</h1>
              <p className="text-[12px] text-muted mt-0.5">{form.email}</p>
              <p className="text-[13px] text-ink-muted mt-2 max-w-[300px] mx-auto leading-relaxed">
                Regrade uses this to draft appeals that sound like you.
              </p>
            </div>
          </motion.div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('platform')}
              className="rg-glass-chip px-3 py-1.5 text-[11px] font-semibold text-primary inline-flex items-center gap-1.5"
            >
              {themeResolved === 'dark' ? (
                <ICONS.Moon className="w-3.5 h-3.5" strokeWidth={2} />
              ) : (
                <ICONS.Sun className="w-3.5 h-3.5" strokeWidth={2} />
              )}
              {themePreference === 'system' ? 'Theme: System' : themeResolved === 'dark' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>
        </div>
      </section>

      <p className="text-center text-[13px] font-medium text-ink-muted">
        {SECTION_LABELS[activeTab]}
      </p>

      <form onSubmit={(e) => void handleSave(e)} className="space-y-5">
        <AnimatePresence mode="wait">
          {activeTab === 'you' && (
            <motion.div
              key="you"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-4"
            >
              {/* Completion */}
              <div className="rg-glass-form-card p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[15px] font-semibold text-ink">
                  Your profile is{' '}
                    <span className="text-primary">{completionPct}% ready</span>
                  </p>
                  <span className="text-[11px] font-mono text-primary/60">{completionUnits.filter(Boolean).length}/{completionUnits.length}</span>
                </div>
                <div className="h-2 rounded-full bg-primary/10 overflow-hidden" role="progressbar" aria-valuenow={completionPct} aria-valuemin={0} aria-valuemax={100}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPct}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500"
                  />
                </div>
                <p className="text-[12px] text-ink-muted leading-relaxed">{completionHint}</p>
              </div>

              {/* Student context */}
              <div className="rg-glass-form-card p-5 sm:p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-primary/8 shrink-0">
                    <ICONS.BookOpen className="w-4 h-4 text-primary" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[16px] font-semibold text-ink leading-tight">Student Context</h2>
                    <p className="text-[12px] text-ink-muted mt-0.5">Who the appeal is coming from — only what you add gets used.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="rg-glass-field col-span-2">
                    <span className="rg-glass-field-label">Name</span>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputClass}
                      placeholder="Full name"
                    />
                  </label>
                  <label className="rg-glass-field">
                    <span className="rg-glass-field-label">School</span>
                    <input
                      type="text"
                      value={form.school}
                      onChange={(e) => setForm({ ...form, school: e.target.value })}
                      className={inputClass}
                      placeholder="High school"
                    />
                  </label>
                  <label className="rg-glass-field">
                    <span className="rg-glass-field-label">College / university</span>
                    <input
                      type="text"
                      value={form.university}
                      onChange={(e) => setForm({ ...form, university: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. Wesley College"
                    />
                  </label>
                  <label className="rg-glass-field">
                    <span className="rg-glass-field-label">Major</span>
                    <input
                      type="text"
                      value={form.major}
                      onChange={(e) => setForm({ ...form, major: e.target.value })}
                      className={inputClass}
                      placeholder="Computer Science"
                    />
                  </label>
                  <label className="rg-glass-field">
                    <span className="rg-glass-field-label">Year / grade</span>
                    <input
                      type="text"
                      value={form.gradeLevel}
                      onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                      className={inputClass}
                      placeholder="Sophomore"
                    />
                  </label>
                  <label className="rg-glass-field col-span-2 sm:col-span-1">
                    <span className="rg-glass-field-label">GPA</span>
                    <input
                      type="number"
                      min={0}
                      max={4}
                      step={0.1}
                      value={form.gpa}
                      onChange={(e) => setForm({ ...form, gpa: e.target.value })}
                      className={inputClass}
                      placeholder="3.8"
                    />
                  </label>
                </div>
              </div>

              {/* Appeal tone */}
              <div className="rg-glass-form-card p-5 sm:p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-primary/8 shrink-0">
                    <ICONS.MessageSquare className="w-4 h-4 text-primary" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[16px] font-semibold text-ink leading-tight">How should Regrade sound?</h2>
                    <p className="text-[12px] text-ink-muted mt-0.5">Pick a few — drafts match this voice.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Appeal tone">
                  {TONE_CHIPS.map((chip) => {
                    const selected = form.appealTone.includes(chip.id);
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setForm((prev) => ({ ...prev, appealTone: toggleChip(prev.appealTone, chip.id) }))
                        }
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold transition-all ${
                          selected
                            ? 'bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]'
                            : 'rg-glass-chip text-ink/75 hover:border-primary/35 hover:text-primary'
                        }`}
                      >
                        {selected && <ICONS.Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Focus areas */}
              <div className="rg-glass-form-card p-5 sm:p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-primary/8 shrink-0">
                    <ICONS.Search className="w-4 h-4 text-primary" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[16px] font-semibold text-ink leading-tight">What should Regrade focus on?</h2>
                    <p className="text-[12px] text-ink-muted mt-0.5">We check everything — these get extra attention.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Focus areas">
                  {FOCUS_CHIPS.map((chip) => {
                    const selected = form.appealFocus.includes(chip.id);
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setForm((prev) => ({ ...prev, appealFocus: toggleChip(prev.appealFocus, chip.id) }))
                        }
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold transition-all ${
                          selected
                            ? 'bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]'
                            : 'rg-glass-chip text-ink/75 hover:border-primary/35 hover:text-primary'
                        }`}
                      >
                        {selected && <ICONS.Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Extra instructions */}
              <div className="rg-glass-form-card p-5 sm:p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-primary/8 shrink-0">
                    <ICONS.Edit3 className="w-4 h-4 text-primary" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[16px] font-semibold text-ink leading-tight">Extra instructions</h2>
                    <p className="text-[12px] text-ink-muted mt-0.5">Anything else your drafts should always respect.</p>
                  </div>
                </div>
                <textarea
                  value={form.appealGoal}
                  onChange={(e) => setForm({ ...form, appealGoal: e.target.value })}
                  className={textareaClass}
                  maxLength={2000}
                  placeholder="Example: Keep the tone respectful, mention rubric evidence first, and avoid sounding angry."
                />
                <p className="text-[12px] text-ink-muted leading-relaxed flex items-start gap-2">
                  <ICONS.Shield className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-0.5" strokeWidth={2} />
                  We use this to make your appeal calmer, clearer, and more personal — never to judge you.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'platform' && (
            <motion.div
              key="platform"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rg-glass-form-card p-5 sm:p-6 space-y-6"
            >
              <ConnectScreen onManualUpload={onStartUpload ?? (() => undefined)} />

              <div className="border-t border-hairline pt-5">
                <ThemePicker
                  value={themePreference}
                  onChange={(next) => void handleThemeChange(next)}
                  disabled={themeSaving}
                />
              </div>

            </motion.div>
          )}

          {activeTab === 'subscription' && (
            <motion.div key="subscription" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="space-y-4">
              <div className="rg-glass-form-card p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <MarketingEyebrow>current plan</MarketingEyebrow>
                    <h2 className="rg-serif text-2xl text-ink font-semibold mt-1">{subscription ? PLAN_CATALOG[subscription.plan].name : 'Free'}</h2>
                    <p className="text-[12px] text-ink-muted mt-1">
                      {subscription ? `Renews or resets ${new Date(subscription.periodEnd).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}` : 'Loading usage…'}
                    </p>
                  </div>
                  <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-[12px] font-semibold text-primary">
                    {subscription ? `$${PLAN_CATALOG[subscription.plan].price.toFixed(2)}/month` : '$0.00/month'}
                  </span>
                </div>
                {subscription && <div className="grid grid-cols-2 gap-3">
                  {[{ label: 'Exam reviews', used: subscription.usage.exams, limit: subscription.limits.exams }, { label: 'Mr. Whale messages', used: subscription.usage.messages, limit: subscription.limits.messages }].map((item) => <div key={item.label} className="rounded-xl border border-hairline bg-parchment p-3">
                    <p className="text-[11px] text-ink-muted">{item.label}</p><p className="mt-1 text-lg font-semibold text-ink">{item.used} <span className="text-[12px] font-normal text-ink-muted">of {item.limit}</span></p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/10"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (item.used / item.limit) * 100)}%` }} /></div>
                  </div>)}
                </div>}
                {subscription?.cancelAtPeriodEnd && <p className="text-[12px] text-amber-700">Your plan ends at the close of this billing period.</p>}
                {subscription?.hasBillingAccount && <button type="button" onClick={() => void subscriptionService.openPortal()} className="rg-btn-secondary w-full">Manage billing</button>}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.entries(PLAN_CATALOG) as Array<[keyof typeof PLAN_CATALOG, (typeof PLAN_CATALOG)[keyof typeof PLAN_CATALOG]]>).map(([id, plan]) => <div key={id} className={`rg-glass-card p-4 space-y-3 ${subscription?.plan === id ? 'border-primary/40' : ''}`}>
                  <div><p className="text-[15px] font-semibold text-ink">{plan.name}</p><p className="text-xl font-semibold text-primary mt-1">${plan.price.toFixed(2)}<span className="text-[11px] font-normal text-ink-muted"> / month</span></p></div>
                  <ul className="space-y-1 text-[11px] text-ink-muted"><li>{plan.exams} exam reviews</li><li>{plan.messages} Mr. Whale messages</li><li>{plan.autoMode ? 'Auto Mode included' : 'Manual reviews'}</li></ul>
                  {id !== 'free' && subscription?.plan !== id && <button type="button" disabled={billingBusy} onClick={() => void startPlan(id)} className="rg-btn-primary w-full text-[12px]">Choose {plan.name}</button>}
                  {subscription?.plan === id && <span className="text-[11px] font-semibold text-primary">Current plan</span>}
                </div>)}
              </div>
              {billingError && <p className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-[12px] text-red-700">{billingError}</p>}
              <p className="text-[11px] text-ink-muted">Usage resets at the displayed billing-period end. Paid access is activated only after Stripe confirms the subscription.</p>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rg-glass-form-card p-5 sm:p-6 space-y-4"
            >
              <div className="rounded-2xl rg-glass-chip p-4">
                <p className="text-[14px] font-semibold text-ink">Mr. Whale</p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                  Your AI assistant reads the graded work you choose to analyze and helps you prepare a respectful, evidence-based next step.
                </p>
              </div>
              <div className="border-t border-hairline pt-4">
                <button type="button" role="switch" aria-checked={autoMode} onClick={() => void updateAutoMode()} className="mb-3 w-full text-left flex items-start justify-between gap-4 rounded-2xl rg-glass-chip p-4">
                  <span className="min-w-0"><span className="block text-[14px] font-semibold text-ink">Auto Mode</span><span className="block mt-1 text-[12px] leading-relaxed text-ink-muted">Automatically analyze newly imported marked exams, prepare the draft, then add the result to Review and History. Student or Pro plan required.</span></span>
                  <span className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${autoMode && subscription?.limits.autoMode ? 'bg-primary' : 'bg-ink/20'}`} aria-hidden><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${autoMode && subscription?.limits.autoMode ? 'translate-x-6' : 'translate-x-1'}`} /></span>
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={analysisAlerts}
                  disabled={alertsSaving}
                  onClick={() => void handleAnalysisAlertsChange()}
                  className="w-full text-left flex items-start justify-between gap-4 rounded-2xl rg-glass-chip p-4 disabled:opacity-55"
                >
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-ink">Review alerts</span>
                    <span className="block mt-1 text-[12px] leading-relaxed text-ink-muted">
                      Choose whether Regrade should surface completed reviews with evidence worth checking.
                    </span>
                  </span>
                  <span
                    className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                      analysisAlerts ? 'bg-primary' : 'bg-ink/20'
                    }`}
                    aria-hidden
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        analysisAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </button>
                <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[11px] leading-relaxed text-ink-muted">
                  <span>{notificationPermission === 'granted' ? 'Browser alerts are enabled on this device.' : notificationPermission === 'denied' ? 'Browser alerts are blocked for this site; in-app alerts still work.' : notificationPermission === 'unsupported' ? 'This device supports in-app alerts only.' : 'Turn alerts on to allow browser notifications on this device.'}</span>
                  {notificationPermission === 'granted' && analysisAlerts && <button type="button" onClick={sendTestNotification} className="shrink-0 font-semibold text-primary hover:underline">Send test</button>}
                </div>
              </div>
              {onReplayTutorial && <div className="border-t border-hairline pt-4">
                <button type="button" onClick={onReplayTutorial} className="text-[12px] font-semibold text-primary hover:underline">Replay the guided tour</button>
              </div>}
              <p className="text-[10px] text-muted leading-relaxed">{AI_TRADEMARK_FOOTER}</p>
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-4"
            >
              <div className="rg-glass-card p-5 space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-primary">Legal</p>
                <p className="text-[13px] text-muted leading-relaxed">
                  For users {APP_MIN_AGE}+ · v{APP_VERSION}
                </p>
                <div className="space-y-2">
                  <a
                    href={APP_PRIVACY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 rounded-xl rg-glass-chip hover:border-primary/30 transition-all"
                  >
                    <span className="text-[14px] font-medium text-ink">Privacy Policy</span>
                    <ICONS.ArrowRight className="w-4 h-4 text-muted" strokeWidth={1.75} />
                  </a>
                  <a
                    href={APP_TERMS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 rounded-xl rg-glass-chip hover:border-primary/30 transition-all"
                  >
                    <span className="text-[14px] font-medium text-ink">Terms of Service</span>
                    <ICONS.ArrowRight className="w-4 h-4 text-muted" strokeWidth={1.75} />
                  </a>
                  <a
                    href={APP_EULA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 rounded-xl rg-glass-chip hover:border-primary/30 transition-all"
                  >
                    <span className="text-[14px] font-medium text-ink">EULA</span>
                    <ICONS.ArrowRight className="w-4 h-4 text-muted" strokeWidth={1.75} />
                  </a>
                  <a
                    href={`mailto:${APP_SUPPORT_EMAIL}?subject=Regrade%20support`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl rg-glass-chip hover:border-primary/30 transition-all"
                  >
                    <span className="text-[14px] font-medium text-ink">Contact support</span>
                    <span className="text-[12px] text-muted">{APP_SUPPORT_EMAIL}</span>
                  </a>
                  {onShowAbout && (
                    <button
                      type="button"
                      onClick={onShowAbout}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl rg-glass-chip hover:border-primary/30 transition-all text-left"
                    >
                      <span className="text-[14px] font-medium text-ink">About & acknowledgements</span>
                      <ICONS.ArrowRight className="w-4 h-4 text-muted" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </div>

              {/* Regrade-style account actions — not GitHub row layout */}
              <div className="rg-glass-card p-5 space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted">Settings & account</p>
                  <p className="text-[13px] text-muted leading-relaxed max-w-xs mx-auto">
                    Sign out on this device or permanently delete your data.
                  </p>
                </div>

                {!isPreviewMode() && (
                  <button
                    type="button"
                    onClick={() => void signOut(auth)}
                    className="rg-btn-ghost w-full py-3 text-[14px]"
                  >
                    Sign out
                  </button>
                )}

                <div className="rounded-xl bg-red-500/[0.06] border border-red-500/15 p-4 space-y-3 text-center">
                  <ICONS.ShieldAlert className="w-8 h-8 text-red-600/70 mx-auto" strokeWidth={1.5} />
                  <div className="space-y-1">
                    <p className="rg-serif text-lg text-ink font-semibold">Delete your account</p>
                    <p className="text-[12px] text-muted leading-relaxed max-w-[280px] mx-auto">
                      Removes your profile, appeals, and drafts forever. Cancel subscriptions in the App
                      Store or Play Store first.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setShowDeleteDialog(true);
                    }}
                    disabled={deletingAccount}
                    className="w-full py-3 rounded-xl bg-red-600 text-white text-[14px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Delete account
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {securityError && (
          <p className="text-[12px] text-red-700 bg-red-50 border border-red-200/70 rounded-xl px-4 py-3">
            {securityError}
          </p>
        )}

        {activeTab === 'you' && (
          <div className="sticky bottom-[84px] z-30 -mx-1 px-1 pointer-events-none">
            <button
              type="submit"
              disabled={saving}
              className="rg-btn-cta w-full py-3.5 text-[15px] disabled:opacity-50 flex items-center justify-center gap-2 pointer-events-auto shadow-xl shadow-primary/20 backdrop-blur-sm"
            >
              {saving ? <ICONS.RefreshCcw className="animate-spin w-4 h-4" /> : null}
              {saving ? 'Saving…' : activeTab === 'you' ? 'Save Appeal Profile' : 'Save profile'}
            </button>
          </div>
        )}
      </form>

      <DeleteAccountDialog
        open={showDeleteDialog}
        deleting={deletingAccount}
        error={deleteError}
        onConfirm={() => void handleDeleteAccount()}
        onCancel={() => {
          if (!deletingAccount) setShowDeleteDialog(false);
        }}
      />

      <AnimatePresence>
        {showSavedToast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-24 left-4 right-4 z-50 flex justify-center pointer-events-none"
          >
            <div className="bg-primary text-white rounded-2xl px-5 py-3 inline-flex items-center gap-2 shadow-xl">
              <ICONS.Check size={18} />
              <span className="text-sm font-medium">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
