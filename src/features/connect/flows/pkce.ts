/**
 * Generic OAuth 2.0 authorization-code flow with PKCE for public clients,
 * used by Dropbox and Microsoft (OneDrive). Both providers document PKCE for
 * browser apps and allow CORS on their token endpoints for registered SPA
 * clients. The authorization code and verifier travel in the POST body only;
 * nothing secret ever rides in a URL we build. The redirect lands on
 * /oauth-callback.html, which posts the code back to this window and closes.
 */

import { assertNoSecretInUrl } from './urlGuards';

export interface PkceProviderConfig {
  authorizeEndpoint: string;
  tokenEndpoint: string;
  clientId: string;
  scope: string;
  /** Extra fixed params some providers require (e.g. token_access_type). */
  extraAuthParams?: Record<string, string>;
}

export interface PkceGrant {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  raw: Record<string, string | number | boolean | null>;
}

function randomString(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Base64Url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  const bin = String.fromCharCode(...new Uint8Array(digest));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function redirectUri(): string {
  return `${window.location.origin}/oauth-callback.html`;
}

export function buildAuthorizeUrl(
  cfg: PkceProviderConfig,
  state: string,
  codeChallenge: string
): string {
  const url = new URL(cfg.authorizeEndpoint);
  url.searchParams.set('client_id', cfg.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri());
  url.searchParams.set('scope', cfg.scope);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  for (const [k, v] of Object.entries(cfg.extraAuthParams ?? {})) {
    url.searchParams.set(k, v);
  }
  const built = url.toString();
  assertNoSecretInUrl(built);
  return built;
}

/** Waits for the callback page to post {source, code, state} back to us. */
function waitForCallback(expectedState: string, popup: Window | null): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = window.setInterval(() => {
      if (popup && popup.closed) {
        cleanup();
        reject(new Error('cancelled'));
      }
    }, 500);
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { source?: string; code?: string; state?: string; error?: string };
      if (data?.source !== 'regrade-oauth') return;
      cleanup();
      if (data.error) {
        reject(new Error(data.error === 'access_denied' ? 'cancelled' : data.error));
      } else if (data.code && data.state === expectedState) {
        resolve(data.code);
      } else {
        reject(new Error('state_mismatch'));
      }
    };
    const cleanup = () => {
      window.clearInterval(timer);
      window.removeEventListener('message', onMessage);
    };
    window.addEventListener('message', onMessage);
  });
}

export async function runPkceFlow(cfg: PkceProviderConfig): Promise<PkceGrant> {
  const state = randomString(16);
  const verifier = randomString(48);
  const challenge = await sha256Base64Url(verifier);
  const authUrl = buildAuthorizeUrl(cfg, state, challenge);

  const popup = window.open(authUrl, 'regrade-connect', 'popup,width=480,height=720');
  const code = await waitForCallback(state, popup);

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: cfg.clientId,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
  });
  const res = await fetch(cfg.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error('token_exchange_failed');
  const json = (await res.json()) as Record<string, string | number | boolean | null>;
  const accessToken = typeof json.access_token === 'string' ? json.access_token : '';
  if (!accessToken) throw new Error('token_exchange_failed');
  return {
    accessToken,
    refreshToken: typeof json.refresh_token === 'string' ? json.refresh_token : null,
    expiresIn: typeof json.expires_in === 'number' ? json.expires_in : null,
    raw: json,
  };
}

export const DROPBOX_CONFIG = (clientId: string): PkceProviderConfig => ({
  authorizeEndpoint: 'https://www.dropbox.com/oauth2/authorize',
  tokenEndpoint: 'https://api.dropboxapi.com/oauth2/token',
  clientId,
  scope: 'files.metadata.read files.content.read',
  extraAuthParams: { token_access_type: 'offline' },
});

export const MICROSOFT_CONFIG = (clientId: string): PkceProviderConfig => ({
  authorizeEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  clientId,
  scope: 'Files.Read offline_access openid profile',
});
