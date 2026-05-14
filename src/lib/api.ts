import { auth } from './firebase';

/**
 * Remote API origin when the backend is on another host (production).
 * When unset, requests use same-origin `/api/...` (Vite dev proxy → Express).
 */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const remote = import.meta.env.VITE_API_BASE_URL?.trim();
  if (remote) {
    return `${remote.replace(/\/$/, '')}${p}`;
  }
  return `/api${p}`;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
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
