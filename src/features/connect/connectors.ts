/**
 * Connector factory. Builds one Connector per platform from the registry,
 * with each flow declared honestly. Nothing here sends anything to a teacher
 * and nothing fakes a connection it cannot make.
 */

import { PLATFORMS } from './registry';
import { CONNECT_STRINGS as S } from './strings';
import type {
  ConnectPlatformId,
  ConnectionResult,
  Connector,
  ConnectorDeps,
} from './types';
import { DROPBOX_CONFIG, MICROSOFT_CONFIG, runPkceFlow } from './flows/pkce';

const GOOGLE_SCOPES = {
  classroom: [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
    'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
  ],
  drive: ['https://www.googleapis.com/auth/drive.readonly'],
} as const;
import { saveConnection, verifyCanvasToken } from './store';

function envString(key: string): string {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return value?.trim() ?? '';
}

function failure(
  platformId: ConnectPlatformId,
  reason: 'cancelled' | 'unavailable' | 'setup_missing' | 'error',
  message: string
): ConnectionResult {
  return { ok: false, platformId, reason, message };
}

function mapFlowError(platformId: ConnectPlatformId, err: unknown): ConnectionResult {
  const msg = err instanceof Error ? err.message : '';
  if (msg === 'cancelled') return failure(platformId, 'cancelled', S.oauthCancelled);
  return failure(platformId, 'error', S.oauthGenericError);
}

async function storeGrant(
  platformId: ConnectPlatformId,
  secret: string,
  accountLabel: string | null,
  meta?: Record<string, string>
): Promise<ConnectionResult> {
  try {
    await saveConnection({ platformId, accountLabel, secret, meta });
    return { ok: true, platformId, accountLabel };
  } catch {
    return failure(platformId, 'error', S.saveFailed);
  }
}

export function createConnectors(deps: ConnectorDeps): Connector[] {
  const dropboxAppKey = envString('VITE_DROPBOX_APP_KEY');
  const msClientId = envString('VITE_MS_CLIENT_ID');

  // A live OAuth or token flow is only offered when it can both complete and
  // be stored encrypted.
  const canRunLive = (configured: boolean): boolean =>
    configured && deps.serverAvailable;

  const oauthAvailability: Partial<Record<ConnectPlatformId, boolean>> = {
    // Google rides on the app's existing Firebase sign-in, so it needs no
    // extra configuration; the student just sees the familiar Google popup.
    google_classroom: canRunLive(true),
    google_drive: canRunLive(true),
    dropbox: canRunLive(Boolean(dropboxAppKey)),
    onedrive: canRunLive(Boolean(msClientId)),
    canvas: canRunLive(true),
  };

  const connectGoogle = async (
    platformId: ConnectPlatformId,
    scopes: readonly string[]
  ): Promise<ConnectionResult> => {
    try {
      // Lazy import keeps Firebase out of module scope for tests and for
      // screens that never touch Google.
      const { googlePortalLogin } = await import('./flows/googleFirebase');
      const grant = await googlePortalLogin([...scopes]);
      return await storeGrant(platformId, grant.accessToken, grant.accountLabel);
    } catch (err) {
      return mapFlowError(platformId, err);
    }
  };

  const connectPkce = async (
    platformId: ConnectPlatformId,
    clientId: string,
    provider: 'dropbox' | 'microsoft'
  ): Promise<ConnectionResult> => {
    try {
      const cfg = provider === 'dropbox' ? DROPBOX_CONFIG(clientId) : MICROSOFT_CONFIG(clientId);
      const grant = await runPkceFlow(cfg);
      const secret = JSON.stringify({
        accessToken: grant.accessToken,
        refreshToken: grant.refreshToken,
      });
      return await storeGrant(platformId, secret, null);
    } catch (err) {
      return mapFlowError(platformId, err);
    }
  };

  const connectCanvas = async (): Promise<ConnectionResult> => {
    const input = await deps.promptCanvasToken();
    if (!input) return failure('canvas', 'cancelled', S.oauthCancelled);
    const name = await verifyCanvasToken(input.baseUrl, input.token);
    if (name === null) return failure('canvas', 'error', S.canvasVerifyFailed);
    return storeGrant('canvas', input.token, name || null, { baseUrl: input.baseUrl });
  };

  return PLATFORMS.map((meta): Connector => {
    const base = {
      platformId: meta.platformId,
      displayName: meta.displayName,
      authMethod: meta.authMethod,
      fallbackToManualUpload: true as const,
    };

    if (meta.authMethod === 'institution_gated') {
      return {
        ...base,
        isAvailable: () => false,
        connect: () =>
          Promise.resolve(failure(meta.platformId, 'unavailable', S.institutionGatedDetail)),
      };
    }

    if (meta.authMethod === 'manual_only') {
      return {
        ...base,
        isAvailable: () => false,
        connect: () => {
          deps.openManualUpload();
          return Promise.resolve(failure(meta.platformId, 'unavailable', meta.blurb));
        },
      };
    }

    if (meta.platformId === 'canvas') {
      return {
        ...base,
        isAvailable: () => oauthAvailability.canvas === true,
        connect: connectCanvas,
      };
    }

    const available = oauthAvailability[meta.platformId] === true;
    const connect = (): Promise<ConnectionResult> => {
      if (!available) {
        return Promise.resolve(failure(meta.platformId, 'setup_missing', S.setupOnTheWay));
      }
      switch (meta.platformId) {
        case 'google_classroom':
          return connectGoogle('google_classroom', GOOGLE_SCOPES.classroom);
        case 'google_drive':
          return connectGoogle('google_drive', GOOGLE_SCOPES.drive);
        case 'dropbox':
          return connectPkce('dropbox', dropboxAppKey, 'dropbox');
        case 'onedrive':
          return connectPkce('onedrive', msClientId, 'microsoft');
        default:
          return Promise.resolve(failure(meta.platformId, 'unavailable', S.setupOnTheWay));
      }
    };
    return { ...base, isAvailable: () => available, connect };
  });
}
