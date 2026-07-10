import { z } from "zod";

/** Images sent to vision — block SVG/HTML disguised as images. */
export const ALLOWED_INLINE_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif"
]);

/** ~6 MB decoded per inline image (base64 expands ~4/3). */
export const MAX_INLINE_IMAGE_BASE64_CHARS = 4_000_000;

export function isAllowedInlineImageMime(mimeType: string): boolean {
  const m = mimeType.trim().toLowerCase();
  return ALLOWED_INLINE_IMAGE_MIMES.has(m);
}

export function isPreviewOrFakeFirebaseToken(token: string): boolean {
  const t = token.trim();
  return t === "preview-id-token" || t.startsWith("preview-");
}

export const InlineImageSchema = z
  .object({
    mimeType: z.string().min(3).max(120),
    data: z.string().min(1).max(MAX_INLINE_IMAGE_BASE64_CHARS)
  })
  .superRefine((img, ctx) => {
    if (!isAllowedInlineImageMime(img.mimeType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unsupported image type. Use JPEG, PNG, or WebP."
      });
    }
    if (!/^[A-Za-z0-9+/=]+$/.test(img.data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Image data must be base64-encoded."
      });
    }
  });
