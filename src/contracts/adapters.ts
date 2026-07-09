/**
 * Pure functions bridging the legacy AI pipeline output (`src/types.ts`,
 * snake_case) into the spec contracts in `./index.ts`. No side effects,
 * no persistence, no network.
 */

import type {
  AnalysisResult as LegacyAnalysisResult,
  Question as LegacyQuestion,
  SourcePlatform as LegacySourcePlatform,
} from '../types';
import type {
  AppealAnalysis,
  AppealStrength,
  LmsPlatform,
  RubricFinding,
} from './index';

/**
 * Legacy platform names to spec platforms. Platforms with no spec
 * equivalent (powerschool, sakai, crowdmark, etc.) map to 'unknown'.
 */
const PLATFORM_MAP: Record<LegacySourcePlatform, LmsPlatform> = {
  gradescope: 'gradescope',
  canvas: 'canvas',
  moodle: 'moodle',
  blackboard: 'blackboard',
  brightspace: 'd2l',
  google_classroom: 'google_classroom',
  turnitin: 'turnitin',
  paper: 'paper',
  schoology: 'schoology',
  powerschool: 'unknown',
  sakai: 'unknown',
  teams: 'teams_edu',
  crowdmark: 'unknown',
  akindi: 'unknown',
  managebac: 'unknown',
  itslearning: 'unknown',
  satchel_one: 'unknown',
  edmodo: 'unknown',
  openlms: 'unknown',
  mixed: 'unknown',
  unknown: 'unknown',
};

/** Ceiling applied to findings the reader itself flagged as low confidence. */
const LOW_CONFIDENCE_CEILING = 0.5;

export function toLmsPlatform(platform: LegacySourcePlatform): LmsPlatform {
  return PLATFORM_MAP[platform];
}

/** Legacy case strength to spec AppealStrength ('no_case' becomes 'none'). */
export function toAppealStrength(
  s: 'strong' | 'moderate' | 'weak' | 'no_case',
): AppealStrength {
  return s === 'no_case' ? 'none' : s;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

/** Legacy confidence may arrive as 0-1 or 0-100; normalize to 0-1. */
function normalizeConfidence(raw: number): number {
  return clamp01(raw > 1 ? raw / 100 : raw);
}

/**
 * True when the question id is named in low_confidence_items, either as
 * an exact entry or as a standalone token inside a longer entry.
 */
function isNamedLowConfidence(
  questionId: string,
  lowConfidenceItems: string[],
): boolean {
  return lowConfidenceItems.some(
    (item) =>
      item === questionId ||
      item.split(/[^A-Za-z0-9_]+/).includes(questionId),
  );
}

/**
 * Per-finding confidence: the overall reader confidence, capped at
 * LOW_CONFIDENCE_CEILING when the item was flagged low confidence.
 * The cap sits below 0.7 so flagged items always trip the UI warning.
 */
function findingConfidence(
  questionId: string,
  legacy: LegacyAnalysisResult,
): number {
  const base = normalizeConfidence(legacy.confidence.overall_confidence);
  if (isNamedLowConfidence(questionId, legacy.confidence.low_confidence_items)) {
    return Math.min(base, LOW_CONFIDENCE_CEILING);
  }
  return base;
}

function isActionable(strength: AppealStrength): boolean {
  return strength === 'moderate' || strength === 'strong';
}

/** Sum of pointsLost across findings with strength at least 'moderate'. */
function computeRecoverablePoints(findings: RubricFinding[]): number {
  return findings.reduce(
    (sum, finding) =>
      isActionable(finding.strength) ? sum + finding.pointsLost : sum,
    0,
  );
}

function questionIndex(
  legacy: LegacyAnalysisResult,
): Map<string, LegacyQuestion> {
  const byId = new Map<string, LegacyQuestion>();
  for (const question of legacy.questions) {
    byId.set(question.question_id, question);
  }
  return byId;
}

/**
 * Converts a legacy pipeline result into the spec AppealAnalysis.
 *
 * Mapping rules:
 * - unexplained_deductions become 'unexplained_deduction' findings whose
 *   strength inherits the overall case strength.
 * - potential_calculation_errors become 'arithmetic_error' findings and
 *   are always 'strong': a checkable totaling mistake stands on its own.
 * - Missing-artifact detection lives in the analysis feature, so
 *   `missing` starts empty here.
 *
 * @param analyzedAt Optional ISO timestamp override for deterministic tests.
 */
export function fromLegacyAnalysis(
  legacy: LegacyAnalysisResult,
  analyzedAt: string = new Date().toISOString(),
): AppealAnalysis {
  const byId = questionIndex(legacy);
  const caseStrength = toAppealStrength(
    legacy.case_analysis.overall_case_strength,
  );

  const findings: RubricFinding[] = [];

  for (const deduction of legacy.case_analysis.unexplained_deductions) {
    const question = byId.get(deduction.question_id);
    const pointsLost = Math.max(0, deduction.points_lost);
    const pointsPossible = question?.points_possible ?? pointsLost;
    const pointsAwarded =
      question?.points_earned ?? Math.max(0, pointsPossible - pointsLost);
    findings.push({
      questionId: deduction.question_id,
      pointsPossible,
      pointsAwarded,
      pointsLost,
      cause: 'unexplained_deduction',
      strength: caseStrength,
      evidence: deduction.what_is_missing,
      rubricCitation: null,
      teacherQuote: null,
      confidence: findingConfidence(deduction.question_id, legacy),
    });
  }

  for (const error of legacy.case_analysis.potential_calculation_errors) {
    const question = byId.get(error.question_id);
    findings.push({
      questionId: error.question_id,
      pointsPossible: question?.points_possible ?? error.expected_score,
      pointsAwarded: error.actual_score_shown,
      pointsLost: Math.abs(error.discrepancy),
      cause: 'arithmetic_error',
      strength: 'strong',
      evidence: error.explanation,
      rubricCitation: null,
      teacherQuote: null,
      confidence: findingConfidence(error.question_id, legacy),
    });
  }

  return {
    platform: toLmsPlatform(legacy.source_platform),
    totalPossible: legacy.assignment.total_score_possible ?? 0,
    totalAwarded: legacy.assignment.total_score_earned ?? 0,
    findings,
    missing: [],
    caseStrength,
    recoverablePoints: computeRecoverablePoints(findings),
    appealRecommended: isActionable(caseStrength),
    analyzedAt,
  };
}
