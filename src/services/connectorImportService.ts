import { apiFetch } from '../lib/api';

export type ImportItem = { externalId: string; platformId: string; title: string; course?: string | null; gradedAt?: string | null; score?: number | string | null; pointsPossible?: number | null; feedback?: string | null; kind: 'graded_record' | 'file'; assessmentType?: 'exam' | 'quiz' | 'test' | 'assessment' | 'assignment' | 'unknown' };
export const IMPORTABLE_PLATFORMS = new Set(['canvas', 'google_classroom', 'google_drive', 'dropbox', 'onedrive']);

async function payload<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as T | { error?: { message?: string } } | null;
  if (!response.ok) throw new Error((body as { error?: { message?: string } } | null)?.error?.message ?? 'The platform did not respond.');
  return body as T;
}

export const connectorImportService = {
  async list(platformId: string): Promise<ImportItem[]> {
    return (await payload<{ items: ImportItem[] }>(await apiFetch(`/v1/imports/${encodeURIComponent(platformId)}/items?mode=manual`))).items;
  },
  async importManual(platformId: string, externalId: string): Promise<void> {
    await payload(await apiFetch(`/v1/imports/${encodeURIComponent(platformId)}/manual`, { method: 'POST', body: JSON.stringify({ externalId }) }));
  },
  async runAutomatic(platformId: string): Promise<{ imported: number; ignoredOlderCount: number; ignoredNonExamCount: number }> {
    return payload(await apiFetch(`/v1/imports/${encodeURIComponent(platformId)}/automatic`, { method: 'POST' }));
  },
};
