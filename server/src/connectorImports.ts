import crypto from "node:crypto";
import { Router, type Request } from "express";
import admin from "./admin.js";
import { z } from "zod";
import type { Env } from "./env.js";
import { hasAutomationEntitlement } from "./billing.js";
import { loadConnectionCredential, safeCanvasBaseUrl } from "./connections.js";
import { ApiError } from "./http/errors.js";
import { automaticImportCandidates, isAutomaticAssessment, type ConnectorImportItem } from "./importPolicy.js";
import { validate } from "./middleware/validate.js";

const SUPPORTED = ["canvas", "google_classroom", "google_drive", "dropbox", "onedrive"] as const;
const PlatformParam = z.object({ platformId: z.enum(SUPPORTED) });
const ListQuery = z.object({ mode: z.enum(["automatic", "manual"]).default("manual") });
const ManualSchema = z.object({ externalId: z.string().min(1).max(500) });

function assessmentType(title: string, providerType?: string): ConnectorImportItem["assessmentType"] {
  const normalized = `${providerType ?? ""} ${title}`.toLowerCase();
  if (/\b(quiz|exam|test|final|midterm|assessment|checkpoint|mock|paper)\b/.test(normalized)) {
    if (/\bquiz\b/.test(normalized)) return "quiz";
    if (/\btest\b/.test(normalized)) return "test";
    if (/\bexam|final|midterm|mock|paper\b/.test(normalized)) return "exam";
    return "assessment";
  }
  if (/\bassignment\b/.test(normalized)) return "assignment";
  return "unknown";
}

function ignoredSummary(all: ConnectorImportItem[], eligible: ConnectorImportItem[]) {
  const graded = all.filter((item) => item.kind === "graded_record");
  const eligibleIds = new Set(eligible.map((item) => item.externalId));
  const now = Date.now();
  const threshold = now - (7 * 24 * 60 * 60_000);
  const olderIds = new Set(graded.filter((item) => {
    const timestamp = item.gradedAt ? new Date(item.gradedAt).getTime() : Number.NaN;
    return !eligibleIds.has(item.externalId) && Number.isFinite(timestamp) && timestamp < threshold;
  }).map((item) => item.externalId));
  return {
    ignoredOlderCount: olderIds.size,
    // Keep these categories mutually exclusive so the user-facing summary
    // never reports one record twice. Unknown work is treated conservatively
    // as non-assessment until the learner chooses it manually.
    ignoredNonExamCount: graded.filter((item) => !eligibleIds.has(item.externalId) && !olderIds.has(item.externalId) && !isAutomaticAssessment(item)).length,
  };
}

function uidOf(req: Request): string {
  const uid = (req as Request & { firebase?: { uid?: string } }).firebase?.uid;
  if (!uid) throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Not signed in." });
  return uid;
}

async function providerFetch(url: string, init: RequestInit): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, { ...init, redirect: "error", signal: controller.signal });
    if (response.status === 401) throw new ApiError({ status: 401, code: "INVALID_TOKEN", message: "This connection expired. Reconnect the platform and try again." });
    if (response.status === 403) throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Access was revoked or blocked by your school. Reconnect or ask the school administrator." });
    if (response.status === 429) throw new ApiError({ status: 503, code: "SERVICE_UNAVAILABLE", message: "The platform is busy. Try again shortly." });
    if (!response.ok) throw new ApiError({ status: 502, code: "SERVICE_UNAVAILABLE", message: "The platform returned an unexpected response." });
    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError({ status: 502, code: "SERVICE_UNAVAILABLE", message: "The platform could not be reached. Check your connection and try again." });
  } finally { clearTimeout(timer); }
}

function accessToken(secret: string): string {
  try { return (JSON.parse(secret) as { accessToken?: string }).accessToken || secret; }
  catch { return secret; }
}

async function canvasItems(uid: string, env: Env): Promise<ConnectorImportItem[]> {
  const grant = await loadConnectionCredential(uid, "canvas", env);
  if (!grant) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Connect Canvas first." });
  const base = safeCanvasBaseUrl(grant.meta.baseUrl || "");
  if (!base) throw new ApiError({ status: 400, code: "BAD_REQUEST", message: "Reconnect Canvas with a valid school URL." });
  const headers = { authorization: `Bearer ${grant.secret}` };
  const courses = await providerFetch(`${base}/api/v1/courses?enrollment_state=active&per_page=50`, { headers }) as Array<{ id: number; name?: string }>;
  const groups = await Promise.all(courses.slice(0, 30).map(async (course) => {
    const assignments = await providerFetch(`${base}/api/v1/courses/${course.id}/assignments?include[]=submission&order_by=updated_at&per_page=100`, { headers }) as Array<any>;
    return assignments.flatMap((assignment): ConnectorImportItem[] => {
      const submission = assignment.submission;
      if (!submission || !["graded", "returned"].includes(String(submission.workflow_state))) return [];
      const title = String(assignment.name || "Canvas assessment");
      return [{ externalId: `${course.id}:${assignment.id}`, platformId: "canvas", title, course: course.name || null, gradedAt: submission.graded_at || submission.posted_at || submission.updated_at || null, score: submission.score ?? submission.grade ?? null, pointsPossible: Number.isFinite(assignment.points_possible) ? assignment.points_possible : null, feedback: null, kind: "graded_record", assessmentType: assessmentType(title, assignment.is_quiz_assignment ? "quiz" : undefined) }];
    });
  }));
  return groups.flat();
}

async function classroomItems(uid: string, env: Env): Promise<ConnectorImportItem[]> {
  const grant = await loadConnectionCredential(uid, "google_classroom", env);
  if (!grant) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Connect Google Classroom first." });
  const headers = { authorization: `Bearer ${accessToken(grant.secret)}` };
  const coursesBody = await providerFetch("https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=100", { headers }) as { courses?: Array<{ id: string; name?: string }> };
  const groups = await Promise.all((coursesBody.courses ?? []).slice(0, 30).map(async (course) => {
    const work = await providerFetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork?pageSize=100`, { headers }) as { courseWork?: Array<{ id: string; title?: string; maxPoints?: number; workType?: string }> };
    const submissions = await providerFetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork/-/studentSubmissions?userId=me&pageSize=100`, { headers }) as { studentSubmissions?: Array<any> };
    const byWork = new Map((work.courseWork ?? []).map((item) => [item.id, item]));
    return (submissions.studentSubmissions ?? []).flatMap((submission): ConnectorImportItem[] => {
      if (submission.state !== "RETURNED" || submission.assignedGrade == null) return [];
      const workItem = byWork.get(submission.courseWorkId);
      const title = workItem?.title || "Classroom assessment";
      return [{ externalId: `${course.id}:${submission.courseWorkId}:${submission.id}`, platformId: "google_classroom", title, course: course.name || null, gradedAt: submission.updateTime || null, score: submission.assignedGrade, pointsPossible: workItem?.maxPoints ?? null, feedback: null, kind: "graded_record", assessmentType: assessmentType(title, workItem?.workType) }];
    });
  }));
  return groups.flat();
}

async function fileItems(uid: string, platformId: "google_drive" | "dropbox" | "onedrive", env: Env): Promise<ConnectorImportItem[]> {
  const grant = await loadConnectionCredential(uid, platformId, env);
  if (!grant) throw new ApiError({ status: 404, code: "NOT_FOUND", message: `Connect ${platformId.replace("_", " ")} first.` });
  const token = accessToken(grant.secret);
  if (platformId === "google_drive") {
    const body = await providerFetch("https://www.googleapis.com/drive/v3/files?pageSize=100&orderBy=modifiedTime%20desc&fields=files(id,name,modifiedTime,mimeType)", { headers: { authorization: `Bearer ${token}` } }) as { files?: Array<any> };
    return (body.files ?? []).map((file) => ({ externalId: file.id, platformId, title: file.name || "Drive file", gradedAt: null, kind: "file" }));
  }
  if (platformId === "dropbox") {
    const body = await providerFetch("https://api.dropboxapi.com/2/files/list_folder", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ path: "", recursive: true, limit: 100 }) }) as { entries?: Array<any> };
    return (body.entries ?? []).filter((file) => file[".tag"] === "file").map((file) => ({ externalId: file.id, platformId, title: file.name || "Dropbox file", gradedAt: null, kind: "file" }));
  }
  const body = await providerFetch("https://graph.microsoft.com/v1.0/me/drive/root/search(q='.pdf')?$top=100&$select=id,name,lastModifiedDateTime,file", { headers: { authorization: `Bearer ${token}` } }) as { value?: Array<any> };
  return (body.value ?? []).map((file) => ({ externalId: file.id, platformId, title: file.name || "OneDrive file", gradedAt: null, kind: "file" }));
}

async function itemsFor(uid: string, platformId: typeof SUPPORTED[number], env: Env): Promise<ConnectorImportItem[]> {
  if (platformId === "canvas") return canvasItems(uid, env);
  if (platformId === "google_classroom") return classroomItems(uid, env);
  return fileItems(uid, platformId, env);
}

async function persistImport(uid: string, item: ConnectorImportItem, mode: "automatic" | "manual") {
  const id = crypto.createHash("sha256").update(`${item.platformId}|${item.externalId}`).digest("hex");
  await admin.firestore().collection("users").doc(uid).collection("imports").doc(id).set({ ...item, mode, status: item.kind === "graded_record" ? "awaiting_returned_file" : "available_to_select", importedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  await admin.firestore().collection("users").doc(uid).collection("automationJobs").doc(id).set({ importId: id, platformId: item.platformId, externalId: item.externalId, mode, status: item.kind === "graded_record" ? "awaiting_returned_file" : "available_to_select", title: item.title, updatedAt: admin.firestore.FieldValue.serverTimestamp(), createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  if (item.kind === "graded_record") {
    const caseRef = admin.firestore().collection("cases").doc(`imp_${id.slice(0, 40)}`);
    const existing = await caseRef.get();
    if (!existing.exists) {
      await caseRef.create({
        title: item.title,
        description: `Imported from ${item.platformId}${item.course ? ` · ${item.course}` : ""}. Open this item to add the returned marked file, rubric, or teacher comments before relying on an appeal analysis.`,
        ref: `IMP-${id.slice(0, 8).toUpperCase()}`,
        status: "Under Review",
        progress: 15,
        evidenceLogged: item.score != null,
        facultyReview: false,
        userId: uid,
        rawInput: { assignment: JSON.stringify(item).slice(0, 64_000), rubric: "", feedback: item.feedback ?? "" },
        importId: id,
        importMode: mode,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
  return id;
}

async function ensureAutomation(uid: string): Promise<void> {
  const profile = await admin.firestore().doc(`users/${uid}`).get();
  if (profile.data()?.automaticGradeDetection !== true) throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Turn on automatic grade detection in Settings first." });
  if (!(await hasAutomationEntitlement(uid))) throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Automatic grade detection requires Plus or Pro." });
}

export async function runAutomaticImportsForUser(uid: string, env: Env): Promise<{ imported: number; ignoredOlderCount: number; ignoredNonExamCount: number }> {
  await ensureAutomation(uid);
  const connections = await admin.firestore().collection("users").doc(uid).collection("connections").get();
  let imported = 0; let ignoredOlderCount = 0; let ignoredNonExamCount = 0;
  for (const platformId of ["canvas", "google_classroom"] as const) {
    if (!connections.docs.some((doc) => doc.id === platformId)) continue;
    const all = await itemsFor(uid, platformId, env);
    const eligible = automaticImportCandidates(all);
    await Promise.all(eligible.map((item) => persistImport(uid, item, "automatic")));
    imported += eligible.length;
    const ignored = ignoredSummary(all, eligible);
    ignoredOlderCount += ignored.ignoredOlderCount;
    ignoredNonExamCount += ignored.ignoredNonExamCount;
  }
  return { imported, ignoredOlderCount, ignoredNonExamCount };
}

export function createConnectorImportsRouter(env: Env): Router {
  const router = Router();
  router.get("/:platformId/items", validate(PlatformParam, "params"), validate(ListQuery, "query"), (req, res, next) => {
    void (async () => {
      const uid = uidOf(req); const platformId = (req.params as z.infer<typeof PlatformParam>).platformId; const mode = (req.query as z.infer<typeof ListQuery>).mode;
      const all = await itemsFor(uid, platformId, env);
      const items = mode === "automatic" ? automaticImportCandidates(all) : all;
      const ignored = mode === "automatic" ? ignoredSummary(all, items) : { ignoredOlderCount: 0, ignoredNonExamCount: 0 };
      res.json({ items, ...ignored, empty: items.length === 0 });
    })().catch(next);
  });
  router.post("/:platformId/automatic", validate(PlatformParam, "params"), (req, res, next) => {
    void (async () => {
      const uid = uidOf(req); await ensureAutomation(uid);
      const platformId = (req.params as z.infer<typeof PlatformParam>).platformId;
      const all = await itemsFor(uid, platformId, env); const eligible = automaticImportCandidates(all);
      const ids = await Promise.all(eligible.map((item) => persistImport(uid, item, "automatic")));
      res.json({ imported: ids.length, ...ignoredSummary(all, eligible), empty: eligible.length === 0 });
    })().catch(next);
  });
  router.post("/:platformId/manual", validate(PlatformParam, "params"), validate(ManualSchema, "body"), (req, res, next) => {
    void (async () => {
      const uid = uidOf(req); const platformId = (req.params as z.infer<typeof PlatformParam>).platformId; const externalId = (req.body as z.infer<typeof ManualSchema>).externalId;
      const selected = (await itemsFor(uid, platformId, env)).find((item) => item.externalId === externalId);
      if (!selected) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "That item is no longer available from the platform." });
      const importId = await persistImport(uid, selected, "manual");
      res.status(201).json({ importId, item: selected });
    })().catch(next);
  });
  return router;
}
