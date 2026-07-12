import { BRAND_ICON_SRC } from '../branding';

/**
 * Matches the pre-boot splash in index.html so the transition from HTML load
 * to React load is invisible. Same mark, same pulse, same background.
 */
export default function BootSplash({ label }: { label?: string }) {
  return (
    <div className="rg-boot" role="status" aria-label={label ?? 'Loading Regrade'}>
      <div className="rg-boot-mark" aria-hidden="true">
        <img src={BRAND_ICON_SRC} alt="" className="rg-boot-icon" draggable={false} />
      </div>
    </div>
  );
}
