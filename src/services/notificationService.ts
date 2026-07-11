import { Capacitor } from '@capacitor/core';

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
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      if ((await LocalNotifications.checkPermissions()).display !== 'granted') return;
      await LocalNotifications.schedule({ notifications: [{ id: Math.floor(Date.now() / 1000) % 2_000_000_000, title: 'New graded work found', body: `Regrade imported ${count} recent item${count === 1 ? '' : 's'} for your review.`, schedule: { at: new Date(Date.now() + 250) } }] });
      return;
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('New graded work found', { body: `Regrade imported ${count} recent item${count === 1 ? '' : 's'} for your review.`, icon: '/favicon.png' });
  },
  async test(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      if ((await LocalNotifications.checkPermissions()).display !== 'granted') return;
      await LocalNotifications.schedule({ notifications: [{ id: Math.floor(Date.now() / 1000) % 2_000_000_000, title: 'Regrade alerts are on', body: 'Mr Whale will notify you when recent graded work is ready to review.', schedule: { at: new Date(Date.now() + 250) } }] });
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Regrade alerts are on', { body: 'Mr Whale will notify you when recent graded work is ready to review.', icon: '/favicon.png' });
    }
  },
};
