import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ICONS } from '../constants';
import Advocate from './Advocate';
import { caseService } from '../services/caseService';
import { scanContentForThreats } from '../lib/securityScanner';

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

const MAX_IMAGES_FOR_API = 6;

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
  const [securityError, setSecurityError] = useState<string | null>(null);

  const [stagedUploads, setStagedUploads] = useState<StagedUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  const [gradescopeHelpOpen, setGradescopeHelpOpen] = useState(false);
  const [otherSystemsHelpOpen, setOtherSystemsHelpOpen] = useState(false);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      previewUrlsRef.current.clear();
    };
  }, []);

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
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');

      if (!isPdf && !isImage) {
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
    const pdfLoading = stagedUploads.some(
      (s) => s.file.type === 'application/pdf' && s.pdfStatus === 'loading',
    );
    if (pdfLoading) {
      setSecurityError('Still reading your PDF… wait a few seconds, then tap Analyze again.');
      return;
    }

    const pdfFailed = stagedUploads.some((s) => s.pdfStatus === 'error');
    const hasRecoverablePdfText = stagedUploads.some((s) => (s.pdfText?.length ?? 0) > 0);
    const hasImageEvidence = stagedUploads.some((s) => s.file.type.startsWith('image/'));
    if (pdfFailed && !hasRecoverablePdfText && !hasImageEvidence && !extraNotes.trim()) {
      setSecurityError(
        'PDF text could not be extracted. Add a photo/screenshot of the graded work or type a quick note below, then try again.',
      );
      return;
    }

    const imageFiles = stagedUploads.filter((s) => s.file.type.startsWith('image/'));
    const pdfTexts = stagedUploads.map((s) => s.pdfText).filter((t): t is string => !!t && t.length > 0);

    const hasPdfText = pdfTexts.length > 0;
    const notes = extraNotes.trim();
    const hasTypedContext = notes.length > 0;

    if (!hasTypedContext && !hasImageEvidence && !hasPdfText) {
      setSecurityError(
        'Add a PDF or photo of your graded worksheet (Gradescope, Canvas, or marked paper), or type a short note about the class/assignment — then tap Analyze.',
      );
      return;
    }

    const assignmentBlock = [
      ...pdfTexts.map((t, i) => `--- Text extracted from uploaded PDF ${i + 1} ---\n${t}`),
      notes
        ? `--- Notes from student (optional) ---\n${notes}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const inferFromUpload =
      hasImageEvidence || hasPdfText
        ? '(Infer from the uploaded worksheet: assignment prompt, rubric, scores, and instructor comments — student did not paste these separately.)'
        : '';

    const rubricBlock =
      hasTypedContext && !hasImageEvidence && !hasPdfText
        ? '(Student notes only — extract any rubric or criteria mentioned in the notes.)'
        : inferFromUpload || '(No separate rubric text.)';

    const feedbackBlock =
      hasTypedContext && !hasImageEvidence && !hasPdfText
        ? '(Student notes only — extract instructor feedback from the notes if any.)'
        : inferFromUpload || '(No separate feedback text.)';

    if (!assignmentBlock && !hasImageEvidence) {
      setSecurityError(
        'Upload a clear file of your graded work, or add a bit more in the optional notes box.',
      );
      return;
    }

    setLoading(true);
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

      const inlineImages = [];
      for (const s of imageFiles.slice(0, MAX_IMAGES_FOR_API)) {
        inlineImages.push(await fileToBase64Inline(s.file));
      }

      const analysisResult = await performComprehensiveAnalysis(
        assignmentBlock || '[No pasted assignment — use uploaded images and any PDF text above.]',
        rubricBlock,
        feedbackBlock,
        inlineImages.length ? { inlineImages } : undefined,
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
    }
  };

  if (showAdvocate) {
    return <Advocate onBack={() => setShowAdvocate(false)} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 relative max-w-7xl mx-auto">
      <div className="lg:col-span-8 space-y-8">
        <section className="space-y-3">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-primary font-light tracking-tight text-center md:text-left">
            Upload your graded worksheet
          </h1>
          <p className="text-base md:text-lg text-on-surface-variant/85 font-serif leading-relaxed max-w-2xl text-center md:text-left">
            One <strong className="font-medium text-primary">PDF or photo</strong> is enough — the AI reads scores, rubric, and comments from it.
            Add a line or two below only if something important isn&apos;t visible on the file.
          </p>
        </section>

        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-2xl md:rounded-[2rem] p-6 md:p-8 space-y-6 border border-primary/10 bg-white"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-primary/5 pb-5">
            <div>
              <h2 className="font-serif text-xl md:text-2xl text-primary font-medium tracking-tight">File</h2>
              <p className="text-[11px] text-primary/50 mt-0.5">Gradescope, Canvas, or paper — tap or drag here</p>
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
              <p className="text-[12px] text-primary/60 font-serif leading-relaxed">
                Examples below are <strong className="font-medium text-primary/80">real Gradescope screenshots</strong> (reference only — your
                course may look slightly different). Files load from{' '}
                <code className="rounded bg-primary/5 px-1 py-0.5 text-[11px] font-mono text-primary/70">/gradescope/examples/</code>.
              </p>
              <ol className="list-decimal space-y-2 pl-4 text-[13px] leading-relaxed text-primary/80 font-serif marker:font-sans marker:text-primary/50">
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
              <p className="text-[12px] text-primary/60 font-serif leading-relaxed">
                Regrade works with <strong className="font-medium text-primary/80">any graded PDF or clear photos</strong> — not only
                Gradescope. Your goal is the file or view that shows <strong className="font-medium text-primary/80">scores, rubric, and
                instructor comments</strong> together. If you only have a link, open it in a browser, then use{' '}
                <strong className="font-medium text-primary/80">Save as PDF</strong> or <strong className="font-medium text-primary/80">Print → PDF</strong>{' '}
                on the page that shows the marks.
              </p>
              <div className="space-y-3 text-[12px] leading-relaxed text-primary/80 font-serif">
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
              <p className="text-[11px] text-primary/50 font-serif leading-relaxed">
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
            <p className="font-serif text-lg text-primary font-medium">Drop or choose PDF / photo</p>
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
                      {u.pdfStatus === 'done' && u.pdfText && (
                        <p className="text-[10px] text-secondary font-bold uppercase">
                          {u.pdfText.length.toLocaleString()} chars
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
              <p className="text-xs font-serif italic">{securityError}</p>
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
            {loading ? 'Analyzing…' : 'Analyze worksheet'}
            {!loading && <ICONS.ArrowRight className="opacity-70" size={18} />}
          </button>
        </div>
      </div>

      {/* Right Sidebar: Status */}
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-panel rounded-2xl p-8 space-y-8 sticky top-24">
          <h3 className="font-serif text-2xl text-primary">Your Checklist</h3>

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
                    <span className="text-lg font-serif font-bold text-primary">{pct}%</span>
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
            <p className="text-[11px] text-primary/80 font-medium leading-relaxed">
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
             <h4 className="font-serif text-2xl text-white leading-tight">Not sure what to include? Ask for help.</h4>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
