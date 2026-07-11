/** Live, isolated Regrade agent harness for marked PDFs.
 * Usage: npm run test:agent -- "/path/test-1.pdf" "/path/test-2.pdf"
 * Outputs stay under ../tmp/agent-tests and never enter Firestore. */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { GoogleGenAI } from "@google/genai";
import { ANALYTICAL_SYSTEM_PROMPT } from "../src/shared/analyticalSystemPrompt.js";
import { auditGradingCompleteness, mergeAuditIntoAnalysis } from "../src/shared/gradeExtractionAudit.js";

const inputs = process.argv.slice(2).map((value) => resolve(value));
if (!inputs.length) throw new Error("Pass at least one marked PDF path.");
const key = process.env.GEMINI_API_KEY?.trim();
if (!key) throw new Error("Set GEMINI_API_KEY in server/.env.");
const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
const outputRoot = resolve("../tmp/agent-tests");
mkdirSync(outputRoot, { recursive: true });
const ai = new GoogleGenAI({ apiKey: key });

function safeStem(path: string): string {
  return basename(path, ".pdf").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

async function analyzePdf(path: string) {
  const stem = safeStem(path);
  const work = join(outputRoot, `${stem}-pages`);
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  const textPath = join(outputRoot, `${stem}.txt`);
  execFileSync("pdftotext", ["-layout", path, textPath]);
  execFileSync("pdftoppm", ["-f", "1", "-l", "8", "-r", "110", "-png", path, join(work, "page")]);
  const text = readFileSync(textPath, "utf8").slice(0, 450_000);
  const pages = readdirSync(work).filter((file) => file.endsWith(".png")).sort().slice(0, 8);
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: `Analyze this marked exam. The PDF text layer follows, but the attached page images are primary evidence.\n\n${text}\n\nReturn structured JSON only.` },
    ...pages.map((file) => ({ inlineData: { mimeType: "image/png", data: readFileSync(join(work, file)).toString("base64") } })),
  ];
  const started = Date.now();
  const response = await ai.models.generateContent({ model, contents: [{ role: "user", parts }], config: { responseMimeType: "application/json", systemInstruction: ANALYTICAL_SYSTEM_PROMPT } });
  if (!response.text) throw new Error(`Empty response for ${basename(path)}`);
  const raw = JSON.parse(response.text) as Record<string, any>;
  const audit = auditGradingCompleteness(raw, { feedbackData: text });
  const analysis = mergeAuditIntoAnalysis(raw, audit) as Record<string, any>;
  const report = {
    fixture: basename(path), model, elapsedMs: Date.now() - started, pagesSent: pages.length,
    score: analysis.assignment?.total_score_display ?? null,
    questions: Array.isArray(analysis.questions) ? analysis.questions.length : 0,
    caseStrength: analysis.case_analysis?.overall_case_strength ?? null,
    strongestPoints: analysis.case_analysis?.strongest_appeal_points ?? [],
    focusAreas: analysis.study_insights?.focus_areas ?? [], confidence: analysis.confidence ?? null,
    audit: { unexplained: audit.unexplained_deductions.length, calculationErrors: audit.potential_calculation_errors.length }, analysis,
  };
  writeFileSync(join(outputRoot, `${stem}.analysis.json`), JSON.stringify(report, null, 2));
  return report;
}

const reports = [];
for (const input of inputs) { process.stdout.write(`Testing ${basename(input)}…\n`); reports.push(await analyzePdf(input)); }
writeFileSync(join(outputRoot, "summary.json"), JSON.stringify(reports.map(({ analysis: _analysis, ...summary }) => summary), null, 2));
for (const report of reports) process.stdout.write(`${report.fixture}: ${report.score ?? "score unclear"}, ${report.caseStrength ?? "strength unclear"}, ${report.questions} questions, ${report.elapsedMs} ms\n`);
