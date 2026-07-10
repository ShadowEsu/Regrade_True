/**
 * Connector authorization contracts.
 * One interface for all fourteen platforms. Each connector declares its real
 * capability honestly; nothing renders a working-looking button for a flow
 * that cannot complete.
 */

export type AuthMethod =
  | 'oauth'
  | 'personal_access_token'
  | 'institution_gated'
  | 'manual_only';

export type ConnectPlatformId =
  | 'gradescope'
  | 'canvas'
  | 'google_classroom'
  | 'google_drive'
  | 'onedrive'
  | 'dropbox'
  | 'apple_files'
  | 'blackboard'
  | 'moodle'
  | 'brightspace'
  | 'schoology'
  | 'powerschool'
  | 'turnitin'
  | 'teams_assignments';

export type ConnectionResult =
  | {
      ok: true;
      platformId: ConnectPlatformId;
      accountLabel: string | null;
      /** True when preview mode simulated the flow instead of a live grant. */
      simulated: boolean;
    }
  | {
      ok: false;
      platformId: ConnectPlatformId;
      reason: 'cancelled' | 'unavailable' | 'setup_missing' | 'error';
      /** Plain, warm, honest. Shown to the student. */
      message: string;
    };

/** Narrowing helper; the project compiles without strictNullChecks, so
 * truthiness checks alone do not discriminate this union. */
export function isConnectFailure(
  r: ConnectionResult
): r is Extract<ConnectionResult, { ok: false }> {
  return r.ok === false;
}

export interface Connector {
  platformId: ConnectPlatformId;
  displayName: string;
  authMethod: AuthMethod;
  connect(): Promise<ConnectionResult>;
  /** False for institution_gated until a school partnership exists. */
  isAvailable(): boolean;
  /** Always true. Manual upload is never removed and never demoted. */
  fallbackToManualUpload: true;
}

/** A saved connection as the client sees it. Never contains the credential. */
export interface StoredConnection {
  platformId: ConnectPlatformId;
  accountLabel: string | null;
  connectedAt: string; // ISO 8601
  simulated: boolean;
}

/** Dependencies injected into the connector factory so flows stay testable. */
export interface ConnectorDeps {
  isPreview: boolean;
  /** True when the API server can store credentials encrypted at rest. */
  serverAvailable: boolean;
  /** Opens the manual upload flow. Every card can call this. */
  openManualUpload: () => void;
  /** Opens the guided Canvas token dialog; resolves null when dismissed. */
  promptCanvasToken: () => Promise<{ baseUrl: string; token: string } | null>;
}
