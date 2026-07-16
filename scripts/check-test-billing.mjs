import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const candidates = ['.env', '.env.local', 'server/.env', 'server/.env.local'];
const livePatterns = [/\bsk_live_[A-Za-z0-9]+\b/, /\bpk_live_[A-Za-z0-9]+\b/];
const offenders = [];
for (const relative of candidates) {
  const path = resolve(relative);
  if (!existsSync(path)) continue;
  const content = readFileSync(path, 'utf8');
  if (livePatterns.some((pattern) => pattern.test(content))) offenders.push(relative);
}
if (offenders.length) {
  console.error(`Live Stripe credentials are not allowed during beta verification (${offenders.join(', ')}).`);
  process.exit(1);
}
console.log('No live Stripe credentials detected in active local environment files.');
