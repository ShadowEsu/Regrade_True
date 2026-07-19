import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";
import admin from "./admin.js";
import { ApiError } from "./http/errors.js";
import { validate } from "./middleware/validate.js";
import { ensureFirebaseAdmin } from "./firebaseAdmin.js";

const OnboardingSchema = z.object({
  name: z.string().trim().min(1).max(256),
  school: z.string().trim().max(256).optional().default(""),
  accountRole: z.enum(["student", "parent", "teacher"]).optional().default("student"),
  complete: z.boolean().optional().default(false),
});

const NotificationPreferencesSchema = z.object({
  imports: z.boolean(),
  analysisComplete: z.boolean(),
  possibleIssue: z.boolean(),
  appealReady: z.boolean(),
  parent: z.boolean(),
  weeklySummary: z.boolean(),
}).strict();

const PlatformSchema = z.enum([
  "gradescope",
  "canvas",
  "google_classroom",
  "brightspace",
  "moodle",
  "blackboard",
  "turnitin",
  "schoology",
  "powerschool",
  "sakai",
  "paper",
]);

/**
 * Deliberately narrow profile patch contract. Identity, timestamps, plan data,
 * entitlements, and ownership can never be supplied by the client here.
 */
export const ProfileSettingsSchema = z.object({
  name: z.string().trim().min(1).max(256).optional(),
  major: z.string().trim().max(256).optional(),
  school: z.string().trim().max(256).optional(),
  university: z.string().trim().max(256).optional(),
  gradeLevel: z.string().trim().max(80).optional(),
  gpa: z.string().trim().max(32).optional(),
  appealGoal: z.string().trim().max(2_000).optional(),
  appealTone: z.array(z.string().trim().min(1).max(64)).max(12).optional(),
  appealFocus: z.array(z.string().trim().min(1).max(64)).max(12).optional(),
  preferredPlatform: PlatformSchema.optional(),
  avatarUrl: z.string().trim().max(2_048).optional(),
  accountRole: z.enum(["student", "parent", "teacher"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  analysisAlerts: z.boolean().optional(),
  notificationPreferences: NotificationPreferencesSchema.optional(),
  autoMode: z.boolean().optional(),
  automaticGradeDetection: z.boolean().optional(),
  studyChecklist: z.array(z.string().trim().min(1).max(256)).max(12).optional(),
}).strict().refine((body) => Object.keys(body).length > 0, {
  message: "Choose at least one setting to update.",
});

const SyncProfileSchema = z.object({
  name: z.string().trim().min(1).max(256).optional(),
  avatarUrl: z.string().trim().max(2_048).optional(),
  passive: z.boolean().optional().default(true),
}).strict();

function uidOf(req: Request): string {
  const uid = (req as Request & { firebase?: { uid?: string } }).firebase?.uid;
  if (!uid) throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Not signed in." });
  return uid;
}

export function createProfileRouter(): Router {
  const router = Router();

  router.post("/sync", validate(SyncProfileSchema, "body"), (req, res, next) => {
    void (async () => {
      ensureFirebaseAdmin();
      const uid = uidOf(req);
      const body = req.body as z.infer<typeof SyncProfileSchema>;
      const authUser = await admin.auth().getUser(uid);
      const email = authUser.email?.trim() ?? "";
      const ref = admin.firestore().collection("users").doc(uid);
      const snap = await ref.get();
      const existing = (snap.data() ?? {}) as Record<string, unknown>;
      const now = admin.firestore.Timestamp.now();

      if (!snap.exists) {
        await ref.set({
          name: body.name ?? authUser.displayName?.trim() ?? email.split("@")[0] ?? "Student",
          email,
          major: "Undeclared",
          school: "",
          university: "",
          gradeLevel: "",
          gpa: "",
          appealGoal: "",
          avatarUrl: body.avatarUrl ?? authUser.photoURL ?? "",
          analysisAlerts: true,
          notificationPreferences: {
            imports: true,
            analysisComplete: true,
            possibleIssue: true,
            appealReady: true,
            parent: true,
            weeklySummary: false,
          },
          accountRole: "student",
          createdAt: now,
          updatedAt: now,
        });
      } else {
        const updates: Record<string, unknown> = { updatedAt: now };
        if (!body.passive || typeof existing.email !== "string" || !existing.email.trim()) updates.email = email;
        if (body.name && (!body.passive || typeof existing.name !== "string" || !existing.name.trim())) {
          updates.name = body.name;
        }
        if (body.avatarUrl && (!body.passive || typeof existing.avatarUrl !== "string" || !existing.avatarUrl.trim())) {
          updates.avatarUrl = body.avatarUrl;
        }
        await ref.set(updates, { merge: true });
      }

      res.json({ ok: true });
    })().catch(next);
  });

  router.patch("/settings", validate(ProfileSettingsSchema, "body"), (req, res, next) => {
    void (async () => {
      ensureFirebaseAdmin();
      const uid = uidOf(req);
      const body = req.body as z.infer<typeof ProfileSettingsSchema>;
      const updates: Record<string, unknown> = { ...body };
      if (body.studyChecklist) updates.studyChecklist = [...new Set(body.studyChecklist)].slice(0, 12);
      updates.updatedAt = admin.firestore.Timestamp.now();
      await admin.firestore().collection("users").doc(uid).set(updates, { merge: true });
      res.json({ ok: true, ...body, ...(updates.studyChecklist ? { studyChecklist: updates.studyChecklist } : {}) });
    })().catch(next);
  });

  router.post("/ai-consent", (req, res, next) => {
    void (async () => {
      ensureFirebaseAdmin();
      const uid = uidOf(req);
      const now = admin.firestore.Timestamp.now();
      await admin.firestore().collection("users").doc(uid).set(
        { aiConsentAt: now, updatedAt: now },
        { merge: true },
      );
      res.json({ ok: true, aiConsentAt: true });
    })().catch(next);
  });

  router.post("/onboarding", validate(OnboardingSchema, "body"), (req, res, next) => {
    void (async () => {
      ensureFirebaseAdmin();
      const uid = uidOf(req);
      const body = req.body as z.infer<typeof OnboardingSchema>;
      const authUser = await admin.auth().getUser(uid);
      const email = authUser.email?.trim();
      // Anonymous Firebase users are the deliberate guest-preview path. They
      // do not have an email address until they link a real sign-in method,
      // but they still need a private profile in order to move through the
      // app. Phone accounts are not treated as guests here because their
      // provider data identifies the account without an email.
      const isAnonymousGuest = !email && authUser.providerData.length === 0;
      if (!email && !isAnonymousGuest) {
        throw new ApiError({
          status: 400,
          code: "BAD_REQUEST",
          message: "Your account needs an email address before setup can continue.",
        });
      }

      const ref = admin.firestore().collection("users").doc(uid);
      const snap = await ref.get();
      const now = admin.firestore.Timestamp.now();
      const accountRole = body.accountRole;

      if (!snap.exists) {
        await ref.set({
          name: body.name,
          email: email ?? "",
          major: "Undeclared",
          school: body.school,
          university: "",
          gradeLevel: "",
          gpa: "",
          appealGoal: "",
          avatarUrl: authUser.photoURL ?? "",
          analysisAlerts: true,
          notificationPreferences: {
            imports: true,
            analysisComplete: true,
            possibleIssue: true,
            appealReady: true,
            parent: true,
            weeklySummary: false,
          },
          accountRole,
          onboardingComplete: body.complete === true,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        await ref.set(
          {
            name: body.name,
            school: body.school,
            accountRole,
            ...(body.complete ? { onboardingComplete: true } : {}),
            updatedAt: now,
          },
          { merge: true },
        );
      }

      res.json({
        ok: true,
        name: body.name,
        school: body.school,
        accountRole,
        onboardingComplete: body.complete === true || snap.data()?.onboardingComplete === true,
      });
    })().catch(next);
  });

  router.post("/tutorial-complete", (req, res, next) => {
    void (async () => {
      ensureFirebaseAdmin();
      const uid = uidOf(req);
      const now = admin.firestore.Timestamp.now();
      await admin.firestore().collection("users").doc(uid).set(
        { tutorialComplete: true, updatedAt: now },
        { merge: true },
      );
      res.json({ ok: true, tutorialComplete: true });
    })().catch(next);
  });

  return router;
}
