import DOMPurify from 'dompurify';

/** Strip HTML/scripts from user-authored text before storage or API calls. */
export function sanitizeUserText(input: string, maxLen = 500_000): string {
  const cleaned = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return cleaned.slice(0, maxLen);
}
