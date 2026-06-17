/**
 * Live Gemini extraction test — requires GEMINI_API_KEY in server/.env
 * Run: npx tsx server/scripts/test-gemini-extraction.ts
 */
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { EXTRACTION_SYSTEM_PROMPT } from '../src/shared/extractionSystemPrompt.js';
import {
  auditGradingCompleteness,
  mergeAuditIntoLedger,
} from '../src/shared/gradeExtractionAudit.js';

const GEMINI_MODEL = 'gemini-2.5-flash';

const syntheticGradescopeText = `
--- Simulated Gradescope score summary (text layer from PDF) ---
Assignment: Physics Problem Set 3
Total: 14 / 20 pts

Q1: 4 / 5 pts
Q2: 3 / 5 pts  (no comment visible on export)
Q3: 7 / 10 pts — rubric applied: "Missing diagram (-2)" checked, no bubble comment
`;

const studentRubric = `
Q1: Correct free-body diagram (+5 max).
Q2: Show kinematic equations with correct substitution (+5 max).
Q3: Full solution with diagram (+10 max); −2 if diagram missing but work is otherwise correct.
`;

async function main() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    console.error('Set GEMINI_API_KEY in server/.env');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: key });
  const prompt = `Extract the evidence ledger from this graded work.

Assignment / extracted PDF text:
${syntheticGradescopeText}

Rubric field (student pasted mark scheme):
${studentRubric}

Feedback field:
(Infer from upload — Q2 appears to be a score-only line with no instructor comment.)

Return ONLY the ledger JSON.`;

  console.log('Calling Gemini extraction…\n');
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: 'application/json',
      systemInstruction: EXTRACTION_SYSTEM_PROMPT,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Empty Gemini response');

  const ledger = JSON.parse(text) as Record<string, unknown>;
  const audit = auditGradingCompleteness(ledger, { rubricData: studentRubric });
  const patched = mergeAuditIntoLedger(ledger, audit);

  console.log('--- Reader output (patched) ---');
  console.log(JSON.stringify(patched, null, 2));
  console.log('\n--- Audit summary ---');
  console.log({
    unexplained: audit.unexplained_deductions.length,
    calc_errors: audit.potential_calculation_errors.length,
    score_only: audit.score_only_export,
    student_rubric: audit.student_supplied_rubric,
  });

  const q2 = (patched.questions as Array<{ question_id?: string; deductions_with_no_comment?: boolean }>)?.find(
    (q) => q.question_id === 'Q2',
  );
  if (q2 && !q2.deductions_with_no_comment && audit.unexplained_deductions.every((u) => u.question_id !== 'Q2')) {
    console.warn('\nNote: Q2 may not have been flagged — check Reader output manually.');
  } else {
    console.log('\nQ2 missing-comment handling: OK');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
