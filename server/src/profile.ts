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

function uidOf(req: Request): string {
  const uid = (req as Request & { firebase?: { uid?: string } }).firebase?.uid;
  if (!uid) throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Not signed in." });
  return uid;
}

export function createProfileRouter(): Router {
  const router = Router();

  router.post("/onboarding", validate(OnboardingSchema, "body"), (req, res, next) => {
    void (async () => {
      ensureFirebaseAdmin();
      const uid = uidOf(req);
      const body = req.body as z.infer<typeof OnboardingSchema>;
      const authUser = await admin.auth().getUser(uid);
      const email = authUser.email?.trim();
      if (!email) {
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
          email,
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
