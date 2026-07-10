import type { Request, RequestHandler } from "express";
import { Router } from "express";
import admin from "firebase-admin";
import Stripe from "stripe";
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

type BillingRecord = {
  plan?: PlanId;
  status?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
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

function activePlan(record: BillingRecord | undefined): PlanId {
  if (!record || !["active", "trialing"].includes(record.status ?? "")) return "free";
  return record.plan === "student" || record.plan === "pro" ? record.plan : "free";
}

function period(record: BillingRecord | undefined): { start: Date; end: Date } {
  const fallback = monthWindow();
  const start = record?.currentPeriodStart ? new Date(record.currentPeriodStart) : fallback.start;
  const end = record?.currentPeriodEnd ? new Date(record.currentPeriodEnd) : fallback.end;
  return Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) ? { start, end } : fallback;
}

async function snapshot(uid: string) {
  const billingRef = admin.firestore().collection("users").doc(uid).collection("billing").doc("current");
  const billingSnap = await billingRef.get();
  const record = billingSnap.exists ? (billingSnap.data() as BillingRecord) : undefined;
  const plan = activePlan(record);
  const window = period(record);
  const usageId = window.start.toISOString().slice(0, 10);
  const usageRef = billingRef.collection("periods").doc(usageId);
  const usageSnap = await usageRef.get();
  const usage = usageSnap.exists ? usageSnap.data() as { exams?: number; messages?: number } : {};
  return {
    plan,
    status: plan === "free" ? "active" : record?.status ?? "inactive",
    limits: PLAN_LIMITS[plan],
    usage: { exams: usage.exams ?? 0, messages: usage.messages ?? 0 },
    periodStart: window.start.toISOString(),
    periodEnd: window.end.toISOString(),
    cancelAtPeriodEnd: record?.cancelAtPeriodEnd === true,
    hasBillingAccount: Boolean(record?.stripeCustomerId),
  };
}

export async function consumeUsage(req: Request, kind: UsageKind): Promise<void> {
  const uid = uidOf(req);
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

const CheckoutSchema = z.object({ plan: z.enum(["student", "pro"]) });

export function createBillingRouter(env: Env): Router {
  const router = Router();
  const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

  router.get("/status", (req, res, next) => void snapshot(uidOf(req)).then((value) => res.json(value)).catch(next));

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

export function createStripeWebhookHandler(env: Env): RequestHandler {
  return (req, res) => {
    void (async () => {
      if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) return res.status(503).send("Billing not configured");
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      const signature = req.headers["stripe-signature"];
      if (typeof signature !== "string") return res.status(400).send("Missing signature");
      const event = stripe.webhooks.constructEvent(req.body as Buffer, signature, env.STRIPE_WEBHOOK_SECRET);
      if (!["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) return res.json({ received: true });
      const subscription = event.data.object as Stripe.Subscription;
      const uid = subscription.metadata.firebaseUid;
      if (!uid) return res.json({ received: true });
      const item = subscription.items.data[0];
      const priceId = item?.price.id;
      const plan: PlanId = priceId === env.STRIPE_PRO_PRICE_ID ? "pro" : priceId === env.STRIPE_STUDENT_PRICE_ID ? "student" : "free";
      const start = new Date((item?.current_period_start ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();
      const end = new Date((item?.current_period_end ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();
      await admin.firestore().collection("users").doc(uid).collection("billing").doc("current").set({
        plan,
        status: subscription.status,
        stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: start,
        currentPeriodEnd: end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return res.json({ received: true });
    })().catch(() => res.status(400).send("Invalid webhook"));
  };
}
