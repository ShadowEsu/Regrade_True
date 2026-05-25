import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let workerConfigured = false;

function ensurePdfWorker() {
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    workerConfigured = true;
  }
}

export type InlineImagePayload = { mimeType: string; data: string };

const MAX_RENDER_WIDTH = 1400;
const JPEG_QUALITY = 0.78;

/**
 * Render PDF pages to JPEG base64 so vision models read scans, platform
 * overlays (Gradescope bubbles, Canvas pins, Turnitin QuickMarks), and handwriting.
 */
export async function renderPdfPagesToInlineImages(
  file: File,
  maxPages: number,
): Promise<InlineImagePayload[]> {
  if (maxPages <= 0) return [];
  ensurePdfWorker();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pageCount = Math.min(pdf.numPages, maxPages);
  const out: InlineImagePayload[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(2, MAX_RENDER_WIDTH / baseViewport.width);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const base64 = dataUrl.split(',')[1];
    if (base64) {
      out.push({ mimeType: 'image/jpeg', data: base64 });
    }
  }

  return out;
}

/** How many pages to send for vision for one PDF file. */
export function pdfVisionPageBudget(
  extractedTextLength: number,
  remainingSlots: number,
  pdfCount: number,
): number {
  if (remainingSlots <= 0) return 0;
  const thinText = extractedTextLength < 300;
  const perFile = Math.max(2, Math.floor(remainingSlots / Math.max(1, pdfCount)));
  const cap = thinText ? 8 : 6;
  return Math.min(cap, perFile, remainingSlots);
}
