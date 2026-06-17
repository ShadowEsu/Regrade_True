/**
 * Platform layout guide for Reader (extraction) and single-shot (analytical) prompts.
 * Keep in sync with server/src/shared/platformReadingGuide.ts
 */
export const PLATFORM_READING_GUIDE = `
═══════════════════════════════════════════════════════════════
DETECT PLATFORM FIRST (set source_platform + image_types_detected)
═══════════════════════════════════════════════════════════════

Use visual branding, URL bars in screenshots, and layout. Allowed source_platform values:
gradescope | canvas | moodle | blackboard | brightspace | google_classroom | turnitin | paper | schoology | powerschool | sakai | teams | crowdmark | akindi | managebac | itslearning | satchel_one | edmodo | openlms | mixed | unknown

GRADESCOPE — teacher comments & marks (CRITICAL)
Visual cues: "Gradescope" header, green/red rubric tiles, question list with "X / Y pts", "Download Graded Copy" style PDF.
WHERE COMMENTS LIVE:
- Blue or gray speech-bubble boxes anchored on the student's PDF (submission-specific) → professor_comments, location: on_submission.
- Rubric panel (right or bottom): rows like "Missing units (-1 pt)" with highlight when applied → rubric_items_applied.
- Text typed in rubric row expansion → has_explanation: true.
- Score summary page only: may lack bubbles; still extract per-question scores and rubric rows shown.
TEACHER COMMENT RULE: Extract EVERY bubble and rubric label verbatim — these are the #1 appeal evidence.
Scoring: default NEGATIVE (deductions from full marks). "-2 pts" applied = student LOST 2 points.

CANVAS — SpeedGrader, assignments, New Analytics
Visual cues: Canvas red/white UI, "SpeedGrader", "Submission Details", rubric grid with criteria rows, comment pins on document.
WHERE COMMENTS LIVE:
- Pointed comment markers on the file (numbered pins) → professor_comments on_submission; map to nearest question/section.
- Rubric grid on the right: each criterion with rating and points → rubric_items_applied per question or overall.
- "Additional comments" / assessment comment box at bottom → overall_professor_comments or question-level if labeled.
- Grade header: "Score: 42 out of 50" → assignment.total_score_*.
Export types: annotated PDF, screenshot of SpeedGrader, or grades page — read all visible.

MOODLE
Visual cues: Moodle orange/gray theme, "Assignment feedback", "Grade", rubric table in feedback.
WHERE COMMENTS LIVE:
- Feedback comments in the feedback table or annotated PDF → professor_comments.
- Advanced grading rubric: level selected per criterion → rubric_items_applied.
- File markup on submitted PDF (teacher annotations) → on_submission.
- Final grade on assignment page → total_score_display.

BLACKBOARD (Learn Ultra or Original)
Visual cues: Blackboard purple/gray, "Grade Center", "Feedback", inline grading view.
WHERE COMMENTS LIVE:
- Inline grading bubbles on submitted document → professor_comments on_submission.
- Rubric scorecard (if enabled) → rubric_items_applied.
- Feedback to learner text area → overall_professor_comments or per-attempt.
- Points column: earned / possible.

D2L BRIGHTSPACE
Visual cues: Brightspace blue, "Assignments", "Feedback", "Evaluation" panel.
WHERE COMMENTS LIVE:
- Feedback field text and attached annotated files → professor_comments.
- Rubric assessment grid (Levels of Achievement) → rubric_items_applied.
- Score on submission summary → points_earned / points_possible.

GOOGLE CLASSROOM
Visual cues: Classroom green/white, "Classwork", "Returned", Google Docs/Slides with comment chips in margin.
WHERE COMMENTS LIVE:
- Comment chips in margin of returned Doc/PDF (names + text) → professor_comments on_submission.
- Rubric (if teacher used one) in grading panel screenshot → rubric_items_applied.
- Grade on assignment card (e.g. "18/20") in screenshot → total_score_display; may need image if not in PDF.

TURNITIN FEEDBACK STUDIO
Visual cues: Turnitin blue sidebar, "Feedback Studio", QuickMarks (symbols), similarity layer.
WHERE COMMENTS LIVE:
- QuickMark symbols with pop-up comment text → professor_comments on_submission.
- Rubric scorecard (criterion scores on the right) → rubric_items_applied.
- Summary text comment at end → overall_professor_comments.
IGNORE: Similarity percentage and colored similarity matches UNLESS instructor wrote a comment tying them to a point deduction.

SCHOOLOGY / MICROSOFT TEAMS EDUCATION
Visual cues: Schoology or Teams assignment grade view, rubric checklist, teacher feedback text.
WHERE COMMENTS LIVE: Rubric checklist + feedback text block; treat like LMS (comments + criterion rows).

POWERSCHOOL (Unified Classroom / Schoology Learning under PowerSchool)
Visual cues: PowerSchool or Schoology Learning UI, district portal branding, assignment grade + feedback panel.
WHERE COMMENTS LIVE:
- Often Schoology Learning assignment feedback (rubric + comments) when district uses PowerSchool LMS bundle.
- Grade report PDFs or student portal assignment view with instructor notes → professor_comments.
- Rubric rows in grading panel → rubric_items_applied.

SAKAI
Visual cues: Sakai course site, Assignments tool, Gradebook, Feedback on submission.
WHERE COMMENTS LIVE:
- Assignment → Feedback comments and returned attachments → professor_comments.
- Gradebook item comments → overall_professor_comments.
- Rubric on submission if enabled → rubric_items_applied.

CROWDMARK (Canada, UK, Australia — common in STEM)
Visual cues: Crowdmark logo, question-by-question grading pages, "Evaluation" sidebar, handwritten annotation layer on PDF.
WHERE COMMENTS LIVE:
- Per-question evaluation panel with grader comments → professor_comments side_panel or rubric_panel.
- Applied evaluation criteria with point adjustments → rubric_items_applied.
- Handwritten grader marks on the page → margin_handwritten.
- Score summary listing Q1, Q2 with points → per-question scores.

AKINDI (scantron / bubble-sheet exams)
Visual cues: Akindi branding, question grid, "Review" view, wrong-answer highlighting on scan sheets.
WHERE COMMENTS LIVE:
- Often MINIMAL text — mostly which answer was marked wrong and points per question.
- Instructor may add free-text feedback in review panel → professor_comments.
- If only correct/incorrect with no rubric: set deductions_with_no_comment when points lost without explanation.

MANAGEBAC (IB schools worldwide)
Visual cues: ManageBac assignment view, IB criterion rubrics (A/B/C/D), "Teacher Comments", assessment criteria levels.
WHERE COMMENTS LIVE:
- Criterion-level rubric selections (e.g. Criterion A: Level 5) → rubric_items_applied with criterion name.
- Teacher comment box on task → overall_professor_comments or per-criterion comments.
- IB grades may use levels not raw points — extract both level labels AND any numeric score shown.

ITSLEARNING (Nordics, Benelux, UK)
Visual cues: itslearning purple/green, "Assessment", rubric matrix, teacher feedback field.
WHERE COMMENTS LIVE:
- Rubric matrix cells selected → rubric_items_applied.
- Feedback text area and file annotations → professor_comments.

SATCEL ONE / SHOW MY HOMEWORK (UK, common in secondary schools)
Visual cues: Satchel One branding, homework grade, teacher comment thread, skills rubric.
WHERE COMMENTS LIVE:
- Teacher comment on submission → professor_comments.
- Skills rubric or mark scheme checklist → rubric_items_applied.

EDMODO / CLASSROOM ALTERNATIVES
Visual cues: Assignment grade with comment bubble, simple rubric checklist.
WHERE COMMENTS LIVE: Comment thread + optional rubric ticks — same extraction rules as Schoology.

OPEN LMS / POPULI / REGIONAL PORTALS
Visual cues: Generic LMS assignment feedback page with grade + comments.
WHERE COMMENTS LIVE: Feedback text, attached marked PDF, rubric table if present. If branding unclear, use source_platform: unknown and still extract all visible marks.

HANDWRITTEN / MARKED PAPER (photo, scan, or PDF)
Visual cues: Different ink color than student work, pen marks, stamps, circled scores.
WHERE COMMENTS LIVE:
- Margin notes, interlinear comments, arrows → professor_comments (handwritten — transcribe best effort).
- Circled "18/25", "−3", checks, crosses → points_earned/possible or rubric_items_applied.
- If illegible: extraction_uncertainties with both guesses; never invent text.

NON-ENGLISH / INTERNATIONAL MARKS
- Letter grades (A–F, 1–6 German, IB levels, UK GCSE 9–1) → letter_grade or note in extraction_uncertainties.
- Decimal comma (3,5 / 10) → parse as 3.5.
- Rubric text in any language → extract verbatim; do not translate.

═══════════════════════════════════════════════════════════════
COMPLETENESS AUDIT (run mentally before returning JSON)
═══════════════════════════════════════════════════════════════
For EVERY question where points_earned < points_possible (or points were deducted):
1. List ALL rubric_items_applied with was_applied_to_student: true.
2. List ALL professor_comments (bubbles, pins, QuickMarks, margin notes, feedback boxes).
3. Set deductions_with_no_comment: true if points were lost AND there is NO written explanation — not even a rubric checkbox label counts as a full explanation unless it states WHY.
4. SCORE-ONLY EXPORT: if you see X/Y per question but zero rubric rows and zero comments anywhere → flag in extraction_uncertainties: "score-only export — no rubric or comments visible".
5. MISSING RUBRIC ON PAGE: if student pasted rubric text separately (in rubric field), note that criteria exist off-page — do not invent applied items; still flag unexplained gaps on the graded export.
6. Cross-check: sum of per-question earned vs total_score_earned if both visible — note mismatch in extraction_uncertainties.
7. Read EVERY page of multi-page PDFs — comments often on page 2+ (annotated submission, not summary).

═══════════════════════════════════════════════════════════════
MERGE RULES (multi-page / multi-file)
═══════════════════════════════════════════════════════════════
- One questions[] entry per question_id; merge data from summary page + annotated pages.
- image_types_detected: list every distinct view (e.g. gradescope_score_summary, gradescope_comment_bubbles, canvas_speedgrader_rubric).
- mixed = two or more platforms in one upload batch.

═══════════════════════════════════════════════════════════════
REQUIRED PER QUESTION (when visible)
═══════════════════════════════════════════════════════════════
question_id, points_possible, points_earned, rubric_items_applied (all applied lines), professor_comments (ALL instructor text including Gradescope bubbles), deductions_with_no_comment.

PRIORITY ORDER WHEN TIME-LIMITED
1) Total score display  2) Per-question earned/possible  3) Instructor comments (typed + handwritten)  4) Rubric lines applied  5) Completeness audit flags

IMAGES vs TEXT
- Images (including PDF page renders) are PRIMARY for marks, colors, bubbles, and handwriting.
- Extracted PDF text is supplementary; if conflict, trust images and note in extraction_uncertainties.
- Student-pasted rubric/feedback text in INPUT fields is authoritative for CRITERIA — use it to judge whether marks align, not to invent deductions on the upload.

NEVER
- Invent comments, rubric lines, or scores.
- Treat Turnitin similarity % as points off without explicit rubric linkage.
- Fabricate totals by summing questions unless cross-checking and noting discrepancy.
- Assume "no comment" means full credit — always compare earned vs possible.
`;
