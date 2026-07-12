import { Capacitor } from '@capacitor/core';
import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { isPreviewMode } from '../lib/previewMode';
import { userService } from './userService';

export type NotificationType = 'import' | 'review' | 'appeal' | 'parent' | 'subscription' | 'system';
export interface RegradeNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string;
  groupKey: string;
  caseId?: string | null;
  createdAt?: unknown;
  readAt?: unknown;
  archivedAt?: unknown;
}

const previewKey = 'regrade.preview.notifications.v1';
const notificationId = () => Math.floor(Date.now() / 1000) % 2_000_000_000;
const stableId = (value: string) => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  return `notice-${Math.abs(hash >>> 0).toString(36)}`;
};

function previewRead(): RegradeNotification[] {
  try { return JSON.parse(localStorage.getItem(previewKey) ?? '[]') as RegradeNotification[]; }
  catch { return []; }
}
function previewWrite(items: RegradeNotification[]) { localStorage.setItem(previewKey, JSON.stringify(items)); }
function timestampMs(raw: unknown) {
  if (raw && typeof (raw as { toDate?: () => Date }).toDate === 'function') return (raw as { toDate: () => Date }).toDate().getTime();
  const value = new Date(String(raw ?? 0)).getTime();
  return Number.isFinite(value) ? value : 0;
}

async function deliver(title: string, body: string, tag: string, url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    if ((await LocalNotifications.checkPermissions()).display !== 'granted') return;
    await LocalNotifications.schedule({ notifications: [{ id: notificationId(), title, body, extra: { url } }] });
    return;
  }
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const notification = new Notification(title, { body, icon: '/favicon.png', tag, data: { url } });
  notification.onclick = () => { window.focus(); window.location.assign(url); };
}

async function record(input: Omit<RegradeNotification, 'id' | 'userId' | 'createdAt'>): Promise<RegradeNotification | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const id = stableId(`${user.uid}:${input.groupKey}`);
  const notice: RegradeNotification = { ...input, id, userId: user.uid, createdAt: new Date().toISOString(), readAt: null, archivedAt: null };
  if (isPreviewMode()) { previewWrite([notice, ...previewRead().filter((item) => item.id !== id)].slice(0, 100)); return notice; }
  await setDoc(doc(db, 'notifications', id), { ...notice, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
  return notice;
}

async function recordAndDeliver(input: Omit<RegradeNotification, 'id' | 'userId' | 'createdAt'>) {
  await record(input);
  const user = auth.currentUser;
  if (!user) return;
  const profile = await userService.getProfile(user.uid).catch(() => null);
  if (profile?.analysisAlerts === false) return;
  const preferences = profile?.notificationPreferences;
  if (input.type === 'import' && preferences?.imports === false) return;
  if (input.groupKey.startsWith('analysis-') && preferences?.analysisComplete === false) return;
  if (input.groupKey.startsWith('issue-') && preferences?.possibleIssue === false) return;
  if (input.type === 'appeal' && preferences?.appealReady === false) return;
  if (input.type === 'parent' && preferences?.parent === false) return;
  await deliver(input.title, input.body, input.groupKey, input.url);
}

export const notificationService = {
  async requestPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted' ? 'granted' : 'denied';
    }
    if (typeof Notification === 'undefined') return 'unsupported';
    const result = await Notification.requestPermission();
    return result === 'granted' ? 'granted' : 'denied';
  },
  async list(): Promise<RegradeNotification[]> {
    const user = auth.currentUser;
    if (!user) return [];
    if (isPreviewMode()) return previewRead().filter((item) => item.userId === user.uid && !item.archivedAt);
    const snapshot = await getDocs(query(collection(db, 'notifications'), where('userId', '==', user.uid)));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as RegradeNotification)).filter((item) => !item.archivedAt).sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
  },
  async markRead(id: string): Promise<void> {
    if (isPreviewMode()) { previewWrite(previewRead().map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item)); return; }
    await updateDoc(doc(db, 'notifications', id), { readAt: serverTimestamp(), updatedAt: serverTimestamp() });
  },
  async archive(id: string): Promise<void> {
    if (isPreviewMode()) { previewWrite(previewRead().map((item) => item.id === id ? { ...item, archivedAt: new Date().toISOString() } : item)); return; }
    await updateDoc(doc(db, 'notifications', id), { archivedAt: serverTimestamp(), updatedAt: serverTimestamp() });
  },
  async automaticImportComplete(count: number): Promise<void> {
    if (count <= 0) return;
    await recordAndDeliver({ type: 'import', title: 'New graded work found', body: `Regrade imported ${count} recent item${count === 1 ? '' : 's'} for your review.`, groupKey: 'automatic-imports', url: '/app?tab=study' });
  },
  async analysisComplete(caseId: string, title: string): Promise<void> {
    await recordAndDeliver({ type: 'review', title: 'AI review completed', body: `${title} is ready to review.`, groupKey: `analysis-${caseId}`, caseId, url: `/app?tab=study&case=${encodeURIComponent(caseId)}` });
  },
  async possibleIssue(caseId: string, title: string, points: number): Promise<void> {
    await recordAndDeliver({ type: 'review', title: 'Possible grading issue found', body: `${title} has up to ${points} point${points === 1 ? '' : 's'} worth checking.`, groupKey: `issue-${caseId}`, caseId, url: `/app?tab=study&case=${encodeURIComponent(caseId)}` });
  },
  async appealReady(caseId: string, title: string): Promise<void> {
    await recordAndDeliver({ type: 'appeal', title: 'Appeal draft ready', body: `${title} has a draft ready for your approval.`, groupKey: `appeal-${caseId}`, caseId, url: `/app?tab=upload&case=${encodeURIComponent(caseId)}` });
  },
  async initializeDeepLinks(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
      const url = typeof event.notification.extra?.url === 'string' ? event.notification.extra.url : '/app';
      window.location.assign(url);
    });
  },
  async test(): Promise<void> {
    await deliver('Regrade alerts are on', 'Mr Whale will notify you when recent graded work is ready to review.', 'regrade-test', '/app?tab=study');
  },
};
