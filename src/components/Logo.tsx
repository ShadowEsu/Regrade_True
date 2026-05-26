import React from 'react';
import { motion } from 'motion/react';
import { BRAND_LOGO_SRC, BRAND_NAME } from '../branding';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  /** Tighter padding for nav header */
  compact?: boolean;
}

const SIZE_PX: Record<NonNullable<LogoProps['size']>, number> = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 72,
  xl: 112,
};

const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'lg',
  showTagline = false,
  compact = false,
}) => {
  const px = SIZE_PX[size];
  const isLeft = className.includes('text-left') || className.includes('!text-left');

  return (
    <div
      className={`flex flex-col ${isLeft ? 'items-start' : 'items-center'} ${
        compact ? 'p-0' : 'p-2 sm:p-4'
      } ${className}`}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="inline-flex"
      >
        <img
          src={BRAND_LOGO_SRC}
          alt={BRAND_NAME}
          width={px}
          height={px}
          className="rounded-2xl shadow-[0_12px_40px_-18px_rgba(0,35,111,0.45)] object-contain"
          draggable={false}
        />
      </motion.div>
      {showTagline && (
        <p
          className={`mt-3 text-on-surface-variant font-sans font-semibold opacity-70 text-[10px] sm:text-[11px] uppercase tracking-[0.35em] ${
            isLeft ? 'text-left' : 'text-center'
          }`}
        >
          Secure Academic Advocacy Portal
        </p>
      )}
    </div>
  );
};

export default Logo;
