/**
 * Matches the pre-boot splash in index.html so the transition from HTML load
 * to React load is invisible. Same mark, same pulse, same background.
 */
export default function BootSplash({ label }: { label?: string }) {
  return (
    <div className="rg-boot" role="status" aria-label={label ?? 'Loading Regrade'}>
      <div className="rg-boot-mark" aria-hidden="true">
        <span className="rg-boot-mark-inner">R</span>
        <span className="rg-boot-dot" />
      </div>
      <p className="rg-boot-name">{label ?? 'Regrade'}</p>
    </div>
  );
}
