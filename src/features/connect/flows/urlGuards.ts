/**
 * Guards for student-entered platform addresses (Canvas base URL).
 * Client-side copy of the server-side SSRF rules: https only, a real public
 * hostname, no IP literals, no localhost or private names, no credentials,
 * no query string, default port only.
 */

const PRIVATE_HOST_PATTERN =
  /^(localhost|.*\.local|.*\.internal|.*\.lan|127\..*|10\..*|192\.168\..*|172\.(1[6-9]|2\d|3[01])\..*|0\..*|\[.*\])$/i;

const IP_LITERAL = /^\d{1,3}(\.\d{1,3}){3}$/;

export function normalizeCanvasBaseUrl(input: string): string | null {
  const trimmed = input.trim().replace(/\/+$/, '');
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== '443') return null;
  if (url.search || url.hash) return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes('.')) return null;
  if (IP_LITERAL.test(host)) return null;
  if (PRIVATE_HOST_PATTERN.test(host)) return null;
  return `https://${host}${url.pathname === '/' ? '' : url.pathname}`;
}

export function looksLikeCanvasToken(token: string): boolean {
  const t = token.trim();
  // Canvas tokens are long opaque strings; anything short is a paste mistake.
  return t.length >= 20 && !/\s/.test(t);
}

/** Throws when a URL would leak credential material in params. Test guard. */
export function assertNoSecretInUrl(url: string): void {
  const parsed = new URL(url);
  const banned = ['token', 'access_token', 'refresh_token', 'secret', 'password', 'code_verifier'];
  for (const key of banned) {
    if (parsed.searchParams.has(key)) {
      throw new Error(`Credential material must never appear in a URL: ${key}`);
    }
  }
}
