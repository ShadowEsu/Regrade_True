import { Capacitor } from '@capacitor/core';

const notificationId = () => Math.floor(Date.now() / 1000) % 2_000_000_000;

async function deliver(title: string, body: string, tag: string, url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    if ((await LocalNotifications.checkPermissions()).display !== 'granted') return;
    await LocalNotifications.schedule({ notifications: [{ id: notificationId(), title, body, extra: { url } }] });
    return;
  }
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const notification = new Notification(title, { body, icon: '/favicon.png', tag, data: { url } });
  notification.onclick = () => {
    window.focus();
    window.location.assign(url);
  };
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
  async automaticImportComplete(count: number): Promise<void> {
    if (count <= 0) return;
    await deliver('New graded work found', `Regrade imported ${count} recent item${count === 1 ? '' : 's'} for your review.`, 'regrade-imports', '/app?tab=study');
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
