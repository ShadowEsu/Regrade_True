import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { isPreviewMode } from '../lib/previewMode';

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

const previewKey = (caseId: string) => `regrade.preview.annotations.${caseId}`;

function previewRead(caseId: string): ExamAnnotation[] {
  try { return JSON.parse(localStorage.getItem(previewKey(caseId)) ?? '[]') as ExamAnnotation[]; }
  catch { return []; }
}

function previewWrite(caseId: string, annotations: ExamAnnotation[]) {
  localStorage.setItem(previewKey(caseId), JSON.stringify(annotations));
}

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to save annotations.');
  return user;
}

export const annotationService = {
  async list(caseId: string): Promise<ExamAnnotation[]> {
    const user = requireUser();
    if (isPreviewMode()) return previewRead(caseId).filter((item) => item.userId === user.uid);
    const snapshot = await getDocs(collection(db, 'cases', caseId, 'annotations'));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ExamAnnotation)).filter((item) => item.userId === user.uid);
  },
  async save(input: Omit<ExamAnnotation, 'userId' | 'createdAt' | 'updatedAt'>): Promise<ExamAnnotation> {
    const user = requireUser();
    const annotation: ExamAnnotation = { ...input, userId: user.uid };
    if (isPreviewMode()) {
      const next = [...previewRead(input.caseId).filter((item) => item.id !== input.id), annotation];
      previewWrite(input.caseId, next);
      return annotation;
    }
    await setDoc(doc(db, 'cases', input.caseId, 'annotations', input.id), { ...annotation, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
    return annotation;
  },
  async remove(caseId: string, annotationId: string): Promise<void> {
    requireUser();
    if (isPreviewMode()) { previewWrite(caseId, previewRead(caseId).filter((item) => item.id !== annotationId)); return; }
    await deleteDoc(doc(db, 'cases', caseId, 'annotations', annotationId));
  },
};
