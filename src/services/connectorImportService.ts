import { apiFetch } from '../lib/api';
import { isPreviewMode } from '../lib/previewMode';

export type ImportItem = { externalId: string; platformId: string; title: string; course?: string | null; gradedAt?: string | null; score?: number | string | null; pointsPossible?: number | null; kind: 'graded_record' | 'file' };
export const IMPORTABLE_PLATFORMS = new Set(['canvas', 'google_classroom', 'google_drive', 'dropbox', 'onedrive']);

async function payload<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as T | { error?: { message?: string } } | null;
  if (!response.ok) throw new Error((body as { error?: { message?: string } } | null)?.error?.message ?? 'The platform did not respond.');
  return body as T;
}

export const connectorImportService = {
  async list(platformId: string): Promise<ImportItem[]> {
    if (isPreviewMode()) return [];
    return (await payload<{ items: ImportItem[] }>(await apiFetch(`/v1/imports/${encodeURIComponent(platformId)}/items?mode=manual`))).items;
  },
  async importManual(platformId: string, externalId: string): Promise<void> {
    if (isPreviewMode()) return;
    await payload(await apiFetch(`/v1/imports/${encodeURIComponent(platformId)}/manual`, { method: 'POST', body: JSON.stringify({ externalId }) }));
  },
  async runAutomatic(platformId: string): Promise<{ imported: number; ignoredOlderCount: number }> {
    if (isPreviewMode()) return { imported: 0, ignoredOlderCount: 0 };
    return payload(await apiFetch(`/v1/imports/${encodeURIComponent(platformId)}/automatic`, { method: 'POST' }));
  },
};
