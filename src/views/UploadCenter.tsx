import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ICONS } from '../constants';
import Advocate from './Advocate';
import UploadGuidePanel from '../components/UploadGuidePanel';
import { caseService } from '../services/caseService';
import { scanContentForThreats } from '../lib/securityScanner';
import { sanitizeUserText } from '../lib/sanitize';
import {
  formatMaxUploadSize,
  isAllowedUploadFile,
  MAX_STAGED_UPLOAD_FILES,
  MAX_UPLOAD_FILE_BYTES,
} from '../lib/uploadLimits';
import { userService } from '../services/userService';
import { auth } from '../lib/firebase';
import type { AiEngine } from '../types';

type PdfStatus = 'idle' | 'loading' | 'done' | 'error';

type StagedUpload = {
  id: string;
  file: File;
  progress: number;
  previewUrl?: string;
  pdfText?: string;
  pdfStatus: PdfStatus;
  pdfError?: string;
};

/** Must match server AnalyzeSchema inlineImages max (12). */
const MAX_INLINE_IMAGES = 12;

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Example Gradescope UI screenshots (user-provided). Static files live in
 * `public/gradescope/examples/` — URLs are served from the site root.
 */
const GRADESCOPE_EXAMPLE_PATHS = {
  downloadOriginalVsGraded: '/gradescope/examples/01-download-original-vs-graded.png',
  downloadGradedCopyButton: '/gradescope/examples/02-download-graded-copy-button.png',
  assignmentViewToolbar: '/gradescope/examples/03-assignment-view-with-toolbar.png',
  scoreSummary: '/gradescope/examples/04-score-summary-example.png',
} as const;

async function fileToBase64Inline(file: File): Promise<{ mimeType: string; data: string }> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return {
    mimeType: file.type || 'application/octet-stream',
    data: btoa(binary),
  };
}

export default function UploadCenter({ onSubmit }: { onSubmit: (caseId?: string) => void }) {
  /** Single optional box — rubric, marks, and feedback are inferred from the upload by default. */
  const [extraNotes, setExtraNotes] = useState('');

  const [showAdvocate, setShowAdvocate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  const [stagedUploads, setStagedUploads] = useState<StagedUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  const [gradescopeHelpOpen, setGradescopeHelpOpen] = useState(false);
  const [otherSystemsHelpOpen, setOtherSystemsHelpOpen] = useState(false);

  /**
   * AI engine choice. `null` means we haven't loaded the user's stored choice
   * yet (or they've never made one). Apple's third-party AI rule requires an
   * explicit in-app consent before sending uploads to Gemini/Claude — we gate
   * the Analyze button on this being set, and show a consent modal on the
   * first run.
   */
  const [aiEngine, setAiEngine] = useState<AiEngine | null>(null);
  const [showAiConsent, setShowAiConsent] = useState(false);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      previewUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    let cancelled = false;
    (async () => {
      try {
        const prof = await userService.getProfile(u.uid);
        if (cancelled) return;
        if (prof?.aiEngine && prof.aiConsentAt) {
          setAiEngine(prof.aiEngine);
        }
      } catch (err) {
        console.error('Failed to load AI preference:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const acceptAiConsent = async (choice: AiEngine) => {
    const u = auth.currentUser;
    setAiEngine(choice);
    setShowAiConsent(false);
    if (u) {
      try {
        await userService.setAiPreference(u.uid, choice);
      } catch (err) {
        console.error('Failed to persist AI preference:', err);
      }
    }
  };

  const simulateUploadProgress = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setStagedUploads((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress } : f)),
      );
    }, 400);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      if (stagedUploads.length >= MAX_STAGED_UPLOAD_FILES) {
        setSecurityError(`You can stage up to ${MAX_STAGED_UPLOAD_FILES} files at a time.`);
        break;
      }

      if (file.size > MAX_UPLOAD_FILE_BYTES) {
        setSecurityError(`"${file.name}" is too large. Maximum size is ${formatMaxUploadSize()} per file.`);
        continue;
      }

      const isPdf = isPdfFile(file);
      const isImage = file.type.startsWith('image/');

      if (!isAllowedUploadFile(file)) {
        if (file.name.match(/\.(doc|docx)$/i)) {
          setSecurityError(
            'Word (.doc / .docx) files are not read here yet. Save as PDF or type the main points in optional notes.',
          );
        } else {
          setSecurityError(`Unsupported file: ${file.name}. Use a PDF or an image (PNG, JPG, etc.).`);
        }
        continue;
      }

      const id = crypto.randomUUID();
      let previewUrl: string | undefined;
      if (isImage) {
        previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.add(previewUrl);
      }

      const entry: StagedUpload = {
        id,
        file,
        progress: 0,
        previewUrl,
        pdfStatus: isPdf ? 'loading' : 'idle',
      };

      setStagedUploads((prev) => [...prev, entry]);

      if (isPdf) {
        void (async () => {
          try {
            const { extractTextFromPdfFile } = await import('../lib/pdfText');
            const pdfText = await extractTextFromPdfFile(file);
            setStagedUploads((prev) =>
              prev.map((s) =>
                s.id === id ? { ...s, pdfText, pdfStatus: 'done', progress: 100 } : s,
              ),
            );
          } catch (e) {
            console.error(e);
            setStagedUploads((prev) =>
              prev.map((s) =>
                s.id === id
                  ? {
                      ...s,
                      pdfStatus: 'error',
                      pdfError:
                        'Could not read this PDF. Try a screenshot/image or paste the text.',
                      progress: 100,
                    }
                  : s,
              ),
            );
          }
        })();
      } else {
        simulateUploadProgress(id);
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setStagedUploads((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
        previewUrlsRef.current.delete(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSubmit = async () => {
    // Apple's third-party AI rule: explicit consent must precede sending
    // uploads to Gemini/Claude. If the user hasn't chosen an engine yet,
    // open the consent modal instead of running analysis.
    if (!aiEngine) {
      setShowAiConsent(true);
      return;
    }

    const pdfLoading = stagedUploads.some((s) => isPdfFile(s.file) && s.pdfStatus === 'loading');
    if (pdfLoading) {
      setSecurityError('Still reading your PDF… wait a few seconds, then tap Analyze again.');
      return;
    }

    const imageFiles = stagedUploads.filter((s) => s.file.type.startsWith('image/'));
    const pdfStaged = stagedUploads.filter((s) => isPdfFile(s.file));
    const hasPdfFiles = pdfStaged.length > 0;
    const hasImageEvidence = imageFiles.length > 0;
    const pdfTexts = stagedUploads.map((s) => s.pdfText).filter((t): t is string => !!t && t.length > 0);
    const hasPdfText = pdfTexts.length > 0;
    const notes = sanitizeUserText(extraNotes.trim(), 32_000);
    const hasTypedContext = notes.length > 0;
    const hasVisionEvidence = hasImageEvidence || hasPdfFiles;

    if (!hasTypedContext && !hasVisionEvidence) {
      setSecurityError(
        'Add a PDF or photo of your graded work (Gradescope, Canvas, Moodle, Turnitin, or marked paper), or type a short note — then tap Analyze.',
      );
      return;
    }

    const assignmentBlock = [
      ...pdfStaged.map((s, i) => {
        const text = s.pdfText?.trim();
        if (text && text.length > 0) {
          return `--- Text extracted from PDF ${i + 1} (${s.file.name}) ---\n${text}`;
        }
        return `--- PDF ${i + 1} (${s.file.name}): no text layer — read all marks and instructor comments from the page images ---`;
      }),
      notes ? `--- Notes from student (optional) ---\n${notes}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const inferFromUpload = hasVisionEvidence
      ? '(Infer from uploads. Detect platform: Gradescope, Canvas, Moodle, Blackboard, D2L Brightspace, Google Classroom, Turnitin, or handwritten paper. Extract EVERY instructor comment including Gradescope bubbles, Canvas pins, Turnitin QuickMarks, and margin notes.)'
      : '';

    const rubricBlock =
      hasTypedContext && !hasVisionEvidence
        ? '(Student notes only — extract any rubric or criteria mentioned in the notes.)'
        : inferFromUpload || '(No separate rubric text.)';

    const feedbackBlock =
      hasTypedContext && !hasVisionEvidence
        ? '(Student notes only — extract instructor feedback from the notes if any.)'
        : inferFromUpload || '(No separate feedback text.)';

    setLoading(true);
    setLoadingDetail(null);
    setSecurityError(null);

    try {
      const combinedInput = [
        `Assignment / evidence:\n${assignmentBlock || '[See uploaded images only]'}`,
        `Rubric:\n${rubricBlock}`,
        `Feedback:\n${feedbackBlock}`,
        ...stagedUploads.map((s) => `File: ${s.file.name} (${s.file.type || 'unknown'})`),
      ].join('\n\n');

      const scanResult = await scanContentForThreats(combinedInput, 'appeal');

      if (!scanResult.isSafe) {
        setSecurityError(
          scanResult.recommendation ||
            "Your submission contains content that can't be processed. Please review and try again.",
        );
        setLoading(false);
        return;
      }

      const { performComprehensiveAnalysis } = await import('../lib/gemini');
      const { renderPdfPagesToInlineImages, pdfVisionPageBudget } = await import(
        '../lib/pdfPageImages',
      );

      setLoadingDetail('Preparing page images for AI (Gradescope, Canvas, handwriting…)…');
      const inlineImages: { mimeType: string; data: string }[] = [];

      for (const s of imageFiles) {
        if (inlineImages.length >= MAX_INLINE_IMAGES) break;
        inlineImages.push(await fileToBase64Inline(s.file));
      }

      const pdfCount = pdfStaged.length;
      for (let pi = 0; pi < pdfStaged.length; pi++) {
        const s = pdfStaged[pi];
        const remaining = MAX_INLINE_IMAGES - inlineImages.length;
        if (remaining <= 0) break;
        setLoadingDetail(
          `Reading PDF ${pi + 1} of ${pdfCount} (scores & teacher comments)…`,
        );
        const maxPages = pdfVisionPageBudget(s.pdfText?.length ?? 0, remaining, pdfCount);
        const pages = await renderPdfPagesToInlineImages(s.file, maxPages);
        inlineImages.push(...pages);
      }

      if (!inlineImages.length && !assignmentBlock.trim() && !notes) {
        setSecurityError(
          'Could not prepare your file for analysis. Try a clearer PDF export or a screenshot (PNG/JPG).',
        );
        setLoading(false);
        setLoadingDetail(null);
        return;
      }

      setLoadingDetail('Analyzing scores, rubric, and instructor comments…');

      const analysisResult = await performComprehensiveAnalysis(
        assignmentBlock ||
          '[No pasted assignment text — use attached page images (PDF pages are rendered as images for vision).]',
        rubricBlock,
        feedbackBlock,
        {
          ...(inlineImages.length ? { inlineImages } : {}),
          aiEngine,
        },
      );

      const docRef = await caseService.createCase({
        title: analysisResult.assignment.title || 'New Appeal',
        description: `Analysis complete for ${analysisResult.assignment.subject || 'your assignment'}. Case strength: ${analysisResult.case_analysis.overall_case_strength}.`,
        ref: `C-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Draft Ready',
        progress: 66,
        evidenceLogged: true,
        facultyReview: false,
        analysis: analysisResult,
        rawInput: {
          assignment: notes + (pdfTexts.length ? `\n[${pdfTexts.length} PDF(s) extracted]` : ''),
          rubric: '',
          feedback: '',
        },
      });
      onSubmit(docRef.id);
    } catch (err: unknown) {
      console.error('Analysis failed:', err);
      setSecurityError(
        err instanceof Error
          ? err.message
          : 'Analysis failed. Please check that your text is readable and try again.',
      );
    } finally {
      setLoading(false);
      setLoadingDetail(null);
    }
  };

  if (showAdvocate) {
    return <Advocate onBack={() => setShowAdvocate(false)} />;
  }

  return (
    <>
      <AnimatePresence>
        {showAiConsent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-consent-title"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-3xl max-w-lg w-full p-8 md:p-10 shadow-2xl border border-primary/10 space-y-6"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-primary/5">
                  <ICONS.Shield className="text-primary w-6 h-6" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 id="ai-consent-title" className="text-2xl text-primary font-semibold leading-tight">
                    Two AI readers will check your worksheet
                  </h2>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-primary/45 mt-1">One-time choice — change anytime in Profile</p>
                </div>
              </div>

              <div className="space-y-3 text-[13.5px] text-on-surface-variant leading-relaxed">
                <p>
                  Regrade uses <strong className="font-semibold text-primary">Gemini</strong> (by Google) and{' '}
                  <strong className="font-semibold text-primary">Claude</strong> (by Anthropic) together. Gemini reads marks and
                  handwriting on your file; Claude reasons about whether the marking was fair. Cross-checking both readers
                  catches more mistakes than one model alone.
                </p>
                <p className="text-[12.5px] text-on-surface-variant/80">
                  By continuing, you agree that the file you upload may be sent to Google and Anthropic for analysis. They process
                  the content as our service providers and do not use it to train their general models.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => acceptAiConsent('hybrid')}
                  className="w-full flex items-center justify-between gap-3 bg-primary text-white px-5 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] hover:shadow-xl hover:shadow-primary/20 transition-all"
                >
                  <span className="text-left">
                    <span className="block">Continue with both</span>
                    <span className="block text-[9px] font-normal tracking-[0.18em] opacity-70 normal-case mt-0.5">Recommended — catches more</span>
                  </span>
                  <ICONS.ArrowRight className="opacity-80" size={18} />
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => acceptAiConsent('gemini')}
                    className="flex-1 px-4 py-3 rounded-2xl border border-primary/15 text-primary text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-primary/5 transition-all"
                  >
                    Gemini only
                  </button>
                  <button
                    type="button"
                    onClick={() => acceptAiConsent('claude')}
                    className="flex-1 px-4 py-3 rounded-2xl border border-primary/15 text-primary text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-primary/5 transition-all"
                  >
                    Claude only
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiConsent(false)}
                  className="w-full text-[10px] font-bold uppercase tracking-[0.22em] text-primary/40 hover:text-primary/70 transition-colors mt-1 py-2"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[10.5px] text-primary/40 leading-relaxed pt-2 border-t border-primary/5">
                Gemini is a trademark of Google LLC. Claude is a trademark of Anthropic PBC. Regrade is not affiliated with
                either.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 relative max-w-7xl mx-auto">
      <div className="lg:col-span-8 space-y-8">
        <section className="space-y-3">
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary font-semibold tracking-tight text-center md:text-left">
            Upload your graded worksheet
          </h1>
          <p className="text-base md:text-lg text-on-surface-variant/85 leading-relaxed max-w-2xl text-center md:text-left">
            One <strong className="font-medium text-primary">PDF or photo</strong> is enough — the AI reads scores, rubric, and{' '}
            <strong className="font-medium text-primary">every teacher comment</strong> (Gradescope, Canvas, Moodle, Blackboard,
            Brightspace, Classroom, Turnitin, or handwritten).
            Add a line or two below only if something important isn&apos;t visible on the file.
          </p>
        </section>

        <UploadGuidePanel />

        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-2xl md:rounded-[2rem] p-6 md:p-8 space-y-6 border border-primary/10 bg-white"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-primary/5 pb-5">
            <div>
              <h2 className="text-xl md:text-2xl text-primary font-semibold tracking-tight">Upload your file</h2>
              <p className="text-[11px] text-primary/50 mt-0.5">Drag graded PDF or photos here when you&apos;re ready</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvocate(true)}
              className="self-start sm:self-auto text-[11px] font-bold uppercase tracking-widest text-primary/45 hover:text-primary border border-primary/10 rounded-xl px-4 py-2.5 transition-colors"
            >
              Questions? Chat
            </button>
          </div>

          <div
            className={`rounded-xl border border-primary/15 transition-colors ${
              gradescopeHelpOpen ? 'bg-primary/[0.05]' : 'bg-primary/[0.03]'
            }`}
          >
            <button
              type="button"
              aria-expanded={gradescopeHelpOpen}
              onClick={() => setGradescopeHelpOpen((o) => !o)}
              className="flex w-full cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-primary"
            >
              <span className="flex items-center gap-2 min-w-0">
                <ICONS.BookOpen className="text-secondary shrink-0" size={18} strokeWidth={1.75} />
                <span className="leading-snug">Using Gradescope? Get the graded PDF first</span>
              </span>
              <ICONS.ChevronDown
                className={`shrink-0 w-4 h-4 text-primary/45 transition-transform ${
                  gradescopeHelpOpen ? 'rotate-180' : ''
                }`}
                strokeWidth={2}
              />
            </button>
            {gradescopeHelpOpen ? (
            <div className="space-y-4 border-t border-primary/10 px-4 pb-4 pt-3">
              <p className="text-[12px] text-primary/60 leading-relaxed">
                Examples below are <strong className="font-medium text-primary/80">real Gradescope screenshots</strong> (reference only — your
                course may look slightly different). Files load from{' '}
                <code className="rounded bg-primary/5 px-1 py-0.5 text-[11px] font-mono text-primary/70">/gradescope/examples/</code>.
              </p>
              <ol className="list-decimal space-y-2 pl-4 text-[13px] leading-relaxed text-primary/80 marker:font-sans marker:text-primary/50">
                <li>Open your graded submission in Gradescope (the page with your score and questions).</li>
                <li>
                  Scroll to the bottom and click{' '}
                  <strong className="font-semibold text-primary">Download Graded Copy</strong> —{' '}
                  <span className="text-primary/65">not</span> &quot;Download Original&quot;. The graded PDF includes marks, rubric, and feedback.
                </li>
                <li>Save the file, then drag it into the upload box below (or tap to choose it).</li>
              </ol>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <figure className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
                  <img
                    src={GRADESCOPE_EXAMPLE_PATHS.downloadOriginalVsGraded}
                    alt="Example: Gradescope toolbar showing Download Original and Download Graded Copy"
                    className="w-full object-contain object-top"
                    loading="lazy"
                  />
                  <figcaption className="border-t border-primary/5 px-2 py-1.5 text-[10px] text-primary/55 leading-snug">
                    Choose <strong className="text-primary">Download Graded Copy</strong> (right), not Original.
                  </figcaption>
                </figure>
                <figure className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
                  <img
                    src={GRADESCOPE_EXAMPLE_PATHS.downloadGradedCopyButton}
                    alt="Example: Download Graded Copy button close-up"
                    className="w-full object-contain object-top max-h-32 sm:max-h-none"
                    loading="lazy"
                  />
                  <figcaption className="border-t border-primary/5 px-2 py-1.5 text-[10px] text-primary/55">
                    This is the file Regrade reads best.
                  </figcaption>
                </figure>
                <figure className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm sm:col-span-2">
                  <img
                    src={GRADESCOPE_EXAMPLE_PATHS.assignmentViewToolbar}
                    alt="Example: Gradescope graded assignment view with download buttons at the bottom"
                    className="w-full object-contain object-top max-h-48 sm:max-h-64"
                    loading="lazy"
                  />
                  <figcaption className="border-t border-primary/5 px-2 py-1.5 text-[10px] text-primary/55">
                    Buttons are usually at the bottom of the graded submission view.
                  </figcaption>
                </figure>
                <figure className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm sm:col-span-2">
                  <img
                    src={GRADESCOPE_EXAMPLE_PATHS.scoreSummary}
                    alt="Example: Gradescope score summary with total points and per-question scores"
                    className="w-full object-contain object-top max-h-56"
                    loading="lazy"
                  />
                  <figcaption className="border-t border-primary/5 px-2 py-1.5 text-[10px] text-primary/55">
                    The graded PDF usually includes this kind of breakdown — the AI uses it automatically.
                  </figcaption>
                </figure>
              </div>
            </div>
            ) : null}
          </div>

          <div
            className={`rounded-xl border border-primary/15 transition-colors ${
              otherSystemsHelpOpen ? 'bg-primary/[0.05]' : 'bg-primary/[0.03]'
            }`}
          >
            <button
              type="button"
              aria-expanded={otherSystemsHelpOpen}
              onClick={() => setOtherSystemsHelpOpen((o) => !o)}
              className="flex w-full cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-primary"
            >
              <span className="flex items-center gap-2 min-w-0">
                <ICONS.Library className="text-secondary shrink-0" size={18} strokeWidth={1.75} />
                <span className="leading-snug">Canvas, Moodle, Turnitin, or another system? Get your graded copy</span>
              </span>
              <ICONS.ChevronDown
                className={`shrink-0 w-4 h-4 text-primary/45 transition-transform ${
                  otherSystemsHelpOpen ? 'rotate-180' : ''
                }`}
                strokeWidth={2}
              />
            </button>
            {otherSystemsHelpOpen ? (
            <div className="space-y-4 border-t border-primary/10 px-4 pb-4 pt-3">
              <p className="text-[12px] text-primary/60 leading-relaxed">
                Regrade works with <strong className="font-medium text-primary/80">any graded PDF or clear photos</strong> — not only
                Gradescope. Your goal is the file or view that shows <strong className="font-medium text-primary/80">scores, rubric, and
                instructor comments</strong> together. If you only have a link, open it in a browser, then use{' '}
                <strong className="font-medium text-primary/80">Save as PDF</strong> or <strong className="font-medium text-primary/80">Print → PDF</strong>{' '}
                on the page that shows the marks.
              </p>
              <div className="space-y-3 text-[12px] leading-relaxed text-primary/80">
                <div className="rounded-lg border border-primary/10 bg-white/80 px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary/45 mb-1">Canvas</p>
                  <p>
                    <strong className="font-semibold text-primary">Grades</strong> → your course → the assignment. Open your submission
                    and SpeedGrader feedback. Download the marked file if you see a download; otherwise print the feedback page to PDF so
                    rubric and comments stay visible.
                  </p>
                </div>
                <div className="rounded-lg border border-primary/10 bg-white/80 px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary/45 mb-1">Moodle</p>
                  <p>
                    Open the <strong className="font-semibold text-primary">assignment</strong> → your submission →{' '}
                    <strong className="font-semibold text-primary">Feedback</strong> (files or comments your instructor returned). Download
                    the annotated PDF if one is attached.
                  </p>
                </div>
                <div className="rounded-lg border border-primary/10 bg-white/80 px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary/45 mb-1">Blackboard</p>
                  <p>
                    <strong className="font-semibold text-primary">My Grades</strong> → the item → view attempt / feedback. Save any
                    returned file; if it’s only on screen, capture or print that view to PDF.
                  </p>
                </div>
                <div className="rounded-lg border border-primary/10 bg-white/80 px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary/45 mb-1">Google Classroom</p>
                  <p>
                    <strong className="font-semibold text-primary">Classwork</strong> → the assignment → your turned-in work. Open the
                    returned Doc/PDF in Drive; instructor comments usually show in the file. Export or print to PDF if needed.
                  </p>
                </div>
                <div className="rounded-lg border border-primary/10 bg-white/80 px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary/45 mb-1">D2L Brightspace</p>
                  <p>
                    <strong className="font-semibold text-primary">Assignments</strong> → your submission →{' '}
                    <strong className="font-semibold text-primary">Feedback</strong>. Use the feedback view your instructor left; download
                    attachments or print the feedback page to PDF.
                  </p>
                </div>
                <div className="rounded-lg border border-primary/10 bg-white/80 px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary/45 mb-1">Turnitin Feedback Studio</p>
                  <p>
                    Open your submission in Feedback Studio. If your school allows it,{' '}
                    <strong className="font-semibold text-primary">download</strong> or <strong className="font-semibold text-primary">print</strong>{' '}
                    the version with inline instructor comments and the similarity layer hidden if you only need grading marks.
                  </p>
                </div>
                <div className="rounded-lg border border-primary/10 bg-white/80 px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary/45 mb-1">Schoology · Microsoft Teams Education</p>
                  <p>
                    Go to <strong className="font-semibold text-primary">Materials / Grades / Assignments</strong>, open the graded
                    submission, then save any file your teacher returned or print the feedback screen to PDF.
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-primary/50 leading-relaxed">
                Not sure which path your school uses? Tap <strong className="text-primary/70">Questions? Chat</strong> — the assistant can
                ask which portal you see and walk you through it.
              </p>
            </div>
            ) : null}
          </div>

          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById('file-upload-1')?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 md:p-12 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer ${
              isDragging ? 'border-primary bg-primary/10' : 'border-primary/15 bg-primary/[0.04] hover:bg-primary/[0.07]'
            }`}
          >
            <input
              id="file-upload-1"
              type="file"
              className="hidden"
              accept=".pdf,image/*"
              multiple
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <div className="bg-white p-3 rounded-xl shadow-md shadow-primary/10">
              <ICONS.Upload className="text-primary w-7 h-7" />
            </div>
            <p className="text-lg text-primary font-semibold">Drop or choose PDF / photo</p>
            <p className="text-[11px] text-primary/45 max-w-sm">Screenshots work. No account for the file — we analyze what you upload.</p>
          </div>

          {stagedUploads.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stagedUploads.map((u) => (
                <div
                  key={u.id}
                  className="relative rounded-xl border border-primary/10 bg-white overflow-hidden shadow-sm"
                >
                  {u.previewUrl ? (
                    <img src={u.previewUrl} alt="" className="w-full h-40 object-contain bg-black/[0.03]" />
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center gap-1.5 bg-primary/[0.03] p-3">
                      <ICONS.FileText className="text-primary/35 w-8 h-8" />
                      <p className="text-[10px] font-mono text-primary/45 text-center px-2 truncate w-full">{u.file.name}</p>
                      {u.pdfStatus === 'loading' && (
                        <p className="text-xs text-primary/55">Reading PDF…</p>
                      )}
                      {u.pdfStatus === 'done' && (
                        <p className="text-[10px] text-secondary font-bold uppercase text-center px-2">
                          {u.pdfText && u.pdfText.length > 0
                            ? `${u.pdfText.length.toLocaleString()} chars text + pages as images`
                            : 'Scan PDF — pages sent as images for AI'}
                        </p>
                      )}
                      {u.pdfStatus === 'error' && (
                        <p className="text-[10px] text-red-600 text-center px-2">{u.pdfError}</p>
                      )}
                    </div>
                  )}
                  <div className="p-2.5 flex items-center justify-between gap-2 border-t border-primary/5">
                    <span className="text-[10px] text-primary/45 truncate">{u.file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(u.id)}
                      className="text-[10px] font-bold uppercase text-red-600 hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                  {u.progress < 100 && u.pdfStatus !== 'loading' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/10">
                      <div className="h-full bg-primary transition-all" style={{ width: `${u.progress}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-primary/5">
            <label className="text-xs font-semibold text-primary/55">
              Optional — only if the worksheet doesn&apos;t show everything
            </label>
            <textarea
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              maxLength={8000}
              rows={3}
              className="w-full bg-white border border-primary/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 resize-y text-primary/85 placeholder:text-primary/30"
              placeholder="e.g. course name, which question you’re appealing, or text that’s cut off in the photo…"
            />
          </div>
        </motion.div>

        {securityError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-4 text-red-700"
          >
            <ICONS.ShieldAlert size={24} className="flex-shrink-0" />
            <div>
              <p className="text-sm font-bold uppercase tracking-widest mb-1">Please review your input</p>
              <p className="text-xs italic">{securityError}</p>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-primary/5">
          <div className="flex items-center gap-2 text-primary/35">
            <ICONS.Shield className="shrink-0" size={20} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Private & encrypted</p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-primary text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50"
          >
            {loading ? loadingDetail || 'Analyzing…' : 'Analyze worksheet'}
            {!loading && <ICONS.ArrowRight className="opacity-70" size={18} />}
          </button>
        </div>
      </div>

      {/* Right Sidebar: Status */}
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-panel rounded-2xl p-8 space-y-8 sticky top-24">
          <h3 className="text-2xl text-primary">Your Checklist</h3>

          {(() => {
            const hasPdfText = stagedUploads.some((s) => (s.pdfText?.length ?? 0) > 0);
            const hasImages = stagedUploads.some((s) => s.file.type.startsWith('image/'));
            const notesTrim = extraNotes.trim().length > 0;
            const worksheetOk = hasPdfText || hasImages;

            type RowState = 'done' | 'optional' | 'needed';
            const fileRow: RowState = worksheetOk ? 'done' : notesTrim ? 'optional' : 'needed';
            const notesRow: RowState = notesTrim ? 'done' : worksheetOk ? 'optional' : 'needed';

            const steps: { label: string; state: RowState; hint: string }[] = [
              {
                label: 'Graded worksheet (PDF or photo)',
                state: fileRow,
                hint:
                  fileRow === 'done'
                    ? 'AI will read marks, rubric, and comments from this'
                    : fileRow === 'optional'
                      ? 'You typed context only — a photo/PDF still helps a lot'
                      : 'Add your marked work, or type what you have in optional notes',
              },
              {
                label: 'Extra notes',
                state: notesRow,
                hint:
                  notesRow === 'done'
                    ? 'Added — thanks, that helps'
                    : notesRow === 'optional'
                      ? 'Skipping is fine if the file shows everything'
                      : 'Optional — use if something’s missing from the file',
              },
            ];

            const rowScore = (state: RowState) => (state === 'done' || state === 'optional' ? 1 : 0);
            const pct = Math.round(((rowScore(fileRow) + rowScore(notesRow)) / 2) * 100);

            return (
              <>
                <div className="space-y-8 relative">
                  <div className="absolute left-[15px] top-4 bottom-4 w-[1px] bg-primary/10" />
                  {steps.map((s, i) => (
                    <div
                      key={i}
                      className={`flex gap-6 relative transition-opacity ${
                        s.state === 'needed' && i > 0 && steps[i - 1].state === 'needed' ? 'opacity-30' : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 transition-colors ${
                          s.state === 'done'
                            ? 'bg-secondary'
                            : s.state === 'optional'
                              ? 'bg-amber-100 border-2 border-amber-400/80'
                              : 'bg-on-surface-variant/10 border border-on-surface-variant/20'
                        }`}
                      >
                        {s.state === 'done' ? (
                          <ICONS.Check className="text-white w-4 h-4" />
                        ) : s.state === 'optional' ? (
                          <ICONS.Zap className="text-amber-700 w-4 h-4" strokeWidth={2} />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-on-surface-variant" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${
                            s.state === 'done'
                              ? 'text-secondary'
                              : s.state === 'optional'
                                ? 'text-amber-800'
                                : 'text-primary/40'
                          }`}
                        >
                          {s.state === 'done' ? 'Done' : s.state === 'optional' ? 'Optional' : 'Needed'}
                        </p>
                        <p className="text-sm font-bold text-primary">{s.label}</p>
                        {s.hint ? (
                          <p className="text-[11px] text-on-surface-variant opacity-75 leading-snug mt-0.5">{s.hint}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-primary/5">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Ready</span>
                    <span className="text-lg font-bold text-primary">{pct}%</span>
                  </div>
                  <div className="w-full h-1 bg-primary/5 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${pct}%` }}
                      className="h-full bg-primary shadow-[0_0_10px_rgba(0,35,111,0.3)]"
                    />
                  </div>
                </div>
              </>
            );
          })()}

          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3">
            <ICONS.Zap className="text-primary w-5 h-5 flex-shrink-0" />
            <p className="text-[11px] text-primary/80 font-semibold leading-relaxed">
              Most students only upload one file. The model figures out the rest from the worksheet.
            </p>
          </div>
        </div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          onClick={() => setShowAdvocate(true)}
          className="glass-panel rounded-2xl overflow-hidden aspect-[4/3] relative group cursor-pointer"
        >
          <img 
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800" 
            alt="Help" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent opacity-80" />
          <div className="absolute bottom-6 left-6 right-6">
             <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">AI Assistant</p>
             <h4 className="text-2xl text-white leading-tight">Not sure what to include? Ask for help.</h4>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
}
