import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sha = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
const checks = [
  ['Client TypeScript', 'npm', ['run', 'lint']],
  ['Client tests', 'npm', ['test']],
  ['Client production build', 'npm', ['run', 'build']],
  ['Server TypeScript', 'npm', ['--prefix', 'server', 'run', 'lint']],
  ['Server tests', 'npm', ['--prefix', 'server', 'test']],
  ['Server production build', 'npm', ['--prefix', 'server', 'run', 'build']],
  ['API health smoke', 'node', ['scripts/api-health-smoke.mjs']],
  ['Client production dependency audit', 'npm', ['audit', '--omit=dev', '--audit-level=high']],
  ['Server production dependency audit', 'npm', ['--prefix', 'server', 'audit', '--omit=dev', '--audit-level=high']],
  ['Secret and personal-path scan', 'bash', ['scripts/check-secrets.sh']],
  ['Test-mode billing guard', 'node', ['scripts/check-test-billing.mjs']],
  ['Release contracts', 'node', ['scripts/check-release-contracts.mjs']],
  ['Capacitor sync', 'npm', ['run', 'cap:sync']],
];

const java = spawnSync('java', ['-version'], { encoding: 'utf8' });
if (java.status === 0) {
  checks.push(['Firebase emulator isolation tests', 'npm', ['run', 'test:firebase-rules']]);
}

const results = [];
for (const [name, command, args] of checks) {
  const startedAt = Date.now();
  console.log(`\n[verify:beta] ${name}`);
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const passed = result.status === 0;
  results.push({ name, status: passed ? 'passed' : 'failed', durationMs: Date.now() - startedAt });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (!passed) break;
}

if (java.status !== 0) results.push({
  name: 'Firebase emulator isolation tests',
  status: 'blocked',
  blocker: 'Java runtime is not installed.',
});

const failed = results.some((result) => result.status === 'failed');
const outputDir = resolve('artifacts');
mkdirSync(outputDir, { recursive: true });
const report = { generatedAt: new Date().toISOString(), gitSha: sha, passed: !failed, results };
writeFileSync(resolve(outputDir, 'verify-beta.json'), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(resolve(outputDir, 'verify-beta.md'), [
  '# Regrade beta verification',
  '',
  `- Git SHA: \`${sha}\``,
  `- Result: **${failed ? 'FAILED' : 'CORE CHECKS PASSED'}**`,
  '',
  '| Check | Status |',
  '|---|---|',
  ...results.map((result) => `| ${result.name} | ${result.status}${result.blocker ? ` — ${result.blocker}` : ''} |`),
  '',
  '> A passing credential-free verifier does not certify live Firebase, OAuth, billing, push, store, or real-device flows.',
  '',
].join('\n'));

console.log(`\nReports: ${resolve(outputDir, 'verify-beta.json')} and ${resolve(outputDir, 'verify-beta.md')}`);
process.exit(failed ? 1 : 0);
