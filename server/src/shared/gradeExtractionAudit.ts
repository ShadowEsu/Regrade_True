/**
 * Deterministic post-processing for Reader / single-shot outputs.
 * Catches missing professor comments, absent rubric criteria, and score math errors
 * that vision models sometimes miss. Keep in sync with server/src/shared/gradeExtractionAudit.ts
 */

export type AuditRubricItem = {
  description?: string;
  point_value?: number;
  was_applied_to_student?: boolean;
  has_explanation?: boolean;
};

export type AuditProfessorComment = {
  comment_text?: string;
};

export type AuditQuestion = {
  question_id?: string;
  points_possible?: number | null;
  points_earned?: number | null;
  points_lost?: number | null;
  scoring_direction?: 'deducted_from_full' | 'added_from_zero' | 'unknown';
  rubric_items_applied?: AuditRubricItem[];
  professor_comments?: AuditProfessorComment[];
  deductions_with_no_comment?: boolean;
  partial_credit_awarded?: boolean;
};

export type AuditLedger = {
  questions?: AuditQuestion[];
  overall_professor_comments?: string | null;
  scoring_method?: 'negative' | 'positive' | 'unknown' | string;
  assignment?: {
    total_score_earned?: number | null;
    total_score_possible?: number | null;
  };
  extraction_uncertainties?: string[];
  confidence?: {
    overall_confidence?: number;
    low_confidence_items?: string[];
    requires_retake?: boolean;
    retake_reason?: string | null;
  };
};

export type UnexplainedDeduction = {
  question_id: string;
  points_lost: number;
  what_is_missing: string;
};

export type CalculationError = {
  question_id: string;
  expected_score: number;
  actual_score_shown: number;
  discrepancy: number;
  explanation: string;
};

export type GradingCompletenessAudit = {
  /** Questions with corrected deductions_with_no_comment and points_lost */
  questions: AuditQuestion[];
  extraction_uncertainties: string[];
  unexplained_deductions: UnexplainedDeduction[];
  potential_calculation_errors: CalculationError[];
  /** True when scores exist but no rubric rows or comments anywhere */
  score_only_export: boolean;
  /** True when points were lost but no rubric criteria visible on the upload */
  missing_rubric_on_upload: boolean;
  /** Student pasted rubric text separately — use for cross-check messaging */
  student_supplied_rubric: boolean;
};

function roundScore(n: number): number {
  return Math.round(n * 100) / 100;
}

function hasMeaningfulComment(text: string | undefined | null): boolean {
  if (!text) return false;
  const t = text.trim();
  return t.length >= 2 && !/^(n\/?a|none|—|-|\.)$/i.test(t);
}

function appliedRubricItems(q: AuditQuestion): AuditRubricItem[] {
  return (q.rubric_items_applied ?? []).filter((r) => r.was_applied_to_student === true);
}

function questionComments(q: AuditQuestion): string[] {
  return (q.professor_comments ?? [])
    .map((c) => c.comment_text?.trim())
    .filter((t): t is string => !!t && hasMeaningfulComment(t));
}

function rubricProvidesExplanation(items: AuditRubricItem[]): boolean {
  return items.some(
    (r) =>
      r.has_explanation === true ||
      (hasMeaningfulComment(r.description) && (r.description?.length ?? 0) > 40),
  );
}

function computePointsLost(q: AuditQuestion): number | null {
  if (typeof q.points_lost === 'number' && q.points_lost > 0) return q.points_lost;
  if (q.points_possible != null && q.points_earned != null) {
    const lost = q.points_possible - q.points_earned;
    return lost > 0 ? roundScore(lost) : 0;
  }
  return null;
}

function expectedEarnedFromRubric(
  q: AuditQuestion,
  scoringMethod: AuditLedger['scoring_method'],
): number | null {
  const possible = q.points_possible;
  if (possible == null) return null;
  const applied = appliedRubricItems(q);
  if (!applied.length) return null;

  const direction =
    q.scoring_direction ??
    (scoringMethod === 'positive'
      ? 'added_from_zero'
      : scoringMethod === 'negative'
        ? 'deducted_from_full'
        : 'unknown');

  const sumApplied = applied.reduce((acc, r) => acc + (r.point_value ?? 0), 0);

  if (direction === 'added_from_zero' || (sumApplied >= 0 && scoringMethod === 'positive')) {
    return roundScore(Math.min(possible, Math.max(0, sumApplied)));
  }

  // Negative / deduction scoring: rubric values are usually negative deltas.
  if (sumApplied <= 0) {
    return roundScore(Math.max(0, possible + sumApplied));
  }
  // Mixed signs — treat negatives as deductions, positives as partial credit adds.
  const deductions = applied.filter((r) => (r.point_value ?? 0) < 0).reduce((a, r) => a + (r.point_value ?? 0), 0);
  const adds = applied.filter((r) => (r.point_value ?? 0) > 0).reduce((a, r) => a + (r.point_value ?? 0), 0);
  return roundScore(Math.max(0, Math.min(possible, possible + deductions + adds)));
}

function studentSuppliedRubricText(rubricData: string | undefined): boolean {
  if (!rubricData?.trim()) return false;
  const lower = rubricData.toLowerCase();
  if (lower.includes('infer from upload')) return false;
  if (lower.includes('no separate rubric')) return false;
  if (lower.includes('student notes only')) return false;
  return rubricData.trim().length >= 40;
}

/**
 * Audit and patch a ledger-like object after AI extraction.
 */
export function auditGradingCompleteness(
  ledger: AuditLedger,
  options?: { rubricData?: string; feedbackData?: string },
): GradingCompletenessAudit {
  const uncertainties = [...(ledger.extraction_uncertainties ?? [])];
  const unexplained: UnexplainedDeduction[] = [];
  const calcErrors: CalculationError[] = [];
  const studentSuppliedRubric = studentSuppliedRubricText(options?.rubricData);

  const rawQuestions = Array.isArray(ledger.questions) ? ledger.questions : [];
  let totalRubricRows = 0;
  let totalComments = 0;
  let questionsWithDeductions = 0;

  const patchedQuestions: AuditQuestion[] = rawQuestions.map((q) => {
    const id = q.question_id?.trim() || 'Unknown question';
    const applied = appliedRubricItems(q);
    const comments = questionComments(q);
    totalRubricRows += applied.length;
    totalComments += comments.length;

    const pointsLost = computePointsLost(q);
    const patched: AuditQuestion = {
      ...q,
      points_lost: pointsLost ?? q.points_lost ?? null,
    };

    if (pointsLost != null && pointsLost > 0) {
      questionsWithDeductions += 1;
      const rubricLabelsOnly =
        applied.length > 0 &&
        !rubricProvidesExplanation(applied) &&
        comments.length === 0 &&
        !hasMeaningfulComment(ledger.overall_professor_comments);

      const noFeedbackAtAll =
        applied.length === 0 &&
        comments.length === 0 &&
        !hasMeaningfulComment(ledger.overall_professor_comments);

      const missingExplanation = rubricLabelsOnly || noFeedbackAtAll;
      patched.deductions_with_no_comment = missingExplanation;

      if (missingExplanation) {
        const what = noFeedbackAtAll
          ? `You lost ${pointsLost} point${pointsLost === 1 ? '' : 's'} on ${id} with no rubric line, checkbox, or instructor comment visible in the upload. Ask your instructor which criterion was applied.`
          : `Rubric checkboxes on ${id} show deductions (${pointsLost} pt${pointsLost === 1 ? '' : 's'} lost) but no written explanation — only short labels like "${applied[0]?.description?.slice(0, 60) ?? 'deduction'}".`;

        unexplained.push({ question_id: id, points_lost: pointsLost, what_is_missing: what });

        if (!uncertainties.some((u) => u.includes(id))) {
          uncertainties.push(
            noFeedbackAtAll
              ? `${id}: points deducted with no visible rubric or comment — upload may be a score-only export, or feedback is on another page.`
              : `${id}: rubric applied without a written reason — consider asking the instructor to clarify.`,
          );
        }
      }
    } else {
      patched.deductions_with_no_comment = false;
    }

    const expected = expectedEarnedFromRubric(patched, ledger.scoring_method);
    if (
      expected != null &&
      patched.points_earned != null &&
      Math.abs(expected - patched.points_earned) >= 0.01
    ) {
      calcErrors.push({
        question_id: id,
        expected_score: expected,
        actual_score_shown: patched.points_earned,
        discrepancy: roundScore(Math.abs(expected - patched.points_earned)),
        explanation: `Applied rubric items on ${id} add up to ${expected} pts, but the page shows ${patched.points_earned} pts — possible arithmetic error.`,
      });
      if (!uncertainties.some((u) => u.includes(id) && u.includes('arithmetic'))) {
        uncertainties.push(`${id}: displayed score may not match applied rubric items (arithmetic check).`);
      }
    }

    return patched;
  });

  const scoreOnlyExport =
    patchedQuestions.length > 0 &&
    totalRubricRows === 0 &&
    totalComments === 0 &&
    !hasMeaningfulComment(ledger.overall_professor_comments) &&
    questionsWithDeductions > 0;

  const missingRubricOnUpload =
    questionsWithDeductions > 0 && totalRubricRows === 0 && !studentSuppliedRubric;

  if (scoreOnlyExport) {
    uncertainties.push(
      'This looks like a score-only export: per-question points are visible but no rubric rows or instructor comments. Re-export from your LMS with feedback enabled, or paste the assignment rubric below.',
    );
  }

  if (missingRubricOnUpload && !scoreOnlyExport) {
    uncertainties.push(
      'Some points were lost but no rubric criteria appear in the upload. If you have the assignment rubric, paste it in the rubric field so we can check alignment.',
    );
  }

  if (studentSuppliedRubric && missingRubricOnUpload) {
    uncertainties.push(
      'You pasted rubric criteria separately — the Reasoner will compare those criteria against the marks shown on your upload.',
    );
  }

  // Total score cross-check when per-question scores sum cleanly.
  const earnedSum = patchedQuestions
    .map((q) => q.points_earned)
    .filter((n): n is number => typeof n === 'number');
  if (earnedSum.length >= 2 && ledger.assignment?.total_score_earned != null) {
    const sum = roundScore(earnedSum.reduce((a, b) => a + b, 0));
    const shown = ledger.assignment.total_score_earned;
    if (Math.abs(sum - shown) >= 0.01) {
      calcErrors.push({
        question_id: 'TOTAL',
        expected_score: sum,
        actual_score_shown: shown,
        discrepancy: roundScore(Math.abs(sum - shown)),
        explanation: `Per-question scores sum to ${sum}, but the total shown is ${shown} — possible overall calculation error.`,
      });
    }
  }

  return {
    questions: patchedQuestions,
    extraction_uncertainties: [...new Set(uncertainties)],
    unexplained_deductions: unexplained,
    potential_calculation_errors: calcErrors,
    score_only_export: scoreOnlyExport,
    missing_rubric_on_upload: missingRubricOnUpload,
    student_supplied_rubric: studentSuppliedRubric,
  };
}

/** Merge audit findings into a full analysis object (hybrid or single-shot). */
export function mergeAuditIntoAnalysis<T extends AuditLedger & { case_analysis?: Record<string, unknown> }>(
  analysis: T,
  audit: GradingCompletenessAudit,
): T {
  const out: T = {
    ...analysis,
    questions: audit.questions as T['questions'],
    extraction_uncertainties: audit.extraction_uncertainties,
  };

  const existing = (analysis.case_analysis ?? {}) as Record<string, unknown>;
  const existingUnexplained = Array.isArray(existing.unexplained_deductions)
    ? (existing.unexplained_deductions as UnexplainedDeduction[])
    : [];
  const existingCalc = Array.isArray(existing.potential_calculation_errors)
    ? (existing.potential_calculation_errors as CalculationError[])
    : [];

  const mergeByQuestion = <U extends { question_id: string }>(base: U[], extra: U[]): U[] => {
    const map = new Map(base.map((x) => [x.question_id, x]));
    for (const item of extra) {
      if (!map.has(item.question_id)) map.set(item.question_id, item);
    }
    return [...map.values()];
  };

  const mergedUnexplained = mergeByQuestion(existingUnexplained, audit.unexplained_deductions);
  const mergedCalc = mergeByQuestion(existingCalc, audit.potential_calculation_errors);

  let recommendedAngle = existing.recommended_appeal_angle as string | undefined;
  if (!recommendedAngle) {
    if (mergedCalc.length > 0) recommendedAngle = 'calculation_error';
    else if (mergedUnexplained.length > 0) recommendedAngle = 'unexplained_deduction';
    else if (audit.score_only_export) recommendedAngle = 'clarification_only';
  }

  out.case_analysis = {
    ...existing,
    unexplained_deductions: mergedUnexplained,
    potential_calculation_errors: mergedCalc,
    ...(recommendedAngle && !existing.recommended_appeal_angle
      ? { recommended_appeal_angle: recommendedAngle }
      : {}),
  };

  if (audit.score_only_export || audit.missing_rubric_on_upload) {
    const conf = out.confidence ?? {};
    out.confidence = {
      ...conf,
      requires_retake: conf.requires_retake ?? audit.score_only_export,
      retake_reason:
        conf.retake_reason ??
        (audit.score_only_export
          ? 'Re-upload a graded export that includes rubric rows and instructor comments (not just scores).'
          : null),
      low_confidence_items: [
        ...(conf.low_confidence_items ?? []),
        ...(audit.score_only_export ? ['score_only_export'] : []),
        ...(audit.missing_rubric_on_upload ? ['missing_rubric_on_upload'] : []),
      ],
    };
  }

  return out;
}

/** Patch ledger before reasoning stage (hybrid path). */
export function mergeAuditIntoLedger<T extends AuditLedger>(ledger: T, audit: GradingCompletenessAudit): T {
  return {
    ...ledger,
    questions: audit.questions as T['questions'],
    extraction_uncertainties: audit.extraction_uncertainties,
  };
}
