import { motion, useReducedMotion } from 'motion/react';
import { COACH_WHALE_SRC } from '../branding';

const ASPECT = 1;
export type WhaleState = 'idle' | 'listening' | 'thinking' | 'explaining' | 'success' | 'warning';

export default function CoachWhale({
  size = 96,
  animate = true,
  className = '',
  state = 'idle',
}: {
  size?: number;
  animate?: boolean;
  className?: string;
  state?: WhaleState;
}) {
  const reduceMotion = useReducedMotion();

  const img = (
    <img
      src={COACH_WHALE_SRC}
      alt=""
      width={size}
      height={Math.round(size * ASPECT)}
      className={`rg-coach-whale-img rg-pixel-mascot object-contain ${className}`}
      draggable={false}
    />
  );

  if (!animate || reduceMotion) {
    return (
      <div data-state={state} className={`rg-coach-whale-wrap ${size <= 48 ? 'rg-coach-whale-wrap-sm' : ''} shrink-0`}>
        {img}
      </div>
    );
  }

  return (
    <motion.div
      data-state={state}
      className={`rg-coach-whale-wrap ${size <= 48 ? 'rg-coach-whale-wrap-sm' : ''} shrink-0`}
      initial={{ y: 8, scale: 0.96 }}
      animate={{ y: [0, -6, 0], scale: 1 }}
      transition={{
        scale: { duration: 0.35, ease: 'easeOut' },
        y: { duration: state === 'thinking' ? 1.7 : 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 },
      }}
    >
      {img}
    </motion.div>
  );
}
