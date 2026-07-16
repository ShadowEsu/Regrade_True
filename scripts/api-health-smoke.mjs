import { spawn } from 'node:child_process';

const child = spawn(process.execPath, ['server/dist/index.js'], {
  env: { ...process.env, NODE_ENV: 'development', PORT: '18787' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let stderr = '';
child.stderr.on('data', (chunk) => { stderr += String(chunk); });

try {
  let response;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      response = await fetch('http://127.0.0.1:18787/health');
      if (response.ok) break;
    } catch { /* server is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!response?.ok) throw new Error(stderr.trim() || 'API did not become healthy.');
  const body = await response.json();
  if (body?.ok !== true) throw new Error('Health endpoint returned an unexpected body.');
  console.log('API health smoke passed.');
} finally {
  child.kill('SIGTERM');
}
