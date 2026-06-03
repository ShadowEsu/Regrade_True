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
  sm: 48,
  md: 64,
  lg: 80,
  xl: 112,
  hero: 144,
};

/** Header wordmark — scales up aggressively on larger screens */
const NAV_HEIGHT_CLASS =
  'h-14 sm:h-16 md:h-[5.5rem] lg:h-[6.5rem] max-w-[min(100%,24rem)] sm:max-w-[min(100%,28rem)] md:max-w-[min(100%,34rem)] lg:max-w-[min(100%,40rem)]';

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
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="inline-flex max-w-full"
      >
        <img
          src={BRAND_LOGO_SRC}
          alt={BRAND_NAME}
          height={height}
          className={`w-auto object-contain object-left ${
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
