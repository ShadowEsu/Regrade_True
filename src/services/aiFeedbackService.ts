import { apiFetch } from '../lib/api';
import { isPreviewMode } from '../lib/previewMode';

export async function reportAiResponse(responseText: string): Promise<void> {
  if (isPreviewMode()) return;
  const response = await apiFetch('/v1/ai-feedback', {
    method: 'POST',
    body: JSON.stringify({ reason: 'inappropriate_or_inaccurate', excerpt: responseText.slice(0, 500) }),
  });
  if (!response.ok) throw new Error('The report could not be sent.');
}
