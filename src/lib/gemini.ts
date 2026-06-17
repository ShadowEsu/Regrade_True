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
    if (error instanceof Error && error.message.includes('AI analysis is coming soon')) {
      throw error;
    }
    const hint = error instanceof Error && error.message ? ` (${error.message})` : '';
    throw new Error(`Analysis failed.${hint} Try clearer photos, or paste text from the rubric and feedback.`);
  }
}

export async function chatWithAdvocate(
  message: string,
  history: { role: 'user' | 'model'; text: string }[],
  options?: { caseContext?: string },
) {
  if (isPreviewMode()) {
    await new Promise((r) => setTimeout(r, 400));
    if (options?.caseContext) {
      return (
        'Preview mode: your appeal assistant would use worksheet analysis here. ' +
        'Ask me to polish your draft, explain a finding, or suggest what to say to your professor.'
      );
    }
    return (
      'Preview mode: this is a sample reply. In the full app, the appeal assistant uses your case context and course uploads. ' +
      `You asked: “${message.slice(0, 120)}${message.length > 120 ? '…' : ''}”`
    );
  }

  try {
    const res = await apiFetch('/v1/gemini/advocate', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history,
        ...(options?.caseContext ? { caseContext: options.caseContext } : {}),
      }),
    });
    if (!res.ok) {
      throw new Error(await readApiError(res));
    }
    const data = (await res.json()) as { text?: string };
    if (!data.text) throw new Error('Empty response from assistant.');
    return data.text;
  } catch (error) {
    console.error('Advocate API Error:', error);
    if (error instanceof Error && error.message.includes('AI analysis is coming soon')) {
      throw new Error(
        'Appeal assistant chat requires the analysis server. Sign-in and appeals work on Firebase — AI chat will connect when you deploy the API.',
      );
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to reach the appeal assistant. Try again in a moment.',
    );
  }
}
