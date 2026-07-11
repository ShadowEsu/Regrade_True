import { Router, type Request } from "express";
import admin from "./admin.js";
import { z } from "zod";
import { hasAutomationEntitlement } from "./billing.js";
import { ApiError } from "./http/errors.js";
import { validate } from "./middleware/validate.js";

const PreferencesSchema = z.object({
  autoPrepare: z.boolean().optional(),
  automaticGradeDetection: z.boolean().optional(),
  notifications: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one preference is required.");

function uidOf(req: Request): string {
  const uid = (req as Request & { firebase?: { uid?: string } }).firebase?.uid;
  if (!uid) throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Not signed in." });
  return uid;
}

export function createAutomationRouter(): Router {
  const router = Router();
  router.patch("/preferences", validate(PreferencesSchema, "body"), (req, res, next) => {
    void (async () => {
      const uid = uidOf(req);
      const input = req.body as z.infer<typeof PreferencesSchema>;
      const paidAutomation = await hasAutomationEntitlement(uid);
      if (!paidAutomation && (input.autoPrepare === true || input.automaticGradeDetection === true)) {
        throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Automatic workflows require a Student or Pro plan." });
      }
      const updates: Record<string, unknown> = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
      if (input.autoPrepare !== undefined) updates.autoMode = input.autoPrepare;
      if (input.automaticGradeDetection !== undefined) updates.automaticGradeDetection = input.automaticGradeDetection;
      if (input.notifications !== undefined) updates.analysisAlerts = input.notifications;
      await admin.firestore().collection("users").doc(uid).set(updates, { merge: true });
      res.json({ saved: true, paidAutomation, ...input });
    })().catch(next);
  });
  return router;
}
