import { apiFetch } from '../lib/api';

export async function reportAiResponse(responseText: string): Promise<void> {
  const response = await apiFetch('/v1/ai-feedback', {
    method: 'POST',
    body: JSON.stringify({ reason: 'inappropriate_or_inaccurate', excerpt: responseText.slice(0, 500) }),
  });
  if (!response.ok) throw new Error('The report could not be sent.');
}
