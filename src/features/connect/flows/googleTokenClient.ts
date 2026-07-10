/**
 * Google OAuth via Google Identity Services (the token client model, which is
 * the documented pattern for browser apps and is CORS-safe). Reuses the same
 * OAuth client the project registers for web sign-in; the id comes from
 * VITE_GOOGLE_OAUTH_CLIENT_ID so no secret lives in source.
 */

interface TokenResponse {
  access_token?: string;
  error?: string;
}

interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

interface GoogleAccountsOauth2 {
  initTokenClient: (cfg: {
    client_id: string;
    scope: string;
    callback: (resp: TokenResponse) => void;
    error_callback?: (err: { type?: string }) => void;
  }) => TokenClient;
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleAccountsOauth2 } };
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';
let gisLoading: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!gisLoading) {
    gisLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gisLoading = null;
        reject(new Error('gis_load_failed'));
      };
      document.head.appendChild(script);
    });
  }
  return gisLoading;
}

export const GOOGLE_SCOPES = {
  classroom:
    'https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
  drive: 'https://www.googleapis.com/auth/drive.readonly',
} as const;

export async function requestGoogleAccessToken(
  clientId: string,
  scope: string
): Promise<string> {
  await loadGis();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error('gis_load_failed');
  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope,
      callback: (resp) => {
        if (resp.access_token) resolve(resp.access_token);
        else reject(new Error(resp.error === 'access_denied' ? 'cancelled' : 'error'));
      },
      error_callback: (err) => {
        reject(new Error(err?.type === 'popup_closed' ? 'cancelled' : 'error'));
      },
    });
    client.requestAccessToken();
  });
}
