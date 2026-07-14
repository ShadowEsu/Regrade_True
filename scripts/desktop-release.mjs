#!/usr/bin/env node
/**
 * Build signed-ready (or unsigned beta) Regrade desktop installers for v1.
 *
 * Bakes the production API into the Vite bundle so packaged apps talk to
 * https://api.regradeapp.tech (override with REGRADE_API_BASE_URL).
 *
 * Usage:
 *   node scripts/desktop-release.mjs              # mac + win
 *   node scripts/desktop-release.mjs --mac-only
 *   node scripts/desktop-release.mjs --win-only
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const macOnly = args.has('--mac-only');
const winOnly = args.has('--win-only');

const apiBase =
  process.env.REGRADE_API_BASE_URL?.trim() ||
  process.env.VITE_API_BASE_URL?.trim() ||
  'https://api.regradeapp.tech';

const env = {
  ...process.env,
  VITE_DESKTOP_SHELL: 'true',
  VITE_API_BASE_URL: apiBase,
  CSC_IDENTITY_AUTO_DISCOVERY: process.env.CSC_IDENTITY_AUTO_DISCOVERY || 'false',
  ELECTRON_CACHE: process.env.ELECTRON_CACHE || '/tmp/regrade-electron-cache',
  ELECTRON_BUILDER_CACHE: process.env.ELECTRON_BUILDER_CACHE || '/tmp/regrade-eb-cache',
};

function run(command, commandArgs) {
  console.log(`\n> ${command} ${commandArgs.join(' ')}`);
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Regrade desktop release`);
console.log(`API baked in: ${apiBase}`);

run('npm', ['run', 'build:desktop']);

const builderArgs = [];
if (!winOnly) builderArgs.push('--mac', 'dmg', 'zip', '--arm64', '--x64');
if (!macOnly) builderArgs.push('--win', 'nsis', '--x64');
if (builderArgs.length === 0) {
  console.error('Nothing to build');
  process.exit(1);
}

run('npx', ['electron-builder', ...builderArgs]);

const releaseDir = path.join(root, 'release');
if (existsSync(releaseDir)) {
  console.log(`\nInstallers written under ${releaseDir}`);
  console.log('Expected artifacts:');
  console.log('  release/Regrade-1.0.0-arm64.dmg');
  console.log('  release/Regrade-1.0.0-x64.dmg');
  console.log('  release/Regrade-Setup-1.0.0.exe');
}
