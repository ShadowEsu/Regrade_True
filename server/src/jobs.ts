import crypto from "node:crypto";
import type { RequestHandler } from "express";
import admin from "./admin.js";
import type { Env } from "./env.js";
import { runAutomaticImportsForUser } from "./connectorImports.js";

function equal(left: string, right: string): boolean {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Call every 15–60 minutes from Cloud Scheduler/Render Cron with Bearer CRON_SECRET. */
export function automaticConnectorJob(env: Env): RequestHandler {
  return (req, res) => {
    void (async () => {
      if (!env.CRON_SECRET || !equal(req.headers.authorization ?? "", `Bearer ${env.CRON_SECRET}`)) return res.status(401).json({ ok: false });
      const users = await admin.firestore().collection("users").where("automaticGradeDetection", "==", true).limit(500).get();
      const results = await Promise.allSettled(users.docs.map((user) => runAutomaticImportsForUser(user.id, env)));
      const imported = results.reduce((sum, result) => sum + (result.status === "fulfilled" ? result.value.imported : 0), 0);
      return res.json({ ok: true, usersChecked: users.size, imported, failures: results.filter((item) => item.status === "rejected").length });
    })().catch(() => res.status(500).json({ ok: false }));
  };
}
