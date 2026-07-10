import { describe, expect, it, vi } from 'vitest';

// Sever the firebase import chain (store -> lib/api -> lib/firebase); none of
// these paths run in the scenarios below.
vi.mock('../store', () => ({
  saveConnection: vi.fn(),
  verifyCanvasToken: vi.fn(),
  listConnections: vi.fn().mockResolvedValue([]),
  revokeConnection: vi.fn(),
  canStoreSecurely: vi.fn().mockReturnValue(true),
}));

import { PLATFORMS } from '../registry';
import { createConnectors } from '../connectors';
import { buildAuthorizeUrl, DROPBOX_CONFIG, MICROSOFT_CONFIG } from '../flows/pkce';
import { looksLikeCanvasToken, normalizeCanvasBaseUrl } from '../flows/urlGuards';
import { isConnectFailure, type ConnectorDeps } from '../types';

function deps(overrides: Partial<ConnectorDeps> = {}): ConnectorDeps {
  return {
    isPreview: false,
    serverAvailable: true,
    openManualUpload: vi.fn(),
    promptCanvasToken: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe('platform registry', () => {
  it('keeps the core platforms first and catalogs at least thirty global sources', () => {
    expect(PLATFORMS.slice(0, 14).map((p) => p.platformId)).toEqual([
      'gradescope',
      'canvas',
      'google_classroom',
      'google_drive',
      'onedrive',
      'dropbox',
      'apple_files',
      'blackboard',
      'moodle',
      'brightspace',
      'schoology',
      'powerschool',
      'turnitin',
      'teams_assignments',
    ]);
    expect(PLATFORMS.length).toBeGreaterThanOrEqual(30);
    expect(PLATFORMS.some((p) => p.region?.includes('India'))).toBe(true);
    expect(PLATFORMS.some((p) => p.region?.includes('China'))).toBe(true);
  });

  it('declares each auth method honestly', () => {
    const methods = Object.fromEntries(PLATFORMS.map((p) => [p.platformId, p.authMethod]));
    expect(methods.gradescope).toBe('manual_only');
    expect(methods.canvas).toBe('personal_access_token');
    expect(methods.google_classroom).toBe('oauth');
    expect(methods.google_drive).toBe('oauth');
    expect(methods.onedrive).toBe('oauth');
    expect(methods.dropbox).toBe('oauth');
    expect(methods.apple_files).toBe('manual_only');
    for (const gated of [
      'blackboard',
      'moodle',
      'brightspace',
      'schoology',
      'powerschool',
      'turnitin',
      'teams_assignments',
    ]) {
      expect(methods[gated]).toBe('institution_gated');
    }
    for (const platform of PLATFORMS) {
      if (platform.apiStatus === 'public_api' || platform.apiStatus === 'partner_api') {
        expect(platform.authMethod).toBe('institution_gated');
      }
    }
  });
});

describe('connectors', () => {
  it('every connector keeps manual upload as a permanent fallback', () => {
    for (const c of createConnectors(deps())) {
      expect(c.fallbackToManualUpload).toBe(true);
    }
  });

  it('institution gated connectors are unavailable and say so without faking', async () => {
    const connectors = createConnectors(deps());
    const gated = connectors.filter((c) => c.authMethod === 'institution_gated');
    expect(gated.length).toBeGreaterThanOrEqual(25);
    for (const c of gated) {
      expect(c.isAvailable()).toBe(false);
      const result = await c.connect();
      expect(isConnectFailure(result) && result.reason).toBe('unavailable');
    }
  });

  it('manual only connectors route straight to manual upload', async () => {
    const d = deps();
    const connectors = createConnectors(d);
    const gradescope = connectors.find((c) => c.platformId === 'gradescope');
    expect(gradescope?.isAvailable()).toBe(false);
    const result = await gradescope?.connect();
    expect(d.openManualUpload).toHaveBeenCalledTimes(1);
    expect(result?.ok).toBe(false);
  });

  it('google connects through the existing sign-in with no extra setup', () => {
    const connectors = createConnectors(deps());
    for (const id of ['google_classroom', 'google_drive', 'canvas'] as const) {
      expect(connectors.find((x) => x.platformId === id)?.isAvailable()).toBe(true);
    }
  });

  it('oauth connectors without configured client ids are honestly unavailable', () => {
    const connectors = createConnectors(deps());
    for (const id of ['onedrive', 'dropbox'] as const) {
      expect(connectors.find((x) => x.platformId === id)?.isAvailable()).toBe(false);
    }
  });

  it('nothing is live-connectable when credentials cannot be stored encrypted', () => {
    const connectors = createConnectors(deps({ serverAvailable: false }));
    for (const id of ['google_classroom', 'google_drive', 'canvas', 'onedrive', 'dropbox'] as const) {
      expect(connectors.find((x) => x.platformId === id)?.isAvailable()).toBe(false);
    }
  });

  it('preview mode makes connectable platforms available with simulated flows', () => {
    const connectors = createConnectors(deps({ isPreview: true, serverAvailable: false }));
    for (const id of ['canvas', 'google_classroom', 'google_drive', 'onedrive', 'dropbox'] as const) {
      expect(connectors.find((x) => x.platformId === id)?.isAvailable()).toBe(true);
    }
  });

  it('cancelling the canvas dialog reports cancelled, not an error', async () => {
    const connectors = createConnectors(deps());
    const canvas = connectors.find((c) => c.platformId === 'canvas');
    const result = await canvas?.connect();
    expect(result && isConnectFailure(result) && result.reason).toBe('cancelled');
  });
});

describe('canvas input guards', () => {
  it('accepts a real school canvas address and normalizes it', () => {
    expect(normalizeCanvasBaseUrl('yourschool.instructure.com/')).toBe(
      'https://yourschool.instructure.com'
    );
    expect(normalizeCanvasBaseUrl('https://canvas.university.edu')).toBe(
      'https://canvas.university.edu'
    );
  });

  it('rejects http, IP literals, localhost, and private hosts', () => {
    expect(normalizeCanvasBaseUrl('http://school.edu')).toBeNull();
    expect(normalizeCanvasBaseUrl('https://127.0.0.1')).toBeNull();
    expect(normalizeCanvasBaseUrl('https://localhost')).toBeNull();
    expect(normalizeCanvasBaseUrl('https://10.0.0.5')).toBeNull();
    expect(normalizeCanvasBaseUrl('https://intranet.local')).toBeNull();
    expect(normalizeCanvasBaseUrl('not a url')).toBeNull();
  });

  it('rejects obviously wrong tokens', () => {
    expect(looksLikeCanvasToken('short')).toBe(false);
    expect(looksLikeCanvasToken('has spaces in the middle of it all')).toBe(false);
    expect(looksLikeCanvasToken('1050~aVeryLongOpaqueCanvasTokenValue123')).toBe(true);
  });
});

describe('oauth url hygiene', () => {
  it('authorize URLs carry PKCE params and never credential material', () => {
    for (const cfg of [DROPBOX_CONFIG('client-id'), MICROSOFT_CONFIG('client-id')]) {
      const url = new URL(buildAuthorizeUrl(cfg, 'state123', 'challenge456'));
      expect(url.searchParams.get('code_challenge')).toBe('challenge456');
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('state')).toBe('state123');
      for (const banned of ['token', 'access_token', 'secret', 'password', 'code_verifier']) {
        expect(url.searchParams.has(banned)).toBe(false);
      }
    }
  });
});
