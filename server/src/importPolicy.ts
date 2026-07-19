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
  /**
   * A provider-supplied classification when available. Manual import keeps all
   * work visible; Auto Mode deliberately accepts only assessment-like records.
   */
  assessmentType?: "exam" | "quiz" | "test" | "assessment" | "assignment" | "unknown";
};

export const AUTO_IMPORT_WINDOW_MS = 7 * 24 * 60 * 60_000;

const ASSESSMENT_TITLE = /\b(?:assessment|exam|final|midterm|quiz|test|checkpoint|mock|paper)\b/i;

/**
 * Never infer a completed review from an import. This filter only decides
 * which recent, graded assessment records Auto Mode may place in the review
 * queue. Everything else remains available through the manual picker.
 */
export function isAutomaticAssessment(item: ConnectorImportItem): boolean {
  if (item.assessmentType === "assignment") return false;
  if (["exam", "quiz", "test", "assessment"].includes(item.assessmentType ?? "unknown")) return true;
  return ASSESSMENT_TITLE.test(item.title);
}

export function automaticImportCandidates(items: ConnectorImportItem[], now = new Date()): ConnectorImportItem[] {
  const earliest = now.getTime() - AUTO_IMPORT_WINDOW_MS;
  const latest = now.getTime() + 5 * 60_000;
  const seen = new Set<string>();
  return items.filter((item) => {
    if (item.kind !== "graded_record" || !item.gradedAt || !isAutomaticAssessment(item) || seen.has(item.externalId)) return false;
    const time = new Date(item.gradedAt).getTime();
    if (!Number.isFinite(time) || time < earliest || time > latest) return false;
    seen.add(item.externalId);
    return true;
  });
}
