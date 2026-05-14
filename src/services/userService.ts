import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface UserProfile {
  name: string;
  email: string;
  /** Legacy field; no longer collected in the app. */
  studentId?: string;
  major: string;
  avatarUrl?: string;
}

export const userService = {
  async syncProfile(uid: string, profile: Partial<UserProfile>) {
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
    const docRef = doc(db, 'users', uid);
    try {
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? snapshot.data() as UserProfile : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      throw error;
    }
  }
};
