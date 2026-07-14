import { apiFetch } from '../lib/api';
import type { Case } from './caseService';

export type FamilySuggestion = { id: string; caseId: string; title: string };
export type FamilyLink = {
  id: string;
  status: 'pending' | 'active';
  counterpartName: string;
  counterpartAvatarUrl?: string;
  gradeLevel?: string;
  school?: string;
  canViewSharedWork: boolean;
  permissions?: FamilyPermissions;
  suggestions?: FamilySuggestion[];
};
export type FamilyPermissions = { viewExams: boolean; viewAiFindings: boolean; viewAppealDrafts: boolean; receiveNotifications: boolean };
export type FamilyStatus = { role: 'student' | 'supervisor'; links: FamilyLink[] };

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  const body = await response.json().catch(() => null) as T | { error?: { message?: string } } | null;
  if (!response.ok) throw new Error((body as { error?: { message?: string } } | null)?.error?.message ?? 'Family connection request failed.');
  return body as T;
}

export const familyService = {
  async status(): Promise<FamilyStatus> {
    return json('/v1/family/status');
  },
  async createCode(): Promise<{ code: string; expiresAt: string }> {
    return json('/v1/family/code', { method: 'POST' });
  },
  async redeem(code: string): Promise<void> {
    await json('/v1/family/redeem', { method: 'POST', body: JSON.stringify({ code }) });
  },
  async approve(linkId: string): Promise<void> {
    await json(`/v1/family/links/${encodeURIComponent(linkId)}/approve`, { method: 'POST' });
  },
  async unlink(linkId: string): Promise<void> {
    const response = await apiFetch(`/v1/family/links/${encodeURIComponent(linkId)}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Could not remove this family connection.');
  },
  async updatePermissions(linkId: string, permissions: FamilyPermissions): Promise<void> {
    await json(`/v1/family/links/${encodeURIComponent(linkId)}/permissions`, { method: 'PATCH', body: JSON.stringify(permissions) });
  },
  async sharedCases(linkId: string): Promise<Case[]> {
    return (await json<{ cases: Case[] }>(`/v1/family/links/${encodeURIComponent(linkId)}/cases`)).cases;
  },
  async suggestReview(linkId: string, caseId: string): Promise<void> {
    await json(`/v1/family/links/${encodeURIComponent(linkId)}/cases/${encodeURIComponent(caseId)}/suggest`, { method: 'POST' });
  },
  async acknowledgeSuggestion(linkId: string, suggestionId: string): Promise<void> {
    await json(`/v1/family/links/${encodeURIComponent(linkId)}/suggestions/${encodeURIComponent(suggestionId)}/acknowledge`, { method: 'POST' });
  },
};
