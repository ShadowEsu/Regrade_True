/**
 * Anthropic (Claude) client wrapper for the hybrid Regrade pipeline.
 *
 * Two entry points:
 *  - reasonOverLedger(): Stage 2 of the hybrid pipeline — Claude takes
 *    Gemini's evidence ledger + PDF text + notes and produces the full
 *    AnalysisResult shape (case_analysis, teacher_profile, fairness_review).
 *  - analyzeSingleShot(): claude-only mode — Claude does extraction AND
 *    reasoning in one pass, given the same inputs the single-shot Gemini
 *    path receives.
 *
 * Both functions return parsed JSON. They throw on transport/parse errors —
 * the caller (regradeGemini.ts) is responsible for fallback handling.
 */
import Anthropic from "@anthropic-ai/sdk";
import { REASONING_SYSTEM_PROMPT } from "./shared/reasoningSystemPrompt.js";
import { ANALYTICAL_SYSTEM_PROMPT } from "./shared/analyticalSystemPrompt.js";

const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 8192;

type InlineImage = { mimeType: string; data: string };

type AnthropicMediaType = "image/png" | "image/jpeg" | "image/gif" | "image/webp";

type AnthropicImageBlock = {
  type: "image";
  source: { type: "base64"; media_type: AnthropicMediaType; data: string };
};

type AnthropicTextBlock = { type: "text"; text: string };

function toAnthropicMediaType(input: string): AnthropicMediaType | null {
  const lower = input.trim().toLowerCase();
  if (lower === "image/jpeg" || lower === "image/jpg") return "image/jpeg";
  if (lower === "image/png") return "image/png";
  if (lower === "image/gif") return "image/gif";
  if (lower === "image/webp") return "image/webp";
  return null;
}

function buildImageBlocks(images: InlineImage[]): AnthropicImageBlock[] {
  const out: AnthropicImageBlock[] = [];
  for (const img of images) {
    // Anthropic rejects HEIC/HEIF (and any mislabeled bytes) with a 400 that
    // aborts the whole request — skip those images here so the Claude stage
    // still runs on the rest. Gemini reads them in its own stage regardless.
    const mediaType = toAnthropicMediaType(img.mimeType);
    if (!mediaType) continue;
    out.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: img.data,
      },
    });
  }
  return out;
}

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
  }
  return trimmed;
}

function extractJson(raw: string): unknown {
  const cleaned = stripJsonFences(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    // Some models occasionally prepend prose; grab the first JSON object.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Claude returned non-JSON output.");
  }
}

export function isAnthropicConfigured(apiKey: string | undefined): boolean {
  return typeof apiKey === "string" && apiKey.trim().length > 0;
}

function newClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

/**
 * Stage 2 of the hybrid pipeline. Claude reasons over the ledger Gemini produced.
 */
export async function reasonOverLedger(args: {
  apiKey: string;
  ledger: unknown;
  assignmentText: string;
  studentNotes: string;
  inlineImages: InlineImage[];
}): Promise<unknown> {
  const client = newClient(args.apiKey);

  const content: Array<AnthropicTextBlock | AnthropicImageBlock> = [
    {
      type: "text",
      text: `You are receiving the Reader stage's evidence ledger plus the raw inputs the student supplied. Produce the full AnalysisResult JSON as defined in your system instructions.

═══════ READER LEDGER (JSON) ═══════
${JSON.stringify(args.ledger, null, 2)}

═══════ STUDENT'S ASSIGNMENT / PDF TEXT ═══════
${args.assignmentText || "(no PDF text — see images)"}

═══════ STUDENT NOTES (optional) ═══════
${args.studentNotes || "(none)"}

The same images the Reader saw are attached below for your reference. Trust the ledger's numbers unless internally contradictory; if so, list each discrepancy in _disagreements. Return ONLY the JSON.`,
    },
    ...buildImageBlocks(args.inlineImages),
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: REASONING_SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Empty response from Claude reasoning stage.");
  }
  return extractJson(textBlock.text);
}

/**
 * Claude-only mode. Claude does extraction + reasoning in one pass using the
 * same single-shot prompt the Gemini-only path uses.
 */
export async function analyzeSingleShot(args: {
  apiKey: string;
  assignmentText: string;
  rubricText: string;
  feedbackText: string;
  inlineImages: InlineImage[];
}): Promise<unknown> {
  const client = newClient(args.apiKey);

  const content: Array<AnthropicTextBlock | AnthropicImageBlock> = [
    {
      type: "text",
      text: `Analyze the student's uploaded grade evidence and return the structured JSON described in your system instructions.

INPUT 1 (Assignment Content):
${args.assignmentText}

INPUT 2 (Rubric Details):
${args.rubricText}

INPUT 3 (Teacher Feedback & Grading):
${args.feedbackText}

Images of the graded work are attached below. Return ONLY the JSON.`,
    },
    ...buildImageBlocks(args.inlineImages),
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: ANALYTICAL_SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Empty response from Claude single-shot stage.");
  }
  return extractJson(textBlock.text);
}
