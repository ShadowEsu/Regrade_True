/** Classic “duplicate page” glyph (two stacked documents) — reads clearly as Copy at small sizes */

export function CopyIcon({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect x="8.5" y="8.5" width="12" height="12" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M7.5 15.5H6.5c-1.1 0-2-.9-2-2v-9c0-1.1.9-2 2-2h9c1.1 0 2 .9 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
