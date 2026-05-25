/** Keep in sync with server inline image caps and JSON body budget. */
export const MAX_UPLOAD_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_STAGED_UPLOAD_FILES = 12;
export const MAX_INLINE_IMAGES_TO_API = 12;

const BLOCKED_IMAGE_MIMES = new Set(["image/svg+xml", "image/svg"]);

export function isBlockedImageType(file: File): boolean {
  const t = file.type.trim().toLowerCase();
  if (BLOCKED_IMAGE_MIMES.has(t)) return true;
  return /\.svgz?$/i.test(file.name);
}

export function isAllowedUploadFile(file: File): boolean {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/") && !isBlockedImageType(file);
  return isPdf || isImage;
}

export function formatMaxUploadSize(): string {
  return `${Math.round(MAX_UPLOAD_FILE_BYTES / (1024 * 1024))} MB`;
}
