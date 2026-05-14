import {Component, StrictMode, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AuthGate from './AuthGate.tsx';
import './index.css';

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
        <AuthGate>
          <App />
        </AuthGate>
      </BootErrorBoundary>
    </StrictMode>,
  );
} catch (err) {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err);
  el.innerHTML =
    `<div style="padding:24px;font-family:system-ui,sans-serif"><h1 style="color:#b00020">Could not render Regrade</h1><pre style="white-space:pre-wrap">${msg}</pre></div>`;
  console.error(err);
}
