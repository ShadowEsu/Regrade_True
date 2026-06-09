import { auth } from './firebase';

/**
 * Remote API origin when the backend is on another host (production).
 * When unset, requests use same-origin `/api/...` (Vite dev proxy → Express).
 */
export function isRemoteApiConfigured(): boolean {
  return Boolean(import.meta.env.VITE_API_BASE_URL?.trim());
}

/** True when AI routes can reach the Node server (local proxy or remote URL). */
export function isApiLikelyAvailable(): boolean {
  return import.meta.env.DEV || isRemoteApiConfigured();
}

export const API_NOT_DEPLOYED_MESSAGE =
  'AI analysis is coming soon. Sign-in, profile, and saving appeals work on Firebase — connect the analysis API when you deploy the server (set VITE_API_BASE_URL).';

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const remote = import.meta.env.VITE_API_BASE_URL?.trim();
  if (remote) {
    return `${remote.replace(/\/$/, '')}${p}`;
  }
  return `/api${p}`;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!isApiLikelyAvailable()) {
    throw new Error(API_NOT_DEPLOYED_MESSAGE);
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to use this feature.');
  }
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(apiUrl(path), { ...init, headers });
}
