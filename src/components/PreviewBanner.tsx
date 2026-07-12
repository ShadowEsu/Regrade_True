import { isPreviewMode } from '../lib/previewMode';

export default function PreviewBanner() {
  if (!isPreviewMode()) return null;

  const query = new URLSearchParams(window.location.search);
  const active = query.has('splash') ? 'splash' : query.has('signin') ? 'signin' : query.has('onboarding') ? 'onboarding' : 'app';
  const openPreview = (mode: 'splash' | 'signin' | 'onboarding' | 'app') => {
    const url = new URL(window.location.href);
    url.search = '';
    if (mode !== 'app') url.searchParams.set(mode, '1');
    window.location.assign(url.toString());
  };

  return (
    <div
      role="navigation"
      aria-label="Preview screens"
      className="rg-preview-toolbar"
    >
      <span className="rg-preview-label">Preview</span>
      <button type="button" className={active === 'splash' ? 'is-active' : ''} onClick={() => openPreview('splash')} aria-current={active === 'splash' ? 'page' : undefined}>Loading</button>
      <button type="button" className={active === 'signin' ? 'is-active' : ''} onClick={() => openPreview('signin')} aria-current={active === 'signin' ? 'page' : undefined}>Welcome</button>
      <button type="button" className={active === 'onboarding' ? 'is-active' : ''} onClick={() => openPreview('onboarding')} aria-current={active === 'onboarding' ? 'page' : undefined}>Survey</button>
      <button type="button" className="rg-preview-app-link" onClick={() => openPreview('app')}>App</button>
    </div>
  );
}
