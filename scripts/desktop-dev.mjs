import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const children = [];

function run(command, args, label) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  child.on('exit', (code, signal) => {
    if (signal) return;
    if (code && code !== 0) {
      console.error(`[desktop] ${label} exited with code ${code}`);
      shutdown(code);
    }
  });
  children.push(child);
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

run('npm', ['--prefix', 'server', 'run', 'dev'], 'api');
run('npm', ['run', 'dev'], 'vite');

const waitThenElectron = spawn(
  process.execPath,
  [
    '-e',
    `
const http = require('http');
const { spawn } = require('child_process');
const deadline = Date.now() + 60000;
function ping() {
  const req = http.get('http://127.0.0.1:3000', (res) => {
    res.resume();
    const child = spawn('npx', ['electron', '.'], {
      cwd: ${JSON.stringify(root)},
      stdio: 'inherit',
      env: { ...process.env, REGRADE_SKIP_EMBEDDED_API: '1' },
      shell: process.platform === 'win32',
    });
    child.on('exit', (code) => process.exit(code || 0));
  });
  req.on('error', () => {
    if (Date.now() > deadline) {
      console.error('[desktop] Vite did not become ready on :3000');
      process.exit(1);
    }
    setTimeout(ping, 500);
  });
}
ping();
`,
  ],
  { cwd: root, stdio: 'inherit' },
);
children.push(waitThenElectron);
waitThenElectron.on('exit', (code) => shutdown(code || 0));
