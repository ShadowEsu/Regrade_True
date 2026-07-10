/**
 * Connection persistence.
 * Real mode: credentials go to the API server in a POST/PUT body over TLS and
 * are encrypted at rest there. The client keeps only labels and timestamps.
 * Preview mode: simulated entries in localStorage, never any secret material.
 * Revoking deletes the stored credential immediately on the server.
 */

import { apiFetch, isApiLikelyAvailable } from '../../lib/api';
import { isPreviewMode } from '../../lib/previewMode';
import type { ConnectPlatformId, StoredConnection } from './types';

const PREVIEW_KEY = 'rg.connections.preview.v1';

function readPreview(): StoredConnection[] {
  try {
    const raw = localStorage.getItem(PREVIEW_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredConnection[]) : [];
  } catch {
    return [];
  }
}

function writePreview(list: StoredConnection[]): void {
  localStorage.setItem(PREVIEW_KEY, JSON.stringify(list));
}

export function canStoreSecurely(): boolean {
  return isApiLikelyAvailable();
}

export async function listConnections(): Promise<StoredConnection[]> {
  if (isPreviewMode()) return readPreview();
  if (!isApiLikelyAvailable()) return [];
  const res = await apiFetch('/v1/connections');
  if (!res.ok) return [];
  const json = (await res.json()) as { connections?: StoredConnection[] };
  return json.connections ?? [];
}

export interface SaveConnectionInput {
  platformId: ConnectPlatformId;
  accountLabel: string | null;
  /** The credential. Travels in the request body only, never a URL. */
  secret: string;
  meta?: Record<string, string>;
}

export async function saveConnection(input: SaveConnectionInput): Promise<StoredConnection> {
  if (isPreviewMode()) {
    // Simulated: keep the label, drop the secret on the floor.
    const entry: StoredConnection = {
      platformId: input.platformId,
      accountLabel: input.accountLabel,
      connectedAt: new Date().toISOString(),
      simulated: true,
    };
    writePreview([...readPreview().filter((c) => c.platformId !== input.platformId), entry]);
    return entry;
  }
  const res = await apiFetch(`/v1/connections/${input.platformId}`, {
    method: 'PUT',
    body: JSON.stringify({
      accountLabel: input.accountLabel,
      secret: input.secret,
      meta: input.meta ?? {},
    }),
  });
  if (!res.ok) throw new Error('save_failed');
  return {
    platformId: input.platformId,
    accountLabel: input.accountLabel,
    connectedAt: new Date().toISOString(),
    simulated: false,
  };
}

export async function revokeConnection(platformId: ConnectPlatformId): Promise<void> {
  if (isPreviewMode()) {
    writePreview(readPreview().filter((c) => c.platformId !== platformId));
    return;
  }
  const res = await apiFetch(`/v1/connections/${platformId}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error('revoke_failed');
}

export async function verifyCanvasToken(baseUrl: string, token: string): Promise<string | null> {
  if (isPreviewMode()) return 'Preview Student';
  const res = await apiFetch('/v1/connections/canvas/verify', {
    method: 'POST',
    body: JSON.stringify({ baseUrl, token }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { ok?: boolean; name?: string | null };
  return json.ok ? (json.name ?? '') : null;
}
