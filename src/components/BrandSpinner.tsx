import { BRAND_LOGO_SRC, BRAND_NAME } from '../branding';

export default function BrandSpinner({ size = 40 }: { size?: number }) {
  return (
    <img
      src={BRAND_LOGO_SRC}
      alt={`${BRAND_NAME} loading`}
      height={size}
      className="w-auto animate-pulse object-contain"
      style={{ height: size, width: 'auto' }}
      draggable={false}
    />
  );
}
