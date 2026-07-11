import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isPreviewMode } from '../../lib/previewMode';
import CanvasTokenDialog from './CanvasTokenDialog';
import { createConnectors } from './connectors';
import { filterPlatforms, getPlatformMeta, type PlatformMeta } from './registry';
import { canStoreSecurely, listConnections, revokeConnection } from './store';
import { CONNECT_STRINGS as S } from './strings';
import { isConnectFailure, type ConnectPlatformId, type Connector, type StoredConnection } from './types';
import { connectorImportService, IMPORTABLE_PLATFORMS, type ImportItem } from '../../services/connectorImportService';

/**
 * The unified Connect screen. Every platform gets one card in one list.
 * Cards that can genuinely connect show a Connect button. Cards that cannot
 * say so honestly. Manual upload is available on every single card, always.
 */
const FEATURED_PLATFORM_IDS: ConnectPlatformId[] = ['google_classroom', 'canvas', 'moodle'];

export default function ConnectScreen({
  onManualUpload,
  onConnected,
  compact = false,
}: {
  onManualUpload: () => void;
  /** Lets onboarding advance after a real or preview connection succeeds. */
  onConnected?: () => void;
  /** Keeps this surface focused when it appears in first-run setup. */
  compact?: boolean;
}) {
  const [connections, setConnections] = useState<StoredConnection[]>([]);
  const [busy, setBusy] = useState<ConnectPlatformId | null>(null);
  const [notes, setNotes] = useState<Partial<Record<ConnectPlatformId, string>>>({});
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [query, setQuery] = useState('');
  const canvasResolver = useRef<((v: { baseUrl: string; token: string } | null) => void) | null>(null);

  const promptCanvasToken = useCallback(() => {
    setCanvasOpen(true);
    return new Promise<{ baseUrl: string; token: string } | null>((resolve) => {
      canvasResolver.current = resolve;
    });
  }, []);

  const connectors = createConnectors({
    isPreview: isPreviewMode(),
    serverAvailable: canStoreSecurely(),
    openManualUpload: onManualUpload,
    promptCanvasToken,
  });
  const byId = new Map(connectors.map((c) => [c.platformId, c]));

  useEffect(() => {
    void listConnections().then(setConnections).catch(() => setConnections([]));
  }, []);

  const connectionFor = (id: ConnectPlatformId) => connections.find((c) => c.platformId === id);

  const handleConnect = async (connector: Connector) => {
    setBusy(connector.platformId);
    setNotes((n) => ({ ...n, [connector.platformId]: undefined }));
    try {
      const result = await connector.connect();
      if (isConnectFailure(result)) {
        if (result.reason !== 'cancelled') {
          setNotes((n) => ({ ...n, [connector.platformId]: result.message }));
        }
      } else {
        setConnections(await listConnections());
        setNotes((n) => ({
          ...n,
          [connector.platformId]: result.simulated ? S.previewSimulatedNote : S.savedSecurely,
        }));
        onConnected?.();
      }
    } finally {
      setBusy(null);
    }
  };

  const visiblePlatforms = query.trim()
    ? filterPlatforms(query)
    : FEATURED_PLATFORM_IDS.map(getPlatformMeta);

  const handleRevoke = async (id: ConnectPlatformId) => {
    if (!window.confirm(S.disconnectConfirm)) return;
    await revokeConnection(id);
    setConnections(await listConnections());
    setNotes((n) => ({ ...n, [id]: undefined }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[17px] font-semibold text-ink">{S.screenTitle}</h2>
        <p className="text-[13px] text-ink-muted leading-relaxed mt-1">
          Search {connectors.length} supported sources by platform or country. You can always upload a PDF or screenshot instead.
        </p>
      </div>

      <label className="relative block">
        <span className="sr-only">Search platforms</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a platform, country, or school system…"
          className="rg-glass-field w-full pl-10 py-3 text-[14px]"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/65" aria-hidden>
          ⌕
        </span>
      </label>

      {!query.trim() && (
        <div className="flex flex-wrap gap-2" aria-label="Suggested platforms">
          {FEATURED_PLATFORM_IDS.map((id) => {
            const platform = getPlatformMeta(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => setQuery(platform.displayName)}
                className="rg-glass-chip px-3 py-1.5 text-[12px] font-semibold text-primary"
              >
                {platform.displayName}
              </button>
            );
          })}
        </div>
      )}

      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {!query.trim() && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Popular choices</p>
        )}
        {visiblePlatforms.map((meta) => {
          const connector = byId.get(meta.platformId);
          if (!connector) return null;
          return (
            <PlatformCard
              key={meta.platformId}
              meta={meta}
              connector={connector}
              connection={connectionFor(meta.platformId)}
              busy={busy === meta.platformId}
              note={notes[meta.platformId]}
              onConnect={() => void handleConnect(connector)}
              onRevoke={() => void handleRevoke(meta.platformId)}
              onManualUpload={onManualUpload}
            />
          );
        })}
        {query.trim() && visiblePlatforms.length === 0 && (
          <div className="rg-glass-form-card p-4 text-[13px] text-ink-muted">
            No exact match yet. Upload the marked file now and Regrade can still analyze it.
          </div>
        )}
      </div>

      <CanvasTokenDialog
        open={canvasOpen}
        onSubmit={(input) => {
          setCanvasOpen(false);
          canvasResolver.current?.(input);
          canvasResolver.current = null;
        }}
        onCancel={() => {
          setCanvasOpen(false);
          canvasResolver.current?.(null);
          canvasResolver.current = null;
        }}
      />
    </div>
  );
}

interface PlatformCardProps {
  meta: PlatformMeta;
  connector: Connector;
  connection: StoredConnection | undefined;
  busy: boolean;
  note: string | undefined;
  onConnect: () => void;
  onRevoke: () => void;
  onManualUpload: () => void;
}

const PlatformCard: React.FC<PlatformCardProps> = ({
  meta,
  connector,
  connection,
  busy,
  note,
  onConnect,
  onRevoke,
  onManualUpload,
}) => {
  const [importItems, setImportItems] = useState<ImportItem[] | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importNote, setImportNote] = useState<string | null>(null);
  const connectable = connector.isAvailable() && !connection;
  const canImport = Boolean(connection && IMPORTABLE_PLATFORMS.has(meta.platformId));
  const browse = async () => { setImportBusy(true); setImportNote(null); try { const items = await connectorImportService.list(meta.platformId); setImportItems(items); if (!items.length) setImportNote('No graded records or files were returned.'); } catch (e) { setImportNote(e instanceof Error ? e.message : 'The platform did not respond.'); } finally { setImportBusy(false); } };
  const importOne = async (item: ImportItem) => { setImportBusy(true); setImportNote(null); try { await connectorImportService.importManual(meta.platformId, item.externalId); setImportNote(`${item.title} is ready in Regrade. Manual imports can be any age.`); } catch (e) { setImportNote(e instanceof Error ? e.message : 'Import failed.'); } finally { setImportBusy(false); } };
  const checkRecent = async () => { setImportBusy(true); setImportNote(null); try { const result = await connectorImportService.runAutomatic(meta.platformId); setImportNote(result.imported ? `${result.imported} recent graded item${result.imported === 1 ? '' : 's'} imported. ${result.ignoredOlderCount} older item${result.ignoredOlderCount === 1 ? '' : 's'} ignored.` : `No new grades in the last seven days. ${result.ignoredOlderCount} older item${result.ignoredOlderCount === 1 ? '' : 's'} left untouched.`); } catch (e) { setImportNote(e instanceof Error ? e.message : 'Automatic check failed.'); } finally { setImportBusy(false); } };

  return (
    <div className="rg-glass-form-card p-4 space-y-3" data-platform={meta.platformId}>
      <div className="flex items-center gap-3">
        {meta.logo ? (
          <img src={meta.logo} alt="" className="w-8 h-8 rounded-lg object-contain shrink-0" />
        ) : (
          <span
            aria-hidden
            className="w-8 h-8 rounded-lg text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: meta.brandColor ?? '#3765D2' }}
          >
            {meta.brandMark ?? meta.displayName.charAt(0)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-ink truncate">{meta.displayName}</p>
          {connection ? (
            <p className="text-[12px] text-primary font-medium">
              {connection.simulated ? S.simulatedBadge : S.connectedBadge}
              {connection.accountLabel ? ` · ${connection.accountLabel}` : ''}
            </p>
          ) : (
            meta.authMethod === 'institution_gated' && (
              <p className="text-[12px] text-ink-muted font-medium">{S.institutionGated}</p>
            )
          )}
        </div>
      </div>

      {(meta.region || meta.apiStatus) && (
        <div className="flex flex-wrap gap-1.5" aria-label="Connection details">
          {meta.region && (
            <span className="inline-flex rounded-md border border-hairline bg-parchment px-2 py-1 text-[10px] font-medium text-ink-muted">
              {meta.region}
            </span>
          )}
          {meta.apiStatus && (
            <span className="inline-flex rounded-md border border-hairline bg-parchment px-2 py-1 text-[10px] font-medium text-ink-muted">
              {meta.apiStatus === 'live'
                ? 'Direct connection'
                : meta.apiStatus === 'public_api'
                  ? 'API available'
                  : meta.apiStatus === 'partner_api'
                    ? 'Partner API'
                    : 'File import'}
            </span>
          )}
        </div>
      )}

      <p className="text-[12.5px] text-ink-muted leading-relaxed">{meta.blurb}</p>

      <div className="flex flex-wrap items-center gap-2">
        {connection ? (
          <button type="button" onClick={onRevoke} className="rg-btn-secondary text-[13px]">
            {S.disconnectAction}
          </button>
        ) : connectable ? (
          <button
            type="button"
            onClick={onConnect}
            disabled={busy}
            className="rg-btn-primary text-[13px]"
            aria-busy={busy}
          >
            {busy ? 'One moment' : (meta.connectLabel ?? S.connectAction)}
          </button>
        ) : meta.authMethod === 'institution_gated' ? (
          <span className="inline-flex items-center h-9 px-3 rounded-full bg-parchment border border-hairline text-[12px] text-ink-muted">
            {S.institutionGated}
          </span>
        ) : meta.authMethod === 'oauth' || meta.authMethod === 'personal_access_token' ? (
          <span className="inline-flex items-center h-9 px-3 rounded-full bg-parchment border border-hairline text-[12px] text-ink-muted">
            {S.setupOnTheWay}
          </span>
        ) : null}

        <button type="button" onClick={onManualUpload} className="rg-btn-ghost text-[13px]">
          {S.manualUploadAction}
        </button>
        {canImport && <button type="button" disabled={importBusy} onClick={() => void browse()} className="rg-btn-ghost text-[13px]">Browse connected work</button>}
        {canImport && (meta.platformId === 'canvas' || meta.platformId === 'google_classroom') && <button type="button" disabled={importBusy} onClick={() => void checkRecent()} className="rg-btn-ghost text-[13px]">Check last 7 days</button>}
      </div>

      {note && <p className="text-[12px] text-ink-muted leading-relaxed">{note}</p>}
      {importNote && <p className="text-[12px] text-ink-muted leading-relaxed" role="status">{importNote}</p>}
      {importItems && importItems.length > 0 && <div className="space-y-2 border-t border-hairline pt-3">{importItems.slice(0, 20).map((item) => <div key={item.externalId} className="flex items-center justify-between gap-3 rounded-lg bg-parchment p-2.5"><div className="min-w-0"><p className="truncate text-[12px] font-semibold text-ink">{item.title}</p><p className="text-[10px] text-ink-muted">{item.course || (item.kind === 'file' ? 'Selected file' : 'Graded work')}{item.gradedAt ? ` · ${new Date(item.gradedAt).toLocaleDateString()}` : ''}</p></div><button type="button" disabled={importBusy} onClick={() => void importOne(item)} className="shrink-0 text-[11px] font-semibold text-primary">Import</button></div>)}</div>}
    </div>
  );
};
