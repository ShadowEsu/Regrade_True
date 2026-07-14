const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

const isDev = !app.isPackaged;
const API_PORT = Number(process.env.REGRADE_API_PORT || 8787);
const API_HOST = process.env.REGRADE_API_HOST || '127.0.0.1';
const SHELL_PORT = Number(process.env.REGRADE_SHELL_PORT || 3210);

let mainWindow = null;
let shellServer = null;
let apiChild = null;

function distDir() {
  if (isDev) {
    return path.join(__dirname, '..', 'dist');
  }
  return path.join(process.resourcesPath, 'app-dist');
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.mjs': 'text/javascript; charset=utf-8',
    '.map': 'application/json',
  };
  return map[ext] || 'application/octet-stream';
}

function proxyApi(req, res) {
  const targetPath = req.url.replace(/^\/api/, '') || '/';
  const headers = { ...req.headers, host: `${API_HOST}:${API_PORT}` };
  const upstream = http.request(
    {
      hostname: API_HOST,
      port: API_PORT,
      path: targetPath,
      method: req.method,
      headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstream.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Regrade API is not running on port ' + API_PORT }));
  });
  req.pipe(upstream);
}

function startShellServer() {
  const root = distDir();
  return new Promise((resolve, reject) => {
    shellServer = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/api' || urlPath.startsWith('/api/')) {
        proxyApi(req, res);
        return;
      }
      const safePath = urlPath === '/' ? '/index.html' : urlPath;
      const filePath = path.normalize(path.join(root, safePath));
      if (!filePath.startsWith(root)) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          fs.readFile(path.join(root, 'index.html'), (spaErr, spaData) => {
            if (spaErr) {
              res.writeHead(404).end('Not found');
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(spaData);
          });
          return;
        }
        res.writeHead(200, { 'Content-Type': contentType(filePath) });
        res.end(data);
      });
    });
    shellServer.once('error', reject);
    shellServer.listen(SHELL_PORT, 'localhost', () => {
      resolve(`http://localhost:${SHELL_PORT}`);
    });
  });
}

function maybeStartApi() {
  // Packaged desktop apps proxy /api to a local or hosted Express process.
  // Keep the API outside the DMG so Gemini/Firebase Admin secrets are not shipped.
  if (process.env.REGRADE_SKIP_EMBEDDED_API === '1') return;
  const serverDir = path.join(process.resourcesPath, 'server');
  const entry = path.join(serverDir, 'dist', 'index.js');
  if (!fs.existsSync(entry)) {
    console.warn('[regrade-desktop] Start the API with: npm run dev:api (port ' + API_PORT + ')');
    return;
  }
  apiChild = spawn(process.execPath, [entry], {
    cwd: serverDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: String(API_PORT),
    },
    stdio: 'inherit',
  });
  apiChild.on('exit', (code) => {
    console.warn('[regrade-desktop] embedded API exited', code);
    apiChild = null;
  });
}

async function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.cjs');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'Regrade',
    backgroundColor: '#f5f5f7',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    let host = '';
    try {
      host = new URL(url).hostname;
    } catch {
      host = '';
    }
    const oauthHost =
      host === 'accounts.google.com' ||
      host.endsWith('.google.com') ||
      host.endsWith('.firebaseapp.com') ||
      host.endsWith('.googleapis.com') ||
      host === 'appleid.apple.com' ||
      host.endsWith('.apple.com');

    // Firebase Google/Apple signInWithPopup needs a real child window.
    // Opening every link externally breaks the opener handshake and hangs auth.
    if (oauthHost) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 520,
          height: 720,
          autoHideMenuBar: true,
          title: 'Sign in',
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
          },
        },
      };
    }

    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    await mainWindow.loadURL(process.env.REGRADE_DEV_URL || 'http://localhost:3000');
    if (process.env.REGRADE_OPEN_DEVTOOLS === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    return;
  }

  maybeStartApi();
  const shellUrl = await startShellServer();
  await mainWindow.loadURL(shellUrl);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (shellServer) {
    shellServer.close();
    shellServer = null;
  }
  if (apiChild) {
    apiChild.kill();
    apiChild = null;
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch((err) => {
      console.error(err);
      app.quit();
    });
  }
});

app.on('before-quit', () => {
  if (apiChild) {
    apiChild.kill();
    apiChild = null;
  }
});
