import assert from 'node:assert/strict';
import test from 'node:test';
import { automaticImportCandidates } from '../src/importPolicy.js';
import { isAllowedInlineImageMime, isPreviewOrFakeFirebaseToken } from '../src/security/inputGuards.js';
import { loadEnv } from '../src/env.js';

const now = new Date('2026-07-12T12:00:00.000Z');

test('automatic imports include only unique graded records from the last seven days', () => {
  const result = automaticImportCandidates([
    { externalId: 'recent', platformId: 'canvas', title: 'Recent', kind: 'graded_record', gradedAt: '2026-07-10T12:00:00.000Z' },
    { externalId: 'recent', platformId: 'canvas', title: 'Duplicate', kind: 'graded_record', gradedAt: '2026-07-11T12:00:00.000Z' },
    { externalId: 'old', platformId: 'canvas', title: 'Old', kind: 'graded_record', gradedAt: '2026-07-01T12:00:00.000Z' },
    { externalId: 'future', platformId: 'canvas', title: 'Future', kind: 'graded_record', gradedAt: '2026-07-13T12:00:00.000Z' },
    { externalId: 'file', platformId: 'google_drive', title: 'File', kind: 'file', gradedAt: '2026-07-12T11:00:00.000Z' },
  ], now);
  assert.deepEqual(result.map((item) => item.externalId), ['recent']);
});

test('inline images reject active-content formats and preview tokens are identifiable', () => {
  assert.equal(isAllowedInlineImageMime('image/png'), true);
  assert.equal(isAllowedInlineImageMime('image/svg+xml'), false);
  assert.equal(isAllowedInlineImageMime('text/html'), false);
  assert.equal(isPreviewOrFakeFirebaseToken('preview-id-token'), true);
  assert.equal(isPreviewOrFakeFirebaseToken('real-looking-token'), false);
});

test('production environment fails closed when critical configuration is missing', () => {
  assert.throws(() => loadEnv({ NODE_ENV: 'production', CORS_ORIGIN: '*' }), /Invalid environment/);
});
