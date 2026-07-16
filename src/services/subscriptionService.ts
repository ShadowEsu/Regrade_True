import { apiFetch } from '../lib/api';
import { isNativeStore, storePurchaseService } from './storePurchaseService';
import planCatalog from '../../shared/planCatalog.json';

export type PlanId = 'free' | 'student' | 'pro';

export const PLAN_CATALOG = Object.fromEntries(
  Object.entries(planCatalog.plans).map(([id, plan]) => [id, { ...plan, price: plan.monthlyPriceUsd }]),
) as Record<PlanId, (typeof planCatalog.plans)[PlanId] & { price: number }>;

/** Intro offer granted once when a user first hits billing. */
export const INTRO_PLUS_TRIAL_MONTHS = planCatalog.trialMonths;

export interface SubscriptionSnapshot {
  plan: PlanId;
  status: string;
  limits: { exams: number; messages: number; autoMode: boolean };
  usage: { exams: number; messages: number };
  periodStart: string;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  hasBillingAccount: boolean;
  isIntroTrial?: boolean;
  trialEndsAt?: string | null;
  bonusAccessUntil?: string | null;
  rewards: {
    activeDays: number;
    currentStreak: number;
    progressDays: number;
    daysUntilReward: number;
    earnedBlocks: number;
    redeemedBlocks: number;
    bonusDaysBalance: number;
    rewardCycleDays: number;
    rewardPlusDays: number;
    bonusAccessUntil: string | null;
    hasBonusAccess: boolean;
  };
}

export const subscriptionService = {
  async getStatus(): Promise<SubscriptionSnapshot> {
    const response = await apiFetch('/v1/billing/status');
    if (!response.ok) throw new Error('Could not load subscription status.');
    return response.json() as Promise<SubscriptionSnapshot>;
  },

  /** Records at most one active day using the server's UTC date. Repeated app
   * opens are idempotent, so the client cannot inflate the reward counter. */
  async recordActivity(): Promise<SubscriptionSnapshot> {
    const response = await apiFetch('/v1/billing/reward-activity', { method: 'POST' });
    if (!response.ok) throw new Error('Your activity reward could not be updated yet.');
    return response.json() as Promise<SubscriptionSnapshot>;
  },

  async redeemReward(): Promise<SubscriptionSnapshot> {
    const response = await apiFetch('/v1/billing/redeem-reward', { method: 'POST' });
    const data = await response.json() as SubscriptionSnapshot & { error?: { message?: string } };
    if (!response.ok) throw new Error(data.error?.message ?? 'Your Plus days could not be redeemed.');
    return data;
  },

  async startCheckout(plan: Exclude<PlanId, 'free'>): Promise<void> {
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
