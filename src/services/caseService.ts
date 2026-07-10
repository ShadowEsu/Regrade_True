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
  draftEmail?: string;
  rawInput?: {
    assignment: string;
    rubric: string;
    feedback: string;
  };
  /**
   * The pages of the student's paper (photos or rendered PDF pages), so History
   * can show the actual graded copy back to them. Stored inline in preview mode
   * (localStorage). Real-mode uploads land in Firebase Storage and only URLs
   * appear here in `pageImageUrls`; that path arrives with the storage rules.
   */
  pageImages?: { mimeType: string; data: string }[];
  pageImageUrls?: string[];
}

const previewCaseStore = new Map<string, Case>();
const PREVIEW_CASES_STORAGE_KEY = 'regrade_preview_cases_v1';

function caseTimestampMs(raw: Case['createdAt']): number {
  if (!raw) return 0;
  if (typeof raw?.toDate === 'function') return raw.toDate().getTime();
  if (raw instanceof Date) return raw.getTime();
  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortCasesNewestFirst(cases: Case[]): Case[] {
  return [...cases].sort((a, b) => caseTimestampMs(b.createdAt) - caseTimestampMs(a.createdAt));
}

function loadPreviewCaseStore(): Map<string, Case> {
  if (typeof window === 'undefined') return new Map();
  try {
    const raw = localStorage.getItem(PREVIEW_CASES_STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Case[];
    const map = new Map<string, Case>();
    for (const c of parsed) {
      if (c.id) map.set(c.id, c);
    }
    return map;
  } catch {
    return new Map();
  }
}

function persistPreviewCaseStore() {
  if (typeof window === 'undefined') return;
  try {
    const payload = [...previewCaseStore.values()];
    localStorage.setItem(PREVIEW_CASES_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage full or unavailable — in-memory still works this session
  }
}

if (isPreviewMode()) {
  for (const [id, c] of loadPreviewCaseStore()) {
    previewCaseStore.set(id, c);
  }
}

/** Demo verdict only — not listed in History/Appeals for new preview users. */
function ensurePreviewSampleCase(): Case {
  const existing = previewCaseStore.get(PREVIEW_CASE_ID);
  if (existing) return existing;
  const seed = buildPreviewSeedCase();
  previewCaseStore.set(PREVIEW_CASE_ID, seed);
  return seed;
}

function listPreviewUserCases(): Case[] {
  return sortCasesNewestFirst(
    [...previewCaseStore.values()].filter((c) => c.id !== PREVIEW_CASE_ID),
  );
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
      persistPreviewCaseStore();
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

    const q = query(collection(db, 'cases'), where('userId', '==', auth.currentUser.uid));

    try {
      const snapshot = await getDocs(q);
      return sortCasesNewestFirst(
        snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Case)),
      );
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
      persistPreviewCaseStore();
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
      persistPreviewCaseStore();
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
      persistPreviewCaseStore();
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
