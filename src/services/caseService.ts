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
  Timestamp,
  serverTimestamp
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
  rawInput?: {
    assignment: string;
    rubric: string;
    feedback: string;
  };
}

export const caseService = {
  async createCase(caseData: Omit<Case, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    if (!auth.currentUser) throw new Error("User must be authenticated to create a case.");
    
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
    if (!auth.currentUser) throw new Error("User must be authenticated to fetch cases.");
    
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
