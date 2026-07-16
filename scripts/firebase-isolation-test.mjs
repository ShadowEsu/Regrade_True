import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const projectId = process.env.GCLOUD_PROJECT || 'demo-regrade-isolation';
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function client(label) {
  const app = initializeApp({ apiKey: 'demo-key', authDomain: 'localhost', projectId }, `isolation-${label}-${suffix}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  return { app, auth, db };
}

async function expectDenied(operation, label) {
  try {
    await operation();
    assert.fail(`${label} unexpectedly succeeded.`);
  } catch (error) {
    assert.match(String(error?.code ?? error), /permission-denied|PERMISSION_DENIED/, label);
  }
}

const a = client('a');
const b = client('b');
try {
  const [userA, userB] = await Promise.all([
    createUserWithEmailAndPassword(a.auth, `a-${suffix}@example.test`, 'Safe-Test-Password-1!'),
    createUserWithEmailAndPassword(b.auth, `b-${suffix}@example.test`, 'Safe-Test-Password-1!'),
  ]);
  const aUid = userA.user.uid;
  const bUid = userB.user.uid;
  const profileA = doc(a.db, 'users', aUid);
  await setDoc(profileA, {
    name: 'Disposable A',
    email: userA.user.email,
    accountRole: 'student',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const caseId = `case-${suffix}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const caseA = doc(a.db, 'cases', caseId);
  await setDoc(caseA, {
    title: 'Isolation exam',
    ref: 'ISO-1',
    status: 'Under Review',
    progress: 0,
    evidenceLogged: false,
    facultyReview: false,
    userId: aUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(a.db, 'cases', caseId, 'annotations', 'annotation-a'), {
    id: 'annotation-a',
    caseId,
    userId: aUid,
    pageIndex: 0,
    kind: 'highlight',
    color: 'yellow',
    x: 0.1,
    y: 0.1,
    width: 0.2,
    height: 0.05,
    path: [],
    text: '',
    rotation: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  assert.equal((await getDoc(profileA)).exists(), true, 'A should read A profile.');
  assert.equal((await getDoc(caseA)).exists(), true, 'A should read A case.');
  await expectDenied(() => getDoc(doc(b.db, 'users', aUid)), 'B must not read A profile');
  await expectDenied(() => updateDoc(doc(b.db, 'users', aUid), { name: 'Intrusion', updatedAt: serverTimestamp() }), 'B must not update A profile');
  await expectDenied(() => getDoc(doc(b.db, 'cases', caseId)), 'B must not read A case');
  await expectDenied(() => getDoc(doc(b.db, 'cases', caseId, 'annotations', 'annotation-a')), 'B must not read A annotation');

  const visibleToB = await getDocs(query(collection(b.db, 'cases'), where('userId', '==', bUid)));
  assert.equal(visibleToB.size, 0, 'B case query must not leak A records.');
  console.log('Firebase two-user profile, case, list, and annotation isolation passed.');
} finally {
  await Promise.all([deleteApp(a.app), deleteApp(b.app)]);
}
