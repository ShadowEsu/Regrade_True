import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let workerConfigured = false;

function ensurePdfWorker() {
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    workerConfigured = true;
  }
}

export async function extractTextFromPdfFile(file: File): Promise<string> {
  ensurePdfWorker();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const parts: string[] = [];
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const t = (item as { str: string }).str;
      const tr = (item as { transform?: number[] }).transform;
      const y = tr?.[5];
      if (y != null && lastY != null && Math.abs(y - lastY) > 4) {
        parts.push('\n');
      }
      parts.push(t);
      if (y != null) lastY = y;
    }
    pageTexts.push(parts.join(' ').replace(/ +\n +/g, '\n').trim());
  }

  return pageTexts.join('\n\n').trim();
}
