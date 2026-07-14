import crypto from "node:crypto";
import { Router, type Request } from "express";
import rateLimit from "express-rate-limit";
import admin from "./admin.js";
import type { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import type { Env } from "./env.js";
import { ApiError } from "./http/errors.js";
import { validate } from "./middleware/validate.js";

const CodeSchema = z.object({ code: z.string().trim().toUpperCase().regex(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/) });
const LinkParam = z.object({ linkId: z.string().uuid() });
const CaseParam = z.object({ linkId: z.string().uuid(), caseId: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/) });
const SuggestionParam = z.object({ linkId: z.string().uuid(), suggestionId: z.string().regex(/^[a-f0-9]{64}$/) });
const PermissionSchema = z.object({ viewExams: z.boolean(), viewAiFindings: z.boolean(), viewAppealDrafts: z.boolean(), receiveNotifications: z.boolean() });
const CODE_TTL_MS = 10 * 60_000;
const LINK_TTL_MS = 24 * 60 * 60_000;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function uidOf(req: Request): string {
  const uid = (req as Request & { firebase?: { uid?: string } }).firebase?.uid;
  if (!uid) throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Not signed in." });
  return uid;
}

function codeHash(code: string, pepper: string): string {
  return crypto.createHmac("sha256", pepper).update(code).digest("hex");
}

function newCode(): string {
  return Array.from(crypto.randomBytes(8), (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

async function roleOf(uid: string): Promise<"student" | "supervisor"> {
  const snap = await admin.firestore().doc(`users/${uid}`).get();
  const role = snap.data()?.accountRole;
  return role === "parent" || role === "teacher" || role === "supervisor" ? "supervisor" : "student";
}

type LinkRecord = { learnerUid: string; supervisorUid: string; status: "pending" | "active"; expiresAt?: Timestamp; shareGrades?: boolean; shareAppealFindings?: boolean; shareDrafts?: boolean; receiveNotifications?: boolean };

export function createFamilyRouter(env: Env): Router {
  const router = Router();
  const pepper = env.FAMILY_PAIRING_PEPPER;
  const redeemLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });
  const requirePepper = () => {
    if (!pepper) throw new ApiError({ status: 503, code: "SERVICE_UNAVAILABLE", message: "Family pairing is not configured yet." });
    return pepper;
  };

  router.get("/status", (req, res, next) => {
    void (async () => {
      const uid = uidOf(req);
      const role = await roleOf(uid);
      const field = role === "supervisor" ? "supervisorUid" : "learnerUid";
      const snap = await admin.firestore().collection("supervisionLinks").where(field, "==", uid).get();
      const rows = await Promise.all(snap.docs.map(async (doc) => {
        const data = doc.data() as LinkRecord;
        const counterpartUid = role === "supervisor" ? data.learnerUid : data.supervisorUid;
        const profile = await admin.firestore().doc(`users/${counterpartUid}`).get();
        const suggestions = role === "student"
          ? (await doc.ref.collection("suggestions").where("status", "==", "pending").get()).docs.map((item) => ({ id: item.id, caseId: item.data().caseId, title: item.data().title || "Marked work" }))
          : [];
        const person = profile.data();
        return {
          id: doc.id,
          status: data.status,
          counterpartName: person?.name || "Regrade member",
          counterpartAvatarUrl: person?.avatarUrl || "",
          gradeLevel: person?.gradeLevel || "",
          school: person?.school || person?.university || "",
          canViewSharedWork: data.status === "active" && data.shareGrades !== false,
          permissions: {
            viewExams: data.shareGrades !== false,
            viewAiFindings: data.shareAppealFindings !== false,
            viewAppealDrafts: data.shareDrafts !== false,
            receiveNotifications: data.receiveNotifications !== false,
          },
          suggestions,
        };
      }));
      res.json({ role, links: rows });
    })().catch(next);
  });

  router.post("/code", (req, res, next) => {
    void (async () => {
      const uid = uidOf(req);
      if (await roleOf(uid) !== "student") throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Only a learner can create a pairing code." });
      const old = await admin.firestore().collection("pairingCodes").where("learnerUid", "==", uid).get();
      const batch = admin.firestore().batch();
      old.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      const code = newCode();
      const expiresAt = new Date(Date.now() + CODE_TTL_MS);
      await admin.firestore().collection("pairingCodes").doc(codeHash(code, requirePepper())).set({ learnerUid: uid, expiresAt: admin.firestore.Timestamp.fromDate(expiresAt), createdAt: admin.firestore.FieldValue.serverTimestamp() });
      res.json({ code, expiresAt: expiresAt.toISOString() });
    })().catch(next);
  });

  router.post("/redeem", redeemLimiter, validate(CodeSchema, "body"), (req, res, next) => {
    void (async () => {
      const supervisorUid = uidOf(req);
      if (await roleOf(supervisorUid) !== "supervisor") throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Only a supervisor can redeem a learner code." });
      const code = (req.body as z.infer<typeof CodeSchema>).code;
      const ref = admin.firestore().collection("pairingCodes").doc(codeHash(code, requirePepper()));
      const linkId = crypto.randomUUID();
      await admin.firestore().runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const record = snap.data() as { learnerUid?: string; expiresAt?: Timestamp } | undefined;
        if (!record?.learnerUid || !record.expiresAt || record.expiresAt.toMillis() <= Date.now()) throw new ApiError({ status: 400, code: "BAD_REQUEST", message: "That code is invalid or expired." });
        if (record.learnerUid === supervisorUid) throw new ApiError({ status: 400, code: "BAD_REQUEST", message: "You cannot pair an account to itself." });
        tx.create(admin.firestore().collection("supervisionLinks").doc(linkId), {
          learnerUid: record.learnerUid, supervisorUid, status: "pending",
          shareGrades: true, shareAppealFindings: true, shareDrafts: true,
          receiveNotifications: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + LINK_TTL_MS),
        });
        tx.delete(ref);
      });
      res.status(201).json({ linkId, status: "pending" });
    })().catch(next);
  });

  router.post("/links/:linkId/approve", validate(LinkParam, "params"), (req, res, next) => {
    void (async () => {
      const uid = uidOf(req);
      const ref = admin.firestore().collection("supervisionLinks").doc((req.params as z.infer<typeof LinkParam>).linkId);
      await admin.firestore().runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const link = snap.data() as LinkRecord | undefined;
        if (!link || link.learnerUid !== uid) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Pairing request not found." });
        if (link.expiresAt && link.expiresAt.toMillis() <= Date.now()) throw new ApiError({ status: 400, code: "BAD_REQUEST", message: "This request expired. Generate a new code." });
        tx.update(ref, { status: "active", learnerConsentAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      });
      res.json({ active: true });
    })().catch(next);
  });

  router.delete("/links/:linkId", validate(LinkParam, "params"), (req, res, next) => {
    void (async () => {
      const uid = uidOf(req);
      const ref = admin.firestore().collection("supervisionLinks").doc((req.params as z.infer<typeof LinkParam>).linkId);
      const snap = await ref.get();
      const link = snap.data() as LinkRecord | undefined;
      if (!link || (link.learnerUid !== uid && link.supervisorUid !== uid)) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Connection not found." });
      await admin.firestore().recursiveDelete(ref);
      res.status(204).end();
    })().catch(next);
  });

  router.patch("/links/:linkId/permissions", validate(LinkParam, "params"), validate(PermissionSchema, "body"), (req, res, next) => {
    void (async () => {
      const learnerUid = uidOf(req);
      const ref = admin.firestore().collection("supervisionLinks").doc((req.params as z.infer<typeof LinkParam>).linkId);
      const snap = await ref.get();
      const link = snap.data() as LinkRecord | undefined;
      if (!link || link.learnerUid !== learnerUid || link.status !== "active") throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Only the linked learner can change these permissions." });
      const permissions = req.body as z.infer<typeof PermissionSchema>;
      await ref.update({
        shareGrades: permissions.viewExams,
        shareAppealFindings: permissions.viewAiFindings,
        shareDrafts: permissions.viewAppealDrafts,
        receiveNotifications: permissions.receiveNotifications,
        permissionsUpdatedBy: learnerUid,
        permissionsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.json({ updated: true });
    })().catch(next);
  });

  router.get("/links/:linkId/cases", validate(LinkParam, "params"), (req, res, next) => {
    void (async () => {
      const uid = uidOf(req);
      const snap = await admin.firestore().collection("supervisionLinks").doc((req.params as z.infer<typeof LinkParam>).linkId).get();
      const link = snap.data() as LinkRecord | undefined;
      if (!link || link.supervisorUid !== uid || link.status !== "active" || link.shareGrades === false) throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Learner permission to view exams is required." });
      const cases = await admin.firestore().collection("cases").where("userId", "==", link.learnerUid).get();
      res.json({ cases: cases.docs.map((doc) => {
        const data = doc.data();
        return { id: doc.id, title: data.title, status: data.status, updatedAt: data.updatedAt, analysis: link.shareAppealFindings === false ? null : data.analysis ?? null, draftEmail: link.shareDrafts === false ? null : data.draftEmail ?? null };
      }) });
    })().catch(next);
  });

  router.post("/links/:linkId/cases/:caseId/suggest", validate(CaseParam, "params"), (req, res, next) => {
    void (async () => {
      const supervisorUid = uidOf(req);
      const { linkId, caseId } = req.params as z.infer<typeof CaseParam>;
      const linkRef = admin.firestore().collection("supervisionLinks").doc(linkId);
      const linkSnap = await linkRef.get();
      const link = linkSnap.data() as LinkRecord | undefined;
      if (!link || link.supervisorUid !== supervisorUid || link.status !== "active") throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Learner consent is required." });
      const caseSnap = await admin.firestore().collection("cases").doc(caseId).get();
      const record = caseSnap.data();
      if (!record || record.userId !== link.learnerUid) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Shared assessment not found." });
      const identity = `${String(record.analysis?.assignment?.subject ?? "").trim().toLowerCase()}|${String(record.analysis?.assignment?.title ?? record.title ?? caseId).trim().toLowerCase()}`;
      const suggestionId = crypto.createHash("sha256").update(identity).digest("hex");
      const suggestionRef = linkRef.collection("suggestions").doc(suggestionId);
      await admin.firestore().runTransaction(async (tx) => {
        if ((await tx.get(suggestionRef)).exists) throw new ApiError({ status: 409, code: "BAD_REQUEST", message: "A review has already been suggested for this assessment." });
        tx.create(suggestionRef, { caseId, title: record.analysis?.assignment?.title ?? record.title ?? "Marked work", status: "pending", createdBy: supervisorUid, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      });
      res.status(201).json({ suggestionId });
    })().catch(next);
  });

  router.post("/links/:linkId/suggestions/:suggestionId/acknowledge", validate(SuggestionParam, "params"), (req, res, next) => {
    void (async () => {
      const learnerUid = uidOf(req);
      const { linkId, suggestionId } = req.params as z.infer<typeof SuggestionParam>;
      const linkRef = admin.firestore().collection("supervisionLinks").doc(linkId);
      const link = (await linkRef.get()).data() as LinkRecord | undefined;
      if (!link || link.learnerUid !== learnerUid || link.status !== "active") throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Connection not found." });
      await linkRef.collection("suggestions").doc(suggestionId).update({ status: "acknowledged", acknowledgedAt: admin.firestore.FieldValue.serverTimestamp() });
      res.json({ acknowledged: true });
    })().catch(next);
  });
  return router;
}
