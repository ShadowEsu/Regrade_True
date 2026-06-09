import { motion } from 'motion/react';
import { COACH_WHALE_SRC } from '../branding';

const ASPECT = 726 / 1024;

export default function CoachWhale({
  size = 96,
  animate = true,
  className = '',
}: {
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  const img = (
    <img
      src={COACH_WHALE_SRC}
      alt=""
      width={size}
      height={Math.round(size * ASPECT)}
      className={`rg-pixel-mascot object-contain ${className}`}
      draggable={false}
    />
  );

  if (!animate) {
    return <div className="shrink-0">{img}</div>;
  }

  return (
    <motion.div
      className="shrink-0"
      initial={{ opacity: 0, y: 10, scale: 0.92 }}
      animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
      transition={{
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
        y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.35 },
      }}
    >
      {img}
    </motion.div>
  );
}
