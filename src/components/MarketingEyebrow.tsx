import type { ReactNode } from 'react';

/** Matches regradeapp.tech `.eyebrow` — mono label + pulsing dot */
export default function MarketingEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="rg-eyebrow">
      <span className="rg-eyebrow-dot" aria-hidden />
      {children}
    </span>
  );
}
