import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'lg', showTagline = false }) => {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl'
  };

  const taglineSizes = {
    sm: 'text-[7px]',
    md: 'text-[10px]',
    lg: 'text-[11px]',
    xl: 'text-[13px]'
  };

  const isCentered = !className.includes('text-left');

  return (
    <div className={`flex flex-col flex-1 items-center justify-center p-8 ${className}`}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-block"
      >
        <h1
          className={`font-serif ${sizes[size]} text-primary font-semibold tracking-[0.12em] mb-3 uppercase`}
        >
          Regrade
        </h1>
        <div className={`h-px w-20 bg-primary/20 mx-auto ${showTagline ? 'mb-4' : ''}`} />
      </motion.div>
      {showTagline && (
        <p
          className={`text-on-surface-variant font-sans font-light opacity-60 ${taglineSizes[size]} uppercase tracking-[0.35em] text-center`}
        >
          Secure Academic Advocacy Portal
        </p>
      )}
    </div>
  );
};

export default Logo;
