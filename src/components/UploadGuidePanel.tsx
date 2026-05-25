import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ICONS } from '../constants';

type PlatformId =
  | 'gradescope'
  | 'canvas'
  | 'moodle'
  | 'blackboard'
  | 'brightspace'
  | 'classroom'
  | 'turnitin'
  | 'paper';

type PlatformGuide = {
  id: PlatformId;
  name: string;
  short: string;
  fileLabel: string;
  steps: string[];
  mustInclude: string[];
  avoid: string;
};

const UPLOAD_STEPS = [
  {
    num: '01',
    title: 'Get the graded file',
    body: 'Export or download the version your school marked — not the blank original.',
    icon: ICONS.Download,
  },
  {
    num: '02',
    title: 'Comments must show',
    body: 'Scores, rubric lines, and teacher feedback (bubbles, pins, margin notes) need to be visible.',
    icon: ICONS.MessageSquare,
  },
  {
    num: '03',
    title: 'Upload & analyze',
    body: 'One PDF or a few clear photos. Optional notes only if something is cut off.',
    icon: ICONS.Upload,
  },
] as const;

const PLATFORMS: PlatformGuide[] = [
  {
    id: 'gradescope',
    name: 'Gradescope',
    short: 'Graded Copy PDF',
    fileLabel: 'Download Graded Copy',
    steps: [
      'Open your graded submission (score + questions visible).',
      'Scroll down → tap Download Graded Copy (not Download Original).',
      'Upload that PDF here — blue comment bubbles and rubric panel are read automatically.',
    ],
    mustInclude: ['Per-question scores', 'Rubric checkboxes', 'Instructor comment bubbles'],
    avoid: 'Original ungraded submission',
  },
  {
    id: 'canvas',
    name: 'Canvas',
    short: 'SpeedGrader export',
    fileLabel: 'Annotated PDF or screenshot',
    steps: [
      'Grades → course → assignment → your submission.',
      'Open SpeedGrader feedback (pins on the file + rubric on the side).',
      'Download marked PDF, or screenshot/Print to PDF so rubric and comments stay on the page.',
    ],
    mustInclude: ['Assignment score', 'Rubric rows', 'Comment pins or assessment notes'],
    avoid: 'Assignment page with no feedback expanded',
  },
  {
    id: 'moodle',
    name: 'Moodle',
    short: 'Feedback PDF',
    fileLabel: 'Annotated return file',
    steps: [
      'Open the assignment → your submission → Feedback.',
      'Download any annotated PDF your teacher returned.',
      'If feedback is only on screen, use Print → PDF or a full-page screenshot.',
    ],
    mustInclude: ['Grade', 'Feedback comments', 'Rubric table if shown'],
    avoid: 'Submission file with no feedback attached',
  },
  {
    id: 'blackboard',
    name: 'Blackboard',
    short: 'Graded attempt',
    fileLabel: 'Feedback view / PDF',
    steps: [
      'My Grades → open the item → View attempt or feedback.',
      'Save the returned file, or print the inline grading view to PDF.',
      'Include rubric scorecard if your course uses one.',
    ],
    mustInclude: ['Points earned', 'Instructor comments', 'Rubric if visible'],
    avoid: 'Grade column only (no feedback detail)',
  },
  {
    id: 'brightspace',
    name: 'D2L Brightspace',
    short: 'Evaluation view',
    fileLabel: 'Feedback PDF',
    steps: [
      'Assignments → your submission → Feedback / Evaluation.',
      'Download attachments or print the feedback page to PDF.',
      'Make sure rubric levels and written feedback are in frame.',
    ],
    mustInclude: ['Score', 'Feedback text', 'Rubric assessment grid'],
    avoid: 'Submission list without opening feedback',
  },
  {
    id: 'classroom',
    name: 'Google Classroom',
    short: 'Returned work',
    fileLabel: 'Commented Doc/PDF',
    steps: [
      'Classwork → assignment → your turned-in work (Returned).',
      'Open the file in Drive — read margin comment chips.',
      'File → Download as PDF, or screenshot the graded view with grade visible.',
    ],
    mustInclude: ['Teacher comment chips', 'Grade if shown', 'Returned document'],
    avoid: 'Unreturned draft only',
  },
  {
    id: 'turnitin',
    name: 'Turnitin',
    short: 'Feedback Studio',
    fileLabel: 'Marked download / PDF',
    steps: [
      'Open the submission in Feedback Studio.',
      'Show QuickMarks + rubric scorecard (hide similarity layer if you only need grades).',
      'Download or print the marked version with instructor comments.',
    ],
    mustInclude: ['QuickMark comments', 'Rubric scores', 'Summary feedback'],
    avoid: 'Similarity report only (no instructor marks)',
  },
  {
    id: 'paper',
    name: 'Marked paper',
    short: 'Photo or scan',
    fileLabel: 'Clear photos',
    steps: [
      'Lay the page flat in good light — include every page with marks.',
      'Capture the total score and each question’s deductions if written.',
      'Upload 1–3 sharp photos (or scan to PDF). Note unclear handwriting in optional notes.',
    ],
    mustInclude: ['Teacher ink marks', 'Circled scores', 'Margin comments'],
    avoid: 'Blurry, cropped, or shadowed photos',
  },
];

export default function UploadGuidePanel() {
  const [selected, setSelected] = useState<PlatformId>('gradescope');
  const active = PLATFORMS.find((p) => p.id === selected) ?? PLATFORMS[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl md:rounded-[2rem] border border-primary/10 bg-gradient-to-br from-white via-white to-primary/[0.04] shadow-[0_12px_40px_-12px_rgba(0,35,111,0.12)]"
      aria-labelledby="upload-guide-title"
    >
      <div className="absolute inset-0 paper-texture pointer-events-none opacity-60" />
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative p-6 md:p-8 lg:p-10 space-y-8">
        <header className="space-y-2 max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-secondary">Before you upload</p>
          <h2
            id="upload-guide-title"
            className="font-serif text-2xl md:text-3xl text-primary font-semibold tracking-tight leading-tight"
          >
            What to send so the AI reads everything
          </h2>
          <p className="text-[14px] md:text-[15px] text-on-surface-variant/90 leading-relaxed">
            Regrade looks for <strong className="font-medium text-primary">scores</strong>,{' '}
            <strong className="font-medium text-primary">rubric lines</strong>, and{' '}
            <strong className="font-medium text-primary">every teacher comment</strong> — then explains what to fix or appeal.
          </p>
        </header>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {UPLOAD_STEPS.map((step, i) => (
            <motion.li
              key={step.num}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              className="relative flex gap-4 rounded-2xl border border-primary/10 bg-white/90 p-5 shadow-sm"
            >
              <div className="shrink-0 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary/40">{step.num}</span>
                <div className="p-2.5 rounded-xl bg-primary/5 text-primary">
                  <step.icon size={20} strokeWidth={1.75} />
                </div>
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-lg text-primary font-semibold leading-snug">{step.title}</p>
                <p className="text-[12px] text-on-surface-variant/85 leading-relaxed mt-1">{step.body}</p>
              </div>
              {i < UPLOAD_STEPS.length - 1 ? (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-primary/15">
                  <ICONS.ChevronRight size={16} />
                </div>
              ) : null}
            </motion.li>
          ))}
        </ol>

        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary/45 px-1">
            Pick your platform
          </p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const isActive = p.id === selected;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-all border ${
                    isActive
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                      : 'bg-white/80 text-primary/65 border-primary/15 hover:border-primary/30 hover:bg-white'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
              className="rounded-2xl border border-primary/12 bg-white p-6 md:p-7 space-y-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-secondary mb-1">
                    {active.name}
                  </p>
                  <h3 className="text-xl md:text-2xl text-primary font-semibold">{active.fileLabel}</h3>
                  <p className="text-[12px] text-primary/50 mt-1 font-mono">{active.short}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 px-3 py-2 rounded-xl bg-secondary/10 border border-secondary/20">
                  <ICONS.Check className="text-secondary w-4 h-4" strokeWidth={2.5} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Best for appeals</span>
                </div>
              </div>

              <ol className="space-y-3">
                {active.steps.map((line, idx) => (
                  <li key={idx} className="flex gap-3 text-[13px] md:text-[14px] leading-relaxed text-primary/85">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-primary/8 text-primary text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-primary/8">
                <div className="rounded-xl bg-primary/[0.03] border border-primary/10 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary/45 mb-2 flex items-center gap-1.5">
                    <ICONS.CheckCircle2 size={14} className="text-secondary" />
                    Include in your file
                  </p>
                  <ul className="space-y-1">
                    {active.mustInclude.map((item) => (
                      <li key={item} className="text-[12px] text-primary/75 flex gap-2">
                        <span className="text-secondary shrink-0">·</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-red-500/[0.04] border border-red-500/15 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-700/70 mb-2 flex items-center gap-1.5">
                    <ICONS.AlertCircle size={14} />
                    Skip this
                  </p>
                  <p className="text-[12px] text-red-900/70 leading-snug">{active.avoid}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center text-[11px] text-primary/40 italic border-t border-primary/8 pt-5">
          PDF and PNG/JPG work · Word files → save as PDF first · Then use the upload box below
        </p>
      </div>
    </motion.section>
  );
}
