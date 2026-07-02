export type InlineImagePayload = { mimeType: string; data: string };

/** Types both vision models (Gemini + Claude) accept as-is. */
const PASSTHROUGH_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Longest edge after re-encode — plenty for reading rubric text and marks. */
const MAX_DIMENSION = 1600;

/**
 * Above this size we re-encode even passthrough types. Keeps 12 staged
 * images safely under the server's 25 MB JSON body limit (base64 is 4/3×).
 */
const REENCODE_AT_BYTES = 1.5 * 1024 * 1024;

const JPEG_QUALITY = 0.85;

const EXTENSION_MIMES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
};

function mimeFromFile(file: File): string {
  const typed = file.type.trim().toLowerCase();
  if (typed) return typed;
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  return EXTENSION_MIMES[ext] ?? 'image/jpeg';
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Prepare an image file for the analysis API.
 *
 * Re-encodes to a downscaled JPEG when the file is large or in a format the
 * AI readers don't accept directly (iPhone HEIC is the common case — Safari
 * decodes it natively, so the canvas round-trip converts it). If the browser
 * can't decode the file, falls back to the original bytes with the best mime
 * type we can determine — Gemini still reads HEIC/HEIF server-side.
 */
export async function imageFileToInlinePayload(file: File): Promise<InlineImagePayload> {
  const mime = mimeFromFile(file);
  const needsReencode = !PASSTHROUGH_MIMES.has(mime) || file.size > REENCODE_AT_BYTES;

  if (needsReencode && typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const base64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
        if (base64) return { mimeType: 'image/jpeg', data: base64 };
      } else {
        bitmap.close();
      }
    } catch {
      // Browser can't decode this format — fall through to raw bytes.
    }
  }

  return { mimeType: mime, data: await blobToBase64(file) };
}
