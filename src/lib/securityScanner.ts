import { apiFetch } from './api';

export interface SecurityScanResult {
  isSafe: boolean;
  threatLevel: 'low' | 'medium' | 'high';
  detectedPatterns: string[];
  recommendation: string;
}

/** Large PDF extracts: regex-only pre-check; skip extra LLM round-trip (avoids limits / failures). */
const APPEAL_REGEX_ONLY_AT_CHARS = 24_000;

// Regex-based first-pass check — fast, no API call needed for obvious patterns.
function regexCheck(content: string): boolean {
  const dangerPatterns = [
    /<script[\s>]/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror= etc.
    /;\s*drop\s+table/i,
    /'\s*or\s+'\d+'\s*=\s*'\d+/i,
    /union\s+select/i,
    /exec\s*\(/i,
  ];
  return !dangerPatterns.some((p) => p.test(content));
}

export async function scanContentForThreats(
  content: string,
  context: 'profile' | 'appeal',
): Promise<SecurityScanResult> {
  const sliceForRegex =
    content.length > 80_000 ? `${content.slice(0, 72_000)}\n…\n${content.slice(-8_000)}` : content;

  if (!regexCheck(sliceForRegex)) {
    return {
      isSafe: false,
      threatLevel: 'high',
      detectedPatterns: ['Potentially unsafe pattern detected'],
      recommendation:
        'Your input contains characters or patterns that are not allowed. Please remove any HTML, scripts, or special syntax and try again.',
    };
  }

  if (context === 'appeal' && content.length >= APPEAL_REGEX_ONLY_AT_CHARS) {
    return {
      isSafe: true,
      threatLevel: 'low',
      detectedPatterns: [],
      recommendation: 'Safe to proceed.',
    };
  }

  try {
    const res = await apiFetch('/v1/gemini/security-scan', {
      method: 'POST',
      body: JSON.stringify({ content, context }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json() as Promise<SecurityScanResult>;
  } catch (error) {
    console.error('Security scan error:', error);
    const errText = error instanceof Error ? error.message : String(error);
    const keyIssue = /API key|401|403|PERMISSION_DENIED|invalid/i.test(errText);
    const quotaIssue = /429|RESOURCE_EXHAUSTED|quota|rate/i.test(errText);

    if (context === 'appeal' && regexCheck(sliceForRegex)) {
      console.warn('Security scan: API failed; appeal allowed after regex-only fallback.', errText);
      return {
        isSafe: true,
        threatLevel: 'low',
        detectedPatterns: ['llm-scan-skipped'],
        recommendation: 'Safe to proceed.',
      };
    }

    return {
      isSafe: false,
      threatLevel: 'medium',
      detectedPatterns: ['Security scan unavailable'],
      recommendation: keyIssue
        ? 'The analysis service is not configured or rejected the request. Ask the administrator to set GEMINI_API_KEY on the API server.'
        : quotaIssue
          ? 'The AI service is busy or rate-limited. Wait a minute and try again.'
          : 'We could not verify your input right now. Please try again in a moment.',
    };
  }
}
