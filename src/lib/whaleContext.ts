import type { Case } from '../services/caseService';
import type { UserProfile } from '../services/userService';
import { buildCaseContextForAdvocate } from './appealDraft';
import { buildStudentProfileContext } from './profileContext';

export function buildWhaleWorkspaceContext({
  profile,
  cases,
  learnerName,
  currentCaseId,
  currentPage,
  selectedQuestionId,
}: {
  profile?: UserProfile | null;
  cases: Case[];
  learnerName?: string;
  currentCaseId?: string | null;
  currentPage?: number | null;
  selectedQuestionId?: string | null;
}): string | undefined {
  const analyzed = cases.filter((item) => item.analysis);
  const ordered = [...analyzed].sort((a, b) => Number(b.id === currentCaseId) - Number(a.id === currentCaseId)).slice(0, 5);
  const parts: string[] = [];
  if (learnerName) parts.push(`CURRENT LEARNER: ${learnerName}`);
  const profileContext = buildStudentProfileContext(profile ?? null);
  if (profileContext) parts.push(profileContext);
  if (currentPage || selectedQuestionId) parts.push(`CURRENT VIEW: ${JSON.stringify({ currentPage: currentPage ?? null, selectedQuestionId: selectedQuestionId ?? null })}`);
  ordered.forEach((item, index) => parts.push(`${item.id === currentCaseId ? 'CURRENT ASSESSMENT' : `RECENT ASSESSMENT ${index + 1}`}\n${buildCaseContextForAdvocate(item.analysis!).slice(0, 4_000)}`));
  const value = parts.filter(Boolean).join('\n\n').slice(0, 24_000);
  return value || undefined;
}
