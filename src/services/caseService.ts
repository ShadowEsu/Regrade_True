import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { isPreviewMode } from '../lib/previewMode';
import { buildPreviewSeedCase, PREVIEW_CASE_ID } from '../lib/previewFixtures';

import { AnalysisResult } from '../types';

export interface Case {
  id?: string;
  title: string;
  description: string;
  ref: string;
  status: 'Under Review' | 'Resolved' | 'Draft Ready';
  progress: number;
  evidenceLogged: boolean;
  facultyReview: boolean;
  userId: string;
  createdAt: any;
  updatedAt: any;
  analysis?: AnalysisResult;
  rawInput?: {
    assignment: string;
    rubric: string;
    feedback: string;
  };
}

const previewCaseStore = new Map<string, Case>();

/** Demo verdict only — not listed in History/Appeals for new preview users. */
function ensurePreviewSampleCase(): Case {
  const existing = previewCaseStore.get(PREVIEW_CASE_ID);
  if (existing) return existing;
  const seed = buildPreviewSeedCase();
  previewCaseStore.set(PREVIEW_CASE_ID, seed);
  return seed;
}

function listPreviewUserCases(): Case[] {
  return [...previewCaseStore.values()]
    .filter((c) => c.id !== PREVIEW_CASE_ID)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const caseService = {
  async createCase(caseData: Omit<Case, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    if (!auth.currentUser) throw new Error('User must be authenticated to create a case.');

    if (isPreviewMode()) {
      const id = `preview-${Date.now()}`;
      const now = new Date();
      const saved: Case = {
        ...caseData,
        id,
        userId: auth.currentUser.uid,
        createdAt: now,
        updatedAt: now,
      };
      previewCaseStore.set(id, saved);
      return saved;
    }

    const newCase = {
      ...caseData,
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, 'cases'), newCase);
      return { id: docRef.id, ...newCase };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'cases');
      throw error;
    }
  },

  async getUserCases() {
    if (!auth.currentUser) throw new Error('User must be authenticated to fetch cases.');

    if (isPreviewMode()) {
      return listPreviewUserCases();
    }

    const q = query(
      collection(db, 'cases'), 
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'cases');
      throw error;
    }
  },

  async getCaseById(id: string) {
    if (isPreviewMode()) {
      if (id === PREVIEW_CASE_ID) {
        return ensurePreviewSampleCase();
      }
      return previewCaseStore.get(id) ?? null;
    }

    const docRef = doc(db, 'cases', id);
    try {
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as Case;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `cases/${id}`);
      throw error;
    }
  },

  async deleteCase(id: string) {
    if (isPreviewMode()) {
      previewCaseStore.delete(id);
      return;
    }

    const docRef = doc(db, 'cases', id);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `cases/${id}`);
      throw error;
    }
  },

  async deleteAllUserCases(uid: string) {
    if (isPreviewMode()) {
      for (const key of [...previewCaseStore.keys()]) {
        const c = previewCaseStore.get(key);
        if (c?.userId === uid && key !== PREVIEW_CASE_ID) {
          previewCaseStore.delete(key);
        }
      }
      return;
    }

    const q = query(collection(db, 'cases'), where('userId', '==', uid));
    try {
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'cases');
      throw error;
    }
  },

  async updateCase(id: string, updates: Partial<Case>) {
    if (isPreviewMode()) {
      const existing = previewCaseStore.get(id);
      if (!existing) return;
      previewCaseStore.set(id, { ...existing, ...updates, updatedAt: new Date() });
      return;
    }

    const docRef = doc(db, 'cases', id);
    try {
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cases/${id}`);
      throw error;
    }
  }
};
