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
import type { AiEngine } from '../types';

export interface UserProfile {
  name: string;
  email: string;
  /** Legacy field; no longer collected in the app. */
  studentId?: string;
  major: string;
  avatarUrl?: string;
  /** User-chosen AI engine for the analyze pipeline. Absent = never set. */
  aiEngine?: AiEngine;
  /** Server timestamp of the first time the user accepted the AI consent prompt. */
  aiConsentAt?: Timestamp;
}

const previewProfile: UserProfile = {
  name: 'Preview Student',
  email: 'preview@regrade.app',
  major: 'Undeclared',
  avatarUrl: '',
  aiEngine: 'hybrid',
};

export const userService = {
  async syncProfile(uid: string, profile: Partial<UserProfile>) {
    if (isPreviewMode()) {
      if (uid === PREVIEW_USER_UID) {
        Object.assign(previewProfile, {
          name: profile.name ?? previewProfile.name,
          email: profile.email ?? previewProfile.email,
          avatarUrl: profile.avatarUrl ?? previewProfile.avatarUrl,
        });
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

        if (profile.name !== undefined) updates.name = profile.name;
        if (profile.email !== undefined) updates.email = profile.email;
        if (profile.major !== undefined) updates.major = profile.major;
        if (profile.avatarUrl !== undefined) updates.avatarUrl = profile.avatarUrl;

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
