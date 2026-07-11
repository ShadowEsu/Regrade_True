import { describe, expect, it } from 'vitest';
import { automaticImportCandidates, type ConnectorImportItem } from '../../server/src/importPolicy';

const now = new Date('2026-07-10T12:00:00Z');
const item = (id: string, gradedAt: string | null, kind: 'graded_record' | 'file' = 'graded_record'): ConnectorImportItem => ({ externalId: id, platformId: 'canvas', title: id, gradedAt, kind });

describe('seven-day automatic import policy', () => {
  it('includes a newly graded exam', () => expect(automaticImportCandidates([item('new', '2026-07-04T12:00:01Z')], now)).toHaveLength(1));
  it('excludes work older than exactly seven days', () => expect(automaticImportCandidates([item('old', '2026-07-03T11:59:59Z')], now)).toHaveLength(0));
  it('excludes files and invalid/future timestamps', () => expect(automaticImportCandidates([item('file', null, 'file'), item('future', '2026-07-11T12:00:00Z')], now)).toHaveLength(0));
  it('deduplicates provider records', () => expect(automaticImportCandidates([item('same', '2026-07-10T10:00:00Z'), item('same', '2026-07-10T10:00:00Z')], now)).toHaveLength(1));
});
