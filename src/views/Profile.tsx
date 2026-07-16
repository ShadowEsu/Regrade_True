import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'dompurify';
import { ICONS, DEFAULT_AVATAR_SRC } from '../constants';
import { auth, loginWithGoogle } from '../lib/firebase';
import { secureSignOut } from '../services/sessionService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { userService, UserProfile, DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPreferences, type AccountRole } from '../services/userService';
import { scanContentForThreats } from '../lib/securityScanner';
import {
  AI_TRADEMARK_FOOTER,
  APP_DELETE_ACCOUNT_URL,
  APP_EULA_URL,
  APP_MIN_AGE,
  APP_PRIVACY_URL,
  APP_SUPPORT_EMAIL,
  APP_TERMS_URL,
  APP_VERSION,
} from '../version';
import { accountService } from '../services/accountService';
import BrandSpinner from '../components/BrandSpinner';
import ContinueWithGoogleButton from '../components/ContinueWithGoogleButton';
import { ConnectScreen } from '../features/connect';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
import MarketingEyebrow from '../components/MarketingEyebrow';
import { PLAN_CATALOG, subscriptionService, type SubscriptionSnapshot } from '../services/subscriptionService';
import {
  CURRENCY_OPTIONS,
  formatMoney,
  loadUsdRates,
  readStoredCurrency,
  storeCurrency,
  type DisplayCurrency,
} from '../services/currencyService';
import { automationService } from '../services/automationService';
import { isNativeStore } from '../services/storePurchaseService';
import LearnerPairingPanel from '../components/LearnerPairingPanel';
import { notificationService } from '../services/notificationService';

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

const NOTIFICATION_CATEGORIES: Array<{ key: keyof NotificationPreferences; label: string; detail: string }> = [
  { key: 'imports', label: 'Imports', detail: 'New graded work arrived from a connected platform.' },
  { key: 'analysisComplete', label: 'Analysis completed', detail: 'An AI evidence review finished successfully.' },
  { key: 'possibleIssue', label: 'Possible grading issue', detail: 'Evidence may be worth checking with the teacher.' },
  { key: 'appealReady', label: 'Appeal ready', detail: 'A respectful draft is ready for your review.' },
  { key: 'parent', label: 'Parent and supervisor', detail: 'Pairing, permission, and shared-review updates.' },
  { key: 'weeklySummary', label: 'Weekly summary', detail: 'One grouped recap of reviews and study patterns.' },
];

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
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [autoMode, setAutoMode] = useState(false);
  const [automaticGradeDetection, setAutomaticGradeDetection] = useState(false);
  const [accountRole, setAccountRole] = useState<AccountRole>('student');
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [automationError, setAutomationError] = useState<string | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);
  const [nativePrices, setNativePrices] = useState<Partial<Record<'student' | 'pro', string>>>({});
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>(() => readStoredCurrency());
  const [fxRates, setFxRates] = useState<Record<string, number>>({ USD: 1 });
  const nativePurchases = isNativeStore();
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
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const activeTab = sectionProp ?? localSection;
  const setActiveTab = (s: ProfileSection) => {
    if (onSectionChange) onSectionChange(s);
    else setLocalSection(s);
  };
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const data = await userService.getProfile(u.uid);
          if (data) {
            setForm(profileToForm(data, u));
            setAnalysisAlerts(data.analysisAlerts !== false);
            setNotificationPreferences({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...data.notificationPreferences });
            setAutoMode(data.autoMode === true);
            setAutomaticGradeDetection(data.automaticGradeDetection === true);
            setAccountRole(data.accountRole === 'teacher' ? 'teacher' : data.accountRole === 'parent' || data.accountRole === 'supervisor' ? 'parent' : 'student');
          } else {
            setForm({
              ...EMPTY_FORM,
              name: u.displayName || '',
              email: u.email || '',
            });
          }
        } catch {
          setToastMessage('Your profile could not be loaded. Check your connection and try again.');
          setShowSavedToast(true);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    void subscriptionService.getStatus().then(setSubscription).catch(() => setSubscription(null));
    if (nativePurchases) void subscriptionService.getNativePrices().then(setNativePrices).catch(() => setNativePrices({}));
  }, [user, nativePurchases]);

  useEffect(() => {
    let cancelled = false;
    void loadUsdRates().then((rates) => {
      if (!cancelled) setFxRates(rates);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onCurrencyChange = (code: DisplayCurrency) => {
    setDisplayCurrency(code);
    storeCurrency(code);
  };

  const priceLabel = (planId: keyof typeof PLAN_CATALOG): string => {
    const usd = PLAN_CATALOG[planId].price;
    if (usd === 0) return formatMoney(0, displayCurrency, fxRates);
    if (nativePurchases && (planId === 'student' || planId === 'pro') && nativePrices[planId]) {
      return nativePrices[planId] as string;
    }
    return formatMoney(usd, displayCurrency, fxRates);
  };

  const updateAutoMode = async () => {
    if (!user || !subscription?.limits.autoMode) {
      setActiveTab('subscription');
      return;
    }
    const next = !autoMode;
    setAutomationError(null);
    setAutoMode(next);
    try {
      await automationService.update({ autoPrepare: next });
      await userService.setAutoMode(user.uid, next);
      if (next && notificationPermission !== 'granted') {
        const permission = await notificationService.requestPermission();
        setNotificationPermission(permission);
      }
    } catch {
      setAutoMode(!next);
      setAutomationError('Auto Mode could not be updated. Check your connection and try again.');
    }
  };

  const updateAutomaticGradeDetection = async () => {
    if (!user || !subscription?.limits.autoMode) {
      setActiveTab('subscription');
      return;
    }
    const next = !automaticGradeDetection;
    setAutomationError(null);
    setAutomaticGradeDetection(next);
    try {
      await automationService.update({ automaticGradeDetection: next });
      await userService.setAutomaticGradeDetection(user.uid, next);
    } catch {
      setAutomaticGradeDetection(!next);
      setAutomationError('Automatic grade detection could not be updated. Check your connection and try again.');
    }
  };

  const startPlan = async (plan: 'student' | 'pro') => {
    setBillingBusy(true);
    setBillingError(null);
    try { await subscriptionService.startCheckout(plan); }
    catch (error) { setBillingError(error instanceof Error ? error.message : 'Checkout is unavailable.'); }
    finally { setBillingBusy(false); }
  };

  const restorePlan = async () => {
    setBillingBusy(true);
    setBillingError(null);
    try {
      await subscriptionService.restorePurchases();
      setSubscription(await subscriptionService.getStatus());
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : 'Purchases could not be restored.');
    } finally { setBillingBusy(false); }
  };

  const handleAnalysisAlertsChange = async () => {
    if (!user || alertsSaving) return;
    const next = !analysisAlerts;
    if (next && notificationPermission !== 'granted') {
      const permission = await notificationService.requestPermission();
      setNotificationPermission(permission);
    }
    setAlertsSaving(true);
    setAnalysisAlerts(next);
    try {
      await automationService.update({ notifications: next });
      await userService.setAnalysisAlerts(user.uid, next);
    } catch (err) {
      setAnalysisAlerts(!next);
      setAutomationError('Notification settings could not be updated. Check your connection and try again.');
    } finally {
      setAlertsSaving(false);
    }
  };

  const sendTestNotification = () => {
    void notificationService.test();
  };

  const toggleNotificationCategory = async (key: keyof NotificationPreferences) => {
    if (!user || alertsSaving) return;
    const previous = notificationPreferences;
    const next = { ...previous, [key]: !previous[key] };
    setNotificationPreferences(next);
    setAlertsSaving(true);
    try {
      await userService.setNotificationPreferences(user.uid, next);
    } catch {
      setNotificationPreferences(previous);
      setToastMessage('Notification preference could not be saved');
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2600);
    } finally {
      setAlertsSaving(false);
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
    } catch {
      setToastMessage('Profile changes could not be saved');
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2600);
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
      {activeTab === 'you' ? (
        <>
          <header className="rg-page-heading pt-1">
            <p className="rg-page-kicker">Account</p>
            <h1>Your Regrade.</h1>
          </header>
          <section className="rg-account-summary">
            <img src={user.photoURL || DEFAULT_AVATAR_SRC} alt="" />
            <div className="min-w-0 flex-1">
              <h2>{form.name || 'Student'}</h2>
              <p>{form.email}</p>
              <span>{subscription ? PLAN_CATALOG[subscription.plan].name : 'Free'} plan</span>
            </div>
            <button type="button" onClick={() => setActiveTab('subscription')}>Manage plan</button>
          </section>
          <nav className="rg-settings-directory" aria-label="Profile sections">
            {([
              ['platform', 'Connections', 'Import graded work', ICONS.Library],
              ['ai', 'Notifications & automation', 'Mr Whale, alerts, and Auto Mode', ICONS.Bell],
              ['account', 'Learner codes', 'Pair a parent or teacher', ICONS.Lock],
              ['account', 'Settings & account', 'Privacy, family, help, and legal', ICONS.Shield],
            ] as const).map(([id, title, detail, Icon]) => (
              <button key={`${id}-${title}`} type="button" onClick={() => setActiveTab(id)}>
                <span><Icon /></span><span><strong>{title}</strong><small>{detail}</small></span><ICONS.ChevronRight />
              </button>
            ))}
          </nav>
        </>
      ) : (
        <header className="rg-profile-subheading">
          <button type="button" onClick={() => setActiveTab('you')} aria-label="Back to profile"><ICONS.ChevronLeft /></button>
          <h1>{SECTION_LABELS[activeTab]}</h1>
          <span aria-hidden />
        </header>
      )}

      <form onSubmit={(e) => void handleSave(e)} className="space-y-5">
        {/* Exit-gated swaps removed: mode="wait" hangs were observed live. */}
          {activeTab === 'you' && (
            <motion.div
              key="you"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-4"
            >
              <div className="rg-glass-card p-4">
                <p className="rg-meta-k text-primary">Account role</p>
                <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Account role">
                  {(['student', 'parent', 'teacher'] as AccountRole[]).map((role) => <button key={role} type="button" role="radio" aria-checked={accountRole === role} onClick={() => {
                    if (!user || role === accountRole) return;
                    const previous = accountRole;
                    setAccountRole(role);
                    void userService.syncProfile(user.uid, { accountRole: role }).then(() => window.dispatchEvent(new CustomEvent('regrade:role-changed', { detail: role }))).catch(() => setAccountRole(previous));
                  }} className={`rounded-xl border px-2 py-3 text-[12px] font-semibold capitalize ${accountRole === role ? 'border-primary bg-primary/8 text-primary' : 'border-hairline bg-canvas text-ink-muted'}`}>{role === 'parent' ? 'Parent' : role}</button>)}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">Parents and teachers can link multiple learners without signing into each learner account.</p>
              </div>
              <details className="rg3-profile-details" open={profileEditOpen} onToggle={(event) => setProfileEditOpen(event.currentTarget.open)}>
                <summary><span><ICONS.User /><span><strong>Edit profile details</strong><small>Name, institution, tone, and focus</small></span></span><ICONS.ChevronDown /></summary>
                <div className="space-y-4 pt-4">
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
                </div>
              </details>
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
              <div>
                <MarketingEyebrow>connections</MarketingEyebrow>
                <h2 className="rg-serif mt-2 text-xl font-semibold text-ink">Connect your school platforms.</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">Search for a platform, connect it securely, or manage an existing connection here in Profile.</p>
              </div>
              <ConnectScreen onManualUpload={onStartUpload ?? (() => undefined)} />

            </motion.div>
          )}

          {activeTab === 'subscription' && (
            <motion.div key="subscription" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="space-y-4">
              <div className="rg-glass-form-card p-4 sm:p-5">
                <label htmlFor="regrade-currency" className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Currency
                </label>
                <select
                  id="regrade-currency"
                  value={displayCurrency}
                  onChange={(event) => onCurrencyChange(event.target.value as DisplayCurrency)}
                  className="mt-2 w-full rounded-xl border border-hairline bg-parchment px-3 py-2.5 text-[14px] font-medium text-ink outline-none focus:border-primary/40"
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.region} · {option.label} ({option.code})
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[11px] text-ink-muted">
                  Plan prices convert from USD for display. Checkout still charges in the store or Stripe currency when you subscribe.
                </p>
              </div>

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
                    {subscription?.isIntroTrial
                      ? 'Plus trial'
                      : subscription
                        ? `${priceLabel(subscription.plan)}/month`
                        : `${formatMoney(0, displayCurrency, fxRates)}/month`}
                  </span>
                </div>
                {subscription?.isIntroTrial && subscription.trialEndsAt && (
                  <p className="text-[12px] text-ink-muted">
                    Your free Plus trial ends {new Date(subscription.trialEndsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}. No card required.
                  </p>
                )}
                {subscription?.status === 'trial_ended' && (
                  <p className="text-[12px] text-ink-muted">Your Plus trial has ended. Choose Plus or Pro to keep the higher limits.</p>
                )}
                {subscription && <div className="grid grid-cols-2 gap-3">
                  {[{ label: 'Exam reviews', used: subscription.usage.exams, limit: subscription.limits.exams }, { label: 'Mr. Whale messages', used: subscription.usage.messages, limit: subscription.limits.messages }].map((item) => <div key={item.label} className="rounded-xl border border-hairline bg-parchment p-3">
                    <p className="text-[11px] text-ink-muted">{item.label}</p><p className="mt-1 text-lg font-semibold text-ink">{item.used} <span className="text-[12px] font-normal text-ink-muted">of {item.limit}</span></p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/10"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (item.used / item.limit) * 100)}%` }} /></div>
                  </div>)}
                </div>}
                {subscription?.cancelAtPeriodEnd && <p className="text-[12px] text-amber-700">Your plan ends at the close of this billing period.</p>}
                {subscription?.hasBillingAccount && <button type="button" onClick={() => void subscriptionService.openPortal()} className="rg-btn-secondary w-full">Manage subscription</button>}
                {nativePurchases && <button type="button" disabled={billingBusy} onClick={() => void restorePlan()} className="rg-btn-ghost w-full">Restore Purchases</button>}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.entries(PLAN_CATALOG) as Array<[keyof typeof PLAN_CATALOG, (typeof PLAN_CATALOG)[keyof typeof PLAN_CATALOG]]>).map(([id, plan]) => <div key={id} className={`rg-glass-card p-4 space-y-3 ${subscription?.plan === id ? 'border-primary/40' : ''}`}>
                  <div>
                    <p className="text-[15px] font-semibold text-ink">{plan.name}</p>
                    <p className="text-xl font-semibold text-primary mt-1">
                      {priceLabel(id)}
                      <span className="text-[11px] font-normal text-ink-muted"> / month</span>
                    </p>
                  </div>
                  <ul className="space-y-1 text-[11px] text-ink-muted">
                    <li>{plan.exams} exam reviews</li>
                    <li>{plan.messages} Mr. Whale messages</li>
                    <li>{plan.autoMode ? 'Auto Mode included' : 'Manual reviews'}</li>
                    {id === 'student' && <li>2 months free when you start</li>}
                  </ul>
                  {id !== 'free' && subscription?.plan !== id && <button type="button" disabled={billingBusy} onClick={() => void startPlan(id)} className="rg-btn-primary w-full text-[12px]">Choose {plan.name}</button>}
                  {subscription?.plan === id && <span className="text-[11px] font-semibold text-primary">{subscription.isIntroTrial ? 'Current trial' : 'Current plan'}</span>}
                </div>)}
              </div>
              {billingError && <p className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-[12px] text-red-700">{billingError}</p>}
              <p className="text-[11px] text-ink-muted">New accounts get Plus free for 2 months. After that, payment renews monthly until cancelled. Usage resets at the displayed billing-period end. Paid access begins only after {nativePurchases ? 'the App Store verifies the purchase' : 'payment verification'}.</p>
              {nativePurchases && <p className="text-[11px] leading-relaxed text-ink-muted">Purchases are charged to your Apple or Google account. Manage or cancel in your store subscription settings. By subscribing, you agree to the <a href={APP_TERMS_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">Terms of Service</a> and <a href={APP_PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">Privacy Policy</a>.</p>}
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
                {automationError && <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3" role="alert"><p className="text-[12px] text-red-700">{automationError}</p><button type="button" onClick={() => setAutomationError(null)} className="text-[12px] font-semibold text-primary">Dismiss</button></div>}
                <div className="mb-3 w-full rounded-2xl rg-glass-chip p-4">
                  <div className="flex items-start justify-between gap-4"><span className="min-w-0"><span className="block text-[14px] font-semibold text-ink">Auto Mode</span><span className="block mt-1 text-[12px] leading-relaxed text-ink-muted">Full automatic analysis and appeal drafting needs the production evidence pipeline. Connected grade metadata will not be presented as a completed AI review.</span></span><span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-800">Needs setup</span></div>
                  {autoMode && <p className="mt-3 border-t border-hairline pt-3 text-[11px] leading-relaxed text-ink-muted">Your earlier preference is saved, but Regrade will not send or draft anything externally until the production pipeline is configured and tested.</p>}
                </div>
                <button type="button" role="switch" aria-checked={automaticGradeDetection} onClick={() => void updateAutomaticGradeDetection()} className="mb-3 w-full text-left flex items-start justify-between gap-4 rounded-2xl rg-glass-chip p-4">
                  <span className="min-w-0"><span className="block text-[14px] font-semibold text-ink">Automatic grade detection</span><span className="block mt-1 text-[12px] leading-relaxed text-ink-muted">Check connected platforms for newly graded exams. Only work graded in the last seven days is eligible for automatic import.</span></span>
                  <span className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${automaticGradeDetection && subscription?.limits.autoMode ? 'bg-primary' : 'bg-ink/20'}`} aria-hidden><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${automaticGradeDetection && subscription?.limits.autoMode ? 'translate-x-6' : 'translate-x-1'}`} /></span>
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
                <div className="mt-3 rounded-2xl border border-hairline bg-canvas px-4">
                  {NOTIFICATION_CATEGORIES.map((item, index) => (
                    <button
                      key={item.key}
                      type="button"
                      role="switch"
                      aria-checked={notificationPreferences[item.key]}
                      disabled={!analysisAlerts || alertsSaving}
                      onClick={() => void toggleNotificationCategory(item.key)}
                      className={`flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left disabled:opacity-45 ${index ? 'border-t border-hairline' : ''}`}
                    >
                      <span className="min-w-0"><span className="block text-[13px] font-semibold text-ink">{item.label}</span><span className="mt-0.5 block text-[11px] leading-relaxed text-ink-muted">{item.detail}</span></span>
                      <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${notificationPreferences[item.key] ? 'bg-primary' : 'bg-ink/20'}`} aria-hidden><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${notificationPreferences[item.key] ? 'translate-x-[18px]' : 'translate-x-0.5'}`} /></span>
                    </button>
                  ))}
                </div>
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
                  Built for students {APP_MIN_AGE}+ · Parent or teacher guidance recommended for younger students · v{APP_VERSION}
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
                  <a href={APP_DELETE_ACCOUNT_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-3 rounded-xl rg-glass-chip hover:border-primary/30 transition-all">
                    <span className="text-[14px] font-medium text-ink">Account deletion help</span>
                    <ICONS.ArrowRight className="w-4 h-4 text-muted" strokeWidth={1.75} />
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

              {accountRole === 'student' && <LearnerPairingPanel />}

              {/* Regrade-style account actions — not GitHub row layout */}
              <div className="rg-glass-card p-5 space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted">Settings & account</p>
                  <p className="text-[13px] text-muted leading-relaxed max-w-xs mx-auto">
                    Sign out on this device or permanently delete your data.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void secureSignOut()}
                  className="rg-btn-ghost w-full py-3 text-[14px]"
                >
                  Sign out
                </button>

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

        {securityError && (
          <p className="text-[12px] text-red-700 bg-red-50 border border-red-200/70 rounded-xl px-4 py-3">
            {securityError}
          </p>
        )}

        {activeTab === 'you' && profileEditOpen && (
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
