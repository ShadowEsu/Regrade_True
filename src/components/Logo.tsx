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

/** Wordmark height in px (width scales automatically). */
const HEIGHT_PX: Record<NonNullable<LogoProps['size']>, number> = {
  xs: 22,
  sm: 28,
  md: 34,
  lg: 52,
  xl: 72,
};

const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'lg',
  showTagline = false,
  compact = false,
}) => {
  const height = HEIGHT_PX[size];
  const isLeft = className.includes('text-left') || className.includes('!text-left');

  return (
    <div
      className={`flex flex-col ${isLeft ? 'items-start' : 'items-center'} ${
        compact ? 'p-0' : 'p-2 sm:p-4'
      } ${className}`}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="inline-flex"
      >
        <img
          src={BRAND_LOGO_SRC}
          alt={BRAND_NAME}
          height={height}
          className="w-auto h-auto object-contain object-left"
          style={{ height, width: 'auto', maxWidth: 'min(100%, 280px)' }}
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
