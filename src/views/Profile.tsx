import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'dompurify';
import { ICONS, DEFAULT_AVATAR_SRC } from '../constants';
import { auth, loginWithGoogle, signOut } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { userService, UserProfile } from '../services/userService';
import { scanContentForThreats } from '../lib/securityScanner';
import { getPlatformGuideName } from '../lib/profileContext';
import type { PlatformGuideId } from '../lib/platformUploadGuides';
import type { AiEngine } from '../types';
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
import AiEnginePicker from '../components/AiEnginePicker';
import PreferredPlatformPicker from '../components/PreferredPlatformPicker';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
import MarketingEyebrow from '../components/MarketingEyebrow';
import ThemePicker from '../components/ThemePicker';
import { useTheme } from '../context/ThemeContext';
import type { ThemePreference } from '../lib/theme';

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
  preferredPlatform: PlatformGuideId | null;
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

export type ProfileSection = 'you' | 'platform' | 'ai' | 'account';

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
  preferredPlatform: null,
};

const SECTION_LABELS: Record<ProfileSection, string> = {
  you: 'Appeal Profile',
  platform: 'Theme & app',
  ai: 'AI',
  account: 'Account',
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
    preferredPlatform: data.preferredPlatform ?? null,
  };
}

const Profile: React.FC<ProfileProps & { section?: ProfileSection; onSectionChange?: (s: ProfileSection) => void }> = ({
  onShowAbout,
  section: sectionProp,
  onSectionChange,
}) => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [aiEngine, setAiEngine] = useState<AiEngine | null>(null);
  const [aiSaving, setAiSaving] = useState(false);
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
            setAiEngine((data.aiEngine as AiEngine | undefined) ?? null);
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

  const handleAiEngineChange = async (next: AiEngine) => {
    if (!user || next === aiEngine || aiSaving) return;
    setAiSaving(true);
    setAiEngine(next);
    try {
      await userService.setAiPreference(user.uid, next);
    } catch (err) {
      console.error('Failed to save AI engine preference:', err);
    } finally {
      setAiSaving(false);
    }
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
      preferredPlatform: form.preferredPlatform ?? undefined,
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
      setAiEngine(null);
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

  const platformLabel = getPlatformGuideName(form.preferredPlatform ?? undefined);

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
    Boolean(form.preferredPlatform),
    Boolean(aiEngine),
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
            {platformLabel && (
              <span className="rg-glass-chip px-3 py-1.5 text-[11px] font-semibold text-primary">
                {platformLabel}
              </span>
            )}
            {aiEngine && (
              <span className="rg-glass-chip px-3 py-1.5 text-[11px] font-medium text-violet-700 capitalize">
                {aiEngine} reader
              </span>
            )}
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
                    Your appeal profile is{' '}
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
              <ThemePicker
                value={themePreference}
                onChange={(next) => void handleThemeChange(next)}
                disabled={themeSaving}
              />

              <div className="border-t border-hairline pt-5 space-y-4">
                <p className="text-[13px] text-ink-muted leading-relaxed">
                  Your default grading app — new appeals start with the right export steps for that platform.
                </p>
                <PreferredPlatformPicker
                  value={form.preferredPlatform}
                  onChange={(id) => setForm({ ...form, preferredPlatform: id })}
                />
              </div>
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
              <AiEnginePicker
                value={aiEngine}
                onChange={(e) => void handleAiEngineChange(e)}
                disabled={aiSaving}
              />
              {!aiEngine && (
                <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/70 rounded-xl px-3 py-2.5">
                  Pick a reader before your first analyze — consent is asked once on Appeal.
                </p>
              )}
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
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted">Account</p>
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

        {activeTab !== 'ai' && activeTab !== 'account' && (
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
