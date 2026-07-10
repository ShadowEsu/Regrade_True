import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isPreviewMode } from '../../lib/previewMode';
import CanvasTokenDialog from './CanvasTokenDialog';
import { createConnectors } from './connectors';
import { PLATFORMS, type PlatformMeta } from './registry';
import { canStoreSecurely, listConnections, revokeConnection } from './store';
import { CONNECT_STRINGS as S } from './strings';
import { isConnectFailure, type ConnectPlatformId, type Connector, type StoredConnection } from './types';

/**
 * The unified Connect screen. Every platform gets one card in one list.
 * Cards that can genuinely connect show a Connect button. Cards that cannot
 * say so honestly. Manual upload is available on every single card, always.
 */
export default function ConnectScreen({ onManualUpload }: { onManualUpload: () => void }) {
  const [connections, setConnections] = useState<StoredConnection[]>([]);
  const [busy, setBusy] = useState<ConnectPlatformId | null>(null);
  const [notes, setNotes] = useState<Partial<Record<ConnectPlatformId, string>>>({});
  const [canvasOpen, setCanvasOpen] = useState(false);
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
      }
    } finally {
      setBusy(null);
    }
  };

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
        <p className="text-[13px] text-ink-muted leading-relaxed mt-1">{S.screenSubtitle}</p>
      </div>

      <div className="space-y-3">
        {PLATFORMS.map((meta) => {
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
  const connectable = connector.isAvailable() && !connection;

  return (
    <div className="rg-glass-form-card p-4 space-y-3" data-platform={meta.platformId}>
      <div className="flex items-center gap-3">
        {meta.logo ? (
          <img src={meta.logo} alt="" className="w-8 h-8 rounded-lg object-contain shrink-0" />
        ) : (
          <span
            aria-hidden
            className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-[13px] font-semibold flex items-center justify-center shrink-0"
          >
            {meta.displayName.charAt(0)}
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
            {busy ? 'One moment' : S.connectAction}
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
      </div>

      {note && <p className="text-[12px] text-ink-muted leading-relaxed">{note}</p>}
    </div>
  );
};
