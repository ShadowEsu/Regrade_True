export type ConnectorImportItem = {
  externalId: string;
  platformId: string;
  title: string;
  course?: string | null;
  gradedAt?: string | null;
  score?: number | string | null;
  pointsPossible?: number | null;
  feedback?: string | null;
  kind: "graded_record" | "file";
};

export const AUTO_IMPORT_WINDOW_MS = 7 * 24 * 60 * 60_000;

export function automaticImportCandidates(items: ConnectorImportItem[], now = new Date()): ConnectorImportItem[] {
  const earliest = now.getTime() - AUTO_IMPORT_WINDOW_MS;
  const latest = now.getTime() + 5 * 60_000;
  const seen = new Set<string>();
  return items.filter((item) => {
    if (item.kind !== "graded_record" || !item.gradedAt || seen.has(item.externalId)) return false;
    const time = new Date(item.gradedAt).getTime();
    if (!Number.isFinite(time) || time < earliest || time > latest) return false;
    seen.add(item.externalId);
    return true;
  });
}
