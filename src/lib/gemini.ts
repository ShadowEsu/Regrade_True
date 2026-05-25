import { apiFetch } from './api';
import { isPreviewMode } from './previewMode';
import { PREVIEW_ANALYSIS } from './previewFixtures';
import type { AiEngine, AnalysisResult } from '../types';

type InlineImagePart = { mimeType: string; data: string };

async function readApiError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: { message?: string }; message?: string };
    if (data.error?.message) return data.error.message;
    if (data.message) return data.message;
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

export async function performComprehensiveAnalysis(
  assignmentData: string,
  rubricData: string,
  feedbackData: string,
  options?: { inlineImages?: InlineImagePart[]; aiEngine?: AiEngine },
) {
  if (isPreviewMode()) {
    await new Promise((r) => setTimeout(r, 900));
    return { ...PREVIEW_ANALYSIS };
  }

  try {
    const res = await apiFetch('/v1/gemini/analyze', {
      method: 'POST',
      body: JSON.stringify({
        assignmentData,
        rubricData,
        feedbackData,
        inlineImages: options?.inlineImages ?? [],
        aiEngine: options?.aiEngine ?? 'hybrid',
      }),
    });
    if (!res.ok) {
      throw new Error(await readApiError(res));
    }
    return res.json() as Promise<AnalysisResult>;
  } catch (error) {
    console.error('Gemini Analysis Error:', error);
    const hint = error instanceof Error && error.message ? ` (${error.message})` : '';
    throw new Error(`Analysis failed.${hint} Try clearer photos, or paste text from the rubric and feedback.`);
  }
}

export async function chatWithAdvocate(
  message: string,
  history: { role: 'user' | 'model'; text: string }[],
) {
  if (isPreviewMode()) {
    await new Promise((r) => setTimeout(r, 400));
    return (
      'Preview mode: this is a sample reply. In the full app, the appeal assistant uses your case context and course uploads. ' +
      `You asked: “${message.slice(0, 120)}${message.length > 120 ? '…' : ''}”`
    );
  }

  try {
    const res = await apiFetch('/v1/gemini/advocate', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) {
      throw new Error(await readApiError(res));
    }
    const data = (await res.json()) as { text?: string };
    if (!data.text) throw new Error('Empty response from assistant.');
    return data.text;
  } catch (error) {
    console.error('Advocate API Error:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to reach the appeal assistant. Try again in a moment.',
    );
  }
}
