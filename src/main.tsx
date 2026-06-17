import {Component, StrictMode, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AuthGate from './AuthGate.tsx';
import { bootstrapTheme } from './lib/theme';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

bootstrapTheme();

class BootErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  declare props: {children: ReactNode};
  state: {error: Error | null} = {error: null};

  static getDerivedStateFromError(error: Error) {
    return {error};
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 720}}>
          <h1 style={{color: '#b00020', fontSize: 18, margin: '0 0 12px'}}>Regrade hit a runtime error</h1>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: '#f6f6f6',
              padding: 12,
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            {this.state.error.stack ?? this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const el = document.getElementById('root');
if (!el) {
  throw new Error('Missing #root element');
}

try {
  createRoot(el).render(
    <StrictMode>
      <BootErrorBoundary>
        <ThemeProvider>
          <AuthGate>
            <App />
          </AuthGate>
        </ThemeProvider>
      </BootErrorBoundary>
    </StrictMode>,
  );
} catch (err) {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err);
  const wrap = document.createElement('div');
  wrap.style.cssText = 'padding:24px;font-family:system-ui,sans-serif;max-width:720px';
  const title = document.createElement('h1');
  title.style.cssText = 'color:#b00020;font-size:18px;margin:0 0 12px';
  title.textContent = 'Could not render Regrade';
  const pre = document.createElement('pre');
  pre.style.cssText = 'white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:8px;font-size:12px';
  pre.textContent = msg;
  wrap.append(title, pre);
  el.replaceChildren(wrap);
  console.error(err);
}
