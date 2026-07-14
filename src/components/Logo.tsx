import React from 'react';
import { motion } from 'motion/react';
import { BRAND_LOGO_SRC, BRAND_NAME } from '../branding';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'nav';
  showTagline?: boolean;
  compact?: boolean;
}

const HEIGHT_PX: Record<Exclude<NonNullable<LogoProps['size']>, 'nav'>, number> = {
  xs: 36,
  sm: 44,
  md: 56,
  lg: 72,
  xl: 96,
  hero: 128,
};

/** Header mark — square brand symbol */
const NAV_HEIGHT_CLASS = 'h-10 sm:h-11 md:h-12 lg:h-14 w-auto';

const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'lg',
  showTagline = false,
  compact = false,
}) => {
  const isNav = size === 'nav';
  const height = isNav ? undefined : HEIGHT_PX[size];
  const isLeft = className.includes('text-left') || className.includes('!text-left');

  return (
    <div
      className={`flex flex-col ${isLeft ? 'items-start' : 'items-center'} ${
        compact ? 'p-0' : 'p-2 sm:p-4'
      } ${className}`}
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="inline-flex max-w-full"
      >
        <img
          src={BRAND_LOGO_SRC}
          alt={BRAND_NAME}
          height={height}
          className={`rg-brand-wordmark w-auto object-contain object-left ${
            isNav ? NAV_HEIGHT_CLASS : 'h-auto max-w-[min(100%,40rem)]'
          }`}
          style={
            isNav
              ? { width: 'auto' }
              : { height, width: 'auto', maxWidth: 'min(100%, 40rem)' }
          }
          draggable={false}
        />
      </motion.div>
      {showTagline && (
        <p
          className={`mt-4 text-on-surface-variant font-sans font-semibold opacity-70 text-xs sm:text-sm uppercase tracking-[0.35em] ${
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
