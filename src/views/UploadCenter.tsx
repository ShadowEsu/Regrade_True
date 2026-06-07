import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ICONS } from '../constants';
import Advocate from './Advocate';
import UploadGuidePanel from '../components/UploadGuidePanel';
import AiEnginePicker from '../components/AiEnginePicker';
import AppealFlowShell from '../components/AppealFlowShell';
import { caseService } from '../services/caseService';
import { scanContentForThreats } from '../lib/securityScanner';
import { sanitizeUserText } from '../lib/sanitize';
import {
  formatMaxUploadSize,
  isAllowedUploadFile,
  MAX_STAGED_UPLOAD_FILES,
  MAX_UPLOAD_FILE_BYTES,
} from '../lib/uploadLimits';
import { userService, type UserProfile } from '../services/userService';
import { auth } from '../lib/firebase';
import { buildStudentProfileContext, isValidPlatformGuideId } from '../lib/profileContext';
import type { PlatformGuideId } from '../lib/platformUploadGuides';
import { AI_SERVICES_CONSENT, AI_TRADEMARK_FOOTER } from '../version';
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

export default function UploadCenter({
  onSubmit,
  onBack,
}: {
  onSubmit: (caseId?: string) => void;
  onBack?: () => void;
}) {
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
  const [selectedEngine, setSelectedEngine] = useState<AiEngine>('hybrid');
  const [showAiConsent, setShowAiConsent] = useState(false);
  const pendingAnalyzeRef = useRef(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [appealPlatform, setAppealPlatform] = useState<PlatformGuideId>('gradescope');
  const profilePlatformLoadedRef = useRef(false);

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
        if (prof) {
          setUserProfile(prof);
          if (!profilePlatformLoadedRef.current && isValidPlatformGuideId(prof.preferredPlatform)) {
            setAppealPlatform(prof.preferredPlatform);
            profilePlatformLoadedRef.current = true;
          }
          if (prof.aiEngine && prof.aiConsentAt) {
            setAiEngine(prof.aiEngine);
            setSelectedEngine(prof.aiEngine);
          }
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
    setSelectedEngine(choice);
    setShowAiConsent(false);
    if (u) {
      try {
        await userService.setAiPreference(u.uid, choice);
      } catch (err) {
        console.error('Failed to persist AI preference:', err);
      }
    }
    if (pendingAnalyzeRef.current) {
      pendingAnalyzeRef.current = false;
      setTimeout(() => void handleSubmit(choice), 0);
    }
  };

  const handleEngineSelect = async (engine: AiEngine) => {
    setSelectedEngine(engine);
    if (!aiEngine) return;
    setAiEngine(engine);
    const u = auth.currentUser;
    if (u) {
      try {
        await userService.setAiPreference(u.uid, engine);
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

  const handleSubmit = async (engineOverride?: AiEngine) => {
    const engine = engineOverride ?? aiEngine ?? selectedEngine;

    // Apple's third-party AI rule: explicit consent must precede sending
    // uploads to Gemini/Claude. If the user hasn't consented yet, open the
    // consent modal (pre-filled with their picker choice) instead of analyzing.
    if (!aiEngine && !engineOverride) {
      pendingAnalyzeRef.current = true;
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

    const profileContext = buildStudentProfileContext(userProfile, appealPlatform);

    const assignmentBlock = [
      profileContext,
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

    const platformHint = appealPlatform
      ? `(Student selected ${appealPlatform.replace(/_/g, ' ')} for this appeal. Prioritize that platform's layout when reading marks and comments.)`
      : '';

    const inferFromUpload = hasVisionEvidence
      ? `(Infer from uploads. Detect platform: Gradescope, Canvas, Moodle, Blackboard, D2L Brightspace, Google Classroom, Turnitin, Schoology, PowerSchool, Sakai, or handwritten paper. Extract EVERY instructor comment including Gradescope bubbles, Canvas SpeedGrader pins, Turnitin QuickMarks, Schoology rubric rows, and margin notes. ${platformHint})`
      : platformHint;

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
          aiEngine: engine,
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
                  <h2 id="ai-consent-title" className="text-xl text-primary font-semibold leading-tight">
                    AI reader
                  </h2>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-primary/45 mt-1">One-time · change in Profile</p>
                </div>
              </div>

              <p className="text-[12px] text-on-surface-variant leading-relaxed">{AI_SERVICES_CONSENT}</p>

              <AiEnginePicker value={selectedEngine} onChange={setSelectedEngine} />

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => acceptAiConsent(selectedEngine)}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white px-5 py-3.5 rounded-2xl text-[13px] font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all"
                >
                  Continue
                  <ICONS.ArrowRight className="opacity-80" size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAiConsent(false)}
                  className="w-full text-[10px] font-bold uppercase tracking-[0.22em] text-primary/40 hover:text-primary/70 transition-colors mt-1 py-2"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[9px] text-primary/35 pt-2 border-t border-primary/5 leading-relaxed">
                {AI_TRADEMARK_FOOTER}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    <AppealFlowShell
      step="upload"
      centered
      title="Upload graded work"
      subtitle="One PDF or photo is enough — Regrade reads scores, rubric, and teacher comments."
      onBack={onBack}
    >
    <div className="space-y-6">
      <div className="space-y-6">

        <UploadGuidePanel
          selectedPlatformId={appealPlatform}
          onPlatformChange={setAppealPlatform}
          profileDefaultPlatformId={
            isValidPlatformGuideId(userProfile?.preferredPlatform)
              ? userProfile.preferredPlatform
              : undefined
          }
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rg-card p-5 space-y-5"
        >
          <div className="text-center space-y-3 border-b border-hairline pb-5">
            <h2 className="rg-serif text-2xl text-ink font-semibold">Upload your file</h2>
            <p className="text-[13px] text-muted">Drag graded PDF or photos here when you&apos;re ready</p>
            <button
              type="button"
              onClick={() => setShowAdvocate(true)}
              className="rg-btn-ghost text-sm py-2 px-5 mx-auto"
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
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-2.5 transition-all cursor-pointer ${
              isDragging
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-hairline bg-parchment hover:border-primary/30 hover:bg-primary/5'
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
            <p className="rg-serif text-xl text-ink font-semibold">Drop or choose PDF / photo</p>
            <p className="text-[12px] text-muted max-w-sm">Screenshots work. No account linking — we analyze what you upload.</p>
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

        <AiEnginePicker
          value={selectedEngine}
          onChange={handleEngineSelect}
          disabled={loading}
        />

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className="rg-btn-primary w-full py-3.5 text-[15px] disabled:opacity-50 group"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce [animation-delay:300ms]" />
                </span>
                {loadingDetail || 'Analyzing…'}
              </span>
            ) : (
              <>
                Analyze worksheet
                <ICONS.ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
          <p className="text-center text-[12px] text-[#9ca3af] flex items-center justify-center gap-1.5">
            <ICONS.Shield className="w-3.5 h-3.5" strokeWidth={2} />
            Private & encrypted
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvocate(true)}
          className="rg-card rg-card-hover w-full p-4 flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#f0f4ff] flex items-center justify-center shrink-0">
            <ICONS.Bot className="w-5 h-5 text-primary" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-ink">Not sure what to upload?</p>
            <p className="text-[12px] text-muted mt-0.5">Ask the AI coach for help</p>
          </div>
        </button>
      </div>
    </div>
    </AppealFlowShell>
    </>
  );
}
