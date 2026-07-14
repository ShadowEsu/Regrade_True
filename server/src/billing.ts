import type { Request, RequestHandler } from "express";
import { Router } from "express";
import admin from "./admin.js";
import Stripe from "stripe";
import crypto from "node:crypto";
import { z } from "zod";
import type { Env } from "./env.js";
import { ApiError } from "./http/errors.js";
import { validate } from "./middleware/validate.js";

export type PlanId = "free" | "student" | "pro";
export type UsageKind = "exam" | "message";

export const PLAN_LIMITS: Record<PlanId, { exams: number; messages: number; autoMode: boolean }> = {
  free: { exams: 3, messages: 25, autoMode: false },
  student: { exams: 10, messages: 50, autoMode: true },
  pro: { exams: 20, messages: 100, autoMode: true },
};

const INTRO_PLUS_TRIAL_MONTHS = 2;

type BillingRecord = {
  plan?: PlanId;
  status?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  source?: "stripe" | "app_store" | "intro_trial";
  managementUrl?: string | null;
  trialGrantedAt?: string;
};

function uidOf(req: Request): string {
  const uid = (req as Request & { firebase?: { uid?: string } }).firebase?.uid;
  if (!uid) throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Not signed in." });
  return uid;
}

function monthWindow(now = new Date()): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  };
}

function addMonthsUtc(date: Date, months: number): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + months,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  ));
}

function periodStillOpen(record: BillingRecord | undefined): boolean {
  if (!record?.currentPeriodEnd) return true;
  const end = new Date(record.currentPeriodEnd);
  return Number.isFinite(end.getTime()) && end.getTime() > Date.now();
}

function activePlan(record: BillingRecord | undefined): PlanId {
  if (!record || !["active", "trialing"].includes(record.status ?? "")) return "free";
  if (!periodStillOpen(record)) return "free";
  return record.plan === "student" || record.plan === "pro" ? record.plan : "free";
}

export async function hasAutomationEntitlement(uid: string): Promise<boolean> {
  await ensureIntroTrial(uid);
  const snap = await admin.firestore().collection("users").doc(uid).collection("billing").doc("current").get();
  return PLAN_LIMITS[activePlan(snap.exists ? snap.data() as BillingRecord : undefined)].autoMode;
}

function period(record: BillingRecord | undefined): { start: Date; end: Date } {
  const fallback = monthWindow();
  const start = record?.currentPeriodStart ? new Date(record.currentPeriodStart) : fallback.start;
  const end = record?.currentPeriodEnd ? new Date(record.currentPeriodEnd) : fallback.end;
  return Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) ? { start, end } : fallback;
}

/** One-time Plus trial (2 months) the first time billing is touched. */
async function ensureIntroTrial(uid: string): Promise<void> {
  const billingRef = admin.firestore().collection("users").doc(uid).collection("billing").doc("current");
  await admin.firestore().runTransaction(async (tx) => {
    const snap = await tx.get(billingRef);
    const record = snap.exists ? (snap.data() as BillingRecord) : undefined;
    if (record?.trialGrantedAt) return;
    if (record?.source === "stripe" || record?.source === "app_store") return;
    if (record && ["active", "trialing"].includes(record.status ?? "") && (record.plan === "student" || record.plan === "pro") && periodStillOpen(record)) {
      return;
    }
    const now = new Date();
    tx.set(billingRef, {
      plan: "student",
      status: "trialing",
      source: "intro_trial",
      trialGrantedAt: now.toISOString(),
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: addMonthsUtc(now, INTRO_PLUS_TRIAL_MONTHS).toISOString(),
      cancelAtPeriodEnd: true,
      updatedAt: now.toISOString(),
    }, { merge: true });
  });
}

async function snapshot(uid: string) {
  await ensureIntroTrial(uid);
  const billingRef = admin.firestore().collection("users").doc(uid).collection("billing").doc("current");
  const billingSnap = await billingRef.get();
  const record = billingSnap.exists ? (billingSnap.data() as BillingRecord) : undefined;
  const plan = activePlan(record);
  const window = period(record);
  const usageId = window.start.toISOString().slice(0, 10);
  const usageRef = billingRef.collection("periods").doc(usageId);
  const usageSnap = await usageRef.get();
  const usage = usageSnap.exists ? usageSnap.data() as { exams?: number; messages?: number } : {};
  const isIntroTrial = record?.source === "intro_trial" && plan === "student" && record.status === "trialing";
  return {
    plan,
    status: plan === "free"
      ? (record?.source === "intro_trial" && !periodStillOpen(record) ? "trial_ended" : "active")
      : record?.status ?? "inactive",
    limits: PLAN_LIMITS[plan],
    usage: { exams: usage.exams ?? 0, messages: usage.messages ?? 0 },
    periodStart: window.start.toISOString(),
    periodEnd: window.end.toISOString(),
    cancelAtPeriodEnd: record?.cancelAtPeriodEnd === true,
    hasBillingAccount: Boolean(record?.stripeCustomerId || record?.source === "app_store"),
    isIntroTrial,
    trialEndsAt: isIntroTrial ? (record?.currentPeriodEnd ?? null) : null,
  };
}

export async function consumeUsage(req: Request, kind: UsageKind): Promise<void> {
  const uid = uidOf(req);
  await ensureIntroTrial(uid);
  const billingRef = admin.firestore().collection("users").doc(uid).collection("billing").doc("current");
  await admin.firestore().runTransaction(async (tx) => {
    const billingSnap = await tx.get(billingRef);
    const record = billingSnap.exists ? (billingSnap.data() as BillingRecord) : undefined;
    const plan = activePlan(record);
    const window = period(record);
    const usageRef = billingRef.collection("periods").doc(window.start.toISOString().slice(0, 10));
    const usageSnap = await tx.get(usageRef);
    const usage = usageSnap.exists ? usageSnap.data() as { exams?: number; messages?: number } : {};
    const field = kind === "exam" ? "exams" : "messages";
    const used = usage[field] ?? 0;
    const limit = kind === "exam" ? PLAN_LIMITS[plan].exams : PLAN_LIMITS[plan].messages;
    if (used >= limit) {
      throw new ApiError({ status: 402, code: "FORBIDDEN", message: `You have used all ${limit} ${kind === "exam" ? "exam reviews" : "Mr. Whale messages"} for this billing period.` });
    }
    tx.set(usageRef, { [field]: used + 1, periodStart: window.start.toISOString(), periodEnd: window.end.toISOString(), updatedAt: new Date().toISOString() }, { merge: true });
  });
}

export async function refundUsage(req: Request, kind: UsageKind): Promise<void> {
  const uid = uidOf(req);
  const billingRef = admin.firestore().collection("users").doc(uid).collection("billing").doc("current");
  await admin.firestore().runTransaction(async (tx) => {
    const billingSnap = await tx.get(billingRef);
    const record = billingSnap.exists ? (billingSnap.data() as BillingRecord) : undefined;
    const window = period(record);
    const usageRef = billingRef.collection("periods").doc(window.start.toISOString().slice(0, 10));
    const usageSnap = await tx.get(usageRef);
    const usage = usageSnap.exists ? usageSnap.data() as { exams?: number; messages?: number } : {};
    const field = kind === "exam" ? "exams" : "messages";
    tx.set(usageRef, { [field]: Math.max(0, (usage[field] ?? 0) - 1), updatedAt: new Date().toISOString() }, { merge: true });
  });
}

const CheckoutSchema = z.object({ plan: z.enum(["student", "pro"]) });

export function createBillingRouter(env: Env): Router {
  const router = Router();
  const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

  router.get("/status", (req, res, next) => void snapshot(uidOf(req)).then((value) => res.json(value)).catch(next));

  router.post("/sync-native", (req, res, next) => {
    void syncRevenueCat(uidOf(req), env).then(() => snapshot(uidOf(req))).then((value) => res.json(value)).catch(next);
  });

  router.post("/checkout", validate(CheckoutSchema, "body"), (req, res, next) => {
    void (async () => {
      if (!stripe) throw new ApiError({ status: 503, code: "SERVICE_UNAVAILABLE", message: "Paid plans are not available yet." });
      const uid = uidOf(req);
      const plan = (req.body as z.infer<typeof CheckoutSchema>).plan;
      const price = plan === "student" ? env.STRIPE_STUDENT_PRICE_ID : env.STRIPE_PRO_PRICE_ID;
      if (!price) throw new ApiError({ status: 503, code: "SERVICE_UNAVAILABLE", message: "This plan is not configured yet." });
      const current = await snapshot(uid);
      if (current.hasBillingAccount && current.plan !== "free") {
        throw new ApiError({ status: 409, code: "BAD_REQUEST", message: "Manage your existing plan instead." });
      }
      const firebaseUser = await admin.auth().getUser(uid);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price, quantity: 1 }],
        customer_email: firebaseUser.email,
        client_reference_id: uid,
        metadata: { firebaseUid: uid, plan },
        subscription_data: { metadata: { firebaseUid: uid, plan } },
        success_url: `${env.BILLING_RETURN_URL}?billing=success`,
        cancel_url: `${env.BILLING_RETURN_URL}?billing=cancelled`,
      });
      res.json({ url: session.url });
    })().catch(next);
  });

  router.post("/portal", (req, res, next) => {
    void (async () => {
      if (!stripe) throw new ApiError({ status: 503, code: "SERVICE_UNAVAILABLE", message: "Billing management is not configured yet." });
      const uid = uidOf(req);
      const billingSnap = await admin.firestore().collection("users").doc(uid).collection("billing").doc("current").get();
      const customer = (billingSnap.data() as BillingRecord | undefined)?.stripeCustomerId;
      if (!customer) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "No paid subscription found." });
      const session = await stripe.billingPortal.sessions.create({ customer, return_url: env.BILLING_RETURN_URL });
      res.json({ url: session.url });
    })().catch(next);
  });

  return router;
}

/** Remove external billing identifiers before account deletion. Store subscriptions
 * remain managed by Apple/Google and may be restored to a new Regrade account. */
export async function deleteExternalBillingProfile(uid: string, env: Env): Promise<void> {
  const ref = admin.firestore().collection("users").doc(uid).collection("billing").doc("current");
  const snap = await ref.get();
  const record = snap.exists ? snap.data() as BillingRecord : undefined;
  if (record?.source === "stripe" && env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    if (record.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(record.stripeSubscriptionId).catch((error: unknown) => {
        if (!(error instanceof Stripe.errors.StripeInvalidRequestError)) throw error;
      });
    }
    if (record.stripeCustomerId) {
      await stripe.customers.del(record.stripeCustomerId).catch((error: unknown) => {
        if (!(error instanceof Stripe.errors.StripeInvalidRequestError)) throw error;
      });
    }
  }
  if (record?.source === "app_store" && env.REVENUECAT_SECRET_API_KEY) {
    await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${env.REVENUECAT_SECRET_API_KEY}` },
    }).then((response) => {
      if (!response.ok && response.status !== 404) throw new Error("Could not remove the RevenueCat subscriber.");
    });
  }
}

type RevenueCatEntitlement = { expires_date?: string | null; purchase_date?: string; product_identifier?: string };
type RevenueCatSubscriber = {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement>;
    management_url?: string | null;
  };
};

function entitlementActive(value: RevenueCatEntitlement | undefined): boolean {
  if (!value) return false;
  if (!value.expires_date) return true;
  return new Date(value.expires_date).getTime() > Date.now();
}

async function syncRevenueCat(uid: string, env: Env): Promise<void> {
  if (!env.REVENUECAT_SECRET_API_KEY) {
    throw new ApiError({ status: 503, code: "SERVICE_UNAVAILABLE", message: "App Store entitlement verification is not configured yet." });
  }
  const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
    headers: { Authorization: `Bearer ${env.REVENUECAT_SECRET_API_KEY}`, Accept: "application/json" },
  });
  if (!response.ok) throw new ApiError({ status: 502, code: "SERVICE_UNAVAILABLE", message: "The App Store purchase could not be verified yet." });
  const body = await response.json() as RevenueCatSubscriber;
  const entitlements = body.subscriber?.entitlements ?? {};
  const pro = entitlements[env.REVENUECAT_PRO_ENTITLEMENT];
  const student = entitlements[env.REVENUECAT_STUDENT_ENTITLEMENT];
  const selected = entitlementActive(pro) ? pro : entitlementActive(student) ? student : undefined;
  const plan: PlanId = entitlementActive(pro) ? "pro" : entitlementActive(student) ? "student" : "free";
  const fallback = monthWindow();
  await admin.firestore().collection("users").doc(uid).collection("billing").doc("current").set({
    plan,
    status: plan === "free" ? "expired" : "active",
    source: "app_store",
    currentPeriodStart: selected?.purchase_date ?? fallback.start.toISOString(),
    currentPeriodEnd: selected?.expires_date ?? fallback.end.toISOString(),
    productIdentifier: selected?.product_identifier ?? null,
    managementUrl: body.subscriber?.management_url ?? null,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

function secureEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createRevenueCatWebhookHandler(env: Env): RequestHandler {
  return (req, res) => {
    void (async () => {
      const expected = env.REVENUECAT_WEBHOOK_AUTH;
      const received = req.headers.authorization ?? "";
      if (!expected || !secureEqual(received, `Bearer ${expected}`)) return res.status(401).json({ received: false });
      const event = (req.body as { event?: { app_user_id?: string } }).event;
      if (!event?.app_user_id) return res.status(400).json({ received: false });
      await syncRevenueCat(event.app_user_id, env);
      return res.json({ received: true });
    })().catch(() => res.status(400).json({ received: false }));
  };
}

async function persistStripeSubscription(subscription: Stripe.Subscription, env: Env): Promise<void> {
  const uid = subscription.metadata.firebaseUid;
  if (!uid) return;
  const item = subscription.items.data[0];
  const priceId = item?.price.id;
  const plan: PlanId = priceId === env.STRIPE_PRO_PRICE_ID ? "pro" : priceId === env.STRIPE_STUDENT_PRICE_ID ? "student" : "free";
  const start = new Date((item?.current_period_start ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();
  const end = new Date((item?.current_period_end ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();
  await admin.firestore().collection("users").doc(uid).collection("billing").doc("current").set({
    plan,
    source: "stripe",
    status: subscription.status,
    stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    currentPeriodStart: start,
    currentPeriodEnd: end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export function createStripeWebhookHandler(env: Env): RequestHandler {
  return (req, res) => {
    void (async () => {
      if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) return res.status(503).send("Billing not configured");
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      const signature = req.headers["stripe-signature"];
      if (typeof signature !== "string") return res.status(400).send("Missing signature");
      const event = stripe.webhooks.constructEvent(req.body as Buffer, signature, env.STRIPE_WEBHOOK_SECRET);
      if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
        await persistStripeSubscription(event.data.object as Stripe.Subscription, env);
      } else if (event.type === "invoice.payment_failed" || event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.parent?.subscription_details?.subscription === "string"
          ? invoice.parent.subscription_details.subscription
          : invoice.parent?.subscription_details?.subscription?.id;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await persistStripeSubscription(subscription, env);
        }
      }
      return res.json({ received: true });
    })().catch(() => res.status(400).send("Invalid webhook"));
  };
}
