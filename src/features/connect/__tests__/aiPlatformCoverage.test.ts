import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLATFORMS } from '../registry';
import { PLATFORM_READING_GUIDE } from '../../../../shared/platformReadingGuide';
import { ANALYTICAL_SYSTEM_PROMPT } from '../../../../shared/analyticalSystemPrompt';

const PROMPT_NAME: Partial<Record<(typeof PLATFORMS)[number]['platformId'], string>> = {
  teams_assignments: 'teams',
  brightspace: 'brightspace',
};

describe('AI platform reading coverage', () => {
  it('names every connector in the platform guide or analytical prompt', () => {
    const instructions = `${PLATFORM_READING_GUIDE}\n${ANALYTICAL_SYSTEM_PROMPT}`.toLowerCase();
    const missing = PLATFORMS.filter((platform) => {
      const expected = PROMPT_NAME[platform.platformId] ?? platform.platformId;
      return !instructions.includes(expected.toLowerCase());
    }).map((platform) => platform.platformId);

    expect(missing).toEqual([]);
  });

  it('keeps teacher attribution, uncertain handwriting, and exam-only study safeguards', () => {
    expect(PLATFORM_READING_GUIDE).toContain('UNIVERSAL COMMENT ATTRIBUTION');
    expect(PLATFORM_READING_GUIDE).toContain('student answer, teacher/grader annotation, platform UI text');
    expect(ANALYTICAL_SYSTEM_PROMPT).toContain('If one character or number is unclear, do not guess');
    expect(ANALYTICAL_SYSTEM_PROMPT).toContain('Study focus areas must come only from marked exam evidence');
    expect(ANALYTICAL_SYSTEM_PROMPT).toContain('A single mistake creates a review item, not a recurring pattern');
  });

  it('keeps the deployed server prompts byte-identical to their source mirrors', () => {
    const serverGuide = readFileSync('server/src/shared/platformReadingGuide.ts', 'utf8');
    const serverPrompt = readFileSync('server/src/shared/analyticalSystemPrompt.ts', 'utf8');
    const sharedGuide = readFileSync('shared/platformReadingGuide.ts', 'utf8');
    const sharedPrompt = readFileSync('shared/analyticalSystemPrompt.ts', 'utf8');

    expect(serverGuide).toBe(sharedGuide);
    expect(serverPrompt).toBe(sharedPrompt);
  });
});
