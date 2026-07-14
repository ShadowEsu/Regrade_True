import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type AnnotationKind = 'highlight' | 'draw' | 'text';
export type AnnotationColor = 'blue' | 'yellow' | 'green' | 'red';

export interface ExamAnnotation {
  id: string;
  caseId: string;
  userId: string;
  pageIndex: number;
  kind: AnnotationKind;
  color: AnnotationColor;
  x: number;
  y: number;
  width: number;
  height: number;
  path: number[];
  text: string;
  rotation: 0 | 90 | 180 | 270;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to save annotations.');
  return user;
}

export const annotationService = {
  async list(caseId: string): Promise<ExamAnnotation[]> {
    const user = requireUser();
    const snapshot = await getDocs(collection(db, 'cases', caseId, 'annotations'));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ExamAnnotation)).filter((item) => item.userId === user.uid);
  },
  async save(input: Omit<ExamAnnotation, 'userId' | 'createdAt' | 'updatedAt'>): Promise<ExamAnnotation> {
    const user = requireUser();
    const annotation: ExamAnnotation = { ...input, userId: user.uid };
    await setDoc(doc(db, 'cases', input.caseId, 'annotations', input.id), { ...annotation, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
    return annotation;
  },
  async remove(caseId: string, annotationId: string): Promise<void> {
    requireUser();
    await deleteDoc(doc(db, 'cases', caseId, 'annotations', annotationId));
  },
};
