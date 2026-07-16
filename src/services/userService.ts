import { apiFetch } from '../lib/api';
import { doc, getDoc, type Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { clearPendingTutorialComplete } from '../lib/tutorialCompletion';
import type { PlatformGuideId } from '../lib/platformUploadGuides';
import type { ThemePreference } from '../lib/theme';

export interface UserProfile {
  name: string;
  email: string;
  /** Determines student learning tools versus consent-first supervisor tools. */
  accountRole?: AccountRole | 'supervisor';
  /** Legacy field; no longer collected in the app. */
  studentId?: string;
  major: string;
  school?: string;
  university?: string;
  /** e.g. Sophomore, Year 11 */
  gradeLevel?: string;
  /** e.g. 3.8 or A- */
  gpa?: string;
  /** Extra instructions for drafts — free text the student writes. */
  appealGoal?: string;
  /** How Regrade should sound — chip ids like 'polite', 'confident'. */
  appealTone?: string[];
  /** What Regrade should prioritize — chip ids like 'rubric_mismatch'. */
  appealFocus?: string[];
  /** Default LMS — pre-selects platform guide on new appeals */
  preferredPlatform?: PlatformGuideId;
  avatarUrl?: string;
  /** Legacy field from earlier releases; ignored by Mr. Whale. */
  aiEngine?: 'hybrid' | 'gemini' | 'claude';
  /** Server timestamp of the first time the user accepted the AI consent prompt. */
  aiConsentAt?: Timestamp;
  /** Light / dark / system appearance preference */
  theme?: ThemePreference;
  /** First-run survey is complete; controls whether the welcome setup appears. */
  onboardingComplete?: boolean;
  /** Mandatory first-use product walkthrough completed after the welcome survey. */
  tutorialComplete?: boolean;
  /** Show an in-app recovery alert when analysis finds actionable points. */
  analysisAlerts?: boolean;
  notificationPreferences?: NotificationPreferences;
  /** Paid-plan automation preference. Server entitlements still decide whether it may run. */
  autoMode?: boolean;
  /** Poll connected gradebooks for newly graded work. Paid entitlement is enforced server-side. */
  automaticGradeDetection?: boolean;
  /** Study-pattern checklist items the student has reviewed before a final. */
  studyChecklist?: string[];
}

export type AccountRole = 'student' | 'parent' | 'teacher';

export type NotificationPreferences = {
  imports: boolean;
  analysisComplete: boolean;
  possibleIssue: boolean;
  appealReady: boolean;
  parent: boolean;
  weeklySummary: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  imports: true,
  analysisComplete: true,
  possibleIssue: true,
  appealReady: true,
  parent: true,
  weeklySummary: false,
};

async function profileRequest<T>(path: string, method: 'POST' | 'PATCH', body: Record<string, unknown>): Promise<T> {
  const response = await apiFetch(`/v1/profile${path}`, {
    method,
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null) as (T & { error?: { message?: string } }) | null;
  if (!response.ok) throw new Error(data?.error?.message ?? 'Could not save your changes.');
  return data as T;
}

export const userService = {
  /**
   * `passive: true` is for boot-time sync (AuthGate): it fills identity
   * fields only when they are missing and never overwrites what the user
   * chose during onboarding or in Profile.
   */
  async syncProfile(uid: string, profile: Partial<UserProfile>, options?: { passive?: boolean }) {
    // The authenticated token determines ownership server-side. Keep uid in
    // the public signature so existing callers remain stable, but never send it.
    if (options?.passive) {
      return profileRequest('/sync', 'POST', {
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        passive: true,
      });
    }
    const { email: _email, aiConsentAt: _consent, onboardingComplete: _onboarding, tutorialComplete: _tutorial, ...safe } = profile;
    void uid; void _email; void _consent; void _onboarding; void _tutorial;
    return profileRequest('/settings', 'PATCH', safe as Record<string, unknown>);
  },

  async getProfile(uid: string) {
    const docRef = doc(db, 'users', uid);
    try {
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      throw error;
    }
  },

  /**
   * Persist the user's chosen AI engine. Records the consent timestamp on
   * the first call (when aiConsentAt is missing) so we can prove the
   * App Store "explicit consent before sending to third-party AI" gate
   * was satisfied.
   */
  async setThemePreference(uid: string, theme: ThemePreference) {
    void uid;
    return profileRequest<{ theme: ThemePreference }>('/settings', 'PATCH', { theme });
  },

  /** Records one-time consent without exposing model/provider choices in the UI. */
  async acceptAiConsent(uid: string) {
    void uid;
    return profileRequest<{ aiConsentAt: true }>('/ai-consent', 'POST', {});
  },

  async completeOnboarding(uid: string, profile: Pick<UserProfile, 'name' | 'school'> & { accountRole?: AccountRole }) {
    const response = await apiFetch('/v1/profile/onboarding', {
      method: 'POST',
      body: JSON.stringify({
        name: profile.name,
        school: profile.school ?? '',
        accountRole: profile.accountRole ?? 'student',
        complete: true,
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      throw new Error(data?.error?.message ?? 'Could not finish setup.');
    }
  },

  async saveOnboardingDetails(
    uid: string,
    profile: Pick<UserProfile, 'name' | 'school'> & { accountRole: AccountRole },
  ) {
    const response = await apiFetch('/v1/profile/onboarding', {
      method: 'POST',
      body: JSON.stringify({
        name: profile.name,
        school: profile.school ?? '',
        accountRole: profile.accountRole,
        complete: false,
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      throw new Error(data?.error?.message ?? 'Could not save your school details.');
    }
    return response.json();
  },

  /** Saves completion only after every required first-use walkthrough step is viewed. */
  async completeTutorial(uid: string) {
    const response = await apiFetch('/v1/profile/tutorial-complete', { method: 'POST', body: '{}' });
    if (!response.ok) {
      const data = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      throw new Error(data?.error?.message ?? 'Could not finish the walkthrough.');
    }
    clearPendingTutorialComplete(uid);
    return { tutorialComplete: true as const };
  },

  async setAnalysisAlerts(uid: string, analysisAlerts: boolean) {
    void uid;
    return profileRequest<{ analysisAlerts: boolean }>('/settings', 'PATCH', { analysisAlerts });
  },

  async setNotificationPreferences(uid: string, notificationPreferences: NotificationPreferences) {
    void uid;
    return profileRequest<{ notificationPreferences: NotificationPreferences }>('/settings', 'PATCH', { notificationPreferences });
  },

  async setAutoMode(uid: string, autoMode: boolean) {
    void uid;
    return profileRequest<{ autoMode: boolean }>('/settings', 'PATCH', { autoMode });
  },

  async setAutomaticGradeDetection(uid: string, automaticGradeDetection: boolean) {
    void uid;
    return profileRequest<{ automaticGradeDetection: boolean }>('/settings', 'PATCH', { automaticGradeDetection });
  },

  async setStudyChecklist(uid: string, studyChecklist: string[]) {
    const safeList = [...new Set(studyChecklist)].slice(0, 12);
    void uid;
    return profileRequest<{ studyChecklist: string[] }>('/settings', 'PATCH', { studyChecklist: safeList });
  },
};
