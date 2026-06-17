import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { isPreviewMode } from '../lib/previewMode';
import { PREVIEW_USER_UID } from '../lib/previewFixtures';
import type { PlatformGuideId } from '../lib/platformUploadGuides';
import type { AiEngine } from '../types';
import type { ThemePreference } from '../lib/theme';

export interface UserProfile {
  name: string;
  email: string;
  /** Legacy field; no longer collected in the app. */
  studentId?: string;
  major: string;
  school?: string;
  university?: string;
  /** e.g. Sophomore, Year 11 */
  gradeLevel?: string;
  /** e.g. 3.8 or A- */
  gpa?: string;
  /** What the student wants from appeals — tone, outcomes, etc. */
  appealGoal?: string;
  /** Default LMS — pre-selects platform guide on new appeals */
  preferredPlatform?: PlatformGuideId;
  avatarUrl?: string;
  /** User-chosen AI engine for the analyze pipeline. Absent = never set. */
  aiEngine?: AiEngine;
  /** Server timestamp of the first time the user accepted the AI consent prompt. */
  aiConsentAt?: Timestamp;
  /** Light / dark / system appearance preference */
  theme?: ThemePreference;
}

/** Fresh preview user — empty until they fill Profile or start an appeal. */
const previewProfile: UserProfile = {
  name: '',
  email: 'preview@regrade.app',
  major: '',
  school: '',
  university: '',
  gradeLevel: '',
  gpa: '',
  appealGoal: '',
  avatarUrl: '',
};

export const userService = {
  async syncProfile(uid: string, profile: Partial<UserProfile>) {
    if (isPreviewMode()) {
      if (uid === PREVIEW_USER_UID) {
        Object.assign(previewProfile, profile);
      }
      return previewProfile;
    }

    const docRef = doc(db, 'users', uid);
    try {
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        const newProfile = {
          name: profile.name || 'Anonymous Student',
          email: profile.email || '',
          major: profile.major ?? 'Undeclared',
          school: profile.school ?? '',
          university: profile.university ?? '',
          gradeLevel: profile.gradeLevel ?? '',
          gpa: profile.gpa ?? '',
          appealGoal: profile.appealGoal ?? '',
          preferredPlatform: profile.preferredPlatform,
          avatarUrl: profile.avatarUrl || '',
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
    if (isPreviewMode()) {
      return uid === PREVIEW_USER_UID ? previewProfile : null;
    }

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
  /** Preview-only: wipe profile to simulate account deletion. */
  resetPreviewProfile(uid: string) {
    if (!isPreviewMode() || uid !== PREVIEW_USER_UID) return;
    Object.assign(previewProfile, {
      name: '',
      email: 'preview@regrade.app',
      major: '',
      school: '',
      university: '',
      gradeLevel: '',
      gpa: '',
      appealGoal: '',
      avatarUrl: '',
    });
    delete previewProfile.preferredPlatform;
    delete previewProfile.aiEngine;
    delete previewProfile.aiConsentAt;
    delete previewProfile.theme;
  },

  async setThemePreference(uid: string, theme: ThemePreference) {
    if (isPreviewMode()) {
      if (uid === PREVIEW_USER_UID) {
        previewProfile.theme = theme;
      }
      return previewProfile;
    }

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

  async setAiPreference(uid: string, aiEngine: AiEngine) {
    if (isPreviewMode()) {
      if (uid === PREVIEW_USER_UID) {
        previewProfile.aiEngine = aiEngine;
      }
      return previewProfile;
    }

    const docRef = doc(db, 'users', uid);
    try {
      const snapshot = await getDoc(docRef);
      const existing = snapshot.exists()
        ? (snapshot.data() as Partial<UserProfile> & { aiConsentAt?: Timestamp })
        : null;

      const updates: Record<string, unknown> = {
        aiEngine,
        updatedAt: serverTimestamp(),
      };
      if (!existing?.aiConsentAt) {
        updates.aiConsentAt = serverTimestamp();
      }
      await setDoc(docRef, updates, { merge: true });
      return { ...existing, ...updates };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
      throw error;
    }
  },
};
