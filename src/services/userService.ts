import { apiFetch } from '../lib/api';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
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

export const userService = {
  async syncProfile(uid: string, profile: Partial<UserProfile>) {
    const docRef = doc(db, 'users', uid);
    try {
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        const newProfile = {
          name: profile.name?.trim() || 'Student',
          email: profile.email || '',
          major: profile.major ?? 'Undeclared',
          school: profile.school ?? '',
          university: profile.university ?? '',
          gradeLevel: profile.gradeLevel ?? '',
          gpa: profile.gpa ?? '',
          appealGoal: profile.appealGoal ?? '',
          preferredPlatform: profile.preferredPlatform,
          avatarUrl: profile.avatarUrl || '',
          analysisAlerts: profile.analysisAlerts ?? true,
          notificationPreferences: profile.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES,
          accountRole: profile.accountRole === 'teacher'
            ? 'teacher'
            : profile.accountRole === 'parent' || profile.accountRole === 'supervisor'
              ? 'parent'
              : 'student',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(docRef, newProfile);
        return newProfile;
      } else {
        const updates: Record<string, unknown> = {
          updatedAt: serverTimestamp(),
        };

        const fields = [
          'name',
          'email',
          'major',
          'school',
          'university',
          'gradeLevel',
          'gpa',
          'appealGoal',
          'preferredPlatform',
          'avatarUrl',
          'theme',
          'onboardingComplete',
          'tutorialComplete',
          'analysisAlerts',
          'notificationPreferences',
          'autoMode',
          'automaticGradeDetection',
          'studyChecklist',
          'accountRole',
        ] as const;
        for (const key of fields) {
          if (profile[key] !== undefined) updates[key] = profile[key];
        }

        await setDoc(docRef, updates, { merge: true });
        const existing = snapshot.data() as Record<string, unknown>;
        return { ...existing, ...updates };
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
      throw error;
    }
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
    const docRef = doc(db, 'users', uid);
    try {
      await setDoc(
        docRef,
        { theme, updatedAt: serverTimestamp() },
        { merge: true },
      );
      return { theme };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
      throw error;
    }
  },

  /** Records one-time consent without exposing model/provider choices in the UI. */
  async acceptAiConsent(uid: string) {
    const docRef = doc(db, 'users', uid);
    try {
      await setDoc(docRef, { aiConsentAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
      return { aiConsentAt: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
      throw error;
    }
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
    return { tutorialComplete: true as const };
  },

  async setAnalysisAlerts(uid: string, analysisAlerts: boolean) {
    const docRef = doc(db, 'users', uid);
    try {
      await setDoc(docRef, { analysisAlerts, updatedAt: serverTimestamp() }, { merge: true });
      return { analysisAlerts };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
      throw error;
    }
  },

  async setNotificationPreferences(uid: string, notificationPreferences: NotificationPreferences) {
    const docRef = doc(db, 'users', uid);
    try {
      await setDoc(docRef, { notificationPreferences, updatedAt: serverTimestamp() }, { merge: true });
      return { notificationPreferences };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
      throw error;
    }
  },

  async setAutoMode(uid: string, autoMode: boolean) {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, { autoMode, updatedAt: serverTimestamp() }, { merge: true });
    return { autoMode };
  },

  async setAutomaticGradeDetection(uid: string, automaticGradeDetection: boolean) {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, { automaticGradeDetection, updatedAt: serverTimestamp() }, { merge: true });
    return { automaticGradeDetection };
  },

  async setStudyChecklist(uid: string, studyChecklist: string[]) {
    const safeList = [...new Set(studyChecklist)].slice(0, 12);
    const docRef = doc(db, 'users', uid);
    try {
      await setDoc(docRef, { studyChecklist: safeList, updatedAt: serverTimestamp() }, { merge: true });
      return { studyChecklist: safeList };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
      throw error;
    }
  },
};
