import { getToken } from 'firebase/app-check';
import { appCheck, auth } from './firebase';

/**
 * Remote API origin when the backend is on another host (production).
 * When unset, requests use same-origin `/api/...` (Vite dev proxy → Express).
 */
export function isRemoteApiConfigured(): boolean {
  return Boolean(import.meta.env.VITE_API_BASE_URL?.trim());
}

/** True when AI routes can reach the Node server (local proxy or remote URL). */
export function isApiLikelyAvailable(): boolean {
  if (import.meta.env.DEV) return true;
  if (isRemoteApiConfigured()) return true;
  // Electron desktop shell serves the UI and proxies /api to the local Express API.
  if (import.meta.env.VITE_DESKTOP_SHELL === 'true') return true;
  // Capacitor / static hosting without a proxy need VITE_API_BASE_URL.
  return false;
}

export const API_NOT_DEPLOYED_MESSAGE =
  'AI analysis is coming soon. Sign-in, profile, and saving appeals work on Firebase — connect the analysis API when you deploy the server (set VITE_API_BASE_URL).';

const API_TIMEOUT_MS = 25_000;

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
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('You appear to be offline. Reconnect and try again.');
  }
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Authorization', `Bearer ${token}`);
  if (appCheck) {
    const appCheckToken = await getToken(appCheck, false);
    headers.set('X-Firebase-AppCheck', appCheckToken.token);
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const externalSignal = init.signal;
  const abortFromExternal = () => controller.abort();
  externalSignal?.addEventListener('abort', abortFromExternal, { once: true });
  try {
    return await fetch(apiUrl(path), { ...init, headers, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw new Error('The request timed out. Check your connection and try again.');
    throw new Error('Regrade could not reach the service. Check your connection and try again.');
  } finally {
    window.clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', abortFromExternal);
  }
}
