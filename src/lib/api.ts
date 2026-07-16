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
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
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
    let response = await fetch(apiUrl(path), { ...init, headers, signal: controller.signal });
    // A persisted Firebase session can briefly hold an ID token minted before
    // an emulator/server restart or token revocation check. A 401 means the
    // server did not execute the requested mutation, so one forced refresh is
    // safe even for POST/PATCH requests.
    if (response.status === 401 && auth.currentUser?.uid === user.uid) {
      try {
        headers.set('Authorization', `Bearer ${await user.getIdToken(true)}`);
      } catch {
        await auth.signOut().catch(() => undefined);
        throw new Error('SESSION_EXPIRED');
      }
      response = await fetch(apiUrl(path), { ...init, headers, signal: controller.signal });
      if (response.status === 401) {
        await auth.signOut().catch(() => undefined);
      }
    }
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
      throw new Error('Your session expired. Sign in again to continue.');
    }
    if (controller.signal.aborted) throw new Error('The request timed out. Check your connection and try again.');
    throw new Error('Regrade could not reach the service. Check your connection and try again.');
  } finally {
    window.clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', abortFromExternal);
  }
}
