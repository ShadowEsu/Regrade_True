import { apiFetch } from './api';
import type { AnalysisResult } from '../types';
import { userFacingError } from './userFacingError';

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
  options?: { inlineImages?: InlineImagePart[] },
) {
  try {
    const res = await apiFetch('/v1/gemini/analyze', {
      method: 'POST',
      body: JSON.stringify({
        assignmentData,
        rubricData,
        feedbackData,
        inlineImages: options?.inlineImages ?? [],
      }),
    });
    if (!res.ok) {
      throw new Error(await readApiError(res));
    }
    return res.json() as Promise<AnalysisResult>;
  } catch (error) {
    if (error instanceof Error && error.message.includes('AI analysis is coming soon')) {
      throw error;
    }
    throw new Error(userFacingError(error, 'Analysis could not be completed. Try clearer photos, or paste text from the rubric and feedback.'));
  }
}

export async function chatWithAdvocate(
  message: string,
  history: { role: 'user' | 'model'; text: string }[],
  options?: { caseContext?: string },
) {
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
    if (error instanceof Error && error.message.includes('AI analysis is coming soon')) {
      throw new Error(
        'Appeal assistant chat requires the analysis server. Sign-in and appeals work on Firebase — AI chat will connect when you deploy the API.',
      );
    }
    throw new Error(userFacingError(error, 'Mr Whale could not respond. Check your connection and try again.'));
  }
}
