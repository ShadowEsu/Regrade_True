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
   * can show the actual graded copy back to them. Uploaded pages land in
   * Firebase Storage and only URLs appear here in `pageImageUrls`.
   */
  pageImages?: { mimeType: string; data: string }[];
  pageImageUrls?: string[];
}

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

export const caseService = {
  async createCase(caseData: Omit<Case, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    if (!auth.currentUser) throw new Error('User must be authenticated to create a case.');

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
    const docRef = doc(db, 'cases', id);
    try {
      const { documentStorageService } = await import('./documentStorageService');
      const { annotationService } = await import('./annotationService');
      const annotations = await annotationService.list(id);
      await Promise.all(annotations.map((annotation) => annotationService.remove(id, annotation.id)));
      await documentStorageService.deleteCasePages(id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `cases/${id}`);
      throw error;
    }
  },

  async deleteAllUserCases(uid: string) {
    const q = query(collection(db, 'cases'), where('userId', '==', uid));
    try {
      const snap = await getDocs(q);
      const { annotationService } = await import('./annotationService');
      await Promise.all(snap.docs.map(async (caseDoc) => {
        const annotations = await annotationService.list(caseDoc.id);
        await Promise.all(annotations.map((annotation) => annotationService.remove(caseDoc.id, annotation.id)));
        await deleteDoc(caseDoc.ref);
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'cases');
      throw error;
    }
  },

  async updateCase(id: string, updates: Partial<Case>) {
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
