import { Capacitor } from '@capacitor/core';
import type { CustomerInfo, ENTITLEMENT_VERIFICATION_MODE, PurchasesPackage, PurchasesPlugin } from '@revenuecat/purchases-capacitor';
import { auth } from '../lib/firebase';

export type NativePlan = 'student' | 'pro';

const PRODUCT_IDS: Record<NativePlan, string> = {
  student: import.meta.env.VITE_IAP_STUDENT_PRODUCT_ID?.trim() || 'app.regrade.student.monthly',
  pro: import.meta.env.VITE_IAP_PRO_PRODUCT_ID?.trim() || 'app.regrade.pro.monthly',
};

let configuredFor: string | null = null;
let purchasesPlugin: PurchasesPlugin | null = null;

async function purchases(): Promise<PurchasesPlugin> {
  if (!purchasesPlugin) purchasesPlugin = (await import('@revenuecat/purchases-capacitor')).Purchases;
  return purchasesPlugin;
}

export function isNativeStore(): boolean {
  return Capacitor.isNativePlatform() && ['ios', 'android'].includes(Capacitor.getPlatform());
}

function publicKey(): string {
  const platform = Capacitor.getPlatform();
  return (platform === 'ios'
    ? import.meta.env.VITE_REVENUECAT_APPLE_API_KEY
    : import.meta.env.VITE_REVENUECAT_GOOGLE_API_KEY)?.trim() || '';
}

async function configure(): Promise<void> {
  if (!isNativeStore()) throw new Error('Native purchases are available in the App Store or Google Play app.');
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in before purchasing a plan.');
  if (configuredFor === user.uid) return;
  const apiKey = publicKey();
  if (!apiKey) throw new Error('App Store purchases are not configured yet.');
  const Purchases = await purchases();
  await Purchases.configure({
    apiKey,
    appUserID: user.uid,
    entitlementVerificationMode: 'INFORMATIONAL' as ENTITLEMENT_VERIFICATION_MODE,
    shouldShowInAppMessagesAutomatically: true,
    automaticDeviceIdentifierCollectionEnabled: false,
  });
  configuredFor = user.uid;
}

function verified(info: CustomerInfo): CustomerInfo {
  if (info.entitlements.verification === 'FAILED') {
    throw new Error('The store entitlement could not be verified. No paid access was granted.');
  }
  return info;
}

function packageFor(packages: PurchasesPackage[], plan: NativePlan): PurchasesPackage | undefined {
  return packages.find((item) => item.product.identifier === PRODUCT_IDS[plan]);
}

export const storePurchaseService = {
  async prices(): Promise<Partial<Record<NativePlan, string>>> {
    await configure();
    const Purchases = await purchases();
    const packages = (await Purchases.getOfferings()).current?.availablePackages ?? [];
    return {
      student: packageFor(packages, 'student')?.product.priceString,
      pro: packageFor(packages, 'pro')?.product.priceString,
    };
  },
  async purchase(plan: NativePlan): Promise<CustomerInfo> {
    await configure();
    const Purchases = await purchases();
    const offerings = await Purchases.getOfferings();
    const aPackage = packageFor(offerings.current?.availablePackages ?? [], plan);
    if (!aPackage) throw new Error(`The ${plan} subscription is not available from this App Store account.`);
    const result = await Purchases.purchasePackage({ aPackage });
    return verified(result.customerInfo);
  },

  async restore(): Promise<CustomerInfo> {
    await configure();
    const Purchases = await purchases();
    const result = await Purchases.restorePurchases();
    return verified(result.customerInfo);
  },

  async customerInfo(): Promise<CustomerInfo> {
    await configure();
    const Purchases = await purchases();
    return verified((await Purchases.getCustomerInfo()).customerInfo);
  },

  async manage(): Promise<void> {
    const info = await this.customerInfo();
    if (!info.managementURL) throw new Error('No active App Store subscription was found.');
    window.location.assign(info.managementURL);
  },
};
