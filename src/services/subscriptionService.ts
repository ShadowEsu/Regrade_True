import { apiFetch } from '../lib/api';
import { isPreviewMode } from '../lib/previewMode';
import { isNativeStore, storePurchaseService } from './storePurchaseService';

export type PlanId = 'free' | 'student' | 'pro';

export const PLAN_CATALOG = {
  free: { name: 'Free', price: 0, exams: 3, messages: 25, autoMode: false },
  student: { name: 'Student', price: 9.99, exams: 10, messages: 50, autoMode: true },
  pro: { name: 'Pro', price: 19.99, exams: 20, messages: 100, autoMode: true },
} as const;

export interface SubscriptionSnapshot {
  plan: PlanId;
  status: string;
  limits: { exams: number; messages: number; autoMode: boolean };
  usage: { exams: number; messages: number };
  periodStart: string;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  hasBillingAccount: boolean;
}

function currentMonthWindow() {
  const now = new Date();
  return {
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
    end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString(),
  };
}

function previewSnapshot(): SubscriptionSnapshot {
  const period = currentMonthWindow();
  const plan = (localStorage.getItem('regrade.preview.plan') as PlanId | null) ?? 'free';
  const safePlan: PlanId = plan in PLAN_CATALOG ? plan : 'free';
  const catalog = PLAN_CATALOG[safePlan];
  return {
    plan: safePlan,
    status: 'active',
    limits: { exams: catalog.exams, messages: catalog.messages, autoMode: catalog.autoMode },
    usage: { exams: 0, messages: 0 },
    periodStart: period.start,
    periodEnd: period.end,
    cancelAtPeriodEnd: false,
    hasBillingAccount: safePlan !== 'free',
  };
}

export const subscriptionService = {
  async getStatus(): Promise<SubscriptionSnapshot> {
    if (isPreviewMode()) return previewSnapshot();
    const response = await apiFetch('/v1/billing/status');
    if (!response.ok) throw new Error('Could not load subscription status.');
    return response.json() as Promise<SubscriptionSnapshot>;
  },

  async startCheckout(plan: Exclude<PlanId, 'free'>): Promise<void> {
    if (isPreviewMode()) {
      localStorage.setItem('regrade.preview.plan', plan);
      window.location.reload();
      return;
    }
    if (isNativeStore()) {
      await storePurchaseService.purchase(plan);
      const response = await apiFetch('/v1/billing/sync-native', { method: 'POST' });
      if (!response.ok) throw new Error('The purchase succeeded, but access is still syncing. Use Restore Purchases in a moment.');
      window.location.reload();
      return;
    }
    const response = await apiFetch('/v1/billing/checkout', { method: 'POST', body: JSON.stringify({ plan }) });
    const data = await response.json() as { url?: string; error?: { message?: string } };
    if (!response.ok || !data.url) throw new Error(data.error?.message ?? 'Checkout is unavailable.');
    window.location.assign(data.url);
  },

  async openPortal(): Promise<void> {
    if (isPreviewMode()) return;
    if (isNativeStore()) return storePurchaseService.manage();
    const response = await apiFetch('/v1/billing/portal', { method: 'POST' });
    const data = await response.json() as { url?: string; error?: { message?: string } };
    if (!response.ok || !data.url) throw new Error(data.error?.message ?? 'Billing management is unavailable.');
    window.location.assign(data.url);
  },

  async restorePurchases(): Promise<void> {
    if (!isNativeStore()) throw new Error('Restore Purchases is available in the mobile app.');
    await storePurchaseService.restore();
    const response = await apiFetch('/v1/billing/sync-native', { method: 'POST' });
    if (!response.ok) throw new Error('The purchase was restored, but access is still syncing. Try again shortly.');
  },

  async getNativePrices(): Promise<Partial<Record<'student' | 'pro', string>>> {
    return isNativeStore() ? storePurchaseService.prices() : {};
  },
};
